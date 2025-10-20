/**
 * 🎣 HOOK: Database Optimizer
 * 
 * Gerencia operações otimizadas com Firebase
 * - Batch operations
 * - Cache inteligente
 * - Compressão Python
 * - Queries otimizadas
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getOptimizer } from '../services/databaseOptimizer';

export const useDatabaseOptimizer = (options = {}) => {
  const { enabled = true } = options;

  const [isInitialized, setIsInitialized] = useState(false);
  const [cacheStats, setCacheStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const optimizerRef = useRef(null);

  /**
   * Inicializa Optimizer
   */
  useEffect(() => {
    if (!enabled) return;

    console.log('🎣 Inicializando useDatabaseOptimizer...');
    
    optimizerRef.current = getOptimizer();
    setIsInitialized(true);

    // Atualizar stats periodicamente
    const updateStats = () => {
      if (optimizerRef.current) {
        const stats = optimizerRef.current.getCacheStats();
        setCacheStats(stats);
      }
    };

    updateStats();
    const interval = setInterval(updateStats, 5000); // A cada 5 segundos
    
    return () => clearInterval(interval);
  }, [enabled]);

  /**
   * Get documento com cache
   */
  const getDocument = useCallback(async (collectionName, documentId, opts = {}) => {
    if (!optimizerRef.current) {
      console.warn('Optimizer não inicializado');
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const doc = await optimizerRef.current.getDocument(
        collectionName, 
        documentId, 
        {
          useCache: true,
          compress: true,
          ...opts
        }
      );
      
      return doc;
    } catch (err) {
      console.error('❌ Erro ao buscar documento:', err);
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Get múltiplos documentos (batch)
   */
  const getDocuments = useCallback(async (collectionName, documentIds, opts = {}) => {
    if (!optimizerRef.current) {
      console.warn('Optimizer não inicializado');
      return [];
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const docs = await optimizerRef.current.getDocuments(
        collectionName, 
        documentIds,
        {
          useCache: true,
          parallel: true,
          ...opts
        }
      );
      
      return docs;
    } catch (err) {
      console.error('❌ Erro ao buscar documentos:', err);
      setError(err.message);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Query com paginação e cache
   */
  const queryDocuments = useCallback(async (collectionName, queryConfig = {}, opts = {}) => {
    if (!optimizerRef.current) {
      console.warn('Optimizer não inicializado');
      return { docs: [], hasMore: false };
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const result = await optimizerRef.current.queryDocuments(
        collectionName, 
        queryConfig,
        {
          compress: true,
          prefetch: true,
          ...opts
        }
      );
      
      return result;
    } catch (err) {
      console.error('❌ Erro ao executar query:', err);
      setError(err.message);
      return { docs: [], hasMore: false };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Set documento (batch automático)
   */
  const setDocument = useCallback(async (collectionName, documentId, data, opts = {}) => {
    if (!optimizerRef.current) {
      console.warn('Optimizer não inicializado');
      return { success: false };
    }

    try {
      setError(null);
      
      const result = await optimizerRef.current.setDocument(
        collectionName, 
        documentId, 
        data,
        {
          useBatch: true,
          batchDelay: 100,
          ...opts
        }
      );
      
      return result;
    } catch (err) {
      console.error('❌ Erro ao salvar documento:', err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, []);

  /**
   * Update documento (batch automático)
   */
  const updateDocument = useCallback(async (collectionName, documentId, data, opts = {}) => {
    if (!optimizerRef.current) {
      console.warn('Optimizer não inicializado');
      return { success: false };
    }

    try {
      setError(null);
      
      const result = await optimizerRef.current.updateDocument(
        collectionName, 
        documentId, 
        data,
        {
          useBatch: true,
          batchDelay: 100,
          ...opts
        }
      );
      
      return result;
    } catch (err) {
      console.error('❌ Erro ao atualizar documento:', err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, []);

  /**
   * Delete documento (batch automático)
   */
  const deleteDocument = useCallback(async (collectionName, documentId, opts = {}) => {
    if (!optimizerRef.current) {
      console.warn('Optimizer não inicializado');
      return { success: false };
    }

    try {
      setError(null);
      
      const result = await optimizerRef.current.deleteDocument(
        collectionName, 
        documentId,
        {
          useBatch: true,
          batchDelay: 100,
          ...opts
        }
      );
      
      return result;
    } catch (err) {
      console.error('❌ Erro ao deletar documento:', err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, []);

  /**
   * Limpa cache
   */
  const clearCache = useCallback(() => {
    if (!optimizerRef.current) {
      console.warn('Optimizer não inicializado');
      return;
    }

    optimizerRef.current.clearCache();
    setCacheStats(optimizerRef.current.getCacheStats());
  }, []);

  /**
   * Invalida cache de uma coleção
   */
  const invalidateCache = useCallback((key) => {
    if (!optimizerRef.current) {
      console.warn('Optimizer não inicializado');
      return;
    }

    optimizerRef.current.invalidateCache(key);
    setCacheStats(optimizerRef.current.getCacheStats());
  }, []);

  /**
   * Força execução do batch
   */
  const executeBatch = useCallback(async () => {
    if (!optimizerRef.current) {
      console.warn('Optimizer não inicializado');
      return { success: false };
    }

    try {
      await optimizerRef.current.executeBatch();
      return { success: true };
    } catch (err) {
      console.error('❌ Erro ao executar batch:', err);
      return { success: false, error: err.message };
    }
  }, []);

  return {
    // Estado
    isInitialized,
    isLoading,
    error,
    cacheStats,
    
    // Operações de leitura
    getDocument,
    getDocuments,
    queryDocuments,
    
    // Operações de escrita
    setDocument,
    updateDocument,
    deleteDocument,
    
    // Cache
    clearCache,
    invalidateCache,
    
    // Batch
    executeBatch
  };
};

export default useDatabaseOptimizer;
