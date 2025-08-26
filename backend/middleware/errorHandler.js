// Global error handling middleware
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error('Error:', err);

  // MySQL duplicate entry error
  if (err.code === 'ER_DUP_ENTRY') {
    const message = 'Duplicate field value entered';
    error = {
      status: 'error',
      message,
      code: 'DUPLICATE_ENTRY'
    };
    return res.status(400).json(error);
  }

  // MySQL foreign key constraint error
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    const message = 'Referenced resource not found';
    error = {
      status: 'error',
      message,
      code: 'REFERENCE_ERROR'
    };
    return res.status(400).json(error);
  }

  // MySQL connection error
  if (err.code === 'ECONNREFUSED' || err.code === 'ER_ACCESS_DENIED_ERROR') {
    const message = 'Database connection error';
    error = {
      status: 'error',
      message,
      code: 'DATABASE_ERROR'
    };
    return res.status(500).json(error);
  }

  // Validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = {
      status: 'error',
      message,
      code: 'VALIDATION_ERROR'
    };
    return res.status(400).json(error);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = {
      status: 'error',
      message,
      code: 'TOKEN_INVALID'
    };
    return res.status(401).json(error);
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = {
      status: 'error',
      message,
      code: 'TOKEN_EXPIRED'
    };
    return res.status(401).json(error);
  }

  // Default error
  res.status(error.statusCode || 500).json({
    status: 'error',
    message: error.message || 'Internal server error',
    code: error.code || 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// Async error wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  errorHandler,
  asyncHandler
};