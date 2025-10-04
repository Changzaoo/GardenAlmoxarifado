import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { decrypt } from '../utils/cryptoUtils';

// ====================================
// CONFIGURAÇÃO FIREBASE PRINCIPAL
// ====================================

const encryptedConfigPrimary = {
  "_k": "WlpoYVN5QW5MbXRsaE9VVUFidFJjT2c2NGRYZENMYmx0dl9pRTRF",
  "_d": "Z2FyZGVuLWMwYjUwLmZpcmViYXNlYXBwLmNvbQ==",
  "_p": "Z2FyZGVuLWMwYjUw",
  "_s": "Z2FyZGVuLWMwYjUwLmZpcmViYXNlc3RvcmFnZS5hcHA=",
  "_m": "NDY3MzQ0MzU0OTk3",
  "_a": "MTo0NjczNDQzNTQ5OTc6d2ViOjNjMzM5N2UwMTc2MDYwYmIwYzk4ZmM=",
  "_t": "Ry03TE1MOTNRRFRGCg=="
};

const getFirebaseConfigPrimary = () => ({
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || decrypt(encryptedConfigPrimary._k),
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || decrypt(encryptedConfigPrimary._d),
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || decrypt(encryptedConfigPrimary._p),
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || decrypt(encryptedConfigPrimary._s),
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || decrypt(encryptedConfigPrimary._m),
  appId: process.env.REACT_APP_FIREBASE_APP_ID || decrypt(encryptedConfigPrimary._a),
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || decrypt(encryptedConfigPrimary._t)
});

// ====================================
// CONFIGURAÇÃO FIREBASE BACKUP
// ====================================

const firebaseConfigBackup = {
  apiKey: "AIzaSyCPTELyhRUn4qByU68pOZsZUrkR1ZeyROo",
  authDomain: "garden-backup.firebaseapp.com",
  projectId: "garden-backup",
  storageBucket: "garden-backup.firebasestorage.app",
  messagingSenderId: "842077125369",
  appId: "1:842077125369:web:ea3bafe1cedb92cd350028",
  measurementId: "G-WJHEL52L9L"
};

// ====================================
// INICIALIZAÇÃO DOS APPS
// ====================================

let primaryApp, backupApp;
let primaryDb, backupDb;
let primaryAuth, backupAuth;
let primaryStorage, backupStorage;

const initializeFirebaseApps = () => {
  try {
    // Inicializar Firebase Principal
    primaryApp = initializeApp(getFirebaseConfigPrimary(), 'primary');
    primaryDb = getFirestore(primaryApp);
    primaryAuth = getAuth(primaryApp);
    primaryStorage = getStorage(primaryApp);

    // Habilitar persistência no banco principal
    enableIndexedDbPersistence(primaryDb).catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('⚠️ Múltiplas abas abertas, persistência habilitada em apenas uma.');
      } else if (err.code === 'unimplemented') {
        console.warn('⚠️ Navegador não suporta persistência offline.');
      }
    });

    // Inicializar Firebase Backup
    backupApp = initializeApp(firebaseConfigBackup, 'backup');
    backupDb = getFirestore(backupApp);
    backupAuth = getAuth(backupApp);
    backupStorage = getStorage(backupApp);

    console.log('✅ Firebase Principal e Backup inicializados');

    return {
      primaryApp,
      backupApp,
      primaryDb,
      backupDb,
      primaryAuth,
      backupAuth,
      primaryStorage,
      backupStorage
    };
  } catch (error) {
    console.error('❌ Erro ao inicializar Firebase:', error);
    throw error;
  }
};

// Inicializar automaticamente
const firebaseApps = initializeFirebaseApps();

// ====================================
// GERENCIADOR DE DATABASE ATIVO
// ====================================

class DatabaseManager {
  constructor() {
    this.activeDatabase = this.loadActiveDatabase();
    this.lastRotation = this.loadLastRotation();
    this.listeners = [];
  }

  // Carregar database ativo do localStorage
  loadActiveDatabase() {
    const saved = localStorage.getItem('activeDatabase');
    return saved || 'primary';
  }

  // Salvar database ativo
  saveActiveDatabase(dbName) {
    localStorage.setItem('activeDatabase', dbName);
    this.activeDatabase = dbName;
    this.notifyListeners();
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
    return this.activeDatabase === 'primary' ? primaryDb : backupDb;
  }

  // Obter database inativo (para backup)
  getInactiveDb() {
    return this.activeDatabase === 'primary' ? backupDb : primaryDb;
  }

  // Obter auth ativo
  getActiveAuth() {
    return this.activeDatabase === 'primary' ? primaryAuth : backupAuth;
  }

  // Obter storage ativo
  getActiveStorage() {
    return this.activeDatabase === 'primary' ? primaryStorage : backupStorage;
  }

  // Alternar database
  switchDatabase() {
    const newDb = this.activeDatabase === 'primary' ? 'backup' : 'primary';
    console.log(`🔄 Alternando database: ${this.activeDatabase} → ${newDb}`);
    
    this.saveActiveDatabase(newDb);
    this.saveLastRotation();
    
    return newDb;
  }

  // Verificar se precisa rotacionar (24h)
  needsRotation() {
    const now = new Date();
    const hoursSinceRotation = (now - this.lastRotation) / (1000 * 60 * 60);
    return hoursSinceRotation >= 24;
  }

  // Adicionar listener para mudanças
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
      lastRotation: this.lastRotation,
      needsRotation: this.needsRotation(),
      hoursUntilRotation: 24 - ((new Date() - this.lastRotation) / (1000 * 60 * 60)),
      primaryDb,
      backupDb,
      activeDb: this.getActiveDb(),
      inactiveDb: this.getInactiveDb()
    };
  }
}

// Instância única do gerenciador
export const dbManager = new DatabaseManager();

// ====================================
// EXPORTS
// ====================================

// Export das instâncias fixas
export {
  primaryApp,
  backupApp,
  primaryDb,
  backupDb,
  primaryAuth,
  backupAuth,
  primaryStorage,
  backupStorage
};

// Export das instâncias dinâmicas (baseadas no database ativo)
// Com fallback seguro para evitar erros de inicialização
export const db = new Proxy({}, {
  get: (target, prop) => {
    try {
      const activeDb = dbManager.getActiveDb();
      if (!activeDb) {
        console.warn('⚠️ Database Manager não inicializado, usando primaryDb como fallback');
        return primaryDb[prop];
      }
      return activeDb[prop];
    } catch (error) {
      console.error('❌ Erro ao acessar database ativo, usando primaryDb:', error);
      return primaryDb[prop];
    }
  }
});

export const auth = new Proxy({}, {
  get: (target, prop) => {
    try {
      const activeAuth = dbManager.getActiveAuth();
      if (!activeAuth) {
        console.warn('⚠️ Auth Manager não inicializado, usando primaryAuth como fallback');
        return primaryAuth[prop];
      }
      return activeAuth[prop];
    } catch (error) {
      console.error('❌ Erro ao acessar auth ativo, usando primaryAuth:', error);
      return primaryAuth[prop];
    }
  }
});

export const storage = new Proxy({}, {
  get: (target, prop) => {
    try {
      const activeStorage = dbManager.getActiveStorage();
      if (!activeStorage) {
        console.warn('⚠️ Storage Manager não inicializado, usando primaryStorage como fallback');
        return primaryStorage[prop];
      }
      return activeStorage[prop];
    } catch (error) {
      console.error('❌ Erro ao acessar storage ativo, usando primaryStorage:', error);
      return primaryStorage[prop];
    }
  }
});

// Export do app ativo
export const app = new Proxy({}, {
  get: (target, prop) => {
    try {
      const activeApp = dbManager.activeDatabase === 'primary' ? primaryApp : backupApp;
      if (!activeApp) {
        console.warn('⚠️ App Manager não inicializado, usando primaryApp como fallback');
        return primaryApp[prop];
      }
      return activeApp[prop];
    } catch (error) {
      console.error('❌ Erro ao acessar app ativo, usando primaryApp:', error);
      return primaryApp[prop];
    }
  }
});

export default dbManager;
