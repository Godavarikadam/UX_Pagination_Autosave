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

module.exports = { logActivity };