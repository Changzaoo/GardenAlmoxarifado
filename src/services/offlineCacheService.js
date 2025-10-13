import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';

/**
 * Serviço para fazer pre-cache de coleções do Firebase
 * Baixa dados na primeira vez que o usuário faz login para uso offline
 */
class OfflineCacheService {
  constructor() {
    this.cacheKey = 'firebase_cache_timestamp';
    this.cacheDuration = 24 * 60 * 60 * 1000; // 24 horas
  }

  /**
   * Verifica se o cache precisa ser atualizado
   */
  needsCacheUpdate() {
    const lastCache = localStorage.getItem(this.cacheKey);
    if (!lastCache) return true;
    
    const timeSinceCache = Date.now() - parseInt(lastCache);
    return timeSinceCache > this.cacheDuration;
  }

  /**
   * Faz pre-fetch de uma coleção específica
   */
  async preloadCollection(collectionName, collectionQuery = null) {
    try {
      const collectionRef = collection(db, collectionName);
      const q = collectionQuery || collectionRef;
      
      // getDocs automaticamente armazena no cache do Firestore
      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error(`❌ Error caching ${collectionName}:`, error);
      return 0;
    }
  }

  /**
   * Pre-carrega todas as coleções principais do sistema
   * Chamado após login bem-sucedido
   */
  async preloadAllCollections(usuario = null) {
    try {
      const collections = [
        'funcionarios',
        'ferramentas',
        'emprestimos',
        'usuarios',
        'ferramentas_danificadas',
        'ferramentas_perdidas',
        'pontos_trabalho',
        'mensagens'
      ];

      // Pre-carregar coleções em paralelo para maior velocidade
      const promises = collections.map(name => this.preloadCollection(name));
      const results = await Promise.all(promises);
      
      const totalDocs = results.reduce((sum, count) => sum + count, 0);
      
      // Atualizar timestamp do cache
      localStorage.setItem(this.cacheKey, Date.now().toString());
      return {
        success: true,
        totalDocs,
        collections: collections.length
      };
    } catch (error) {
      console.error('❌ Erro ao fazer pre-cache:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Atualiza o cache de uma coleção específica
   */
  async updateCache(collectionName) {
    await this.preloadCollection(collectionName);
  }

  /**
   * Limpa todos os dados de cache
   */
  clearCache() {
    localStorage.removeItem(this.cacheKey);
  }

  /**
   * Obtém informações sobre o cache
   */
  getCacheInfo() {
    const timestamp = localStorage.getItem(this.cacheKey);
    if (!timestamp) {
      return {
        cached: false,
        message: 'Cache vazio'
      };
    }

    const cacheDate = new Date(parseInt(timestamp));
    const hoursAgo = Math.floor((Date.now() - parseInt(timestamp)) / (1000 * 60 * 60));
    
    return {
      cached: true,
      lastUpdate: cacheDate.toLocaleString('pt-BR'),
      hoursAgo,
      needsUpdate: this.needsCacheUpdate()
    };
  }
}

// Exportar instância singleton
const offlineCacheService = new OfflineCacheService();
export default offlineCacheService;
