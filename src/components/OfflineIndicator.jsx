import React, { useState, useEffect } from 'react';
import { useOffline } from '../hooks/useOffline';

/**
 * Indicador visual de status online/offline e sincronização
 */
const OfflineIndicator = () => {
  const { isOnline, pendingCount, isSyncing, lastSyncTime, syncNow } = useOffline();
  const [showDetails, setShowDetails] = useState(false);
  const [notification, setNotification] = useState(null);

  // Mostrar notificação quando voltar online
  useEffect(() => {
    if (isOnline && pendingCount > 0) {
      setNotification({
        type: 'info',
        message: `🔄 Sincronizando ${pendingCount} operações...`
      });

      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isOnline, pendingCount]);

  // Não mostrar nada se estiver online e sem operações pendentes
  if (isOnline && pendingCount === 0 && !isSyncing && !notification) {
    return null;
  }

  const getStatusColor = () => {
    if (!isOnline) return 'bg-yellow-500';
    if (isSyncing) return 'bg-blue-500';
    if (pendingCount > 0) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const getStatusIcon = () => {
    if (!isOnline) return '📴';
    if (isSyncing) return '🔄';
    if (pendingCount > 0) return '⏳';
    return '✅';
  };

  const getStatusText = () => {
    if (!isOnline) return 'Modo Offline';
    if (isSyncing) return 'Sincronizando...';
    if (pendingCount > 0) return `${pendingCount} operações pendentes`;
    return 'Sincronizado';
  };

  const formatLastSync = () => {
    if (!lastSyncTime) return 'Nunca';
    
    const now = new Date();
    const diff = now - lastSyncTime;
    
    if (diff < 60000) return 'Agora mesmo';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min atrás`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} h atrás`;
    return lastSyncTime.toLocaleDateString();
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Notificação temporária */}
      {notification && (
        <div
          className={`mb-2 px-4 py-2 rounded-lg shadow-lg text-white ${
            notification.type === 'success' ? 'bg-green-500' : 
            notification.type === 'error' ? 'bg-red-500' : 
            'bg-blue-500'
          } animate-slide-up`}
        >
          {notification.message}
        </div>
      )}

      {/* Indicador principal */}
      <div
        className={`
          ${getStatusColor()} 
          text-white px-4 py-2 rounded-full shadow-lg 
          cursor-pointer hover:shadow-xl transition-all
          flex items-center gap-2
        `}
        onClick={() => setShowDetails(!showDetails)}
      >
        <span className="text-lg animate-pulse">{getStatusIcon()}</span>
        <span className="font-medium">{getStatusText()}</span>
        
        {pendingCount > 0 && (
          <span className="bg-white bg-opacity-30 px-2 py-0.5 rounded-full text-xs">
            {pendingCount}
          </span>
        )}
      </div>

      {/* Painel de detalhes */}
      {showDetails && (
        <div className="mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 w-80 animate-slide-up">
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-bold text-lg dark:text-white">Status de Sincronização</h3>
            <button
              onClick={() => setShowDetails(false)}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>

          {/* Status atual */}
          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Conexão:</span>
              <span className={`font-medium ${isOnline ? 'text-green-600' : 'text-yellow-600'}`}>
                {isOnline ? '🌐 Online' : '📴 Offline'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Operações pendentes:</span>
              <span className="font-medium dark:text-white">
                {pendingCount > 0 ? `⏳ ${pendingCount}` : '✅ Nenhuma'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Última sincronização:</span>
              <span className="font-medium dark:text-white text-sm">
                {formatLastSync()}
              </span>
            </div>
          </div>

          {/* Botão de sincronização manual */}
          {isOnline && pendingCount > 0 && (
            <button
              onClick={syncNow}
              disabled={isSyncing}
              className={`
                w-full py-2 rounded-lg font-medium transition-all
                ${isSyncing 
                  ? 'bg-gray-300 cursor-not-allowed' 
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
                }
              `}
            >
              {isSyncing ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">🔄</span>
                  Sincronizando...
                </span>
              ) : (
                '🔄 Sincronizar Agora'
              )}
            </button>
          )}

          {/* Aviso offline */}
          {!isOnline && (
            <div className="bg-yellow-50 dark:bg-yellow-900 dark:bg-opacity-20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                ⚠️ Você está trabalhando offline. Todas as alterações serão sincronizadas automaticamente quando a conexão for restaurada.
              </p>
            </div>
          )}
        </div>
      )}

      {/* CSS para animações */}
      <style jsx>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }

        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default OfflineIndicator;
