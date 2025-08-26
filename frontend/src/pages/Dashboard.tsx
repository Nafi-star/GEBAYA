import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  ShoppingCart, 
  AlertTriangle,
  DollarSign,
  Eye,
  Plus
} from 'lucide-react';
import { useInventory } from '../contexts/InventoryContext';
import { useSales } from '../contexts/SalesContext';
import { formatCurrency } from '../utils/currency';

const Dashboard: React.FC = () => {
  const { items, getLowStockItems } = useInventory();
  const { sales, getTodaysSales, getWeeklySales, getTodaysProfit } = useSales();

  const lowStockItems = getLowStockItems();
  const todaysSales = getTodaysSales();
  const weeklySales = getWeeklySales();
  const todaysProfit = getTodaysProfit();
  const totalItemsValue = items.reduce((sum, item) => sum + (item.quantity * item.costPrice), 0);

  const stats = [
    {
      title: 'Today\'s Sales',
      value: formatCurrency(todaysSales.reduce((sum, sale) => sum + sale.total, 0)),
      change: '+12%',
      changeType: 'positive',
      icon: ShoppingCart,
      color: 'bg-blue-500',
    },
    {
      title: 'Today\'s Profit',
      value: formatCurrency(todaysProfit),
      change: '+8%',
      changeType: 'positive',
      icon: DollarSign,
      color: 'bg-green-500',
    },
    {
      title: 'Total Inventory Value',
      value: formatCurrency(totalItemsValue),
      change: '0%',
      changeType: 'neutral',
      icon: Package,
      color: 'bg-yellow-500',
    },
    {
      title: 'Low Stock Items',
      value: lowStockItems.length.toString(),
      change: lowStockItems.length > 0 ? 'Needs attention' : 'All good',
      changeType: lowStockItems.length > 0 ? 'negative' : 'positive',
      icon: AlertTriangle,
      color: lowStockItems.length > 0 ? 'bg-red-500' : 'bg-green-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Welcome to GebeyaNet! 🇪🇹</h1>
        <p className="text-green-100">
          Your digital partner for smart inventory management and business growth
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="bg-white overflow-hidden shadow-lg rounded-lg hover:shadow-xl transition-shadow duration-200"
            >
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`${stat.color} p-3 rounded-md`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {stat.title}
                      </dt>
                      <dd className="text-lg font-semibold text-gray-900">
                        {stat.value}
                      </dd>
                    </dl>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center text-sm">
                    {stat.changeType === 'positive' ? (
                      <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    ) : stat.changeType === 'negative' ? (
                      <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                    ) : null}
                    <span
                      className={
                        stat.changeType === 'positive'
                          ? 'text-green-600'
                          : stat.changeType === 'negative'
                          ? 'text-red-600'
                          : 'text-gray-500'
                      }
                    >
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
        {/* Recent Sales */}
        <div className="bg-white shadow-lg rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Recent Sales</h3>
              <button className="text-green-600 hover:text-green-700 text-sm font-medium">
                View all
              </button>
            </div>
          </div>
          <div className="px-6 py-4">
            {todaysSales.length > 0 ? (
              <div className="space-y-4">
                {todaysSales.slice(0, 5).map((sale) => (
                  <div key={sale.id} className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{sale.itemName}</p>
                      <p className="text-xs text-gray-500">
                        Qty: {sale.quantity} × {formatCurrency(sale.unitPrice)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        {formatCurrency(sale.total)}
                      </p>
                      <p className="text-xs text-green-600">
                        +{formatCurrency(sale.profit)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No sales recorded today</p>
                <p className="text-sm">Start recording sales to see them here</p>
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white shadow-lg rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Stock Alerts</h3>
              {lowStockItems.length > 0 && (
                <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {lowStockItems.length} items
                </span>
              )}
            </div>
          </div>
          <div className="px-6 py-4">
            {lowStockItems.length > 0 ? (
              <div className="space-y-4">
                {lowStockItems.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-500">
                        Current: {item.quantity} | Min: {item.minThreshold}
                      </p>
                    </div>
                    <div className="flex items-center">
                      <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
                      <span className="text-sm font-semibold text-red-600">Low Stock</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-3 text-green-300" />
                <p className="text-green-600 font-medium">All items well stocked!</p>
                <p className="text-sm">No low stock alerts at this time</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow-lg rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <button className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors duration-200">
            <Plus className="h-8 w-8 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-blue-900">Add Item</span>
          </button>
          <button className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors duration-200">
            <ShoppingCart className="h-8 w-8 text-green-600 mb-2" />
            <span className="text-sm font-medium text-green-900">Record Sale</span>
          </button>
          <button className="flex flex-col items-center p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors duration-200">
            <Eye className="h-8 w-8 text-yellow-600 mb-2" />
            <span className="text-sm font-medium text-yellow-900">View Inventory</span>
          </button>
          <button className="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors duration-200">
            <TrendingUp className="h-8 w-8 text-purple-600 mb-2" />
            <span className="text-sm font-medium text-purple-900">Analytics</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;