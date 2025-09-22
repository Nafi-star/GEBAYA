import React, { useState } from 'react';
import { 
  ShoppingCart, 
  Plus, 
  Search, 
  Calendar, 
  TrendingUp,
  DollarSign,
  Package,
  Clock
} from 'lucide-react';
import { useSales } from '../contexts/SalesContext';
import { useInventory } from '../contexts/InventoryContext';
import { formatCurrency } from '../utils/currency';
import { RecordSaleModal } from '../components/RecordSaleModal';

const Sales: React.FC = () => {
  const { sales, getTodaysSales, getWeeklySales, getTodaysProfit, getWeeklyProfit } = useSales();
  const { items } = useInventory();
  const [isRecordSaleModalOpen, setIsRecordSaleModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'all'>('today');

  const todaysSales = getTodaysSales();
  const weeklySales = getWeeklySales();
  const todaysProfit = getTodaysProfit();
  const weeklyProfit = getWeeklyProfit();

  const getFilteredSales = () => {
    let filtered = sales;
    
    if (dateFilter === 'today') {
      filtered = todaysSales;
    } else if (dateFilter === 'week') {
      filtered = weeklySales;
    }
    
    if (searchTerm) {
      filtered = filtered.filter(sale => 
        sale.itemName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const filteredSales = getFilteredSales();
  
  // Add fallback values to handle undefined properties
  const displayProfit = dateFilter === 'today' ? todaysProfit : dateFilter === 'week' ? weeklyProfit : 
    sales.reduce((sum, sale) => sum + (sale.profit || 0), 0);
  
  const displayRevenue = filteredSales.reduce((sum, sale) => sum + (sale.totalAmount || sale.total || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Sales Management</h1>
            <p className="text-gray-600">Track your sales and profits</p>
          </div>
          <button
            onClick={() => setIsRecordSaleModalOpen(true)}
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
          >
            <Plus className="h-5 w-5 mr-2" />
            Record Sale
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <ShoppingCart className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-900">
                  {dateFilter === 'today' ? "Today's Sales" : dateFilter === 'week' ? "This Week" : "Total Sales"}
                </p>
                <p className="text-2xl font-bold text-blue-600">{filteredSales.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-900">Revenue</p>
                <p className="text-xl font-bold text-green-600">{formatCurrency(displayRevenue)}</p>
              </div>
            </div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-yellow-900">Profit</p>
                <p className="text-xl font-bold text-yellow-600">{formatCurrency(displayProfit)}</p>
              </div>
            </div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-purple-900">Items Sold</p>
                <p className="text-2xl font-bold text-purple-600">
                  {filteredSales.reduce((sum, sale) => sum + (sale.quantity || 0), 0)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search sales by item name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sales List */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Sales History</h3>
        </div>
        
        {filteredSales.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Profit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{sale.itemName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{sale.quantity || 0}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatCurrency(sale.salePrice || sale.unitPrice)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(sale.totalAmount || sale.total)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-green-600">
                        +{formatCurrency(sale.profit)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(sale.date).toLocaleDateString('en-ET')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(sale.date).toLocaleTimeString('en-ET', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No sales found</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm 
                ? 'Try adjusting your search terms' 
                : dateFilter === 'today' 
                  ? "You haven't recorded any sales today" 
                  : "No sales recorded for this period"}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setIsRecordSaleModalOpen(true)}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
              >
                <Plus className="h-5 w-5 mr-2" />
                Record Your First Sale
              </button>
            )}
          </div>
        )}
      </div>

      {/* Record Sale Modal */}
      <RecordSaleModal 
        isOpen={isRecordSaleModalOpen} 
        onClose={() => setIsRecordSaleModalOpen(false)} 
      />
    </div>
  );
};

export default Sales;