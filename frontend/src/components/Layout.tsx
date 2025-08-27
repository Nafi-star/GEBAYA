import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Home, 
  Package, 
  ShoppingCart, 
  Store, 
  BarChart3, 
  Settings, 
  Menu, 
  X,
  Bell,
  LogOut,
  User
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Inventory', href: '/inventory', icon: Package },
    { name: 'Sales', href: '/sales', icon: ShoppingCart },
    { name: 'Wholesalers', href: '/wholesalers', icon: Store },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto bg-gradient-to-b from-green-800 to-green-900">
          <div className="flex items-center flex-shrink-0 px-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center">
                <Store className="w-5 h-5 text-green-800" />
              </div>
              <h1 className="ml-3 text-xl font-bold text-white">GebeyaNet</h1>
            </div>
          </div>
          
          {/* Mobile User Info */}
          <div className="px-4 mt-4 pb-4 border-b border-green-700">
            <div className="text-green-100 text-sm">
              <p className="font-medium">{user?.business_name}</p>
              <p className="text-green-200 text-xs">{user?.owner_name}</p>
            </div>
          </div>
          
          
          {/* User Info */}
          <div className="px-4 mt-4 pb-4 border-b border-green-700">
            <div className="text-green-100 text-sm">
              <p className="font-medium">{user?.business_name}</p>
              <p className="text-green-200 text-xs">{user?.owner_name}</p>
            </div>
          </div>
          
          <nav className="mt-8 flex-grow flex flex-col">
            <ul className="flex-1 px-2 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      className={`${
                        isActive
                          ? 'bg-green-700 text-white'
                          : 'text-green-100 hover:bg-green-700 hover:text-white'
                      } group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200`}
                    >
                      <Icon className="mr-3 flex-shrink-0 h-5 w-5" />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          
          {/* Logout Button */}
          <div className="px-2 pb-4">
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-2 py-2 text-sm font-medium text-green-100 hover:bg-green-700 hover:text-white rounded-md transition-colors duration-200"
            >
              <LogOut className="mr-3 flex-shrink-0 h-5 w-5" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 flex z-40 md:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={toggleMobileMenu} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-gradient-to-b from-green-800 to-green-900">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={toggleMobileMenu}
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 flex items-center px-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center">
                    <Store className="w-5 h-5 text-green-800" />
                  </div>
                  <h1 className="ml-3 text-xl font-bold text-white">GebeyaNet</h1>
                </div>
              </div>
              <nav className="mt-5 px-2">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`${
                        isActive
                          ? 'bg-green-700 text-white'
                          : 'text-green-100 hover:bg-green-700 hover:text-white'
                      } group flex items-center px-2 py-2 text-base font-medium rounded-md transition-colors duration-200`}
                      onClick={toggleMobileMenu}
                    >
                      <Icon className="mr-4 h-5 w-5" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
            
            {/* Mobile Logout */}
            <div className="px-2 pb-4 mt-4">
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-2 py-2 text-base font-medium text-green-100 hover:bg-green-700 hover:text-white rounded-md transition-colors duration-200"
              >
                <LogOut className="mr-4 h-5 w-5" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Mobile header */}
        <div className="md:hidden">
          <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow-sm border-b border-gray-200">
            <button
              type="button"
              className="px-4 border-r border-gray-200 text-gray-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-500 md:hidden"
              onClick={toggleMobileMenu}
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex-1 px-4 flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-6 h-6 bg-yellow-400 rounded flex items-center justify-center">
                  <Store className="w-4 h-4 text-green-800" />
                </div>
                <h1 className="ml-2 text-lg font-bold text-gray-900">GebeyaNet</h1>
              </div>
              <div className="flex items-center space-x-2">
                <button className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100">
                  <Bell className="h-5 w-5" />
                </button>
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                  >
                    <User className="h-5 w-5" />
                  </button>
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop header */}
        <div className="hidden md:flex md:flex-shrink-0">
          <div className="flex h-16 bg-white shadow-sm border-b border-gray-200">
            <div className="flex-1 px-4 flex justify-between items-center">
              <div className="flex items-center">
                <h2 className="text-2xl font-bold text-gray-900 capitalize">
                  {location.pathname === '/' ? 'Dashboard' : location.pathname.slice(1)}
                </h2>
              </div>
              <div className="flex items-center space-x-2">
                <button className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100">
                  <Bell className="h-5 w-5" />
                </button>
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                  >
                    <User className="h-5 w-5" />
                  </button>
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;