import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  User, 
  Store, 
  Bell, 
  Globe, 
  Shield, 
  Download,
  Upload,
  Trash2,
  Save
} from 'lucide-react';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'profile' | 'business' | 'notifications' | 'data'>('profile');
  const [formData, setFormData] = useState({
    // Profile
    ownerName: 'Abebe Kebede',
    email: 'abebe@example.com',
    phone: '+251-911-123456',
    language: 'english',
    
    // Business
    businessName: 'Abebe General Store',
    businessAddress: 'Merkato, Addis Ababa',
    businessType: 'retail',
    currency: 'ETB',
    
    // Notifications
    lowStockAlert: true,
    dailyReport: false,
    salesNotifications: true,
    
    // Data
    autoBackup: true,
    backupFrequency: 'weekly'
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'business', label: 'Business', icon: Store },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'data', label: 'Data', icon: Shield }
  ];

  const handleSave = () => {
    // Save settings to localStorage or send to backend
    localStorage.setItem('gebeyanet_settings', JSON.stringify(formData));
    alert('Settings saved successfully!');
  };

  const handleExportData = () => {
    // Export data functionality
    const data = {
      settings: formData,
      inventory: JSON.parse(localStorage.getItem('gebeyanet_inventory') || '[]'),
      sales: JSON.parse(localStorage.getItem('gebeyanet_sales') || '[]')
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gebeyanet_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          if (data.settings) {
            setFormData(data.settings);
          }
          if (data.inventory) {
            localStorage.setItem('gebeyanet_inventory', JSON.stringify(data.inventory));
          }
          if (data.sales) {
            localStorage.setItem('gebeyanet_sales', JSON.stringify(data.sales));
          }
          alert('Data imported successfully! Please refresh the page to see changes.');
        } catch (error) {
          alert('Error importing data. Please check the file format.');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      localStorage.removeItem('gebeyanet_inventory');
      localStorage.removeItem('gebeyanet_sales');
      localStorage.removeItem('gebeyanet_settings');
      alert('All data cleared successfully! Please refresh the page.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center">
          <SettingsIcon className="h-8 w-8 text-gray-600 mr-3" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600">Manage your account and application preferences</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <nav className="space-y-1 p-4">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                      activeTab === tab.id
                        ? 'bg-green-100 text-green-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-lg p-6">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">Profile Settings</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Owner Name
                    </label>
                    <input
                      type="text"
                      value={formData.ownerName}
                      onChange={(e) => handleInputChange('ownerName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Language
                    </label>
                    <select
                      value={formData.language}
                      onChange={(e) => handleInputChange('language', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="english">English</option>
                      <option value="amharic">አማርኛ (Amharic)</option>
                      <option value="oromo">Afaan Oromoo</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'business' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">Business Settings</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business Name
                    </label>
                    <input
                      type="text"
                      value={formData.businessName}
                      onChange={(e) => handleInputChange('businessName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business Address
                    </label>
                    <input
                      type="text"
                      value={formData.businessAddress}
                      onChange={(e) => handleInputChange('businessAddress', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business Type
                    </label>
                    <select
                      value={formData.businessType}
                      onChange={(e) => handleInputChange('businessType', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="retail">Retail Store</option>
                      <option value="wholesale">Wholesale</option>
                      <option value="mixed">Mixed (Retail & Wholesale)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Currency
                    </label>
                    <select
                      value={formData.currency}
                      onChange={(e) => handleInputChange('currency', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    >
                      <option value="ETB">Ethiopian Birr (ETB)</option>
                      <option value="USD">US Dollar (USD)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">Notification Settings</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900">Low Stock Alerts</h3>
                      <p className="text-sm text-gray-600">Get notified when items are running low</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.lowStockAlert}
                        onChange={(e) => handleInputChange('lowStockAlert', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900">Daily Reports</h3>
                      <p className="text-sm text-gray-600">Receive daily sales and profit summaries</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.dailyReport}
                        onChange={(e) => handleInputChange('dailyReport', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h3 className="font-medium text-gray-900">Sales Notifications</h3>
                      <p className="text-sm text-gray-600">Get notified for each sale transaction</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.salesNotifications}
                        onChange={(e) => handleInputChange('salesNotifications', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'data' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">Data Management</h2>
                
                <div className="space-y-6">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">Backup & Restore</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Keep your data safe by creating regular backups
                    </p>
                    
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={handleExportData}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export Data
                      </button>
                      
                      <label className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200 cursor-pointer">
                        <Upload className="h-4 w-4 mr-2" />
                        Import Data
                        <input
                          type="file"
                          accept=".json"
                          onChange={handleImportData}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                  
                  <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                    <h3 className="font-medium text-red-900 mb-2">Danger Zone</h3>
                    <p className="text-sm text-red-600 mb-4">
                      Permanently delete all your data. This action cannot be undone.
                    </p>
                    
                    <button
                      onClick={handleClearData}
                      className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear All Data
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={handleSave}
                className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium"
              >
                <Save className="h-5 w-5 mr-2" />
                Save Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;