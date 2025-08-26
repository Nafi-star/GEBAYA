const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { promisify } = require('util');

// Promisify database query
const query = promisify(db.query).bind(db);

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Access token is required',
        code: 'TOKEN_MISSING'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const users = await query(
      'SELECT id, uuid, business_name, owner_name, email, phone, is_active FROM users WHERE id = ? AND is_active = TRUE',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token - user not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Add user to request object
    req.user = users[0];
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token',
        code: 'TOKEN_INVALID'
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    } else {
      console.error('Auth middleware error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Authentication error',
        code: 'AUTH_ERROR'
      });
    }
  }
};

// Middleware to check if user owns the resource
const checkResourceOwnership = (resourceIdParam = 'id') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[resourceIdParam];
      const userId = req.user.id;

      // This is a generic check - specific routes should implement their own logic
      req.resourceId = resourceId;
      req.userId = userId;
      
      next();
    } catch (error) {
      console.error('Resource ownership check error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Authorization error',
        code: 'AUTH_ERROR'
      });
    }
  };
};

// Middleware to check subscription plan
const checkSubscriptionPlan = (requiredPlan = 'free') => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const planHierarchy = { free: 0, basic: 1, premium: 2 };
      
      const userPlanLevel = planHierarchy[user.subscription_plan] || 0;
      const requiredPlanLevel = planHierarchy[requiredPlan] || 0;

      if (userPlanLevel < requiredPlanLevel) {
        return res.status(403).json({
          status: 'error',
          message: `This feature requires ${requiredPlan} subscription`,
          code: 'SUBSCRIPTION_REQUIRED',
          required_plan: requiredPlan,
          current_plan: user.subscription_plan
        });
      }

      next();
    } catch (error) {
      console.error('Subscription check error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Subscription check error',
        code: 'SUBSCRIPTION_ERROR'
      });
    }
  };
};

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Verify token without middleware (for utilities)
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

module.exports = {
  authenticateToken,
  checkResourceOwnership,
  checkSubscriptionPlan,
  generateToken,
  verifyToken
};