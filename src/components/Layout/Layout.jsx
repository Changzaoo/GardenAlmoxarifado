import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../ThemeProvider';
import UserProfileModal from '../Auth/UserProfileModal';

const Layout = () => {
  const { usuario } = useAuth();
  const { theme } = useTheme();
  const [showProfileModal, setShowProfileModal] = useState(false);

  if (!usuario) {
    return null;
  }

  const { colors } = useTheme();

  return (
    <div className={`flex min-h-screen ${colors.background} ${colors.text}`}>
      {/* Sidebar */}
      <Sidebar onProfileClick={() => setShowProfileModal(true)} />

      {/* Main Content */}
      <main className="flex-1 ml-64 transition-all duration-300 ease-in-out">
        <div className="p-6 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Profile Modal */}
      {showProfileModal && (
        <UserProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
        />
      )}
    </div>
  );
};

export default Layout;
