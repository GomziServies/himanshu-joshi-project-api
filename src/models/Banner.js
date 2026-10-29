const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Banner title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters']
    },
    subtitle: {
      type: String,
      trim: true,
      maxlength: [300, 'Subtitle cannot exceed 300 characters']
    },
    imageUrl: {
      type: String,
      required: [true, 'Banner image URL is required'],
      trim: true
    },
    mobileImageUrl: {
      type: String,
      trim: true,
      default: ''
    },
    ctaText: {
      type: String,
      default: 'Book Offering Now',
      trim: true
    },
    ctaLink: {
      type: String,
      default: '/offerings/shivling-sthapana',
      trim: true
    },
    badgeText: {
      type: String,
      trim: true,
      default: ''
    },
    displayOrder: {
      type: Number,
      default: 0,
      index: true
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    startDate: {
      type: Date,
      default: null
    },
    endDate: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

bannerSchema.index({ isActive: 1, displayOrder: 1 });

module.exports = mongoose.model('Banner', bannerSchema);
