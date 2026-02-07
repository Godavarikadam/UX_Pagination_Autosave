const pool = require('../config/database');
const productService = require('./productService');

// In services/approvalService.js
const getPendingRequests = async (page, limit, search = "", status = "all") => {
  const offset = (page - 1) * limit;
  let queryParams = [];
  
  // 1. BASE QUERIES
  let queryText = `
    SELECT p.*, u.username as requester_name 
    FROM pending_requests p 
    JOIN users u ON p.requested_by = u.id`;
    
  let countText = `SELECT COUNT(*) FROM pending_requests p`;

  // 2. DYNAMIC FILTERS (Status & Search)
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

  // 3. SORTING & PAGINATION
  queryText += ` ORDER BY p.created_at DESC`;
  
  const nextParamIdx = queryParams.length;
  queryText += ` LIMIT $${nextParamIdx + 1} OFFSET $${nextParamIdx + 2}`;
  
  // 4. EXECUTION
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
    // 1. Get request details
    const reqRes = await pool.query("SELECT * FROM pending_requests WHERE id = $1", [requestId]);
    const request = reqRes.rows[0];

    if (decision === 'approved') {
        // 🟢 Push to Production using your existing service
        await productService.updateProduct(
            request.entity_id, 
            { [request.field_name]: request.new_value }, 
            adminId
        );
        
        await pool.query("UPDATE pending_requests SET status = 'approved' WHERE id = $1", [requestId]);
    } else {
        // 🔴 Reject
        await pool.query(
            "UPDATE pending_requests SET status = 'rejected', rejection_reason = $1 WHERE id = $2",
            [reason, requestId]
        );
        
        // Update the activity_log status so the user sees it in their feed
        await pool.query(
            "UPDATE activity_log SET status = 'rejected', rejection_reason = $1 WHERE entity_id = $2 AND field_name = $3 AND status = 'pending'",
            [reason, request.entity_id, request.field_name]
        );
    }
    return { success: true };
};

module.exports = { getPendingRequests, handleDecision };