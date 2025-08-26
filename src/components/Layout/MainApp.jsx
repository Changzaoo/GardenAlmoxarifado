import React from 'react';
import Sidebar from './Sidebar';
import AppRoutes from '../AppRoutes';
import { useAuth } from '../../hooks/useAuth';

const MainApp = () => {
  const { usuario } = useAuth();

  if (!usuario) {
    return null; // ou seu componente de loading
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col transition-all duration-300">
        <main className="flex-1 overflow-auto p-6">
          <AppRoutes />
        </main>
      </div>
    </div>
  );
};

export default MainApp;
