import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../../hooks/useAuth';
import UserProfileModal from '../Auth/UserProfileModal';
import FullscreenPrompt from '../FullscreenPrompt';
import AdminTestBot from '../Admin/AdminTestBot';

const Layout = () => {
  const { usuario } = useAuth();
  const [showProfileModal, setShowProfileModal] = useState(false);

  if (!usuario) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-[#15202B] text-white">
      {/* Main Content */}
      <main className="flex-1 transition-all duration-300 ease-in-out relative">
        <div className="relative p-2 md:p-4 max-w-7xl mx-auto md:z-auto z-0">
          <Outlet />
        </div>
      </main>

      {/* Sidebar */}
      <Sidebar onProfileClick={() => setShowProfileModal(true)} />

      {/* Profile Modal */}
      {showProfileModal && (
        <UserProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          userId={usuario.id}
        />
      )}

      {/* Fullscreen Prompt */}
      <FullscreenPrompt />

      {/* Admin Test Bot */}
      <AdminTestBot />
    </div>
  );
};

export default Layout;
