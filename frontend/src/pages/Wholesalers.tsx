import React, { useState } from 'react';
import { 
  Store, 
  Search, 
  MapPin, 
  Phone, 
  MessageSquare,
  ExternalLink,
  Filter,
  Star,
  Clock,
  Package
} from 'lucide-react';
import { formatCurrency } from '../utils/currency';

interface Wholesaler {
  id: string;
  name: string;
  location: string;
  phone: string;
  whatsapp: string;
  rating: number;
  specialties: string[];
  items: {
    id: string;
    name: string;
    price: number;
    minOrder: number;
    category: string;
    inStock: boolean;
  }[];
}

const mockWholesalers: Wholesaler[] = [
  {
    id: '1',
    name: 'Merkato Trading House',
    location: 'Merkato, Addis Ababa',
    phone: '+251-911-123456',
    whatsapp: '+251-911-123456',
    rating: 4.5,
    specialties: ['Electronics', 'Household Items', 'Textiles'],
    items: [
      { id: '1', name: 'Samsung Galaxy Phone', price: 15000, minOrder: 1, category: 'Electronics', inStock: true },
      { id: '2', name: 'Kitchen Utensils Set', price: 500, minOrder: 5, category: 'Household', inStock: true },
      { id: '3', name: 'Cotton T-Shirts', price: 200, minOrder: 10, category: 'Textiles', inStock: false },
    ]
  },
  {
    id: '2',
    name: 'Piassa Wholesale Center',
    location: 'Piassa, Addis Ababa',
    phone: '+251-911-234567',
    whatsapp: '+251-911-234567',
    rating: 4.2,
    specialties: ['Food & Beverages', 'Personal Care', 'Stationery'],
    items: [
      { id: '4', name: 'Coca Cola (24 pack)', price: 480, minOrder: 2, category: 'Beverages', inStock: true },
      { id: '5', name: 'Shampoo Bottles', price: 150, minOrder: 12, category: 'Personal Care', inStock: true },
      { id: '6', name: 'Notebooks (Pack of 10)', price: 100, minOrder: 5, category: 'Stationery', inStock: true },
    ]
  },
  {
    id: '3',
    name: 'Kazanchis Business Plaza',
    location: 'Kazanchis, Addis Ababa',
    phone: '+251-911-345678',
    whatsapp: '+251-911-345678',
    rating: 4.7,
    specialties: ['Import Goods', 'Electronics', 'Cosmetics'],
    items: [
      { id: '7', name: 'Laptop Computers', price: 25000, minOrder: 1, category: 'Electronics', inStock: true },
      { id: '8', name: 'Perfume Collection', price: 800, minOrder: 6, category: 'Cosmetics', inStock: true },
      { id: '9', name: 'Power Banks', price: 600, minOrder: 10, category: 'Electronics', inStock: true },
    ]
  }
];

const Wholesalers: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedWholesaler, setSelectedWholesaler] = useState<string | null>(null);

  const categories = ['all', 'Electronics', 'Household', 'Textiles', 'Food & Beverages', 'Personal Care', 'Stationery', 'Cosmetics'];

  const filteredWholesalers = mockWholesalers.filter(wholesaler => {
    const matchesSearch = wholesaler.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         wholesaler.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         wholesaler.specialties.some(specialty => 
                           specialty.toLowerCase().includes(searchTerm.toLowerCase())
                         );
    
    const matchesCategory = selectedCategory === 'all' || 
                           wholesaler.specialties.includes(selectedCategory) ||
                           wholesaler.items.some(item => item.category === selectedCategory);
    
    return matchesSearch && matchesCategory;
  });

  const getAllItems = () => {
    let allItems: any[] = [];
    filteredWholesalers.forEach(wholesaler => {
      wholesaler.items.forEach(item => {
        allItems.push({
          ...item,
          wholesaler: wholesaler.name,
          wholesalerPhone: wholesaler.whatsapp,
          wholesalerLocation: wholesaler.location
        });
      });
    });

    if (searchTerm) {
      allItems = allItems.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      allItems = allItems.filter(item => item.category === selectedCategory);
    }

    return allItems;
  };

  const handleWhatsAppOrder = (wholesaler: Wholesaler, item?: any) => {
    const message = item 
      ? `Hello, I'm interested in ordering ${item.name} (Min order: ${item.minOrder}). Could you please provide more details?`
      : `Hello, I'm interested in your wholesale products. Could you please send me your catalog?`;
    
    const whatsappUrl = `https://wa.me/${wholesaler.whatsapp.replace('+', '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Wholesaler Directory</h1>
            <p className="text-gray-600">Find suppliers and compare prices</p>
          </div>
          <div className="mt-4 sm:mt-0 text-right">
            <p className="text-sm text-gray-500">🇪🇹 Ethiopian Suppliers</p>
            <p className="text-lg font-semibold text-green-600">{filteredWholesalers.length} Wholesalers</p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search wholesalers or products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* View Toggle */}
        <div className="mt-4 flex space-x-2">
          <button
            onClick={() => setSelectedWholesaler(null)}
            className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
              !selectedWholesaler 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Wholesalers View
          </button>
          <button
            onClick={() => setSelectedWholesaler('items')}
            className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
              selectedWholesaler === 'items' 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Products View
          </button>
        </div>
      </div>

      {selectedWholesaler !== 'items' ? (
        /* Wholesalers Grid */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredWholesalers.map((wholesaler) => (
            <div key={wholesaler.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-200">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <Store className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-semibold text-gray-900">{wholesaler.name}</h3>
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="ml-1 text-sm text-gray-600">{wholesaler.rating}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span className="text-sm">{wholesaler.location}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Phone className="h-4 w-4 mr-2" />
                    <span className="text-sm">{wholesaler.phone}</span>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Specialties:</p>
                  <div className="flex flex-wrap gap-2">
                    {wholesaler.specialties.map((specialty) => (
                      <span
                        key={specialty}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-900 mb-2">Available Products:</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {wholesaler.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{item.name}</p>
                          <p className="text-xs text-gray-600">Min order: {item.minOrder}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-green-600">{formatCurrency(item.price)}</p>
                          <p className={`text-xs ${item.inStock ? 'text-green-600' : 'text-red-600'}`}>
                            {item.inStock ? 'In Stock' : 'Out of Stock'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => handleWhatsAppOrder(wholesaler)}
                    className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    WhatsApp
                  </button>
                  <a
                    href={`tel:${wholesaler.phone}`}
                    className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    <Phone className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Products Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {getAllItems().map((item, index) => (
            <div key={`${item.id}-${index}`} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-200">
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">{item.name}</h3>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    item.inStock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {item.inStock ? 'In Stock' : 'Out of Stock'}
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Category</span>
                    <span className="text-sm font-medium text-gray-900">{item.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Price</span>
                    <span className="text-lg font-bold text-green-600">{formatCurrency(item.price)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Min Order</span>
                    <span className="text-sm font-medium text-gray-900">{item.minOrder} units</span>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4 mb-4">
                  <div className="flex items-center text-gray-600 mb-2">
                    <Store className="h-4 w-4 mr-2" />
                    <span className="text-sm font-medium">{item.wholesaler}</span>
                  </div>
                  <div className="flex items-center text-gray-500">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span className="text-xs">{item.wholesalerLocation}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    const wholesaler = mockWholesalers.find(w => w.name === item.wholesaler);
                    if (wholesaler) handleWhatsAppOrder(wholesaler, item);
                  }}
                  disabled={!item.inStock}
                  className={`w-full inline-flex items-center justify-center px-4 py-2 rounded-lg transition-colors duration-200 ${
                    item.inStock
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  {item.inStock ? 'Inquire via WhatsApp' : 'Out of Stock'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredWholesalers.length === 0 && (
        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
          <Store className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No wholesalers found</h3>
          <p className="text-gray-500">Try adjusting your search terms or category filter</p>
        </div>
      )}
    </div>
  );
};

export default Wholesalers;