/**
 * src/middleware/errorHandler.js
 * Centralized JSON Error Handling Middleware
 * Normalizes Mongoose, JWT, and operational exceptions into a uniform response envelope.
 */

const AppError = require('../utils/appError');

function handleCastErrorDB(err) {
  const message = `Invalid resource identifier format: '${err.value}' for field '${err.path}'.`;
  return new AppError(message, 400);
}

function handleDuplicateFieldsDB(err) {
  const field = Object.keys(err.keyValue || {})[0] || 'field';
  const val = err.keyValue ? err.keyValue[field] : 'value';
  const message = `Duplicate value '${val}' for field '${field}'. Please provide a unique value.`;
  return new AppError(message, 409);
}

function handleValidationErrorDB(err) {
  const errors = Object.values(err.errors || {}).map((el) => ({
    field: el.path,
    message: el.message
  }));
  const message = `Validation failure: ${errors.map((e) => e.message).join('; ')}`;
  const appErr = new AppError(message, 400);
  appErr.errors = errors;
  return appErr;
}

function handleJWTError() {
  return new AppError('Invalid authentication token. Please sign in again.', 401);
}

function handleJWTExpiredError() {
  return new AppError('Authentication session has expired. Please sign in again.', 401);
}

module.exports = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;
  error.name = err.name;

  // Normalize specific database & security errors
  if (err.name === 'CastError') error = handleCastErrorDB(err);
  if (err.code === 11000) error = handleDuplicateFieldsDB(err);
  if (err.name === 'ValidationError') error = handleValidationErrorDB(err);
  if (err.name === 'JsonWebTokenError') error = handleJWTError();
  if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

  const statusCode = error.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  // Log 500 internal errors for debugging
  if (statusCode >= 500) {
    console.error('[Server Error]', err);
  }

  res.status(statusCode).json({
    success: false,
    message: error.message || 'Internal server error occurred.',
    errors: error.errors || undefined,
    ...(isProduction ? {} : { stack: err.stack })
  });
};
