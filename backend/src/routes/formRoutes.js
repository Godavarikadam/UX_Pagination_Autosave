const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const Form = require('../models/form'); 
const authenticate=require('../middlewares/auth')

router.get('/get/product-form', async (req, res) => {
  try {
    const data = await Form.findOne({ tableName: "products" });
    res.json({ 
      success: true, 
      entities: data ? data.entities : [] 
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/save',authenticate('admin'), async (req, res) => {
  try {
    const { entities } = req.body;
    const userId = req.user?.id || 1; 
    const existingDoc = await Form.findOne({ tableName: "products" });
    const existingEntities = existingDoc ? existingDoc.entities : [];
    
  for (const newField of entities) {

  const oldField = existingEntities.find(e => e.dbKey === newField.dbKey);
  
  const oldLogic = oldField ? oldField.jsSource : "";
  const newLogic = newField.jsSource;

  if (oldLogic !== newLogic) {

    await pool.query(
      `INSERT INTO field_schema_logs (field_name, old_logic, new_logic, created_by, log_type) 
       VALUES ($1, $2, $3, $4, 'logic')`,
      [newField.dbKey, oldLogic, newLogic, userId]
    );
  }
}

    const updated = await Form.findOneAndUpdate(
      { tableName: "products" }, 
      { 
        tableName: "products", 
        entities: entities 
      },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );

    res.json({ success: true, entities: updated.entities });
  } catch (err) {
    console.error("Audit Log Error:", err.message);
    res.status(400).json({ success: false, error: err.message });
  }
});


router.get('/schema/:tableName', async (req, res) => {
  const { tableName } = req.params;
  try {
    const result = await pool.query(
      `SELECT column_name 
       FROM information_schema.columns 
       WHERE table_name = $1 
       AND table_schema = 'public'
       -- 🛡️ FILTER OUT SYSTEM COLUMNS HERE
       AND column_name NOT IN (
         'id', 
         'created_at', 
         'updated_at', 
         'updated_by', 
         'status'
       )
       ORDER BY ordinal_position ASC`, 
      [tableName.toLowerCase()]
    );

    res.json({ 
      success: true, 
      columns: result.rows.map(row => ({ name: row.column_name })) 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;