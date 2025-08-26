const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { validateInventoryItem, validateId, validatePagination } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const { successResponse, errorResponse } = require('../middleware/logger');
const { promisify } = require('util');

const router = express.Router();
const query = promisify(db.query).bind(db);

// @route   GET /api/inventory
// @desc    Get all inventory items for the authenticated user
// @access  Private
router.get('/', authenticateToken, validatePagination, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const offset = (page - 1) * limit;
  const search = req.query.search || '';
  const category_id = req.query.category_id || '';
  const low_stock = req.query.low_stock === 'true';

  // Build WHERE clause
  let whereClause = 'WHERE i.user_id = ? AND i.is_active = TRUE';
  let queryParams = [userId];

  if (search) {
    whereClause += ' AND (i.name LIKE ? OR i.name_amharic LIKE ? OR i.description LIKE ?)';
    const searchTerm = `%${search}%`;
    queryParams.push(searchTerm, searchTerm, searchTerm);
  }

  if (category_id) {
    whereClause += ' AND i.category_id = ?';
    queryParams.push(category_id);
  }

  if (low_stock) {
    whereClause += ' AND i.quantity <= i.min_threshold';
  }

  // Get total count
  const countQuery = `
    SELECT COUNT(*) as total
    FROM inventory_items i
    ${whereClause}
  `;
  const countResult = await query(countQuery, queryParams);
  const total = countResult[0].total;

  // Get items with pagination
  const itemsQuery = `
    SELECT 
      i.id,
      i.uuid,
      i.name,
      i.name_amharic,
      i.description,
      i.barcode,
      i.sku,
      i.quantity,
      i.unit,
      i.cost_price,
      i.selling_price,
      i.min_threshold,
      i.max_threshold,
      i.image_url,
      i.created_at,
      i.updated_at,
      c.name as category_name,
      c.name_amharic as category_name_amharic,
      (i.selling_price - i.cost_price) as profit_per_unit,
      (i.quantity * i.cost_price) as total_cost_value,
      (i.quantity * i.selling_price) as total_selling_value
    FROM inventory_items i
    LEFT JOIN categories c ON i.category_id = c.id
    ${whereClause}
    ORDER BY i.created_at DESC
    LIMIT ? OFFSET ?
  `;

  queryParams.push(limit, offset);
  const items = await query(itemsQuery, queryParams);

  // Calculate summary statistics
  const summaryQuery = `
    SELECT 
      COUNT(*) as total_items,
      SUM(quantity) as total_quantity,
      SUM(quantity * cost_price) as total_inventory_value,
      COUNT(CASE WHEN quantity <= min_threshold THEN 1 END) as low_stock_items,
      COUNT(CASE WHEN quantity = 0 THEN 1 END) as out_of_stock_items
    FROM inventory_items
    WHERE user_id = ? AND is_active = TRUE
  `;
  const summary = await query(summaryQuery, [userId]);

  const meta = {
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    },
    summary: summary[0]
  };

  successResponse(res, 'Inventory items retrieved successfully', items, 200, meta);
}));

// @route   GET /api/inventory/:id
// @desc    Get single inventory item
// @access  Private
router.get('/:id', authenticateToken, validateId, asyncHandler(async (req, res) => {
  const itemId = req.params.id;
  const userId = req.user.id;

  const itemQuery = `
    SELECT 
      i.*,
      c.name as category_name,
      c.name_amharic as category_name_amharic,
      (i.selling_price - i.cost_price) as profit_per_unit,
      (i.quantity * i.cost_price) as total_cost_value,
      (i.quantity * i.selling_price) as total_selling_value
    FROM inventory_items i
    LEFT JOIN categories c ON i.category_id = c.id
    WHERE i.id = ? AND i.user_id = ? AND i.is_active = TRUE
  `;

  const items = await query(itemQuery, [itemId, userId]);

  if (items.length === 0) {
    return errorResponse(res, 'Inventory item not found', 404, 'ITEM_NOT_FOUND');
  }

  // Get recent stock movements
  const movementsQuery = `
    SELECT 
      movement_type,
      quantity_change,
      previous_quantity,
      new_quantity,
      notes,
      created_at
    FROM stock_movements
    WHERE item_id = ? AND user_id = ?
    ORDER BY created_at DESC
    LIMIT 10
  `;
  const movements = await query(movementsQuery, [itemId, userId]);

  const item = items[0];
  item.recent_movements = movements;

  successResponse(res, 'Inventory item retrieved successfully', item);
}));

// @route   POST /api/inventory
// @desc    Add new inventory item
// @access  Private
router.post('/', authenticateToken, validateInventoryItem, asyncHandler(async (req, res) => {
  const {
    name,
    name_amharic,
    description,
    category_id,
    barcode,
    sku,
    quantity,
    unit = 'pieces',
    cost_price,
    selling_price,
    min_threshold = 5,
    max_threshold = 1000,
    image_url
  } = req.body;

  const userId = req.user.id;
  const uuid = uuidv4();

  // Check if item with same name already exists for this user
  const existingItems = await query(
    'SELECT id FROM inventory_items WHERE user_id = ? AND name = ? AND is_active = TRUE',
    [userId, name]
  );

  if (existingItems.length > 0) {
    return errorResponse(res, 'Item with this name already exists', 400, 'ITEM_EXISTS');
  }

  // Check if barcode is unique (if provided)
  if (barcode) {
    const existingBarcode = await query(
      'SELECT id FROM inventory_items WHERE barcode = ? AND is_active = TRUE',
      [barcode]
    );

    if (existingBarcode.length > 0) {
      return errorResponse(res, 'Item with this barcode already exists', 400, 'BARCODE_EXISTS');
    }
  }

  // Insert new item
  const insertQuery = `
    INSERT INTO inventory_items (
      uuid, user_id, category_id, name, name_amharic, description, barcode, sku,
      quantity, unit, cost_price, selling_price, min_threshold, max_threshold, image_url
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const result = await query(insertQuery, [
    uuid, userId, category_id, name, name_amharic, description, barcode, sku,
    quantity, unit, cost_price, selling_price, min_threshold, max_threshold, image_url
  ]);

  // Record initial stock movement
  if (quantity > 0) {
    await query(
      `INSERT INTO stock_movements (uuid, user_id, item_id, movement_type, quantity_change, previous_quantity, new_quantity, notes)
       VALUES (?, ?, ?, 'purchase', ?, 0, ?, 'Initial stock')`,
      [uuidv4(), userId, result.insertId, quantity, quantity]
    );
  }

  // Get the created item
  const newItem = await query(
    `SELECT i.*, c.name as category_name, c.name_amharic as category_name_amharic
     FROM inventory_items i
     LEFT JOIN categories c ON i.category_id = c.id
     WHERE i.id = ?`,
    [result.insertId]
  );

  successResponse(res, 'Inventory item created successfully', newItem[0], 201);
}));

// @route   PUT /api/inventory/:id
// @desc    Update inventory item
// @access  Private
router.put('/:id', authenticateToken, validateId, validateInventoryItem, asyncHandler(async (req, res) => {
  const itemId = req.params.id;
  const userId = req.user.id;

  // Check if item exists and belongs to user
  const existingItems = await query(
    'SELECT * FROM inventory_items WHERE id = ? AND user_id = ? AND is_active = TRUE',
    [itemId, userId]
  );

  if (existingItems.length === 0) {
    return errorResponse(res, 'Inventory item not found', 404, 'ITEM_NOT_FOUND');
  }

  const existingItem = existingItems[0];
  const {
    name,
    name_amharic,
    description,
    category_id,
    barcode,
    sku,
    quantity,
    unit,
    cost_price,
    selling_price,
    min_threshold,
    max_threshold,
    image_url
  } = req.body;

  // Check if name is unique (excluding current item)
  if (name && name !== existingItem.name) {
    const duplicateNames = await query(
      'SELECT id FROM inventory_items WHERE user_id = ? AND name = ? AND id != ? AND is_active = TRUE',
      [userId, name, itemId]
    );

    if (duplicateNames.length > 0) {
      return errorResponse(res, 'Item with this name already exists', 400, 'ITEM_EXISTS');
    }
  }

  // Check if barcode is unique (excluding current item)
  if (barcode && barcode !== existingItem.barcode) {
    const duplicateBarcodes = await query(
      'SELECT id FROM inventory_items WHERE barcode = ? AND id != ? AND is_active = TRUE',
      [barcode, itemId]
    );

    if (duplicateBarcodes.length > 0) {
      return errorResponse(res, 'Item with this barcode already exists', 400, 'BARCODE_EXISTS');
    }
  }

  // Update item
  const updateQuery = `
    UPDATE inventory_items SET
      name = ?, name_amharic = ?, description = ?, category_id = ?, barcode = ?, sku = ?,
      quantity = ?, unit = ?, cost_price = ?, selling_price = ?, min_threshold = ?, max_threshold = ?,
      image_url = ?, updated_at = NOW()
    WHERE id = ? AND user_id = ?
  `;

  await query(updateQuery, [
    name, name_amharic, description, category_id, barcode, sku,
    quantity, unit, cost_price, selling_price, min_threshold, max_threshold,
    image_url, itemId, userId
  ]);

  // Record stock movement if quantity changed
  if (quantity !== existingItem.quantity) {
    const quantityChange = quantity - existingItem.quantity;
    const movementType = quantityChange > 0 ? 'adjustment' : 'adjustment';
    
    await query(
      `INSERT INTO stock_movements (uuid, user_id, item_id, movement_type, quantity_change, previous_quantity, new_quantity, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'Manual adjustment')`,
      [uuidv4(), userId, itemId, movementType, quantityChange, existingItem.quantity, quantity]
    );
  }

  // Get updated item
  const updatedItem = await query(
    `SELECT i.*, c.name as category_name, c.name_amharic as category_name_amharic
     FROM inventory_items i
     LEFT JOIN categories c ON i.category_id = c.id
     WHERE i.id = ?`,
    [itemId]
  );

  successResponse(res, 'Inventory item updated successfully', updatedItem[0]);
}));

// @route   DELETE /api/inventory/:id
// @desc    Delete inventory item (soft delete)
// @access  Private
router.delete('/:id', authenticateToken, validateId, asyncHandler(async (req, res) => {
  const itemId = req.params.id;
  const userId = req.user.id;

  // Check if item exists and belongs to user
  const existingItems = await query(
    'SELECT id FROM inventory_items WHERE id = ? AND user_id = ? AND is_active = TRUE',
    [itemId, userId]
  );

  if (existingItems.length === 0) {
    return errorResponse(res, 'Inventory item not found', 404, 'ITEM_NOT_FOUND');
  }

  // Soft delete the item
  await query(
    'UPDATE inventory_items SET is_active = FALSE, updated_at = NOW() WHERE id = ? AND user_id = ?',
    [itemId, userId]
  );

  successResponse(res, 'Inventory item deleted successfully');
}));

// @route   GET /api/inventory/categories
// @desc    Get all categories
// @access  Private
router.get('/categories/list', authenticateToken, asyncHandler(async (req, res) => {
  const categories = await query(
    'SELECT id, name, name_amharic, description, icon FROM categories WHERE is_active = TRUE ORDER BY name'
  );

  successResponse(res, 'Categories retrieved successfully', categories);
}));

// @route   GET /api/inventory/low-stock
// @desc    Get low stock items
// @access  Private
router.get('/alerts/low-stock', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const lowStockItems = await query(
    `SELECT 
      i.id, i.uuid, i.name, i.quantity, i.min_threshold, i.unit,
      c.name as category_name
     FROM inventory_items i
     LEFT JOIN categories c ON i.category_id = c.id
     WHERE i.user_id = ? AND i.is_active = TRUE AND i.quantity <= i.min_threshold
     ORDER BY (i.quantity / i.min_threshold) ASC`,
    [userId]
  );

  successResponse(res, 'Low stock items retrieved successfully', lowStockItems);
}));

module.exports = router;