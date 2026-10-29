const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: false
    },
    productTitle: {
      type: String,
      required: true
    },
    productSlug: {
      type: String,
      default: ''
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
      default: 1
    },
    unitPrice: {
      type: Number,
      required: true,
      min: [0, 'Unit price must be non-negative']
    },
    subtotal: {
      type: Number,
      required: true,
      min: [0, 'Subtotal must be non-negative']
    }
  },
  { _id: false }
);

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Devotee name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true
    },
    sankalpName: {
      type: String,
      default: function() { return this.name; },
      trim: true
    },
    gotra: {
      type: String,
      trim: true,
      default: 'Kashyapa' // Auspicious default if family Gotra is unknown
    },
    nakshatra: {
      type: String,
      trim: true,
      default: ''
    },
    prayerIntention: {
      type: String,
      trim: true,
      default: 'Family Peace, Health & Spiritual Auspiciousness'
    },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      postalCode: { type: String, default: '' },
      country: { type: String, default: 'India' }
    }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    customer: {
      type: customerSchema,
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: [val => val.length > 0, 'Order must contain at least one item']
    },
    subtotalAmount: {
      type: Number,
      default: function() { return this.totalAmount || 0; },
      min: 0
    },
    taxAmount: {
      type: Number,
      default: 0
    },
    totalAmount: {
      type: Number,
      required: true,
      min: [0, 'Total amount must be non-negative']
    },
    currency: {
      type: String,
      default: 'INR'
    },
    status: {
      type: String,
      enum: ['CREATED', 'PENDING', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED'],
      default: 'CREATED',
      index: true
    },
    paymentStatus: {
      type: String,
      enum: ['UNPAID', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'REFUNDED'],
      default: 'UNPAID',
      index: true
    },
    paymentGateway: {
      type: String,
      default: 'Razorpay'
    },
    razorpayOrderId: {
      type: String,
      index: true,
      default: null
    },
    razorpayPaymentId: {
      type: String,
      index: true,
      default: null
    },
    razorpaySignature: {
      type: String,
      default: null
    },
    receiptDispatched: {
      type: Boolean,
      default: false
    },
    receiptDispatchedAt: {
      type: Date,
      default: null
    },
    receiptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TransactionReceipt',
      default: null
    },
    adminNotes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

orderSchema.index({ 'customer.email': 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
