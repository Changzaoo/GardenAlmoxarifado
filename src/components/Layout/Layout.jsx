import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../../hooks/useAuth';

const Layout = () => {
  const { usuario } = useAuth();

  if (!usuario) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 ml-64 transition-all duration-300 ease-in-out">
        <div className="p-6 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
