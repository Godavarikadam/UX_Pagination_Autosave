const productService = require('../services/productService');
const pool = require('../config/database'); 

const validateBusinessRules = async (data) => {
  const { quantity, unit_price } = data;

  try {
  
    const settingsRes = await pool.query(
      "SELECT key, value FROM system_settings WHERE key IN ('min_product_qty', 'min_product_price')"
    );
    
    const config = {};
    settingsRes.rows.forEach(row => config[row.key] = row.value);

    const minQty = parseInt(config.min_product_qty) || 1;
    const minPrice = parseFloat(config.min_product_price) || 1.00;

    if (quantity !== undefined && parseInt(quantity) < minQty) {
      return `Quantity must be at least ${minQty}.`;
    }

    if (unit_price !== undefined && parseFloat(unit_price) < minPrice) {
      return `Unit Price must be at least ${minPrice.toFixed(2)}.`;
    }
    
    return null;
  } catch (err) {
    console.error("Validation config error:", err);
    return null; 
  }
};

const getProducts = async (req, res, next) => {
  try {
    const settingsRes = await pool.query(
      "SELECT key, value FROM system_settings WHERE key IN ('DEFAULT_PAGE_SIZE')"
    );
    const config = {};
    settingsRes.rows.forEach(row => config[row.key] = row.value);

    const page = parseInt(req.query.page) || 1;
    
    
    const dbLimit = parseInt(config.DEFAULT_PAGE_SIZE);

    let limit;
    if (req.query.limit) {
      limit = parseInt(req.query.limit);
    } else {
      limit = !isNaN(dbLimit) ? dbLimit : 5; 
    }
    
    const search = req.query.search || ""; 
    const sort = req.query.sort || config.DEFAULT_SORT_COL || "id";
    const sortOrder = req.query.sortOrder || "asc";

    // console.log(`Final Limit: ${limit} (From URL: ${req.query.limit}, From DB: ${dbLimit})`);

    const result = await productService.getProducts(page, limit, search, sort, sortOrder);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const updates = req.body;

   
    const error = await validateBusinessRules(updates);
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    const result = await productService.updateProduct(id, updates, req.user.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const data = req.body;

   
    const error = await validateBusinessRules(data);
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    const result = await productService.createProduct(data, req.user.id,req.user.role);
    res.json(result);
  } catch (err) {
    next(err);
  }
};


const deleteProduct = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    await productService.deleteProduct(id, req.user.id);
    res.json({ message: 'Product moved to inactive status' });
  } catch (err) {
    next(err);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const product = await productService.getProductById(id);
    res.json(product);
  } catch (err) {
    next(err);
  }
};

const bulkDelete = async (req, res, next) => {
  try {
    const { ids } = req.body; 
    const userId = req.user?.id;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No product IDs provided for deletion" });
    }

    const result = await productService.bulkDeleteProducts(ids, userId);

    res.json({ 
      message: `${result.length} products moved to inactive status`,
      count: result.length 
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProducts,
  updateProduct,
  createProduct,
  deleteProduct,
  getProductById,
  bulkDelete,
};