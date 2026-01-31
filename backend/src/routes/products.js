const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authenticate = require('../middlewares/auth');

router.get('/', authenticate(), productController.getProducts);
router.get('/:id', authenticate(), productController.getProductById);

router.post('/bulk-delete', authenticate('admin'), productController.bulkDelete);

router.patch('/:id', authenticate(), productController.updateProduct);

router.post('/', authenticate(), productController.createProduct);

router.delete('/:id', authenticate('admin'), productController.deleteProduct);

module.exports = router;
