const pool = require('../config/database');
const activityService = require('../services/activityService');

const getActivityLogs = async (req, res, next) => {
  try {
    const { role, userId, type } = req.query; // 🟢 Added 'type'

    if (!role) return res.json({ items: [], total: 0 });

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 25;
    const offset = (page - 1) * limit;

    let queryParams = [];
    let whereClause = "";

 // In getActivityLogs (Backend)
if (role !== 'admin') {
  // 🟢 CHANGE: Allow users to see logs they created OR logs linked to their requests
  whereClauseProduct = `WHERE (a.created_by = $1 OR a.request_id IN (SELECT id FROM pending_requests WHERE requested_by = $1))`;
  whereClauseField = "WHERE created_by = $1";
  queryParams.push(parseInt(userId));
}

    // --- SEPARATED LOGIC ---
    
    // 1. If fetching 'logic' (Field Schema Logs)
    if (type === 'logic') {
      const fieldResult = await pool.query(
        `SELECT *, 'logic' as log_type FROM field_schema_logs 
         ${whereClause} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`,
        queryParams
      );

      const totalRes = await pool.query(`SELECT COUNT(*) FROM field_schema_logs ${whereClause}`, queryParams);

      const normalizedFieldLogs = (fieldResult.rows || []).map(row => ({
        ...row,
        validation: row.new_logic?.validation || { required: false },
        product_name: row.field_name ? `Schema: ${row.field_name}` : "Global Schema Update"
      }));

      return res.json({ items: normalizedFieldLogs, total: parseInt(totalRes.rows[0].count), page, limit });
    }

    // 2. If fetching 'product' (Activity Logs)
    const productWhere = role !== 'admin' ? "WHERE a.created_by = $1" : "";
    const productResult = await pool.query(
      `SELECT a.*, p.name as product_name, 'product' as log_type 
       FROM activity_log a LEFT JOIN products p ON a.entity_id = p.id
       ${productWhere} ORDER BY a.created_at DESC LIMIT ${limit} OFFSET ${offset}`,
      queryParams
    );

    const totalProdRes = await pool.query(`SELECT COUNT(*) FROM activity_log a ${productWhere}`, queryParams);

    return res.json({ items: productResult.rows, total: parseInt(totalProdRes.rows[0].count), page, limit });

  } catch (err) {
    console.error("Database Error:", err);
    next(err);
  }
};

const retryActivity = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);

    const activityResult = await pool.query('SELECT * FROM activity_log WHERE id=$1', [id]);
    const activity = activityResult.rows[0];
    if (!activity) return res.status(404).json({ message: 'Activity not found' });

    if (activity.status === 'failed') {
      await activityService.logActivity(
        activity.entity_type,
        activity.entity_id,
        activity.field_name,
        activity.old_value,
        activity.new_value,
        activity.created_by
      );

      await pool.query('UPDATE activity_log SET status=$1, created_at=NOW() WHERE id=$2', [
        'success',
        id,
      ]);
    }

    res.json({ message: 'Retry executed successfully' });
  } catch (err) {
    console.error("Retry Error:", err);
    next(err);
  }
};

module.exports = {
  getActivityLogs,
  retryActivity,
};