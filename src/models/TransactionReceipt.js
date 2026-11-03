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
      unique: true,
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
      sankalpName: { type: String }
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

// Populate synchronized fields before validation (only on initial creation)
transactionReceiptSchema.pre('validate', function (next) {
  if (this.isNew) {
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
  }
  next();
});

// Whitelist of mutable fields: ONLY email dispatch tracking can be updated after creation
const ALLOWED_MUTABLE_PREFIXES = [
  'emailDeliveryStatus',
  'emailDeliveryDetails',
  'emailDelivery'
];

function isPathAllowed(fieldPath) {
  return ALLOWED_MUTABLE_PREFIXES.some(
    prefix => fieldPath === prefix || fieldPath.startsWith(prefix + '.')
  );
}

// 1. Document-level Immutability Guard: Rejects any mutation of existing records via doc.save()
transactionReceiptSchema.pre('save', function (next) {
  if (!this.isNew) {
    const modifiedPaths = this.modifiedPaths();
    const disallowed = modifiedPaths.filter(path => !isPathAllowed(path));
    if (disallowed.length > 0) {
      const uniqueDisallowed = [...new Set(disallowed)];
      return next(
        new Error(
          `IMMUTABILITY_VIOLATION: TransactionReceipt fields [${uniqueDisallowed.join(', ')}] cannot be modified after creation.`
        )
      );
    }
  }
  next();
});

// 2. Query-level Immutability Guard: Inspects all update operators ($set, $inc, $unset, $mul, etc.)
// while filtering out benign initialization operators ($setOnInsert)
transactionReceiptSchema.pre(['updateOne', 'updateMany', 'findOneAndUpdate'], function (next) {
  const update = this.getUpdate();
  if (!update) return next();

  const modifiedFieldPaths = [];

  const inspectPayload = (payload) => {
    if (!payload || typeof payload !== 'object') return;
    for (const [key, val] of Object.entries(payload)) {
      if (key === '$setOnInsert') {
        // Ignored: only applies during initial insertion on upserts
        continue;
      }
      if (key.startsWith('$')) {
        // Inspect operators: $set, $inc, $unset, $mul, $rename, $min, $max, $push, $pull, etc.
        if (val && typeof val === 'object' && !Array.isArray(val)) {
          modifiedFieldPaths.push(...Object.keys(val));
        }
      } else {
        // Direct field assignment
        modifiedFieldPaths.push(key);
      }
    }
  };

  if (Array.isArray(update)) {
    // MongoDB 4.2+ aggregation pipeline updates
    for (const stage of update) {
      inspectPayload(stage);
    }
  } else {
    inspectPayload(update);
  }

  const disallowed = modifiedFieldPaths.filter(path => !isPathAllowed(path));
  if (disallowed.length > 0) {
    const uniqueDisallowed = [...new Set(disallowed)];
    return next(
      new Error(
        `IMMUTABILITY_VIOLATION: TransactionReceipt fields [${uniqueDisallowed.join(', ')}] cannot be modified after creation.`
      )
    );
  }

  next();
});

module.exports = mongoose.model('TransactionReceipt', transactionReceiptSchema);
