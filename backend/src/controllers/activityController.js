const pool = require('../config/database');
const activityService = require('../services/activityService');

const getActivityLogs = async (req, res, next) => {
  try {
    const { role, userId, type } = req.query;

    if (!role) return res.json({ items: [], total: 0 });

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 25;
    const offset = (page - 1) * limit;

    // --- 1. FIELD SCHEMA LOGS (logic) ---
    if (type === 'logic') {
      let logicWhere = "";
      let logicParams = [];

      if (role !== 'admin') {
        logicWhere = "WHERE created_by = $1";
        logicParams.push(parseInt(userId));
      }

      const fieldResult = await pool.query(
        `SELECT *, 'logic' as log_type FROM field_schema_logs 
         ${logicWhere} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`,
        logicParams
      );

      const totalRes = await pool.query(
        `SELECT COUNT(*) FROM field_schema_logs ${logicWhere}`, 
        logicParams
      );

      const normalizedFieldLogs = (fieldResult.rows || []).map(row => ({
        ...row,
        validation: row.new_logic?.validation || { required: false },
        product_name: row.field_name ? `Schema: ${row.field_name}` : "Global Schema Update"
      }));

      return res.json({ 
        items: normalizedFieldLogs, 
        total: parseInt(totalRes.rows[0].count), 
        page, 
        limit 
      });
    }
// --- 2. PRODUCT ACTIVITY LOGS ---
    let productWhere = "";
    let productParams = [];
    const uid = parseInt(userId);

    if (role === 'admin') {
      // 🟢 Admin: Sees ALL logs from ALL users, but filters out Purchase logs 
      // to keep the main product activity feed clean.
      productWhere = "WHERE a.field_name NOT ILIKE '%Purchase%'";
    } 
    else if (role === 'editor') {
      // 🟢 Editor: Sees ONLY their own logs and also filters out Purchase logs.
      productWhere = "WHERE a.created_by = $1 AND a.field_name NOT ILIKE '%Purchase%'";
      productParams.push(uid);
    } 
    else if (role === 'viewer') {
      // 🟢 Viewer: Sees ONLY their own logs, and specifically NEEDS to see 
      // 'Purchase' entity logs (their order history).
      productWhere = "WHERE a.created_by = $1";
      productParams.push(uid);
    } else {
      // Safety fallback
      return res.json({ items: [], total: 0 });
    }

    const productResult = await pool.query(
      `SELECT a.*, p.name as product_name, 'product' as log_type 
       FROM activity_log a LEFT JOIN products p ON a.entity_id = p.id
       ${productWhere} 
       ORDER BY a.created_at DESC LIMIT ${limit} OFFSET ${offset}`,
      productParams
    );

    const totalProdRes = await pool.query(
      `SELECT COUNT(*) FROM activity_log a ${productWhere}`, 
      productParams
    );

    return res.json({ 
      items: productResult.rows, 
      total: parseInt(totalProdRes.rows[0].count), 
      page, 
      limit 
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