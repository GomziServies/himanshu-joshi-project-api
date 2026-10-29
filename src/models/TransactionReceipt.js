const mongoose = require('mongoose');

const receiptLineItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    subtotal: { type: Number, required: true }
  },
  { _id: false }
);

const transactionReceiptSchema = new mongoose.Schema(
  {
    receiptNumber: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true
    },
    orderNumber: {
      type: String,
      required: true,
      index: true
    },
    customerDetails: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
      sankalpName: { type: String },
      gotra: { type: String },
      address: {
        street: String,
        city: String,
        state: String,
        postalCode: String,
        country: String
      }
    },
    itemizedList: {
      type: [receiptLineItemSchema],
      default: []
    },
    lineItems: {
      type: [receiptLineItemSchema],
      default: []
    },
    amountPaid: {
      type: Number,
      required: true
    },
    financials: {
      subtotal: { type: Number },
      tax: { type: Number, default: 0 },
      totalPaid: { type: Number },
      currency: { type: String, default: 'INR' }
    },
    paymentGateway: {
      type: String,
      default: 'Razorpay'
    },
    gatewayTransactionId: {
      type: String,
      required: true,
      index: true
    },
    gatewayOrderId: {
      type: String,
      required: true
    },
    paymentTimestamp: {
      type: Date,
      default: Date.now
    },
    emailDeliveryStatus: {
      type: String,
      enum: ['PENDING', 'SENT', 'FAILED', 'NOT_ATTEMPTED'],
      default: 'PENDING'
    },
    emailDeliveryDetails: {
      sentAt: { type: Date },
      recipientEmail: { type: String },
      messageId: { type: String },
      error: { type: String }
    },
    issuedBy: {
      type: String,
      default: 'Shree Temple Trust Automated Ledger'
    },
    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

// Populate synchronized fields before validation
transactionReceiptSchema.pre('validate', function (next) {
  if (this.itemizedList && this.itemizedList.length > 0 && (!this.lineItems || this.lineItems.length === 0)) {
    this.lineItems = this.itemizedList;
  } else if (this.lineItems && this.lineItems.length > 0 && (!this.itemizedList || this.itemizedList.length === 0)) {
    this.itemizedList = this.lineItems;
  }
  if (!this.financials || !this.financials.totalPaid) {
    this.financials = {
      subtotal: this.amountPaid,
      tax: 0,
      totalPaid: this.amountPaid,
      currency: 'INR'
    };
  }
  next();
});

// Ledger Immutability Guard: Rejects any attempt to tamper with financial records
transactionReceiptSchema.pre(['updateOne', 'updateMany', 'findOneAndUpdate'], function (next) {
  const update = this.getUpdate();
  const keys = Object.keys(update.$set || update);
  const disallowed = keys.filter(k => 
    !k.startsWith('emailDeliveryStatus') && 
    !k.startsWith('emailDeliveryDetails') &&
    !k.startsWith('emailDelivery')
  );
  if (disallowed.length > 0) {
    return next(new Error(`IMMUTABILITY_VIOLATION: TransactionReceipt fields [${disallowed.join(', ')}] cannot be modified after creation.`));
  }
  next();
});

module.exports = mongoose.model('TransactionReceipt', transactionReceiptSchema);
