const app = require('./app');

const mongoose = require('mongoose');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});



const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/product_engine';

mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));