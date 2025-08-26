// Request logging middleware
const logger = (req, res, next) => {
  const start = Date.now();
  
  // Log request
  console.log(`📥 ${req.method} ${req.originalUrl} - ${req.ip} - ${new Date().toISOString()}`);
  
  // Log request body for POST/PUT requests (excluding sensitive data)
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const logBody = { ...req.body };
    // Remove sensitive fields
    delete logBody.password;
    delete logBody.password_confirmation;
    delete logBody.token;
    
    if (Object.keys(logBody).length > 0) {
      console.log('📝 Request body:', JSON.stringify(logBody, null, 2));
    }
  }

  // Override res.json to log response
  const originalJson = res.json;
  res.json = function(body) {
    const duration = Date.now() - start;
    
    // Log response
    console.log(`📤 ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
    
    // Log response body for errors or in development
    if (res.statusCode >= 400 || process.env.NODE_ENV === 'development') {
      const logBody = { ...body };
      // Remove sensitive data from logs
      if (logBody.data && logBody.data.password_hash) {
        delete logBody.data.password_hash;
      }
      console.log('📋 Response:', JSON.stringify(logBody, null, 2));
    }
    
    return originalJson.call(this, body);
  };

  next();
};

// API response formatter
const formatResponse = (status, message, data = null, meta = null) => {
  const response = {
    status,
    message,
    timestamp: new Date().toISOString()
  };

  if (data !== null) {
    response.data = data;
  }

  if (meta !== null) {
    response.meta = meta;
  }

  return response;
};

// Success response helper
const successResponse = (res, message, data = null, statusCode = 200, meta = null) => {
  return res.status(statusCode).json(formatResponse('success', message, data, meta));
};

// Error response helper
const errorResponse = (res, message, statusCode = 400, code = null, data = null) => {
  const response = formatResponse('error', message, data);
  if (code) {
    response.code = code;
  }
  return res.status(statusCode).json(response);
};

module.exports = {
  logger,
  formatResponse,
  successResponse,
  errorResponse
};