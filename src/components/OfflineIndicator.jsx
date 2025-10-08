/**
 * Componente indicador de status offline
 * Mostra logo vermelho e contador de operações pendentes
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { syncManager } from '../utils/syncManager';

const OfflineIndicator = () => {
  const { isOnline, wasOffline } = useOnlineStatus();
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    // Atualizar contador de operações pendentes
    const updatePendingCount = async () => {
      const count = await syncManager.getPendingCount();
      setPendingCount(count);
    };

    updatePendingCount();
    const interval = setInterval(updatePendingCount, 3000);

    // Listener de sincronização
    const handleSyncEvent = (event) => {
      if (event.type === 'sync_start') {
        setSyncing(true);
      } else if (event.type === 'sync_complete' || event.type === 'sync_error') {
        setSyncing(false);
        updatePendingCount();
      }
    };

    syncManager.addSyncListener(handleSyncEvent);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // Mostrar indicador quando offline OU quando há operações pendentes
  useEffect(() => {
    setShowIndicator(!isOnline || pendingCount > 0);
  }, [isOnline, pendingCount]);

  if (!showIndicator) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-4 right-4 z-50"
      >
        <div
          className={`
            flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl
            backdrop-blur-md border-2
            ${!isOnline 
              ? 'bg-red-500/90 border-red-600 text-white' 
              : 'bg-orange-500/90 border-orange-600 text-white'
            }
          `}
        >
          {/* Ícone animado */}
          <motion.div
            animate={syncing ? { rotate: 360 } : {}}
            transition={{ duration: 1, repeat: syncing ? Infinity : 0, ease: 'linear' }}
          >
            {!isOnline ? (
              <CloudOff className="w-6 h-6" />
            ) : syncing ? (
              <RefreshCw className="w-6 h-6" />
            ) : (
              <Cloud className="w-6 h-6" />
            )}
          </motion.div>

          {/* Texto do status */}
          <div className="flex flex-col">
            <span className="font-bold text-sm">
              {!isOnline ? 'Modo Offline' : syncing ? 'Sincronizando...' : 'Pendente'}
            </span>
            
            {pendingCount > 0 && (
              <span className="text-xs opacity-90">
                {pendingCount} operação(ões) pendente(s)
              </span>
            )}
          </div>

          {/* Badge com contador */}
          {pendingCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="ml-2 bg-white/20 rounded-full px-2.5 py-1 text-xs font-bold"
            >
              {pendingCount}
            </motion.div>
          )}
        </div>

        {/* Tooltip/Hint */}
        {!isOnline && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-2 text-xs text-red-800 dark:text-red-200"
          >
            <p className="font-medium">Você está trabalhando offline</p>
            <p className="opacity-80 mt-0.5">
              Suas alterações serão sincronizadas automaticamente quando a conexão retornar
            </p>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default OfflineIndicator;
