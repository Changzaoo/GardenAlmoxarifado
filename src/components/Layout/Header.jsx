import React, { useState } from 'react';
import { Package, Settings, Lock, Shield } from 'lucide-react';
import AdminPanel from '../Auth/AdminPanel';

const Header = ({ handleLogout }) => {
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-green-100 rounded-lg">
            <Package className="w-8 h-8 text-green-600" />
          </div>
          <div>
  
            <p className="text-gray-600">Controle de ferramentas e equipamentos</p>
          </div>
        </div>
        
        {/* Botões de administração */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAdminPanel(!showAdminPanel)}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
          >
            <Settings className="w-4 h-4" />
            Admin
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
          >
            <Lock className="w-4 h-4" />
            Sair
          </button>
        </div>
      </div>

      {/* Painel de Administração */}
      {showAdminPanel && (
        <AdminPanel onClose={() => setShowAdminPanel(false)} />
      )}
    </div>
  );
};

export default Header;