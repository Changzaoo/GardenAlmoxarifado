/**
 * 🎣 HOOK: State Persistence
 * 
 * Gerencia persistência automática de estado do aplicativo
 * - Auto-save a cada 1 segundo
 * - Restore completo ao reabrir
 * - Compressão Python
 * - Multi-layer storage
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getStateManager } from '../services/stateManager';

export const useStatePersistence = (options = {}) => {
  const {
    autoRestore = true,
    onRestored = null,
    enabled = true
  } = options;

  const [isInitialized, setIsInitialized] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState(null);
  const [saveError, setSaveError] = useState(null);
  
  const stateManagerRef = useRef(null);

  /**
   * Inicializa StateManager
   */
  useEffect(() => {
    if (!enabled) return;

    console.log('🎣 Inicializando useStatePersistence...');
    
    stateManagerRef.current = getStateManager();
    setIsInitialized(true);

    // Restaurar estado ao montar (se configurado)
    if (autoRestore) {
      restoreState();
    }

    return () => {
      // Forçar save ao desmontar
      if (stateManagerRef.current) {
        stateManagerRef.current.saveState(true);
      }
    };
  }, [enabled, autoRestore]);

  /**
   * Listener para evento de restore
   */
  useEffect(() => {
    if (!enabled || !onRestored) return;

    const handleRestore = (event) => {
      console.log('✅ Estado restaurado:', event.detail);
      onRestored(event.detail);
    };

    window.addEventListener('stateRestored', handleRestore);
    
    return () => {
      window.removeEventListener('stateRestored', handleRestore);
    };
  }, [enabled, onRestored]);

  /**
   * Monitora status de salvamento
   */
  useEffect(() => {
    if (!enabled || !stateManagerRef.current) return;

    const checkSaveStatus = () => {
      const manager = stateManagerRef.current;
      setIsSaving(manager.isSaving);
      if (manager.lastSaveTime) {
        setLastSaveTime(new Date(manager.lastSaveTime));
      }
    };

    const interval = setInterval(checkSaveStatus, 500);
    
    return () => clearInterval(interval);
  }, [enabled]);

  /**
   * Salva estado manualmente
   */
  const saveState = useCallback(async () => {
    if (!stateManagerRef.current) {
      console.warn('StateManager não inicializado');
      return { success: false, error: 'Not initialized' };
    }

    try {
      setSaveError(null);
      const result = await stateManagerRef.current.saveState(true);
      setLastSaveTime(new Date());
      return { success: true, ...result };
    } catch (error) {
      console.error('❌ Erro ao salvar estado:', error);
      setSaveError(error.message);
      return { success: false, error: error.message };
    }
  }, []);

  /**
   * Restaura estado manualmente
   */
  const restoreState = useCallback(async () => {
    if (!stateManagerRef.current) {
      console.warn('StateManager não inicializado');
      return { success: false, error: 'Not initialized' };
    }

    try {
      const restoredState = await stateManagerRef.current.restoreState();
      return { success: true, state: restoredState };
    } catch (error) {
      console.error('❌ Erro ao restaurar estado:', error);
      return { success: false, error: error.message };
    }
  }, []);

  /**
   * Limpa estado salvo
   */
  const clearState = useCallback(async () => {
    if (!stateManagerRef.current) {
      console.warn('StateManager não inicializado');
      return { success: false, error: 'Not initialized' };
    }

    try {
      await stateManagerRef.current.clearState();
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao limpar estado:', error);
      return { success: false, error: error.message };
    }
  }, []);

  /**
   * Obtém estatísticas
   */
  const getStats = useCallback(() => {
    if (!stateManagerRef.current) {
      return null;
    }

    return {
      isInitialized: stateManagerRef.current.isInitialized,
      isSaving: stateManagerRef.current.isSaving,
      lastSaveTime: stateManagerRef.current.lastSaveTime,
      autoSaveActive: stateManagerRef.current.autoSaveActive
    };
  }, []);

  return {
    // Estado
    isInitialized,
    isSaving,
    lastSaveTime,
    saveError,
    
    // Ações
    saveState,
    restoreState,
    clearState,
    getStats
  };
};

export default useStatePersistence;
