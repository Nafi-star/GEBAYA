import React, { useState } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  AlertTriangle,
  CheckCircle,
  TrendingUp
} from 'lucide-react';
import { useInventory } from '../contexts/InventoryContext';
import { formatCurrency } from '../utils/currency';
import AddItemModal from '../components/AddItemModal';
import EditItemModal from '../components/EditItemModal';

const Inventory: React.FC = () => {
  const { items, deleteItem, getLowStockItems } = useInventory();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState<'all' | 'low-stock' | 'in-stock'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const lowStockItems = getLowStockItems();

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterBy === 'low-stock') {
      return matchesSearch && item.quantity <= item.minThreshold;
    } else if (filterBy === 'in-stock') {
      return matchesSearch && item.quantity > item.minThreshold;
    }
    
    return matchesSearch;
  });

  const handleDeleteItem = (itemId: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      deleteItem(itemId);
    }
  };

  const getStockStatusColor = (item: any) => {
    if (item.quantity === 0) return 'text-red-600 bg-red-100';
    if (item.quantity <= item.minThreshold) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getStockStatusIcon = (item: any) => {
    if (item.quantity === 0) return <AlertTriangle className="h-4 w-4" />;
    if (item.quantity <= item.minThreshold) return <AlertTriangle className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Inventory Management</h1>
            <p className="text-gray-600">Track and manage your stock levels</p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add New Item
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-900">Total Items</p>
                <p className="text-2xl font-bold text-blue-600">{items.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-red-900">Low Stock</p>
                <p className="text-2xl font-bold text-red-600">{lowStockItems.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-900">In Stock</p>
                <p className="text-2xl font-bold text-green-600">
                  {items.filter(item => item.quantity > item.minThreshold).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-yellow-900">Total Value</p>
                <p className="text-xl font-bold text-yellow-600">
                  {formatCurrency(items.reduce((sum, item) => sum + (item.quantity * item.costPrice), 0))}
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
              placeholder="Search items by name or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as any)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
            >
              <option value="all">All Items</option>
              <option value="low-stock">Low Stock</option>
              <option value="in-stock">In Stock</option>
            </select>
          </div>
        </div>
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => (
          <div key={item.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 truncate">{item.name}</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setEditingItem(item)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Category</span>
                  <span className="text-sm font-medium text-gray-900">{item.category}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Cost Price</span>
                  <span className="text-sm font-medium text-gray-900">{formatCurrency(item.costPrice)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Selling Price</span>
                  <span className="text-sm font-medium text-green-600">{formatCurrency(item.sellingPrice)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Profit Margin</span>
                  <span className="text-sm font-medium text-green-600">
                    {formatCurrency(item.sellingPrice - item.costPrice)}
                  </span>
                </div>

                <div className="pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 mr-2">Stock:</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStockStatusColor(item)}`}>
                        {getStockStatusIcon(item)}
                        <span className="ml-1">{item.quantity}</span>
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Min: {item.minThreshold}</p>
                      <p className="text-xs text-gray-500">Value: {formatCurrency(item.quantity * item.costPrice)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
          <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No items found</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm ? 'Try adjusting your search terms' : 'Get started by adding your first inventory item'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add First Item
            </button>
          )}
        </div>
      )}

      {/* Modals */}
      <AddItemModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
      {editingItem && (
        <EditItemModal
          isOpen={!!editingItem}
          item={editingItem}
          onClose={() => setEditingItem(null)}
        />
      )}
    </div>
  );
};

export default Inventory;