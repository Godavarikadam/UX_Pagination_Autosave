const pool = require('../config/database');
const productService = require('./productService');

const getPendingRequests = async (page, limit, search = "", status = "all") => {
  const offset = (page - 1) * limit;
  let queryParams = [];
  
  let queryText = `
    SELECT p.*, u.username as requester_name 
    FROM pending_requests p 
    JOIN users u ON p.requested_by = u.id`;
    
  let countText = `SELECT COUNT(*) FROM pending_requests p`;

  let filters = ["WHERE 1=1"];

  if (status !== "all") {
    queryParams.push(status);
    filters.push(`p.status = $${queryParams.length}`);
  }

  if (search && search.trim() !== "") {
    queryParams.push(`%${search.trim()}%`);
    filters.push(`(p.product_name ILIKE $${queryParams.length} OR p.entity_id::TEXT ILIKE $${queryParams.length})`);
  }

  const filterClause = filters.join(" AND ");
  queryText += ` ${filterClause}`;
  countText += ` ${filterClause}`;

  queryText += ` ORDER BY p.created_at DESC`;
  
  const nextParamIdx = queryParams.length;
  queryText += ` LIMIT $${nextParamIdx + 1} OFFSET $${nextParamIdx + 2}`;

  const requestsResult = await pool.query(queryText, [...queryParams, limit, offset]);
  const countResult = await pool.query(countText, queryParams);

  return {
    items: requestsResult.rows,
    total: Number(countResult.rows[0].count),
    page,
    limit,
  };
};

const handleDecision = async (requestId, decision, adminId, reason = null) => {

    const reqRes = await pool.query("SELECT * FROM pending_requests WHERE id = $1", [requestId]);
    const request = reqRes.rows[0];

    if (decision === 'approved') {
       
        if (request.field_name === 'CREATE_NEW_PRODUCT') {
           
            const data = JSON.parse(request.new_value);

            const productRes = await pool.query(
                `INSERT INTO products (name, quantity, unit_price, description, category, status, updated_by)
                 VALUES ($1, $2, $3, $4, $5, 'active', $6) RETURNING id`,
                [data.name, data.quantity, data.unit_price, data.description, data.category, adminId]
            );
            
            const newProductId = productRes.rows[0].id;

            await pool.query("UPDATE pending_requests SET status = 'approved', entity_id = $1 WHERE id = $2", [newProductId, requestId]);
            await pool.query("UPDATE activity_log SET status = 'approved', entity_id = $1 WHERE request_id = $2", [newProductId, requestId]);

        } else {
            await productService.updateProduct(
                request.entity_id, 
                { [request.field_name]: request.new_value }, 
                adminId
            );
            
            await pool.query("UPDATE pending_requests SET status = 'approved' WHERE id = $1", [requestId]);

            await pool.query("UPDATE activity_log SET status = 'approved' WHERE request_id = $1", [requestId]);
        }
    } else {

        await pool.query(
            "UPDATE pending_requests SET status = 'rejected', rejection_reason = $1 WHERE id = $2",
            [reason, requestId]
        );
        
        await pool.query(
            "UPDATE activity_log SET status = 'rejected', rejection_reason = $1 WHERE request_id = $2",
            [reason, requestId]
        );
    }
    return { success: true };
};

module.exports = { getPendingRequests, handleDecision };