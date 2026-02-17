const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderControllers');


const authenticate = require('../middlewares/auth'); 

router.post('/buy', authenticate(['viewer']), orderController.placeOrder);
router.get('/my-orders', authenticate(['viewer']), orderController.getMyOrders);

module.exports = router;