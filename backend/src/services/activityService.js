const pool = require('../config/database');

const logActivity = async (entityType, entityId, fieldName, oldValue, newValue, userId, status = 'success') => {
  try {
    
    const recentLog = await pool.query(
      `SELECT id, old_value FROM activity_log 
       WHERE entity_id = $1 
       AND created_by = $2 
       AND field_name = $3
       AND status = $4
       AND created_at > NOW() - INTERVAL '1 minute'
       ORDER BY created_at DESC LIMIT 1`,
      [entityId, userId, fieldName, status]
    );

    if (recentLog.rows.length > 0) {
      await pool.query(
        `UPDATE activity_log 
         SET new_value = $1, 
             created_at = NOW() 
         WHERE id = $2`,
        [String(newValue ?? ''), recentLog.rows[0].id]
      );
    } else {
     
      await pool.query(
        `INSERT INTO activity_log (entity_type, entity_id, field_name, old_value, new_value, status, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          entityType, 
          entityId, 
          fieldName, 
          String(oldValue ?? ''), 
          String(newValue ?? ''), 
          status, 
          userId
        ]
      );
    }
  } catch (err) {
    console.error("Failed to save activity log:", err.message);
  }
};

// Add this to activityService.js
const updateLogStatus = async (entityId, fieldName, status, reason = null,adminId=null) => {
  try {
    await pool.query(
      `UPDATE activity_log 
       SET status = $1, rejection_reason = $2 ,admin_Id=$3,updated_at=NOW()
       WHERE entity_id = $4 AND field_name = $5 AND status = 'pending'`,
      [status, reason,adminId, entityId, fieldName]
    );
  } catch (err) {
    console.error("Failed to update activity log status:", err.message);
  }
};

// Inside activityService.js
const resolveOrLogActivity = async (entityType, entityId, field, oldVal, newVal, userId, status) => {
  // 1. Check if there's a pending request for this exact field/entity
  const pending = await pool.query(
    `SELECT id FROM activity_log 
     WHERE entity_type = $1 AND entity_id = $2 AND field_name = $3 AND status = 'pending'`,
    [entityType, entityId, field]
  );

  if (pending.rows.length > 0) {
    // 2. 🟢 UPDATE EXISTING: If pending exists, just mark it as success/approved
    await pool.query(
      `UPDATE activity_log 
       SET status = $1, new_value = $2, created_by = $3, updated_at = NOW() 
       WHERE id = $4`,
      [status, newVal, userId, pending.rows[0].id]
    );
  } else {
    // 3. CREATE NEW: If no pending exists (e.g., Admin changed it directly), create a new log
    await logActivity(entityType, entityId, field, oldVal, newVal, userId, status);
  }
};

module.exports = { logActivity, updateLogStatus ,resolveOrLogActivity};
