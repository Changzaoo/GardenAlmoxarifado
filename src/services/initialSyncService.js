/**
 * Serviço de Sincronização Inicial
 * Baixa todas as coleções do Firebase para cache local na inicialização
 */

import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const COLLECTIONS = [
  'usuarios',
  'usuario',
  'funcionarios',
  'pontos',
  'emprestimos',
  'inventario',
  'tarefas',
  'avaliacoes',
  'escalas',
  'mensagens',
  'conversas',
  'empresas',
  'setores',
  'notificacoes',
  'ferramentasDanificadas',
  'ferramentasPerdidas',
  'transferencias',
  'ajustes_manuais_horas',
  'avaliacoes_desempenho'
];

const DB_NAME = 'WorkFlowOfflineDB';
const DB_VERSION = 2;
const SYNC_STATUS_KEY = 'initialSyncStatus';

class InitialSyncService {
  constructor() {
    this.db = null;
    this.syncProgress = {
      total: COLLECTIONS.length,
      completed: 0,
      current: '',
      isComplete: false,
      lastSync: null,
      errors: []
    };
    this.listeners = [];
  }

  /**
   * Verifica se já foi feita a sincronização inicial
   */
  async checkSyncStatus() {
    try {
      const status = localStorage.getItem(SYNC_STATUS_KEY);
      if (!status) return null;
      
      const syncData = JSON.parse(status);
      
      // Verifica se a última sincronização foi na última 1 hora
      const lastSyncTime = new Date(syncData.lastSync);
      const minutesSinceSync = (Date.now() - lastSyncTime.getTime()) / (1000 * 60);
      
      if (minutesSinceSync > 60) {
        return { ...syncData, needsSync: true }; // Precisa sincronizar novamente
      }
      
      return syncData;
    } catch (error) {
      console.error('❌ Erro ao verificar status de sincronização:', error);
      return null;
    }
  }

  /**
   * Inicializa IndexedDB com todas as coleções
   */
  async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('❌ Erro ao abrir IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Criar uma store para cada coleção
        COLLECTIONS.forEach(collectionName => {
          if (!db.objectStoreNames.contains(collectionName)) {
            const store = db.createObjectStore(collectionName, { 
              keyPath: 'id', 
              autoIncrement: false 
            });
            
            // Criar índices úteis
            if (collectionName === 'pontos') {
              store.createIndex('funcionarioId', 'funcionarioId', { unique: false });
              store.createIndex('data', 'data', { unique: false });
              store.createIndex('timestamp', 'timestamp', { unique: false });
            }
            if (collectionName === 'emprestimos') {
              store.createIndex('funcionarioId', 'funcionarioId', { unique: false });
              store.createIndex('status', 'status', { unique: false });
            }
            if (collectionName === 'tarefas') {
              store.createIndex('funcionarioId', 'funcionarioId', { unique: false });
              store.createIndex('status', 'status', { unique: false });
            }
            if (collectionName === 'mensagens') {
              store.createIndex('conversaId', 'conversaId', { unique: false });
              store.createIndex('timestamp', 'timestamp', { unique: false });
            }
            if (collectionName === 'notificacoes') {
              store.createIndex('usuarioId', 'usuarioId', { unique: false });
              store.createIndex('lida', 'lida', { unique: false });
            }
            if (collectionName === 'ajustes_manuais_horas') {
              store.createIndex('funcionarioId', 'funcionarioId', { unique: false });
              store.createIndex('mesReferencia', 'mesReferencia', { unique: false });
              store.createIndex('ativo', 'ativo', { unique: false });
            }
            if (collectionName === 'avaliacoes_desempenho') {
              store.createIndex('funcionarioId', 'funcionarioId', { unique: false });
            }
          }
        });

        // Store de metadados
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
        }
      };
    });
  }

  /**
   * Salva dados de uma coleção no IndexedDB
   */
  async saveCollectionToCache(collectionName, documents) {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([collectionName], 'readwrite');
      const store = transaction.objectStore(collectionName);

      // Limpar dados antigos
      store.clear();

      // Salvar novos dados
      let saved = 0;
      documents.forEach(doc => {
        const request = store.put(doc);
        request.onsuccess = () => {
          saved++;
          if (saved === documents.length) {
            resolve(saved);
          }
        };
        request.onerror = () => {
          console.error(`Erro ao salvar documento em ${collectionName}:`, request.error);
        };
      });

      if (documents.length === 0) {
        resolve(0);
      }

      transaction.oncomplete = () => {
        // Salvar metadados da sincronização
        this.saveMetadata(collectionName, {
          lastSync: new Date().toISOString(),
          count: documents.length
        });
      };
    });
  }

  /**
   * Salva metadados de sincronização
   */
  async saveMetadata(collectionName, metadata) {
    if (!this.db) return;

    return new Promise((resolve) => {
      const transaction = this.db.transaction(['metadata'], 'readwrite');
      const store = transaction.objectStore('metadata');
      
      store.put({
        key: collectionName,
        ...metadata
      });

      transaction.oncomplete = () => resolve();
    });
  }

  /**
   * Busca documentos de uma coleção do Firebase
   */
  async fetchCollectionFromFirebase(collectionName) {
    try {
      const querySnapshot = await getDocs(collection(db, collectionName));
      const documents = [];
      
      querySnapshot.forEach((doc) => {
        documents.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return documents;
    } catch (error) {
      console.error(`❌ Erro ao buscar ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Sincroniza uma coleção específica
   */
  async syncCollection(collectionName) {
    try {
      this.updateProgress(collectionName, 'downloading');
      
      // Buscar do Firebase
      const documents = await this.fetchCollectionFromFirebase(collectionName);
      
      this.updateProgress(collectionName, 'saving');
      
      // Salvar no cache local
      const saved = await this.saveCollectionToCache(collectionName, documents);
      
      this.syncProgress.completed++;
      this.updateProgress(collectionName, 'completed', { saved });
      
      return { success: true, count: saved };
    } catch (error) {
      console.error(`❌ Erro ao sincronizar ${collectionName}:`, error);
      this.syncProgress.errors.push({
        collection: collectionName,
        error: error.message
      });
      this.updateProgress(collectionName, 'error', { error: error.message });
      return { success: false, error: error.message };
    }
  }

  /**
   * Atualiza o progresso e notifica listeners
   */
  updateProgress(collection, status, data = {}) {
    this.syncProgress.current = collection;
    this.syncProgress.status = status;
    
    // Notificar todos os listeners
    this.listeners.forEach(callback => {
      callback({
        ...this.syncProgress,
        collection,
        status,
        ...data
      });
    });
  }

  /**
   * Adiciona um listener para acompanhar o progresso
   */
  onProgress(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Executa a sincronização inicial completa
   */
  async performInitialSync(force = false) {
    try {
      // Verificar se já foi sincronizado recentemente
      if (!force) {
        const status = await this.checkSyncStatus();
        if (status && status.isComplete) {
          return {
            success: true,
            cached: true,
            message: 'Dados já sincronizados',
            lastSync: status.lastSync
          };
        }
      }

      // Inicializar DB
      await this.initDB();

      // Resetar progresso
      this.syncProgress = {
        total: COLLECTIONS.length,
        completed: 0,
        current: '',
        isComplete: false,
        lastSync: null,
        errors: []
      };

      this.updateProgress('', 'starting');

      // Sincronizar todas as coleções
      const results = {};
      for (const collectionName of COLLECTIONS) {
        const result = await this.syncCollection(collectionName);
        results[collectionName] = result;
      }

      // Marcar como completo
      this.syncProgress.isComplete = true;
      this.syncProgress.lastSync = new Date().toISOString();
      
      // Salvar status no localStorage
      localStorage.setItem(SYNC_STATUS_KEY, JSON.stringify({
        isComplete: true,
        lastSync: this.syncProgress.lastSync,
        collections: COLLECTIONS,
        errors: this.syncProgress.errors
      }));

      this.updateProgress('', 'complete');

      return {
        success: true,
        results,
        errors: this.syncProgress.errors,
        timestamp: this.syncProgress.lastSync
      };

    } catch (error) {
      console.error('❌ Erro na sincronização inicial:', error);
      this.updateProgress('', 'error', { error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Busca dados do cache local
   */
  async getFromCache(collectionName, filters = {}) {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([collectionName], 'readonly');
      const store = transaction.objectStore(collectionName);
      const request = store.getAll();

      request.onsuccess = () => {
        let results = request.result || [];
        
        // Aplicar filtros simples
        if (filters.funcionarioId) {
          results = results.filter(item => item.funcionarioId === filters.funcionarioId);
        }
        if (filters.status) {
          results = results.filter(item => item.status === filters.status);
        }
        
        resolve(results);
      };

      request.onerror = () => {
        console.error(`Erro ao buscar ${collectionName}:`, request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Limpa todo o cache
   */
  async clearAllCache() {
    if (!this.db) await this.initDB();

    return new Promise((resolve) => {
      const transaction = this.db.transaction(COLLECTIONS, 'readwrite');
      
      COLLECTIONS.forEach(collectionName => {
        const store = transaction.objectStore(collectionName);
        store.clear();
      });

      transaction.oncomplete = () => {
        localStorage.removeItem(SYNC_STATUS_KEY);
        resolve();
      };
    });
  }
}

// Exportar instância única (Singleton)
const initialSyncService = new InitialSyncService();
export default initialSyncService;
