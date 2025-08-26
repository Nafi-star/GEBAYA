const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { validateSaleRecord, validateId, validatePagination, validateDateRange } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const { successResponse, errorResponse } = require('../middleware/logger');
const { promisify } = require('util');

const router = express.Router();
const query = promisify(db.query).bind(db);

// @route   GET /api/sales
// @desc    Get all sales for the authenticated user
// @access  Private
router.get('/', authenticateToken, validatePagination, validateDateRange, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const offset = (page - 1) * limit;
  const startDate = req.query.start_date;
  const endDate = req.query.end_date;
  const itemId = req.query.item_id;

  // Build WHERE clause
  let whereClause = 'WHERE s.user_id = ?';
  let queryParams = [userId];

  if (startDate) {
    whereClause += ' AND s.sale_date >= ?';
    queryParams.push(startDate);
  }

  if (endDate) {
    whereClause += ' AND s.sale_date <= ?';
    queryParams.push(endDate);
  }

  if (itemId) {
    whereClause += ' AND s.item_id = ?';
    queryParams.push(itemId);
  }

  // Get total count
  const countQuery = `
    SELECT COUNT(*) as total
    FROM sales s
    ${whereClause}
  `;
  const countResult = await query(countQuery, queryParams);
  const total = countResult[0].total;

  // Get sales with pagination
  const salesQuery = `
    SELECT 
      s.id,
      s.uuid,
      s.quantity,
      s.unit_price,
      s.cost_price,
      s.total_amount,
      s.profit_amount,
      s.payment_method,
      s.customer_name,
      s.customer_phone,
      s.notes,
      s.sale_date,
      s.created_at,
      i.name as item_name,
      i.name_amharic as item_name_amharic,
      i.unit as item_unit,
      c.name as category_name
    FROM sales s
    INNER JOIN inventory_items i ON s.item_id = i.id
    LEFT JOIN categories c ON i.category_id = c.id
    ${whereClause}
    ORDER BY s.sale_date DESC, s.created_at DESC
    LIMIT ? OFFSET ?
  `;

  queryParams.push(limit, offset);
  const sales = await query(salesQuery, queryParams);

  // Calculate summary statistics
  const summaryQuery = `
    SELECT 
      COUNT(*) as total_sales,
      SUM(quantity) as total_items_sold,
      SUM(total_amount) as total_revenue,
      SUM(profit_amount) as total_profit,
      AVG(total_amount) as average_sale_amount
    FROM sales s
    ${whereClause.replace('LIMIT ? OFFSET ?', '')}
  `;
  const summaryParams = queryParams.slice(0, -2); // Remove limit and offset
  const summary = await query(summaryQuery, summaryParams);

  const meta = {
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    },
    summary: summary[0]
  };

  successResponse(res, 'Sales retrieved successfully', sales, 200, meta);
}));

// @route   GET /api/sales/:id
// @desc    Get single sale
// @access  Private
router.get('/:id', authenticateToken, validateId, asyncHandler(async (req, res) => {
  const saleId = req.params.id;
  const userId = req.user.id;

  const saleQuery = `
    SELECT 
      s.*,
      i.name as item_name,
      i.name_amharic as item_name_amharic,
      i.unit as item_unit,
      c.name as category_name
    FROM sales s
    INNER JOIN inventory_items i ON s.item_id = i.id
    LEFT JOIN categories c ON i.category_id = c.id
    WHERE s.id = ? AND s.user_id = ?
  `;

  const sales = await query(saleQuery, [saleId, userId]);

  if (sales.length === 0) {
    return errorResponse(res, 'Sale not found', 404, 'SALE_NOT_FOUND');
  }

  successResponse(res, 'Sale retrieved successfully', sales[0]);
}));

// @route   POST /api/sales
// @desc    Record a new sale
// @access  Private
router.post('/', authenticateToken, validateSaleRecord, asyncHandler(async (req, res) => {
  const {
    item_id,
    quantity,
    unit_price,
    payment_method = 'cash',
    customer_name,
    customer_phone,
    notes
  } = req.body;

  const userId = req.user.id;

  // Get item details and check if it belongs to the user
  const items = await query(
    'SELECT id, name, quantity, cost_price, selling_price FROM inventory_items WHERE id = ? AND user_id = ? AND is_active = TRUE',
    [item_id, userId]
  );

  if (items.length === 0) {
    return errorResponse(res, 'Item not found', 404, 'ITEM_NOT_FOUND');
  }

  const item = items[0];

  // Check if there's enough stock
  if (item.quantity < quantity) {
    return errorResponse(res, `Insufficient stock. Available: ${item.quantity}`, 400, 'INSUFFICIENT_STOCK');
  }

  // Calculate totals
  const total_amount = unit_price * quantity;
  const cost_price = item.cost_price;
  const profit_amount = (unit_price - cost_price) * quantity;

  const uuid = uuidv4();

  // Start transaction
  await query('START TRANSACTION');

  try {
    // Record the sale
    const saleResult = await query(
      `INSERT INTO sales (uuid, user_id, item_id, quantity, unit_price, cost_price, total_amount, profit_amount, payment_method, customer_name, customer_phone, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [uuid, userId, item_id, quantity, unit_price, cost_price, total_amount, profit_amount, payment_method, customer_name, customer_phone, notes]
    );

    // Update inventory quantity
    await query(
      'UPDATE inventory_items SET quantity = quantity - ?, updated_at = NOW() WHERE id = ?',
      [quantity, item_id]
    );

    // Record stock movement
    await query(
      `INSERT INTO stock_movements (uuid, user_id, item_id, movement_type, quantity_change, previous_quantity, new_quantity, reference_id, notes)
       VALUES (?, ?, ?, 'sale', ?, ?, ?, ?, ?)`,
      [uuidv4(), userId, item_id, -quantity, item.quantity, item.quantity - quantity, saleResult.insertId, `Sale #${saleResult.insertId}`]
    );

    // Commit transaction
    await query('COMMIT');

    // Get the created sale with item details
    const newSale = await query(
      `SELECT 
        s.*,
        i.name as item_name,
        i.name_amharic as item_name_amharic,
        i.unit as item_unit,
        c.name as category_name
       FROM sales s
       INNER JOIN inventory_items i ON s.item_id = i.id
       LEFT JOIN categories c ON i.category_id = c.id
       WHERE s.id = ?`,
      [saleResult.insertId]
    );

    successResponse(res, 'Sale recorded successfully', newSale[0], 201);

  } catch (error) {
    // Rollback transaction on error
    await query('ROLLBACK');
    throw error;
  }
}));

// @route   PUT /api/sales/:id
// @desc    Update a sale (limited fields)
// @access  Private
router.put('/:id', authenticateToken, validateId, asyncHandler(async (req, res) => {
  const saleId = req.params.id;
  const userId = req.user.id;
  const { customer_name, customer_phone, notes, payment_method } = req.body;

  // Check if sale exists and belongs to user
  const existingSales = await query(
    'SELECT id FROM sales WHERE id = ? AND user_id = ?',
    [saleId, userId]
  );

  if (existingSales.length === 0) {
    return errorResponse(res, 'Sale not found', 404, 'SALE_NOT_FOUND');
  }

  // Build update query dynamically
  const updates = [];
  const values = [];

  if (customer_name !== undefined) {
    updates.push('customer_name = ?');
    values.push(customer_name);
  }
  if (customer_phone !== undefined) {
    updates.push('customer_phone = ?');
    values.push(customer_phone);
  }
  if (notes !== undefined) {
    updates.push('notes = ?');
    values.push(notes);
  }
  if (payment_method) {
    updates.push('payment_method = ?');
    values.push(payment_method);
  }

  if (updates.length === 0) {
    return errorResponse(res, 'No fields to update', 400, 'NO_UPDATES');
  }

  values.push(saleId, userId);

  await query(
    `UPDATE sales SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
    values
  );

  // Get updated sale
  const updatedSale = await query(
    `SELECT 
      s.*,
      i.name as item_name,
      i.name_amharic as item_name_amharic,
      i.unit as item_unit,
      c.name as category_name
     FROM sales s
     INNER JOIN inventory_items i ON s.item_id = i.id
     LEFT JOIN categories c ON i.category_id = c.id
     WHERE s.id = ?`,
    [saleId]
  );

  successResponse(res, 'Sale updated successfully', updatedSale[0]);
}));

// @route   DELETE /api/sales/:id
// @desc    Delete a sale (reverse the transaction)
// @access  Private
router.delete('/:id', authenticateToken, validateId, asyncHandler(async (req, res) => {
  const saleId = req.params.id;
  const userId = req.user.id;

  // Get sale details
  const sales = await query(
    'SELECT * FROM sales WHERE id = ? AND user_id = ?',
    [saleId, userId]
  );

  if (sales.length === 0) {
    return errorResponse(res, 'Sale not found', 404, 'SALE_NOT_FOUND');
  }

  const sale = sales[0];

  // Start transaction
  await query('START TRANSACTION');

  try {
    // Restore inventory quantity
    await query(
      'UPDATE inventory_items SET quantity = quantity + ?, updated_at = NOW() WHERE id = ?',
      [sale.quantity, sale.item_id]
    );

    // Record reverse stock movement
    await query(
      `INSERT INTO stock_movements (uuid, user_id, item_id, movement_type, quantity_change, previous_quantity, new_quantity, reference_id, notes)
       VALUES (?, ?, ?, 'return', ?, 
               (SELECT quantity - ? FROM inventory_items WHERE id = ?),
               (SELECT quantity FROM inventory_items WHERE id = ?),
               ?, ?)`,
      [uuidv4(), userId, sale.item_id, sale.quantity, sale.quantity, sale.item_id, sale.item_id, saleId, `Sale reversal #${saleId}`]
    );

    // Delete the sale
    await query('DELETE FROM sales WHERE id = ? AND user_id = ?', [saleId, userId]);

    // Commit transaction
    await query('COMMIT');

    successResponse(res, 'Sale deleted successfully');

  } catch (error) {
    // Rollback transaction on error
    await query('ROLLBACK');
    throw error;
  }
}));

// @route   GET /api/sales/summary/dashboard
// @desc    Get sales summary for dashboard
// @access  Private
router.get('/summary/dashboard', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Get today's sales
  const todayQuery = `
    SELECT 
      COUNT(*) as sales_count,
      COALESCE(SUM(total_amount), 0) as revenue,
      COALESCE(SUM(profit_amount), 0) as profit,
      COALESCE(SUM(quantity), 0) as items_sold
    FROM sales
    WHERE user_id = ? AND DATE(sale_date) = CURDATE()
  `;
  const todayResult = await query(todayQuery, [userId]);

  // Get this week's sales
  const weekQuery = `
    SELECT 
      COUNT(*) as sales_count,
      COALESCE(SUM(total_amount), 0) as revenue,
      COALESCE(SUM(profit_amount), 0) as profit,
      COALESCE(SUM(quantity), 0) as items_sold
    FROM sales
    WHERE user_id = ? AND YEARWEEK(sale_date, 1) = YEARWEEK(CURDATE(), 1)
  `;
  const weekResult = await query(weekQuery, [userId]);

  // Get this month's sales
  const monthQuery = `
    SELECT 
      COUNT(*) as sales_count,
      COALESCE(SUM(total_amount), 0) as revenue,
      COALESCE(SUM(profit_amount), 0) as profit,
      COALESCE(SUM(quantity), 0) as items_sold
    FROM sales
    WHERE user_id = ? AND YEAR(sale_date) = YEAR(CURDATE()) AND MONTH(sale_date) = MONTH(CURDATE())
  `;
  const monthResult = await query(monthQuery, [userId]);

  // Get top selling items (this month)
  const topItemsQuery = `
    SELECT 
      i.name,
      i.name_amharic,
      SUM(s.quantity) as total_sold,
      SUM(s.total_amount) as total_revenue,
      SUM(s.profit_amount) as total_profit
    FROM sales s
    INNER JOIN inventory_items i ON s.item_id = i.id
    WHERE s.user_id = ? AND YEAR(s.sale_date) = YEAR(CURDATE()) AND MONTH(s.sale_date) = MONTH(CURDATE())
    GROUP BY s.item_id, i.name, i.name_amharic
    ORDER BY total_sold DESC
    LIMIT 5
  `;
  const topItems = await query(topItemsQuery, [userId]);

  // Get daily sales for the last 7 days
  const dailySalesQuery = `
    SELECT 
      DATE(sale_date) as sale_date,
      COUNT(*) as sales_count,
      SUM(total_amount) as revenue,
      SUM(profit_amount) as profit
    FROM sales
    WHERE user_id = ? AND sale_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
    GROUP BY DATE(sale_date)
    ORDER BY sale_date DESC
  `;
  const dailySales = await query(dailySalesQuery, [userId]);

  const summary = {
    today: todayResult[0],
    week: weekResult[0],
    month: monthResult[0],
    top_items: topItems,
    daily_sales: dailySales
  };

  successResponse(res, 'Sales summary retrieved successfully', summary);
}));

module.exports = router;