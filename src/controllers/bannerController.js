/**
 * src/controllers/bannerController.js
 * Promotional Banner Management Controller (Public & Admin with Optimistic Toggle)
 */

const Banner = require('../models/Banner');
const AppError = require('../utils/appError');
const mongoose = require('mongoose');

/**
 * GET /api/banners
 * Public promotional banners (strictly active items sorted by displayOrder ascending)
 */
exports.getPublicBanners = async (req, res, next) => {
  try {
    const now = new Date();
    const query = {
      isActive: true,
      $or: [
        { startDate: { $exists: false } },
        { startDate: null },
        { startDate: { $lte: now } }
      ],
      $and: [
        {
          $or: [
            { endDate: { $exists: false } },
            { endDate: null },
            { endDate: { $gte: now } }
          ]
        }
      ]
    };

    const banners = await Banner.find(query)
      .sort({ displayOrder: 1, createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: banners.length,
      data: banners
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/banners
 * Admin banners list (all items, including inactive and expired)
 */
exports.getAdminBanners = async (req, res, next) => {
  try {
    const banners = await Banner.find()
      .sort({ displayOrder: 1, createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: banners.length,
      data: banners
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/banners
 * Create promotional banner
 */
exports.createBanner = async (req, res, next) => {
  try {
    const { title, subtitle, imageUrl, mobileImageUrl, ctaText, ctaLink, badgeText, displayOrder, isActive, startDate, endDate } = req.body;

    if (!title || !imageUrl) {
      return next(new AppError('Please provide title and imageUrl for the banner.', 400));
    }

    // Auto-calculate displayOrder if not provided
    let orderNum = displayOrder !== undefined ? Number(displayOrder) : 0;
    if (displayOrder === undefined) {
      const highestBanner = await Banner.findOne().sort({ displayOrder: -1 });
      orderNum = highestBanner ? highestBanner.displayOrder + 1 : 1;
    }

    const banner = await Banner.create({
      title: title.trim(),
      subtitle: subtitle ? subtitle.trim() : '',
      imageUrl: imageUrl.trim(),
      mobileImageUrl: mobileImageUrl ? mobileImageUrl.trim() : '',
      ctaText: ctaText || 'Book Offering Now',
      ctaLink: ctaLink || '/offerings/shivling-sthapana',
      badgeText: badgeText ? badgeText.trim() : '',
      displayOrder: orderNum,
      isActive: isActive !== undefined ? isActive : true,
      startDate: startDate || null,
      endDate: endDate || null
    });

    res.status(201).json({
      success: true,
      message: 'Promotional banner created successfully.',
      data: banner
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/banners/:id
 * Update promotional banner
 */
exports.updateBanner = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError(`Invalid banner ID format: ${id}`, 400));
    }

    const banner = await Banner.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true
    });

    if (!banner) {
      return next(new AppError(`Banner with ID '${id}' not found.`, 404));
    }

    res.status(200).json({
      success: true,
      message: 'Banner updated successfully.',
      data: banner
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admin/banners/:id/toggle (and /api/banners/:id/toggle)
 * Instant active/inactive toggle endpoint for dashboard switch component
 */
exports.toggleBannerStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError(`Invalid banner ID format: ${id}`, 400));
    }

    const banner = await Banner.findById(id);
    if (!banner) {
      return next(new AppError(`Banner with ID '${id}' not found.`, 404));
    }

    // Toggle logic: if explicit boolean passed, use it; otherwise flip existing state
    banner.isActive = typeof isActive === 'boolean' ? isActive : !banner.isActive;
    await banner.save();

    res.status(200).json({
      success: true,
      message: `Banner status toggled to ${banner.isActive ? 'Active' : 'Inactive'}.`,
      data: banner
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/admin/banners/:id
 * Remove promotional banner
 */
exports.deleteBanner = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError(`Invalid banner ID format: ${id}`, 400));
    }

    const banner = await Banner.findByIdAndDelete(id);
    if (!banner) {
      return next(new AppError(`Banner with ID '${id}' not found.`, 404));
    }

    res.status(200).json({
      success: true,
      message: 'Banner deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};
