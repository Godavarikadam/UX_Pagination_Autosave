const pool = require('../config/database');
const activityService = require('./activityService');
const compareValues = require('../utils/compareValues');

const getProducts = async (page, limit, search = "", sort = "id", sortOrder = "asc") => {
  const offset = (page - 1) * limit;
  
  // 🟢 CHANGE 1: Use LEFT JOIN LATERAL to get the latest status and reason from activity_log
  let queryText = `
    SELECT 
      p.*, 
      al.status as current_request_status, 
      al.rejection_reason
    FROM products p
    LEFT JOIN LATERAL (
      SELECT status, rejection_reason 
      FROM activity_log 
      WHERE entity_id = p.id 
      ORDER BY created_at DESC 
      LIMIT 1
    ) al ON true
    WHERE p.status = 'active'`;

  let countText = "SELECT COUNT(*) FROM products p WHERE p.status = 'active'";
  let queryParams = [];

  if (search && search.trim() !== "") {
    const searchPattern = `%${search.trim()}%`;
    
    // 🟢 CHANGE 2: Ensure we use the 'p.' alias for product columns to avoid ambiguity
    const filter = ` AND (
      p.id::TEXT ILIKE $1 OR 
      p.name ILIKE $1 OR 
      p.category ILIKE $1 OR 
      p.unit_price::TEXT ILIKE $1 OR 
      p.quantity::TEXT ILIKE $1
    )`;
    
    queryText += filter;
    countText += filter;
    queryParams = [searchPattern];
  }

  const allowedSortFields = ["id", "name", "quantity", "unit_price"];
  const sortColumn = allowedSortFields.includes(sort) ? sort : "id";
  const direction = sortOrder.toLowerCase() === "desc" ? "DESC" : "ASC";
  
  // 🟢 CHANGE 3: Apply sorting to the product alias 'p'
  queryText += ` ORDER BY p.${sortColumn} ${direction}`;

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
  
  values.push(userId ?? null);
  values.push(id);

  try {
    const result = await pool.query(
      `UPDATE products SET ${setClauses}, updated_at = NOW(), updated_by = $${values.length - 1}
       WHERE id = $${values.length} RETURNING *`,
      values
    );

    if (userId) {
      for (const field of keys) {
        // 🟢 THE FIX: Use a smarter logging function that updates existing pending logs
        // instead of just creating new ones.
        await activityService.resolveOrLogActivity(
          'product', 
          id, 
          field, 
          oldProductState[field], 
          changedFields[field], 
          userId, 
          'success'
        );
      }
    }
    return result.rows[0];
  } catch (err) {
    // Handle error logging...
    throw err; 
  }
};

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

const updateFieldLogic = async (fieldId, fieldName, newLogic, userId) => {
  try {
    const currentField = await FieldModel.findById(fieldId);
    const oldLogic = currentField ? currentField.logic : 'None';

    // 🟢 FIX: Normalize both strings to remove hidden formatting differences
    // This replaces all Windows-style line endings (\r\n) with standard (\n)
    const normalizedOld = oldLogic.replace(/\r\n/g, "\n").trim();
    const normalizedNew = newLogic.replace(/\r\n/g, "\n").trim();

    if (normalizedOld === normalizedNew) return { success: true };

    await FieldModel.findByIdAndUpdate(fieldId, { logic: newLogic });

    // Deduplicate as discussed earlier
    await pool.query(
      `DELETE FROM activity_log WHERE entity_type = 'field' AND entity_id = $1`,
      [fieldId]
    );

    // 🟢 PASS THE CLEANED STRINGS: This ensures the diff engine sees only logic changes
    await activityService.logActivity(
      'field', 
      fieldId, 
      fieldName, 
      normalizedOld, 
      normalizedNew, 
      userId, 
      'success'
    );

    return { success: true };
  } catch (err) {
    console.error("Error updating field logic:", err);
    throw err;
  }
};

const getProductById = async (id) => {
  const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
  return result.rows[0]; 
};


module.exports = {
  getProducts,
  updateProduct,
  createProduct,
  deleteProduct,
  bulkDeleteProducts,
  updateFieldLogic,
  getProductById,
};