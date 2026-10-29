/**
 * Transaction Receipt Controller
 * Provides audit log querying and manual receipt email re-dispatch for administrators.
 */
const TransactionReceipt = require('../models/TransactionReceipt');
const Order = require('../models/Order');
const { sendReceiptEmail } = require('../services/emailService');

/**
 * GET /api/admin/receipts
 * Paginated list of transaction receipts with search filter
 */
exports.getAllReceipts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const search = req.query.search ? req.query.search.trim() : '';

    const filter = {};
    if (search) {
      filter.$or = [
        { receiptNumber: { $regex: search, $options: 'i' } },
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'customerDetails.name': { $regex: search, $options: 'i' } },
        { 'customerDetails.email': { $regex: search, $options: 'i' } },
        { gatewayTransactionId: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await TransactionReceipt.countDocuments(filter);
    const receipts = await TransactionReceipt.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return res.status(200).json({
      success: true,
      data: receipts,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/receipts/:id
 * Inspect single transaction receipt by ID
 */
exports.getReceiptById = async (req, res, next) => {
  try {
    const receipt = await TransactionReceipt.findById(req.params.id);
    if (!receipt) {
      return res.status(404).json({ success: false, message: 'Receipt not found' });
    }
    return res.status(200).json({ success: true, data: receipt });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/orders/:id/resend-receipt
 * Manually re-dispatches receipt email for an order
 */
exports.resendReceiptEmail = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.status !== 'PAID') {
      return res.status(400).json({
        success: false,
        message: 'Cannot send receipt for an unpaid order'
      });
    }

    const receipt = await TransactionReceipt.findOne({ orderId: order._id });
    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: 'Transaction receipt record not found for this order'
      });
    }

    const emailResult = await sendReceiptEmail(order, receipt);

    receipt.emailDeliveryStatus = emailResult.success ? 'SENT' : 'FAILED';
    receipt.emailDeliveryDetails = {
      sentAt: new Date(),
      recipientEmail: order.customer.email,
      messageId: emailResult.messageId || null,
      error: emailResult.error || null
    };
    await receipt.save();

    return res.status(200).json({
      success: emailResult.success,
      message: emailResult.success 
        ? `Receipt email successfully resent to ${order.customer.email}` 
        : `Email delivery failed: ${emailResult.error}`,
      deliveryStatus: receipt.emailDeliveryStatus
    });
  } catch (error) {
    next(error);
  }
};
