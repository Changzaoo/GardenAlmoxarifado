// 🔄 Sistema de Sincronização e Backup entre Bancos de Dados
// Gerencia cópia de usuários entre garden-c0b50, workflowbr1 e garden-backup

import React, { useState, useEffect } from 'react';
import { 
  Database, 
  RefreshCw, 
  Copy, 
  CheckCircle, 
  AlertTriangle, 
  Users, 
  Server,
  ArrowRight,
  Settings,
  Shield,
  Lock,
  Eye,
  EyeOff,
  Edit3,
  Save,
  X,
  Cloud,
  HardDrive,
  Loader
} from 'lucide-react';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  updateDoc,
  deleteDoc,
  writeBatch 
} from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { dbWorkflowBR1 } from '../../config/firebaseWorkflowBR1';
import { 
  primaryDb as dbBackup, 
  backupDb, 
  activeDb, 
  switchDatabase 
} from '../../config/firebaseDual';

// ====================================
// CONFIGURAÇÃO DOS BANCOS DE DADOS
// ====================================

const DATABASES = {
  garden: {
    id: 'garden-c0b50',
    name: 'Garden C0B50',
    db: db,
    isPrimary: true,
    color: 'emerald',
    icon: '🌱',
    description: 'Banco de dados principal'
  },
  workflow: {
    id: 'workflowbr1',
    name: 'WorkflowBR1',
    db: dbWorkflowBR1,
    isPrimary: false,
    color: 'blue',
    icon: '🔄',
    description: 'Banco de dados secundário'
  },
  backup: {
    id: 'garden-backup',
    name: 'Garden Backup',
    db: dbBackup || backupDb,
    isPrimary: false,
    color: 'purple',
    icon: '☁️',
    description: 'Banco de dados de backup'
  }
};

// ====================================
// COMPONENTE PRINCIPAL
// ====================================

const DatabaseSyncManager = () => {
  const [databases, setDatabases] = useState(DATABASES);
  const [userCounts, setUserCounts] = useState({});
  const [syncStatus, setSyncStatus] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedSource, setSelectedSource] = useState('garden');
  const [selectedTarget, setSelectedTarget] = useState('workflow');
  const [syncHistory, setSyncHistory] = useState([]);
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [passwordFieldName, setPasswordFieldName] = useState('senha');
  const [editingPasswordField, setEditingPasswordField] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [users, setUsers] = useState({});
  const [showUserDetails, setShowUserDetails] = useState(false);

  // ====================================
  // CARREGAR CONTAGEM DE USUÁRIOS
  // ====================================

  const loadUserCounts = async () => {
    setLoading(true);
    const counts = {};
    const usersData = {};

    for (const [key, dbConfig] of Object.entries(databases)) {
      try {
        const usersRef = collection(dbConfig.db, 'usuarios');
        const snapshot = await getDocs(usersRef);
        counts[key] = snapshot.size;
        
        // Armazenar usuários para exibição
        usersData[key] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } catch (error) {
        console.error(`❌ Erro ao carregar usuários de ${dbConfig.name}:`, error);
        counts[key] = 0;
        usersData[key] = [];
      }
    }

    setUserCounts(counts);
    setUsers(usersData);
    setLoading(false);
  };

  useEffect(() => {
    loadUserCounts();
  }, []);

  // ====================================
  // SINCRONIZAR USUÁRIOS ENTRE BANCOS
  // ====================================

  const syncUsers = async (sourceKey, targetKey) => {
    const source = databases[sourceKey];
    const target = databases[targetKey];

    if (!source || !target) {
      alert('❌ Bancos de dados não encontrados!');
      return;
    }

    setLoading(true);
    setSyncStatus({ 
      status: 'syncing', 
      source: source.name, 
      target: target.name 
    });

    try {
      // Buscar usuários do banco de origem
      const sourceRef = collection(source.db, 'usuarios');
      const sourceSnapshot = await getDocs(sourceRef);
      
      if (sourceSnapshot.empty) {
        setSyncStatus({ 
          status: 'error', 
          message: `Nenhum usuário encontrado em ${source.name}` 
        });
        setLoading(false);
        return;
      }

      const totalUsers = sourceSnapshot.size;
      let syncedCount = 0;
      let errorCount = 0;
      const errors = [];

      // Copiar cada usuário para o banco de destino
      for (const userDoc of sourceSnapshot.docs) {
        try {
          const userData = userDoc.data();
          const targetRef = doc(target.db, 'usuarios', userDoc.id);
          
          // Garantir que o campo de senha existe
          if (!userData[passwordFieldName]) {
            userData[passwordFieldName] = userData.senha || '';
          }

          await setDoc(targetRef, userData, { merge: true });
          syncedCount++;
        } catch (error) {
          console.error(`❌ Erro ao copiar usuário ${userDoc.id}:`, error);
          errorCount++;
          errors.push({ id: userDoc.id, error: error.message });
        }
      }

      // Registrar histórico
      const historyEntry = {
        timestamp: new Date().toISOString(),
        source: source.name,
        target: target.name,
        totalUsers,
        syncedCount,
        errorCount,
        success: errorCount === 0
      };
      setSyncHistory(prev => [historyEntry, ...prev].slice(0, 10));

      // Atualizar status
      setSyncStatus({ 
        status: 'success', 
        message: `✅ ${syncedCount} usuários sincronizados com sucesso!`,
        errors: errorCount > 0 ? errors : null
      });

      // Recarregar contagens
      await loadUserCounts();

    } catch (error) {
      console.error('❌ Erro na sincronização:', error);
      setSyncStatus({ 
        status: 'error', 
        message: `Erro: ${error.message}` 
      });
    } finally {
      setLoading(false);
    }
  };

  // ====================================
  // ALTERAR NOME DO CAMPO DE SENHA
  // ====================================

  const updatePasswordFieldName = async (dbKey, newFieldName) => {
    const dbConfig = databases[dbKey];
    
    if (!dbConfig) {
      alert('❌ Banco de dados não encontrado!');
      return;
    }

    setLoading(true);

    try {
      const usersRef = collection(dbConfig.db, 'usuarios');
      const snapshot = await getDocs(usersRef);
      
      const batch = writeBatch(dbConfig.db);
      let updateCount = 0;

      for (const userDoc of snapshot.docs) {
        const userData = userDoc.data();
        const oldPassword = userData[passwordFieldName] || userData.senha || '';
        
        // Criar novo campo e remover antigo se diferente
        const updates = {
          [newFieldName]: oldPassword
        };

        // Se o campo antigo for diferente, marcá-lo como undefined para remoção
        if (passwordFieldName !== newFieldName && userData[passwordFieldName]) {
          updates[passwordFieldName] = null;
        }

        const userRef = doc(dbConfig.db, 'usuarios', userDoc.id);
        batch.update(userRef, updates);
        updateCount++;
      }

      await batch.commit();

      alert(`✅ Campo de senha atualizado para "${newFieldName}" em ${updateCount} usuários!`);
      setPasswordFieldName(newFieldName);
      setEditingPasswordField(false);
      
      // Salvar preferência
      localStorage.setItem('password_field_name', newFieldName);

    } catch (error) {
      console.error('❌ Erro ao atualizar campo de senha:', error);
      alert(`❌ Erro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ====================================
  // CRIAR CAMPO DE SENHA SE NÃO EXISTIR
  // ====================================

  const ensurePasswordField = async (dbKey) => {
    const dbConfig = databases[dbKey];
    
    if (!dbConfig) {
      alert('❌ Banco de dados não encontrado!');
      return;
    }

    setLoading(true);

    try {
      const usersRef = collection(dbConfig.db, 'usuarios');
      const snapshot = await getDocs(usersRef);
      
      const batch = writeBatch(dbConfig.db);
      let createdCount = 0;

      for (const userDoc of snapshot.docs) {
        const userData = userDoc.data();
        
        // Se não tem campo de senha, criar com valor padrão
        if (!userData[passwordFieldName]) {
          const userRef = doc(dbConfig.db, 'usuarios', userDoc.id);
          batch.update(userRef, {
            [passwordFieldName]: userData.senha || userData.password || '123456',
            senhaVersion: userData.senhaVersion || 1
          });
          createdCount++;
        }
      }

      if (createdCount > 0) {
        await batch.commit();
        alert(`✅ Campo "${passwordFieldName}" criado em ${createdCount} usuários!`);
        await loadUserCounts();
      } else {
        alert(`ℹ️ Todos os usuários já possuem o campo "${passwordFieldName}"`);
      }

    } catch (error) {
      console.error('❌ Erro ao criar campo de senha:', error);
      alert(`❌ Erro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ====================================
  // BACKUP COMPLETO
  // ====================================

  const performFullBackup = async () => {
    if (!confirm('🔄 Deseja fazer backup completo de garden-c0b50 para os outros 2 bancos?')) {
      return;
    }

    setLoading(true);
    const results = [];

    // Backup para WorkflowBR1
    await syncUsers('garden', 'workflow');
    results.push('workflow');

    // Pequeno delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Backup para Garden Backup
    await syncUsers('garden', 'backup');
    results.push('backup');

    alert(`✅ Backup completo realizado!\nDestinos: ${results.join(', ')}`);
    setLoading(false);
  };

  // ====================================
  // RENDERIZAÇÃO
  // ====================================

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
            <Database className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
              Sincronização de Bancos de Dados
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Gerencie backups e sincronize usuários entre os 3 servidores
            </p>
          </div>
        </div>
      </div>

      {/* Status Cards dos Bancos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {Object.entries(databases).map(([key, dbConfig]) => (
          <div
            key={key}
            className={`bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border-2 ${
              dbConfig.isPrimary 
                ? 'border-emerald-500' 
                : 'border-slate-200 dark:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-3xl">{dbConfig.icon}</span>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white">
                    {dbConfig.name}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {dbConfig.description}
                  </p>
                </div>
              </div>
              {dbConfig.isPrimary && (
                <span className="px-2 py-1 bg-emerald-500 text-white text-xs font-bold rounded">
                  PRINCIPAL
                </span>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                <span className="text-2xl font-bold text-slate-800 dark:text-white">
                  {loading ? '...' : userCounts[key] || 0}
                </span>
              </div>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                usuários
              </span>
            </div>

            {/* Botões de ação */}
            <div className="mt-4 space-y-2">
              <button
                onClick={() => ensurePasswordField(key)}
                disabled={loading}
                className="w-full px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                Criar Campo Senha
              </button>
              
              <button
                onClick={() => {
                  const newField = prompt('Digite o novo nome do campo de senha:', passwordFieldName);
                  if (newField && newField.trim()) {
                    updatePasswordFieldName(key, newField.trim());
                  }
                }}
                disabled={loading}
                className="w-full px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                Alterar Campo Senha
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Configuração do Campo de Senha */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">
              Configuração do Campo de Senha
            </h3>
          </div>
          
          <button
            onClick={() => setEditingPasswordField(!editingPasswordField)}
            className="px-3 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
          >
            {editingPasswordField ? 'Cancelar' : 'Editar'}
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Nome do Campo:
            </label>
            {editingPasswordField ? (
              <input
                type="text"
                value={passwordFieldName}
                onChange={(e) => setPasswordFieldName(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
                placeholder="Ex: senha, password, pwd"
              />
            ) : (
              <div className="px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-800 dark:text-white font-mono">
                {passwordFieldName}
              </div>
            )}
          </div>

          {editingPasswordField && (
            <button
              onClick={() => {
                localStorage.setItem('password_field_name', passwordFieldName);
                setEditingPasswordField(false);
                alert('✅ Nome do campo salvo localmente!');
              }}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Salvar
            </button>
          )}
        </div>

        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          💡 Este nome será usado ao criar/atualizar campos de senha nos bancos de dados
        </p>
      </div>

      {/* Painel de Sincronização */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-6">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-blue-600" />
          Sincronização Manual
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Origem */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Origem:
            </label>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
            >
              {Object.entries(databases).map(([key, db]) => (
                <option key={key} value={key}>
                  {db.icon} {db.name}
                </option>
              ))}
            </select>
          </div>

          {/* Seta */}
          <div className="flex items-end justify-center pb-2">
            <ArrowRight className="w-8 h-8 text-blue-500" />
          </div>

          {/* Destino */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Destino:
            </label>
            <select
              value={selectedTarget}
              onChange={(e) => setSelectedTarget(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white"
            >
              {Object.entries(databases).map(([key, db]) => (
                <option key={key} value={key} disabled={key === selectedSource}>
                  {db.icon} {db.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => syncUsers(selectedSource, selectedTarget)}
            disabled={loading || selectedSource === selectedTarget}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Sincronizando...
              </>
            ) : (
              <>
                <Copy className="w-5 h-5" />
                Sincronizar Usuários
              </>
            )}
          </button>

          <button
            onClick={performFullBackup}
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-lg font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Cloud className="w-5 h-5" />
            Backup Completo
          </button>

          <button
            onClick={loadUserCounts}
            disabled={loading}
            className="px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-bold transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Status da Sincronização */}
        {syncStatus.status && (
          <div className={`mt-4 p-4 rounded-lg ${
            syncStatus.status === 'success' 
              ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' 
              : syncStatus.status === 'error'
              ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
              : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
          }`}>
            <div className="flex items-center gap-2">
              {syncStatus.status === 'success' && <CheckCircle className="w-5 h-5" />}
              {syncStatus.status === 'error' && <AlertTriangle className="w-5 h-5" />}
              {syncStatus.status === 'syncing' && <Loader className="w-5 h-5 animate-spin" />}
              <span className="font-medium">{syncStatus.message}</span>
            </div>
          </div>
        )}
      </div>

      {/* Histórico de Sincronizações */}
      {syncHistory.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-slate-600" />
            Histórico de Sincronizações
          </h3>

          <div className="space-y-2">
            {syncHistory.map((entry, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border-l-4 ${
                  entry.success 
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-500' 
                    : 'bg-red-50 dark:bg-red-900/20 border-red-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {entry.success ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                    )}
                    <span className="text-sm font-medium text-slate-800 dark:text-white">
                      {entry.source} → {entry.target}
                    </span>
                  </div>
                  <span className="text-xs text-slate-600 dark:text-slate-400">
                    {new Date(entry.timestamp).toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                  {entry.syncedCount}/{entry.totalUsers} usuários sincronizados
                  {entry.errorCount > 0 && ` · ${entry.errorCount} erros`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DatabaseSyncManager;
