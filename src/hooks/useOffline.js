import { useState, useEffect, useCallback } from 'react';
import offlineService from '../services/offlineService';

/**
 * Hook para gerenciar estado online/offline e sincronização
 */
export const useOffline = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  // Atualizar contagem de operações pendentes
  const updatePendingCount = useCallback(async () => {
    try {
      const count = await offlineService.getPendingCount();
      setPendingCount(count);
    } catch (error) {
      console.error('Erro ao obter contagem de pendentes:', error);
    }
  }, []);

  // Sincronizar manualmente
  const syncNow = useCallback(async () => {
    if (!isOnline) {
      console.warn('Não é possível sincronizar offline');
      return false;
    }

    setIsSyncing(true);
    try {
      await offlineService.syncPendingOperations();
      await updatePendingCount();
      setLastSyncTime(new Date());
      return true;
    } catch (error) {
      console.error('Erro ao sincronizar:', error);
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, updatePendingCount]);

  // Salvar operação (online ou offline)
  const saveOperation = useCallback(async (type, collection, id, data) => {
    const operation = {
      type, // 'create', 'update', 'delete'
      collection,
      id,
      data,
      timestamp: Date.now()
    };

    if (isOnline) {
      try {
        // Tentar executar imediatamente
        await offlineService.executeOperation(operation);
        console.log('✅ Operação executada online:', type);
        return true;
      } catch (error) {
        console.error('❌ Erro ao executar online, salvando para depois:', error);
        // Se falhar, salvar para sincronizar depois
        await offlineService.savePendingOperation(operation);
        await updatePendingCount();
        return false;
      }
    } else {
      // Offline: salvar para sincronizar depois
      await offlineService.savePendingOperation(operation);
      await updatePendingCount();
      console.log('💾 Operação salva offline:', type);
      return false;
    }
  }, [isOnline, updatePendingCount]);

  // Cache de dados
  const cacheData = useCallback(async (key, data, ttl) => {
    try {
      await offlineService.cacheData(key, data, ttl);
      console.log('💾 Dados salvos em cache:', key);
    } catch (error) {
      console.error('Erro ao salvar cache:', error);
    }
  }, []);

  // Obter dados do cache
  const getCachedData = useCallback(async (key) => {
    try {
      const data = await offlineService.getCachedData(key);
      if (data) {
        console.log('📦 Dados obtidos do cache:', key);
      }
      return data;
    } catch (error) {
      console.error('Erro ao obter cache:', error);
      return null;
    }
  }, []);

  // Limpar cache expirado
  const clearExpiredCache = useCallback(async () => {
    try {
      const deleted = await offlineService.clearExpiredCache();
      console.log(`🧹 ${deleted} itens de cache removidos`);
      return deleted;
    } catch (error) {
      console.error('Erro ao limpar cache:', error);
      return 0;
    }
  }, []);

  // Listener para mudanças de status
  useEffect(() => {
    const unsubscribe = offlineService.addStatusListener((status, online) => {
      setIsOnline(online);
      
      if (status === 'online') {
        console.log('🌐 Online! Sincronizando automaticamente...');
        syncNow();
      } else if (status === 'offline') {
        console.log('📴 Offline! Operações serão salvas localmente.');
      } else if (status === 'synced') {
        updatePendingCount();
      }
    });

    // Atualizar contagem inicial
    updatePendingCount();

    // Limpar cache expirado periodicamente (a cada 30 minutos)
    const cleanupInterval = setInterval(() => {
      clearExpiredCache();
    }, 30 * 60 * 1000);

    return () => {
      unsubscribe();
      clearInterval(cleanupInterval);
    };
  }, [syncNow, updatePendingCount, clearExpiredCache]);

  return {
    // Estado
    isOnline,
    pendingCount,
    isSyncing,
    lastSyncTime,
    
    // Ações
    syncNow,
    saveOperation,
    cacheData,
    getCachedData,
    clearExpiredCache
  };
};

/**
 * Hook simplificado para salvar dados com suporte offline
 */
export const useOfflineSave = (collection) => {
  const { saveOperation } = useOffline();

  const create = useCallback(async (id, data) => {
    return await saveOperation('create', collection, id, data);
  }, [collection, saveOperation]);

  const update = useCallback(async (id, data) => {
    return await saveOperation('update', collection, id, data);
  }, [collection, saveOperation]);

  const remove = useCallback(async (id) => {
    return await saveOperation('delete', collection, id, {});
  }, [collection, saveOperation]);

  return { create, update, remove };
};

export default useOffline;
