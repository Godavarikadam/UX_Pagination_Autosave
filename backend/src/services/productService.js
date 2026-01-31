const pool = require('../config/database');
const activityService = require('./activityService');
const compareValues = require('../utils/compareValues');


const getProducts = async (page, limit, search = "", sort = "id", sortOrder = "asc") => {
  const offset = (page - 1) * limit;
  
  let queryText = "SELECT * FROM products WHERE status = 'active'";
  let countText = "SELECT COUNT(*) FROM products WHERE status = 'active'";
  let queryParams = [];

  if (search && search.trim() !== "") {
    const searchPattern = `%${search.trim()}%`;
    
    const filter = ` AND (
      id::TEXT ILIKE $1 OR 
      name ILIKE $1 OR 
      category ILIKE $1 OR 
      unit_price::TEXT ILIKE $1 OR 
      quantity::TEXT ILIKE $1
    )`;
    
    queryText += filter;
    countText += filter;
    queryParams = [searchPattern];
  }

  const allowedSortFields = ["id", "name", "quantity", "unit_price"];
  const sortColumn = allowedSortFields.includes(sort) ? sort : "id";
  const direction = sortOrder.toLowerCase() === "desc" ? "DESC" : "ASC";
  
  queryText += ` ORDER BY ${sortColumn} ${direction}`;

  const nextParamIdx = queryParams.length;
  queryText += ` LIMIT $${nextParamIdx + 1} OFFSET $${nextParamIdx + 2}`;
  
  const productsResult = await pool.query(queryText, [...queryParams, limit, offset]);
  const countResult = await pool.query(countText, queryParams);

  return {
    items: productsResult.rows,
    total: Number(countResult.rows[0].count),
    page,
    limit,
  };
};


const updateProduct = async (id, updates, userId) => {
  const currentRes = await pool.query('SELECT * FROM products WHERE id=$1', [id]);
  if (!currentRes.rows[0]) throw new Error('Product not found');
  
  const oldProductState = { ...currentRes.rows[0] };
  
  // 🟢 CHANGE: Added 'status' to allowed fields so deleteProduct can pass it
  const ALLOWED_FIELDS = ['name', 'description', 'quantity', 'unit_price', 'category', 'status'];

  const safeUpdates = {};
  for (const key of ALLOWED_FIELDS) {
    if (key in updates) safeUpdates[key] = updates[key];
  }

  const changedFields = compareValues(oldProductState, safeUpdates);
  if (Object.keys(changedFields).length === 0) return oldProductState;

  const keys = Object.keys(changedFields);
  const values = Object.values(changedFields);
  const setClauses = keys.map((key, idx) => `${key}=$${idx + 1}`).join(', ');
  const updatedByIndex = values.length + 1;
  const idIndex = values.length + 2;
  values.push(userId ?? null);
  values.push(id);

  try {
    const result = await pool.query(
      `UPDATE products SET ${setClauses}, updated_at = NOW(), updated_by = $${updatedByIndex}
       WHERE id = $${idIndex} RETURNING *`,
      values
    );

    if (userId) {
      for (const field of keys) {
        await activityService.logActivity(
          'product', id, field, oldProductState[field], changedFields[field], userId, 'success'
        );
      }
    }
    return result.rows[0];

  } catch (err) {
    if (userId) {
      for (const field of keys) {
        await activityService.logActivity(
          'product', id, field, oldProductState[field], changedFields[field], userId, 'failed' 
        );
      }
    }
    throw err; 
  }
};

// const createProduct = async (data, userId) => {
//   // 🟢 1. FETCH CONFIGURATION FOR DEFAULTS
//   // We fetch the same rules used in the controller
//   const settingsRes = await pool.query(
//     "SELECT key, value FROM system_settings WHERE key IN ('min_product_qty', 'min_product_price')"
//   );
  
//   const config = {};
//   settingsRes.rows.forEach(row => config[row.key] = row.value);

//   // Define our dynamic defaults
//   const defaultQty = parseInt(config.min_product_qty) || 1;
//   const defaultPrice = parseFloat(config.min_product_price) || 1.00;

//   const result = await pool.query(
//     `INSERT INTO products (name, quantity, unit_price, description, category, updated_by)
//      VALUES ($1, $2, $3, $4, $5, $6)
//      RETURNING *`,
//     [
//       data.name || "New Product",
//       data.quantity ?? defaultQty,   // 🟢 Use Configurable Default
//       data.unit_price ?? defaultPrice, // 🟢 Use Configurable Default
//       data.description || "",
//       data.category || "",
//       userId,
//     ]
//   );

//   const newProduct = result.rows[0];
//   if (typeof activityService !== 'undefined') {
//     await activityService.logActivity(
//       'product', newProduct.id, 'creation', null, 'New product added', userId, 'success'
//     );
//   }
//   return newProduct;
// };

// Add userRole to the parameters
const createProduct = async (data, userId, userRole) => {
  const settingsRes = await pool.query(
    "SELECT key, value FROM system_settings WHERE key IN ('min_product_qty', 'min_product_price')"
  );
  
  const config = {};
  settingsRes.rows.forEach(row => config[row.key] = row.value);

  const defaultQty = parseInt(config.min_product_qty) || 1;
  const defaultPrice = parseFloat(config.min_product_price) || 1.00;

  const result = await pool.query(
    `INSERT INTO products (name, quantity, unit_price, description, category, updated_by)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      data.name || "New Product",
      data.quantity ?? defaultQty,
      data.unit_price ?? defaultPrice,
      data.description || "",
      data.category || "",
      userId,
    ]
  );

  const newProduct = result.rows[0];

  // 🟢 DYNAMIC LOGIC: Build the "Created By" string
  const actorDisplay = userRole === 'admin' ? 'Admin' : `User ID: ${userId}`;
  const logMessage = `New product added by ${actorDisplay}`;

  if (typeof activityService !== 'undefined') {
    await activityService.logActivity(
      'product', 
      newProduct.id, 
      'creation', 
      null, 
      logMessage, // 🟢 Use the new dynamic string here
      userId, 
      'success'
    );
  }
  return newProduct;
};

const deleteProduct = async (id, userId) => {
 
  return await updateProduct(id, { status: 'inactive' }, userId);
};


/** ---------------- BULK DELETE PRODUCTS (New) ---------------- */
const bulkDeleteProducts = async (ids, userId) => {
  // 1. Update status to 'inactive' for all IDs in the array
  // Use ANY($2::int[]) to handle the array of IDs in a single query
  const result = await pool.query(
    `UPDATE products 
     SET status = 'inactive', updated_at = NOW(), updated_by = $1 
     WHERE id = ANY($2::int[]) 
     RETURNING id`,
    [userId, ids]
  );

  // 2. Log activity for each successfully updated product
  if (result.rows.length > 0 && userId) {
    for (const id of ids) {
      await activityService.logActivity(
        'product', 
        id, 
        'status', 
        'active', 
        'inactive', 
        userId, 
        'success'
      );
    }
  }

  return result.rows;
};

module.exports = {
  getProducts,
  updateProduct,
  createProduct,
  deleteProduct,
  bulkDeleteProducts,
};