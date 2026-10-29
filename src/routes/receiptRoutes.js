const express = require('express');
const router = express.Router();
const receiptController = require('../controllers/receiptController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly);
router.get('/', receiptController.getAllReceipts);
router.get('/:id', receiptController.getReceiptById);

module.exports = router;
