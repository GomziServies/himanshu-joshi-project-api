/**
 * Order & Payment Controller
 * Enforces zero client financial trust, server-side paise math, and timing-safe verification.
 */
const crypto = require('crypto');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Order = require('../models/Order');
const TransactionReceipt = require('../models/TransactionReceipt');
const { createRazorpayOrder, verifyPaymentSignature } = require('../services/razorpayService');
const { sendReceiptEmail } = require('../services/emailService');
const escapeRegex = require('../utils/escapeRegex');

const MAX_QUANTITY_PER_ITEM = 20;

/**
 * POST /api/orders/create-order
 * Validates items against DB, computes authoritative sum in paise, creates Razorpay order.
 */
exports.createOrder = async (req, res, next) => {
  try {
    const { customer, items } = req.body;

    // 1. Customer validation
    if (!customer || !customer.name || !customer.email || !customer.phone) {
      return res.status(400).json({
        success: false,
        message: 'Devotee details (name, email, phone) are required'
      });
    }

    // 2. Items validation
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order must contain at least one offering item'
      });
    }

    // 3. Database query for authoritative product prices (REJECTS client price injection)
    const productIds = items.map(item => item.productId).filter(Boolean);
    if (productIds.length !== items.length) {
      return res.status(400).json({
        success: false,
        message: 'Each item must have a valid productId'
      });
    }

    const products = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map(products.map(p => [p._id.toString(), p]));

    let calculatedTotalINR = 0;
    const validatedItems = [];

    for (const item of items) {
      const product = productMap.get(String(item.productId));
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product offering with ID ${item.productId} was not found`
        });
      }

      if (product.isActive === false) {
        return res.status(400).json({
          success: false,
          message: `Offering "${product.title}" is currently not available`
        });
      }

      const quantity = Math.max(1, parseInt(item.quantity, 10) || 1);
      if (quantity > MAX_QUANTITY_PER_ITEM) {
        return res.status(400).json({
          success: false,
          message: `You can order at most ${MAX_QUANTITY_PER_ITEM} of "${product.title}" at a time`
        });
      }

      const unitPrice = product.price; // AUTHORITATIVE DATABASE PRICE
      const subtotal = unitPrice * quantity;
      calculatedTotalINR += subtotal;

      validatedItems.push({
        product: product._id,
        productTitle: product.title,
        productSlug: product.slug,
        quantity,
        unitPrice,
        subtotal
      });
    }

    if (calculatedTotalINR <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Total offering amount must be greater than zero'
      });
    }

    // 4. Exact calculation in paise (INR * 100)
    const amountInPaise = Math.round(calculatedTotalINR * 100);

    // 5. Generate unique temple order number: ORD-YYYYMMDD-XXXXXX
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    const orderNumber = `ORD-${dateStr}-${randomSuffix}`;

    // 6. Persist order in MongoDB
    const order = new Order({
      orderNumber,
      customer: {
        name: customer.name.trim(),
        email: customer.email.trim().toLowerCase(),
        phone: customer.phone.trim(),
        sankalpName: (customer.sankalpName || customer.name).trim()
      },
      userId: req.user ? req.user._id : undefined,
      items: validatedItems,
      subtotalAmount: calculatedTotalINR,
      totalAmount: calculatedTotalINR,
      currency: 'INR',
      status: 'CREATED',
      paymentStatus: 'UNPAID'
    });

    // 7. Initiate Gateway Order
    const rzpOrder = await createRazorpayOrder({
      amountInPaise,
      currency: 'INR',
      receipt: orderNumber,
      notes: {
        orderNumber,
        customerEmail: customer.email,
        sankalpName: customer.sankalpName || customer.name
      }
    });

    const isTest = Boolean(rzpOrder.isDemo);
    order.razorpayOrderId = rzpOrder.id;
    order.isTest = isTest;
    await order.save();

    return res.status(201).json({
      success: true,
      orderId: order._id,
      orderNumber: order.orderNumber,
      razorpayOrderId: rzpOrder.id,
      amount: amountInPaise,
      currency: 'INR',
      key: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
      isDemo: isTest
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/orders/verify-payment
 * Cryptographic HMAC-SHA256 signature verification, idempotency guard, receipt creation, email dispatch.
 */
exports.verifyPayment = async (req, res, next) => {
  try {
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing required payment verification tokens'
      });
    }

    // Defensive validation for orderId format if provided
    if (orderId && !mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order identifier format'
      });
    }

    // 1. Locate Order
    const query = orderId ? { _id: orderId } : { razorpayOrderId: razorpay_order_id };
    const order = await Order.findOne(query);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order record not found'
      });
    }

    // 2. CRITICAL SECURITY ASSERTION: Cross-Order Token Substitution Guard
    // When verifying payments, ensure order.razorpayOrderId === razorpay_order_id is strictly asserted before marking order as PAID.
    if (!order.razorpayOrderId || order.razorpayOrderId !== razorpay_order_id) {
      return res.status(400).json({
        success: false,
        message: 'Gateway order ID does not match order record'
      });
    }

    // 3. IDEMPOTENCY CHECK: If already marked PAID, return existing receipt without duplicate actions
    if (order.status === 'PAID') {
      const existingReceipt = await TransactionReceipt.findOne({ orderId: order._id });
      return res.status(200).json({
        success: true,
        message: 'Payment already verified',
        orderId: order._id,
        orderNumber: order.orderNumber,
        receiptNumber: existingReceipt ? existingReceipt.receiptNumber : null,
        amount: order.totalAmount,
        isDuplicate: true
      });
    }

    // 3. Cryptographic Signature Verification
    const isAuthentic = verifyPaymentSignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    });

    if (!isAuthentic) {
      order.status = 'FAILED';
      order.paymentStatus = 'FAILED';
      await order.save();
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

    // 4. Atomic Transition to PAID
    order.status = 'PAID';
    order.paymentStatus = 'CAPTURED';
    order.razorpayPaymentId = razorpay_payment_id;
    order.razorpaySignature = razorpay_signature;
    await order.save();

    // 5. Create Immutable TransactionReceipt
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    const receiptNumber = `RCPT-${dateStr}-${randomSuffix}`;

    const receipt = new TransactionReceipt({
      receiptNumber,
      orderId: order._id,
      orderNumber: order.orderNumber,
      customerDetails: {
        name: order.customer.name,
        email: order.customer.email,
        phone: order.customer.phone,
        sankalpName: order.customer.sankalpName
      },
      itemizedList: order.items.map(item => ({
        title: item.productTitle,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal
      })),
      lineItems: order.items.map(item => ({
        title: item.productTitle,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal
      })),
      amountPaid: order.totalAmount,
      financials: {
        subtotal: order.subtotalAmount || order.totalAmount,
        tax: order.taxAmount || 0,
        totalPaid: order.totalAmount,
        currency: order.currency || 'INR'
      },
      paymentGateway: 'Razorpay',
      gatewayTransactionId: razorpay_payment_id,
      gatewayOrderId: razorpay_order_id,
      paymentTimestamp: new Date(),
      emailDeliveryStatus: 'PENDING'
    });
    await receipt.save();

    order.receiptId = receipt._id;
    await order.save();

    // 6. Non-Blocking Email Dispatch
    sendReceiptEmail(order, receipt)
      .then(async (emailResult) => {
        try {
          await TransactionReceipt.findByIdAndUpdate(receipt._id, {
            $set: {
              emailDeliveryStatus: emailResult.success ? 'SENT' : 'FAILED',
              emailDeliveryDetails: {
                sentAt: new Date(),
                recipientEmail: order.customer?.email || receipt.customerDetails?.email,
                messageId: emailResult.messageId || null,
                error: emailResult.error || null
              }
            }
          });

          await Order.findByIdAndUpdate(order._id, {
            $set: {
              receiptDispatched: emailResult.success,
              receiptDispatchedAt: new Date()
            }
          });
        } catch (saveErr) {
          console.error('[orderController] Non-blocking receipt status update error:', saveErr.message);
        }
      })
      .catch(async (err) => {
        try {
          await TransactionReceipt.findByIdAndUpdate(receipt._id, {
            $set: {
              emailDeliveryStatus: 'FAILED',
              emailDeliveryDetails: {
                sentAt: new Date(),
                recipientEmail: order.customer?.email || receipt.customerDetails?.email,
                error: err.message
              }
            }
          });
        } catch (innerErr) {
          console.error('[orderController] Non-blocking email error logging failed:', innerErr.message);
        }
      });

    // 7. Instant Response to Devotee
    return res.status(200).json({
      success: true,
      message: 'Payment verified and receipt dispatched successfully',
      orderId: order._id,
      orderNumber: order.orderNumber,
      receiptNumber: receipt.receiptNumber,
      amount: order.totalAmount
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/orders/:id
 * Retrieve order details by ID
 */
exports.getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    return res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/orders
 * Admin paginated orders list with status/search filters
 */
exports.getAdminOrders = async (req, res, next) => {
  try {
    const { status, paymentStatus, search, page = 1, limit = 20 } = req.query;

    const filter = {};
    // status accepts one value or a comma-separated list (e.g. CREATED,PENDING,FAILED)
    if (status && typeof status === 'string') filter.status = { $in: status.split(',') };
    if (paymentStatus && typeof paymentStatus === 'string') filter.paymentStatus = paymentStatus;
    if (search && typeof search === 'string' && search.trim() !== '') {
      const sanitized = escapeRegex(search.trim());
      const searchRegex = new RegExp(sanitized, 'i');
      filter.$or = [
        { orderNumber: searchRegex },
        { 'customer.name': searchRegex },
        { 'customer.email': searchRegex },
        { 'customer.phone': searchRegex },
        { razorpayOrderId: searchRegex },
        { razorpayPaymentId: searchRegex }
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('receiptId')
        .lean(),
      Order.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    return res.status(200).json({
      success: true,
      count: orders.length,
      total,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages
      },
      data: orders
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admin/orders/:id/status
 * Update order status or admin notes
 */
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, paymentStatus, adminNotes } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (status) order.status = status;
    if (paymentStatus) order.paymentStatus = paymentStatus;
    if (adminNotes !== undefined) order.adminNotes = adminNotes;

    await order.save();

    return res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data: order
    });
  } catch (error) {
    next(error);
  }
};
