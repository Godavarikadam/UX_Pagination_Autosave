const productService = require('../services/productService');
const pool = require('../config/database'); 
const activityService = require('../services/activityService'); 


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

    const error = await validateBusinessRules(updates);
    if (error) return res.status(400).json({ success: false, message: error });

    if (role === 'admin') {
      // 🟢 Admin: Proceed to live service
      const result = await productService.updateProduct(id, updates, userId);

      await pool.query(
        `UPDATE activity_log 
         SET status = 'approved' 
         WHERE entity_id = $1 AND status IN ('pending', 'rejected')`, 
        [id]
      );

      return res.json(result); 

    } else {
      // 🟡 User: Divert to pending_requests
      const current = await productService.getProductById(id);
      if (!current) return res.status(404).json({ success: false, message: "Product not found" });

      const checkableFields = ['name', 'quantity', 'unit_price', 'category', 'description'];

      for (const [field, newVal] of Object.entries(updates)) {
        if (!checkableFields.includes(field)) continue;

        const stringOldVal = String(current[field] ?? "");
        const stringNewVal = String(newVal ?? "");

        if (stringOldVal === stringNewVal) continue;
        await pool.query(
          `DELETE FROM pending_requests WHERE entity_id = $1 AND field_name = $2`, 
          [id, field]
        );
        await pool.query(
          `DELETE FROM activity_log WHERE entity_id = $1 AND field_name = $2 AND status IN ('pending', 'rejected')`, 
          [id, field]
        );

        // STEP 1: Insert into pending_requests
        const pendingRes = await pool.query(
          `INSERT INTO pending_requests (entity_id, field_name, old_value, new_value, requested_by) 
           VALUES ($1, $2, $3, $4, $5) RETURNING id`, 
          [id, field, stringOldVal, stringNewVal, userId]
        );

        const newRequestId = pendingRes.rows[0].id;

        // STEP 2: Insert into activity_log (This now becomes the LATEST status for getProducts)
        await pool.query(
          `INSERT INTO activity_log (entity_type, entity_id, field_name, old_value, new_value, status, created_by, request_id)
           VALUES ('product', $1, $2, $3, $4, 'pending', $5, $6)`,
          [id, field, stringOldVal, stringNewVal, userId, newRequestId]
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


const updateFieldLogic = async (req, res, next) => {
  try {
    const { field_id, field_name, new_logic, old_logic } = req.body;
    
    // 🟢 Move this UP so you can use it
    const userId = req.user.id; 

    // Now you can log it safely
    console.log("Saving log for User ID:", userId); 

    // 1. Update the logic in MongoDB
    await fieldService.updateMongoLogic(field_id, new_logic);

    // 2. Insert the history record with the actual userId (Admin #11)
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

// const handleDecision = async (req, res) => {
//   const { requestId, decision, reason } = req.body;
//   const adminId = req.user.id;

//   const requestRes = await pool.query("SELECT * FROM pending_requests WHERE id = $1", [requestId]);
//   const request = requestRes.rows[0];

//   if (!request) return res.status(404).json({ message: "Request not found" });

//   if (decision === 'approved') {
//     await productService.updateProduct(request.entity_id, { [request.field_name]: request.new_value }, adminId);
    
//     await pool.query(
//       "UPDATE pending_requests SET status = 'approved', admin_id = $1, updated_at = NOW() WHERE id = $2", 
//       [adminId, requestId]
//     );

//     // 🟢 FIX: Pass the specific new_value so the service updates the correct log row
//     await activityService.updateLogStatus(
//         request.entity_id, 
//         request.field_name, 
//         'success', 
//         null, 
//         adminId, 
//         request.new_value // Add this parameter
//     );

//   } else {
//     await pool.query(
//         "UPDATE pending_requests SET status = 'rejected', rejection_reason = $1, admin_id = $2, updated_at = NOW() WHERE id = $3", 
//         [reason, adminId, requestId]
//     );
    
//     // 🟢 FIX: Do the same for rejection
//     await activityService.updateLogStatus(
//         request.entity_id, 
//         request.field_name, 
//         'rejected', 
//         reason, 
//         adminId, 
//         request.new_value
//     );
//   }

//   res.json({ success: true });
// };

const getApprovalList = async (req, res, next) => {
  try {
 
    const settingsRes = await pool.query(
      "SELECT key, value FROM system_settings WHERE key IN ('DEFAULT_PAGE_SIZE')"
    );
    const config = {};
    const { id: userId, role } = req.user;


    const page = parseInt(req.query.page) || 1;
    const dbLimit = parseInt(config.DEFAULT_PAGE_SIZE);
    
    let limit;
    if (req.query.limit) {
      limit = parseInt(req.query.limit);
    } else {
      limit = !isNaN(dbLimit) ? dbLimit : 10; 
    }

    // 4. Extract Filters
    const searchTerm = req.query.search || "";
    const filterStatus = req.query.status || "all";
    const offset = (page - 1) * limit;

    // 5. Build Dynamic SQL
    const queryParams = [];
    let query = `
      SELECT p.*, u1.id as requester_id, u2.id as admin_id
      FROM pending_requests p 
      JOIN users u1 ON p.requested_by = u1.id 
      LEFT JOIN users u2 ON p.admin_id = u2.id
    `;
    
    let countQuery = `SELECT COUNT(*) FROM pending_requests p`;

    let filters = ["WHERE 1=1"];

    // Role-based Access: Non-admins only see their own requests
    if (role !== 'admin') {
      queryParams.push(userId);
      filters.push(`p.requested_by = $${queryParams.length}`);
    }

    // Status Filter
    if (filterStatus !== 'all') {
      queryParams.push(filterStatus);
      filters.push(`p.status = $${queryParams.length}`);
    }

    // Search Filter
    if (searchTerm) {
      queryParams.push(`%${searchTerm}%`);
      const searchIdx = queryParams.length;
      filters.push(`(p.entity_id::TEXT ILIKE $${searchIdx})`);
    }

    const whereClause = filters.join(" AND ");
    query += ` ${whereClause}`;
    countQuery += ` ${whereClause}`;

    query += ` ORDER BY COALESCE(p.updated_at, p.created_at) DESC`;
    
    queryParams.push(limit, offset);
    query += ` LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}`;

    const [dataResult, countResult] = await Promise.all([
      pool.query(query, queryParams),
      pool.query(countQuery, queryParams.slice(0, queryParams.length - 2)) 
    ]);

    res.json({
      items: dataResult.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      limit
    });

  } catch (err) {
    console.error("Error in getApprovalList:", err);
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

const getApprovalDetail = async (req, res, next) => {
  try {
    let { productId, requestId } = req.params;

    const pId = productId === 'new' ? 0 : parseInt(productId);
    const rId = parseInt(requestId);

    if (isNaN(rId)) {
      return res.status(400).json({ success: false, message: "Valid Request ID required" });
    }

    // 🟢 FIX: Changed u1.name/u2.name to u1.id (or use u1.username if it exists)
    const query = `
      SELECT 
        p.*, 
        u1.id as requester_id, 
        u2.id as admin_id
      FROM pending_requests p 
      JOIN users u1 ON p.requested_by = u1.id 
      LEFT JOIN users u2 ON p.admin_id = u2.id
      WHERE p.id = $1
    `;

    const result = await pool.query(query, [rId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "No matching record found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Database Error:", err);
    next(err);
  }
};

const handleDecision = async (req, res) => {
  const { requestId, decision, reason } = req.body;
  const adminId = req.user.id;

  try {
    const requestRes = await pool.query("SELECT * FROM pending_requests WHERE id = $1", [requestId]);
    const request = requestRes.rows[0];

    if (!request) return res.status(404).json({ message: "Request not found" });

    if (decision === 'approved') {
      let finalEntityId = request.entity_id;

      if (request.field_name === 'CREATE_NEW_PRODUCT') {
        const productData = JSON.parse(request.new_value);
        const newProduct = await productService.createProduct(productData, request.requested_by, 'admin',true);
        finalEntityId = newProduct.id;
      
        await pool.query(
          "UPDATE pending_requests SET status = 'approved', entity_id = $1, admin_id = $2, updated_at = NOW() WHERE id = $3",
          [finalEntityId, adminId, requestId]
        );

        await pool.query(
          `UPDATE activity_log 
           SET status = 'success', entity_id = $1, admin_id = $2, updated_at = NOW() 
           WHERE request_id = $3`,
          [finalEntityId, adminId, requestId]
        );
      } else {
       
        await productService.updateProduct(request.entity_id, { [request.field_name]: request.new_value }, adminId);
        
        await pool.query(
          "UPDATE pending_requests SET status = 'approved', admin_id = $1, updated_at = NOW() WHERE id = $2", 
          [adminId, requestId]
        );
        await pool.query(
          "UPDATE activity_log SET status = 'success', admin_id = $1, updated_at = NOW() WHERE request_id = $2",
          [adminId, requestId]
        );
      }
    } else {
     
      await pool.query(
        "UPDATE pending_requests SET status = 'rejected', rejection_reason = $1, admin_id = $2, updated_at = NOW() WHERE id = $3", 
        [reason, adminId, requestId]
      );

      await pool.query(
        "UPDATE activity_log SET status = 'rejected', rejection_reason = $1, admin_id = $2, updated_at = NOW() WHERE request_id = $3",
        [reason, adminId, requestId]
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Decision Error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};


const submitApprovalRequest = async (req, res) => {
    try {
        const { entity_id, field_name, old_value, new_value, updated_by } = req.body;

        const query = `
            INSERT INTO pending_requests 
            (entity_id, field_name, old_value, new_value, requested_by, status) 
            VALUES ($1, $2, $3, $4, $5, 'pending')
            RETURNING id
        `;

        const result = await pool.query(query, [
            entity_id || 0, 
            field_name, 
            old_value || null, 
            new_value, 
            updated_by
        ]);

        // 🟢 FIX 4: Insert into activity_log so it shows up in the Activity Feed immediately
        await pool.query(
          `INSERT INTO activity_log (entity_type, entity_id, field_name, old_value, new_value, status, created_by, request_id)
           VALUES ('product', $1, $2, $3, $4, 'pending', $5, $6)`,
          [entity_id || 0, field_name, old_value || null, new_value, updated_by, result.rows[0].id]
        );

        res.status(201).json({ 
            success: true, 
            message: "Request submitted for admin approval",
            requestId: result.rows[0].id 
        });
    } catch (error) {
        console.error("Submission Error:", error);
        res.status(500).json({ message: "Failed to submit approval request" });
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
  getApprovalDetail,
  submitApprovalRequest 
};
