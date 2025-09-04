import React, { useState } from 'react';
import { 
  Zap, 
  Bell, 
  RefreshCw, 
  TrendingDown, 
  Calendar,
  Settings,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface AutomationRule {
  id: string;
  name: string;
  type: 'low_stock' | 'expiry_alert' | 'auto_reorder' | 'price_adjustment';
  isActive: boolean;
  conditions: any;
  actions: any;
}

const AutomationPanel: React.FC = () => {
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([
    {
      id: '1',
      name: 'Low Stock Alert',
      type: 'low_stock',
      isActive: true,
      conditions: { threshold: 5 },
      actions: { notify: true, email: false }
    },
    {
      id: '2',
      name: 'Expiry Notifications',
      type: 'expiry_alert',
      isActive: true,
      conditions: { daysBeforeExpiry: 7 },
      actions: { notify: true, prioritize: true }
    },
    {
      id: '3',
      name: 'Auto Price Reduction for Expiring Items',
      type: 'price_adjustment',
      isActive: false,
      conditions: { daysBeforeExpiry: 3 },
      actions: { discountPercentage: 20 }
    }
  ]);

  const toggleRule = (ruleId: string) => {
    setAutomationRules(prev => 
      prev.map(rule => 
        rule.id === ruleId ? { ...rule, isActive: !rule.isActive } : rule
      )
    );
  };

  const getRuleIcon = (type: string) => {
    switch (type) {
      case 'low_stock': return <TrendingDown className="h-5 w-5" />;
      case 'expiry_alert': return <Calendar className="h-5 w-5" />;
      case 'auto_reorder': return <RefreshCw className="h-5 w-5" />;
      case 'price_adjustment': return <Settings className="h-5 w-5" />;
      default: return <Zap className="h-5 w-5" />;
    }
  };

  const getRuleDescription = (rule: AutomationRule): string => {
    switch (rule.type) {
      case 'low_stock':
        return `Alert when stock falls below ${rule.conditions.threshold} units`;
      case 'expiry_alert':
        return `Notify ${rule.conditions.daysBeforeExpiry} days before expiry`;
      case 'price_adjustment':
        return `Reduce price by ${rule.actions.discountPercentage}% for items expiring in ${rule.conditions.daysBeforeExpiry} days`;
      default:
        return 'Automated business rule';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center mb-6">
        <Zap className="h-6 w-6 text-blue-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">Automation Rules</h3>
        <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
          {automationRules.filter(rule => rule.isActive).length} Active
        </span>
      </div>

      <div className="space-y-4">
        {automationRules.map((rule) => (
          <div
            key={rule.id}
            className={`p-4 rounded-lg border-2 transition-all duration-200 ${
              rule.isActive 
                ? 'border-green-200 bg-green-50' 
                : 'border-gray-200 bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`p-2 rounded-md ${
                  rule.isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  {getRuleIcon(rule.type)}
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-semibold text-gray-900">{rule.name}</h4>
                  <p className="text-xs text-gray-600">{getRuleDescription(rule)}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center">
                  {rule.isActive ? (
                    <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-gray-400 mr-1" />
                  )}
                  <span className={`text-xs font-medium ${
                    rule.isActive ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {rule.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rule.isActive}
                    onChange={() => toggleRule(rule.id)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-center">
          <Bell className="h-5 w-5 text-blue-600 mr-2" />
          <div>
            <h4 className="text-sm font-semibold text-blue-900">Smart Automation Active</h4>
            <p className="text-xs text-blue-700">
              Your business rules are automatically monitoring inventory and will take actions based on your settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutomationPanel;