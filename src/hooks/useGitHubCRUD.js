// hooks/useGitHubCRUD.js
import { useState, useEffect, useCallback } from 'react';
import GitHubService from '../services/githubService';

const useGitHubCRUD = (filePath, defaultData = []) => {
  const [data, setData] = useState(defaultData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [offline, setOffline] = useState(false);

  const githubConfig = {
    owner: 'changzaoo',
    repo: 'gardenalmoxarifado',
    token: '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'
  };

  const githubService = new GitHubService(githubConfig);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const file = await githubService.fetchFile(filePath);
      const content = typeof file.content === 'string' ? 
        JSON.parse(file.content) : file.content;
      
      setData(content);
      setOffline(githubService.offlineMode);
    } catch (err) {
      setError(err.message);
      console.error('Erro ao buscar dados:', err);
    } finally {
      setLoading(false);
    }
  }, [filePath]);

  const createItem = useCallback(async (newItem) => {
    try {
      const newData = [
        ...data,
        {
          ...newItem,
          id: Date.now().toString(),
          criadoEm: new Date().toISOString(),
          atualizadoEm: new Date().toISOString()
        }
      ];

      const result = await githubService.updateFile(
        filePath,
        JSON.stringify(newData, null, 2),
        `Adiciona item em ${filePath}`
      );

      if (result.success) {
        setData(newData);
        setOffline(result.offline || false);
        return { success: true, offline: result.offline };
      }

      return { success: false };
    } catch (err) {
      console.error('Erro ao criar item:', err);
      return { success: false, error: err.message };
    }
  }, [data, filePath]);

  const updateItem = useCallback(async (id, updates) => {
    try {
      const newData = data.map(item =>
        item.id === id
          ? { ...item, ...updates, atualizadoEm: new Date().toISOString() }
          : item
      );

      const result = await githubService.updateFile(
        filePath,
        JSON.stringify(newData, null, 2),
        `Atualiza item ${id} em ${filePath}`
      );

      if (result.success) {
        setData(newData);
        setOffline(result.offline || false);
        return { success: true, offline: result.offline };
      }

      return { success: false };
    } catch (err) {
      console.error('Erro ao atualizar item:', err);
      return { success: false, error: err.message };
    }
  }, [data, filePath]);

  const deleteItem = useCallback(async (id) => {
    try {
      const newData = data.filter(item => item.id !== id);

      const result = await githubService.updateFile(
        filePath,
        JSON.stringify(newData, null, 2),
        `Remove item ${id} em ${filePath}`
      );

      if (result.success) {
        setData(newData);
        setOffline(result.offline || false);
        return { success: true, offline: result.offline };
      }

      return { success: false };
    } catch (err) {
      console.error('Erro ao remover item:', err);
      return { success: false, error: err.message };
    }
  }, [data, filePath]);

  // Sincronizar automaticamente a cada 5 minutos
  useEffect(() => {
    const syncInterval = setInterval(async () => {
      if (githubService.hasPendingChanges()) {
        await githubService.syncPendingChanges();
        await fetchData(); // Atualizar dados após sync
      }
    }, 300000); // 5 minutos

    return () => clearInterval(syncInterval);
  }, []);

  // Buscar dados inicialmente
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    offline,
    createItem,
    updateItem,
    deleteItem,
    refetch: fetchData,
    hasPendingChanges: githubService.hasPendingChanges(),
    syncChanges: () => githubService.syncPendingChanges()
  };
};

export default useGitHubCRUD;