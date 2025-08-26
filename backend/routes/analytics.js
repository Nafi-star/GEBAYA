const express = require('express');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { validateDateRange } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const { successResponse, errorResponse } = require('../middleware/logger');
const { promisify } = require('util');

const router = express.Router();
const query = promisify(db.query).bind(db);

// @route   GET /api/analytics/dashboard
// @desc    Get comprehensive dashboard analytics
// @access  Private
router.get('/dashboard', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Use stored procedure for dashboard stats
  const dashboardStats = await query('CALL GetUserDashboardStats(?)', [userId]);

  // Get recent sales trend (last 30 days)
  const salesTrendQuery = `
    SELECT 
      DATE(sale_date) as date,
      COUNT(*) as sales_count,
      SUM(total_amount) as revenue,
      SUM(profit_amount) as profit
    FROM sales
    WHERE user_id = ? AND sale_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    GROUP BY DATE(sale_date)
    ORDER BY date DESC
  `;
  const salesTrend = await query(salesTrendQuery, [userId]);

  // Get top performing items (last 30 days)
  const topItemsQuery = `
    SELECT 
      i.name,
      i.name_amharic,
      SUM(s.quantity) as total_sold,
      SUM(s.total_amount) as total_revenue,
      SUM(s.profit_amount) as total_profit,
      AVG(s.unit_price) as avg_price
    FROM sales s
    INNER JOIN inventory_items i ON s.item_id = i.id
    WHERE s.user_id = ? AND s.sale_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    GROUP BY s.item_id, i.name, i.name_amharic
    ORDER BY total_sold DESC
    LIMIT 10
  `;
  const topItems = await query(topItemsQuery, [userId]);

  // Get category performance
  const categoryPerformanceQuery = `
    SELECT 
      c.name as category_name,
      c.name_amharic as category_name_amharic,
      COUNT(DISTINCT i.id) as item_count,
      SUM(i.quantity) as total_stock,
      SUM(i.quantity * i.cost_price) as inventory_value,
      COALESCE(SUM(s.quantity), 0) as items_sold,
      COALESCE(SUM(s.total_amount), 0) as revenue
    FROM categories c
    LEFT JOIN inventory_items i ON c.id = i.category_id AND i.user_id = ? AND i.is_active = TRUE
    LEFT JOIN sales s ON i.id = s.item_id AND s.sale_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    WHERE c.is_active = TRUE
    GROUP BY c.id, c.name, c.name_amharic
    HAVING item_count > 0
    ORDER BY revenue DESC
  `;
  const categoryPerformance = await query(categoryPerformanceQuery, [userId]);

  // Get profit margins analysis
  const profitMarginsQuery = `
    SELECT 
      AVG((selling_price - cost_price) / cost_price * 100) as avg_profit_margin,
      MIN((selling_price - cost_price) / cost_price * 100) as min_profit_margin,
      MAX((selling_price - cost_price) / cost_price * 100) as max_profit_margin,
      COUNT(CASE WHEN (selling_price - cost_price) / cost_price * 100 < 20 THEN 1 END) as low_margin_items,
      COUNT(CASE WHEN (selling_price - cost_price) / cost_price * 100 >= 50 THEN 1 END) as high_margin_items
    FROM inventory_items
    WHERE user_id = ? AND is_active = TRUE AND cost_price > 0
  `;
  const profitMargins = await query(profitMarginsQuery, [userId]);

  // Get stock alerts
  const stockAlertsQuery = `
    SELECT 
      COUNT(CASE WHEN quantity = 0 THEN 1 END) as out_of_stock,
      COUNT(CASE WHEN quantity > 0 AND quantity <= min_threshold THEN 1 END) as low_stock,
      COUNT(CASE WHEN quantity > max_threshold THEN 1 END) as overstock
    FROM inventory_items
    WHERE user_id = ? AND is_active = TRUE
  `;
  const stockAlerts = await query(stockAlertsQuery, [userId]);

  const analytics = {
    dashboard_stats: {
      today: dashboardStats[0][0] || { today_sales_count: 0, today_revenue: 0, today_profit: 0 },
      week: dashboardStats[0][1] || { week_sales_count: 0, week_revenue: 0, week_profit: 0 },
      inventory: dashboardStats[0][2] || { total_items: 0, inventory_value: 0, low_stock_count: 0 }
    },
    sales_trend: salesTrend,
    top_items: topItems,
    category_performance: categoryPerformance,
    profit_margins: profitMargins[0] || {},
    stock_alerts: stockAlerts[0] || {}
  };

  successResponse(res, 'Dashboard analytics retrieved successfully', analytics);
}));

// @route   GET /api/analytics/sales
// @desc    Get detailed sales analytics
// @access  Private
router.get('/sales', authenticateToken, validateDateRange, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const startDate = req.query.start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const endDate = req.query.end_date || new Date().toISOString().split('T')[0];
  const groupBy = req.query.group_by || 'day'; // day, week, month

  let dateFormat, dateGroup;
  switch (groupBy) {
    case 'week':
      dateFormat = '%Y-%u';
      dateGroup = 'YEARWEEK(sale_date, 1)';
      break;
    case 'month':
      dateFormat = '%Y-%m';
      dateGroup = 'DATE_FORMAT(sale_date, "%Y-%m")';
      break;
    default:
      dateFormat = '%Y-%m-%d';
      dateGroup = 'DATE(sale_date)';
  }

  // Sales over time
  const salesOverTimeQuery = `
    SELECT 
      DATE_FORMAT(sale_date, '${dateFormat}') as period,
      COUNT(*) as sales_count,
      SUM(quantity) as items_sold,
      SUM(total_amount) as revenue,
      SUM(profit_amount) as profit,
      AVG(total_amount) as avg_sale_amount
    FROM sales
    WHERE user_id = ? AND sale_date BETWEEN ? AND ?
    GROUP BY ${dateGroup}
    ORDER BY period ASC
  `;
  const salesOverTime = await query(salesOverTimeQuery, [userId, startDate, endDate]);

  // Sales by payment method
  const paymentMethodQuery = `
    SELECT 
      payment_method,
      COUNT(*) as sales_count,
      SUM(total_amount) as revenue,
      SUM(profit_amount) as profit
    FROM sales
    WHERE user_id = ? AND sale_date BETWEEN ? AND ?
    GROUP BY payment_method
    ORDER BY revenue DESC
  `;
  const paymentMethods = await query(paymentMethodQuery, [userId, startDate, endDate]);

  // Sales by hour of day
  const hourlyAnalysisQuery = `
    SELECT 
      HOUR(sale_date) as hour,
      COUNT(*) as sales_count,
      SUM(total_amount) as revenue
    FROM sales
    WHERE user_id = ? AND sale_date BETWEEN ? AND ?
    GROUP BY HOUR(sale_date)
    ORDER BY hour ASC
  `;
  const hourlyAnalysis = await query(hourlyAnalysisQuery, [userId, startDate, endDate]);

  // Customer analysis (if customer data available)
  const customerAnalysisQuery = `
    SELECT 
      COUNT(DISTINCT customer_phone) as unique_customers,
      COUNT(CASE WHEN customer_phone IS NOT NULL THEN 1 END) as sales_with_customer_info,
      AVG(CASE WHEN customer_phone IS NOT NULL THEN total_amount END) as avg_customer_sale
    FROM sales
    WHERE user_id = ? AND sale_date BETWEEN ? AND ?
  `;
  const customerAnalysis = await query(customerAnalysisQuery, [userId, startDate, endDate]);

  const analytics = {
    period: { start_date: startDate, end_date: endDate, group_by: groupBy },
    sales_over_time: salesOverTime,
    payment_methods: paymentMethods,
    hourly_analysis: hourlyAnalysis,
    customer_analysis: customerAnalysis[0] || {}
  };

  successResponse(res, 'Sales analytics retrieved successfully', analytics);
}));

// @route   GET /api/analytics/inventory
// @desc    Get inventory analytics
// @access  Private
router.get('/inventory', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Inventory value by category
  const categoryValueQuery = `
    SELECT 
      c.name as category_name,
      c.name_amharic as category_name_amharic,
      COUNT(i.id) as item_count,
      SUM(i.quantity) as total_quantity,
      SUM(i.quantity * i.cost_price) as cost_value,
      SUM(i.quantity * i.selling_price) as selling_value,
      AVG((i.selling_price - i.cost_price) / i.cost_price * 100) as avg_profit_margin
    FROM categories c
    LEFT JOIN inventory_items i ON c.id = i.category_id AND i.user_id = ? AND i.is_active = TRUE
    WHERE c.is_active = TRUE
    GROUP BY c.id, c.name, c.name_amharic
    HAVING item_count > 0
    ORDER BY cost_value DESC
  `;
  const categoryValue = await query(categoryValueQuery, [userId]);

  // Stock status distribution
  const stockStatusQuery = `
    SELECT 
      COUNT(CASE WHEN quantity = 0 THEN 1 END) as out_of_stock,
      COUNT(CASE WHEN quantity > 0 AND quantity <= min_threshold THEN 1 END) as low_stock,
      COUNT(CASE WHEN quantity > min_threshold AND quantity <= max_threshold THEN 1 END) as normal_stock,
      COUNT(CASE WHEN quantity > max_threshold THEN 1 END) as overstock,
      COUNT(*) as total_items
    FROM inventory_items
    WHERE user_id = ? AND is_active = TRUE
  `;
  const stockStatus = await query(stockStatusQuery, [userId]);

  // Items by profit margin ranges
  const profitMarginRangesQuery = `
    SELECT 
      COUNT(CASE WHEN (selling_price - cost_price) / cost_price * 100 < 10 THEN 1 END) as very_low_margin,
      COUNT(CASE WHEN (selling_price - cost_price) / cost_price * 100 BETWEEN 10 AND 19.99 THEN 1 END) as low_margin,
      COUNT(CASE WHEN (selling_price - cost_price) / cost_price * 100 BETWEEN 20 AND 39.99 THEN 1 END) as medium_margin,
      COUNT(CASE WHEN (selling_price - cost_price) / cost_price * 100 BETWEEN 40 AND 59.99 THEN 1 END) as high_margin,
      COUNT(CASE WHEN (selling_price - cost_price) / cost_price * 100 >= 60 THEN 1 END) as very_high_margin
    FROM inventory_items
    WHERE user_id = ? AND is_active = TRUE AND cost_price > 0
  `;
  const profitMarginRanges = await query(profitMarginRangesQuery, [userId]);

  // Slow moving items (no sales in last 30 days)
  const slowMovingQuery = `
    SELECT 
      i.id,
      i.name,
      i.name_amharic,
      i.quantity,
      i.cost_price,
      i.selling_price,
      (i.quantity * i.cost_price) as tied_up_capital,
      DATEDIFF(CURDATE(), COALESCE(MAX(s.sale_date), i.created_at)) as days_since_last_sale
    FROM inventory_items i
    LEFT JOIN sales s ON i.id = s.item_id
    WHERE i.user_id = ? AND i.is_active = TRUE AND i.quantity > 0
    GROUP BY i.id, i.name, i.name_amharic, i.quantity, i.cost_price, i.selling_price
    HAVING days_since_last_sale > 30
    ORDER BY tied_up_capital DESC
    LIMIT 20
  `;
  const slowMovingItems = await query(slowMovingQuery, [userId]);

  const analytics = {
    category_value: categoryValue,
    stock_status: stockStatus[0] || {},
    profit_margin_ranges: profitMarginRanges[0] || {},
    slow_moving_items: slowMovingItems
  };

  successResponse(res, 'Inventory analytics retrieved successfully', analytics);
}));

// @route   GET /api/analytics/profit
// @desc    Get profit analytics
// @access  Private
router.get('/profit', authenticateToken, validateDateRange, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const startDate = req.query.start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const endDate = req.query.end_date || new Date().toISOString().split('T')[0];

  // Profit over time
  const profitOverTimeQuery = `
    SELECT 
      DATE(sale_date) as date,
      SUM(total_amount) as revenue,
      SUM(cost_price * quantity) as cost,
      SUM(profit_amount) as profit,
      (SUM(profit_amount) / SUM(total_amount) * 100) as profit_margin_percent
    FROM sales
    WHERE user_id = ? AND sale_date BETWEEN ? AND ?
    GROUP BY DATE(sale_date)
    ORDER BY date ASC
  `;
  const profitOverTime = await query(profitOverTimeQuery, [userId, startDate, endDate]);

  // Most profitable items
  const profitableItemsQuery = `
    SELECT 
      i.name,
      i.name_amharic,
      SUM(s.quantity) as total_sold,
      SUM(s.profit_amount) as total_profit,
      AVG(s.profit_amount / s.quantity) as avg_profit_per_unit,
      (SUM(s.profit_amount) / SUM(s.total_amount) * 100) as profit_margin_percent
    FROM sales s
    INNER JOIN inventory_items i ON s.item_id = i.id
    WHERE s.user_id = ? AND s.sale_date BETWEEN ? AND ?
    GROUP BY s.item_id, i.name, i.name_amharic
    ORDER BY total_profit DESC
    LIMIT 20
  `;
  const profitableItems = await query(profitableItemsQuery, [userId, startDate, endDate]);

  // Profit by category
  const profitByCategoryQuery = `
    SELECT 
      c.name as category_name,
      c.name_amharic as category_name_amharic,
      SUM(s.total_amount) as revenue,
      SUM(s.profit_amount) as profit,
      (SUM(s.profit_amount) / SUM(s.total_amount) * 100) as profit_margin_percent,
      COUNT(s.id) as sales_count
    FROM sales s
    INNER JOIN inventory_items i ON s.item_id = i.id
    LEFT JOIN categories c ON i.category_id = c.id
    WHERE s.user_id = ? AND s.sale_date BETWEEN ? AND ?
    GROUP BY c.id, c.name, c.name_amharic
    ORDER BY profit DESC
  `;
  const profitByCategory = await query(profitByCategoryQuery, [userId, startDate, endDate]);

  // Overall profit summary
  const profitSummaryQuery = `
    SELECT 
      SUM(total_amount) as total_revenue,
      SUM(cost_price * quantity) as total_cost,
      SUM(profit_amount) as total_profit,
      (SUM(profit_amount) / SUM(total_amount) * 100) as overall_profit_margin,
      COUNT(*) as total_sales,
      AVG(profit_amount) as avg_profit_per_sale
    FROM sales
    WHERE user_id = ? AND sale_date BETWEEN ? AND ?
  `;
  const profitSummary = await query(profitSummaryQuery, [userId, startDate, endDate]);

  const analytics = {
    period: { start_date: startDate, end_date: endDate },
    profit_over_time: profitOverTime,
    profitable_items: profitableItems,
    profit_by_category: profitByCategory,
    summary: profitSummary[0] || {}
  };

  successResponse(res, 'Profit analytics retrieved successfully', analytics);
}));

// @route   GET /api/analytics/comparison
// @desc    Get period comparison analytics
// @access  Private
router.get('/comparison', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const period = req.query.period || 'month'; // week, month, quarter, year

  let currentPeriodStart, currentPeriodEnd, previousPeriodStart, previousPeriodEnd;
  const now = new Date();

  switch (period) {
    case 'week':
      currentPeriodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
      currentPeriodEnd = new Date(currentPeriodStart.getTime() + 6 * 24 * 60 * 60 * 1000);
      previousPeriodStart = new Date(currentPeriodStart.getTime() - 7 * 24 * 60 * 60 * 1000);
      previousPeriodEnd = new Date(currentPeriodStart.getTime() - 1);
      break;
    case 'quarter':
      const currentQuarter = Math.floor(now.getMonth() / 3);
      currentPeriodStart = new Date(now.getFullYear(), currentQuarter * 3, 1);
      currentPeriodEnd = new Date(now.getFullYear(), (currentQuarter + 1) * 3, 0);
      previousPeriodStart = new Date(currentPeriodStart.getFullYear(), currentPeriodStart.getMonth() - 3, 1);
      previousPeriodEnd = new Date(currentPeriodStart.getTime() - 1);
      break;
    case 'year':
      currentPeriodStart = new Date(now.getFullYear(), 0, 1);
      currentPeriodEnd = new Date(now.getFullYear(), 11, 31);
      previousPeriodStart = new Date(now.getFullYear() - 1, 0, 1);
      previousPeriodEnd = new Date(now.getFullYear() - 1, 11, 31);
      break;
    default: // month
      currentPeriodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      currentPeriodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      previousPeriodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      previousPeriodEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  }

  const comparisonQuery = `
    SELECT 
      'current' as period_type,
      COUNT(*) as sales_count,
      SUM(quantity) as items_sold,
      SUM(total_amount) as revenue,
      SUM(profit_amount) as profit,
      AVG(total_amount) as avg_sale_amount
    FROM sales
    WHERE user_id = ? AND sale_date BETWEEN ? AND ?
    
    UNION ALL
    
    SELECT 
      'previous' as period_type,
      COUNT(*) as sales_count,
      SUM(quantity) as items_sold,
      SUM(total_amount) as revenue,
      SUM(profit_amount) as profit,
      AVG(total_amount) as avg_sale_amount
    FROM sales
    WHERE user_id = ? AND sale_date BETWEEN ? AND ?
  `;

  const results = await query(comparisonQuery, [
    userId, currentPeriodStart.toISOString().split('T')[0], currentPeriodEnd.toISOString().split('T')[0],
    userId, previousPeriodStart.toISOString().split('T')[0], previousPeriodEnd.toISOString().split('T')[0]
  ]);

  const current = results.find(r => r.period_type === 'current') || {};
  const previous = results.find(r => r.period_type === 'previous') || {};

  // Calculate percentage changes
  const calculateChange = (current, previous) => {
    if (!previous || previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous * 100);
  };

  const comparison = {
    period,
    current_period: {
      start: currentPeriodStart.toISOString().split('T')[0],
      end: currentPeriodEnd.toISOString().split('T')[0],
      ...current
    },
    previous_period: {
      start: previousPeriodStart.toISOString().split('T')[0],
      end: previousPeriodEnd.toISOString().split('T')[0],
      ...previous
    },
    changes: {
      sales_count: calculateChange(current.sales_count || 0, previous.sales_count || 0),
      items_sold: calculateChange(current.items_sold || 0, previous.items_sold || 0),
      revenue: calculateChange(current.revenue || 0, previous.revenue || 0),
      profit: calculateChange(current.profit || 0, previous.profit || 0),
      avg_sale_amount: calculateChange(current.avg_sale_amount || 0, previous.avg_sale_amount || 0)
    }
  };

  successResponse(res, 'Comparison analytics retrieved successfully', comparison);
}));

module.exports = router;