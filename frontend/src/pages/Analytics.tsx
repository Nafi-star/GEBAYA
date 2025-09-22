import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Package, 
  ShoppingCart,
  Calendar,
  Eye,
  ArrowUp,
  ArrowDown,
  Clock,
  AlertTriangle,
  Trash2,
  Filter,
  Search,
  CheckCircle
} from 'lucide-react';
import { useSales } from '../contexts/SalesContext';
import { useInventory } from '../contexts/InventoryContext';
import { formatCurrency } from '../utils/currency';

const Analytics: React.FC = () => {
  const { sales, getTodaysSales, getWeeklySales } = useSales();
  const { items, getExpiringItems, getExpiredItems, expiryAlerts, updateItemQuantity, removeItem } = useInventory();
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('week');
  const [xStockTab, setXStockTab] = useState<'expired' | 'expiring' | 'reports'>('expired');
  const [quantityToRemove, setQuantityToRemove] = useState<{[key: string]: number}>({});
  const [searchTerm, setSearchTerm] = useState('');

  const expiringItems = getExpiringItems();
  const expiredItems = getExpiredItems();

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
    const itemSales: { [key: string]: { name: string; quantity: number; revenue: number } } = {};
    
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
    
    days.forEach(day => {
      weekData[day] = 0;
    });

    const weekSales = getWeeklySales();
    weekSales.forEach(sale => {
      const saleDate = new Date(sale.date);
      if (!isNaN(saleDate.getTime())) {
        const dayName = days[saleDate.getDay()];
        weekData[dayName] += sale.total;
      }
    });

    return Object.entries(weekData).map(([day, amount]) => ({ day, amount }));
  };

  // XStock Functions
  const handleQuantityChange = (itemId: string, value: number) => {
    setQuantityToRemove(prev => ({
      ...prev,
      [itemId]: Math.max(0, Math.min(value, items.find(item => item.id === itemId)?.quantity || 0))
    }));
  };

  const handleRemoveExpired = (itemId: string) => {
    const quantity = quantityToRemove[itemId] || 0;
    if (quantity > 0) {
      updateItemQuantity(itemId, -quantity);
      setQuantityToRemove(prev => {
        const newState = { ...prev };
        delete newState[itemId];
        return newState;
      });
    }
  };

  const handleRemoveAllExpired = () => {
    expiredItems.forEach(item => {
      removeItem(item.id);
    });
    setQuantityToRemove({});
  };

  const filteredExpiredItems = expiredItems.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredExpiringItems = expiringItems.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const topItems = getTopSellingItems();
  const weeklyData = getWeeklySalesData();
  const maxWeeklyAmount = Math.max(...weeklyData.map(d => d.amount), 1);

  // Calculate inventory value
  const totalInventoryValue = items.reduce((sum, item) => sum + (item.quantity * item.costPrice), 0);
  const lowStockItems = items.filter(item => item.quantity <= item.minThreshold);
  const wasteValue = expiredItems.reduce((sum, item) => sum + (item.quantity * item.costPrice), 0);

  // Calculate waste reduction metrics
  const totalWastePrevention = items.reduce((sum, item) => sum + (((item as any).quantityReducedDueToExpiry ?? 0) * item.costPrice), 0);
  const itemsWithWasteReduction = items.filter(item => ((item as any).quantityReducedDueToExpiry ?? 0) > 0).length;

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
    },
    {
      title: 'Expiry Alerts',
      value: expiryAlerts.length.toString(),
      change: expiryAlerts.length > 0 ? 'Needs attention' : 'All fresh',
      changeType: expiryAlerts.length > 0 ? 'negative' as const : 'positive' as const,
      icon: Clock,
      color: expiryAlerts.length > 0 ? 'bg-orange-500' : 'bg-green-500'
    },
    {
      title: 'Waste Value',
      value: formatCurrency(wasteValue),
      change: wasteValue > 0 ? 'Minimize waste' : 'No waste',
      changeType: wasteValue > 0 ? 'negative' as const : 'positive' as const,
      icon: AlertTriangle,
      color: wasteValue > 0 ? 'bg-red-500' : 'bg-green-500'
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
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as 'today' | 'week' | 'month')}
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

      {/* XStock Management Section */}
      <div className="bg-white shadow-lg rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">XStock - Expiry Management</h2>
            <p className="text-gray-600">Manage expired and expiring items to reduce waste</p>
          </div>
          <div className="flex space-x-2 mt-4 sm:mt-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={xStockTab}
                onChange={(e) => setXStockTab(e.target.value as 'expired' | 'expiring' | 'reports')}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
              >
                <option value="expired">Expired Items</option>
                <option value="expiring">Expiring Soon</option>
                <option value="reports">Waste Reports</option>
              </select>
            </div>
          </div>
        </div>

        {xStockTab === 'expired' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Expired Items</h3>
              {filteredExpiredItems.length > 0 && (
                <button
                  onClick={handleRemoveAllExpired}
                  className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove All Expired
                </button>
              )}
            </div>
            
            {filteredExpiredItems.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Quantity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remove Quantity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredExpiredItems.map((item) => (
                      <tr key={item.id} className="bg-red-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{item.name}</div>
                          <div className="text-sm text-gray-500">Cost: {formatCurrency(item.costPrice)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            min="0"
                            max={item.quantity}
                            value={quantityToRemove[item.id] || 0}
                            onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 0)}
                            className="w-20 px-2 py-1 border border-gray-300 rounded-md"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleRemoveExpired(item.id)}
                            disabled={!quantityToRemove[item.id] || quantityToRemove[item.id] <= 0}
                            className="text-red-600 hover:text-red-900 disabled:text-gray-400 disabled:cursor-not-allowed"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <p className="text-gray-500">No expired items found</p>
              </div>
            )}
          </div>
        )}

        {xStockTab === 'expiring' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Items Expiring Soon (within 7 days)</h3>
            
            {filteredExpiringItems.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredExpiringItems.map((item) => {
                      const expiryDate = item.expiryDate ? new Date(item.expiryDate) : null;
                      const today = new Date();
                      const diffDays = expiryDate && !isNaN(expiryDate.getTime())
                        ? Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                        : null;
                      
                      return (
                        <tr key={item.id} className="bg-orange-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{item.name}</div>
                            <div className="text-sm text-gray-500">Cost: {formatCurrency(item.costPrice)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {expiryDate ? expiryDate.toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.quantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800">
                              {diffDays !== null ? `Expires in ${diffDays} days` : 'No expiry date'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <p className="text-gray-500">No items expiring soon</p>
              </div>
            )}
          </div>
        )}

        {xStockTab === 'reports' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Waste Management Reports</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-red-50 p-4 rounded-lg">
                <h4 className="font-semibold text-red-800 mb-2">Current Waste Status</h4>
                <p className="text-red-600">Potential Waste Value: {formatCurrency(wasteValue)}</p>
                <p className="text-red-600">Expired Items: {expiredItems.length}</p>
                <p className="text-red-600">Items Expiring Soon: {expiringItems.length}</p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-2">Waste Prevention</h4>
                <p className="text-green-600">Total Waste Prevented: {formatCurrency(totalWastePrevention)}</p>
                <p className="text-green-600">Items With Waste Reduction: {itemsWithWasteReduction}</p>
                <p className="text-green-600">Last Reduction: {new Date().toLocaleDateString()}</p>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h4 className="font-semibold text-gray-800 mb-2">Waste Reduction Tips</h4>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>Regularly check expiry dates and prioritize selling items nearing expiration</li>
                <li>Implement a FIFO (First-In, First-Out) system for inventory management</li>
                <li>Consider discounts for items approaching their expiry date</li>
                <li>Track which items frequently expire to adjust purchasing quantities</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Sales Chart */}
        <div className="bg-white shadow-lg rounded-lg p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Weekly Sales Trend</h3>
          <div className="space-y-4">
            {weeklyData.map(({ day, amount }) => (
              <div key={day} className="flex items-center">
                <div className="w-12 text-sm font-medium text-gray-600">{day}</div>
                <div className="flex-1 mx-4">
                  <div className="relative">
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-green-500 h-3 rounded-full transition-all duration-500"
                        style={{ width: maxWeeklyAmount > 0 ? `${(amount / maxWeeklyAmount) * 100}%` : '0%' }}
                      ></div>
                    </div>
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
        <div className="bg-white shadow-lg rounded-lg p-6 lg:col-span-1">
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
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
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

        <div className="bg-white shadow-lg rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Expiry Management</h3>
            <Clock className="h-6 w-6 text-orange-500" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Expiring Soon</span>
              <span className="text-sm font-semibold text-orange-600">{expiringItems.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Expired Items</span>
              <span className="text-sm font-semibold text-red-600">{expiredItems.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-red-600">Waste Value</span>
              <span className="text-sm font-semibold text-red-600">{formatCurrency(wasteValue)}</span>
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