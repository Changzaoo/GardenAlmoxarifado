import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Clock, XCircle, Loader, X } from 'lucide-react';
import { backgroundCorrectionService } from '../services/backgroundCorrectionService';

const BackgroundJobsIndicator = () => {
  const [jobs, setJobs] = useState([]);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Atualizar a cada 1 segundo
    const interval = setInterval(() => {
      const activeJobs = backgroundCorrectionService.getAllActiveJobs();
      setJobs(activeJobs);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const runningJobs = jobs.filter(j => j.status === 'running');
  const hasJobs = runningJobs.length > 0;

  if (!hasJobs && !showDetails) return null;

  const getStatusIcon = (status) => {
    switch (status) {
      case 'running':
        return <Loader className="w-4 h-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'cancelled':
        return <X className="w-4 h-4 text-gray-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'running':
        return 'Processando...';
      case 'completed':
        return 'Concluído';
      case 'error':
        return 'Erro';
      case 'cancelled':
        return 'Cancelado';
      default:
        return 'Aguardando';
    }
  };

  const formatDuration = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  return (
    <>
      {/* Indicador flutuante minificado */}
      <AnimatePresence>
        {hasJobs && !showDetails && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <button
              onClick={() => setShowDetails(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-2xl p-4 flex items-center gap-3 transition-all"
            >
              <Loader className="w-5 h-5 animate-spin" />
              <div className="text-left">
                <div className="font-semibold text-sm">Correção em andamento</div>
                <div className="text-xs opacity-90">
                  {runningJobs[0]?.progress.porcentagem || 0}% concluído
                </div>
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Painel de detalhes expandido */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            className="fixed bottom-6 right-6 z-50 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-96 max-h-[500px] overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-white" />
                <h3 className="text-white font-semibold">Tarefas em Segundo Plano</h3>
              </div>
              <button
                onClick={() => setShowDetails(false)}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Lista de jobs */}
            <div className="overflow-y-auto max-h-[400px] divide-y divide-gray-200 dark:divide-gray-700">
              {jobs.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma tarefa em andamento</p>
                </div>
              ) : (
                jobs.map((job) => (
                  <div key={job.id} className="p-4">
                    {/* Status e título */}
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(job.status)}
                      <div className="flex-1">
                        <div className="font-semibold text-sm text-gray-900 dark:text-white">
                          Correção de Pontos
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {getStatusText(job.status)}
                        </div>
                      </div>
                      {job.status === 'running' && (
                        <div className="text-sm font-bold text-blue-600">
                          {job.progress.porcentagem}%
                        </div>
                      )}
                    </div>

                    {/* Barra de progresso */}
                    {job.status === 'running' && (
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                        <motion.div
                          className="bg-blue-600 h-2 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${job.progress.porcentagem}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    )}

                    {/* Detalhes */}
                    <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                      {job.status === 'running' && (
                        <>
                          <div>
                            {job.progress.atual} de {job.progress.total} registros
                          </div>
                          <div>
                            Tempo decorrido: {formatDuration(Date.now() - job.startTime)}
                          </div>
                        </>
                      )}
                      {job.status === 'completed' && (
                        <div className="text-green-600 dark:text-green-400">
                          ✓ Concluído em {formatDuration(job.duration)}
                        </div>
                      )}
                      {job.status === 'error' && (
                        <div className="text-red-600 dark:text-red-400">
                          ✗ Erro: {job.error}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer com resumo */}
            {runningJobs.length > 0 && (
              <div className="bg-gray-50 dark:bg-gray-900 px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                {runningJobs.length} tarefa{runningJobs.length > 1 ? 's' : ''} em andamento
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default BackgroundJobsIndicator;
