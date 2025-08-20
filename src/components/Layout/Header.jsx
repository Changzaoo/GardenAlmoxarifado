import React, { useState } from 'react';
import { Package, Settings, Lock, Shield } from 'lucide-react';
import AdminPanel from '../Auth/AdminPanel';
import { useTheme } from '../AlmoxarifadoJardim';

const Header = ({ handleLogout }) => {
  const { classes } = useTheme();
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  return (
  <div className={`rounded-lg shadow-lg p-6 mb-6 ${classes.card}`}> 
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-lg ${classes.iconBackground}`}> 
            <Package className={`w-8 h-8 ${classes.iconPrimary}`} />
          </div>
          <div>
            <h1 className={`text-3xl font-bold ${classes.textPrimary}`}>Almoxarifado do Jardim</h1>
            <p className={classes.textSecondary}>Controle de ferramentas e equipamentos</p>
          </div>
        </div>
        
        {/* Botões de administração */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAdminPanel(!showAdminPanel)}
            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg ${classes.buttonPrimary}`}
          >
            <Settings className="w-4 h-4" />
            Admin
          </button>
          <button
            onClick={handleLogout}
            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg ${classes.buttonDanger}`}
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