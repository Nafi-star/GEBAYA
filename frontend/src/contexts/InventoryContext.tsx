import React, { createContext, useContext, useState, useEffect } from 'react';

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  costPrice: number;
  sellingPrice: number;
  minThreshold: number;
  dateAdded: string;
}

interface InventoryContextType {
  items: InventoryItem[];
  addItem: (item: Omit<InventoryItem, 'id' | 'dateAdded'>) => void;
  updateItem: (id: string, updates: Partial<InventoryItem>) => void;
  deleteItem: (id: string) => void;
  updateStock: (id: string, quantityChange: number) => void;
  getLowStockItems: () => InventoryItem[];
  getItemById: (id: string) => InventoryItem | undefined;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem('gebeyanet_inventory');
    if (saved) {
      return JSON.parse(saved);
    }
    // Demo data for Ethiopian context
    return [
      {
        id: '1',
        name: 'Teff Flour',
        category: 'Food & Grains',
        quantity: 25,
        costPrice: 800,
        sellingPrice: 1000,
        minThreshold: 10,
        dateAdded: new Date().toISOString()
      },
      {
        id: '2',
        name: 'Coffee Beans',
        category: 'Beverages',
        quantity: 5,
        costPrice: 600,
        sellingPrice: 800,
        minThreshold: 10,
        dateAdded: new Date().toISOString()
      },
      {
        id: '3',
        name: 'Berbere Spice',
        category: 'Spices',
        quantity: 15,
        costPrice: 300,
        sellingPrice: 450,
        minThreshold: 5,
        dateAdded: new Date().toISOString()
      },
      {
        id: '4',
        name: 'Cooking Oil',
        category: 'Household',
        quantity: 12,
        costPrice: 500,
        sellingPrice: 650,
        minThreshold: 8,
        dateAdded: new Date().toISOString()
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('gebeyanet_inventory', JSON.stringify(items));
  }, [items]);

  const addItem = (itemData: Omit<InventoryItem, 'id' | 'dateAdded'>) => {
    const newItem: InventoryItem = {
      ...itemData,
      id: Date.now().toString(),
      dateAdded: new Date().toISOString()
    };
    setItems(prev => [...prev, newItem]);
  };

  const updateItem = (id: string, updates: Partial<InventoryItem>) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const deleteItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const updateStock = (id: string, quantityChange: number) => {
    setItems(prev => prev.map(item => 
      item.id === id 
        ? { ...item, quantity: Math.max(0, item.quantity + quantityChange) }
        : item
    ));
  };

  const getLowStockItems = () => {
    return items.filter(item => item.quantity <= item.minThreshold);
  };

  const getItemById = (id: string) => {
    return items.find(item => item.id === id);
  };

  return (
    <InventoryContext.Provider value={{
      items,
      addItem,
      updateItem,
      deleteItem,
      updateStock,
      getLowStockItems,
      getItemById
    }}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};