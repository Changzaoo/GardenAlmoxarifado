import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Database,
  Plus,
  Trash2,
  Power,
  PowerOff,
  Edit2,
  Save,
  X,
  Check,
  AlertCircle,
  RefreshCw,
  Copy,
  Eye,
  EyeOff,
  Server,
  Activity
} from 'lucide-react';
import { dbManager, addFirebaseDatabase, firebaseDatabases } from '../config/firebaseMulti';

/**
 * 🔧 Página de Gerenciamento de Bancos de Dados Firebase
 * 
 * Permite adicionar, remover, habilitar/desabilitar e configurar
 * múltiplos bancos de dados Firebase para rotação automática.
 */
const DatabaseManagementPage = () => {
  const [databases, setDatabases] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDb, setEditingDb] = useState(null);
  const [activeDb, setActiveDb] = useState('');
  const [rotationInfo, setRotationInfo] = useState(null);
  
  // Form para novo banco
  const [newDbForm, setNewDbForm] = useState({
    name: '',
    description: '',
    projectId: '',
    apiKey: '',
    authDomain: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
    measurementId: '',
    priority: 10,
    enabled: true
  });

  const [showSecrets, setShowSecrets] = useState({});

  // Carregar informações ao montar
  useEffect(() => {
    loadDatabasesInfo();
    
    // Atualizar a cada 5 segundos
    const interval = setInterval(loadDatabasesInfo, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadDatabasesInfo = () => {
    const info = dbManager.getInfo();
    setDatabases(info.databases);
    setActiveDb(info.activeDatabase);
    setRotationInfo(info);
  };

  const handleAddDatabase = () => {
    try {
      const config = {
        id: newDbForm.projectId,
        name: newDbForm.name,
        description: newDbForm.description,
        config: {
          apiKey: newDbForm.apiKey,
          authDomain: newDbForm.authDomain,
          projectId: newDbForm.projectId,
          storageBucket: newDbForm.storageBucket,
          messagingSenderId: newDbForm.messagingSenderId,
          appId: newDbForm.appId,
          measurementId: newDbForm.measurementId
        },
        priority: parseInt(newDbForm.priority),
        enabled: newDbForm.enabled
      };

      addFirebaseDatabase(config);
      setShowAddModal(false);
      loadDatabasesInfo();
      
      // Reset form
      setNewDbForm({
        name: '',
        description: '',
        projectId: '',
        apiKey: '',
        authDomain: '',
        storageBucket: '',
        messagingSenderId: '',
        appId: '',
        measurementId: '',
        priority: 10,
        enabled: true
      });
    } catch (error) {
      console.error('Erro ao adicionar banco:', error);
      alert('Erro ao adicionar banco de dados: ' + error.message);
    }
  };

  const handleSwitchDatabase = (dbId) => {
    try {
      dbManager.switchToDatabase(dbId);
      loadDatabasesInfo();
      alert(`Database alternado para: ${dbId}`);
    } catch (error) {
      console.error('Erro ao alternar database:', error);
      alert('Erro: ' + error.message);
    }
  };

  const handleToggleSecret = (field) => {
    setShowSecrets(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copiado para a área de transferência!');
  };

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      
      // Tentar parsear como Firebase config
      if (text.includes('firebaseConfig')) {
        // Extrair objeto de configuração
        const configMatch = text.match(/const firebaseConfig = ({[\s\S]*?});/);
        if (configMatch) {
          const configStr = configMatch[1];
          const config = eval('(' + configStr + ')');
          
          setNewDbForm(prev => ({
            ...prev,
            apiKey: config.apiKey || '',
            authDomain: config.authDomain || '',
            projectId: config.projectId || '',
            storageBucket: config.storageBucket || '',
            messagingSenderId: config.messagingSenderId || '',
            appId: config.appId || '',
            measurementId: config.measurementId || '',
            name: config.projectId ? `Firebase ${config.projectId}` : prev.name
          }));
          
          alert('✅ Configuração importada com sucesso!');
        }
      }
    } catch (error) {
      console.error('Erro ao importar configuração:', error);
      alert('Erro ao importar. Cole manualmente ou verifique o formato.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Server className="w-8 h-8" />
                Gerenciamento de Bancos de Dados
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Configure e gerencie múltiplos bancos de dados Firebase com rotação automática
              </p>
            </div>
            
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-xl hover:from-blue-600 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5" />
              Adicionar Banco
            </button>
          </div>
        </motion.div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <Database className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-3" />
            <div className="text-sm text-gray-500 dark:text-gray-400">Total de Bancos</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {rotationInfo?.totalDatabases || 0}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <Activity className="w-8 h-8 text-green-600 dark:text-green-400 mb-3" />
            <div className="text-sm text-gray-500 dark:text-gray-400">Bancos Ativos</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {rotationInfo?.enabledDatabases || 0}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
          >
            <RefreshCw className="w-8 h-8 text-purple-600 dark:text-purple-400 mb-3" />
            <div className="text-sm text-gray-500 dark:text-gray-400">Última Rotação</div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {rotationInfo?.lastRotation ? new Date(rotationInfo.lastRotation).toLocaleString('pt-BR') : 'Nunca'}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl shadow-lg p-6 text-white"
          >
            <Check className="w-8 h-8 mb-3" />
            <div className="text-sm opacity-90">Banco Atual</div>
            <div className="text-xl font-bold">
              {rotationInfo?.activeDatabaseName || 'Nenhum'}
            </div>
          </motion.div>
        </div>

        {/* Lista de Bancos */}
        <div className="grid grid-cols-1 gap-4">
          {databases.map((db, index) => (
            <motion.div
              key={db.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 ${
                db.isActive ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    db.isActive 
                      ? 'bg-blue-100 dark:bg-blue-900' 
                      : 'bg-gray-100 dark:bg-gray-700'
                  }`}>
                    <Database className={`w-6 h-6 ${
                      db.isActive 
                        ? 'text-blue-600 dark:text-blue-400' 
                        : 'text-gray-600 dark:text-gray-400'
                    }`} />
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {db.name}
                      </h3>
                      {db.isActive && (
                        <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-xs font-semibold rounded-full">
                          ATIVO
                        </span>
                      )}
                      {!db.enabled && (
                        <span className="px-3 py-1 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 text-xs font-semibold rounded-full">
                          DESABILITADO
                        </span>
                      )}
                      {db.inRotationSequence && (
                        <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 text-xs font-semibold rounded-full">
                          NA ROTAÇÃO
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {db.description}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>ID: {db.id}</span>
                      <span>Prioridade: {db.priority}</span>
                      <span className={`flex items-center gap-1 ${
                        db.isInitialized ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {db.isInitialized ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        {db.isInitialized ? 'Inicializado' : 'Não Inicializado'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!db.isActive && db.enabled && (
                    <button
                      onClick={() => handleSwitchDatabase(db.id)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      Ativar
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Modal Adicionar Banco */}
        <AnimatePresence>
          {showAddModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
              onClick={() => setShowAddModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                    <Plus className="w-6 h-6" />
                    Adicionar Novo Banco de Dados
                  </h2>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="mb-6">
                  <button
                    onClick={pasteFromClipboard}
                    className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-700 text-white rounded-lg hover:from-purple-600 hover:to-purple-800 transition-all flex items-center justify-center gap-2"
                  >
                    <Copy className="w-5 h-5" />
                    Colar Configuração do Firebase (da área de transferência)
                  </button>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                    Cole o código completo de configuração do Firebase Console
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Nome */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Nome do Banco
                    </label>
                    <input
                      type="text"
                      value={newDbForm.name}
                      onChange={(e) => setNewDbForm({...newDbForm, name: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:text-white"
                      placeholder="Ex: Workflow BR1"
                    />
                  </div>

                  {/* Descrição */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Descrição
                    </label>
                    <input
                      type="text"
                      value={newDbForm.description}
                      onChange={(e) => setNewDbForm({...newDbForm, description: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:text-white"
                      placeholder="Ex: Banco de dados adicional para workflow"
                    />
                  </div>

                  {/* Project ID */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Project ID *
                    </label>
                    <input
                      type="text"
                      value={newDbForm.projectId}
                      onChange={(e) => setNewDbForm({...newDbForm, projectId: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:text-white"
                      placeholder="Ex: workflowbr1"
                      required
                    />
                  </div>

                  {/* API Key */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      API Key *
                    </label>
                    <div className="relative">
                      <input
                        type={showSecrets.apiKey ? "text" : "password"}
                        value={newDbForm.apiKey}
                        onChange={(e) => setNewDbForm({...newDbForm, apiKey: e.target.value})}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:text-white pr-12"
                        placeholder="AIzaSy..."
                        required
                      />
                      <button
                        type="button"
                        onClick={() => handleToggleSecret('apiKey')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        {showSecrets.apiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Auth Domain */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Auth Domain *
                    </label>
                    <input
                      type="text"
                      value={newDbForm.authDomain}
                      onChange={(e) => setNewDbForm({...newDbForm, authDomain: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:text-white"
                      placeholder="Ex: workflowbr1.firebaseapp.com"
                      required
                    />
                  </div>

                  {/* Storage Bucket */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Storage Bucket *
                    </label>
                    <input
                      type="text"
                      value={newDbForm.storageBucket}
                      onChange={(e) => setNewDbForm({...newDbForm, storageBucket: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:text-white"
                      placeholder="Ex: workflowbr1.firebasestorage.app"
                      required
                    />
                  </div>

                  {/* Messaging Sender ID */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Messaging Sender ID *
                    </label>
                    <input
                      type="text"
                      value={newDbForm.messagingSenderId}
                      onChange={(e) => setNewDbForm({...newDbForm, messagingSenderId: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:text-white"
                      placeholder="Ex: 207274549565"
                      required
                    />
                  </div>

                  {/* App ID */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      App ID *
                    </label>
                    <input
                      type="text"
                      value={newDbForm.appId}
                      onChange={(e) => setNewDbForm({...newDbForm, appId: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:text-white"
                      placeholder="Ex: 1:207274549565:web:..."
                      required
                    />
                  </div>

                  {/* Measurement ID */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Measurement ID (opcional)
                    </label>
                    <input
                      type="text"
                      value={newDbForm.measurementId}
                      onChange={(e) => setNewDbForm({...newDbForm, measurementId: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:text-white"
                      placeholder="Ex: G-TYRLWERZMS"
                    />
                  </div>

                  {/* Prioridade */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Prioridade na Rotação
                    </label>
                    <input
                      type="number"
                      value={newDbForm.priority}
                      onChange={(e) => setNewDbForm({...newDbForm, priority: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:text-white"
                      min="1"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Menor número = maior prioridade na rotação
                    </p>
                  </div>

                  {/* Habilitado */}
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={newDbForm.enabled}
                      onChange={(e) => setNewDbForm({...newDbForm, enabled: e.target.checked})}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Habilitar banco de dados
                    </label>
                  </div>
                </div>

                {/* Botões */}
                <div className="flex gap-3 mt-8">
                  <button
                    onClick={handleAddDatabase}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-lg hover:from-blue-600 hover:to-blue-800 transition-all font-medium flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    Adicionar Banco
                  </button>
                  
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
                  >
                    Cancelar
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default DatabaseManagementPage;
