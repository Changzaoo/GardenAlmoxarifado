/**
 * Adaptador offline para operações Firestore
 * Redireciona para cache quando offline e sincroniza quando online
 */

import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  doc,
  query,
  where,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { offlineStorage, STORES } from './offlineStorage';
import { syncManager } from './syncManager';

// Mapeamento de coleções Firestore para stores locais
const COLLECTION_TO_STORE = {
  'funcionarios': STORES.FUNCIONARIOS,
  'pontos': STORES.PONTOS,
  'avaliacoes': STORES.AVALIACOES,
  'emprestimos': STORES.EMPRESTIMOS,
  'tarefas': STORES.TAREFAS,
  'escalas': STORES.ESCALAS
};

class FirestoreOfflineAdapter {
  constructor() {
    this.isOnline = navigator.onLine;
    this.listeners = new Map(); // Guarda listeners ativos
    
    // Monitorar mudanças de conexão
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('🟢 Adapter: Conexão restaurada');
      this.handleReconnection();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('🔴 Adapter: Modo offline ativado');
    });
  }

  /**
   * Quando reconectar, sincronizar dados
   */
  async handleReconnection() {
    try {
      await syncManager.startSync();
      
      // Atualizar todos os listeners ativos
      for (const [key, listenerData] of this.listeners) {
        await this.refreshListener(key, listenerData);
      }
    } catch (error) {
      console.error('Erro ao reconectar:', error);
    }
  }

  /**
   * Adiciona documento (online ou offline)
   */
  async addDocument(collectionName, data) {
    const storeName = COLLECTION_TO_STORE[collectionName];
    
    if (this.isOnline) {
      try {
        // Tentar adicionar no Firestore
        const docRef = await addDoc(collection(db, collectionName), {
          ...data,
          createdAt: serverTimestamp()
        });
        
        // Salvar no cache também
        const docData = { ...data, id: docRef.id };
        await offlineStorage.saveToCache(storeName, docData);
        
        console.log(`✅ Documento adicionado online: ${docRef.id}`);
        return docRef.id;
      } catch (error) {
        console.error('Erro ao adicionar documento online:', error);
        // Se falhar, tratar como offline
        this.isOnline = false;
      }
    }
    
    // Modo offline: gerar ID temporário e salvar localmente
    const tempId = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const docData = { ...data, id: tempId, _offline: true };
    
    await offlineStorage.saveToCache(storeName, docData);
    await offlineStorage.addToSyncQueue({
      type: 'add',
      collection: collectionName,
      data: docData
    });
    
    console.log(`💾 Documento salvo offline: ${tempId}`);
    return tempId;
  }

  /**
   * Atualiza documento (online ou offline)
   */
  async updateDocument(collectionName, docId, data) {
    const storeName = COLLECTION_TO_STORE[collectionName];
    
    if (this.isOnline) {
      try {
        // Atualizar no Firestore
        const docRef = doc(db, collectionName, docId);
        await updateDoc(docRef, {
          ...data,
          updatedAt: serverTimestamp()
        });
        
        // Atualizar cache local
        const cachedDoc = await offlineStorage.getFromCache(storeName, docId);
        if (cachedDoc) {
          await offlineStorage.saveToCache(storeName, {
            ...cachedDoc,
            ...data
          });
        }
        
        console.log(`✅ Documento atualizado online: ${docId}`);
        return;
      } catch (error) {
        console.error('Erro ao atualizar documento online:', error);
        this.isOnline = false;
      }
    }
    
    // Modo offline
    const cachedDoc = await offlineStorage.getFromCache(storeName, docId);
    if (cachedDoc) {
      await offlineStorage.saveToCache(storeName, {
        ...cachedDoc,
        ...data,
        _offline: true
      });
      
      await offlineStorage.addToSyncQueue({
        type: 'update',
        collection: collectionName,
        data: { id: docId, ...data }
      });
      
      console.log(`💾 Documento atualizado offline: ${docId}`);
    }
  }

  /**
   * Deleta documento (online ou offline)
   */
  async deleteDocument(collectionName, docId) {
    const storeName = COLLECTION_TO_STORE[collectionName];
    
    if (this.isOnline) {
      try {
        // Deletar do Firestore
        const docRef = doc(db, collectionName, docId);
        await deleteDoc(docRef);
        
        // Deletar do cache
        await offlineStorage.deleteFromCache(storeName, docId);
        
        console.log(`✅ Documento deletado online: ${docId}`);
        return;
      } catch (error) {
        console.error('Erro ao deletar documento online:', error);
        this.isOnline = false;
      }
    }
    
    // Modo offline
    await offlineStorage.deleteFromCache(storeName, docId);
    await offlineStorage.addToSyncQueue({
      type: 'delete',
      collection: collectionName,
      data: { id: docId }
    });
    
    console.log(`💾 Documento marcado para deletar offline: ${docId}`);
  }

  /**
   * Busca documentos (online ou offline)
   */
  async getDocuments(collectionName, filters = null) {
    const storeName = COLLECTION_TO_STORE[collectionName];
    
    if (this.isOnline) {
      try {
        // Buscar do Firestore
        let q = collection(db, collectionName);
        
        if (filters) {
          q = query(q, where(filters.field, filters.operator, filters.value));
        }
        
        const snapshot = await getDocs(q);
        const docs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Atualizar cache local
        await offlineStorage.saveToCache(storeName, docs);
        
        console.log(`✅ ${docs.length} documento(s) carregado(s) online`);
        return docs;
      } catch (error) {
        console.error('Erro ao buscar documentos online:', error);
        this.isOnline = false;
      }
    }
    
    // Modo offline: buscar do cache
    const docs = await offlineStorage.getFromCache(storeName);
    
    // Aplicar filtros manualmente se necessário
    if (filters) {
      const filtered = docs.filter(doc => {
        const fieldValue = doc[filters.field];
        switch (filters.operator) {
          case '==':
            return fieldValue === filters.value;
          case '!=':
            return fieldValue !== filters.value;
          case '>':
            return fieldValue > filters.value;
          case '<':
            return fieldValue < filters.value;
          case '>=':
            return fieldValue >= filters.value;
          case '<=':
            return fieldValue <= filters.value;
          default:
            return true;
        }
      });
      console.log(`💾 ${filtered.length} documento(s) carregado(s) do cache (filtrado)`);
      return filtered;
    }
    
    console.log(`💾 ${docs.length} documento(s) carregado(s) do cache`);
    return docs;
  }

  /**
   * Listener em tempo real (hybrid: online usa Firestore, offline usa cache)
   */
  onSnapshotHybrid(collectionName, filters = null, callback) {
    const listenerKey = `${collectionName}_${JSON.stringify(filters)}`;
    const storeName = COLLECTION_TO_STORE[collectionName];
    
    if (this.isOnline) {
      try {
        // Listener do Firestore
        let q = collection(db, collectionName);
        
        if (filters) {
          q = query(q, where(filters.field, filters.operator, filters.value));
        }
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
          const docs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          // Atualizar cache
          offlineStorage.saveToCache(storeName, docs);
          
          // Notificar callback
          callback(docs);
        });
        
        // Guardar referência do listener
        this.listeners.set(listenerKey, {
          collectionName,
          filters,
          callback,
          unsubscribe
        });
        
        return unsubscribe;
      } catch (error) {
        console.error('Erro ao criar listener online:', error);
        this.isOnline = false;
      }
    }
    
    // Modo offline: retornar dados do cache imediatamente
    offlineStorage.getFromCache(storeName).then(docs => {
      if (filters) {
        const filtered = docs.filter(doc => {
          const fieldValue = doc[filters.field];
          return fieldValue === filters.value; // Simplificado
        });
        callback(filtered);
      } else {
        callback(docs);
      }
    });
    
    // Guardar referência do listener (sem unsubscribe real)
    this.listeners.set(listenerKey, {
      collectionName,
      filters,
      callback,
      unsubscribe: () => this.listeners.delete(listenerKey)
    });
    
    return () => this.listeners.delete(listenerKey);
  }

  /**
   * Atualiza um listener quando reconectar
   */
  async refreshListener(key, listenerData) {
    const { collectionName, filters, callback } = listenerData;
    
    try {
      const docs = await this.getDocuments(collectionName, filters);
      callback(docs);
    } catch (error) {
      console.error('Erro ao atualizar listener:', error);
    }
  }

  /**
   * Remove todos os listeners
   */
  clearAllListeners() {
    for (const [key, listenerData] of this.listeners) {
      if (listenerData.unsubscribe) {
        listenerData.unsubscribe();
      }
    }
    this.listeners.clear();
  }
}

// Instância singleton
const firestoreAdapter = new FirestoreOfflineAdapter();

export { firestoreAdapter };
