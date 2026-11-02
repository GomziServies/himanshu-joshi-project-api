/**
 * src/controllers/productController.js
 * Product & Offering Management Controller (Public Catalog & Admin CRUD)
 */

const Product = require('../models/Product');
const AppError = require('../utils/appError');
const mongoose = require('mongoose');
const escapeRegex = require('../utils/escapeRegex');

// Helper to generate URL-safe slugs
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')        // Replace spaces with -
    .replace(/[^\w\-]+/g, '')    // Remove all non-word chars
    .replace(/\-\-+/g, '-')      // Replace multiple - with single -
    .replace(/^-+|-+$/g, '');    // Trim leading and trailing -
}

/**
 * GET /api/products
 * Public offerings catalog with filtering, search, sorting, and pagination.
 * Exclusively returns active items (isActive: true).
 */
exports.getPublicProducts = async (req, res, next) => {
  try {
    const { category, search, featured, sort, page = 1, limit = 20 } = req.query;

    const query = { isActive: true };

    if (category && typeof category === 'string' && category.trim() !== '') {
      query.category = new RegExp(`^${escapeRegex(category.trim())}$`, 'i');
    }

    if (featured === 'true') {
      query.isFeatured = true;
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      const sanitized = escapeRegex(search.trim());
      const searchRegex = new RegExp(sanitized, 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { shortDescription: searchRegex }
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    // Sorting
    let sortOptions = { isFeatured: -1, displayOrder: 1, createdAt: -1 };
    if (sort === 'price_asc') sortOptions = { price: 1 };
    if (sort === 'price_desc') sortOptions = { price: -1 };
    if (sort === 'newest') sortOptions = { createdAt: -1 };

    const [products, total] = await Promise.all([
      Product.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Product.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages
      },
      data: products
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/products/:slugOrId
 * Public single offering lookup by slug or MongoDB ObjectId.
 */
exports.getProductBySlugOrId = async (req, res, next) => {
  try {
    const { slugOrId } = req.params;
    let product = null;

    if (mongoose.Types.ObjectId.isValid(slugOrId)) {
      product = await Product.findById(slugOrId);
    }

    if (!product) {
      product = await Product.findOne({ slug: slugOrId.toLowerCase() });
    }

    if (!product || (!product.isActive && (!req.user || req.user.role !== 'admin'))) {
      return next(new AppError(`Temple offering '${slugOrId}' not found.`, 404));
    }

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/products
 * Admin products list (returns all offerings including inactive & drafts)
 */
exports.getAdminProducts = async (req, res, next) => {
  try {
    const { category, search, isActive, page = 1, limit = 50 } = req.query;

    const query = {};

    if (category && typeof category === 'string' && category.trim() !== '') {
      query.category = new RegExp(`^${escapeRegex(category.trim())}$`, 'i');
    }

    if (isActive !== undefined && isActive !== '') {
      query.isActive = isActive === 'true';
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      const sanitized = escapeRegex(search.trim());
      const searchRegex = new RegExp(sanitized, 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex }
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(query)
        .sort({ displayOrder: 1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Product.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages
      },
      data: products
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/products
 * Create offering/product
 */
exports.createProduct = async (req, res, next) => {
  try {
    const {
      title,
      slug,
      category,
      subtitle,
      description,
      shortDescription,
      price,
      originalPrice,
      images,
      featuredImage,
      inStock,
      stockQuantity,
      isActive,
      isFeatured,
      displayOrder,
      specifications,
      ritualsIncluded,
      prasadIncludes,
      ritualDetails
    } = req.body;

    if (!title || price === undefined || !description) {
      return next(new AppError('Please provide title, price, and description for the offering.', 400));
    }

    // Auto-generate unique slug if not provided (a Hindi-only title slugifies to an empty string)
    let finalSlug = (slug ? slugify(slug) : slugify(title)) || `product-${Date.now().toString().slice(-6)}`;
    const existingSlug = await Product.findOne({ slug: finalSlug });
    if (existingSlug) {
      finalSlug = `${finalSlug}-${Date.now().toString().slice(-4)}`;
    }

    const product = await Product.create({
      title: title.trim(),
      slug: finalSlug,
      category: category || 'Offering',
      subtitle: subtitle ? subtitle.trim() : undefined,
      description,
      shortDescription: shortDescription || description.slice(0, 200),
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      images: Array.isArray(images) ? images : (images ? [images] : []),
      featuredImage: featuredImage || (Array.isArray(images) && images.length ? images[0] : ''),
      inStock: inStock !== undefined ? inStock : true,
      stockQuantity: stockQuantity !== undefined ? Number(stockQuantity) : 999,
      isActive: isActive !== undefined ? isActive : true,
      isFeatured: isFeatured !== undefined ? isFeatured : false,
      displayOrder: displayOrder !== undefined ? Number(displayOrder) : 0,
      specifications: specifications || [],
      ritualsIncluded: ritualsIncluded || [],
      prasadIncludes: prasadIncludes || [],
      ritualDetails: ritualDetails || undefined
    });

    res.status(201).json({
      success: true,
      message: 'Offering created successfully.',
      data: product
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/products/:id
 * Update existing offering
 */
exports.updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError(`Invalid offering ID format: ${id}`, 400));
    }

    // Renaming keeps the existing slug so the product's URL stays stable
    const updates = { ...req.body };

    const product = await Product.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true
    });

    if (!product) {
      return next(new AppError(`Offering with ID '${id}' not found.`, 404));
    }

    res.status(200).json({
      success: true,
      message: 'Offering updated successfully.',
      data: product
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/admin/products/:id
 * Remove offering
 */
exports.deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError(`Invalid offering ID format: ${id}`, 400));
    }

    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      return next(new AppError(`Offering with ID '${id}' not found.`, 404));
    }

    res.status(200).json({
      success: true,
      message: 'Offering deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};
