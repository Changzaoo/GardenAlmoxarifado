import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, CheckCircle, AlertCircle, X, RefreshCw } from 'lucide-react';
import { autoSyncService } from '../../utils/autoSyncService';

/**
 * Componente que mostra progresso de download automático de dados
 */
const AutoSyncIndicator = () => {
  const [syncState, setSyncState] = useState({
    isActive: false,
    currentStep: '',
    progress: 0,
    stats: null,
    error: null
  });

  const [showDetails, setShowDetails] = useState(false);
  const [lastSync, setLastSync] = useState(null);

  useEffect(() => {
    // Carregar informações do último sync
    const lastSyncTime = autoSyncService.getLastSyncTime();
    if (lastSyncTime) {
      setLastSync(new Date(lastSyncTime));
    }

    // Listener para eventos de sync
    const unsubscribe = autoSyncService.addSyncListener((event) => {
      switch (event.type) {
        case 'sync_start':
          setSyncState({
            isActive: true,
            currentStep: 'Iniciando...',
            progress: 0,
            stats: null,
            error: null
          });
          break;

        case 'sync_progress':
          const stepNames = {
            funcionarios: 'Funcionários',
            pontos: 'Pontos',
            avaliacoes: 'Avaliações',
            emprestimos: 'Empréstimos',
            ferramentas: 'Ferramentas',
            tarefas: 'Tarefas',
            escalas: 'Escalas',
            mensagens: 'Mensagens'
          };
          setSyncState(prev => ({
            ...prev,
            currentStep: `${stepNames[event.step] || event.step} (${event.count})`,
            progress: prev.progress + 12.5 // 8 steps = 100%
          }));
          break;

        case 'sync_complete':
          setSyncState({
            isActive: false,
            currentStep: 'Concluído!',
            progress: 100,
            stats: event.stats,
            error: null
          });
          setLastSync(new Date(event.timestamp));
          
          // Ocultar após 3 segundos
          setTimeout(() => {
            setSyncState(prev => ({ ...prev, isActive: false }));
          }, 3000);
          break;

        case 'sync_error':
          setSyncState({
            isActive: false,
            currentStep: 'Erro',
            progress: 0,
            stats: null,
            error: event.error
          });
          break;

        default:
          break;
      }
    });

    return () => unsubscribe();
  }, []);

  const formatLastSync = () => {
    if (!lastSync) return 'Nunca';
    
    const now = new Date();
    const diff = now - lastSync;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Agora mesmo';
    if (minutes < 60) return `Há ${minutes}min`;
    if (hours < 24) return `Há ${hours}h`;
    return `Há ${days}d`;
  };

  const getTotalItems = () => {
    if (!syncState.stats) return 0;
    return Object.values(syncState.stats).reduce((sum, val) => 
      typeof val === 'number' ? sum + val : sum, 0
    );
  };

  if (!syncState.isActive && !syncState.stats && !syncState.error) {
    return null;
  }

  return (
    <AnimatePresence>
      {syncState.isActive || syncState.stats || syncState.error ? (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 right-4 z-[100] max-w-sm"
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border-2 border-blue-500 dark:border-blue-600 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                {syncState.isActive ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span className="font-semibold">Sincronizando dados...</span>
                  </>
                ) : syncState.error ? (
                  <>
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-semibold">Erro na sincronização</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-semibold">Sincronização concluída</span>
                  </>
                )}
              </div>
              <button
                onClick={() => setSyncState({ isActive: false, currentStep: '', progress: 0, stats: null, error: null })}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
              {/* Progress Bar */}
              {syncState.isActive && (
                <>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {syncState.currentStep}
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${syncState.progress}%` }}
                      transition={{ duration: 0.3 }}
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                    />
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 text-right">
                    {Math.round(syncState.progress)}%
                  </div>
                </>
              )}

              {/* Stats */}
              {syncState.stats && !syncState.isActive && (
                <div className="space-y-2">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {getTotalItems()}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      itens disponíveis offline
                    </div>
                  </div>

                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline w-full text-center"
                  >
                    {showDetails ? 'Ocultar detalhes' : 'Ver detalhes'}
                  </button>

                  <AnimatePresence>
                    {showDetails && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-1 text-xs"
                      >
                        {Object.entries(syncState.stats).map(([key, value]) => {
                          if (key === 'errors' || typeof value !== 'number') return null;
                          const labels = {
                            funcionarios: 'Funcionários',
                            pontos: 'Pontos',
                            avaliacoes: 'Avaliações',
                            emprestimos: 'Empréstimos',
                            ferramentas: 'Ferramentas',
                            tarefas: 'Tarefas',
                            escalas: 'Escalas',
                            mensagens: 'Mensagens'
                          };
                          return (
                            <div
                              key={key}
                              className="flex justify-between items-center text-gray-600 dark:text-gray-400 py-1 border-b border-gray-200 dark:border-gray-700 last:border-0"
                            >
                              <span>{labels[key] || key}</span>
                              <span className="font-semibold text-gray-900 dark:text-white">{value}</span>
                            </div>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {syncState.stats.errors && syncState.stats.errors.length > 0 && (
                    <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2">
                      ⚠️ {syncState.stats.errors.length} erro(s) durante sincronização
                    </div>
                  )}
                </div>
              )}

              {/* Error */}
              {syncState.error && (
                <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg p-3">
                  <div className="font-semibold mb-1">Erro:</div>
                  <div className="text-xs">{syncState.error}</div>
                </div>
              )}

              {/* Last Sync Info */}
              {!syncState.isActive && lastSync && (
                <div className="text-xs text-gray-500 dark:text-gray-500 text-center pt-2 border-t border-gray-200 dark:border-gray-700">
                  Última sincronização: {formatLastSync()}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

export default AutoSyncIndicator;
