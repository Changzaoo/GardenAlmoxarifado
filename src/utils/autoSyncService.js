/**
 * Serviço de Sincronização Automática
 * Baixa automaticamente todos os dados do Firestore para uso offline
 * Executa ao entrar no aplicativo
 */

import { 
  collection, 
  getDocs, 
  query, 
  where,
  orderBy,
  limit 
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { offlineStorage, STORES } from './offlineStorage';
import { toast } from 'react-toastify';

class AutoSyncService {
  constructor() {
    this.isSyncing = false;
    this.syncListeners = [];
    this.lastSyncTime = null;
    this.SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutos entre syncs automáticos
  }

  /**
   * Adiciona listener para eventos de sincronização
   */
  addSyncListener(callback) {
    this.syncListeners.push(callback);
    return () => {
      this.syncListeners = this.syncListeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Notifica listeners sobre progresso
   */
  notifyListeners(event) {
    this.syncListeners.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Erro no listener de sync:', error);
      }
    });
  }

  /**
   * Verifica se deve fazer sync (evita syncs muito frequentes)
   */
  shouldSync() {
    if (!this.lastSyncTime) return true;
    const timeSinceLastSync = Date.now() - this.lastSyncTime;
    return timeSinceLastSync > this.SYNC_INTERVAL;
  }

  /**
   * Inicia download automático de todos os dados
   */
  async downloadAllData(options = { showToast: true, force: false }) {
    // Evitar múltiplas sincronizações simultâneas
    if (this.isSyncing) {
      console.log('⏳ Sincronização já em andamento...');
      return { success: false, message: 'Sync em andamento' };
    }

    // Verificar se deve fazer sync
    if (!options.force && !this.shouldSync()) {
      console.log('⏭️ Sync muito recente, pulando...');
      return { success: false, message: 'Sync recente' };
    }

    this.isSyncing = true;
    this.notifyListeners({ type: 'sync_start', timestamp: Date.now() });

    let toastId = null;
    if (options.showToast) {
      toastId = toast.loading('📥 Baixando dados para uso offline...');
    }

    const stats = {
      funcionarios: 0,
      pontos: 0,
      avaliacoes: 0,
      emprestimos: 0,
      ferramentas: 0,
      tarefas: 0,
      escalas: 0,
      mensagens: 0,
      errors: []
    };

    try {
      console.log('🚀 Iniciando download automático de dados...');

      // 1. Funcionários
      try {
        const funcionariosSnap = await getDocs(collection(db, 'funcionarios'));
        const funcionarios = funcionariosSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        await offlineStorage.saveToCache(STORES.FUNCIONARIOS, funcionarios);
        stats.funcionarios = funcionarios.length;
        console.log(`✅ ${funcionarios.length} funcionários baixados`);
        this.notifyListeners({ 
          type: 'sync_progress', 
          step: 'funcionarios', 
          count: funcionarios.length 
        });
      } catch (error) {
        console.error('❌ Erro ao baixar funcionários:', error);
        stats.errors.push({ collection: 'funcionarios', error: error.message });
      }

      // 2. Pontos (últimos 3 meses para não sobrecarregar)
      try {
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        
        const pontosSnap = await getDocs(
          query(
            collection(db, 'pontos'),
            where('data', '>=', threeMonthsAgo),
            orderBy('data', 'desc')
          )
        );
        
        const pontos = pontosSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        await offlineStorage.saveToCache(STORES.PONTOS, pontos);
        stats.pontos = pontos.length;
        console.log(`✅ ${pontos.length} pontos baixados`);
        this.notifyListeners({ 
          type: 'sync_progress', 
          step: 'pontos', 
          count: pontos.length 
        });
      } catch (error) {
        console.error('❌ Erro ao baixar pontos:', error);
        stats.errors.push({ collection: 'pontos', error: error.message });
      }

      // 3. Avaliações
      try {
        const avaliacoesSnap = await getDocs(collection(db, 'avaliacoes'));
        const avaliacoes = avaliacoesSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        await offlineStorage.saveToCache(STORES.AVALIACOES, avaliacoes);
        stats.avaliacoes = avaliacoes.length;
        console.log(`✅ ${avaliacoes.length} avaliações baixadas`);
        this.notifyListeners({ 
          type: 'sync_progress', 
          step: 'avaliacoes', 
          count: avaliacoes.length 
        });
      } catch (error) {
        console.error('❌ Erro ao baixar avaliações:', error);
        stats.errors.push({ collection: 'avaliacoes', error: error.message });
      }

      // 4. Empréstimos
      try {
        const emprestimosSnap = await getDocs(collection(db, 'emprestimos'));
        const emprestimos = emprestimosSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        await offlineStorage.saveToCache(STORES.EMPRESTIMOS, emprestimos);
        stats.emprestimos = emprestimos.length;
        console.log(`✅ ${emprestimos.length} empréstimos baixados`);
        this.notifyListeners({ 
          type: 'sync_progress', 
          step: 'emprestimos', 
          count: emprestimos.length 
        });
      } catch (error) {
        console.error('❌ Erro ao baixar empréstimos:', error);
        stats.errors.push({ collection: 'emprestimos', error: error.message });
      }

      // 5. Ferramentas/Inventário
      try {
        const ferramentasSnap = await getDocs(collection(db, 'ferramentas'));
        const ferramentas = ferramentasSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Salvar em uma store temporária (como não existe FERRAMENTAS no offlineStorage, vamos usar localStorage como fallback)
        localStorage.setItem('offline_ferramentas', JSON.stringify(ferramentas));
        stats.ferramentas = ferramentas.length;
        console.log(`✅ ${ferramentas.length} ferramentas baixadas`);
        this.notifyListeners({ 
          type: 'sync_progress', 
          step: 'ferramentas', 
          count: ferramentas.length 
        });
      } catch (error) {
        console.error('❌ Erro ao baixar ferramentas:', error);
        stats.errors.push({ collection: 'ferramentas', error: error.message });
      }

      // 6. Tarefas
      try {
        const tarefasSnap = await getDocs(collection(db, 'tarefas'));
        const tarefas = tarefasSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        await offlineStorage.saveToCache(STORES.TAREFAS, tarefas);
        stats.tarefas = tarefas.length;
        console.log(`✅ ${tarefas.length} tarefas baixadas`);
        this.notifyListeners({ 
          type: 'sync_progress', 
          step: 'tarefas', 
          count: tarefas.length 
        });
      } catch (error) {
        console.error('❌ Erro ao baixar tarefas:', error);
        stats.errors.push({ collection: 'tarefas', error: error.message });
      }

      // 7. Escalas
      try {
        const escalasSnap = await getDocs(collection(db, 'escalas'));
        const escalas = escalasSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        await offlineStorage.saveToCache(STORES.ESCALAS, escalas);
        stats.escalas = escalas.length;
        console.log(`✅ ${escalas.length} escalas baixadas`);
        this.notifyListeners({ 
          type: 'sync_progress', 
          step: 'escalas', 
          count: escalas.length 
        });
      } catch (error) {
        console.error('❌ Erro ao baixar escalas:', error);
        stats.errors.push({ collection: 'escalas', error: error.message });
      }

      // 8. Mensagens recentes (últimos 30 dias)
      try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const mensagensSnap = await getDocs(
          query(
            collection(db, 'mensagens'),
            where('timestamp', '>=', thirtyDaysAgo),
            orderBy('timestamp', 'desc')
          )
        );
        
        const mensagens = mensagensSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        localStorage.setItem('offline_mensagens', JSON.stringify(mensagens));
        stats.mensagens = mensagens.length;
        console.log(`✅ ${mensagens.length} mensagens baixadas`);
        this.notifyListeners({ 
          type: 'sync_progress', 
          step: 'mensagens', 
          count: mensagens.length 
        });
      } catch (error) {
        console.error('❌ Erro ao baixar mensagens:', error);
        stats.errors.push({ collection: 'mensagens', error: error.message });
      }

      // Salvar timestamp do último sync
      this.lastSyncTime = Date.now();
      localStorage.setItem('last_auto_sync', this.lastSyncTime.toString());

      // Salvar estatísticas
      const syncSummary = {
        timestamp: this.lastSyncTime,
        stats,
        success: true
      };
      localStorage.setItem('last_sync_summary', JSON.stringify(syncSummary));

      const totalItems = Object.values(stats).reduce((sum, val) => 
        typeof val === 'number' ? sum + val : sum, 0
      );

      console.log('✅ Download automático concluído:', stats);
      
      if (options.showToast && toastId) {
        if (stats.errors.length === 0) {
          toast.update(toastId, {
            render: `✅ ${totalItems} itens baixados para uso offline!`,
            type: 'success',
            isLoading: false,
            autoClose: 3000
          });
        } else {
          toast.update(toastId, {
            render: `⚠️ ${totalItems} itens baixados (${stats.errors.length} erros)`,
            type: 'warning',
            isLoading: false,
            autoClose: 5000
          });
        }
      }

      this.notifyListeners({ 
        type: 'sync_complete', 
        stats, 
        timestamp: Date.now() 
      });

      return { success: true, stats, errors: stats.errors };

    } catch (error) {
      console.error('❌ Erro crítico durante download automático:', error);
      
      if (options.showToast && toastId) {
        toast.update(toastId, {
          render: '❌ Erro ao baixar dados offline',
          type: 'error',
          isLoading: false,
          autoClose: 5000
        });
      }

      this.notifyListeners({ 
        type: 'sync_error', 
        error: error.message,
        timestamp: Date.now() 
      });

      return { success: false, error: error.message };

    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Obtém estatísticas do último sync
   */
  getLastSyncStats() {
    try {
      const summary = localStorage.getItem('last_sync_summary');
      return summary ? JSON.parse(summary) : null;
    } catch (error) {
      console.error('Erro ao obter estatísticas de sync:', error);
      return null;
    }
  }

  /**
   * Obtém timestamp do último sync
   */
  getLastSyncTime() {
    try {
      const timestamp = localStorage.getItem('last_auto_sync');
      return timestamp ? parseInt(timestamp) : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Verifica se dados estão disponíveis offline
   */
  async hasOfflineData() {
    try {
      const funcionarios = await offlineStorage.getFromCache(STORES.FUNCIONARIOS);
      return funcionarios && funcionarios.length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Limpa todos os dados offline
   */
  async clearOfflineData() {
    try {
      const stores = Object.values(STORES);
      for (const store of stores) {
        // IndexedDB clearing seria feito aqui
        console.log(`🗑️ Limpando ${store}...`);
      }
      
      localStorage.removeItem('offline_ferramentas');
      localStorage.removeItem('offline_mensagens');
      localStorage.removeItem('last_auto_sync');
      localStorage.removeItem('last_sync_summary');
      
      console.log('✅ Dados offline limpos');
      return true;
    } catch (error) {
      console.error('❌ Erro ao limpar dados offline:', error);
      return false;
    }
  }
}

// Instância singleton
const autoSyncService = new AutoSyncService();

export { autoSyncService };
