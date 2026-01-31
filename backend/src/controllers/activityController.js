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
    let whereClauseProduct = "";
    let whereClauseField = "";

    // Role-based filtering logic
    if (role !== 'admin') {
      whereClauseProduct = "WHERE a.created_by = $1";
      whereClauseField = "WHERE created_by = $1";
      queryParams.push(parseInt(userId));
    }

    // 1. Fetch Product Logs (Existing Logic)
    const p1 = queryParams.length + 1;
    const p2 = queryParams.length + 2;
    const productResult = await pool.query(
      `SELECT 
        a.*, 
        p.name as product_name,
        'product' as log_type 
       FROM activity_log a
       LEFT JOIN products p ON a.entity_id = p.id
       ${whereClauseProduct} 
       ORDER BY a.created_at DESC`,
      queryParams
    );

    // 2. Fetch Field Schema Logs (New Logic for MongoDB changes)
    const fieldResult = await pool.query(
      `SELECT *, 'logic' as log_type 
       FROM field_schema_logs 
       ${whereClauseField} 
       ORDER BY created_at DESC`,
      queryParams
    );

    // 3. Merge and Sort both sources by created_at (Newest First)
    const combinedLogs = [...productResult.rows, ...fieldResult.rows].sort((a, b) => 
      new Date(b.created_at) - new Date(a.created_at)
    );

    // 4. Calculate Totals and Paginate the combined list
    const totalCount = combinedLogs.length;
    const paginatedItems = combinedLogs.slice(offset, offset + limit);

    res.json({
      items: paginatedItems,
      total: totalCount,
      page,
      limit,
    });
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

    res.json({ message: 'Retry executed' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getActivityLogs,
  retryActivity,
};