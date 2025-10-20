/**
 * Sistema Global de Otimização de Carregamento de Dados
 * 
 * Este módulo fornece funções otimizadas para carregamento rápido de dados do Firestore
 * Implementa:
 * - Carregamento paralelo com Promise.all
 * - Cache em memória com TTL
 * - Pré-carregamento inteligente
 * - Lazy loading
 * - Batch reads
 * - Índices otimizados
 */

import { 
  collection, 
  getDocs, 
  getDoc,
  doc,
  query, 
  where, 
  orderBy, 
  limit,
  startAfter,
  documentId
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

// ==================== CACHE SYSTEM ====================

class DataCache {
  constructor() {
    this.cache = new Map();
    this.timestamps = new Map();
    this.TTL = 5 * 60 * 1000; // 5 minutos padrão
  }

  set(key, value, ttl = this.TTL) {
    this.cache.set(key, value);
    this.timestamps.set(key, Date.now() + ttl);
  }

  get(key) {
    const timestamp = this.timestamps.get(key);
    if (!timestamp || Date.now() > timestamp) {
      this.cache.delete(key);
      this.timestamps.delete(key);
      return null;
    }
    return this.cache.get(key);
  }

  has(key) {
    return this.get(key) !== null;
  }

  invalidate(key) {
    this.cache.delete(key);
    this.timestamps.delete(key);
  }

  invalidatePattern(pattern) {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.invalidate(key);
      }
    }
  }

  clear() {
    this.cache.clear();
    this.timestamps.clear();
  }

  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

const globalCache = new DataCache();

// ==================== PARALLEL LOADING ====================

/**
 * Carrega múltiplas coleções em paralelo
 * @param {Array<{name: string, query?: any}>} collections - Array de coleções para carregar
 * @param {Object} options - Opções de cache e timeout
 * @returns {Promise<Object>} - Objeto com dados de todas as coleções
 */
export const loadCollectionsParallel = async (collections, options = {}) => {
  const { 
    useCache = true, 
    cacheTTL = 5 * 60 * 1000,
    timeout = 10000 
  } = options;

  console.time('⚡ Carregamento Paralelo');

  try {
    const promises = collections.map(async ({ name, query: customQuery, transform }) => {
      const cacheKey = `collection_${name}_${customQuery ? JSON.stringify(customQuery) : 'all'}`;

      // Verificar cache
      if (useCache && globalCache.has(cacheKey)) {
        console.log(`📦 Cache HIT: ${name}`);
        return { name, data: globalCache.get(cacheKey), fromCache: true };
      }

      // Buscar do Firestore
      console.log(`🔍 Carregando ${name}...`);
      const startTime = Date.now();

      let snapshot;
      if (customQuery) {
        snapshot = await getDocs(customQuery);
      } else {
        snapshot = await getDocs(collection(db, name));
      }

      let data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Aplicar transformação se fornecida
      if (transform && typeof transform === 'function') {
        data = transform(data);
      }

      const loadTime = Date.now() - startTime;
      console.log(`✅ ${name} carregado em ${loadTime}ms (${data.length} docs)`);

      // Salvar no cache
      if (useCache) {
        globalCache.set(cacheKey, data, cacheTTL);
      }

      return { name, data, fromCache: false, loadTime };
    });

    // Executar todas as queries em paralelo com timeout
    const results = await Promise.race([
      Promise.all(promises),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout ao carregar dados')), timeout)
      )
    ]);

    console.timeEnd('⚡ Carregamento Paralelo');

    // Converter array de resultados em objeto
    const resultObject = {};
    const stats = {
      total: results.length,
      fromCache: 0,
      fromFirestore: 0,
      totalLoadTime: 0
    };

    results.forEach(({ name, data, fromCache, loadTime }) => {
      resultObject[name] = data;
      if (fromCache) {
        stats.fromCache++;
      } else {
        stats.fromFirestore++;
        stats.totalLoadTime += loadTime || 0;
      }
    });

    console.log('📊 Stats:', stats);

    return { data: resultObject, stats };

  } catch (error) {
    console.error('❌ Erro no carregamento paralelo:', error);
    throw error;
  }
};

// ==================== BATCH READS ====================

/**
 * Carrega múltiplos documentos por ID em batch
 * Mais eficiente que múltiplos getDoc individuais
 */
export const loadDocumentsBatch = async (collectionName, docIds, options = {}) => {
  const { useCache = true, cacheTTL = 5 * 60 * 1000 } = options;

  if (!docIds || docIds.length === 0) return [];

  console.time(`⚡ Batch load ${collectionName}`);

  try {
    // Verificar cache primeiro
    const cachedDocs = [];
    const uncachedIds = [];

    docIds.forEach(id => {
      const cacheKey = `doc_${collectionName}_${id}`;
      if (useCache && globalCache.has(cacheKey)) {
        cachedDocs.push(globalCache.get(cacheKey));
      } else {
        uncachedIds.push(id);
      }
    });

    console.log(`📦 Cache: ${cachedDocs.length}/${docIds.length}`);

    // Se todos estão no cache, retornar
    if (uncachedIds.length === 0) {
      console.timeEnd(`⚡ Batch load ${collectionName}`);
      return cachedDocs;
    }

    // Carregar os que não estão no cache (batch de até 10 por vez - limitação do Firestore)
    const batchSize = 10;
    const batches = [];
    for (let i = 0; i < uncachedIds.length; i += batchSize) {
      batches.push(uncachedIds.slice(i, i + batchSize));
    }

    const batchResults = await Promise.all(
      batches.map(async (batch) => {
        const q = query(
          collection(db, collectionName),
          where(documentId(), 'in', batch)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      })
    );

    const newDocs = batchResults.flat();

    // Salvar no cache
    if (useCache) {
      newDocs.forEach(doc => {
        const cacheKey = `doc_${collectionName}_${doc.id}`;
        globalCache.set(cacheKey, doc, cacheTTL);
      });
    }

    console.timeEnd(`⚡ Batch load ${collectionName}`);

    return [...cachedDocs, ...newDocs];

  } catch (error) {
    console.error(`❌ Erro no batch load de ${collectionName}:`, error);
    throw error;
  }
};

// ==================== LAZY LOADING / PAGINATION ====================

/**
 * Carrega dados com paginação para grandes coleções
 */
export const loadPaginated = async (collectionName, options = {}) => {
  const {
    pageSize = 50,
    orderByField = 'criadoEm',
    orderDirection = 'desc',
    filters = [],
    lastDoc = null
  } = options;

  try {
    let q = collection(db, collectionName);

    // Aplicar filtros
    filters.forEach(({ field, operator, value }) => {
      q = query(q, where(field, operator, value));
    });

    // Ordenação
    q = query(q, orderBy(orderByField, orderDirection));

    // Paginação
    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    q = query(q, limit(pageSize));

    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const lastVisible = snapshot.docs[snapshot.docs.length - 1];

    return {
      data,
      lastDoc: lastVisible,
      hasMore: data.length === pageSize
    };

  } catch (error) {
    console.error(`❌ Erro ao carregar página de ${collectionName}:`, error);
    throw error;
  }
};

// ==================== PRÉ-CARREGAMENTO INTELIGENTE ====================

/**
 * Pré-carrega dados que provavelmente serão necessários
 */
export const preloadData = async (collections) => {
  console.log('🚀 Pré-carregando dados...');
  
  const promises = collections.map(async ({ name, query: customQuery }) => {
    try {
      const cacheKey = `collection_${name}_preload`;
      
      if (globalCache.has(cacheKey)) {
        return;
      }

      const snapshot = await getDocs(customQuery || collection(db, name));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      globalCache.set(cacheKey, data);
      console.log(`✅ Pré-carregado: ${name} (${data.length} docs)`);
    } catch (error) {
      console.warn(`⚠️ Erro ao pré-carregar ${name}:`, error);
    }
  });

  await Promise.allSettled(promises);
  console.log('🎉 Pré-carregamento concluído');
};

// ==================== UTILITIES ====================

/**
 * Limpa cache seletivamente
 */
export const invalidateCache = (pattern) => {
  if (pattern) {
    globalCache.invalidatePattern(pattern);
    console.log(`🧹 Cache invalidado: ${pattern}`);
  } else {
    globalCache.clear();
    console.log('🧹 Cache totalmente limpo');
  }
};

/**
 * Obtém estatísticas do cache
 */
export const getCacheStats = () => {
  return globalCache.getStats();
};

/**
 * Carrega coleção única com cache
 */
export const loadCollection = async (collectionName, options = {}) => {
  const { useCache = true, cacheTTL, transform, filters = [] } = options;
  
  const cacheKey = `collection_${collectionName}_${JSON.stringify(filters)}`;

  if (useCache && globalCache.has(cacheKey)) {
    console.log(`📦 Cache HIT: ${collectionName}`);
    return globalCache.get(cacheKey);
  }

  console.time(`⚡ Load ${collectionName}`);

  try {
    let q = collection(db, collectionName);

    // Aplicar filtros
    filters.forEach(({ field, operator, value }) => {
      q = query(q, where(field, operator, value));
    });

    const snapshot = await getDocs(q);
    let data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Aplicar transformação
    if (transform) {
      data = transform(data);
    }

    if (useCache) {
      globalCache.set(cacheKey, data, cacheTTL);
    }

    console.timeEnd(`⚡ Load ${collectionName}`);
    console.log(`✅ ${collectionName}: ${data.length} documentos`);

    return data;

  } catch (error) {
    console.error(`❌ Erro ao carregar ${collectionName}:`, error);
    throw error;
  }
};

// ==================== EXPORTS ====================

export {
  globalCache,
  DataCache
};

export default {
  loadCollectionsParallel,
  loadDocumentsBatch,
  loadPaginated,
  preloadData,
  invalidateCache,
  getCacheStats,
  loadCollection
};
