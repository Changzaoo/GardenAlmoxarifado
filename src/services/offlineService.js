/**
 * Serviço de Gerenciamento Offline
 * Permite que o app funcione sem internet e sincronize quando reconectar
 */

// Nome do banco de dados local
const DB_NAME = 'workflow-offline-db';
const DB_VERSION = 1;
const PENDING_STORE = 'pending-operations';
const CACHE_STORE = 'cached-data';

class OfflineService {
  constructor() {
    this.db = null;
    this.isOnline = navigator.onLine;
    this.syncInProgress = false;
    this.listeners = new Set();
    
    this.initDatabase();
    this.setupOnlineListener();
  }

  /**
   * Inicializar IndexedDB
   */
  async initDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('❌ Erro ao abrir IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ IndexedDB inicializado');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Store para operações pendentes
        if (!db.objectStoreNames.contains(PENDING_STORE)) {
          const pendingStore = db.createObjectStore(PENDING_STORE, {
            keyPath: 'id',
            autoIncrement: true
          });
          pendingStore.createIndex('timestamp', 'timestamp', { unique: false });
          pendingStore.createIndex('type', 'type', { unique: false });
        }

        // Store para dados em cache
        if (!db.objectStoreNames.contains(CACHE_STORE)) {
          const cacheStore = db.createObjectStore(CACHE_STORE, {
            keyPath: 'key'
          });
          cacheStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        console.log('📦 Stores do IndexedDB criados');
      };
    });
  }

  /**
   * Configurar listener de status online/offline
   */
  setupOnlineListener() {
    window.addEventListener('online', () => {
      console.log('🌐 Conexão restaurada!');
      this.isOnline = true;
      this.notifyListeners('online');
      this.syncPendingOperations();
    });

    window.addEventListener('offline', () => {
      console.log('📴 Sem conexão! Modo offline ativado.');
      this.isOnline = false;
      this.notifyListeners('offline');
    });
  }

  /**
   * Adicionar listener para mudanças de status
   */
  addStatusListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notificar todos os listeners
   */
  notifyListeners(status) {
    this.listeners.forEach(callback => {
      try {
        callback(status, this.isOnline);
      } catch (error) {
        console.error('Erro ao notificar listener:', error);
      }
    });
  }

  /**
   * Salvar operação pendente para sincronizar depois
   */
  async savePendingOperation(operation) {
    if (!this.db) {
      await this.initDatabase();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([PENDING_STORE], 'readwrite');
      const store = transaction.objectStore(PENDING_STORE);

      const data = {
        ...operation,
        timestamp: Date.now(),
        synced: false
      };

      const request = store.add(data);

      request.onsuccess = async () => {
        console.log('💾 Operação salva para sincronização:', operation.type);
        
        // Tentar sincronizar via Bluetooth se disponível
        try {
          const { default: bluetoothMeshService } = await import('./bluetoothMeshService');
          if (bluetoothMeshService.isConnected) {
            console.log('📡 Tentando sincronizar via Bluetooth...');
            await bluetoothMeshService.syncWithPeer();
          }
        } catch (error) {
          // Bluetooth não disponível ou erro, continuar normalmente
          console.log('ℹ️ Bluetooth não disponível para sincronização');
        }
        
        resolve(request.result);
      };

      request.onerror = () => {
        console.error('❌ Erro ao salvar operação:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Obter todas as operações pendentes
   */
  async getPendingOperations() {
    if (!this.db) {
      await this.initDatabase();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([PENDING_STORE], 'readonly');
      const store = transaction.objectStore(PENDING_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        const operations = request.result.filter(op => !op.synced);
        resolve(operations);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Marcar operação como sincronizada
   */
  async markOperationSynced(id) {
    if (!this.db) {
      await this.initDatabase();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([PENDING_STORE], 'readwrite');
      const store = transaction.objectStore(PENDING_STORE);
      const request = store.get(id);

      request.onsuccess = () => {
        const data = request.result;
        if (data) {
          data.synced = true;
          data.syncedAt = Date.now();
          const updateRequest = store.put(data);

          updateRequest.onsuccess = () => {
            console.log('✅ Operação marcada como sincronizada:', id);
            resolve();
          };

          updateRequest.onerror = () => {
            reject(updateRequest.error);
          };
        } else {
          resolve(); // Já foi removida
        }
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Remover operação do IndexedDB
   */
  async deleteOperation(id) {
    if (!this.db) {
      await this.initDatabase();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([PENDING_STORE], 'readwrite');
      const store = transaction.objectStore(PENDING_STORE);
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Sincronizar todas as operações pendentes
   */
  async syncPendingOperations() {
    if (!this.isOnline || this.syncInProgress) {
      return;
    }

    this.syncInProgress = true;
    console.log('🔄 Iniciando sincronização de operações pendentes...');

    try {
      const operations = await this.getPendingOperations();
      
      if (operations.length === 0) {
        console.log('✅ Nenhuma operação pendente para sincronizar');
        this.syncInProgress = false;
        return;
      }

      console.log(`📤 Sincronizando ${operations.length} operações...`);

      let syncedCount = 0;
      let errorCount = 0;

      for (const operation of operations) {
        try {
          await this.executeOperation(operation);
          await this.markOperationSynced(operation.id);
          syncedCount++;
        } catch (error) {
          console.error('❌ Erro ao sincronizar operação:', error);
          errorCount++;
        }
      }

      console.log(`✅ Sincronização completa: ${syncedCount} sucesso, ${errorCount} erros`);
      
      // Notificar listeners sobre sincronização
      this.notifyListeners('synced', { syncedCount, errorCount });

    } catch (error) {
      console.error('❌ Erro na sincronização:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Executar operação específica no servidor
   */
  async executeOperation(operation) {
    const { type, data, collection, id } = operation;

    // Importar Firebase dinamicamente
    const { db } = await import('../firebaseConfig');
    const { doc, setDoc, updateDoc, deleteDoc, collection: fbCollection } = await import('firebase/firestore');

    switch (type) {
      case 'create':
        await setDoc(doc(fbCollection(db, collection), id), data);
        break;

      case 'update':
        await updateDoc(doc(db, collection, id), data);
        break;

      case 'delete':
        await deleteDoc(doc(db, collection, id));
        break;

      default:
        console.warn('Tipo de operação desconhecido:', type);
    }
  }

  /**
   * Salvar dados em cache
   */
  async cacheData(key, data, ttl = 3600000) { // TTL padrão: 1 hora
    if (!this.db) {
      await this.initDatabase();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([CACHE_STORE], 'readwrite');
      const store = transaction.objectStore(CACHE_STORE);

      const cacheData = {
        key,
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + ttl
      };

      const request = store.put(cacheData);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Obter dados do cache
   */
  async getCachedData(key) {
    if (!this.db) {
      await this.initDatabase();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([CACHE_STORE], 'readonly');
      const store = transaction.objectStore(CACHE_STORE);
      const request = store.get(key);

      request.onsuccess = () => {
        const cached = request.result;
        
        if (!cached) {
          resolve(null);
          return;
        }

        // Verificar se expirou
        if (Date.now() > cached.expiresAt) {
          console.log('⏰ Cache expirado:', key);
          resolve(null);
          return;
        }

        resolve(cached.data);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Limpar cache expirado
   */
  async clearExpiredCache() {
    if (!this.db) {
      await this.initDatabase();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([CACHE_STORE], 'readwrite');
      const store = transaction.objectStore(CACHE_STORE);
      const request = store.openCursor();
      
      let deletedCount = 0;

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        
        if (cursor) {
          const data = cursor.value;
          
          if (Date.now() > data.expiresAt) {
            cursor.delete();
            deletedCount++;
          }
          
          cursor.continue();
        } else {
          console.log(`🧹 ${deletedCount} itens de cache expirados removidos`);
          resolve(deletedCount);
        }
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  /**
   * Obter contagem de operações pendentes
   */
  async getPendingCount() {
    const operations = await this.getPendingOperations();
    return operations.length;
  }

  /**
   * Verificar se está online
   */
  checkOnlineStatus() {
    return this.isOnline;
  }
}

// Exportar instância singleton
const offlineService = new OfflineService();
export default offlineService;
