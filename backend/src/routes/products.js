const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authenticate = require('../middlewares/auth');

router.get('/marketplace', authenticate(['viewer']), productController.getViewerProducts);
router.get('/approvals/list', authenticate(['admin', 'editor', 'viewer']), productController.getApprovalList);
router.get('/approvals/count', authenticate(['admin']), productController.getPendingCount);

router.get('/approvals/:productId/:requestId', authenticate(['admin', 'editor', 'viewer']), productController.getApprovalDetail);

router.get('/', authenticate(['admin', 'editor', 'viewer']), productController.getProducts);

router.get('/:id', authenticate(['admin', 'editor', 'viewer']), productController.getProductById);


router.patch('/:id', authenticate(['admin', 'editor']), productController.updateProduct);
router.post('/', authenticate(['admin', 'editor']), productController.createProduct);
router.post('/bulk-delete', authenticate(['admin']), productController.bulkDelete);
router.delete('/:id', authenticate(['admin']), productController.deleteProduct);
router.put('/logic/update', authenticate(['admin']), productController.updateFieldLogic);
router.post('/approvals', authenticate(['admin', 'editor']), productController.submitApprovalRequest);
router.post('/approvals/decision', authenticate(['admin']), productController.handleDecision);

module.exports = router;