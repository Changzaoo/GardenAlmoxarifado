import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../../hooks/useAuth';
import UserProfileModal from '../Auth/UserProfileModal';
import FullscreenPrompt from '../FullscreenPrompt';
import { NotificationBadge } from '../NotificationBadge';
import AdminTestBot from '../Admin/AdminTestBot';

const Layout = () => {
  const { usuario } = useAuth();
  const [showProfileModal, setShowProfileModal] = useState(false);

  if (!usuario) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-[#15202B] text-white">
      {/* Sidebar */}
      <Sidebar onProfileClick={() => setShowProfileModal(true)} />

      {/* Main Content */}
      <main className="flex-1 md:ml-64 transition-all duration-300 ease-in-out">
        <div className="relative p-4 md:p-6 max-w-7xl mx-auto md:z-auto z-0">
          <div className="fixed top-4 right-4 z-50">
            <NotificationBadge />
          </div>
          <Outlet />
        </div>
      </main>

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
