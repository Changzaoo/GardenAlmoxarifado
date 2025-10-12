import { useState, useEffect, useRef, useCallback } from 'react';
import { onSnapshot } from 'firebase/firestore';

/**
 * Hook otimizado para queries do Firebase
 * Gerencia automaticamente cleanup e previne memory leaks
 * @param {Query} query - Query do Firestore
 * @param {Object} options - Opções de configuração
 * @returns {Object} { data, loading, error, refetch }
 */
export const useFirestoreQuery = (query, options = {}) => {
  const {
    initialData = null,
    transform = (doc) => ({ id: doc.id, ...doc.data() }),
    listen = false, // Real-time ou one-time fetch
    onError = console.error,
  } = options;

  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const unsubscribeRef = useRef(null);
  const isMountedRef = useRef(true);

  // Cleanup quando componente desmonta
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  // Função para fazer fetch
  const fetchData = useCallback(async () => {
    if (!query) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      if (listen) {
        // Real-time listener
        unsubscribeRef.current = onSnapshot(
          query,
          (snapshot) => {
            if (!isMountedRef.current) return;

            const results = snapshot.docs.map(transform);
            setData(results);
            setLoading(false);
          },
          (err) => {
            if (!isMountedRef.current) return;
            
            console.error('Erro no listener:', err);
            setError(err);
            setLoading(false);
            onError(err);
          }
        );
      } else {
        // One-time fetch
        const { getDocs } = await import('firebase/firestore');
        const snapshot = await getDocs(query);
        
        if (!isMountedRef.current) return;

        const results = snapshot.docs.map(transform);
        setData(results);
        setLoading(false);
      }
    } catch (err) {
      if (!isMountedRef.current) return;

      console.error('Erro ao buscar dados:', err);
      setError(err);
      setLoading(false);
      onError(err);
    }
  }, [query, listen, transform, onError]);

  // Executar fetch inicial
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Função para refetch manual
  const refetch = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
};

/**
 * Hook otimizado para queries com cache
 * Cacheia resultados para evitar fetches desnecessários
 */
const queryCache = new Map();

export const useFirestoreQueryCached = (query, cacheKey, options = {}) => {
  const { maxAge = 5 * 60 * 1000 } = options; // 5 minutos padrão

  const getCachedData = useCallback(() => {
    if (!cacheKey) return null;

    const cached = queryCache.get(cacheKey);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > maxAge) {
      queryCache.delete(cacheKey);
      return null;
    }

    return cached.data;
  }, [cacheKey, maxAge]);

  const setCachedData = useCallback((data) => {
    if (!cacheKey) return;

    queryCache.set(cacheKey, {
      data,
      timestamp: Date.now(),
    });
  }, [cacheKey]);

  const cachedData = getCachedData();
  const result = useFirestoreQuery(query, {
    ...options,
    initialData: cachedData,
  });

  // Atualizar cache quando dados mudam
  useEffect(() => {
    if (result.data && !result.loading) {
      setCachedData(result.data);
    }
  }, [result.data, result.loading, setCachedData]);

  return result;
};

/**
 * Limpar cache manualmente
 */
export const clearFirestoreCache = (cacheKey = null) => {
  if (cacheKey) {
    queryCache.delete(cacheKey);
  } else {
    queryCache.clear();
  }
};

/**
 * Hook otimizado para paginação
 */
export const useFirestorePagination = (query, pageSize = 20) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const lastDocRef = useRef(null);

  const loadMore = useCallback(async () => {
    if (!query || loading || !hasMore) return;

    setLoading(true);
    
    try {
      const { getDocs, limit, startAfter } = await import('firebase/firestore');
      
      let paginatedQuery = query;
      
      if (lastDocRef.current) {
        paginatedQuery = startAfter(paginatedQuery, lastDocRef.current);
      }
      
      paginatedQuery = limit(paginatedQuery, pageSize);
      
      const snapshot = await getDocs(paginatedQuery);
      
      if (snapshot.empty) {
        setHasMore(false);
        setLoading(false);
        return;
      }

      const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      lastDocRef.current = snapshot.docs[snapshot.docs.length - 1];
      
      setData(prev => [...prev, ...results]);
      setHasMore(results.length === pageSize);
    } catch (error) {
      console.error('Erro ao paginar:', error);
    } finally {
      setLoading(false);
    }
  }, [query, loading, hasMore, pageSize]);

  const reset = useCallback(() => {
    setData([]);
    lastDocRef.current = null;
    setHasMore(true);
  }, []);

  return { data, loading, hasMore, loadMore, reset };
};

export default useFirestoreQuery;
