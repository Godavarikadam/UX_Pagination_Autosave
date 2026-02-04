const pool = require('../config/database');
const productService = require('./productService');

// In services/approvalService.js
const getPendingRequests = async () => {
    const res = await pool.query(`
        SELECT p.*, u.username as requester_name 
        FROM pending_requests p 
        JOIN users u ON p.requested_by = u.id 
        ORDER BY p.created_at DESC -- Show newest first
    `);
    return res.rows;
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