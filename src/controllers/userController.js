/**
 * src/controllers/userController.js
 * Admin Devotee Accounts Management Controller
 */

const User = require('../models/User');
const Order = require('../models/Order');
const AppError = require('../utils/appError');
const mongoose = require('mongoose');
const escapeRegex = require('../utils/escapeRegex');

/**
 * GET /api/admin/users
 * Devotee accounts directory with search and pagination
 */
exports.getAdminUsers = async (req, res, next) => {
  try {
    const { search, role, status, page = 1, limit = 20 } = req.query;

    const query = {};

    if (role) {
      query.role = role;
    }

    if (status) {
      query.status = status;
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      const sanitized = escapeRegex(search.trim());
      const searchRegex = new RegExp(sanitized, 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex }
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      User.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages
      },
      data: users
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/users/:id
 * Devotee profile inspection with order history
 */
exports.getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError(`Invalid user ID format: ${id}`, 400));
    }

    const user = await User.findById(id).select('-password').lean();
    if (!user) {
      return next(new AppError(`User with ID '${id}' not found.`, 404));
    }

    // Lookup user orders if Order collection exists
    let userOrders = [];
    try {
      userOrders = await Order.find({
        $or: [
          { userId: id },
          { 'customer.email': user.email }
        ]
      }).sort({ createdAt: -1 }).limit(20).lean();
    } catch (orderErr) {
      // Non-blocking if orders collection is empty
    }

    res.status(200).json({
      success: true,
      data: {
        ...user,
        orders: userOrders
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admin/users/:id/status
 * Suspend or reactivate user account
 */
exports.updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, isActive } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new AppError(`Invalid user ID format: ${id}`, 400));
    }

    // Safety guard: prevent administrator from suspending their own account
    if (req.user && req.user._id.toString() === id) {
      return next(new AppError('Self-suspension violation: You cannot suspend your own administrator account.', 400));
    }

    const user = await User.findById(id);
    if (!user) {
      return next(new AppError(`User with ID '${id}' not found.`, 404));
    }

    if (status) {
      user.status = status; // 'active' | 'suspended'
      user.isActive = status === 'active';
    } else if (typeof isActive === 'boolean') {
      user.isActive = isActive;
      user.status = isActive ? 'active' : 'suspended';
    }

    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: `User account status updated to '${user.status}'.`,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        isActive: user.isActive
      }
    });
  } catch (error) {
    next(error);
  }
};
