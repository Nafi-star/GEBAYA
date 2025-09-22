import { useState } from 'react';
import { useInventory } from '../contexts/InventoryContext';
import { useSales } from '../contexts/SalesContext';
import { Package, TrendingUp, AlertTriangle, DollarSign, ShoppingCart, Calendar, Database, Box, X, Eye } from 'lucide-react';
import ExpiryAlertsPanel from '../components/ExpiryAlertsPanel';
import AutomationPanel from '../components/AutomationPanel';
import SmartSalesRecommendations from '../components/SmartSalesRecommendations';
import { getExpiryStatus } from '../utils/expiryUtils';
import { formatCurrency } from '../utils/currency';

export default function Dashboard() {
  const { items, expiryAlerts } = useInventory();
  const { sales } = useSales();
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // Calculate metrics
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const lowStockItems = items.filter(item => item.quantity <= (item as any).minStock || 0);
  const expiredItems = items.filter(item => getExpiryStatus(item.expiryDate || '') === 'expired');
  
  // Calculate remaining inventory
  const remainingInventoryValue = items.reduce((sum, item) => 
    sum + (item.quantity * item.costPrice), 0
  );
  
  const remainingItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Calculate today's sales and profit
  const today = new Date().toDateString();
  const todaySales = sales.filter(sale => new Date(sale.date).toDateString() === today);
  const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.total, 0);
  const todayItemsSold = todaySales.reduce((sum, sale) => sum + sale.quantity, 0);
  
  // Calculate profit (assuming 30% markup)
  const todayProfit = todayRevenue * 0.3;
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
  const totalProfit = totalRevenue * 0.3;

  const metrics = [
    {
      id: 'total-items',
      title: 'Total Items',
      value: totalItems.toString(),
      icon: Package,
      color: 'bg-blue-500',
      change: '+12%',
      onClick: () => setActiveModal('total-items')
    },
    {
      id: 'today-profit',
      title: "Today's Profit",
      value: `${todayProfit.toFixed(2)} ETB`,
      icon: DollarSign,
      color: 'bg-green-500',
      change: '+8%',
      onClick: () => setActiveModal('today-profit')
    },
    {
      id: 'items-sold-today',
      title: 'Items Sold Today',
      value: todayItemsSold.toString(),
      icon: ShoppingCart,
      color: 'bg-purple-500',
      change: '+15%',
      onClick: () => setActiveModal('items-sold-today')
    },
    {
      id: 'low-stock',
      title: 'Low Stock Alerts',
      value: lowStockItems.length.toString(),
      icon: AlertTriangle,
      color: 'bg-yellow-500',
      change: '-5%',
      onClick: () => setActiveModal('low-stock')
    },
    {
      id: 'expired',
      title: 'Expired Items',
      value: expiredItems.length.toString(),
      icon: Calendar,
      color: 'bg-red-500',
      change: 'urgent',
      onClick: () => setActiveModal('expired')
    },
    {
      id: 'total-profit',
      title: 'Total Profit',
      value: `${totalProfit.toFixed(2)} ETB`,
      icon: TrendingUp,
      color: 'bg-indigo-500',
      change: '+23%',
      onClick: () => setActiveModal('total-profit')
    },
    {
      id: 'inventory-value',
      title: 'Remaining Inventory Value',
      value: formatCurrency(remainingInventoryValue),
      icon: Database,
      color: 'bg-teal-500',
      change: '+5%',
      onClick: () => setActiveModal('inventory-value')
    },
    {
      id: 'items-remaining',
      title: 'Items Remaining',
      value: remainingItemsCount.toString(),
      icon: Box,
      color: 'bg-orange-500',
      change: '+8%',
      onClick: () => setActiveModal('items-remaining')
    }
  ];

  const renderModalContent = () => {
    switch (activeModal) {
      case 'total-items':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">All Inventory Items</h3>
            <p className="text-sm text-gray-600">Total of {totalItems} items across all categories</p>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Product</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Category</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Quantity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-2 text-sm">{item.name}</td>
                      <td className="px-4 py-2 text-sm">{item.category}</td>
                      <td className="px-4 py-2 text-sm">{item.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'today-profit':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Today's Profit Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-sm text-green-800">Revenue</p>
                <p className="text-lg font-bold text-green-900">{formatCurrency(todayRevenue)}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800">Profit (30%)</p>
                <p className="text-lg font-bold text-blue-900">{formatCurrency(todayProfit)}</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Item</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Qty</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Revenue</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {todaySales.map((sale) => (
                    <tr key={sale.id}>
                      <td className="px-4 py-2 text-sm">{sale.itemName}</td>
                      <td className="px-4 py-2 text-sm">{sale.quantity}</td>
                      <td className="px-4 py-2 text-sm">{formatCurrency(sale.total)}</td>
                      <td className="px-4 py-2 text-sm text-green-600">{formatCurrency(sale.profit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'items-sold-today':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Items Sold Today</h3>
            <p className="text-sm text-gray-600">Total {todayItemsSold} items sold</p>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Item</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Quantity</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Price</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {todaySales.map((sale) => (
                    <tr key={sale.id}>
                      <td className="px-4 py-2 text-sm">{sale.itemName}</td>
                      <td className="px-4 py-2 text-sm">{sale.quantity}</td>
                      <td className="px-4 py-2 text-sm">{formatCurrency(sale.total / sale.quantity)}</td>
                      <td className="px-4 py-2 text-sm font-medium">{formatCurrency(sale.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'low-stock':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Low Stock Items</h3>
            <p className="text-sm text-gray-600">Items that need immediate restocking</p>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Product</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Current</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Min Required</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {lowStockItems.map((item) => (
                    <tr key={item.id} className="bg-yellow-50">
                      <td className="px-4 py-2 text-sm font-medium">{item.name}</td>
                      <td className="px-4 py-2 text-sm">{item.quantity}</td>
                      <td className="px-4 py-2 text-sm">{(item as any).minStock || 0}</td>
                      <td className="px-4 py-2 text-sm">
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                          Low Stock
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'expired':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Expired Items</h3>
            <p className="text-sm text-gray-600">Items that have expired and need attention</p>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Product</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Quantity</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Expiry Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {expiredItems.map((item) => (
                    <tr key={item.id} className="bg-red-50">
                      <td className="px-4 py-2 text-sm font-medium">{item.name}</td>
                      <td className="px-4 py-2 text-sm">{item.quantity}</td>
                      <td className="px-4 py-2 text-sm">
                        {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                          Expired
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'total-profit':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Total Profit Overview</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-sm text-green-800">Total Revenue</p>
                <p className="text-lg font-bold text-green-900">{formatCurrency(totalRevenue)}</p>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800">Total Profit (30%)</p>
                <p className="text-lg font-bold text-blue-900">{formatCurrency(totalProfit)}</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Items Sold</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Revenue</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sales.slice().reverse().map((sale) => (
                    <tr key={sale.id}>
                      <td className="px-4 py-2 text-sm">{new Date(sale.date).toLocaleDateString()}</td>
                      <td className="px-4 py-2 text-sm">{sale.quantity}</td>
                      <td className="px-4 py-2 text-sm">{formatCurrency(sale.total)}</td>
                      <td className="px-4 py-2 text-sm text-green-600">{formatCurrency(sale.profit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'inventory-value':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Remaining Inventory Value</h3>
            <div className="bg-teal-50 p-4 rounded-lg">
              <p className="text-lg font-bold text-teal-900 text-center">
                Total Value: {formatCurrency(remainingInventoryValue)}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Product</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Quantity</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Cost Price</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Total Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-2 text-sm">{item.name}</td>
                      <td className="px-4 py-2 text-sm">{item.quantity}</td>
                      <td className="px-4 py-2 text-sm">{formatCurrency(item.costPrice)}</td>
                      <td className="px-4 py-2 text-sm font-medium text-green-600">
                        {formatCurrency(item.quantity * item.costPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'items-remaining':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Items Remaining in Inventory</h3>
            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-lg font-bold text-orange-900 text-center">
                Total Items: {remainingItemsCount}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Product</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Category</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Quantity</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {items.map((item) => {
                    const status = getExpiryStatus(item.expiryDate || '');
                    const statusColor = status === 'expired' ? 'bg-red-100 text-red-800' :
                                      status === 'expiring' ? 'bg-orange-100 text-orange-800' :
                                      item.quantity <= (item as any).minStock ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-green-100 text-green-800';
                    
                    return (
                      <tr key={item.id}>
                        <td className="px-4 py-2 text-sm font-medium">{item.name}</td>
                        <td className="px-4 py-2 text-sm">{item.category}</td>
                        <td className="px-4 py-2 text-sm">{item.quantity}</td>
                        <td className="px-4 py-2 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs ${statusColor}`}>
                            {status === 'expired' ? 'Expired' :
                             status === 'expiring' ? 'Expiring' :
                             item.quantity <= (item as any).minStock ? 'Low Stock' : 'In Stock'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => (
          <div 
            key={metric.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer group"
            onClick={metric.onClick}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{metric.value}</p>
              </div>
              <div className={`${metric.color} p-3 rounded-lg group-hover:scale-110 transition-transform`}>
                <metric.icon className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className={`text-sm font-medium ${
                metric.change === 'urgent' ? 'text-red-600' : 
                metric.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
              }`}>
                {metric.change === 'urgent' ? '⚠️ Needs attention' : metric.change}
              </span>
              <Eye className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        ))}
      </div>

      {/* Alerts and Automation Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ExpiryAlertsPanel alerts={expiryAlerts} />
        <AutomationPanel />
      </div>

      {/* Smart Recommendations */}
      <SmartSalesRecommendations items={items} />

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

      {/* Modal for detailed views */}
      {activeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                {metrics.find(m => m.id === activeModal)?.title}
              </h2>
              <button
                onClick={() => setActiveModal(null)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            {renderModalContent()}
          </div>
        </div>
      )}
    </div>
  ); 
}