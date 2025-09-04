import React from 'react';
import { TrendingUp, Clock, AlertTriangle, Zap } from 'lucide-react';
import { InventoryItem } from '../types/inventory';
import { formatCurrency } from '../utils/currency';

interface SmartSalesRecommendationsProps {
  items: InventoryItem[];
  onSelectItem?: (itemId: string) => void;
}

const SmartSalesRecommendations: React.FC<SmartSalesRecommendationsProps> = ({ 
  items, 
  onSelectItem 
}) => {
  // Get items that should be prioritized for sale
  const priorityItems = items
    .filter(item => item.quantity > 0 && (item.priority === 'high' || item.priority === 'medium'))
    .slice(0, 5);

  if (priorityItems.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center mb-4">
          <Zap className="h-6 w-6 text-green-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Smart Sales Recommendations</h3>
        </div>
        <div className="text-center py-8">
          <TrendingUp className="h-12 w-12 text-green-300 mx-auto mb-3" />
          <p className="text-green-600 font-medium">All items are optimally positioned!</p>
          <p className="text-sm text-gray-500">No urgent sales recommendations at this time</p>
        </div>
      </div>
    );
  }

  const getRecommendationReason = (item: InventoryItem): string => {
    if (item.isExpired) return 'Expired - Remove from sale';
    if (item.daysUntilExpiry !== undefined && item.daysUntilExpiry <= 3) return 'Expires very soon';
    if (item.daysUntilExpiry !== undefined && item.daysUntilExpiry <= 7) return 'Expires this week';
    if (item.quantity <= item.minThreshold) return 'Low stock';
    return 'Priority item';
  };

  const getRecommendationAction = (item: InventoryItem): string => {
    if (item.isExpired) return 'Remove from inventory';
    if (item.daysUntilExpiry !== undefined && item.daysUntilExpiry <= 3) return 'Sell immediately or discount';
    if (item.daysUntilExpiry !== undefined && item.daysUntilExpiry <= 7) return 'Promote for quick sale';
    return 'Focus sales efforts';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Zap className="h-6 w-6 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Smart Sales Recommendations</h3>
        </div>
        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
          AI Powered
        </span>
      </div>

      <div className="space-y-4">
        {priorityItems.map((item, index) => (
          <div
            key={item.id}
            className={`p-4 rounded-lg border-l-4 cursor-pointer hover:shadow-md transition-all duration-200 ${
              item.isExpired 
                ? 'bg-red-50 border-red-500 hover:bg-red-100' 
                : item.priority === 'high'
                  ? 'bg-orange-50 border-orange-500 hover:bg-orange-100'
                  : 'bg-yellow-50 border-yellow-500 hover:bg-yellow-100'
            }`}
            onClick={() => onSelectItem?.(item.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-sm font-semibold text-blue-600">#{index + 1}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center">
                    <h4 className="text-sm font-semibold text-gray-900">{item.name}</h4>
                    {item.isExpired && <AlertTriangle className="h-4 w-4 text-red-500 ml-2" />}
                    {item.priority === 'high' && !item.isExpired && <Clock className="h-4 w-4 text-orange-500 ml-2" />}
                  </div>
                  <p className="text-xs text-gray-600">{getRecommendationReason(item)}</p>
                  <p className="text-xs font-medium text-blue-600">{getRecommendationAction(item)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">{formatCurrency(item.sellingPrice)}</p>
                <p className="text-xs text-gray-500">Stock: {item.quantity}</p>
                {item.expiryDate && (
                  <p className={`text-xs font-medium ${
                    item.isExpired ? 'text-red-600' :
                    item.daysUntilExpiry && item.daysUntilExpiry <= 3 ? 'text-orange-600' :
                    'text-yellow-600'
                  }`}>
                    {item.isExpired ? 'Expired' : 
                     item.daysUntilExpiry === 0 ? 'Today' :
                     item.daysUntilExpiry === 1 ? 'Tomorrow' :
                     `${item.daysUntilExpiry}d left`}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
        <div className="flex items-center">
          <TrendingUp className="h-5 w-5 text-blue-600 mr-2" />
          <div>
            <h4 className="text-sm font-semibold text-blue-900">Smart Tip</h4>
            <p className="text-xs text-blue-700">
              Focus on selling items with expiry dates first to minimize waste and maximize profit. 
              Consider offering discounts on items expiring within 3 days.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartSalesRecommendations;