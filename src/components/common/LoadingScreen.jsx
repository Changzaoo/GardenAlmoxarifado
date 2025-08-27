import React from 'react';
import { Package } from 'lucide-react';

const LoadingScreen = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <Package className="w-8 h-8 text-green-600 animate-pulse" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Almoxarifado Jardim</h1>
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
          <p className="text-gray-600">Conectando ao Firebase...</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
