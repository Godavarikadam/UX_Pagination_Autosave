const productModel = require('../models/productModel');
const activityModel = require('../models/activityModel');
const compareValues = require('../utils/compareValues');

const autoSaveProduct = async (productId, updates, userId) => {
  const existingProduct = await productModel.getProductById(productId);
  if (!existingProduct) throw new Error('Product not found');

  const changedFields = compareValues(existingProduct, updates);
  if (Object.keys(changedFields).length === 0) {
    return { message: 'No changes detected' };
  }

  await productModel.updateProduct(productId, changedFields);

  for (const field in changedFields) {
    await activityModel.logActivity(
      'product',
      productId,
      field,
      existingProduct[field],
      changedFields[field],
      userId
    );
  }

  return { message: 'Product auto-saved' };
};

module.exports = { autoSaveProduct };
