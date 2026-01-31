const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const Form = require('../models/form'); // The model you just created
// backend/routes/formRoutes.js
// backend/routes/formRoutes.js

// 🛡️ LOAD: Logic for the "products" table
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

// 🛡️ SAVE: Logic for the "products" table
router.post('/save', async (req, res) => {
  try {
    const { entities } = req.body;
    const updated = await Form.findOneAndUpdate(
      { tableName: "products" }, 
      { 
        tableName: "products", // Explicitly set to satisfy Schema requirement
        entities: entities 
      },
      { upsert: true, new: true, runValidators: true,setDefaultsOnInsert: true }
    );
    res.json({ success: true, entities: updated.entities });
  } catch (err) {
    console.error("Mongoose Error:", err.message);
    res.status(400).json({ success: false, error: err.message });
  }
});
// backend/routes/formRoutes.js
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