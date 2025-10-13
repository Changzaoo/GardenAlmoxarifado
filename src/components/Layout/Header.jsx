import React, { useState } from 'react';
import { Package, Settings, Lock, Shield, RefreshCw } from 'lucide-react';
import AdminPanel from '../Auth/AdminPanel';
import initialSyncService from '../../services/initialSyncService';
import { toast } from 'react-toastify';

const Header = ({ handleLogout }) => {
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleForceSync = async () => {
    setIsSyncing(true);
    
    const toastId = toast.info('🔄 Sincronizando dados...', {
      autoClose: false
    });

    try {
      const result = await initialSyncService.performInitialSync(true);
      
      toast.dismiss(toastId);
      
      if (result.success) {
        toast.success(`✅ ${result.synced} coleções sincronizadas!`);
      } else {
        toast.warning('⚠️ Alguns dados não puderam ser sincronizados');
      }
    } catch (error) {
      toast.dismiss(toastId);
      toast.error('❌ Erro ao sincronizar dados');
    } finally {
      setIsSyncing(false);
    }
  };

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
            onClick={handleForceSync}
            disabled={isSyncing}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Forçar sincronização de dados"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Sincronizando...' : 'Sync'}
          </button>
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
