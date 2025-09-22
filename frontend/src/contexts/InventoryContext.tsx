import React, { createContext, useContext, useState, useEffect } from 'react';
import { InventoryItem, ExpiryAlert, Sale, AutomationSettings } from '../types/inventory';
import { 
  calculateDaysUntilExpiry, 
  isItemExpired, 
  getItemPriority, 
  sortItemsByPriority,
  generateExpiryAlerts 
} from '../utils/expiryUtils';

interface InventoryContextType {
  items: InventoryItem[];
  sortedItems: InventoryItem[];
  expiryAlerts: ExpiryAlert[];
  sales: Sale[];
  automationSettings: AutomationSettings;
  totalProfit: number;
  todayProfit: number;
  addItem: (item: Omit<InventoryItem, 'id' | 'dateAdded'>) => void;
  updateItem: (id: string, updates: Partial<InventoryItem>) => void;
  deleteItem: (id: string) => void;
  removeItem: (id: string) => void; // NEW: Completely remove item
  updateStock: (id: string, quantityChange: number) => void;
  updateItemQuantity: (id: string, change: number) => void; // NEW: Update quantity with change value
  getLowStockItems: () => InventoryItem[];
  getExpiringItems: () => InventoryItem[];
  getExpiredItems: () => InventoryItem[];
  getItemById: (id: string) => InventoryItem | undefined;
  markAsExpired: (id: string) => void;
  applyExpiryDiscount: (id: string, discountPercentage: number) => void;
  recordSale: (sale: Omit<Sale, 'id'>) => Promise<void>;
  updateAutomationSettings: (settings: AutomationSettings) => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<InventoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('gebeyanet_inventory');
      if (saved) {
        const parsedItems = JSON.parse(saved);
        // Update items with expiry calculations
        return parsedItems.map((item: any) => ({
          ...item,
          isExpired: item.expiryDate ? isItemExpired(item.expiryDate) : false,
          daysUntilExpiry: item.expiryDate ? calculateDaysUntilExpiry(item.expiryDate) : undefined,
          priority: getItemPriority(item)
        }));
      }
    } catch (error) {
      console.error('Error loading inventory from localStorage:', error);
    }
    
    // Demo data for Ethiopian context
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    const nextMonth = new Date(today);
    nextMonth.setMonth(today.getMonth() + 1);
    
    return [
      {
        id: '1',
        name: 'Teff Flour',
        category: 'Food & Grains',
        quantity: 25,
        costPrice: 800,
        sellingPrice: 1000,
        minThreshold: 10,
        dateAdded: new Date().toISOString(),
        expiryDate: nextMonth.toISOString().split('T')[0],
        batchNumber: 'TF001',
        supplier: 'Merkato Grain Suppliers',
        isExpired: false,
        daysUntilExpiry: 30,
        priority: 'low'
      },
      {
        id: '2',
        name: 'Coffee Beans',
        category: 'Beverages',
        quantity: 5,
        costPrice: 600,
        sellingPrice: 800,
        minThreshold: 10,
        dateAdded: new Date().toISOString(),
        expiryDate: tomorrow.toISOString().split('T')[0],
        batchNumber: 'CB002',
        supplier: 'Ethiopian Coffee Co.',
        isExpired: false,
        daysUntilExpiry: 1,
        priority: 'high'
      },
      {
        id: '3',
        name: 'Berbere Spice',
        category: 'Spices',
        quantity: 15,
        costPrice: 300,
        sellingPrice: 450,
        minThreshold: 5,
        dateAdded: new Date().toISOString(),
        expiryDate: nextWeek.toISOString().split('T')[0],
        batchNumber: 'BS003',
        supplier: 'Spice Market Ltd',
        isExpired: false,
        daysUntilExpiry: 7,
        priority: 'medium'
      },
      {
        id: '4',
        name: 'Cooking Oil',
        category: 'Household',
        quantity: 12,
        costPrice: 500,
        sellingPrice: 650,
        minThreshold: 8,
        dateAdded: new Date().toISOString(),
        expiryDate: nextMonth.toISOString().split('T')[0],
        batchNumber: 'CO004',
        supplier: 'Oil Distributors',
        isExpired: false,
        daysUntilExpiry: 30,
        priority: 'low'
      }
    ];
  });

  const [sales, setSales] = useState<Sale[]>(() => {
    try {
      const saved = localStorage.getItem('gebeyanet_sales');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading sales from localStorage:', error);
      return [];
    }
  });

  const [automationSettings, setAutomationSettings] = useState<AutomationSettings>(() => {
    try {
      const saved = localStorage.getItem('gebeyanet_automation');
      return saved ? JSON.parse(saved) : {
        autoReorder: true,
        expiryAlerts: true,
        lowStockAlerts: true,
        profitTracking: true
      };
    } catch (error) {
      console.error('Error loading automation settings from localStorage:', error);
      return {
        autoReorder: true,
        expiryAlerts: true,
        lowStockAlerts: true,
        profitTracking: true
      };
    }
  });

  // Calculate profits
  const totalProfit = sales.reduce((sum, sale) => sum + sale.profit, 0);
  
  const todayProfit = sales
    .filter(sale => {
      const saleDate = new Date(sale.date);
      const today = new Date();
      return saleDate.toDateString() === today.toDateString();
    })
    .reduce((sum, sale) => sum + sale.profit, 0);

  // Calculate sorted items and expiry alerts
  const sortedItems = sortItemsByPriority(items);
  const expiryAlerts = generateExpiryAlerts(items);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('gebeyanet_inventory', JSON.stringify(items));
    } catch (error) {
      console.error('Error saving inventory to localStorage:', error);
    }
  }, [items]);

  useEffect(() => {
    try {
      localStorage.setItem('gebeyanet_sales', JSON.stringify(sales));
    } catch (error) {
      console.error('Error saving sales to localStorage:', error);
    }
  }, [sales]);

  useEffect(() => {
    try {
      localStorage.setItem('gebeyanet_automation', JSON.stringify(automationSettings));
    } catch (error) {
      console.error('Error saving automation settings to localStorage:', error);
    }
  }, [automationSettings]);

  // Auto-update expiry status daily
  useEffect(() => {
    const updateExpiryStatus = () => {
      setItems(prev => prev.map(item => ({
        ...item,
        isExpired: item.expiryDate ? isItemExpired(item.expiryDate) : false,
        daysUntilExpiry: item.expiryDate ? calculateDaysUntilExpiry(item.expiryDate) : undefined,
        priority: getItemPriority(item)
      })));
    };

    // Update immediately
    updateExpiryStatus();

    // Set up daily update
    const interval = setInterval(updateExpiryStatus, 24 * 60 * 60 * 1000); // 24 hours

    return () => clearInterval(interval);
  }, []);

  const addItem = (itemData: Omit<InventoryItem, 'id' | 'dateAdded'>) => {
    const newItem: InventoryItem = {
      ...itemData,
      id: Date.now().toString(),
      dateAdded: new Date().toISOString(),
      isExpired: itemData.expiryDate ? isItemExpired(itemData.expiryDate) : false,
      daysUntilExpiry: itemData.expiryDate ? calculateDaysUntilExpiry(itemData.expiryDate) : undefined,
      priority: getItemPriority({...itemData, id: '', dateAdded: ''} as InventoryItem)
    };
    setItems(prev => [...prev, newItem]);
  };

  const updateItem = (id: string, updates: Partial<InventoryItem>) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, ...updates };
        return {
          ...updatedItem,
          isExpired: updatedItem.expiryDate ? isItemExpired(updatedItem.expiryDate) : false,
          daysUntilExpiry: updatedItem.expiryDate ? calculateDaysUntilExpiry(updatedItem.expiryDate) : undefined,
          priority: getItemPriority(updatedItem)
        };
      }
      return item;
    }));
  };

  const deleteItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  // NEW: Alias for deleteItem for consistency with Analytics component
  const removeItem = (id: string) => {
    deleteItem(id);
  };

  const updateStock = (id: string, quantityChange: number) => {
    setItems(prev => prev.map(item => 
      item.id === id 
        ? { ...item, quantity: Math.max(0, item.quantity + quantityChange) }
        : item
    ));
  };

  // NEW: Update item quantity with a change value (positive or negative)
  const updateItemQuantity = (id: string, change: number) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const newQuantity = Math.max(0, item.quantity + change);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const getLowStockItems = () => {
    return items.filter(item => item.quantity <= item.minThreshold);
  };

  const getExpiringItems = () => {
    return items.filter(item => {
      if (!item.expiryDate) return false;
      const daysUntilExpiry = calculateDaysUntilExpiry(item.expiryDate);
      return daysUntilExpiry >= 0 && daysUntilExpiry <= 7;
    });
  };

  const getExpiredItems = () => {
    return items.filter(item => item.isExpired);
  };

  const getItemById = (id: string) => {
    return items.find(item => item.id === id);
  };

  const markAsExpired = (id: string) => {
    updateItem(id, { 
      isExpired: true,
      quantity: 0 // Remove from available stock
    });
  };

  const applyExpiryDiscount = (id: string, discountPercentage: number) => {
    const item = getItemById(id);
    if (item) {
      const discountedPrice = item.sellingPrice * (1 - discountPercentage / 100);
      updateItem(id, { sellingPrice: discountedPrice });
    }
  };

  const recordSale = async (saleData: Omit<Sale, 'id'>) => {
    try {
      const newSale: Sale = {
        ...saleData,
        id: Date.now().toString()
      };

      // Add to sales
      setSales(prev => [...prev, newSale]);

      // Update inventory quantity
      setItems(prev => prev.map(item => 
        item.id === saleData.itemId 
          ? { ...item, quantity: Math.max(0, item.quantity - saleData.quantity) }
          : item
      ));

    } catch (error) {
      console.error('Error recording sale:', error);
      throw error;
    }
  };

  const updateAutomationSettings = (settings: AutomationSettings) => {
    setAutomationSettings(settings);
  };

  return (
    <InventoryContext.Provider value={{
      items,
      sortedItems,
      expiryAlerts,
      sales,
      automationSettings,
      totalProfit,
      todayProfit,
      addItem,
      updateItem,
      deleteItem,
      removeItem, // NEW
      updateStock,
      updateItemQuantity, // NEW
      getLowStockItems,
      getExpiringItems,
      getExpiredItems,
      getItemById,
      markAsExpired,
      applyExpiryDiscount,
      recordSale,
      updateAutomationSettings
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