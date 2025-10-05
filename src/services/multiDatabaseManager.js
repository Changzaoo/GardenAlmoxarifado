import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

/**
 * 🔗 Gerenciador de Múltiplos Databases Firebase
 * 
 * Expande o sistema dual para suportar N databases
 */
export class MultiDatabaseManager {
  constructor() {
    this.databases = new Map(); // Map de ID -> { app, db, auth, storage, config, status }
    this.activeDatabase = this.loadActiveDatabaseId();
    this.lastRotation = this.loadLastRotation();
    this.listeners = [];
    this.rotationIndex = 0;
    
    // Inicializar com databases padrão
    this.initializeDefaultDatabases();
    
    // Carregar databases customizados
    this.loadCustomDatabases();
  }

  /**
   * 🔧 Inicializar databases padrão (primary/backup)
   */
  async initializeDefaultDatabases() {
    try {
      // Configuração principal (criptografada)
      const primaryConfig = await this.getFirebaseConfigPrimary();
      
      // Configuração backup
      const backupConfig = {
        apiKey: "AIzaSyCPTELyhRUn4qByU68pOZsZUrkR1ZeyROo",
        authDomain: "garden-backup.firebaseapp.com",
        projectId: "garden-backup",
        storageBucket: "garden-backup.firebasestorage.app",
        messagingSenderId: "842077125369",
        appId: "1:842077125369:web:ea3bafe1cedb92cd350028",
        measurementId: "G-WJHEL52L9L"
      };

      // Adicionar database principal
      await this.addDatabase('primary', 'Firebase Principal', primaryConfig, {
        priority: 1,
        isDefault: true,
        encrypted: true
      });

      // Adicionar database backup
      await this.addDatabase('backup', 'Firebase Backup', backupConfig, {
        priority: 2,
        isDefault: true,
        encrypted: false
      });

      console.log('✅ Databases padrão inicializados');
    } catch (error) {
      console.error('❌ Erro ao inicializar databases padrão:', error);
      throw error;
    }
  }

  /**
   * 🔐 Obter configuração principal (descriptografada)
   */
  async getFirebaseConfigPrimary() {
    // Importar função de descriptografia
    const { decrypt } = await import('../utils/cryptoUtils');
    
    const encryptedConfig = {
      "_k": "WlpoYVN5QW5MbXRsaE9VVUFidFJjT2c2NGRYZENMYmx0dl9pRTRF",
      "_d": "Z2FyZGVuLWMwYjUwLmZpcmViYXNlYXBwLmNvbQ==",
      "_p": "Z2FyZGVuLWMwYjUw",
      "_s": "Z2FyZGVuLWMwYjUwLmZpcmViYXNlc3RvcmFnZS5hcHA=",
      "_m": "ODQyMDc3MTI1MzY5",
      "_a": "MTo4NDIwNzcxMjUzNjk6d2ViOmVhM2JhZmUxY2VkYjkyY2QzNTAwMjg=",
      "_t": "Ry1XSkhFTDUyTDlM"
    };

    return {
      apiKey: process.env.REACT_APP_FIREBASE_API_KEY || decrypt(encryptedConfig._k),
      authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || decrypt(encryptedConfig._d),
      projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || decrypt(encryptedConfig._p),
      storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || decrypt(encryptedConfig._s),
      messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || decrypt(encryptedConfig._m),
      appId: process.env.REACT_APP_FIREBASE_APP_ID || decrypt(encryptedConfig._a),
      measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || decrypt(encryptedConfig._t)
    };
  }

  /**
   * ➕ Adicionar novo database
   */
  async addDatabase(id, name, config, metadata = {}) {
    try {
      console.log(`🔗 Inicializando database: ${name} (${id})`);

      // Verificar se já existe
      if (this.databases.has(id)) {
        throw new Error(`Database com ID '${id}' já existe`);
      }

      // Inicializar Firebase App
      const app = initializeApp(config, id);
      const db = getFirestore(app);
      const auth = getAuth(app);
      const storage = getStorage(app);

      // Tentar habilitar persistência (apenas para databases principais)
      if (metadata.priority <= 2) {
        try {
          await enableIndexedDbPersistence(db);
        } catch (err) {
          if (err.code === 'failed-precondition') {
            console.warn(`⚠️ ${name}: Múltiplas abas abertas, persistência habilitada em apenas uma.`);
          } else if (err.code === 'unimplemented') {
            console.warn(`⚠️ ${name}: Navegador não suporta persistência offline.`);
          }
        }
      }

      // Armazenar database
      this.databases.set(id, {
        id,
        name,
        app,
        db,
        auth,
        storage,
        config,
        metadata: {
          priority: metadata.priority || 999,
          isDefault: metadata.isDefault || false,
          encrypted: metadata.encrypted || false,
          addedAt: new Date().toISOString(),
          lastUsed: null,
          status: 'active',
          ...metadata
        },
        stats: {
          connections: 0,
          lastConnection: null,
          errors: 0,
          lastError: null
        }
      });

      console.log(`✅ Database ${name} inicializado com sucesso`);
      
      // Notificar listeners
      this.notifyListeners();
      
      return true;
    } catch (error) {
      console.error(`❌ Erro ao adicionar database ${name}:`, error);
      throw error;
    }
  }

  /**
   * 🗑️ Remover database
   */
  async removeDatabase(id) {
    try {
      if (!this.databases.has(id)) {
        throw new Error(`Database '${id}' não encontrado`);
      }

      const database = this.databases.get(id);

      // Não permitir remoção de databases padrão
      if (database.metadata.isDefault) {
        throw new Error('Não é possível remover databases padrão');
      }

      // Se é o database ativo, alternar para outro
      if (this.activeDatabase === id) {
        const alternatives = Array.from(this.databases.keys()).filter(dbId => dbId !== id);
        if (alternatives.length > 0) {
          this.switchToDatabase(alternatives[0]);
        }
      }

      // Deletar Firebase App
      await database.app.delete();

      // Remover do Map
      this.databases.delete(id);

      // Salvar no localStorage
      this.saveCustomDatabases();

      console.log(`✅ Database ${database.name} removido`);
      
      // Notificar listeners
      this.notifyListeners();
      
      return true;
    } catch (error) {
      console.error(`❌ Erro ao remover database ${id}:`, error);
      throw error;
    }
  }

  /**
   * 🔄 Alternar para database específico
   */
  switchToDatabase(databaseId) {
    if (!this.databases.has(databaseId)) {
      throw new Error(`Database '${databaseId}' não encontrado`);
    }

    const oldDatabase = this.activeDatabase;
    this.activeDatabase = databaseId;

    // Atualizar estatísticas
    const database = this.databases.get(databaseId);
    database.stats.connections++;
    database.stats.lastConnection = new Date().toISOString();
    database.metadata.lastUsed = new Date().toISOString();

    // Salvar no localStorage
    this.saveActiveDatabaseId(databaseId);
    this.saveLastRotation();

    console.log(`🔄 Database alterado: ${oldDatabase} → ${databaseId}`);

    // Notificar listeners
    this.notifyListeners();

    return databaseId;
  }

  /**
   * 🎯 Rotação automática entre databases
   */
  rotateToNext() {
    const availableDatabases = Array.from(this.databases.keys());
    
    if (availableDatabases.length <= 1) {
      console.warn('⚠️ Apenas um database disponível para rotação');
      return this.activeDatabase;
    }

    const currentIndex = availableDatabases.indexOf(this.activeDatabase);
    const nextIndex = (currentIndex + 1) % availableDatabases.length;
    const nextDatabase = availableDatabases[nextIndex];

    return this.switchToDatabase(nextDatabase);
  }

  /**
   * 📊 Obter database ativo
   */
  getActiveDatabase() {
    const database = this.databases.get(this.activeDatabase);
    if (!database) {
      // Fallback para primeiro database disponível
      const firstDb = Array.from(this.databases.keys())[0];
      if (firstDb) {
        this.switchToDatabase(firstDb);
        return this.databases.get(firstDb);
      }
      throw new Error('Nenhum database disponível');
    }
    return database;
  }

  /**
   * 🗄️ Obter instâncias ativas
   */
  getActiveDb() {
    return this.getActiveDatabase().db;
  }

  getActiveAuth() {
    return this.getActiveDatabase().auth;
  }

  getActiveStorage() {
    return this.getActiveDatabase().storage;
  }

  /**
   * 📋 Listar todos os databases
   */
  getAllDatabases() {
    return Array.from(this.databases.values());
  }

  /**
   * 📊 Obter informações do sistema
   */
  getSystemInfo() {
    const databases = this.getAllDatabases();
    
    return {
      activeDatabase: this.activeDatabase,
      lastRotation: this.lastRotation,
      totalDatabases: databases.length,
      defaultDatabases: databases.filter(db => db.metadata.isDefault).length,
      customDatabases: databases.filter(db => !db.metadata.isDefault).length,
      databases: databases.map(db => ({
        id: db.id,
        name: db.name,
        isActive: db.id === this.activeDatabase,
        priority: db.metadata.priority,
        isDefault: db.metadata.isDefault,
        status: db.metadata.status,
        stats: db.stats,
        lastUsed: db.metadata.lastUsed
      })),
      needsRotation: this.needsRotation(),
      hoursUntilRotation: this.getHoursUntilRotation()
    };
  }

  /**
   * 💾 Persistência no localStorage
   */
  saveActiveDatabaseId(databaseId) {
    localStorage.setItem('activeDatabaseId', databaseId);
  }

  loadActiveDatabaseId() {
    return localStorage.getItem('activeDatabaseId') || 'primary';
  }

  saveLastRotation() {
    const now = new Date().toISOString();
    localStorage.setItem('lastDatabaseRotation', now);
    this.lastRotation = now;
  }

  loadLastRotation() {
    const saved = localStorage.getItem('lastDatabaseRotation');
    return saved ? saved : new Date().toISOString();
  }

  /**
   * 💾 Persistência de databases customizados
   */
  saveCustomDatabases() {
    const customDatabases = Array.from(this.databases.values())
      .filter(db => !db.metadata.isDefault)
      .map(db => ({
        id: db.id,
        name: db.name,
        config: db.config,
        metadata: db.metadata
      }));
    
    localStorage.setItem('customFirebaseDatabases', JSON.stringify(customDatabases));
  }

  async loadCustomDatabases() {
    try {
      const saved = localStorage.getItem('customFirebaseDatabases');
      if (!saved) return;

      const customDatabases = JSON.parse(saved);
      
      for (const dbData of customDatabases) {
        await this.addDatabase(dbData.id, dbData.name, dbData.config, dbData.metadata);
      }

      console.log(`✅ ${customDatabases.length} databases customizados carregados`);
    } catch (error) {
      console.error('❌ Erro ao carregar databases customizados:', error);
    }
  }

  /**
   * ⏰ Verificações de tempo
   */
  needsRotation() {
    const now = new Date();
    const lastRotation = new Date(this.lastRotation);
    const hoursSinceRotation = (now - lastRotation) / (1000 * 60 * 60);
    return hoursSinceRotation >= 24;
  }

  getHoursUntilRotation() {
    const now = new Date();
    const lastRotation = new Date(this.lastRotation);
    const hoursSinceRotation = (now - lastRotation) / (1000 * 60 * 60);
    return Math.max(0, 24 - hoursSinceRotation);
  }

  /**
   * 👂 Sistema de listeners
   */
  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback(this.getSystemInfo());
      } catch (error) {
        console.error('❌ Erro ao notificar listener:', error);
      }
    });
  }
}

// Instância global
let multiDbManager = null;

/**
 * 🎯 Obter instância do gerenciador
 */
export const getMultiDatabaseManager = () => {
  if (!multiDbManager) {
    multiDbManager = new MultiDatabaseManager();
  }
  return multiDbManager;
};

export default getMultiDatabaseManager;