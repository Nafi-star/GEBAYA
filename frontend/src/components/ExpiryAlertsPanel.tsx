import React from 'react';
import { AlertTriangle, Clock, X, Package } from 'lucide-react';
import { ExpiryAlert } from '../types/inventory';
import { getExpiryStatusColor, getExpiryStatusText } from '../utils/expiryUtils';

interface ExpiryAlertsPanelProps {
  alerts: ExpiryAlert[];
  onDismiss?: (alertId: string) => void;
  onViewItem?: (itemId: string) => void;
}

const ExpiryAlertsPanel: React.FC<ExpiryAlertsPanelProps> = ({ 
  alerts, 
  onDismiss, 
  onViewItem 
}) => {
  if (alerts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center mb-4">
          <Clock className="h-6 w-6 text-green-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Expiry Alerts</h3>
        </div>
        <div className="text-center py-8">
          <Package className="h-12 w-12 text-green-300 mx-auto mb-3" />
          <p className="text-green-600 font-medium">All items are fresh!</p>
          <p className="text-sm text-gray-500">No expiry alerts at this time</p>
        </div>
      </div>
    );
  }

  const expiredCount = alerts.filter(alert => alert.alertType === 'expired').length;
  const expiringSoonCount = alerts.filter(alert => alert.alertType === 'expiring_soon').length;
  const expiringThisWeekCount = alerts.filter(alert => alert.alertType === 'expiring_this_week').length;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <AlertTriangle className="h-6 w-6 text-red-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Expiry Alerts</h3>
          <span className="ml-2 bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            {alerts.length}
          </span>
        </div>
      </div>

      {/* Alert Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-red-50 p-3 rounded-lg text-center">
          <p className="text-2xl font-bold text-red-600">{expiredCount}</p>
          <p className="text-xs text-red-700">Expired</p>
        </div>
        <div className="bg-orange-50 p-3 rounded-lg text-center">
          <p className="text-2xl font-bold text-orange-600">{expiringSoonCount}</p>
          <p className="text-xs text-orange-700">Expiring Soon</p>
        </div>
        <div className="bg-yellow-50 p-3 rounded-lg text-center">
          <p className="text-2xl font-bold text-yellow-600">{expiringThisWeekCount}</p>
          <p className="text-xs text-yellow-700">This Week</p>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`p-4 rounded-lg border-l-4 ${
              alert.alertType === 'expired' 
                ? 'bg-red-50 border-red-500' 
                : alert.alertType === 'expiring_soon'
                  ? 'bg-orange-50 border-orange-500'
                  : 'bg-yellow-50 border-yellow-500'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center">
                  <h4 className="text-sm font-semibold text-gray-900">{alert.itemName}</h4>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getExpiryStatusColor(alert.daysUntilExpiry)}`}>
                    {getExpiryStatusText(alert.daysUntilExpiry)}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Quantity: {alert.quantity} units • Expiry: {new Date(alert.expiryDate).toLocaleDateString()}
                </p>
                {alert.alertType === 'expired' && (
                  <p className="text-xs text-red-600 mt-1 font-medium">
                    ⚠️ Remove from sale immediately
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {onViewItem && (
                  <button
                    onClick={() => onViewItem(alert.itemId)}
                    className="text-blue-600 hover:text-blue-700 text-xs font-medium"
                  >
                    View
                  </button>
                )}
                {onDismiss && (
                  <button
                    onClick={() => onDismiss(alert.id)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExpiryAlertsPanel;