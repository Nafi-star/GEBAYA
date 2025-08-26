import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  ShoppingCart,
  Calendar,
  Eye,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { useSales } from '../contexts/SalesContext';
import { useInventory } from '../contexts/InventoryContext';
import { formatCurrency } from '../utils/currency';

const Analytics: React.FC = () => {
  const { sales, getTodaysSales, getWeeklySales, getTodaysProfit, getWeeklyProfit } = useSales();
  const { items } = useInventory();
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('week');

  // Calculate metrics based on time range
  const getMetricsForRange = () => {
    const now = new Date();
    let filteredSales = sales;

    if (timeRange === 'today') {
      filteredSales = getTodaysSales();
    } else if (timeRange === 'week') {
      filteredSales = getWeeklySales();
    } else if (timeRange === 'month') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      filteredSales = sales.filter(sale => new Date(sale.date) >= monthStart);
    }

    const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
    const totalProfit = filteredSales.reduce((sum, sale) => sum + sale.profit, 0);
    const totalItemsSold = filteredSales.reduce((sum, sale) => sum + sale.quantity, 0);
    const averageOrderValue = filteredSales.length > 0 ? totalRevenue / filteredSales.length : 0;

    return {
      totalSales: filteredSales.length,
      totalRevenue,
      totalProfit,
      totalItemsSold,
      averageOrderValue,
      profitMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0
    };
  };

  const metrics = getMetricsForRange();

  // Get top selling items
  const getTopSellingItems = () => {
    const itemSales: { [key: string]: { name: string, quantity: number, revenue: number } } = {};
    
    sales.forEach(sale => {
      if (!itemSales[sale.itemName]) {
        itemSales[sale.itemName] = { name: sale.itemName, quantity: 0, revenue: 0 };
      }
      itemSales[sale.itemName].quantity += sale.quantity;
      itemSales[sale.itemName].revenue += sale.total;
    });

    return Object.values(itemSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  };

  // Get daily sales for the week
  const getWeeklySalesData = () => {
    const weekData: { [key: string]: number } = {};
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Initialize all days with 0
    days.forEach(day => {
      weekData[day] = 0;
    });

    const weekSales = getWeeklySales();
    weekSales.forEach(sale => {
      const dayName = days[new Date(sale.date).getDay()];
      weekData[dayName] += sale.total;
    });

    return Object.entries(weekData).map(([day, amount]) => ({ day, amount }));
  };

  const topItems = getTopSellingItems();
  const weeklyData = getWeeklySalesData();
  const maxWeeklyAmount = Math.max(...weeklyData.map(d => d.amount));

  // Calculate inventory value
  const totalInventoryValue = items.reduce((sum, item) => sum + (item.quantity * item.costPrice), 0);
  const lowStockItems = items.filter(item => item.quantity <= item.minThreshold);

  const statCards = [
    {
      title: `Total Sales (${timeRange})`,
      value: metrics.totalSales.toString(),
      change: '+12%',
      changeType: 'positive' as const,
      icon: ShoppingCart,
      color: 'bg-blue-500'
    },
    {
      title: `Revenue (${timeRange})`,
      value: formatCurrency(metrics.totalRevenue),
      change: '+8%',
      changeType: 'positive' as const,
      icon: DollarSign,
      color: 'bg-green-500'
    },
    {
      title: `Profit (${timeRange})`,
      value: formatCurrency(metrics.totalProfit),
      change: '+15%',
      changeType: 'positive' as const,
      icon: TrendingUp,
      color: 'bg-yellow-500'
    },
    {
      title: 'Profit Margin',
      value: `${metrics.profitMargin.toFixed(1)}%`,
      change: metrics.profitMargin > 25 ? 'Excellent' : metrics.profitMargin > 15 ? 'Good' : 'Needs improvement',
      changeType: metrics.profitMargin > 25 ? 'positive' as const : metrics.profitMargin > 15 ? 'neutral' as const : 'negative' as const,
      icon: BarChart3,
      color: 'bg-purple-500'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Business Analytics</h1>
            <p className="text-gray-600">Track your business performance and insights</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="bg-white overflow-hidden shadow-lg rounded-lg hover:shadow-xl transition-shadow duration-200">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`${stat.color} p-3 rounded-md`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">{stat.title}</dt>
                      <dd className="text-lg font-semibold text-gray-900">{stat.value}</dd>
                    </dl>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center text-sm">
                    {stat.changeType === 'positive' ? (
                      <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
                    ) : stat.changeType === 'negative' ? (
                      <ArrowDown className="h-4 w-4 text-red-500 mr-1" />
                    ) : null}
                    <span className={
                      stat.changeType === 'positive' ? 'text-green-600' : 
                      stat.changeType === 'negative' ? 'text-red-600' : 'text-gray-500'
                    }>
                      {stat.change}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Sales Chart */}
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Weekly Sales Trend</h3>
          <div className="space-y-4">
            {weeklyData.map(({ day, amount }) => (
              <div key={day} className="flex items-center">
                <div className="w-12 text-sm font-medium text-gray-600">{day}</div>
                <div className="flex-1 mx-4">
                  <div className="bg-gray-200 rounded-full h-3 relative">
                    <div
                      className="bg-green-500 h-3 rounded-full transition-all duration-500"
                      style={{ 
                        width: maxWeeklyAmount > 0 ? `${(amount / maxWeeklyAmount) * 100}%` : '0%' 
                      }}
                    />
                  </div>
                </div>
                <div className="w-20 text-right text-sm font-semibold text-gray-900">
                  {formatCurrency(amount)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Selling Items */}
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Top Selling Items</h3>
          {topItems.length > 0 ? (
            <div className="space-y-4">
              {topItems.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-green-600">#{index + 1}</span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.quantity} units sold</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{formatCurrency(item.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No sales data available</p>
              <p className="text-sm">Start selling to see top performers</p>
            </div>
          )}
        </div>
      </div>

      {/* Additional Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white shadow-lg rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Inventory Status</h3>
            <Package className="h-6 w-6 text-blue-500" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Items</span>
              <span className="text-sm font-semibold text-gray-900">{items.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Value</span>
              <span className="text-sm font-semibold text-gray-900">{formatCurrency(totalInventoryValue)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-red-600">Low Stock Items</span>
              <span className="text-sm font-semibold text-red-600">{lowStockItems.length}</span>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-lg rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Performance</h3>
            <TrendingUp className="h-6 w-6 text-green-500" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Average Order Value</span>
              <span className="text-sm font-semibold text-gray-900">{formatCurrency(metrics.averageOrderValue)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Items per Sale</span>
              <span className="text-sm font-semibold text-gray-900">
                {metrics.totalSales > 0 ? (metrics.totalItemsSold / metrics.totalSales).toFixed(1) : '0'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Profit Margin</span>
              <span className={`text-sm font-semibold ${
                metrics.profitMargin > 25 ? 'text-green-600' : 
                metrics.profitMargin > 15 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {metrics.profitMargin.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 shadow-lg rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Business Health</h3>
            <Eye className="h-6 w-6 text-green-100" />
          </div>
          <div className="space-y-2">
            <p className="text-sm text-green-100">
              {metrics.profitMargin > 25 
                ? "🎉 Excellent performance!" 
                : metrics.profitMargin > 15 
                  ? "👍 Good progress!" 
                  : "📈 Room for improvement"
              }
            </p>
            <p className="text-lg font-bold">
              {formatCurrency(metrics.totalProfit)} profit {timeRange === 'today' ? 'today' : `this ${timeRange}`}
            </p>
            <p className="text-sm text-green-100">
              Keep growing your business! 🇪🇹
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;