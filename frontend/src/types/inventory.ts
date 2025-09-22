export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  costPrice: number;
  sellingPrice: number;
  minThreshold: number;
  maxThreshold?: number;
  dateAdded: string;
  expiryDate?: string;
  batchNumber?: string;
  supplier?: string;
  description?: string;
  isExpired: boolean;
  daysUntilExpiry?: number;
  priority: 'high' | 'medium' | 'low';
}

export interface ExpiryAlert {
  id: string;
  itemId: string;
  itemName: string;
  expiryDate: string;
  daysUntilExpiry: number;
  quantity: number;
  alertType: 'expired' | 'expiring_soon' | 'expiring_this_week';
}

export interface Sale {
  id: string;
  itemId: string;
  itemName: string;
  quantity: number;
  salePrice: number;
  totalAmount: number;
  date: string;
  profit: number;
  customerName?: string; // Added optional customerName
}

export interface AutomationSettings {
  autoReorder: boolean;
  expiryAlerts: boolean;
  lowStockAlerts: boolean;
  profitTracking: boolean;
}

export interface InventoryContextType {
  items: InventoryItem[];
  sales: Sale[];
  automationSettings: AutomationSettings;
  totalProfit: number;
  todayProfit: number;
  addItem: (item: Omit<InventoryItem, 'id'>) => Promise<void>;
  updateItem: (id: string, updates: Partial<InventoryItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  recordSale: (sale: Omit<Sale, 'id'>) => Promise<void>;
  updateAutomationSettings: (settings: AutomationSettings) => void;
}