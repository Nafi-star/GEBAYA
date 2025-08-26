import React, { createContext, useContext, useState, useEffect } from 'react';

interface SaleRecord {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  total: number;
  profit: number;
  date: string;
}

interface SalesContextType {
  sales: SaleRecord[];
  recordSale: (sale: Omit<SaleRecord, 'id' | 'date'>) => void;
  getTodaysSales: () => SaleRecord[];
  getWeeklySales: () => SaleRecord[];
  getTodaysProfit: () => number;
  getWeeklyProfit: () => number;
}

const SalesContext = createContext<SalesContextType | undefined>(undefined);

export const SalesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sales, setSales] = useState<SaleRecord[]>(() => {
    const saved = localStorage.getItem('gebeyanet_sales');
    if (saved) {
      return JSON.parse(saved);
    }
    // Demo sales data
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    return [
      {
        id: '1',
        itemId: '1',
        itemName: 'Teff Flour',
        quantity: 3,
        unitPrice: 1000,
        costPrice: 800,
        total: 3000,
        profit: 600,
        date: today.toISOString()
      },
      {
        id: '2',
        itemId: '2',
        itemName: 'Coffee Beans',
        quantity: 2,
        unitPrice: 800,
        costPrice: 600,
        total: 1600,
        profit: 400,
        date: today.toISOString()
      },
      {
        id: '3',
        itemId: '3',
        itemName: 'Berbere Spice',
        quantity: 5,
        unitPrice: 450,
        costPrice: 300,
        total: 2250,
        profit: 750,
        date: yesterday.toISOString()
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('gebeyanet_sales', JSON.stringify(sales));
  }, [sales]);

  const recordSale = (saleData: Omit<SaleRecord, 'id' | 'date'>) => {
    const newSale: SaleRecord = {
      ...saleData,
      id: Date.now().toString(),
      date: new Date().toISOString()
    };
    setSales(prev => [...prev, newSale]);
  };

  const getTodaysSales = () => {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return sales.filter(sale => new Date(sale.date) >= todayStart);
  };

  const getWeeklySales = () => {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 7);
    return sales.filter(sale => new Date(sale.date) >= weekStart);
  };

  const getTodaysProfit = () => {
    const todaysSales = getTodaysSales();
    return todaysSales.reduce((sum, sale) => sum + sale.profit, 0);
  };

  const getWeeklyProfit = () => {
    const weeklySales = getWeeklySales();
    return weeklySales.reduce((sum, sale) => sum + sale.profit, 0);
  };

  return (
    <SalesContext.Provider value={{
      sales,
      recordSale,
      getTodaysSales,
      getWeeklySales,
      getTodaysProfit,
      getWeeklyProfit
    }}>
      {children}
    </SalesContext.Provider>
  );
};

export const useSales = () => {
  const context = useContext(SalesContext);
  if (!context) {
    throw new Error('useSales must be used within a SalesProvider');
  }
  return context;
};