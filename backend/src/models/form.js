const mongoose = require('mongoose');
const EntitySchema = new mongoose.Schema({
  dbKey: { type: String, required: true }, // The SQL column name
  label: { type: String, required: true },
  jsSource: { type: String, default: "" },
  required: { type: Boolean, default: false }
});

const FormSchema = new mongoose.Schema({
  // Hardcoded to "product-table" since we only have one table
  tableName: { type: String, default: "product-table", unique: true }, 
  entities: [EntitySchema]
});

module.exports=mongoose.model('Form',FormSchema);