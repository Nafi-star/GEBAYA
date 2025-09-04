import React from 'react';
import { useInventory } from '../contexts/InventoryContext';
import { useSales } from '../contexts/SalesContext';
import { Package, TrendingUp, AlertTriangle, DollarSign, ShoppingCart, Calendar } from 'lucide-react';
import { ExpiryAlertsPanel } from '../components/ExpiryAlertsPanel';
import { AutomationPanel } from '../components/AutomationPanel';
import { SmartSalesRecommendations } from '../components/SmartSalesRecommendations';
import { getExpiryStatus, getDaysUntilExpiry } from '../utils/expiryUtils';

export default function Dashboard() {
  const { items } = useInventory();
  const { sales } = useSales();

  // Calculate metrics
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const lowStockItems = items.filter(item => item.quantity <= item.minStock);
  const expiredItems = items.filter(item => getExpiryStatus(item.expiryDate) === 'expired');
  const expiringItems = items.filter(item => {
    const status = getExpiryStatus(item.expiryDate);
    return status === 'expiring-soon' || status === 'expiring-today';
  });

  // Calculate today's sales and profit
  const today = new Date().toDateString();
  const todaySales = sales.filter(sale => new Date(sale.date).toDateString() === today);
  const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const todayItemsSold = todaySales.reduce((sum, sale) => sum + sale.quantity, 0);
  
  // Calculate profit (assuming 30% markup)
  const todayProfit = todayRevenue * 0.3;
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
  const totalProfit = totalRevenue * 0.3;

  const metrics = [
    {
      title: 'Total Items',
      value: totalItems.toString(),
      icon: Package,
      color: 'bg-blue-500',
      change: '+12%'
    },
    {
      title: "Today's Profit",
      value: `${todayProfit.toFixed(2)} ETB`,
      icon: DollarSign,
      color: 'bg-green-500',
      change: '+8%'
    },
    {
      title: 'Items Sold Today',
      value: todayItemsSold.toString(),
      icon: ShoppingCart,
      color: 'bg-purple-500',
      change: '+15%'
    },
    {
      title: 'Low Stock Alerts',
      value: lowStockItems.length.toString(),
      icon: AlertTriangle,
      color: 'bg-yellow-500',
      change: '-5%'
    },
    {
      title: 'Expired Items',
      value: expiredItems.length.toString(),
      icon: Calendar,
      color: 'bg-red-500',
      change: 'urgent'
    },
    {
      title: 'Total Profit',
      value: `${totalProfit.toFixed(2)} ETB`,
      icon: TrendingUp,
      color: 'bg-indigo-500',
      change: '+23%'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's what's happening with your inventory.</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Last updated</p>
          <p className="text-lg font-semibold text-gray-900">{new Date().toLocaleTimeString()}</p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map((metric, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{metric.value}</p>
              </div>
              <div className={`${metric.color} p-3 rounded-lg`}>
                <metric.icon className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className={`text-sm font-medium ${
                metric.change === 'urgent' ? 'text-red-600' : 
                metric.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
              }`}>
                {metric.change === 'urgent' ? '⚠️ Needs attention' : metric.change}
              </span>
              <span className="text-sm text-gray-500 ml-1">vs last week</span>
            </div>
          </div>
        ))}
      </div>

      {/* Alerts and Automation Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ExpiryAlertsPanel />
        <AutomationPanel />
      </div>

      {/* Smart Recommendations */}
      <SmartSalesRecommendations />

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center justify-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
            <Package className="w-5 h-5 text-blue-600 mr-2" />
            <span className="text-blue-700 font-medium">Add New Item</span>
          </button>
          <button className="flex items-center justify-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
            <ShoppingCart className="w-5 h-5 text-green-600 mr-2" />
            <span className="text-green-700 font-medium">Record Sale</span>
          </button>
          <button className="flex items-center justify-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
            <TrendingUp className="w-5 h-5 text-purple-600 mr-2" />
            <span className="text-purple-700 font-medium">View Analytics</span>
          </button>
        </div>
      </div>
    </div>
  );
}