/**
 * src/controllers/authController.js
 * Authentication Controller handling Registration, Login, Admin Login & Profile
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const AppError = require('../utils/appError');

/**
 * Signs JWT token with standard payload and expiration
 */
const signToken = (user) => {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role
    },
    secret,
    { expiresIn }
  );
};

/**
 * Sanitizes user object to strip sensitive password
 */
const formatUserResponse = (user) => ({
  id: user._id,
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone || '',
  address: user.address || {},
  status: user.status || 'active',
  isActive: user.isActive !== false
});

/**
 * POST /api/auth/register
 * Customer devotee registration
 */
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone, address } = req.body;

    if (!name || !email || !password) {
      return next(new AppError('Please provide name, email, and password.', 400));
    }

    if (password.length < 6) {
      return next(new AppError('Password must be at least 6 characters long.', 400));
    }

    // Check if email already registered
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return next(new AppError('An account with this email address already exists.', 409));
    }

    // Create user (User model pre-save hook handles bcrypt hashing)
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      phone: phone ? phone.trim() : undefined,
      address: address || {},
      role: 'customer',
      isActive: true,
      status: 'active'
    });

    const token = signToken(user);

    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user: formatUserResponse(user)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 * Standard login for Devotees and Administrators
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError('Please provide email and password.', 400));
    }

    // Find user with password included
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user) {
      return next(new AppError('Invalid email or password.', 401));
    }

    // Verify password with bcrypt
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return next(new AppError('Invalid email or password.', 401));
    }

    // Check account status
    if (user.isActive === false || user.status === 'suspended') {
      return next(new AppError('Your account has been suspended. Please contact temple administration.', 403));
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = signToken(user);

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: formatUserResponse(user)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/admin-login
 * Direct Administrative Login Guard (strictly rejects customers)
 */
exports.adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError('Please provide admin email and password.', 400));
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user) {
      return next(new AppError('Invalid administrative credentials.', 401));
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return next(new AppError('Invalid administrative credentials.', 401));
    }

    // RBAC validation: strictly reject non-admin roles
    if (user.role !== 'admin' && user.role !== 'superadmin') {
      return next(new AppError('Access denied: You do not possess administrator credentials.', 403));
    }

    if (user.isActive === false || user.status === 'suspended') {
      return next(new AppError('Administrative account is disabled.', 403));
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const token = signToken(user);

    res.status(200).json({
      success: true,
      message: 'Administrative authentication successful.',
      token,
      user: formatUserResponse(user)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 * Returns profile of current authenticated user
 */
exports.getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      user: formatUserResponse(req.user)
    });
  } catch (error) {
    next(error);
  }
};
