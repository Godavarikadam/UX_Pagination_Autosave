const pool = require('../config/database');
const activityService = require('../services/activityService');

const getActivityLogs = async (req, res, next) => {
  try {
    const { role, userId } = req.query;

    if (!role) {
      return res.json({ items: [], total: 0 });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 25;
    const offset = (page - 1) * limit;

    let queryParams = [];
    let whereClause = "";

    if (role !== 'admin') {
      whereClause = "WHERE a.created_by = $1"; 
      queryParams.push(parseInt(userId));
    }

    const p1 = queryParams.length + 1;
    const p2 = queryParams.length + 2;
 
    const result = await pool.query(
      `SELECT 
        a.*, 
        p.name as product_name 
       FROM activity_log a
       LEFT JOIN products p ON a.entity_id = p.id
       ${whereClause} 
       ORDER BY a.created_at DESC 
       LIMIT $${p1} OFFSET $${p2}`,
      [...queryParams, limit, offset]
    );

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM activity_log a ${whereClause}`, 
      queryParams
    );

    res.json({
      items: result.rows,
      total: parseInt(countResult.rows[0].count, 10),
      page,
      limit,
    });
  } catch (err) {
    console.error("Database Error:", err);
    next(err);
  }
};

module.exports = { getActivityLogs };

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

    res.json({ message: 'Retry executed' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getActivityLogs,
  retryActivity,
};