/**
 * Hook Otimizado para Carregamento Rápido de Dados
 * 
 * Usa o sistema fastDataLoader para carregamento paralelo,
 * cache em memória e otimizações de performance
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import fastDataLoader, { invalidateCache } from '../utils/fastDataLoader';

/**
 * Hook para carregar múltiplas coleções em paralelo com cache
 * 
 * @param {Array} collections - Lista de coleções para carregar
 * @param {Object} options - Opções de carregamento
 * @returns {Object} - { data, loading, error, reload }
 */
export const useFastCollections = (collections, options = {}) => {
  const {
    autoLoad = true,
    useCache = true,
    cacheTTL = 5 * 60 * 1000,
    onSuccess,
    onError
  } = options;

  const [data, setData] = useState({});
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const isMountedRef = useRef(true);

  const load = useCallback(async () => {
    if (!collections || collections.length === 0) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🚀 useFastCollections: Iniciando carregamento...');
      const result = await fastDataLoader.loadCollectionsParallel(collections, {
        useCache,
        cacheTTL
      });

      if (isMountedRef.current) {
        setData(result.data);
        setStats(result.stats);
        setLoading(false);

        if (onSuccess) {
          onSuccess(result.data);
        }

        console.log('✅ useFastCollections: Carregamento concluído');
      }
    } catch (err) {
      console.error('❌ useFastCollections: Erro no carregamento:', err);
      
      if (isMountedRef.current) {
        setError(err);
        setLoading(false);

        if (onError) {
          onError(err);
        }
      }
    }
  }, [collections, useCache, cacheTTL, onSuccess, onError]);

  useEffect(() => {
    isMountedRef.current = true;

    if (autoLoad) {
      load();
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [autoLoad, load]);

  const reload = useCallback(async (clearCache = false) => {
    if (clearCache) {
      collections.forEach(({ name }) => {
        invalidateCache(`collection_${name}`);
      });
    }
    await load();
  }, [load, collections]);

  return {
    data,
    loading,
    error,
    reload,
    stats
  };
};

/**
 * Hook para carregar uma coleção única com cache
 * 
 * @param {string} collectionName - Nome da coleção
 * @param {Object} options - Opções de carregamento
 * @returns {Object} - { data, loading, error, reload }
 */
export const useFastCollection = (collectionName, options = {}) => {
  const {
    autoLoad = true,
    useCache = true,
    cacheTTL = 5 * 60 * 1000,
    filters = [],
    transform,
    onSuccess,
    onError
  } = options;

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState(null);
  const isMountedRef = useRef(true);

  const load = useCallback(async () => {
    if (!collectionName) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log(`🚀 useFastCollection: Carregando ${collectionName}...`);
      const result = await fastDataLoader.loadCollection(collectionName, {
        useCache,
        cacheTTL,
        filters,
        transform
      });

      if (isMountedRef.current) {
        setData(result);
        setLoading(false);

        if (onSuccess) {
          onSuccess(result);
        }

        console.log(`✅ useFastCollection: ${collectionName} carregado`);
      }
    } catch (err) {
      console.error(`❌ useFastCollection: Erro ao carregar ${collectionName}:`, err);
      
      if (isMountedRef.current) {
        setError(err);
        setLoading(false);

        if (onError) {
          onError(err);
        }
      }
    }
  }, [collectionName, useCache, cacheTTL, filters, transform, onSuccess, onError]);

  useEffect(() => {
    isMountedRef.current = true;

    if (autoLoad) {
      load();
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [autoLoad, load]);

  const reload = useCallback(async (clearCache = false) => {
    if (clearCache) {
      invalidateCache(`collection_${collectionName}`);
    }
    await load();
  }, [load, collectionName]);

  return {
    data,
    loading,
    error,
    reload
  };
};

/**
 * Hook para carregamento paginado (lazy loading)
 * 
 * @param {string} collectionName - Nome da coleção
 * @param {Object} options - Opções de paginação
 * @returns {Object} - { data, loading, error, loadMore, hasMore }
 */
export const usePaginatedCollection = (collectionName, options = {}) => {
  const {
    pageSize = 50,
    orderByField = 'criadoEm',
    orderDirection = 'desc',
    filters = [],
    autoLoad = true
  } = options;

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const lastDocRef = useRef(null);
  const isMountedRef = useRef(true);

  const load = useCallback(async (isLoadMore = false) => {
    if (!collectionName) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fastDataLoader.loadPaginated(collectionName, {
        pageSize,
        orderByField,
        orderDirection,
        filters,
        lastDoc: isLoadMore ? lastDocRef.current : null
      });

      if (isMountedRef.current) {
        setData(prev => isLoadMore ? [...prev, ...result.data] : result.data);
        lastDocRef.current = result.lastDoc;
        setHasMore(result.hasMore);
        setLoading(false);
      }
    } catch (err) {
      console.error(`❌ Erro ao carregar página de ${collectionName}:`, err);
      
      if (isMountedRef.current) {
        setError(err);
        setLoading(false);
      }
    }
  }, [collectionName, pageSize, orderByField, orderDirection, filters]);

  useEffect(() => {
    isMountedRef.current = true;

    if (autoLoad) {
      load(false);
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [autoLoad, load]);

  const loadMore = useCallback(async () => {
    if (!loading && hasMore) {
      await load(true);
    }
  }, [loading, hasMore, load]);

  const reload = useCallback(async () => {
    lastDocRef.current = null;
    await load(false);
  }, [load]);

  return {
    data,
    loading,
    error,
    loadMore,
    hasMore,
    reload
  };
};

/**
 * Hook para pré-carregar dados em background
 * 
 * @param {Array} collections - Coleções para pré-carregar
 */
export const usePreloadData = (collections) => {
  useEffect(() => {
    if (collections && collections.length > 0) {
      // Pré-carregar após um pequeno delay para não competir com carregamento principal
      const timer = setTimeout(() => {
        fastDataLoader.preloadData(collections);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [collections]);
};

export default {
  useFastCollections,
  useFastCollection,
  usePaginatedCollection,
  usePreloadData
};
