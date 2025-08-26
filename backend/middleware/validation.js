const { body, param, query, validationResult } = require('express-validator');

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      errors: errors.array()
    });
  }
  next();
};

// User registration validation
const validateUserRegistration = [
  body('business_name')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Business name must be between 2 and 255 characters'),
  
  body('owner_name')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Owner name must be between 2 and 255 characters'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('phone')
    .matches(/^\+251[0-9]{9}$/)
    .withMessage('Please provide a valid Ethiopian phone number (+251XXXXXXXXX)'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('business_address')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Business address must not exceed 500 characters'),
  
  body('business_type')
    .optional()
    .isIn(['retail', 'wholesale', 'mixed'])
    .withMessage('Business type must be retail, wholesale, or mixed'),
  
  handleValidationErrors
];

// User login validation
const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

// Inventory item validation
const validateInventoryItem = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Item name is required and must not exceed 255 characters'),
  
  body('category_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Category ID must be a positive integer'),
  
  body('quantity')
    .isInt({ min: 0 })
    .withMessage('Quantity must be a non-negative integer'),
  
  body('cost_price')
    .isFloat({ min: 0 })
    .withMessage('Cost price must be a positive number'),
  
  body('selling_price')
    .isFloat({ min: 0 })
    .withMessage('Selling price must be a positive number')
    .custom((value, { req }) => {
      if (parseFloat(value) <= parseFloat(req.body.cost_price)) {
        throw new Error('Selling price must be higher than cost price');
      }
      return true;
    }),
  
  body('min_threshold')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Minimum threshold must be a non-negative integer'),
  
  body('unit')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Unit must not exceed 50 characters'),
  
  handleValidationErrors
];

// Sales record validation
const validateSaleRecord = [
  body('item_id')
    .isInt({ min: 1 })
    .withMessage('Item ID is required and must be a positive integer'),
  
  body('quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
  
  body('unit_price')
    .isFloat({ min: 0 })
    .withMessage('Unit price must be a positive number'),
  
  body('payment_method')
    .optional()
    .isIn(['cash', 'mobile_money', 'bank_transfer', 'credit'])
    .withMessage('Payment method must be cash, mobile_money, bank_transfer, or credit'),
  
  body('customer_name')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Customer name must not exceed 255 characters'),
  
  body('customer_phone')
    .optional()
    .matches(/^\+251[0-9]{9}$/)
    .withMessage('Please provide a valid Ethiopian phone number (+251XXXXXXXXX)'),
  
  handleValidationErrors
];

// ID parameter validation
const validateId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID must be a positive integer'),
  
  handleValidationErrors
];

// UUID parameter validation
const validateUuid = [
  param('uuid')
    .isUUID()
    .withMessage('Invalid UUID format'),
  
  handleValidationErrors
];

// Pagination validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  handleValidationErrors
];

// Date range validation
const validateDateRange = [
  query('start_date')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  
  query('end_date')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date')
    .custom((value, { req }) => {
      if (req.query.start_date && value < req.query.start_date) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateInventoryItem,
  validateSaleRecord,
  validateId,
  validateUuid,
  validatePagination,
  validateDateRange
};