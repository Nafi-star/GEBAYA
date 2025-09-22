import React, { useState, useEffect } from 'react';
import { X, Search, AlertTriangle, Clock, Package } from 'lucide-react';
import { useInventory } from '../contexts/InventoryContext';
import { useSales } from '../contexts/SalesContext'; // Add this import
import { InventoryItem } from '../types/inventory';
import { getExpiryStatus, getDaysUntilExpiry, getPriorityLevel } from '../utils/expiryUtils';

interface RecordSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RecordSaleModal: React.FC<RecordSaleModalProps> = ({ isOpen, onClose }) => {
  const { items } = useInventory(); // Only get items from InventoryContext
  const { recordSale } = useSales(); // Get recordSale from SalesContext
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [salePrice, setSalePrice] = useState(0);
  const [customerName, setCustomerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sort items by priority (expired/expiring first)
  const sortedItems = [...items].sort((a, b) => {
    const aPriority = getPriorityLevel(a.expiryDate || '');
    const bPriority = getPriorityLevel(b.expiryDate || '');
    
    // Convert priority to numeric for sorting (high=3, medium=2, low=1)
    const priorityValues = { 'high': 3, 'medium': 2, 'low': 1 };
    return priorityValues[bPriority as keyof typeof priorityValues] - priorityValues[aPriority as keyof typeof priorityValues];
  });

  const filteredItems = sortedItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (selectedItem) {
      setSalePrice(selectedItem.sellingPrice);
    }
  }, [selectedItem]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || quantity <= 0) return;

    setIsSubmitting(true);
    try {
      await recordSale({
        itemId: selectedItem.id,
        itemName: selectedItem.name,
        quantity,
        salePrice: salePrice,
        costPrice: selectedItem.costPrice, // Add costPrice
        totalAmount: quantity * salePrice,
        profit: (salePrice - selectedItem.costPrice) * quantity,
        // Remove date and customerName since SalesContext doesn't expect them
      });

      // Reset form
      setSelectedItem(null);
      setQuantity(1);
      setSalePrice(0);
      setCustomerName('');
      setSearchTerm('');
      onClose();
    } catch (error) {
      console.error('Error recording sale:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getExpiryWarning = (item: InventoryItem) => {
    const status = getExpiryStatus(item.expiryDate || '');
    const daysUntil = getDaysUntilExpiry(item.expiryDate || '');
    
    if (status === 'expired') {
      return {
        message: 'This item has expired!',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        icon: AlertTriangle
      };
    } else if (status === 'expiring') {
      return {
        message: `Expires in ${daysUntil} day${daysUntil === 1 ? '' : 's'}`,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        icon: Clock
      };
    }
    return null;
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      'high': 'bg-red-100 text-red-800',
      'medium': 'bg-orange-100 text-orange-800',
      'low': 'bg-green-100 text-green-800'
    };
    return colors[priority as keyof typeof colors] || colors.low;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Record Sale</h2>
          <button
            onClick={() => {
              onClose();
              setSelectedItem(null);
              setSearchTerm('');
            }}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Item Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Item
            </label>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
              {filteredItems.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <Package className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  No items found
                </div>
              ) : (
                filteredItems.map((item) => {
                  const warning = getExpiryWarning(item);
                  const priority = getPriorityLevel(item.expiryDate || '');
                  
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedItem?.id === item.id ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-gray-800">{item.name}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadge(priority)}`}>
                              {priority}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            Stock: {item.quantity} | Price: ${item.sellingPrice.toFixed(2)}
                          </p>
                          {item.expiryDate && (
                            <p className="text-xs text-gray-500">
                              Expires: {new Date(item.expiryDate).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        {warning && (
                          <div className={`flex items-center gap-1 px-2 py-1 rounded-md ${warning.bgColor}`}>
                            <warning.icon className={`w-4 h-4 ${warning.color}`} />
                            <span className={`text-xs ${warning.color}`}>
                              {warning.message}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Sale Details */}
          {selectedItem && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-800">Sale Details for: {selectedItem.name}</h3>
              
              {/* Expiry Warning */}
              {(() => {
                const warning = getExpiryWarning(selectedItem);
                if (warning) {
                  return (
                    <div className={`flex items-center gap-2 p-3 rounded-lg ${warning.bgColor}`}>
                      <warning.icon className={`w-5 h-5 ${warning.color}`} />
                      <span className={`font-medium ${warning.color}`}>
                        {warning.message}
                      </span>
                    </div>
                  );
                }
                return null;
              })()}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={selectedItem.quantity}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Available: {selectedItem.quantity}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={salePrice}
                    onChange={(e) => setSalePrice(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Name (Optional)
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter customer name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="bg-white p-3 rounded-lg border">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">Total Amount:</span>
                  <span className="text-xl font-bold text-green-600">
                    ${(quantity * salePrice).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2 text-sm text-gray-600">
                  <span>Estimated Profit:</span>
                  <span className={`font-medium ${(salePrice - selectedItem.costPrice) * quantity >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${((salePrice - selectedItem.costPrice) * quantity).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                onClose();
                setSelectedItem(null);
                setSearchTerm('');
              }}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedItem || quantity <= 0 || quantity > (selectedItem?.quantity || 0) || isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Recording...' : 'Record Sale'}
            </button>
          </div>

          {selectedItem && quantity > selectedItem.quantity && (
            <div className="text-red-600 text-sm text-center">
              Cannot sell more than available stock
            </div>
          )}
        </form>
      </div>
    </div>
  );
};