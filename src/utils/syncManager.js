/**
 * Gerenciador de sincronização de dados offline
 * Processa fila de operações quando a conexão é restaurada
 */

import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { offlineStorage, STORES } from './offlineStorage';
import { toast } from 'react-toastify';

class SyncManager {
  constructor() {
    this.isSyncing = false;
    this.syncListeners = [];
  }

  /**
   * Adiciona listener para eventos de sincronização
   */
  addSyncListener(callback) {
    this.syncListeners.push(callback);
  }

  /**
   * Notifica listeners sobre progresso da sincronização
   */
  notifyListeners(event) {
    this.syncListeners.forEach(callback => callback(event));
  }

  /**
   * Inicia processo de sincronização
   */
  async startSync() {
    if (this.isSyncing) {
      console.log('⏳ Sincronização já em andamento...');
      return;
    }

    this.isSyncing = true;
    this.notifyListeners({ type: 'sync_start' });

    try {
      const pendingOps = await offlineStorage.getPendingSync();
      
      if (pendingOps.length === 0) {
        console.log('✅ Nenhuma operação pendente para sincronizar');
        this.isSyncing = false;
        this.notifyListeners({ type: 'sync_complete', operations: 0 });
        return;
      }

      console.log(`🔄 Iniciando sincronização de ${pendingOps.length} operação(ões)...`);
      const toastId = toast.loading(`Sincronizando ${pendingOps.length} operação(ões)...`);

      let successCount = 0;
      let errorCount = 0;

      // Processar operações em ordem cronológica
      const sortedOps = pendingOps.sort((a, b) => a.timestamp - b.timestamp);

      for (const op of sortedOps) {
        try {
          await this.processOperation(op);
          await offlineStorage.markAsSynced(op.id);
          successCount++;
          
          this.notifyListeners({
            type: 'sync_progress',
            current: successCount + errorCount,
            total: pendingOps.length
          });
        } catch (error) {
          console.error(`❌ Erro ao sincronizar operação ${op.id}:`, error);
          errorCount++;
          
          // Incrementar contador de tentativas
          op.retries = (op.retries || 0) + 1;
          
          // Se falhou muitas vezes, marcar como erro permanente
          if (op.retries >= 3) {
            op.permanentError = true;
            op.error = error.message;
            await offlineStorage.saveToCache(STORES.SYNC_QUEUE, op);
            console.error(`💥 Operação ${op.id} falhou após 3 tentativas`);
          }
        }
      }

      // Limpar operações antigas
      await offlineStorage.cleanOldSyncQueue();

      // Atualizar toast
      if (errorCount === 0) {
        toast.update(toastId, {
          render: `✅ ${successCount} operação(ões) sincronizada(s)!`,
          type: 'success',
          isLoading: false,
          autoClose: 3000
        });
      } else {
        toast.update(toastId, {
          render: `⚠️ ${successCount} sincronizada(s), ${errorCount} falha(s)`,
          type: 'warning',
          isLoading: false,
          autoClose: 5000
        });
      }

      console.log(`✅ Sincronização concluída: ${successCount} sucesso, ${errorCount} erros`);
      this.notifyListeners({
        type: 'sync_complete',
        operations: successCount,
        errors: errorCount
      });

    } catch (error) {
      console.error('❌ Erro durante sincronização:', error);
      toast.error('Erro ao sincronizar dados');
      this.notifyListeners({ type: 'sync_error', error });
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Processa uma operação individual
   */
  async processOperation(op) {
    console.log(`🔄 Processando: ${op.operation} em ${op.collection}`, op.data);

    const collectionRef = collection(db, op.collection);

    switch (op.operation) {
      case 'add':
        const newDoc = await addDoc(collectionRef, {
          ...op.data,
          createdAt: serverTimestamp()
        });
        console.log(`✅ Documento adicionado: ${newDoc.id}`);
        
        // Atualizar ID no cache local se necessário
        if (op.data.id && op.data.id !== newDoc.id) {
          await this.updateLocalId(op.collection, op.data.id, newDoc.id);
        }
        break;

      case 'update':
        const docRef = doc(db, op.collection, op.data.id);
        await updateDoc(docRef, {
          ...op.data,
          updatedAt: serverTimestamp()
        });
        console.log(`✅ Documento atualizado: ${op.data.id}`);
        break;

      case 'delete':
        const deleteRef = doc(db, op.collection, op.data.id);
        await deleteDoc(deleteRef);
        console.log(`✅ Documento deletado: ${op.data.id}`);
        break;

      default:
        throw new Error(`Operação desconhecida: ${op.operation}`);
    }
  }

  /**
   * Atualiza ID temporário offline com ID do Firestore
   */
  async updateLocalId(storeName, oldId, newId) {
    try {
      const storeMap = {
        'funcionarios': STORES.FUNCIONARIOS,
        'pontos': STORES.PONTOS,
        'avaliacoes': STORES.AVALIACOES,
        'emprestimos': STORES.EMPRESTIMOS,
        'tarefas': STORES.TAREFAS,
        'escalas': STORES.ESCALAS
      };

      const store = storeMap[storeName];
      if (!store) return;

      const item = await offlineStorage.getFromCache(store, oldId);
      if (item) {
        await offlineStorage.deleteFromCache(store, oldId);
        item.id = newId;
        await offlineStorage.saveToCache(store, item);
        console.log(`🔄 ID atualizado: ${oldId} → ${newId}`);
      }
    } catch (error) {
      console.error('Erro ao atualizar ID local:', error);
    }
  }

  /**
   * Verifica se há operações pendentes
   */
  async hasPendingOperations() {
    const pending = await offlineStorage.getPendingSync();
    return pending.length > 0;
  }

  /**
   * Retorna contagem de operações pendentes
   */
  async getPendingCount() {
    const pending = await offlineStorage.getPendingSync();
    return pending.length;
  }
}

// Instância singleton
const syncManager = new SyncManager();

export { syncManager };
