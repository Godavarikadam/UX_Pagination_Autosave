const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authenticate = require('../middlewares/auth');

router.get('/', authenticate(), productController.getProducts);
router.get('/:id', authenticate(), productController.getProductById);
router.patch('/:id', authenticate(), productController.updateProduct);
router.post('/', authenticate(), productController.createProduct);

router.post('/bulk-delete', authenticate('admin'), productController.bulkDelete);
router.delete('/:id', authenticate('admin'), productController.deleteProduct);
router.put('/logic/update', authenticate('admin'), productController.updateFieldLogic);
router.post('/approvals', authenticate(), productController.submitApprovalRequest);

router.get('/approvals/:productId/:requestId', authenticate(), productController.getApprovalDetail);

router.get('/approvals/list', authenticate(), productController.getApprovalList);

router.post('/approvals/decision', authenticate('admin'), productController.handleDecision);

router.get('/approvals/count', authenticate('admin'), productController.getPendingCount);

module.exports = router;