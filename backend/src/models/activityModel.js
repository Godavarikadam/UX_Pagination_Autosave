const pool = require('../config/database');

const logActivity = async (entityType, entityId, fieldName, oldValue, newValue, userId, status='success') => {
  await pool.query(
    `INSERT INTO activity_log (entity_type, entity_id, field_name, old_value, new_value, status, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [entityType, entityId, fieldName, oldValue, newValue, status, userId]
  );
};

const getActivities = async (limit = 100) => {
  const result = await pool.query('SELECT * FROM activity_log ORDER BY created_at DESC LIMIT $1', [limit]);
  return result.rows;
};

const logFieldChange = async (fieldName, oldValue, newValue, userId) => {
  await pool.query(
    `INSERT INTO field_schema_logs (field_name, old_logic, new_logic, created_by)
     VALUES ($1, $2, $3, $4)`,
    [fieldName, oldValue, newValue, userId]
  );
};

module.exports = { logActivity, getActivities ,logFieldChange,};
