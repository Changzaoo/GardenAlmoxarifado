import React, { useState, useEffect } from 'react';
import { useDatabaseRotationContext } from '../contexts/DatabaseRotationContext';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { primaryDb, backupDb } from '../config/firebaseDual';
import { getAllCollections, compareCollections } from '../services/databaseCollections';
import AddFirebaseServerModal from '../components/AddFirebaseServerModal';
import DocumentViewerModal from '../components/DocumentViewerModal';
import ServerWorldMap from '../components/ServerWorldMap';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { 
  Activity, 
  Database, 
  RefreshCw, 
  Settings, 
  Clock, 
  BarChart3,
  Zap,
  CheckCircle,
  XCircle,
  TrendingUp,
  Save,
  Play,
  Pause,
  AlertTriangle,
  FolderOpen,
  FileText,
  Search,
  Eye,
  EyeOff,
  Grid,
  List,
  Filter,
  Plus,
  Server,
  Shield,
  Cloud,
  X
} from 'lucide-react';

/**
 * 🚨 Componente de Erro Amigável
 */
const ErrorDisplay = ({ message, details }) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 text-center"
      >
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-red-600 dark:text-red-400" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          Oops! Algo deu errado
        </h2>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {message || 'Não foi possível carregar o sistema de backup.'}
        </p>
        
        {details && (
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-6 text-left">
            <p className="text-xs font-mono text-gray-700 dark:text-gray-300 break-words">
              {details}
            </p>
          </div>
        )}
        
        <div className="flex flex-col gap-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Recarregar Página
          </button>
          
          <a
            href="/"
            className="w-full px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors inline-block"
          >
            Voltar ao Início
          </a>
        </div>
      </motion.div>
    </div>
  );
};

/**
 * 🎛️ Página de Monitoramento Completo do Backup
 */
const BackupMonitoringPageContent = () => {
  const rotationContext = useDatabaseRotationContext();
  
  // Se o contexto não existe, mostra erro amigável
  if (!rotationContext) {
    return (
      <ErrorDisplay 
        message="Sistema de backup não disponível"
        details="O contexto de rotação de banco de dados não foi inicializado. Verifique se DatabaseRotationProvider está configurado."
      />
    );
  }

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
    hoursUntilRotation,
    autoRotate
  } = rotationContext;

  // Estados
  const [metrics, setMetrics] = useState({
    primary: { read: 0, write: 0, lastOperation: null, healthy: true },
    backup: { read: 0, write: 0, lastOperation: null, healthy: true }
  });

  const [settings, setSettings] = useState({
    rotationInterval: 24, // horas
    autoRotate: true,
    autoSync: true,
    notificationsEnabled: true
  });

  const [testResults, setTestResults] = useState(null);
  const [isTestingPrimary, setIsTestingPrimary] = useState(false);
  const [isTestingBackup, setIsTestingBackup] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Estados para coleções
  const [collections, setCollections] = useState(null);
  const [collectionsLoading, setCollectionsLoading] = useState(false);
  const [showCollections, setShowCollections] = useState(false);
  const [collectionsView, setCollectionsView] = useState('grid'); // 'grid' | 'list'
  const [collectionsFilter, setCollectionsFilter] = useState('all'); // 'all' | 'primary' | 'backup' | 'synced' | 'out-of-sync'
  const [collectionsComparison, setCollectionsComparison] = useState(null);

  // Estados para servidores
  const [showAddServerModal, setShowAddServerModal] = useState(false);
  const [customServers, setCustomServers] = useState([]);

  // Estados para visualização de documentos
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  const [selectedCollectionForViewer, setSelectedCollectionForViewer] = useState(null);
  const [selectedDatabaseForViewer, setSelectedDatabaseForViewer] = useState(null);

  /**
   * 🧪 Testar Leitura/Escrita no Database
   */
  const testDatabase = async (db, dbName) => {
    const setTesting = dbName === 'primary' ? setIsTestingPrimary : setIsTestingBackup;
    setTesting(true);

    const results = {
      database: dbName,
      timestamp: new Date().toISOString(),
      tests: []
    };

    try {
      // Teste 1: Escrita
      const writeStart = performance.now();
      const testRef = await addDoc(collection(db, 'backup_test'), {
        test: true,
        timestamp: serverTimestamp(),
        message: 'Test write operation',
        createdBy: 'backup-monitoring-test'
      });
      const writeTime = performance.now() - writeStart;
      results.tests.push({
        name: 'Escrita',
        status: 'success',
        time: writeTime.toFixed(2) + 'ms',
        details: `Documento ${testRef.id} criado`
      });

      // Teste 2: Leitura
      const readStart = performance.now();
      const snapshot = await getDocs(collection(db, 'backup_test'));
      const readTime = performance.now() - readStart;

      results.tests.push({
        name: 'Leitura',
        status: 'success',
        time: readTime.toFixed(2) + 'ms',
        details: `${snapshot.size} documentos lidos`
      });

      // Teste 3: Atualização
      const updateStart = performance.now();
      await updateDoc(doc(db, 'backup_test', testRef.id), {
        updated: true,
        updateTimestamp: serverTimestamp()
      });
      const updateTime = performance.now() - updateStart;

      results.tests.push({
        name: 'Atualização',
        status: 'success',
        time: updateTime.toFixed(2) + 'ms',
        details: 'Documento atualizado'
      });

      // Teste 4: Exclusão
      const deleteStart = performance.now();
      await deleteDoc(doc(db, 'backup_test', testRef.id));
      const deleteTime = performance.now() - deleteStart;

      results.tests.push({
        name: 'Exclusão',
        status: 'success',
        time: deleteTime.toFixed(2) + 'ms',
        details: 'Documento removido'
      });

      // Atualizar métricas
      setMetrics(prev => ({
        ...prev,
        [dbName]: {
          ...prev[dbName],
          read: prev[dbName].read + 1,
          write: prev[dbName].write + 3, // add, update, delete
          lastOperation: new Date().toISOString(),
          healthy: true
        }
      }));

      results.success = true;
      results.summary = `Todos os testes passaram! Latência média: ${((writeTime + readTime + updateTime + deleteTime) / 4).toFixed(2)}ms`;

    } catch (error) {
      console.error(`❌ Erro no teste de ${dbName}:`, error);
      
      results.success = false;
      results.error = error.message;
      
      // Mensagem de erro mais clara para permissões
      let errorMessage = error.message;
      if (error.code === 'permission-denied' || error.message.includes('permission')) {
        errorMessage = '❌ Erro de Permissões: Verifique se você está logado como Admin (nível >= 3) e recarregue a página (Ctrl+Shift+R) para atualizar as regras do Firestore.';
        
        toast.error('Sem permissões para testar. Recarregue a página!', {
          position: 'top-center',
          autoClose: 5000,
          hideProgressBar: false
        });
      }
      
      results.tests.push({
        name: 'Erro',
        status: 'error',
        details: errorMessage
      });

      // Marcar database como não saudável
      setMetrics(prev => ({
        ...prev,
        [dbName]: {
          ...prev[dbName],
          healthy: false
        }
      }));
    }

    setTestResults(results);
    setTesting(false);
  };

  /**
   * 💾 Salvar Configurações
   */
  const saveSettings = () => {
    localStorage.setItem('backupSettings', JSON.stringify(settings));
    
    // Atualizar configuração do sistema
    // (Isso requer recarregar o Provider com novas configurações)
    alert('Configurações salvas! Recarregue a página para aplicar.');
  };

  /**
   * 🗂️ Carregar todas as coleções
   */
  const loadCollections = async () => {
    setCollectionsLoading(true);
    try {
      const collectionsData = await getAllCollections();
      setCollections(collectionsData);
      
      // Carregar comparação
      const comparisonData = await compareCollections();
      setCollectionsComparison(comparisonData);
    } catch (error) {
      console.error('❌ Erro ao carregar coleções:', error);
      alert('Erro ao carregar coleções. Verifique a conexão com o Firebase.');
    } finally {
      setCollectionsLoading(false);
    }
  };

  /**
   * 🔄 Atualizar coleções
   */
  const refreshCollections = () => {
    loadCollections();
  };

  /**
   * 👁️ Abrir visualizador de documentos
   */
  const openDocumentViewer = (collection, database) => {
    setSelectedCollectionForViewer(collection);
    setSelectedDatabaseForViewer(database);
    setShowDocumentViewer(true);
  };

  /**
   * ❌ Fechar visualizador de documentos
   */
  const closeDocumentViewer = () => {
    setShowDocumentViewer(false);
    setSelectedCollectionForViewer(null);
    setSelectedDatabaseForViewer(null);
  };

  /**
   * 🎯 Filtrar coleções conforme filtro selecionado
   */
  const getFilteredCollections = () => {
    if (!collections) return [];
    
    const allCollections = [
      ...collections.primary.collections.map(c => ({ ...c, database: 'primary' })),
      ...collections.backup.collections.map(c => ({ ...c, database: 'backup' }))
    ];
    
    switch (collectionsFilter) {
      case 'primary':
        return collections.primary.collections.filter(c => c.hasData);
      case 'backup':
        return collections.backup.collections.filter(c => c.hasData);
      case 'synced':
        return collectionsComparison?.collections.filter(c => c.inSync && c.primary.hasData) || [];
      case 'out-of-sync':
        return collectionsComparison?.collections.filter(c => c.needsSync && (c.primary.hasData || c.backup.hasData)) || [];
      default:
        return allCollections.filter(c => c.hasData);
    }
  };

  /**
   * 🆕 Carregar servidores customizados
   */
  const loadCustomServers = () => {
    try {
      const servers = JSON.parse(localStorage.getItem('firebaseServers') || '[]');
      setCustomServers(servers);
    } catch (error) {
      console.error('❌ Erro ao carregar servidores:', error);
      setCustomServers([]);
    }
  };

  /**
   * ➕ Callback quando servidor é adicionado
   */
  const handleServerAdded = (newServer) => {
    setCustomServers(prev => [...prev, newServer]);
  };

  /**
   * 🗑️ Remover servidor customizado
   */
  const removeCustomServer = (serverId) => {
    if (confirm('Tem certeza que deseja remover este servidor?')) {
      const updatedServers = customServers.filter(s => s.id !== serverId);
      setCustomServers(updatedServers);
      localStorage.setItem('firebaseServers', JSON.stringify(updatedServers));
    }
  };

  /**
   * 🔄 Ativar/Desativar servidor customizado
   */
  const toggleServerStatus = (serverId) => {
    const updatedServers = customServers.map(server => {
      if (server.id === serverId) {
        const newStatus = server.status === 'active' ? 'inactive' : 'active';
        toast.info(`🔄 Servidor ${server.name} ${newStatus === 'active' ? 'ativado' : 'desativado'}`, {
          position: 'top-right',
          autoClose: 2000
        });
        return { ...server, status: newStatus, lastStatusChange: new Date().toISOString() };
      }
      return server;
    });
    setCustomServers(updatedServers);
    localStorage.setItem('firebaseServers', JSON.stringify(updatedServers));
  };

  /**
   * 🔄 Carregar Configurações
   */
  useEffect(() => {
    const saved = localStorage.getItem('backupSettings');
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
      }
    }
  }, []);

  /**
   * 🗂️ Carregar coleções na inicialização
   */
  useEffect(() => {
    // Carregar coleções após 2 segundos para não impactar o carregamento inicial
    const timer = setTimeout(() => {
      loadCollections();
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  /**
   * 🔧 Carregar servidores customizados na inicialização
   */
  useEffect(() => {
    loadCustomServers();
  }, []);

  /**
   * 📊 Atualizar métricas periodicamente
   */
  useEffect(() => {
    const interval = setInterval(() => {
      // Simular coleta de métricas (em produção, viria do Firebase Analytics)
      const info = getInfo();
      
      setMetrics(prev => ({
        primary: {
          ...prev.primary,
          lastOperation: info.activeDatabase === 'primary' ? new Date().toISOString() : prev.primary.lastOperation
        },
        backup: {
          ...prev.backup,
          lastOperation: info.activeDatabase === 'backup' ? new Date().toISOString() : prev.backup.lastOperation
        }
      }));
    }, 5000); // A cada 5 segundos

    return () => clearInterval(interval);
  }, [getInfo]);

  const formatDate = (date) => {
    if (!date) return 'Nunca';
    return new Date(date).toLocaleString('pt-BR');
  };

  const formatTime = (hours) => {
    if (hours < 0) return '0h 0m';
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
              <Activity className="w-8 h-8" />
              Monitoramento de Backup
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Sistema de rotação automática entre databases
            </p>
          </div>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            <Settings className="w-5 h-5" />
            Configurações
          </button>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Database Ativo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-6 rounded-xl shadow-lg ${
              activeDatabase === 'primary'
                ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                : 'bg-gradient-to-br from-blue-600 to-blue-700'
            } text-white`}
          >
            <Database className="w-8 h-8 mb-3" />
            <div className="text-sm opacity-90">Database Ativo</div>
            <div className="text-2xl font-bold mt-1">
              {activeDatabase === 'primary' ? 'Principal' : 'Backup'}
            </div>
          </motion.div>

          {/* Status de Rotação */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 rounded-xl shadow-lg bg-white dark:bg-gray-800"
          >
            <RefreshCw className={`w-8 h-8 mb-3 ${isRotating ? 'animate-spin text-blue-500' : 'text-gray-400'}`} />
            <div className="text-sm text-gray-600 dark:text-gray-400">Status</div>
            <div className="text-xl font-bold text-gray-800 dark:text-white mt-1">
              {isRotating ? 'Rotacionando' : isSyncing ? 'Sincronizando' : 'Ativo'}
            </div>
          </motion.div>

          {/* Próxima Rotação */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-xl shadow-lg bg-white dark:bg-gray-800"
          >
            <Clock className="w-8 h-8 mb-3 text-orange-500" />
            <div className="text-sm text-gray-600 dark:text-gray-400">Próxima Rotação</div>
            <div className="text-xl font-bold text-gray-800 dark:text-white mt-1">
              {formatTime(hoursUntilRotation)}
            </div>
          </motion.div>

          {/* Saúde do Sistema */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-6 rounded-xl shadow-lg bg-white dark:bg-gray-800"
          >
            {metrics.primary.healthy && metrics.backup.healthy ? (
              <CheckCircle className="w-8 h-8 mb-3 text-green-500" />
            ) : (
              <XCircle className="w-8 h-8 mb-3 text-red-500" />
            )}
            <div className="text-sm text-gray-600 dark:text-gray-400">Saúde</div>
            <div className="text-xl font-bold text-gray-800 dark:text-white mt-1">
              {metrics.primary.healthy && metrics.backup.healthy ? 'Saudável' : 'Alerta'}
            </div>
          </motion.div>
        </div>

        {/* Progress Bar (se sincronizando) */}
        <AnimatePresence>
          {(isRotating || isSyncing) && syncProgress && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
                  <span className="font-semibold text-gray-800 dark:text-white">
                    {isRotating ? 'Rotação em Andamento' : 'Sincronização em Andamento'}
                  </span>
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {syncProgress.current}/{syncProgress.total} ({syncProgress.percentage}%)
                </span>
              </div>

              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-2">
                <motion.div
                  className="bg-gradient-to-r from-blue-500 to-blue-700 h-3 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${syncProgress.percentage}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>

              <div className="text-sm text-gray-600 dark:text-gray-400">
                Sincronizando: {syncProgress.collection}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Databases Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Primary Database */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center">
                  <Database className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                    Firebase Principal
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">garden-c0b50</p>
                </div>
              </div>
              
              {activeDatabase === 'primary' && (
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                  Ativo
                </span>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Leituras</span>
                <span className="font-semibold text-gray-800 dark:text-white">
                  {metrics.primary.read.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Escritas</span>
                <span className="font-semibold text-gray-800 dark:text-white">
                  {metrics.primary.write.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Última Operação</span>
                <span className="font-semibold text-gray-800 dark:text-white text-sm">
                  {formatDate(metrics.primary.lastOperation)}
                </span>
              </div>

              <div className="flex items-center justify-between py-3">
                <span className="text-gray-600 dark:text-gray-400">Status</span>
                <span className={`flex items-center gap-2 font-semibold ${
                  metrics.primary.healthy ? 'text-green-600' : 'text-red-600'
                }`}>
                  {metrics.primary.healthy ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Saudável
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4" />
                      Erro
                    </>
                  )}
                </span>
              </div>
            </div>

            <button
              onClick={() => testDatabase(primaryDb, 'primary')}
              disabled={isTestingPrimary}
              className="w-full mt-6 flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isTestingPrimary ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Testando...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  Testar Conexão
                </>
              )}
            </button>
          </div>

          {/* Backup Database */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center">
                  <Database className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                    Firebase Backup
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">garden-backup</p>
                </div>
              </div>
              
              {activeDatabase === 'backup' && (
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                  Ativo
                </span>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Leituras</span>
                <span className="font-semibold text-gray-800 dark:text-white">
                  {metrics.backup.read.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Escritas</span>
                <span className="font-semibold text-gray-800 dark:text-white">
                  {metrics.backup.write.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Última Operação</span>
                <span className="font-semibold text-gray-800 dark:text-white text-sm">
                  {formatDate(metrics.backup.lastOperation)}
                </span>
              </div>

              <div className="flex items-center justify-between py-3">
                <span className="text-gray-600 dark:text-gray-400">Status</span>
                <span className={`flex items-center gap-2 font-semibold ${
                  metrics.backup.healthy ? 'text-green-600' : 'text-red-600'
                }`}>
                  {metrics.backup.healthy ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Saudável
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4" />
                      Erro
                    </>
                  )}
                </span>
              </div>
            </div>

            <button
              onClick={() => testDatabase(backupDb, 'backup')}
              disabled={isTestingBackup}
              className="w-full mt-6 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isTestingBackup ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Testando...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  Testar Conexão
                </>
              )}
            </button>
          </div>
        </div>

        {/* Test Results */}
        <AnimatePresence>
          {testResults && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Resultados do Teste - {testResults.database}
                </h3>
                <button
                  onClick={() => setTestResults(null)}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>

              {testResults.success ? (
                <>
                  <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="text-green-800 dark:text-green-300 font-semibold flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      {testResults.summary}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {testResults.tests.map((test, index) => (
                      <div
                        key={index}
                        className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-gray-800 dark:text-white">
                            {test.name}
                          </span>
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        </div>
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                          {test.time}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {test.details}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-800 dark:text-red-300 font-semibold flex items-center gap-2">
                    <XCircle className="w-5 h-5" />
                    {testResults.error}
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={forceRotation}
            disabled={isRotating || isSyncing}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-xl hover:from-blue-600 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
          >
            <RefreshCw className="w-5 h-5" />
            Forçar Rotação Agora
          </button>

          <button
            onClick={forceSync}
            disabled={isRotating || isSyncing}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-xl hover:from-green-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
          >
            <Database className="w-5 h-5" />
            Forçar Sincronização
          </button>

          <button
            onClick={() => {
              const info = getInfo();
              alert('Informações enviadas para o console (F12)');
            }}
            className="flex items-center justify-center gap-2 px-6 py-4 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-all shadow-lg hover:shadow-xl"
          >
            <TrendingUp className="w-5 h-5" />
            Ver Métricas Completas
          </button>
        </div>

        {/* Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 overflow-hidden"
            >
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                <Settings className="w-6 h-6" />
                Configurações do Sistema
              </h3>

              <div className="space-y-6">
                {/* Intervalo de Rotação */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Intervalo de Rotação (horas)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="168"
                    value={settings.rotationInterval}
                    onChange={(e) => setSettings({...settings, rotationInterval: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Atualmente: {settings.rotationInterval}h = {(settings.rotationInterval / 24).toFixed(1)} dia(s)
                  </p>
                </div>

                {/* Auto Rotação */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Rotação Automática
                    </label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Alternar databases automaticamente no intervalo definido
                    </p>
                  </div>
                  <button
                    onClick={() => setSettings({...settings, autoRotate: !settings.autoRotate})}
                    className={`relative w-14 h-7 rounded-full transition-colors ${
                      settings.autoRotate ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <motion.div
                      className="absolute top-1 left-1 w-5 h-5 bg-white rounded-full"
                      animate={{ x: settings.autoRotate ? 28 : 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </button>
                </div>

                {/* Auto Sync */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Sincronização ao Rotacionar
                    </label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Sincronizar dados automaticamente ao alternar databases
                    </p>
                  </div>
                  <button
                    onClick={() => setSettings({...settings, autoSync: !settings.autoSync})}
                    className={`relative w-14 h-7 rounded-full transition-colors ${
                      settings.autoSync ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <motion.div
                      className="absolute top-1 left-1 w-5 h-5 bg-white rounded-full"
                      animate={{ x: settings.autoSync ? 28 : 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </button>
                </div>

                {/* Notificações */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Notificações
                    </label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Mostrar notificações de rotação e sincronização
                    </p>
                  </div>
                  <button
                    onClick={() => setSettings({...settings, notificationsEnabled: !settings.notificationsEnabled})}
                    className={`relative w-14 h-7 rounded-full transition-colors ${
                      settings.notificationsEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <motion.div
                      className="absolute top-1 left-1 w-5 h-5 bg-white rounded-full"
                      animate={{ x: settings.notificationsEnabled ? 28 : 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </button>
                </div>

                {/* Save Button */}
                <button
                  onClick={saveSettings}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-lg hover:from-blue-600 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl"
                >
                  <Save className="w-5 h-5" />
                  Salvar Configurações
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* History */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
            <Clock className="w-6 h-6" />
            Histórico de Rotações (Últimas 10)
          </h3>

          {rotationHistory.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              Nenhuma rotação registrada ainda
            </p>
          ) : (
            <div className="space-y-3">
              {rotationHistory.slice(-10).reverse().map((entry, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <RefreshCw className="w-5 h-5 text-blue-500" />
                    <div>
                      <div className="font-semibold text-gray-800 dark:text-white">
                        {entry.from} → {entry.to}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(entry.timestamp)}
                      </div>
                    </div>
                  </div>
                  
                  {entry.synced && entry.syncResult && (
                    <div className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      {entry.syncResult.totalSynced || 0} docs sincronizados
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Collections Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <FolderOpen className="w-6 h-6" />
                Coleções dos Bancos de Dados
              </h3>
              
              {collections && (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {collections.totals.databases} bancos • {collections.totals.collections} coleções • {collections.totals.documents.toLocaleString()} documentos
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={refreshCollections}
                disabled={collectionsLoading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${collectionsLoading ? 'animate-spin' : ''}`} />
                Atualizar
              </button>
              
              <button
                onClick={() => setShowCollections(!showCollections)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {showCollections ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showCollections ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          {collections && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Firebase Principal</div>
                <div className="text-2xl font-bold text-gray-800 dark:text-white">
                  {collections.primary.totalCollections}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {collections.primary.totalDocuments.toLocaleString()} docs
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Firebase Backup</div>
                <div className="text-2xl font-bold text-gray-800 dark:text-white">
                  {collections.backup.totalCollections}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {collections.backup.totalDocuments.toLocaleString()} docs
                </div>
              </div>

              {collectionsComparison && (
                <>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Sincronizadas</div>
                    <div className="text-2xl font-bold text-gray-800 dark:text-white">
                      {collectionsComparison.summary.synced}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {collectionsComparison.summary.syncPercentage}% do total
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-lg p-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Dessincronizadas</div>
                    <div className="text-2xl font-bold text-gray-800 dark:text-white">
                      {collectionsComparison.summary.outOfSync}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Precisam sync
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Collections Loading */}
          {collectionsLoading && (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
              <p className="text-gray-500 dark:text-gray-400">Carregando coleções...</p>
            </div>
          )}

          {/* Collections Content */}
          <AnimatePresence>
            {showCollections && collections && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                {/* Filters and View Toggle */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <select
                      value={collectionsFilter}
                      onChange={(e) => setCollectionsFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-sm"
                    >
                      <option value="all">Todas as Coleções</option>
                      <option value="primary">Apenas Principal</option>
                      <option value="backup">Apenas Backup</option>
                      <option value="synced">Sincronizadas</option>
                      <option value="out-of-sync">Dessincronizadas</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCollectionsView('grid')}
                      className={`p-2 rounded-lg transition-colors ${
                        collectionsView === 'grid'
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      <Grid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setCollectionsView('list')}
                      className={`p-2 rounded-lg transition-colors ${
                        collectionsView === 'list'
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Collections Grid/List */}
                {collectionsView === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {getFilteredCollections().map((collection, index) => (
                      <motion.div
                        key={`${collection.database}-${collection.name}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-500" />
                            <h4 className="font-semibold text-gray-800 dark:text-white">
                              {collection.name}
                            </h4>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            collection.database === 'primary'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                              : 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                          }`}>
                            {collection.database === 'primary' ? 'Principal' : 'Backup'}
                          </span>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Documentos:</span>
                            <span className="font-medium text-gray-800 dark:text-white">
                              {collection.documentCount?.toLocaleString() || 0}
                            </span>
                          </div>
                          
                          {collection.lastUpdated && (
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Atualizada:</span>
                              <span className="font-medium text-gray-800 dark:text-white text-xs">
                                {formatDate(collection.lastUpdated)}
                              </span>
                            </div>
                          )}

                          {collection.error && (
                            <div className="text-red-500 text-xs mt-2">
                              Erro: {collection.error}
                            </div>
                          )}
                        </div>

                        {/* Botão Ver Detalhes */}
                        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                          <button
                            onClick={() => openDocumentViewer(collection, collection.database)}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-medium"
                          >
                            <Eye className="w-4 h-4" />
                            Ver Detalhes
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {getFilteredCollections().map((collection, index) => (
                      <motion.div
                        key={`${collection.database}-${collection.name}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-4 h-4 text-blue-500" />
                          <span className="font-medium text-gray-800 dark:text-white">
                            {collection.name}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            collection.database === 'primary'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                              : 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                          }`}>
                            {collection.database === 'primary' ? 'Principal' : 'Backup'}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-gray-600 dark:text-gray-400">
                            {collection.documentCount?.toLocaleString() || 0} docs
                          </span>
                          {collection.lastUpdated && (
                            <span className="text-gray-500 dark:text-gray-400 text-xs">
                              {formatDate(collection.lastUpdated)}
                            </span>
                          )}
                          <button
                            onClick={() => openDocumentViewer(collection, collection.database)}
                            className="flex items-center gap-2 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm"
                          >
                            <Eye className="w-4 h-4" />
                            Ver Detalhes
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {getFilteredCollections().length === 0 && (
                  <div className="text-center py-8">
                    <FolderOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500 dark:text-gray-400">
                      Nenhuma coleção encontrada com o filtro selecionado
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {!collections && !collectionsLoading && (
            <div className="text-center py-8">
              <button
                onClick={loadCollections}
                className="flex items-center gap-2 mx-auto px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                <Search className="w-5 h-5" />
                Carregar Coleções
              </button>
            </div>
          )}
        </div>

        {/* Servers Management Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <Server className="w-6 h-6" />
                Gerenciamento de Servidores
              </h3>
              
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {2 + customServers.length} servidores conectados
              </div>
            </div>

            <button
              onClick={() => setShowAddServerModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-lg hover:shadow-xl"
            >
              <Plus className="w-4 h-4" />
              Adicionar Servidor
            </button>
          </div>

          {/* Default Servers */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Servidores Padrão
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Primary Firebase */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-blue-500" />
                    <h5 className="font-semibold text-gray-800 dark:text-white">
                      Firebase Principal
                    </h5>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    activeDatabase === 'primary'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300'
                  }`}>
                    {activeDatabase === 'primary' ? 'Ativo' : 'Inativo'}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Project ID:</span>
                    <span className="font-medium text-gray-800 dark:text-white">garden-c0b50</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Status:</span>
                    <span className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="w-3 h-3" />
                      Conectado
                    </span>
                  </div>
                  {collections && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Coleções:</span>
                      <span className="font-medium text-gray-800 dark:text-white">
                        {collections.primary.totalCollections}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Backup Firebase */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-purple-500" />
                    <h5 className="font-semibold text-gray-800 dark:text-white">
                      Firebase Backup
                    </h5>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    activeDatabase === 'backup'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300'
                  }`}>
                    {activeDatabase === 'backup' ? 'Ativo' : 'Inativo'}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Project ID:</span>
                    <span className="font-medium text-gray-800 dark:text-white">garden-backup</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Status:</span>
                    <span className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="w-3 h-3" />
                      Conectado
                    </span>
                  </div>
                  {collections && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Coleções:</span>
                      <span className="font-medium text-gray-800 dark:text-white">
                        {collections.backup.totalCollections}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Custom Servers */}
          {customServers.length > 0 && (
            <div className="space-y-4 mt-6">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                  <Cloud className="w-5 h-5" />
                  Servidores Customizados
                </h4>
                <div className="flex items-center gap-3 text-sm">
                  <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                    <CheckCircle className="w-4 h-4" />
                    {customServers.filter(s => s.status === 'active').length} Ativo{customServers.filter(s => s.status === 'active').length !== 1 ? 's' : ''}
                  </span>
                  <span className="text-gray-400">|</span>
                  <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                    <XCircle className="w-4 h-4" />
                    {customServers.filter(s => s.status !== 'active').length} Inativo{customServers.filter(s => s.status !== 'active').length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {customServers.map((server) => (
                  <motion.div
                    key={server.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-lg p-4 border transition-all ${
                      server.status === 'active' 
                        ? 'border-green-500 ring-2 ring-green-500/50 shadow-lg shadow-green-500/20' 
                        : 'border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Server className="w-5 h-5 text-gray-500" />
                        <h5 className="font-semibold text-gray-800 dark:text-white">
                          {server.name}
                        </h5>
                      </div>
                      <button
                        onClick={() => removeCustomServer(server.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Project ID:</span>
                        <span className="font-medium text-gray-800 dark:text-white">
                          {server.config.projectId}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Adicionado:</span>
                        <span className="font-medium text-gray-800 dark:text-white text-xs">
                          {formatDate(server.createdAt)}
                        </span>
                      </div>
                      {server.description && (
                        <div className="text-gray-600 dark:text-gray-400 text-xs mt-2">
                          {server.description}
                        </div>
                      )}
                      <div className="flex justify-between items-center mt-3">
                        <span className="text-gray-600 dark:text-gray-400">Status:</span>
                        <div className="flex items-center gap-2">
                          <span className={`flex items-center gap-1 text-sm font-medium ${
                            server.status === 'active' 
                              ? 'text-green-600 dark:text-green-400' 
                              : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            {server.status === 'active' ? (
                              <>
                                <CheckCircle className="w-3 h-3" />
                                Ativo
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3" />
                                Inativo
                              </>
                            )}
                          </span>
                          <button
                            onClick={() => toggleServerStatus(server.id)}
                            className={`relative w-12 h-6 rounded-full transition-colors ${
                              server.status === 'active' 
                                ? 'bg-green-500' 
                                : 'bg-gray-300 dark:bg-gray-600'
                            }`}
                            title={server.status === 'active' ? 'Desativar servidor' : 'Ativar servidor'}
                          >
                            <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                              server.status === 'active' ? 'translate-x-6' : 'translate-x-0'
                            }`} />
                          </button>
                        </div>
                      </div>
                      {server.lastStatusChange && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-right">
                          Alterado em: {formatDate(server.lastStatusChange)}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* No Custom Servers */}
          {customServers.length === 0 && (
            <div className="mt-6 text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
              <Server className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Nenhum servidor customizado adicionado
              </p>
              <button
                onClick={() => setShowAddServerModal(true)}
                className="flex items-center gap-2 mx-auto px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
                Adicionar Primeiro Servidor
              </button>
            </div>
          )}

          {/* 🗺️ Mapa Mundi de Servidores */}
          <div className="mt-8">
            <ServerWorldMap 
              servers={[
                // Servidores padrão
                {
                  id: 'primary',
                  name: 'Firebase Principal',
                  status: 'active',
                  config: {
                    projectId: 'garden-c0b50',
                    authDomain: 'garden-c0b50.firebaseapp.com',
                    storageBucket: 'garden-c0b50.appspot.com',
                    appId: '1:123456789:web:abc123'
                  },
                  description: 'Servidor principal de produção',
                  createdAt: new Date('2025-01-01').toISOString(),
                  lastTested: new Date().toISOString()
                },
                {
                  id: 'backup',
                  name: 'Firebase Backup',
                  status: 'active',
                  config: {
                    projectId: 'garden-backup',
                    authDomain: 'garden-backup.firebaseapp.com',
                    storageBucket: 'garden-backup.appspot.com',
                    appId: '1:987654321:web:def456'
                  },
                  description: 'Servidor de backup e redundância',
                  createdAt: new Date('2025-01-01').toISOString(),
                  lastTested: new Date().toISOString()
                },
                // Servidores customizados
                ...customServers
              ]}
            />
          </div>
        </div>

        {/* Add Server Modal */}
        <AddFirebaseServerModal
          isOpen={showAddServerModal}
          onClose={() => setShowAddServerModal(false)}
          onServerAdded={handleServerAdded}
        />

        {/* Document Viewer Modal */}
        <DocumentViewerModal
          isOpen={showDocumentViewer}
          onClose={closeDocumentViewer}
          collection={selectedCollectionForViewer}
          database={selectedDatabaseForViewer}
        />

      </div>
    </div>
  );
};

/**
 * 🛡️ ErrorBoundary para capturar erros do componente
 */
class BackupErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('❌ Erro no BackupMonitoringPage:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorDisplay 
          message="Erro ao carregar o sistema de backup"
          details={this.state.error?.message}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * 📦 Export principal com ErrorBoundary
 */
const BackupMonitoringPage = () => {
  return (
    <BackupErrorBoundary>
      <BackupMonitoringPageContent />
    </BackupErrorBoundary>
  );
};

export default BackupMonitoringPage;
