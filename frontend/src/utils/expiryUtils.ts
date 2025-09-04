import { InventoryItem, ExpiryAlert } from '../types/inventory';

export const calculateDaysUntilExpiry = (expiryDate: string): number => {
  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const isItemExpired = (expiryDate: string): boolean => {
  return calculateDaysUntilExpiry(expiryDate) < 0;
};

export const getItemPriority = (item: InventoryItem): 'high' | 'medium' | 'low' => {
  if (!item.expiryDate) return 'low';
  
  const daysUntilExpiry = calculateDaysUntilExpiry(item.expiryDate);
  
  if (daysUntilExpiry < 0) return 'high'; // Expired
  if (daysUntilExpiry <= 3) return 'high'; // Expires in 3 days
  if (daysUntilExpiry <= 7) return 'medium'; // Expires in a week
  return 'low';
};

export const sortItemsByPriority = (items: InventoryItem[]): InventoryItem[] => {
  return items.sort((a, b) => {
    // First sort by expiry status and days until expiry
    if (a.expiryDate && b.expiryDate) {
      const aDays = calculateDaysUntilExpiry(a.expiryDate);
      const bDays = calculateDaysUntilExpiry(b.expiryDate);
      
      // Expired items first
      if (aDays < 0 && bDays >= 0) return -1;
      if (bDays < 0 && aDays >= 0) return 1;
      
      // Then by days until expiry (ascending)
      if (aDays !== bDays) return aDays - bDays;
    }
    
    // Items with expiry dates come before those without
    if (a.expiryDate && !b.expiryDate) return -1;
    if (!a.expiryDate && b.expiryDate) return 1;
    
    // Finally sort by quantity (low stock first)
    return a.quantity - b.quantity;
  });
};

export const generateExpiryAlerts = (items: InventoryItem[]): ExpiryAlert[] => {
  const alerts: ExpiryAlert[] = [];
  
  items.forEach(item => {
    if (!item.expiryDate || item.quantity === 0) return;
    
    const daysUntilExpiry = calculateDaysUntilExpiry(item.expiryDate);
    let alertType: 'expired' | 'expiring_soon' | 'expiring_this_week';
    
    if (daysUntilExpiry < 0) {
      alertType = 'expired';
    } else if (daysUntilExpiry <= 3) {
      alertType = 'expiring_soon';
    } else if (daysUntilExpiry <= 7) {
      alertType = 'expiring_this_week';
    } else {
      return; // No alert needed
    }
    
    alerts.push({
      id: `alert-${item.id}`,
      itemId: item.id,
      itemName: item.name,
      expiryDate: item.expiryDate,
      daysUntilExpiry,
      quantity: item.quantity,
      alertType
    });
  });
  
  return alerts.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
};

export const getExpiryStatusColor = (daysUntilExpiry: number): string => {
  if (daysUntilExpiry < 0) return 'text-red-600 bg-red-100';
  if (daysUntilExpiry <= 3) return 'text-orange-600 bg-orange-100';
  if (daysUntilExpiry <= 7) return 'text-yellow-600 bg-yellow-100';
  return 'text-green-600 bg-green-100';
};

export const getExpiryStatusText = (daysUntilExpiry: number): string => {
  if (daysUntilExpiry < 0) return `Expired ${Math.abs(daysUntilExpiry)} days ago`;
  if (daysUntilExpiry === 0) return 'Expires today';
  if (daysUntilExpiry === 1) return 'Expires tomorrow';
  return `Expires in ${daysUntilExpiry} days`;
};

// Additional exports for RecordSaleModal compatibility
export const getExpiryStatus = (expiryDate: string): 'expired' | 'expiring' | 'fresh' => {
  const daysUntil = calculateDaysUntilExpiry(expiryDate);
  if (daysUntil < 0) return 'expired';
  if (daysUntil <= 7) return 'expiring';
  return 'fresh';
};

export const getDaysUntilExpiry = calculateDaysUntilExpiry;

export const getPriorityLevel = (expiryDate: string): 'High' | 'Medium' | 'Low' => {
  const daysUntil = calculateDaysUntilExpiry(expiryDate);
  if (daysUntil < 0 || daysUntil <= 3) return 'High';
  if (daysUntil <= 7) return 'Medium';
  return 'Low';
};