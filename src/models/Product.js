const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Product title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['Offering', 'Puja', 'Prasad', 'Seva', 'Ritual', 'Merchandise'],
      default: 'Offering',
      index: true
    },
    subtitle: {
      type: String,
      trim: true,
      maxlength: [300, 'Subtitle cannot exceed 300 characters']
    },
    description: {
      type: String,
      required: [true, 'Product description is required']
    },
    shortDescription: {
      type: String,
      trim: true,
      maxlength: [500, 'Short description cannot exceed 500 characters']
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price must be a positive number']
    },
    originalPrice: {
      type: Number,
      min: [0, 'Original price must be positive'],
      default: null
    },
    currency: {
      type: String,
      default: 'INR'
    },
    images: {
      type: [String],
      default: []
    },
    featuredImage: {
      type: String,
      default: ''
    },
    inStock: {
      type: Boolean,
      default: true
    },
    stockQuantity: {
      type: Number,
      default: 999,
      min: 0
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true
    },
    displayOrder: {
      type: Number,
      default: 0
    },
    prasadIncludes: {
      type: [String],
      default: []
    },
    ritualsIncluded: {
      type: [String],
      default: []
    },
    ritualDetails: {
      duration: { type: String, default: '2 Hours' },
      priestsCount: { type: Number, default: 2 },
      sanctum: { type: String, default: 'Main Temple Sanctum' },
      samagriProvided: { type: Boolean, default: true }
    },
    specifications: [
      {
        key: { type: String, required: true },
        value: { type: String, required: true }
      }
    ]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Compound index for high-performance catalog queries
productSchema.index({ isActive: 1, isFeatured: 1, displayOrder: 1 });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ title: 'text', description: 'text', shortDescription: 'text' });

module.exports = mongoose.model('Product', productSchema);
