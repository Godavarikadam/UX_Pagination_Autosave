const productService = require('../services/productService');
const pool = require('../config/database'); 
const activityService = require('../services/activityService'); // 🟢 Add this line


const validateBusinessRules = async (data) => {
  const { quantity, unit_price } = data;

  try {
  
    const settingsRes = await pool.query(
      "SELECT key, value FROM system_settings WHERE key IN ('min_product_qty', 'min_product_price')"
    );
    
    const config = {};
    settingsRes.rows.forEach(row => config[row.key] = row.value);

    const minQty = parseInt(config.min_product_qty) || 1;
    const minPrice = parseFloat(config.min_product_price) || 1.00;

    if (quantity !== undefined && parseInt(quantity) < minQty) {
      return `Quantity must be at least ${minQty}.`;
    }

    if (unit_price !== undefined && parseFloat(unit_price) < minPrice) {
      return `Unit Price must be at least ${minPrice.toFixed(2)}.`;
    }
    
    return null;
  } catch (err) {
    console.error("Validation config error:", err);
    return null; 
  }
};

const getProducts = async (req, res, next) => {
  try {
    const settingsRes = await pool.query(
      "SELECT key, value FROM system_settings WHERE key IN ('DEFAULT_PAGE_SIZE')"
    );
    const config = {};
    settingsRes.rows.forEach(row => config[row.key] = row.value);

    const page = parseInt(req.query.page) || 1;
    
    
    const dbLimit = parseInt(config.DEFAULT_PAGE_SIZE);

    let limit;
    if (req.query.limit) {
      limit = parseInt(req.query.limit);
    } else {
      limit = !isNaN(dbLimit) ? dbLimit : 5; 
    }
    
    const search = req.query.search || ""; 
    const sort = req.query.sort || config.DEFAULT_SORT_COL || "id";
    const sortOrder = req.query.sortOrder || "asc";

    // console.log(`Final Limit: ${limit} (From URL: ${req.query.limit}, From DB: ${dbLimit})`);

    const result = await productService.getProducts(page, limit, search, sort, sortOrder);
    res.json(result);
  } catch (err) {
    next(err);
  }
};


const updateProduct = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const updates = req.body;
    const { id: userId, role } = req.user;

    // 1. Validate Business Rules
    const error = await validateBusinessRules(updates);
    if (error) return res.status(400).json({ success: false, message: error });

    // 2. Branch based on Role
    if (role === 'admin') {
      // 🟢 Admin: Proceed to live service
      const result = await productService.updateProduct(id, updates, userId);
      return res.json(result); 
    } else {
      
      // 🟡 User: Divert to pending_requests
      const current = await productService.getProductById(id);
      
      if (!current) {
        return res.status(404).json({ success: false, message: "Product not found" });
      }

      const checkableFields = ['name', 'quantity', 'unit_price', 'category', 'description'];

     for (const [field, newVal] of Object.entries(updates)) {
  if (!checkableFields.includes(field)) continue;

  const stringOldVal = String(current[field] ?? "");
  const stringNewVal = String(newVal ?? "");

  // 1. If the value is the same as the current live data, skip it
  if (stringOldVal === stringNewVal) continue;

  // 🟢 2. THE FIX: Remove previous pending logs for THIS field
  // This cleans up the "1", "10", "105" trail and leaves only the most recent
  await pool.query(
    `DELETE FROM pending_requests 
     WHERE entity_id = $1 AND field_name = $2 AND status = 'pending'`,
    [id, field]
  );
  
  await pool.query(
    `DELETE FROM activity_log 
     WHERE entity_id = $1 AND field_name = $2 AND status = 'pending'`,
    [id, field]
  );

  // 3. Insert the fresh "Single" log
  await pool.query(
    `INSERT INTO pending_requests (entity_id, field_name, old_value, new_value, requested_by) 
     VALUES ($1, $2, $3, $4, $5)`,
    [id, field, stringOldVal, stringNewVal, userId]
  );

  await pool.query(
    `INSERT INTO activity_log (entity_type, entity_id, field_name, old_value, new_value, status, created_by)
     VALUES ('product', $1, $2, $3, $4, 'pending', $5)`,
    [id, field, stringOldVal, stringNewVal, userId]
  );
}
      return res.json({ success: true, message: "Request sent for admin approval." });
    }
  } catch (err) { 
    next(err); 
  }
};

const createProduct = async (req, res, next) => {
  try {
    const data = req.body;

   
    const error = await validateBusinessRules(data);
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    const result = await productService.createProduct(data, req.user.id,req.user.role);
    res.json(result);
  } catch (err) {
    next(err);
  }
};


const deleteProduct = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    await productService.deleteProduct(id, req.user.id);
    res.json({ message: 'Product moved to inactive status' });
  } catch (err) {
    next(err);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const product = await productService.getProductById(id);
    res.json(product);
  } catch (err) {
    next(err);
  }
};

const bulkDelete = async (req, res, next) => {
  try {
    const { ids } = req.body; 
    const userId = req.user?.id;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No product IDs provided for deletion" });
    }

    const result = await productService.bulkDeleteProducts(ids, userId);

    res.json({ 
      message: `${result.length} products moved to inactive status`,
      count: result.length 
    });
  } catch (err) {
    next(err);
  }
};


// Add this new function to your controller file
const updateFieldLogic = async (req, res, next) => {
  try {
    const { field_id, field_name, new_logic, old_logic } = req.body;
    const userId = req.user.id;

    // 1. Update the logic in MongoDB 
    // (Assuming you have a service for this, similar to productService)
    await fieldService.updateMongoLogic(field_id, new_logic);

    // 2. EXACT STEP: Insert the history record into your new Postgres table
    await pool.query(
      `INSERT INTO field_schema_logs (field_name, old_logic, new_logic, created_by) 
       VALUES ($1, $2, $3, $4)`,
      [field_name, old_logic, new_logic, userId]
    );

    res.json({ success: true, message: "Field logic updated and logged." });
  } catch (err) {
    console.error("Logic Log Error:", err);
    next(err);
  }
};

const handleDecision = async (req, res) => {
  const { requestId, decision, reason } = req.body;
  const adminId = req.user.id;

  const requestRes = await pool.query("SELECT * FROM pending_requests WHERE id = $1", [requestId]);
  const request = requestRes.rows[0];

  if (!request) return res.status(404).json({ message: "Request not found" });

  if (decision === 'approved') {
    await productService.updateProduct(request.entity_id, { [request.field_name]: request.new_value }, adminId);
    
    await pool.query(
      "UPDATE pending_requests SET status = 'approved', admin_id = $1, updated_at = NOW() WHERE id = $2", 
      [adminId, requestId]
    );

    // 🟢 FIX: Pass the specific new_value so the service updates the correct log row
    await activityService.updateLogStatus(
        request.entity_id, 
        request.field_name, 
        'success', 
        null, 
        adminId, 
        request.new_value // Add this parameter
    );

  } else {
    await pool.query(
        "UPDATE pending_requests SET status = 'rejected', rejection_reason = $1, admin_id = $2, updated_at = NOW() WHERE id = $3", 
        [reason, adminId, requestId]
    );
    
    // 🟢 FIX: Do the same for rejection
    await activityService.updateLogStatus(
        request.entity_id, 
        request.field_name, 
        'rejected', 
        reason, 
        adminId, 
        request.new_value
    );
  }

  res.json({ success: true });
};


const getApprovalList = async (req, res, next) => {
  try {
    // 1. Get user info from the request (attached by your auth middleware)
    const { id: userId, role } = req.user;

    // 2. Base query
    let query = `
      SELECT 
        p.*, 
        u1.email as requester_name, 
        u2.email as admin_name
      FROM pending_requests p 
      JOIN users u1 ON p.requested_by = u1.id 
      LEFT JOIN users u2 ON p.admin_id = u2.id
    `;

    const queryParams = [];

    // 3. 🟢 THE FIX: If not admin, add a WHERE clause to filter by the user's ID
    if (role !== 'admin') {
      query += ` WHERE p.requested_by = $1`;
      queryParams.push(userId);
    }

    // 4. Final ordering
    query += ` ORDER BY COALESCE(p.updated_at, p.created_at) DESC`;

    const result = await pool.query(query, queryParams);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};


const getPendingCount = async (req, res, next) => {
  try {
    const result = await pool.query(
      "SELECT COUNT(*) FROM pending_requests WHERE status = 'pending'"
    );
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProducts,
  updateProduct,
  createProduct,
  deleteProduct,
  getProductById,
  bulkDelete,
  updateFieldLogic,
  handleDecision,
  getApprovalList,
  getPendingCount,
};