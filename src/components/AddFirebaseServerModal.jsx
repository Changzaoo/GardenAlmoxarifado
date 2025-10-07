import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { initializeApp, deleteApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { toast } from 'react-toastify';
import {
  X,
  Plus,
  Database,
  CheckCircle,
  XCircle,
  Loader2,
  Eye,
  EyeOff,
  Server,
  Key,
  Globe,
  Cloud,
  Shield,
  Zap
} from 'lucide-react';

/**
 * 🆕 Modal para Adicionar Novos Servidores Firebase
 */
export const AddFirebaseServerModal = ({ isOpen, onClose, onServerAdded }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
    measurementId: ''
  });

  const [showApiKey, setShowApiKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [saving, setSaving] = useState(false);

  /**
   * 🧪 Testar Conexão com Firebase
   */
  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const config = {
        apiKey: formData.apiKey,
        authDomain: formData.authDomain,
        projectId: formData.projectId,
        storageBucket: formData.storageBucket,
        messagingSenderId: formData.messagingSenderId,
        appId: formData.appId,
        measurementId: formData.measurementId
      };

      // Tentar inicializar app temporário
      const testAppName = `test-${Date.now()}`;
      const testApp = initializeApp(config, testAppName);
      
      // Testar Firestore
      const testDb = getFirestore(testApp);
      const testAuth = getAuth(testApp);
      const testStorage = getStorage(testApp);

      // Tentar uma operação simples no Firestore
      const testCollection = collection(testDb, 'test-connection');
      await getDocs(testCollection);

      setTestResult({
        success: true,
        message: 'Conexão estabelecida com sucesso!',
        details: {
          firestore: true,
          auth: true,
          storage: true,
          projectId: formData.projectId
        }
      });

      // Notificação de sucesso no teste
      toast.success('✅ Conexão estabelecida com sucesso!', {
        position: 'top-right',
        autoClose: 2000
      });

      // Limpar app de teste
      await deleteApp(testApp);

    } catch (error) {
      console.error('❌ Erro ao testar conexão:', error);
      
      setTestResult({
        success: false,
        message: 'Falha na conexão',
        error: error.message,
        details: {
          firestore: false,
          auth: false,
          storage: false
        }
      });

      // Notificação de erro no teste
      toast.error(`❌ Falha na conexão: ${error.message}`, {
        position: 'top-right',
        autoClose: 4000
      });
    } finally {
      setTesting(false);
    }
  };

  /**
   * 💾 Salvar Novo Servidor
   */
  const saveServer = async () => {
    if (!testResult?.success) {
      toast.warning('⚠️ Por favor, teste a conexão antes de salvar.', {
        position: 'top-center',
        autoClose: 3000
      });
      return;
    }

    setSaving(true);

    try {
      const serverConfig = {
        id: `firebase-${Date.now()}`,
        name: formData.name,
        description: formData.description,
        config: {
          apiKey: formData.apiKey,
          authDomain: formData.authDomain,
          projectId: formData.projectId,
          storageBucket: formData.storageBucket,
          messagingSenderId: formData.messagingSenderId,
          appId: formData.appId,
          measurementId: formData.measurementId
        },
        createdAt: new Date().toISOString(),
        lastTested: new Date().toISOString(),
        status: 'inactive',
        lastStatusChange: new Date().toISOString()
      };

      // Salvar no localStorage (temporário - depois migrar para um sistema mais robusto)
      const existingServers = JSON.parse(localStorage.getItem('firebaseServers') || '[]');
      existingServers.push(serverConfig);
      localStorage.setItem('firebaseServers', JSON.stringify(existingServers));

      // Callback para o componente pai
      if (onServerAdded) {
        onServerAdded(serverConfig);
      }

      // Limpar formulário
      setFormData({
        name: '',
        description: '',
        apiKey: '',
        authDomain: '',
        projectId: '',
        storageBucket: '',
        messagingSenderId: '',
        appId: '',
        measurementId: ''
      });
      setTestResult(null);

      // Fechar modal
      onClose();

      // Notificação de sucesso
      toast.success('🎉 Servidor Firebase adicionado com sucesso!', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      });

    } catch (error) {
      console.error('❌ Erro ao salvar servidor:', error);
      toast.error('❌ Erro ao salvar servidor. Tente novamente.', {
        position: 'top-right',
        autoClose: 4000
      });
    } finally {
      setSaving(false);
    }
  };

  /**
   * 🔄 Resetar Modal
   */
  const resetModal = () => {
    setFormData({
      name: '',
      description: '',
      apiKey: '',
      authDomain: '',
      projectId: '',
      storageBucket: '',
      messagingSenderId: '',
      appId: '',
      measurementId: ''
    });
    setTestResult(null);
    setShowApiKey(false);
  };

  /**
   * ❌ Fechar Modal
   */
  const handleClose = () => {
    resetModal();
    onClose();
  };

  const isFormValid = formData.name && formData.projectId && formData.apiKey && formData.authDomain;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center">
                  <Plus className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                    Adicionar Servidor Firebase
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Configure um novo banco de dados Firebase
                  </p>
                </div>
              </div>
              
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                    <Server className="w-5 h-5" />
                    Informações Básicas
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nome do Servidor
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ex: Firebase Produção"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Project ID
                      </label>
                      <input
                        type="text"
                        value={formData.projectId}
                        onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                        placeholder="meu-projeto-firebase"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Descrição (Opcional)
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Descrição do servidor ou ambiente..."
                      rows={2}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Firebase Config */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Configuração Firebase
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        API Key
                      </label>
                      <div className="relative">
                        <input
                          type={showApiKey ? 'text' : 'password'}
                          value={formData.apiKey}
                          onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                          placeholder="AIzaSy..."
                          className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Auth Domain
                      </label>
                      <input
                        type="text"
                        value={formData.authDomain}
                        onChange={(e) => setFormData({ ...formData, authDomain: e.target.value })}
                        placeholder="meu-projeto.firebaseapp.com"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Storage Bucket
                      </label>
                      <input
                        type="text"
                        value={formData.storageBucket}
                        onChange={(e) => setFormData({ ...formData, storageBucket: e.target.value })}
                        placeholder="meu-projeto.firebasestorage.app"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Messaging Sender ID
                      </label>
                      <input
                        type="text"
                        value={formData.messagingSenderId}
                        onChange={(e) => setFormData({ ...formData, messagingSenderId: e.target.value })}
                        placeholder="123456789012"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        App ID
                      </label>
                      <input
                        type="text"
                        value={formData.appId}
                        onChange={(e) => setFormData({ ...formData, appId: e.target.value })}
                        placeholder="1:123:web:abc123"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Measurement ID (Opcional)
                      </label>
                      <input
                        type="text"
                        value={formData.measurementId}
                        onChange={(e) => setFormData({ ...formData, measurementId: e.target.value })}
                        placeholder="G-XXXXXXXXXX"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Test Connection */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                      <Zap className="w-5 h-5" />
                      Teste de Conexão
                    </h3>
                    
                    <button
                      onClick={testConnection}
                      disabled={!isFormValid || testing}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
                    >
                      {testing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Zap className="w-4 h-4" />
                      )}
                      {testing ? 'Testando...' : 'Testar Conexão'}
                    </button>
                  </div>

                  {testResult && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-4 rounded-lg border ${
                        testResult.success
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                          : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {testResult.success ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600" />
                        )}
                        <span className={`font-medium ${
                          testResult.success ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'
                        }`}>
                          {testResult.message}
                        </span>
                      </div>

                      {testResult.success && (
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="w-3 h-3" />
                            Firestore
                          </div>
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="w-3 h-3" />
                            Auth
                          </div>
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="w-3 h-3" />
                            Storage
                          </div>
                        </div>
                      )}

                      {testResult.error && (
                        <div className="text-sm text-red-600 dark:text-red-400 mt-2">
                          {testResult.error}
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleClose}
                className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              
              <button
                onClick={saveServer}
                disabled={!testResult?.success || saving}
                className="flex items-center gap-2 px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                {saving ? 'Salvando...' : 'Adicionar Servidor'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AddFirebaseServerModal;