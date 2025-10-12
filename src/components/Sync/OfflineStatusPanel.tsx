/**
 * Painel de Status Offline
 * Mostra informações sobre dados em cache e permite gerenciar sincronização
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, 
  Database, 
  Trash2, 
  RefreshCw, 
  Clock,
  CheckCircle,
  AlertCircle,
  HardDrive,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useOfflineAvailability, useDataSync } from '../../hooks/useOfflineData';
import { autoSyncService } from '../../utils/autoSyncService';
import { toast } from 'react-toastify';

const OfflineStatusPanel = ({ isOpen, onClose }) => {
  const { hasData, stats, loading: statsLoading } = useOfflineAvailability();
  const { isSyncing, syncNow, lastSync, pendingCount, isOnline, hasPending } = useDataSync();
  const [clearing, setClearing] = useState(false);

  const formatLastSync = () => {
    if (!lastSync) return 'Nunca';
    
    const now = new Date();
    const diff = now - lastSync;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Agora mesmo';
    if (minutes < 60) return `Há ${minutes} minuto${minutes > 1 ? 's' : ''}`;
    if (hours < 24) return `Há ${hours} hora${hours > 1 ? 's' : ''}`;
    return `Há ${days} dia${days > 1 ? 's' : ''}`;
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const estimateDataSize = () => {
    if (!stats) return 0;
    // Estimativa: cada item ~1KB
    const totalItems = Object.values(stats).reduce((sum, count) => sum + count, 0);
    return totalItems * 1024;
  };

  const handleSyncNow = async () => {
    try {
      await syncNow();
      toast.success('✅ Sincronização concluída!');
    } catch (error) {
      toast.error('❌ ' + error.message);
    }
  };

  const handleClearData = async () => {
    if (!confirm('Tem certeza que deseja limpar todos os dados offline? Isso não afetará os dados no servidor.')) {
      return;
    }

    try {
      setClearing(true);
      await autoSyncService.clearOfflineData();
      toast.success('🗑️ Dados offline limpos com sucesso!');
      onClose();
    } catch (error) {
      toast.error('❌ Erro ao limpar dados: ' + error.message);
    } finally {
      setClearing(false);
    }
  };

  const getTotalItems = () => {
    if (!stats) return 0;
    return Object.values(stats).reduce((sum, count) => sum + count, 0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            <Database className="w-6 h-6" />
            <h2 className="text-xl font-bold">Status Offline</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status de Conexão */}
          <div className={`p-4 rounded-xl flex items-center gap-3 ${
            isOnline 
              ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-500' 
              : 'bg-red-50 dark:bg-red-900/20 border-2 border-red-500'
          }`}>
            {isOnline ? (
              <>
                <Wifi className="w-8 h-8 text-green-600 dark:text-green-400" />
                <div className="flex-1">
                  <div className="font-bold text-green-800 dark:text-green-200">Online</div>
                  <div className="text-sm text-green-600 dark:text-green-400">Conectado à internet</div>
                </div>
              </>
            ) : (
              <>
                <WifiOff className="w-8 h-8 text-red-600 dark:text-red-400" />
                <div className="flex-1">
                  <div className="font-bold text-red-800 dark:text-red-200">Offline</div>
                  <div className="text-sm text-red-600 dark:text-red-400">Trabalhando sem conexão</div>
                </div>
              </>
            )}
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-2">
                <HardDrive className="w-5 h-5" />
                <span className="text-sm font-semibold">Dados em Cache</span>
              </div>
              <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                {statsLoading ? '...' : getTotalItems()}
              </div>
              <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                {formatBytes(estimateDataSize())}
              </div>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl">
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-2">
                <Clock className="w-5 h-5" />
                <span className="text-sm font-semibold">Último Sync</span>
              </div>
              <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {formatLastSync()}
              </div>
              {lastSync && (
                <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                  {lastSync.toLocaleString('pt-BR')}
                </div>
              )}
            </div>
          </div>

          {/* Pendências */}
          {hasPending && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-500 p-4 rounded-xl">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                <div className="flex-1">
                  <div className="font-bold text-amber-900 dark:text-amber-100">
                    {pendingCount} operação(ões) pendente(s)
                  </div>
                  <div className="text-sm text-amber-700 dark:text-amber-300">
                    Serão sincronizadas automaticamente quando online
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Detalhes por Categoria */}
          {stats && (
            <div className="space-y-2">
              <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-3">
                Dados Disponíveis Offline:
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries({
                  funcionarios: 'Funcionários',
                  pontos: 'Pontos',
                  avaliacoes: 'Avaliações',
                  emprestimos: 'Empréstimos',
                  ferramentas: 'Ferramentas',
                  tarefas: 'Tarefas',
                  escalas: 'Escalas',
                  mensagens: 'Mensagens'
                }).map(([key, label]) => {
                  const count = stats[key] || 0;
                  return (
                    <div
                      key={key}
                      className="flex justify-between items-center bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg text-sm"
                    >
                      <span className="text-gray-700 dark:text-gray-300">{label}</span>
                      <span className="font-bold text-gray-900 dark:text-white">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Ações */}
          <div className="flex gap-3">
            <button
              onClick={handleSyncNow}
              disabled={!isOnline || isSyncing}
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Sincronizando...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Sincronizar Agora
                </>
              )}
            </button>

            <button
              onClick={handleClearData}
              disabled={clearing || !hasData}
              className="bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
              title="Limpar dados offline"
            >
              {clearing ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Trash2 className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Informações */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 text-sm mb-2 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Sincronização Automática
            </h4>
            <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
              <li>• Dados são baixados automaticamente ao entrar no app</li>
              <li>• Sincronização ocorre a cada 5 minutos quando online</li>
              <li>• Operações offline são enviadas automaticamente ao reconectar</li>
              <li>• Você pode usar o app normalmente mesmo sem internet</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default OfflineStatusPanel;
