const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { validatePagination } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const { successResponse, errorResponse } = require('../middleware/logger');
const { promisify } = require('util');

const router = express.Router();
const query = promisify(db.query).bind(db);

// @route   GET /api/wholesalers
// @desc    Get all wholesalers
// @access  Private
router.get('/', authenticateToken, validatePagination, asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;
  const search = req.query.search || '';
  const location = req.query.location || '';
  const verified_only = req.query.verified_only === 'true';

  // Build WHERE clause
  let whereClause = 'WHERE w.is_active = TRUE';
  let queryParams = [];

  if (search) {
    whereClause += ' AND (w.name LIKE ? OR w.contact_person LIKE ? OR JSON_SEARCH(w.specialties, "one", ?) IS NOT NULL)';
    const searchTerm = `%${search}%`;
    queryParams.push(searchTerm, searchTerm, searchTerm);
  }

  if (location) {
    whereClause += ' AND w.location LIKE ?';
    queryParams.push(`%${location}%`);
  }

  if (verified_only) {
    whereClause += ' AND w.is_verified = TRUE';
  }

  // Get total count
  const countQuery = `
    SELECT COUNT(*) as total
    FROM wholesalers w
    ${whereClause}
  `;
  const countResult = await query(countQuery, queryParams);
  const total = countResult[0].total;

  // Get wholesalers with pagination
  const wholesalersQuery = `
    SELECT 
      w.id,
      w.uuid,
      w.name,
      w.contact_person,
      w.phone,
      w.whatsapp,
      w.email,
      w.address,
      w.location,
      w.specialties,
      w.rating,
      w.total_reviews,
      w.is_verified,
      COUNT(wp.id) as product_count
    FROM wholesalers w
    LEFT JOIN wholesaler_products wp ON w.id = wp.wholesaler_id AND wp.is_active = TRUE
    ${whereClause}
    GROUP BY w.id
    ORDER BY w.is_verified DESC, w.rating DESC, w.name ASC
    LIMIT ? OFFSET ?
  `;

  queryParams.push(limit, offset);
  const wholesalers = await query(wholesalersQuery, queryParams);

  // Parse JSON specialties
  wholesalers.forEach(wholesaler => {
    if (wholesaler.specialties) {
      try {
        wholesaler.specialties = JSON.parse(wholesaler.specialties);
      } catch (e) {
        wholesaler.specialties = [];
      }
    } else {
      wholesaler.specialties = [];
    }
  });

  const meta = {
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };

  successResponse(res, 'Wholesalers retrieved successfully', wholesalers, 200, meta);
}));

// @route   GET /api/wholesalers/:id
// @desc    Get single wholesaler with products
// @access  Private
router.get('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const wholesalerId = req.params.id;

  // Get wholesaler details
  const wholesalerQuery = `
    SELECT 
      w.*,
      COUNT(wp.id) as product_count
    FROM wholesalers w
    LEFT JOIN wholesaler_products wp ON w.id = wp.wholesaler_id AND wp.is_active = TRUE
    WHERE w.id = ? AND w.is_active = TRUE
    GROUP BY w.id
  `;

  const wholesalers = await query(wholesalerQuery, [wholesalerId]);

  if (wholesalers.length === 0) {
    return errorResponse(res, 'Wholesaler not found', 404, 'WHOLESALER_NOT_FOUND');
  }

  const wholesaler = wholesalers[0];

  // Parse JSON specialties
  if (wholesaler.specialties) {
    try {
      wholesaler.specialties = JSON.parse(wholesaler.specialties);
    } catch (e) {
      wholesaler.specialties = [];
    }
  } else {
    wholesaler.specialties = [];
  }

  // Get wholesaler products
  const productsQuery = `
    SELECT 
      wp.id,
      wp.uuid,
      wp.name,
      wp.name_amharic,
      wp.description,
      wp.unit_price,
      wp.min_order_quantity,
      wp.unit,
      wp.availability_status,
      wp.image_url,
      wp.last_updated,
      c.name as category_name,
      c.name_amharic as category_name_amharic
    FROM wholesaler_products wp
    LEFT JOIN categories c ON wp.category_id = c.id
    WHERE wp.wholesaler_id = ? AND wp.is_active = TRUE
    ORDER BY wp.name ASC
  `;

  const products = await query(productsQuery, [wholesalerId]);
  wholesaler.products = products;

  successResponse(res, 'Wholesaler retrieved successfully', wholesaler);
}));

// @route   GET /api/wholesalers/:id/products
// @desc    Get products from a specific wholesaler
// @access  Private
router.get('/:id/products', authenticateToken, validatePagination, asyncHandler(async (req, res) => {
  const wholesalerId = req.params.id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;
  const search = req.query.search || '';
  const category_id = req.query.category_id || '';
  const availability = req.query.availability || '';

  // Check if wholesaler exists
  const wholesalerExists = await query(
    'SELECT id FROM wholesalers WHERE id = ? AND is_active = TRUE',
    [wholesalerId]
  );

  if (wholesalerExists.length === 0) {
    return errorResponse(res, 'Wholesaler not found', 404, 'WHOLESALER_NOT_FOUND');
  }

  // Build WHERE clause
  let whereClause = 'WHERE wp.wholesaler_id = ? AND wp.is_active = TRUE';
  let queryParams = [wholesalerId];

  if (search) {
    whereClause += ' AND (wp.name LIKE ? OR wp.name_amharic LIKE ? OR wp.description LIKE ?)';
    const searchTerm = `%${search}%`;
    queryParams.push(searchTerm, searchTerm, searchTerm);
  }

  if (category_id) {
    whereClause += ' AND wp.category_id = ?';
    queryParams.push(category_id);
  }

  if (availability) {
    whereClause += ' AND wp.availability_status = ?';
    queryParams.push(availability);
  }

  // Get total count
  const countQuery = `
    SELECT COUNT(*) as total
    FROM wholesaler_products wp
    ${whereClause}
  `;
  const countResult = await query(countQuery, queryParams);
  const total = countResult[0].total;

  // Get products with pagination
  const productsQuery = `
    SELECT 
      wp.id,
      wp.uuid,
      wp.name,
      wp.name_amharic,
      wp.description,
      wp.unit_price,
      wp.min_order_quantity,
      wp.unit,
      wp.availability_status,
      wp.image_url,
      wp.last_updated,
      c.name as category_name,
      c.name_amharic as category_name_amharic,
      w.name as wholesaler_name,
      w.phone as wholesaler_phone,
      w.whatsapp as wholesaler_whatsapp
    FROM wholesaler_products wp
    LEFT JOIN categories c ON wp.category_id = c.id
    INNER JOIN wholesalers w ON wp.wholesaler_id = w.id
    ${whereClause}
    ORDER BY wp.availability_status ASC, wp.name ASC
    LIMIT ? OFFSET ?
  `;

  queryParams.push(limit, offset);
  const products = await query(productsQuery, queryParams);

  const meta = {
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };

  successResponse(res, 'Wholesaler products retrieved successfully', products, 200, meta);
}));

// @route   GET /api/wholesalers/products/search
// @desc    Search products across all wholesalers
// @access  Private
router.get('/products/search', authenticateToken, validatePagination, asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;
  const search = req.query.search || '';
  const category_id = req.query.category_id || '';
  const location = req.query.location || '';
  const max_price = req.query.max_price || '';
  const availability = req.query.availability || 'in_stock';

  if (!search && !category_id) {
    return errorResponse(res, 'Search term or category is required', 400, 'SEARCH_REQUIRED');
  }

  // Build WHERE clause
  let whereClause = 'WHERE wp.is_active = TRUE AND w.is_active = TRUE';
  let queryParams = [];

  if (search) {
    whereClause += ' AND (wp.name LIKE ? OR wp.name_amharic LIKE ? OR wp.description LIKE ?)';
    const searchTerm = `%${search}%`;
    queryParams.push(searchTerm, searchTerm, searchTerm);
  }

  if (category_id) {
    whereClause += ' AND wp.category_id = ?';
    queryParams.push(category_id);
  }

  if (location) {
    whereClause += ' AND w.location LIKE ?';
    queryParams.push(`%${location}%`);
  }

  if (max_price) {
    whereClause += ' AND wp.unit_price <= ?';
    queryParams.push(max_price);
  }

  if (availability) {
    whereClause += ' AND wp.availability_status = ?';
    queryParams.push(availability);
  }

  // Get total count
  const countQuery = `
    SELECT COUNT(*) as total
    FROM wholesaler_products wp
    INNER JOIN wholesalers w ON wp.wholesaler_id = w.id
    ${whereClause}
  `;
  const countResult = await query(countQuery, queryParams);
  const total = countResult[0].total;

  // Get products with pagination
  const productsQuery = `
    SELECT 
      wp.id,
      wp.uuid,
      wp.name,
      wp.name_amharic,
      wp.description,
      wp.unit_price,
      wp.min_order_quantity,
      wp.unit,
      wp.availability_status,
      wp.image_url,
      wp.last_updated,
      c.name as category_name,
      c.name_amharic as category_name_amharic,
      w.id as wholesaler_id,
      w.name as wholesaler_name,
      w.contact_person as wholesaler_contact,
      w.phone as wholesaler_phone,
      w.whatsapp as wholesaler_whatsapp,
      w.location as wholesaler_location,
      w.rating as wholesaler_rating,
      w.is_verified as wholesaler_verified
    FROM wholesaler_products wp
    LEFT JOIN categories c ON wp.category_id = c.id
    INNER JOIN wholesalers w ON wp.wholesaler_id = w.id
    ${whereClause}
    ORDER BY w.is_verified DESC, w.rating DESC, wp.unit_price ASC
    LIMIT ? OFFSET ?
  `;

  queryParams.push(limit, offset);
  const products = await query(productsQuery, queryParams);

  const meta = {
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };

  successResponse(res, 'Products search completed successfully', products, 200, meta);
}));

// @route   GET /api/wholesalers/locations
// @desc    Get all unique wholesaler locations
// @access  Private
router.get('/meta/locations', authenticateToken, asyncHandler(async (req, res) => {
  const locations = await query(
    'SELECT DISTINCT location FROM wholesalers WHERE is_active = TRUE AND location IS NOT NULL ORDER BY location'
  );

  const locationList = locations.map(row => row.location);

  successResponse(res, 'Wholesaler locations retrieved successfully', locationList);
}));

// @route   GET /api/wholesalers/specialties
// @desc    Get all unique specialties
// @access  Private
router.get('/meta/specialties', authenticateToken, asyncHandler(async (req, res) => {
  const wholesalers = await query(
    'SELECT specialties FROM wholesalers WHERE is_active = TRUE AND specialties IS NOT NULL'
  );

  const allSpecialties = new Set();

  wholesalers.forEach(wholesaler => {
    if (wholesaler.specialties) {
      try {
        const specialties = JSON.parse(wholesaler.specialties);
        specialties.forEach(specialty => allSpecialties.add(specialty));
      } catch (e) {
        // Skip invalid JSON
      }
    }
  });

  const specialtiesList = Array.from(allSpecialties).sort();

  successResponse(res, 'Wholesaler specialties retrieved successfully', specialtiesList);
}));

module.exports = router;