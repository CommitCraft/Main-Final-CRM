const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    user: req.user ? req.user.id : 'anonymous'
  });

  // MySQL duplicate entry error
  if (err.code === 'ER_DUP_ENTRY') {
    const message = 'Duplicate entry error';
    error = { message, statusCode: 400 };
  }

  // MySQL foreign key constraint error
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    const message = 'Referenced record does not exist';
    error = { message, statusCode: 400 };
  }

  // MySQL syntax error
  if (err.code === 'ER_PARSE_ERROR') {
    const message = 'Database query error';
    error = { message, statusCode: 500 };
  }

  // MySQL connection error
  if (err.code === 'ECONNREFUSED' || err.code === 'ER_ACCESS_DENIED_ERROR') {
    const message = 'Database connection error';
    error = { message, statusCode: 500 };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { message, statusCode: 401 };
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = { message, statusCode: 401 };
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error = { message, statusCode: 400 };
  }

  // Multer errors (file upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = 'File too large';
    error = { message, statusCode: 413 };
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    const message = 'Unexpected file field';
    error = { message, statusCode: 400 };
  }

  // Cast error (invalid ObjectId format)
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { message, statusCode: 404 };
  }

  // Default error response
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  const response = {
    success: false,
    message: message,
    timestamp: new Date().toISOString()
  };

  // Include error details in development
  if (process.env.NODE_ENV === 'development') {
    response.error = {
      name: err.name,
      code: err.code,
      stack: err.stack,
      details: err
    };
  }

  // Include request info for debugging
  if (process.env.NODE_ENV === 'development') {
    response.request = {
      method: req.method,
      url: req.originalUrl,
      headers: req.headers,
      body: req.body,
      params: req.params,
      query: req.query
    };
  }

  res.status(statusCode).json(response);
};

// 404 Handler
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Async error handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Custom error class
class AppError extends Error {
  constructor(message, statusCode = 500, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Validation error handler
const handleValidationError = (errors) => {
  const errorMessages = errors.array().map(error => ({
    field: error.param,
    message: error.msg,
    value: error.value,
    location: error.location
  }));

  return {
    success: false,
    message: 'Validation failed',
    errors: errorMessages,
    timestamp: new Date().toISOString()
  };
};

// Database error handler
const handleDatabaseError = (error) => {
  let message = 'Database operation failed';
  let statusCode = 500;

  switch (error.code) {
    case 'ER_DUP_ENTRY':
      message = 'Record already exists';
      statusCode = 409;
      break;
    case 'ER_NO_REFERENCED_ROW_2':
      message = 'Referenced record does not exist';
      statusCode = 400;
      break;
    case 'ER_ROW_IS_REFERENCED_2':
      message = 'Cannot delete record with dependencies';
      statusCode = 409;
      break;
    case 'ER_DATA_TOO_LONG':
      message = 'Data too long for field';
      statusCode = 400;
      break;
    case 'ER_NO_DEFAULT_FOR_FIELD':
      message = 'Missing required field';
      statusCode = 400;
      break;
    case 'ECONNREFUSED':
      message = 'Database connection refused';
      statusCode = 503;
      break;
    case 'ER_ACCESS_DENIED_ERROR':
      message = 'Database access denied';
      statusCode = 503;
      break;
  }

  return new AppError(message, statusCode, error.code);
};

module.exports = {
  errorHandler,
  notFound,
  asyncHandler,
  AppError,
  handleValidationError,
  handleDatabaseError
};