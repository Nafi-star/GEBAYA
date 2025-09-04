import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-12 w-12 text-green-600 animate-spin mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Loading GebeyaNet</h2>
        <p className="text-gray-600">Please wait while we prepare your dashboard...</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;