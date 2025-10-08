/**
 * Hook customizado para usar dados offline
 * Facilita o acesso aos dados cacheados quando offline
 */

import { useState, useEffect } from 'react';
import { offlineStorage, STORES } from '../utils/offlineStorage';
import { useOnlineStatus } from './useOnlineStatus';

/**
 * Hook para acessar dados offline
 * @param {string} storeName - Nome do store (FUNCIONARIOS, PONTOS, etc)
 * @param {object} options - Opções de configuração
 * @returns {object} - { data, loading, error, refresh }
 */
export const useOfflineData = (storeName, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isOnline } = useOnlineStatus();

  const refresh = async () => {
    setLoading(true);
    setError(null);

    try {
      // Tentar buscar do cache local
      const cachedData = await offlineStorage.getFromCache(storeName);
      
      if (cachedData && cachedData.length > 0) {
        setData(cachedData);
        console.log(`📦 Dados carregados do cache: ${storeName} (${cachedData.length} itens)`);
      } else {
        console.warn(`⚠️ Nenhum dado em cache para: ${storeName}`);
        setData([]);
      }
    } catch (err) {
      console.error(`❌ Erro ao carregar dados offline de ${storeName}:`, err);
      setError(err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [storeName]);

  return {
    data,
    loading,
    error,
    refresh,
    isOnline,
    isEmpty: !data || data.length === 0
  };
};

/**
 * Hook para acessar dados offline com filtro
 * @param {string} storeName - Nome do store
 * @param {function} filterFn - Função de filtro
 * @returns {object} - { data, loading, error, refresh }
 */
export const useOfflineDataFiltered = (storeName, filterFn) => {
  const { data: allData, loading, error, refresh, isOnline } = useOfflineData(storeName);
  const [filteredData, setFilteredData] = useState([]);

  useEffect(() => {
    if (allData && filterFn) {
      setFilteredData(allData.filter(filterFn));
    } else {
      setFilteredData(allData || []);
    }
  }, [allData, filterFn]);

  return {
    data: filteredData,
    loading,
    error,
    refresh,
    isOnline,
    isEmpty: !filteredData || filteredData.length === 0
  };
};

/**
 * Hook para verificar disponibilidade de dados offline
 * @returns {object} - { hasData, stats, loading }
 */
export const useOfflineAvailability = () => {
  const [hasData, setHasData] = useState(false);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAvailability = async () => {
      try {
        const stores = [
          STORES.FUNCIONARIOS,
          STORES.PONTOS,
          STORES.AVALIACOES,
          STORES.EMPRESTIMOS,
          STORES.TAREFAS,
          STORES.ESCALAS
        ];

        const counts = {};
        let totalItems = 0;

        for (const store of stores) {
          try {
            const data = await offlineStorage.getFromCache(store);
            const count = data ? data.length : 0;
            counts[store] = count;
            totalItems += count;
          } catch (err) {
            counts[store] = 0;
          }
        }

        // Verificar ferramentas e mensagens no localStorage
        try {
          const ferramentas = JSON.parse(localStorage.getItem('offline_ferramentas') || '[]');
          counts.ferramentas = ferramentas.length;
          totalItems += ferramentas.length;
        } catch {
          counts.ferramentas = 0;
        }

        try {
          const mensagens = JSON.parse(localStorage.getItem('offline_mensagens') || '[]');
          counts.mensagens = mensagens.length;
          totalItems += mensagens.length;
        } catch {
          counts.mensagens = 0;
        }

        setStats(counts);
        setHasData(totalItems > 0);
      } catch (err) {
        console.error('Erro ao verificar disponibilidade offline:', err);
        setHasData(false);
        setStats(null);
      } finally {
        setLoading(false);
      }
    };

    checkAvailability();
  }, []);

  return { hasData, stats, loading };
};

/**
 * Hook para gerenciar sincronização de dados
 * @returns {object} - { isSyncing, syncNow, lastSync, pendingCount }
 */
export const useDataSync = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);
  const { isOnline } = useOnlineStatus();

  useEffect(() => {
    // Carregar último sync do localStorage
    try {
      const timestamp = localStorage.getItem('last_auto_sync');
      if (timestamp) {
        setLastSync(new Date(parseInt(timestamp)));
      }
    } catch (err) {
      console.error('Erro ao carregar último sync:', err);
    }

    // Atualizar pendências periodicamente
    const updatePending = async () => {
      try {
        const { syncManager } = await import('../utils/syncManager');
        const count = await syncManager.getPendingCount();
        setPendingCount(count);
      } catch (err) {
        console.error('Erro ao obter pendências:', err);
      }
    };

    updatePending();
    const interval = setInterval(updatePending, 5000);

    return () => clearInterval(interval);
  }, []);

  const syncNow = async () => {
    if (!isOnline) {
      throw new Error('Sem conexão com a internet');
    }

    if (isSyncing) {
      throw new Error('Sincronização já em andamento');
    }

    try {
      setIsSyncing(true);

      // Importar serviços dinamicamente
      const { syncManager } = await import('../utils/syncManager');
      const { autoSyncService } = await import('../utils/autoSyncService');

      // Upload de operações pendentes
      if (pendingCount > 0) {
        await syncManager.startSync();
      }

      // Download de dados atualizados
      const result = await autoSyncService.downloadAllData({ 
        showToast: false, 
        force: true 
      });

      setLastSync(new Date());
      return result;
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    isSyncing,
    syncNow,
    lastSync,
    pendingCount,
    isOnline,
    hasPending: pendingCount > 0
  };
};
