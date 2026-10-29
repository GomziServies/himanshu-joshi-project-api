const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const receiptController = require('../controllers/receiptController');
const { protect, adminOnly } = require('../middleware/auth');

// Public checkout routes
router.post('/create-order', orderController.createOrder);
router.post('/verify-payment', orderController.verifyPayment);

// Admin-only order inspection and management
router.get('/', protect, adminOnly, orderController.getAdminOrders);
router.get('/:id', protect, adminOnly, orderController.getOrderById);
router.patch('/:id/status', protect, adminOnly, orderController.updateOrderStatus);
router.post('/:id/resend-receipt', protect, adminOnly, receiptController.resendReceiptEmail);

module.exports = router;
