const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { successResponse, errorResponse } = require('../middleware/logger');
const { promisify } = require('util');

const router = express.Router();
const query = promisify(db.query).bind(db);

// @route   GET /api/users/settings
// @desc    Get user settings
// @access  Private
router.get('/settings', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const settings = await query(
    'SELECT setting_key, setting_value FROM user_settings WHERE user_id = ?',
    [userId]
  );

  // Convert to key-value object
  const settingsObj = {};
  settings.forEach(setting => {
    try {
      settingsObj[setting.setting_key] = JSON.parse(setting.setting_value);
    } catch (e) {
      settingsObj[setting.setting_key] = setting.setting_value;
    }
  });

  successResponse(res, 'User settings retrieved successfully', settingsObj);
}));

// @route   PUT /api/users/settings
// @desc    Update user settings
// @access  Private
router.put('/settings', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const settings = req.body;

  if (!settings || typeof settings !== 'object') {
    return errorResponse(res, 'Settings must be an object', 400, 'INVALID_SETTINGS');
  }

  // Update each setting
  for (const [key, value] of Object.entries(settings)) {
    const settingValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
    
    await query(
      `INSERT INTO user_settings (user_id, setting_key, setting_value)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()`,
      [userId, key, settingValue]
    );
  }

  successResponse(res, 'Settings updated successfully');
}));

// @route   GET /api/users/stats
// @desc    Get user business statistics
// @access  Private
router.get('/stats', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Get comprehensive user stats
  const statsQuery = `
    SELECT 
      (SELECT COUNT(*) FROM inventory_items WHERE user_id = ? AND is_active = TRUE) as total_items,
      (SELECT SUM(quantity) FROM inventory_items WHERE user_id = ? AND is_active = TRUE) as total_quantity,
      (SELECT SUM(quantity * cost_price) FROM inventory_items WHERE user_id = ? AND is_active = TRUE) as inventory_value,
      (SELECT COUNT(*) FROM inventory_items WHERE user_id = ? AND is_active = TRUE AND quantity <= min_threshold) as low_stock_items,
      (SELECT COUNT(*) FROM sales WHERE user_id = ?) as total_sales,
      (SELECT SUM(total_amount) FROM sales WHERE user_id = ?) as total_revenue,
      (SELECT SUM(profit_amount) FROM sales WHERE user_id = ?) as total_profit,
      (SELECT COUNT(*) FROM sales WHERE user_id = ? AND DATE(sale_date) = CURDATE()) as today_sales,
      (SELECT SUM(total_amount) FROM sales WHERE user_id = ? AND DATE(sale_date) = CURDATE()) as today_revenue,
      (SELECT SUM(profit_amount) FROM sales WHERE user_id = ? AND DATE(sale_date) = CURDATE()) as today_profit
  `;

  const stats = await query(statsQuery, Array(10).fill(userId));

  // Get category breakdown
  const categoryStats = await query(
    `SELECT 
      c.name as category_name,
      COUNT(i.id) as item_count,
      SUM(i.quantity) as total_quantity,
      SUM(i.quantity * i.cost_price) as category_value
     FROM categories c
     LEFT JOIN inventory_items i ON c.id = i.category_id AND i.user_id = ? AND i.is_active = TRUE
     WHERE c.is_active = TRUE
     GROUP BY c.id, c.name
     HAVING item_count > 0
     ORDER BY category_value DESC`,
    [userId]
  );

  // Get recent activity
  const recentActivity = await query(
    `SELECT 
      'sale' as activity_type,
      s.id as activity_id,
      i.name as item_name,
      s.quantity,
      s.total_amount,
      s.sale_date as activity_date
     FROM sales s
     INNER JOIN inventory_items i ON s.item_id = i.id
     WHERE s.user_id = ?
     ORDER BY s.sale_date DESC
     LIMIT 10`,
    [userId]
  );

  const userStats = {
    overview: stats[0] || {},
    categories: categoryStats,
    recent_activity: recentActivity
  };

  successResponse(res, 'User statistics retrieved successfully', userStats);
}));

// @route   POST /api/users/export-data
// @desc    Export user data
// @access  Private
router.post('/export-data', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { include_sales = true, include_inventory = true, date_range } = req.body;

  const exportData = {};

  // Export user profile
  const userProfile = await query(
    'SELECT business_name, owner_name, email, phone, business_address, business_type, created_at FROM users WHERE id = ?',
    [userId]
  );
  exportData.profile = userProfile[0];

  // Export inventory if requested
  if (include_inventory) {
    const inventory = await query(
      `SELECT 
        i.name, i.name_amharic, i.description, i.quantity, i.unit,
        i.cost_price, i.selling_price, i.min_threshold, i.created_at,
        c.name as category_name
       FROM inventory_items i
       LEFT JOIN categories c ON i.category_id = c.id
       WHERE i.user_id = ? AND i.is_active = TRUE
       ORDER BY i.name`,
      [userId]
    );
    exportData.inventory = inventory;
  }

  // Export sales if requested
  if (include_sales) {
    let salesQuery = `
      SELECT 
        s.quantity, s.unit_price, s.total_amount, s.profit_amount,
        s.payment_method, s.customer_name, s.sale_date,
        i.name as item_name
      FROM sales s
      INNER JOIN inventory_items i ON s.item_id = i.id
      WHERE s.user_id = ?
    `;
    const queryParams = [userId];

    if (date_range && date_range.start_date) {
      salesQuery += ' AND s.sale_date >= ?';
      queryParams.push(date_range.start_date);
    }
    if (date_range && date_range.end_date) {
      salesQuery += ' AND s.sale_date <= ?';
      queryParams.push(date_range.end_date);
    }

    salesQuery += ' ORDER BY s.sale_date DESC';

    const sales = await query(salesQuery, queryParams);
    exportData.sales = sales;
  }

  // Add export metadata
  exportData.export_info = {
    exported_at: new Date().toISOString(),
    exported_by: exportData.profile.business_name,
    includes: {
      inventory: include_inventory,
      sales: include_sales
    }
  };

  successResponse(res, 'Data exported successfully', exportData);
}));

module.exports = router;