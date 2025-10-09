/**
 * Sistema de cache local usando IndexedDB
 * Armazena dados offline para acesso sem internet
 */

const DB_NAME = 'WorkFlowOfflineDB';
const DB_VERSION = 1;

// Stores (tabelas) do IndexedDB
const STORES = {
  FUNCIONARIOS: 'funcionarios',
  PONTOS: 'pontos',
  AVALIACOES: 'avaliacoes',
  EMPRESTIMOS: 'emprestimos',
  TAREFAS: 'tarefas',
  ESCALAS: 'escalas',
  SYNC_QUEUE: 'syncQueue' // Fila de sincronização
};

class OfflineStorage {
  constructor() {
    this.db = null;
    this.initDB();
  }

  /**
   * Inicializa o banco de dados IndexedDB
   */
  async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Erro ao abrir IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Criar stores se não existirem
        Object.values(STORES).forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: false });
            
            // Índices para buscas rápidas
            if (storeName === STORES.PONTOS) {
              store.createIndex('funcionarioId', 'funcionarioId', { unique: false });
              store.createIndex('data', 'data', { unique: false });
            }
            if (storeName === STORES.AVALIACOES) {
              store.createIndex('funcionarioId', 'funcionarioId', { unique: false });
            }
            if (storeName === STORES.SYNC_QUEUE) {
              store.createIndex('timestamp', 'timestamp', { unique: false });
              store.createIndex('synced', 'synced', { unique: false });
            }
          }
        });
      };
    });
  }

  /**
   * Salva dados no cache local
   */
  async saveToCache(storeName, data) {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);

      const dataArray = Array.isArray(data) ? data : [data];
      let savedCount = 0;

      dataArray.forEach(item => {
        const request = store.put(item);
        request.onsuccess = () => {
          savedCount++;
          if (savedCount === dataArray.length) {
            resolve(savedCount);
          }
        };
        request.onerror = () => reject(request.error);
      });
    });
  }

  /**
   * Busca dados do cache local
   */
  async getFromCache(storeName, id = null) {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);

      if (id) {
        // Buscar um item específico
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      } else {
        // Buscar todos os itens
        const request = store.getAll();
        request.onsuccess = () => {
          resolve(request.result);
        };
        request.onerror = () => reject(request.error);
      }
    });
  }

  /**
   * Busca com filtro por índice
   */
  async getByIndex(storeName, indexName, value) {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);

      const request = index.getAll(value);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Remove dados do cache
   */
  async deleteFromCache(storeName, id) {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);

      const request = store.delete(id);
      request.onsuccess = () => {
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Limpa todo o cache de um store
   */
  async clearCache(storeName) {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);

      const request = store.clear();
      request.onsuccess = () => {
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Adiciona operação à fila de sincronização
   */
  async addToSyncQueue(operation) {
    const syncItem = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      operation: operation.type, // 'add', 'update', 'delete'
      collection: operation.collection,
      data: operation.data,
      timestamp: Date.now(),
      synced: false,
      retries: 0
    };

    await this.saveToCache(STORES.SYNC_QUEUE, syncItem);
    return syncItem;
  }

  /**
   * Busca operações pendentes de sincronização
   */
  async getPendingSync() {
    return await this.getByIndex(STORES.SYNC_QUEUE, 'synced', false);
  }

  /**
   * Marca operação como sincronizada
   */
  async markAsSynced(syncId) {
    const item = await this.getFromCache(STORES.SYNC_QUEUE, syncId);
    if (item) {
      item.synced = true;
      item.syncedAt = Date.now();
      await this.saveToCache(STORES.SYNC_QUEUE, item);
    }
  }

  /**
   * Remove operações já sincronizadas antigas (mais de 7 dias)
   */
  async cleanOldSyncQueue() {
    const allItems = await this.getFromCache(STORES.SYNC_QUEUE);
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    const toDelete = allItems.filter(item => 
      item.synced && item.syncedAt < sevenDaysAgo
    );

    for (const item of toDelete) {
      await this.deleteFromCache(STORES.SYNC_QUEUE, item.id);
    }

    if (toDelete.length > 0) {
    }
  }
}

// Instância singleton
const offlineStorage = new OfflineStorage();

export { offlineStorage, STORES };
