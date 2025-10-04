import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { decrypt } from '../utils/cryptoUtils';

// ====================================
// CONFIGURAÇÕES DOS BANCOS DE DADOS
// ====================================

/**
 * Lista de todos os bancos de dados Firebase configurados
 * Cada banco tem um ID único, nome, configuração e status
 */
const firebaseDatabases = [
  {
    id: 'primary',
    name: 'Garden Principal',
    description: 'Banco de dados principal - garden-c0b50',
    config: {
      _encrypted: true,
      _k: "WlpoYVN5QW5MbXRsaE9VVUFidFJjT2c2NGRYZENMYmx0dl9pRTRF",
      _d: "Z2FyZGVuLWMwYjUwLmZpcmViYXNlYXBwLmNvbQ==",
      _p: "Z2FyZGVuLWMwYjUw",
      _s: "Z2FyZGVuLWMwYjUwLmZpcmViYXNlc3RvcmFnZS5hcHA=",
      _m: "NDY3MzQ0MzU0OTk3",
      _a: "MTo0NjczNDQzNTQ5OTc6d2ViOjNjMzM5N2UwMTc2MDYwYmIwYzk4ZmM=",
      "_t": "Ry03TE1MOTNRRFRGCg=="
    },
    priority: 1, // Banco prioritário
    enabled: true
  },
  {
    id: 'backup',
    name: 'Garden Backup',
    description: 'Banco de dados secundário - garden-backup',
    config: {
      apiKey: "AIzaSyCPTELyhRUn4qByU68pOZsZUrkR1ZeyROo",
      authDomain: "garden-backup.firebaseapp.com",
      projectId: "garden-backup",
      storageBucket: "garden-backup.firebasestorage.app",
      messagingSenderId: "842077125369",
      appId: "1:842077125369:web:ea3bafe1cedb92cd350028",
      measurementId: "G-WJHEL52L9L"
    },
    priority: 2,
    enabled: true
  },
  {
    id: 'workflowbr1',
    name: 'Workflow BR1',
    description: 'Banco de dados adicional - workflowbr1',
    config: {
      apiKey: "AIzaSyC6IoQBbNZ1QCMNZAM79KRUJ-TRvWlnliY",
      authDomain: "workflowbr1.firebaseapp.com",
      projectId: "workflowbr1",
      storageBucket: "workflowbr1.firebasestorage.app",
      messagingSenderId: "207274549565",
      appId: "1:207274549565:web:4d7755e8424b74c6712554",
      measurementId: "G-TYRLWERZMS"
    },
    priority: 3,
    enabled: true
  }
];

// ====================================
// FUNÇÕES DE CONFIGURAÇÃO
// ====================================

/**
 * Decodifica configuração encriptada
 */
const decodeConfig = (config) => {
  if (config._encrypted) {
    return {
      apiKey: process.env.REACT_APP_FIREBASE_API_KEY || decrypt(config._k),
      authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || decrypt(config._d),
      projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || decrypt(config._p),
      storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || decrypt(config._s),
      messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || decrypt(config._m),
      appId: process.env.REACT_APP_FIREBASE_APP_ID || decrypt(config._a),
      measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || decrypt(config._t)
    };
  }
  return config;
};

/**
 * Adiciona um novo banco de dados ao sistema
 */
export const addFirebaseDatabase = (dbConfig) => {
  const newDb = {
    id: dbConfig.id || `db_${Date.now()}`,
    name: dbConfig.name || 'Novo Banco',
    description: dbConfig.description || 'Banco de dados personalizado',
    config: dbConfig.config,
    priority: dbConfig.priority || firebaseDatabases.length + 1,
    enabled: dbConfig.enabled !== false
  };

  // Adicionar à lista
  firebaseDatabases.push(newDb);

  // Salvar no localStorage
  saveDatabasesToStorage();

  // Inicializar novo banco
  if (newDb.enabled) {
    initializeDatabase(newDb);
  }

  console.log(`✅ Banco de dados "${newDb.name}" adicionado com sucesso!`);
  return newDb;
};

/**
 * Salva configurações no localStorage
 */
const saveDatabasesToStorage = () => {
  try {
    const customDbs = firebaseDatabases.filter(db => 
      db.id !== 'primary' && db.id !== 'backup' && db.id !== 'workflowbr1'
    );
    localStorage.setItem('customFirebaseDatabases', JSON.stringify(customDbs));
  } catch (error) {
    console.error('Erro ao salvar bancos no localStorage:', error);
  }
};

/**
 * Carrega bancos customizados do localStorage
 */
const loadCustomDatabases = () => {
  try {
    const saved = localStorage.getItem('customFirebaseDatabases');
    if (saved) {
      const customDbs = JSON.parse(saved);
      customDbs.forEach(db => {
        if (!firebaseDatabases.find(existing => existing.id === db.id)) {
          firebaseDatabases.push(db);
        }
      });
      console.log(`📦 ${customDbs.length} banco(s) customizado(s) carregado(s)`);
    }
  } catch (error) {
    console.error('Erro ao carregar bancos customizados:', error);
  }
};

// ====================================
// INICIALIZAÇÃO DOS APPS
// ====================================

const initializedApps = new Map();
const initializedDbs = new Map();
const initializedAuths = new Map();
const initializedStorages = new Map();

/**
 * Inicializa um banco de dados específico
 */
const initializeDatabase = (database) => {
  try {
    console.log(`🔄 Inicializando "${database.name}" (${database.id})...`);
    
    const config = decodeConfig(database.config);
    
    if (!config || !config.apiKey || !config.projectId) {
      throw new Error(`Configuração inválida para ${database.name}`);
    }
    
    // Inicializar app
    const app = initializeApp(config, database.id);
    initializedApps.set(database.id, app);

    // Inicializar serviços
    const db = getFirestore(app);
    const auth = getAuth(app);
    const storage = getStorage(app);

    initializedDbs.set(database.id, db);
    initializedAuths.set(database.id, auth);
    initializedStorages.set(database.id, storage);

    // Habilitar persistência (apenas no banco principal)
    if (database.id === 'primary') {
      enableIndexedDbPersistence(db).catch((err) => {
        if (err.code === 'failed-precondition') {
          console.warn('⚠️ Múltiplas abas abertas, persistência habilitada em apenas uma.');
        } else if (err.code === 'unimplemented') {
          console.warn('⚠️ Navegador não suporta persistência offline.');
        }
      });
    }

    console.log(`✅ Firebase "${database.name}" inicializado com sucesso`);

    return { app, db, auth, storage };
  } catch (error) {
    console.error(`❌ ERRO CRÍTICO ao inicializar "${database.name}":`, error);
    console.error('Stack trace:', error.stack);
    // Não lança o erro para não quebrar outros bancos
    return null;
  }
};

/**
 * Inicializa todos os bancos habilitados
 */
const initializeAllDatabases = () => {
  try {
    console.log('🚀 Iniciando sistema multi-database...');
    
    // Carregar bancos customizados
    loadCustomDatabases();

    // Inicializar todos os bancos habilitados
    const enabledDbs = firebaseDatabases.filter(db => db.enabled);
    
    console.log(`🔥 Inicializando ${enabledDbs.length} banco(s) de dados...`);
    
    let successCount = 0;
    enabledDbs.forEach(database => {
      const result = initializeDatabase(database);
      if (result) successCount++;
    });

    console.log(`✅ ${successCount}/${enabledDbs.length} banco(s) inicializado(s) com sucesso`);
    
    // Verificar se pelo menos o primary foi inicializado
    if (!initializedDbs.has('primary')) {
      throw new Error('❌ ERRO CRÍTICO: Banco principal não foi inicializado!');
    }
    
    return true;
  } catch (error) {
    console.error('❌ ERRO na inicialização do sistema multi-database:', error);
    console.error('Stack:', error.stack);
    return false;
  }
};

// Inicializar automaticamente
const initSuccess = initializeAllDatabases();

if (!initSuccess) {
  console.error('⚠️ Sistema iniciado com erros. Alguns recursos podem não funcionar.');
}

// ====================================
// GERENCIADOR MULTI-DATABASE
// ====================================

class MultiDatabaseManager {
  constructor() {
    console.log('🎯 Inicializando MultiDatabaseManager...');
    this.activeDatabase = this.loadActiveDatabase();
    this.rotationSequence = this.loadRotationSequence();
    this.lastRotation = this.loadLastRotation();
    this.listeners = [];
    console.log(`📊 Banco ativo: ${this.activeDatabase}`);
    console.log(`📋 Sequência de rotação: ${this.rotationSequence.join(', ')}`);
  }

  // Carregar database ativo
  loadActiveDatabase() {
    const saved = localStorage.getItem('activeDatabase');
    const active = saved || 'primary';
    
    // Verificar se o banco existe
    if (!initializedDbs.has(active)) {
      console.warn(`⚠️ Banco "${active}" não encontrado, usando primary`);
      return 'primary';
    }
    
    return active;
  }

  // Salvar database ativo
  saveActiveDatabase(dbId) {
    localStorage.setItem('activeDatabase', dbId);
    this.activeDatabase = dbId;
    this.notifyListeners();
  }

  // Carregar sequência de rotação
  loadRotationSequence() {
    const saved = localStorage.getItem('rotationSequence');
    if (saved) {
      return JSON.parse(saved);
    }
    // Sequência padrão: todos os bancos habilitados ordenados por prioridade
    return firebaseDatabases
      .filter(db => db.enabled)
      .sort((a, b) => a.priority - b.priority)
      .map(db => db.id);
  }

  // Salvar sequência de rotação
  saveRotationSequence(sequence) {
    localStorage.setItem('rotationSequence', JSON.stringify(sequence));
    this.rotationSequence = sequence;
  }

  // Carregar última rotação
  loadLastRotation() {
    const saved = localStorage.getItem('lastDatabaseRotation');
    return saved ? new Date(saved) : new Date();
  }

  // Salvar última rotação
  saveLastRotation() {
    const now = new Date();
    localStorage.setItem('lastDatabaseRotation', now.toISOString());
    this.lastRotation = now;
  }

  // Obter database ativo
  getActiveDb() {
    return initializedDbs.get(this.activeDatabase);
  }

  // Obter todos os databases inativos
  getInactiveDbs() {
    return Array.from(initializedDbs.entries())
      .filter(([id]) => id !== this.activeDatabase)
      .map(([id, db]) => ({ id, db }));
  }

  // Obter auth ativo
  getActiveAuth() {
    return initializedAuths.get(this.activeDatabase);
  }

  // Obter storage ativo
  getActiveStorage() {
    return initializedStorages.get(this.activeDatabase);
  }

  // Obter app ativo
  getActiveApp() {
    return initializedApps.get(this.activeDatabase);
  }

  // Obter database por ID
  getDbById(id) {
    return initializedDbs.get(id);
  }

  // Alternar para próximo database na sequência
  switchToNextDatabase() {
    const currentIndex = this.rotationSequence.indexOf(this.activeDatabase);
    const nextIndex = (currentIndex + 1) % this.rotationSequence.length;
    const nextDb = this.rotationSequence[nextIndex];
    
    console.log(`🔄 Rotação: ${this.activeDatabase} → ${nextDb}`);
    
    this.saveActiveDatabase(nextDb);
    this.saveLastRotation();
    
    return nextDb;
  }

  // Alternar para database específico
  switchToDatabase(dbId) {
    if (!initializedDbs.has(dbId)) {
      throw new Error(`Database "${dbId}" não encontrado ou não inicializado`);
    }
    
    console.log(`🔄 Alternando para: ${dbId}`);
    
    this.saveActiveDatabase(dbId);
    this.saveLastRotation();
    
    return dbId;
  }

  // Verificar se precisa rotacionar (24h)
  needsRotation(hours = 24) {
    const now = new Date();
    const hoursSinceRotation = (now - this.lastRotation) / (1000 * 60 * 60);
    return hoursSinceRotation >= hours;
  }

  // Obter lista de todos os bancos
  getAllDatabases() {
    return firebaseDatabases.map(db => ({
      ...db,
      isActive: db.id === this.activeDatabase,
      isInitialized: initializedDbs.has(db.id),
      inRotationSequence: this.rotationSequence.includes(db.id)
    }));
  }

  // Adicionar listener
  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  // Notificar listeners
  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback(this.activeDatabase);
      } catch (error) {
        console.error('Erro ao notificar listener:', error);
      }
    });
  }

  // Obter informações do sistema
  getInfo() {
    return {
      activeDatabase: this.activeDatabase,
      activeDatabaseName: firebaseDatabases.find(db => db.id === this.activeDatabase)?.name,
      totalDatabases: firebaseDatabases.length,
      enabledDatabases: firebaseDatabases.filter(db => db.enabled).length,
      rotationSequence: this.rotationSequence,
      lastRotation: this.lastRotation,
      needsRotation: this.needsRotation(),
      hoursUntilRotation: 24 - ((new Date() - this.lastRotation) / (1000 * 60 * 60)),
      databases: this.getAllDatabases()
    };
  }
}

// Instância única do gerenciador
export const dbManager = new MultiDatabaseManager();

// ====================================
// EXPORTS PARA COMPATIBILIDADE
// ====================================

// Export das instâncias fixas (compatibilidade com código antigo)
export const primaryApp = initializedApps.get('primary');
export const backupApp = initializedApps.get('backup');
export const workflowbr1App = initializedApps.get('workflowbr1');

export const primaryDb = initializedDbs.get('primary');
export const backupDb = initializedDbs.get('backup');
export const workflowbr1Db = initializedDbs.get('workflowbr1');

export const primaryAuth = initializedAuths.get('primary');
export const backupAuth = initializedAuths.get('backup');
export const workflowbr1Auth = initializedAuths.get('workflowbr1');

export const primaryStorage = initializedStorages.get('primary');
export const backupStorage = initializedStorages.get('backup');
export const workflowbr1Storage = initializedStorages.get('workflowbr1');

// ====================================
// EXPORTS DINÂMICOS (Sempre retornam o banco ativo)
// ====================================

/**
 * Retorna a instância do Firestore ativa
 * IMPORTANTE: Para compatibilidade com código antigo, sempre retorna o banco primário
 * Para usar o sistema de rotação, use dbManager.getActiveDb()
 */
export const db = initializedDbs.get('primary');

/**
 * Retorna a instância do Auth ativa
 */
export const auth = initializedAuths.get('primary');

/**
 * Retorna a instância do Storage ativa
 */
export const storage = initializedStorages.get('primary');

/**
 * Retorna a instância do App ativa
 */
export const app = initializedApps.get('primary');

// Export das funções de gerenciamento
export {
  firebaseDatabases,
  initializedDbs,
  initializedApps,
  initializedAuths,
  initializedStorages
};

export default dbManager;
