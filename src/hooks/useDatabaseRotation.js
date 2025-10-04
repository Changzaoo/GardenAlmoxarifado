import { useState, useEffect, useCallback, useRef } from 'react';
import dbManager, { primaryDb, backupDb } from '../config/firebaseDual';
import { createSyncService } from '../services/firebaseSync';

/**
 * 🔄 Hook para Rotação Automática de Database
 * 
 * Alterna entre Firebase principal e backup a cada 24h
 * Sincroniza dados ao alternar
 */
export const useDatabaseRotation = (options = {}) => {
  const {
    autoRotate = true,
    rotationInterval = 24 * 60 * 60 * 1000, // 24 horas em ms
    syncOnRotation = true,
    collections = [
      'usuarios',
      'mensagens',
      'notificacoes',
      'tarefas',
      'emprestimos',
      'inventario',
      'empresas',
      'setores',
      'cargos',
      'presenca',
      'horarios',
      'folgas',
      'configuracoes'
    ],
    onRotationStart = null,
    onRotationComplete = null,
    onSyncProgress = null,
    onError = null
  } = options;

  const [activeDatabase, setActiveDatabase] = useState(dbManager.activeDatabase);
  const [isRotating, setIsRotating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastRotation, setLastRotation] = useState(dbManager.lastRotation);
  const [nextRotation, setNextRotation] = useState(null);
  const [syncProgress, setSyncProgress] = useState(null);
  const [rotationHistory, setRotationHistory] = useState([]);

  const rotationTimerRef = useRef(null);
  const syncServiceRef = useRef(null);

  /**
   * 📊 Calcular próxima rotação
   */
  const calculateNextRotation = useCallback(() => {
    const next = new Date(lastRotation.getTime() + rotationInterval);
    setNextRotation(next);
    return next;
  }, [lastRotation, rotationInterval]);

  /**
   * 🔄 Sincronizar databases
   */
  const syncDatabases = useCallback(async () => {
    try {
      setIsSyncing(true);
      setSyncProgress({ current: 0, total: collections.length, collection: null });

      // Criar serviço de sincronização
      const sourceDb = activeDatabase === 'primary' ? primaryDb : backupDb;
      const targetDb = activeDatabase === 'primary' ? backupDb : primaryDb;
      
      if (!syncServiceRef.current) {
        syncServiceRef.current = createSyncService(sourceDb, targetDb);
      }

      console.log(`🔄 Iniciando sincronização: ${activeDatabase} → ${activeDatabase === 'primary' ? 'backup' : 'primary'}`);

      // Sincronizar todas as coleções
      const result = await syncServiceRef.current.syncAllCollections(
        collections,
        (current, total, collectionName) => {
          setSyncProgress({
            current,
            total,
            collection: collectionName,
            percentage: Math.round((current / total) * 100)
          });

          if (onSyncProgress) {
            onSyncProgress(current, total, collectionName);
          }
        }
      );

      console.log('✅ Sincronização concluída:', result);

      return result;

    } catch (error) {
      console.error('❌ Erro na sincronização:', error);
      
      if (onError) {
        onError(error);
      }

      throw error;
    } finally {
      setIsSyncing(false);
      setSyncProgress(null);
    }
  }, [activeDatabase, collections, onSyncProgress, onError]);

  /**
   * 🔄 Executar rotação
   */
  const executeRotation = useCallback(async () => {
    if (isRotating) {
      console.warn('⚠️ Rotação já em andamento');
      return;
    }

    try {
      setIsRotating(true);

      if (onRotationStart) {
        onRotationStart(activeDatabase);
      }

      console.log(`🔄 Iniciando rotação do database: ${activeDatabase}`);

      // Sincronizar antes de alternar (se habilitado)
      let syncResult = null;
      if (syncOnRotation) {
        syncResult = await syncDatabases();
      }

      // Alternar database
      const newDatabase = dbManager.switchDatabase();
      setActiveDatabase(newDatabase);
      setLastRotation(dbManager.lastRotation);

      // Registrar no histórico
      const historyEntry = {
        timestamp: new Date().toISOString(),
        from: activeDatabase,
        to: newDatabase,
        synced: syncOnRotation,
        syncResult
      };

      setRotationHistory(prev => [...prev, historyEntry]);

      // Salvar histórico no localStorage
      const history = JSON.parse(localStorage.getItem('rotationHistory') || '[]');
      history.push(historyEntry);
      // Manter apenas últimas 50 rotações
      if (history.length > 50) {
        history.shift();
      }
      localStorage.setItem('rotationHistory', JSON.stringify(history));

      console.log(`✅ Rotação concluída: ${activeDatabase} → ${newDatabase}`);

      if (onRotationComplete) {
        onRotationComplete(newDatabase, historyEntry);
      }

      // Calcular próxima rotação
      calculateNextRotation();

      return historyEntry;

    } catch (error) {
      console.error('❌ Erro na rotação:', error);
      
      if (onError) {
        onError(error);
      }

      throw error;
    } finally {
      setIsRotating(false);
    }
  }, [
    isRotating,
    activeDatabase,
    syncOnRotation,
    syncDatabases,
    onRotationStart,
    onRotationComplete,
    onError,
    calculateNextRotation
  ]);

  /**
   * ⏰ Verificar se precisa rotacionar
   */
  const checkRotation = useCallback(async () => {
    if (dbManager.needsRotation() && autoRotate) {
      console.log('⏰ Tempo de rotação atingido, executando rotação automática');
      await executeRotation();
    }
  }, [autoRotate, executeRotation]);

  /**
   * 🔄 Forçar rotação manual
   */
  const forceRotation = useCallback(async () => {
    console.log('🔄 Rotação manual iniciada');
    return await executeRotation();
  }, [executeRotation]);

  /**
   * 🔄 Forçar sincronização manual
   */
  const forceSync = useCallback(async () => {
    console.log('🔄 Sincronização manual iniciada');
    return await syncDatabases();
  }, [syncDatabases]);

  /**
   * 📊 Obter informações do sistema
   */
  const getInfo = useCallback(() => {
    const info = dbManager.getInfo();
    return {
      ...info,
      nextRotation,
      isRotating,
      isSyncing,
      syncProgress,
      rotationHistory,
      autoRotate,
      rotationInterval
    };
  }, [
    nextRotation,
    isRotating,
    isSyncing,
    syncProgress,
    rotationHistory,
    autoRotate,
    rotationInterval
  ]);

  /**
   * 📜 Carregar histórico do localStorage
   */
  useEffect(() => {
    const history = JSON.parse(localStorage.getItem('rotationHistory') || '[]');
    setRotationHistory(history);
  }, []);

  /**
   * 🎯 Setup do listener para mudanças de database
   */
  useEffect(() => {
    const unsubscribe = dbManager.addListener((newDatabase) => {
      console.log(`📡 Database alterado: ${newDatabase}`);
      setActiveDatabase(newDatabase);
      setLastRotation(dbManager.lastRotation);
      calculateNextRotation();
    });

    return unsubscribe;
  }, [calculateNextRotation]);

  /**
   * ⏰ Setup do timer de verificação de rotação
   */
  useEffect(() => {
    if (!autoRotate) return;

    // Calcular próxima rotação
    calculateNextRotation();

    // Verificar a cada 1 minuto
    rotationTimerRef.current = setInterval(() => {
      checkRotation();
    }, 60 * 1000);

    // Verificar imediatamente
    checkRotation();

    return () => {
      if (rotationTimerRef.current) {
        clearInterval(rotationTimerRef.current);
      }
    };
  }, [autoRotate, checkRotation, calculateNextRotation]);

  return {
    // Estado
    activeDatabase,
    lastRotation,
    nextRotation,
    isRotating,
    isSyncing,
    syncProgress,
    rotationHistory,

    // Ações
    forceRotation,
    forceSync,
    checkRotation,
    getInfo,

    // Informações
    needsRotation: dbManager.needsRotation(),
    hoursUntilRotation: dbManager.getInfo().hoursUntilRotation,
    autoRotate
  };
};

export default useDatabaseRotation;
