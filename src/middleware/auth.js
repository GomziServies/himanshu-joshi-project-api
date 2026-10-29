/**
 * src/middleware/auth.js
 * Authentication & Role-Based Access Control (RBAC) Middleware
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/appError');

/**
 * Protect Guard: Verifies JWT token and attaches active user record to req.user.
 */
exports.protect = async (req, res, next) => {
  try {
    let token;

    // 1. Check for Bearer token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1].trim();
    }

    if (!token) {
      return next(new AppError('Authentication required. Please provide a valid Bearer token.', 401));
    }

    // 2. Verify JWT signature & expiration
    const secret = process.env.JWT_SECRET || 'super_secret_temple_platform_jwt_key_shree_shivling_2026_devotee_auth';
    const decoded = jwt.verify(token, secret);

    // 3. Ensure user still exists in database
    const currentUser = await User.findById(decoded.id).select('+role +isActive +status');
    if (!currentUser) {
      return next(new AppError('The user belonging to this token no longer exists.', 401));
    }

    // 4. Verify account is not suspended or inactive
    if (currentUser.isActive === false || currentUser.status === 'suspended') {
      return next(new AppError('This user account has been suspended. Please contact temple administration.', 403));
    }

    // 5. Attach user object to request
    req.user = currentUser;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Admin Only Guard: Restricts endpoint strictly to admin or superadmin roles.
 */
exports.adminOnly = (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Authentication required before checking permissions.', 401));
  }

  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    return next(new AppError('Access forbidden: Administrator privileges required.', 403));
  }

  next();
};

/**
 * Multi-Role Authorization Helper: Restricts access to one or more allowed roles.
 * @param  {...string} roles - e.g. ('admin', 'superadmin')
 */
exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError(`Access forbidden: Role '${req.user ? req.user.role : 'anonymous'}' is unauthorized.`, 403));
    }
    next();
  };
};
