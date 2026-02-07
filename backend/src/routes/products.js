const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authenticate = require('../middlewares/auth');

// --- Standard Product Routes ---
router.get('/', authenticate(), productController.getProducts);
router.get('/:id', authenticate(), productController.getProductById);
router.patch('/:id', authenticate(), productController.updateProduct);
router.post('/', authenticate(), productController.createProduct);

// --- Admin Only Product Actions ---
router.post('/bulk-delete', authenticate('admin'), productController.bulkDelete);
router.delete('/:id', authenticate('admin'), productController.deleteProduct);
router.put('/logic/update', authenticate('admin'), productController.updateFieldLogic);

// --- Approval System Routes (Admin Only) ---
router.get('/approvals/:productId/:requestId', authenticate(), productController.getApprovalDetail);
// 1. Get the list of all requests (Pending/Approved/Rejected)
router.get('/approvals/list', authenticate(), productController.getApprovalList);


// 2. The Decision (Approve/Reject)
router.post('/approvals/decision', authenticate('admin'), productController.handleDecision);

// 3. The Notification Count (For the Sidebar Badge)
router.get('/approvals/count', authenticate('admin'), productController.getPendingCount);

module.exports = router;