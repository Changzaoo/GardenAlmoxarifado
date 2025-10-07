import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Server, 
  Plus, 
  Trash2, 
  Edit2, 
  Activity, 
  Database, 
  Clock, 
  TrendingUp,
  MapPin,
  RotateCw,
  AlertCircle,
  CheckCircle,
  BarChart3,
  Calendar
} from 'lucide-react';
import { useServerManagement } from '../hooks/useServerManagement';
import InitializeServersButton from './InitializeServersButton';
import AddServerModal from './AddServerModal';

/**
 * 🖥️ Painel de Gerenciamento de Servidores
 * - Visualização de todos os servidores
 * - Adicionar/Remover servidores
 * - Estatísticas de uso por período
 * - Sistema de rotação de backup
 */
const ServerManagement = () => {
  const { 
    servers, 
    loading, 
    backupRotation, 
    usageStats,
    addServer,
    updateServer,
    removeServer,
    getOverallStats 
  } = useServerManagement();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingServer, setEditingServer] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  const overallStats = getOverallStats();

  // Adicionar servidor (chamado pelo modal)
  const handleAddServer = async (serverData) => {
    await addServer(serverData);
  };

  const handleDeleteServer = async (serverId) => {
    if (window.confirm('Tem certeza que deseja remover este servidor?')) {
      try {
        await removeServer(serverId);
      } catch (err) {
        console.error('Erro ao remover servidor:', err);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Se não houver servidores, mostrar botão de inicialização
  if (servers.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 text-center">
        <Server className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Nenhum Servidor Configurado
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Inicie com os 3 servidores padrão ou adicione manualmente um novo servidor
        </p>
        
        <div className="flex flex-col items-center gap-4">
          <InitializeServersButton />
          
          <div className="text-gray-500">ou</div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Adicionar Servidor Manualmente
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com Estatísticas Gerais */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-xl p-6 text-white">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <Server className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Gerenciamento de Servidores</h2>
              <p className="text-blue-100 text-sm">Controle total da infraestrutura</p>
            </div>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-white text-blue-600 px-4 py-2 rounded-xl font-semibold hover:bg-blue-50 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Adicionar Servidor
          </motion.button>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Server className="w-6 h-6" />
              <div>
                <p className="text-sm text-blue-100">Total</p>
                <p className="text-2xl font-bold">{overallStats.totalServers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6" />
              <div>
                <p className="text-sm text-blue-100">Ativos</p>
                <p className="text-2xl font-bold">{overallStats.activeServers}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Database className="w-6 h-6" />
              <div>
                <p className="text-sm text-blue-100">Capacidade</p>
                <p className="text-2xl font-bold">{overallStats.totalCapacity}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Activity className="w-6 h-6" />
              <div>
                <p className="text-sm text-blue-100">Carga Média</p>
                <p className="text-2xl font-bold">{overallStats.averageLoad.toFixed(1)}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center gap-3">
              <RotateCw className="w-6 h-6" />
              <div>
                <p className="text-sm text-blue-100">Backups</p>
                <p className="text-2xl font-bold">{overallStats.totalBackups}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sistema de Rotação de Backup */}
      {backupRotation && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <RotateCw className="w-6 h-6 text-purple-600 dark:text-purple-400 animate-spin" style={{ animationDuration: '3s' }} />
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Sistema de Rotação de Backup
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <p className="text-sm text-green-600 dark:text-green-400 font-semibold mb-2">
                🔄 Backup Atual
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {backupRotation.current?.name || 'N/A'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {backupRotation.current?.region || 'N/A'}
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <p className="text-sm text-blue-600 dark:text-blue-400 font-semibold mb-2">
                ⏭️ Próximo Backup
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {backupRotation.next?.name || 'N/A'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {backupRotation.next?.region || 'N/A'}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Ordem de Rotação:
            </p>
            <div className="flex flex-wrap gap-2">
              {backupRotation.rotation.map((serverId, index) => {
                const server = servers.find(s => s.id === serverId);
                return (
                  <div
                    key={serverId}
                    className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full text-sm"
                  >
                    {index + 1}. {server?.name || serverId}
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* Filtro de Período */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
        <div className="flex items-center gap-4">
          <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Período de Análise:
          </span>
          <div className="flex gap-2">
            {['today', 'week', 'month'].map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  selectedPeriod === period
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {period === 'today' ? 'Hoje' : period === 'week' ? 'Semana' : 'Mês'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lista de Servidores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {servers.map((server) => {
            const stats = usageStats[server.id] || {};
            const usageCount = stats[selectedPeriod] || 0;

            return (
              <motion.div
                key={server.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow"
              >
                {/* Header do Card */}
                <div className={`p-4 ${
                  server.status === 'active' 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                    : 'bg-gradient-to-r from-gray-500 to-gray-600'
                } text-white`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Server className="w-5 h-5" />
                      <h3 className="font-bold text-lg">{server.name}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      {server.status === 'active' ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <AlertCircle className="w-5 h-5" />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4" />
                    <span>{server.region}</span>
                  </div>
                </div>

                {/* Corpo do Card */}
                <div className="p-4 space-y-4">
                  {/* Estatísticas */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-xs font-semibold">Uso</span>
                      </div>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {usageCount}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        requisições
                      </p>
                    </div>

                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-1">
                        <Clock className="w-4 h-4" />
                        <span className="text-xs font-semibold">Resposta</span>
                      </div>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {stats.avgResponseTime?.toFixed(0) || 0}ms
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        média
                      </p>
                    </div>

                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-1">
                        <Activity className="w-4 h-4" />
                        <span className="text-xs font-semibold">Uptime</span>
                      </div>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {stats.uptime || 100}%
                      </p>
                    </div>

                    <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 mb-1">
                        <BarChart3 className="w-4 h-4" />
                        <span className="text-xs font-semibold">Carga</span>
                      </div>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {server.currentLoad || 0}%
                      </p>
                    </div>
                  </div>

                  {/* Último Backup */}
                  {server.lastBackup && (
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-1">
                        <RotateCw className="w-4 h-4" />
                        <span className="text-xs font-semibold">Último Backup</span>
                      </div>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {new Date(server.lastBackup).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  )}

                  {/* Ações */}
                  <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => setEditingServer(server)}
                      className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteServer(server.id)}
                      className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Modal de Adicionar Servidor */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Adicionar Novo Servidor
                </h3>
                <button
                  type="button"
                  onClick={async () => {
                    const { addGardenServers } = await import('../scripts/addGardenServers');
                    const result = await addGardenServers();
                    if (result.success && result.added > 0) {
                      setShowAddModal(false);
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold transition-colors"
                >
                  <Database className="w-4 h-4" />
                  Adicionar Garden DBs
                </button>
              </div>

              {/* Toggle entre modos */}
              <div className="flex gap-2 mb-6">
                <button
                  type="button"
                  onClick={() => setAddMode('paste')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all ${
                    addMode === 'paste'
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <Code className="w-5 h-5" />
                  Colar Configuração
                </button>
                <button
                  type="button"
                  onClick={() => setAddMode('manual')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all ${
                    addMode === 'manual'
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <Edit2 className="w-5 h-5" />
                  Manual
                </button>
              </div>

              <form onSubmit={handleAddServer} className="space-y-4">
                {addMode === 'paste' ? (
                  /* Modo: Colar Configuração Firebase */
                  <div className="space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                            🎯 Cole a configuração do seu Firebase
                          </h4>
                          <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                            O sistema detectará automaticamente a região, localização e criará o servidor!
                          </p>
                          <p className="text-xs text-blue-600 dark:text-blue-400 font-mono bg-white dark:bg-gray-800 rounded px-2 py-1">
                            💡 Exemplo: garden-c0b50 → 🇧🇷 São Paulo, Brasil
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Configuração Firebase (JavaScript)
                      </label>
                      <textarea
                        required
                        value={configText}
                        onChange={(e) => handleConfigTextChange(e.target.value)}
                        rows={12}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                        placeholder={`const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123",
  measurementId: "G-XXXXXXXXX"
};`}
                      />
                    </div>

                    {/* Preview do Servidor Detectado */}
                    {parsedPreview && !parseError && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4"
                      >
                        <div className="flex items-start gap-3 mb-3">
                          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-semibold text-green-900 dark:text-green-100 mb-1">
                              ✨ Servidor Detectado Automaticamente!
                            </h4>
                            <p className="text-sm text-green-700 dark:text-green-300">
                              Confira as informações abaixo antes de adicionar
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                            <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Nome</p>
                            <p className="font-semibold text-gray-900 dark:text-white">{parsedPreview.name}</p>
                          </div>
                          <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                            <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Região</p>
                            <p className="font-semibold text-gray-900 dark:text-white">{parsedPreview.region}</p>
                          </div>
                          <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                            <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Localização</p>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {parsedPreview.flag} {parsedPreview.country}
                            </p>
                          </div>
                          <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                            <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Coordenadas</p>
                            <p className="font-semibold text-gray-900 dark:text-white font-mono text-xs">
                              {parsedPreview.latitude.toFixed(4)}, {parsedPreview.longitude.toFixed(4)}
                            </p>
                          </div>
                          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 col-span-2">
                            <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Project ID</p>
                            <p className="font-semibold text-gray-900 dark:text-white font-mono text-xs">
                              {parsedPreview.config?.projectId}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {parseError && (
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                          <AlertCircle className="w-5 h-5" />
                          <span className="font-semibold">{parseError}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Modo: Manual */
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Nome do Servidor
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        placeholder="Ex: Servidor Principal"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Região
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.region}
                        onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        placeholder="Ex: us-central1"
                      />
                    </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Latitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: -23.5505"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Longitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: -46.6333"
                    />
                  </div>
                </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Tipo
                      </label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="primary">Primário</option>
                        <option value="backup">Backup</option>
                        <option value="testing">Teste</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Capacidade
                      </label>
                      <input
                        type="number"
                        required
                        value={formData.capacity}
                        onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        placeholder="Ex: 100"
                      />
                    </div>
                  </>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors"
                  >
                    Adicionar
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Simplificado de Adicionar Servidor */}
      <AddServerModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddServer}
      />
    </div>
  );
};

export default ServerManagement;
