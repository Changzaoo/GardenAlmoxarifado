import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import initialSyncService from '../services/initialSyncService';

/**
 * Hook para buscar dados priorizando o cache local
 * 
 * @param {string} collectionName - Nome da coleção no Firestore
 * @param {object} options - Opções de configuração
 * @param {array} options.filters - Filtros no formato [{ field, operator, value }]
 * @param {boolean} options.realTime - Se deve manter listener em tempo real
 * @param {boolean} options.forceFirebase - Força busca no Firebase (ignora cache)
 * 
 * @returns {object} { data, loading, error, refresh }
 */
export const useCachedData = (collectionName, options = {}) => {
  const { 
    filters = [], 
    realTime = false, 
    forceFirebase = false 
  } = options;

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFromCache, setIsFromCache] = useState(false);

  useEffect(() => {
    let unsubscribe = null;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Tentar buscar do cache primeiro (se não forçar Firebase)
        if (!forceFirebase) {
          const cachedData = await initialSyncService.getFromCache(
            collectionName, 
            filters
          );

          if (cachedData && cachedData.length > 0) {
            setData(cachedData);
            setIsFromCache(true);
            setLoading(false);
            
            // Se não for tempo real, retorna com dados do cache
            if (!realTime) {
              return;
            }
          }
        }

        // 2. Buscar do Firebase se:
        //    - forceFirebase = true
        //    - cache vazio
        //    - realTime = true (para manter atualizado)
        
        let q = collection(db, collectionName);

        // Aplicar filtros
        if (filters.length > 0) {
          const whereClauses = filters.map(f => 
            where(f.field, f.operator || '==', f.value)
          );
          q = query(q, ...whereClauses);
        }

        if (realTime) {
          // Listener em tempo real
          unsubscribe = onSnapshot(
            q,
            (snapshot) => {
              const docs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              }));
              
              setData(docs);
              setIsFromCache(false);
              setLoading(false);
            },
            (err) => {
              setError(err.message);
              setLoading(false);
            }
          );
        } else {
          // Busca única
          const snapshot = await getDocs(q);
          const docs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          setData(docs);
          setIsFromCache(false);
          setLoading(false);
        }

      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    loadData();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [collectionName, JSON.stringify(filters), realTime, forceFirebase]);

  // Função para forçar refresh dos dados
  const refresh = async () => {
    setLoading(true);
    setError(null);

    try {
      let q = collection(db, collectionName);

      if (filters.length > 0) {
        const whereClauses = filters.map(f => 
          where(f.field, f.operator || '==', f.value)
        );
        q = query(q, ...whereClauses);
      }

      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setData(docs);
      setIsFromCache(false);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return { 
    data, 
    loading, 
    error, 
    refresh,
    isFromCache 
  };
};

/**
 * Hook simplificado para buscar todos os documentos de uma coleção do cache
 */
export const useAllCached = (collectionName) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFromCache = async () => {
      try {
        const cachedData = await initialSyncService.getFromCache(collectionName);
        setData(cachedData || []);
      } catch (error) {
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    loadFromCache();
  }, [collectionName]);

  return { data, loading };
};

/**
 * Hook para buscar um único documento do cache
 */
export const useCachedDocument = (collectionName, documentId) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDocument = async () => {
      try {
        const cachedData = await initialSyncService.getFromCache(collectionName);
        const doc = cachedData?.find(d => d.id === documentId);
        setData(doc || null);
      } catch (error) {
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    if (documentId) {
      loadDocument();
    } else {
      setLoading(false);
    }
  }, [collectionName, documentId]);

  return { data, loading };
};
