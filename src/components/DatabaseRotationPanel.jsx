import React, { useState } from 'react';
import { useDatabaseRotationContext } from '../contexts/DatabaseRotationContext';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * 🎛️ Painel de Controle de Backup
 */
export const DatabaseRotationPanel = () => {
  const {
    activeDatabase,
    lastRotation,
    nextRotation,
    isRotating,
    isSyncing,
    syncProgress,
    rotationHistory,
    forceRotation,
    forceSync,
    getInfo,
    needsRotation,
    hoursUntilRotation
  } = useDatabaseRotationContext();

  const [showHistory, setShowHistory] = useState(false);
  const [info, setInfo] = useState(null);

  const handleForceRotation = async () => {
    if (confirm('Tem certeza que deseja forçar a rotação de database agora?')) {
      await forceRotation();
    }
  };

  const handleForceSync = async () => {
    if (confirm('Tem certeza que deseja forçar a sincronização agora?')) {
      await forceSync();
    }
  };

  const handleShowInfo = () => {
    setInfo(getInfo());
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleString('pt-BR');
  };

  const formatHours = (hours) => {
    if (hours < 0) return '0h';
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <span className="text-2xl">🔄</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              Backup Automático
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Sistema de rotação de databases
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div className={`px-4 py-2 rounded-full font-semibold ${
          activeDatabase === 'primary'
            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
            : 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
        }`}>
          {activeDatabase === 'primary' ? '🔵 Principal' : '🟣 Backup'}
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Database Ativo */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Database Ativo
          </div>
          <div className="text-2xl font-bold text-gray-800 dark:text-white">
            {activeDatabase === 'primary' ? 'Principal' : 'Backup'}
          </div>
        </div>

        {/* Última Rotação */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Última Rotação
          </div>
          <div className="text-lg font-bold text-gray-800 dark:text-white">
            {formatDate(lastRotation)}
          </div>
        </div>

        {/* Próxima Rotação */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Próxima Rotação
          </div>
          <div className="text-lg font-bold text-gray-800 dark:text-white">
            {formatHours(hoursUntilRotation)}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {(isRotating || isSyncing) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 bg-gray-100 dark:bg-gray-700 rounded-lg p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {isRotating ? '🔄 Rotacionando...' : '🔄 Sincronizando...'}
            </span>
            {syncProgress && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {syncProgress.current}/{syncProgress.total} ({syncProgress.percentage}%)
              </span>
            )}
          </div>
          
          {syncProgress && (
            <>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mb-2">
                <motion.div
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${syncProgress.percentage}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Sincronizando: {syncProgress.collection}
              </div>
            </>
          )}
        </motion.div>
      )}

      {/* Warning */}
      {needsRotation && !isRotating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4"
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h3 className="font-semibold text-yellow-800 dark:text-yellow-300">
                Rotação Pendente
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                Já passou das 24 horas. A rotação será executada automaticamente em breve.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={handleForceRotation}
          disabled={isRotating || isSyncing}
          className="flex-1 min-w-[200px] bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
        >
          🔄 Forçar Rotação
        </button>

        <button
          onClick={handleForceSync}
          disabled={isRotating || isSyncing}
          className="flex-1 min-w-[200px] bg-gradient-to-r from-green-500 to-teal-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-green-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
        >
          🔄 Forçar Sincronização
        </button>

        <button
          onClick={() => setShowHistory(!showHistory)}
          className="flex-1 min-w-[200px] bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white font-semibold py-3 px-6 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all shadow-md hover:shadow-lg"
        >
          📜 {showHistory ? 'Ocultar' : 'Ver'} Histórico
        </button>

        <button
          onClick={handleShowInfo}
          className="flex-1 min-w-[200px] bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white font-semibold py-3 px-6 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all shadow-md hover:shadow-lg"
        >
          ℹ️ Ver Info Completa
        </button>
      </div>

      {/* History */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 overflow-hidden"
          >
            <h3 className="font-semibold text-gray-800 dark:text-white mb-3">
              📜 Histórico de Rotações
            </h3>
            
            {rotationHistory.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Nenhuma rotação registrada ainda.
              </p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {rotationHistory.slice().reverse().map((entry, index) => (
                  <div
                    key={index}
                    className="bg-white dark:bg-gray-800 rounded-lg p-3 text-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-800 dark:text-white">
                        {entry.from} → {entry.to}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(entry.timestamp)}
                      </span>
                    </div>
                    {entry.synced && entry.syncResult && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        ✅ Sincronizado: {entry.syncResult.totalSynced || 0} documentos
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Modal */}
      <AnimatePresence>
        {info && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setInfo(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                  ℹ️ Informações do Sistema
                </h3>
                <button
                  onClick={() => setInfo(null)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>
              
              <pre className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4 text-xs overflow-x-auto">
                {JSON.stringify(info, null, 2)}
              </pre>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DatabaseRotationPanel;
