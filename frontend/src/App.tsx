import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { InventoryProvider } from './contexts/InventoryContext';
import { SalesProvider } from './contexts/SalesContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Sales from './pages/Sales';
import Wholesalers from './pages/Wholesalers';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';

function App() {
  return (
    <InventoryProvider>
      <SalesProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/sales" element={<Sales />} />
                <Route path="/wholesalers" element={<Wholesalers />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </Layout>
          </div>
        </Router>
      </SalesProvider>
    </InventoryProvider>
  );
}

export default App;