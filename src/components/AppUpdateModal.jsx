import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Download, X, Sparkles, Zap } from 'lucide-react';
import useAppUpdate from '../hooks/useAppUpdate';

/**
 * Componente de Atualização da Aplicação
 * Exibe modal quando há nova versão disponível e gerencia o processo de atualização
 */
export const AppUpdateModal = () => {
  const {
    updateAvailable,
    currentVersion,
    newVersion,
    isChecking,
    applyUpdate,
    dismissUpdate,
    checkForUpdate
  } = useAppUpdate();

  const [isUpdating, setIsUpdating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [countdown, setCountdown] = useState(null);

  // Simula progresso de download/atualização
  useEffect(() => {
    if (isUpdating) {
      setProgress(0);
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [isUpdating]);

  // Auto-atualização após 30 segundos
  useEffect(() => {
    if (updateAvailable && !countdown) {
      setCountdown(30);
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            handleUpdate();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [updateAvailable, countdown]);

  const handleUpdate = async () => {
    setIsUpdating(true);
    setProgress(0);
    
    // Simula download da nova versão
    await new Promise(resolve => setTimeout(resolve, 1000));
    setProgress(100);
    
    // Aguarda um pouco para mostrar 100%
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Aplica a atualização
    await applyUpdate();
  };

  const handleDismiss = () => {
    setCountdown(null);
    dismissUpdate();
  };

  if (!updateAvailable) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
        >
          {/* Header com gradiente */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700 p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles className="w-6 h-6 text-white" />
                  </motion.div>
                  <h2 className="text-2xl font-bold text-white">
                    Nova Atualização!
                  </h2>
                </div>
                {!isUpdating && countdown > 10 && (
                  <button
                    onClick={handleDismiss}
                    className="text-white/80 hover:text-white transition-colors"
                    aria-label="Fechar"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
              <p className="text-white/90 text-sm">
                Uma nova versão está disponível com melhorias e correções
              </p>
            </div>
          </div>

          {/* Conteúdo */}
          <div className="p-6">
            {/* Informações de versão */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Versão Atual
                </span>
                <span className="font-mono font-semibold text-gray-900 dark:text-white">
                  v{currentVersion?.version || '1.0.0'}
                </span>
              </div>

              <div className="flex items-center justify-center">
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <Download className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                </motion.div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-700">
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Nova Versão
                </span>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span className="font-mono font-bold text-blue-900 dark:text-blue-100">
                    v{newVersion?.version || '1.0.1'}
                  </span>
                </div>
              </div>
            </div>

            {/* Barra de progresso */}
            {isUpdating && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Atualizando...
                  </span>
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                    {progress}%
                  </span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-600 dark:to-purple-700"
                  />
                </div>
              </motion.div>
            )}

            {/* Botões de ação */}
            {!isUpdating && (
              <div className="space-y-3">
                <button
                  onClick={handleUpdate}
                  className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 dark:from-blue-600 dark:to-purple-700 dark:hover:from-blue-700 dark:hover:to-purple-800 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-5 h-5" />
                  Atualizar Agora
                </button>

                {countdown && countdown > 10 && (
                  <button
                    onClick={handleDismiss}
                    className="w-full py-2 px-4 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 font-medium transition-colors"
                  >
                    Lembrar mais tarde
                  </button>
                )}

                {countdown && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center"
                  >
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Atualização automática em{' '}
                      <span className="font-bold text-blue-600 dark:text-blue-400">
                        {countdown}s
                      </span>
                    </p>
                  </motion.div>
                )}
              </div>
            )}

            {/* Mensagem durante atualização */}
            {isUpdating && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-sm text-gray-600 dark:text-gray-400"
              >
                Aguarde enquanto atualizamos o sistema...
              </motion.p>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 pb-4">
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <Sparkles className="w-3 h-3" />
              <span>Seu sistema será atualizado automaticamente</span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AppUpdateModal;
