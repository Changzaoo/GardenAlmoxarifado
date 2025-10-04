import React, { useState, useEffect } from 'react';
import { useDatabaseRotationContext } from '../contexts/DatabaseRotationContext';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { primaryDb, backupDb } from '../config/firebaseDual';
import { motion, AnimatePresence } from 'framer-motion';
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
  Pause
} from 'lucide-react';

/**
 * 🎛️ Página de Monitoramento Completo do Backup
 */
export const BackupMonitoringPage = () => {
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
  } = useDatabaseRotationContext();

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
        message: 'Test write operation'
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
      results.success = false;
      results.error = error.message;
      results.tests.push({
        name: 'Erro',
        status: 'error',
        details: error.message
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
                : 'bg-gradient-to-br from-purple-500 to-purple-600'
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
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full"
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
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center">
                  <Database className="w-6 h-6 text-purple-600 dark:text-purple-400" />
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
              className="w-full mt-6 flex items-center justify-center gap-2 px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
            className="flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
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
              console.log('📊 Info do Sistema:', info);
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
                      settings.notificationsEnabled ? 'bg-purple-500' : 'bg-gray-300 dark:bg-gray-600'
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
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
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

      </div>
    </div>
  );
};

export default BackupMonitoringPage;
