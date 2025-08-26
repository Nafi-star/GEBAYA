import React, { useState, useEffect } from 'react';
import { X, Package } from 'lucide-react';
import { useInventory } from '../contexts/InventoryContext';

interface EditItemModalProps {
  isOpen: boolean;
  item: any;
  onClose: () => void;
}

const EditItemModal: React.FC<EditItemModalProps> = ({ isOpen, item, onClose }) => {
  const { updateItem } = useInventory();
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    quantity: 0,
    costPrice: 0,
    sellingPrice: 0,
    minThreshold: 5
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const categories = [
    'Food & Grains',
    'Beverages',
    'Spices',
    'Household',
    'Personal Care',
    'Electronics',
    'Textiles',
    'Stationery',
    'Other'
  ];

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        costPrice: item.costPrice,
        sellingPrice: item.sellingPrice,
        minThreshold: item.minThreshold
      });
    }
  }, [item]);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Item name is required';
    }
    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }
    if (formData.quantity < 0) {
      newErrors.quantity = 'Quantity cannot be negative';
    }
    if (formData.costPrice <= 0) {
      newErrors.costPrice = 'Cost price must be greater than 0';
    }
    if (formData.sellingPrice <= 0) {
      newErrors.sellingPrice = 'Selling price must be greater than 0';
    }
    if (formData.sellingPrice <= formData.costPrice) {
      newErrors.sellingPrice = 'Selling price must be higher than cost price';
    }
    if (formData.minThreshold < 0) {
      newErrors.minThreshold = 'Minimum threshold cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      updateItem(item.id, formData);
      setErrors({});
      onClose();
    }
  };

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Package className="h-6 w-6 text-green-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Edit Item</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Item Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter item name"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                errors.category ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select category</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Quantity
              </label>
              <input
                type="number"
                min="0"
                value={formData.quantity}
                onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                  errors.quantity ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0"
              />
              {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Threshold
              </label>
              <input
                type="number"
                min="0"
                value={formData.minThreshold}
                onChange={(e) => handleInputChange('minThreshold', parseInt(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                  errors.minThreshold ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="5"
              />
              {errors.minThreshold && <p className="text-red-500 text-xs mt-1">{errors.minThreshold}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cost Price (ብር) *
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.costPrice}
                onChange={(e) => handleInputChange('costPrice', parseFloat(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                  errors.costPrice ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
              {errors.costPrice && <p className="text-red-500 text-xs mt-1">{errors.costPrice}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Selling Price (ብር) *
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.sellingPrice}
                onChange={(e) => handleInputChange('sellingPrice', parseFloat(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                  errors.sellingPrice ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
              {errors.sellingPrice && <p className="text-red-500 text-xs mt-1">{errors.sellingPrice}</p>}
            </div>
          </div>

          {formData.costPrice > 0 && formData.sellingPrice > 0 && (
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-sm text-green-700">
                <strong>Profit per unit:</strong> {(formData.sellingPrice - formData.costPrice).toFixed(2)} ብር
                ({(((formData.sellingPrice - formData.costPrice) / formData.costPrice) * 100).toFixed(1)}%)
              </p>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
            >
              Update Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditItemModal;