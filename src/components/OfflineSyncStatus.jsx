/**
 * Componente de Status de Sincronização Offline
 * Mostra progresso do download, status online/offline e permite forçar sincronização
 */

import React from 'react';
import { 
  Cloud, 
  CloudOff, 
  RefreshCw, 
  Download, 
  CheckCircle, 
  AlertCircle,
  Clock,
  Database,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const OfflineSyncStatus = ({ 
  isOnline,
  isSyncing,
  syncProgress,
  lastSyncTime,
  error,
  onSync,
  onClearCache,
  cachedData,
  cacheAge
}) => {
  
  const formatSyncTime = (date) => {
    if (!date) return 'Nunca';
    
    const now = new Date();
    const diff = Math.floor((now - date) / 1000 / 60); // minutos
    
    if (diff < 1) return 'Agora mesmo';
    if (diff < 60) return `${diff} min atrás`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h atrás`;
    return `${Math.floor(diff / 1440)}d atrás`;
  };

  const getTotalRecords = () => {
    if (!cachedData || typeof cachedData !== 'object') return 0;
    return Object.values(cachedData).reduce((sum, arr) => {
      return sum + (Array.isArray(arr) ? arr.length : 0);
    }, 0);
  };

  const totalRecords = getTotalRecords();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      
      {/* Header com Status */}
      <div className={`px-4 py-3 flex items-center justify-between ${
        isOnline 
          ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
          : 'bg-gradient-to-r from-orange-500 to-red-600'
      }`}>
        <div className="flex items-center gap-2 text-white">
          {isOnline ? (
            <>
              <Cloud className="w-5 h-5" />
              <span className="font-semibold">Online</span>
            </>
          ) : (
            <>
              <CloudOff className="w-5 h-5" />
              <span className="font-semibold">Modo Offline</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Botão Sincronizar */}
          <button
            onClick={onSync}
            disabled={isSyncing || !isOnline}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              isSyncing || !isOnline
                ? 'bg-white/20 text-white/50 cursor-not-allowed'
                : 'bg-white/90 text-gray-800 hover:bg-white active:scale-95'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">
              {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
            </span>
          </button>

          {/* Botão Limpar Cache */}
          {totalRecords > 0 && (
            <button
              onClick={onClearCache}
              disabled={isSyncing}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all active:scale-95"
              title="Limpar cache"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Barra de Progresso */}
      <AnimatePresence>
        {isSyncing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gray-50 dark:bg-gray-900 px-4 py-3 border-b border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center gap-3 mb-2">
              <Download className="w-4 h-4 text-blue-500 animate-bounce" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Baixando dados do servidor...
              </span>
              <span className="ml-auto text-sm font-bold text-blue-600 dark:text-blue-400">
                {Math.round(syncProgress)}%
              </span>
            </div>
            
            {/* Barra de Progresso */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${syncProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Erro */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 px-4 py-3"
          >
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                  Erro na sincronização
                </p>
                <p className="text-xs text-red-600 dark:text-red-300 mt-1">
                  {error}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Estatísticas */}
      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
        
        {/* Última Sincronização */}
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Última Sync</p>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              {formatSyncTime(lastSyncTime)}
            </p>
          </div>
        </div>

        {/* Total de Registros */}
        <div className="flex items-start gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <Database className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Registros</p>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              {totalRecords.toLocaleString('pt-BR')}
            </p>
          </div>
        </div>

        {/* Status do Cache */}
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${
            cacheAge && cacheAge < 60
              ? 'bg-green-100 dark:bg-green-900/30'
              : 'bg-orange-100 dark:bg-orange-900/30'
          }`}>
            <CheckCircle className={`w-4 h-4 ${
              cacheAge && cacheAge < 60
                ? 'text-green-600 dark:text-green-400'
                : 'text-orange-600 dark:text-orange-400'
            }`} />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Cache</p>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
              {cacheAge 
                ? cacheAge < 60 ? 'Atualizado' : 'Desatualizado'
                : 'Vazio'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Detalhes das Coleções */}
      {cachedData && Object.keys(cachedData).length > 0 && (
        <div className="px-4 pb-4">
          <details className="group">
            <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors list-none">
              <div className="flex items-center gap-2">
                <span>Ver detalhes das coleções</span>
                <svg 
                  className="w-4 h-4 transition-transform group-open:rotate-180" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </summary>
            
            <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
              {Object.entries(cachedData).map(([collectionName, data]) => (
                <div 
                  key={collectionName}
                  className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-900 rounded-lg"
                >
                  <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">
                    {collectionName}
                  </span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {Array.isArray(data) ? data.length : 0}
                  </span>
                </div>
              ))}
            </div>
          </details>
        </div>
      )}

      {/* Mensagem quando offline */}
      {!isOnline && totalRecords === 0 && (
        <div className="px-4 pb-4">
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
            <p className="text-sm text-orange-800 dark:text-orange-200">
              ⚠️ Você está offline e não há dados em cache. Conecte-se à internet para baixar os dados.
            </p>
          </div>
        </div>
      )}

      {/* Mensagem de sucesso quando online e cache válido */}
      {isOnline && !isSyncing && totalRecords > 0 && cacheAge < 60 && (
        <div className="px-4 pb-4">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
            <p className="text-sm text-green-800 dark:text-green-200 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              ✅ Todos os dados estão sincronizados e disponíveis offline!
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfflineSyncStatus;
