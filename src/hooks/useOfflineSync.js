/**
 * Hook para sincronização offline otimizada com Python
 * Baixa todos os dados do Firebase de uma vez e armazena em IndexedDB
 * Usa Python (Pyodide) para compressão e processamento rápido
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { collection, getDocs, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebaseConfig';

// Nome do banco IndexedDB
const DB_NAME = 'WorkFlowOfflineDB';
const DB_VERSION = 2;
const STORE_NAME = 'cachedData';

// Coleções a serem sincronizadas
const COLLECTIONS = [
  'usuarios',
  'empresas', 
  'setores',
  'ferramentas',
  'inventario',
  'emprestimos',
  'tarefas',
  'pontos',
  'avaliacoes',
  'conversas',
  'mensagens'
];

// Tempo de cache (1 hora)
const CACHE_DURATION = 60 * 60 * 1000;

/**
 * Hook principal de sincronização offline
 */
export const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [cachedData, setCachedData] = useState({});
  const [error, setError] = useState(null);
  
  const workerRef = useRef(null);
  const dbRef = useRef(null);
  const unsubscribersRef = useRef([]);

  /**
   * Inicializa IndexedDB
   */
  const initIndexedDB = useCallback(() => {
    return new Promise((resolve, reject) => {
      // CORREÇÃO 2: Verificar se IndexedDB está disponível
      if (!window.indexedDB) {
        console.warn('⚠️ IndexedDB não disponível neste navegador');
        reject(new Error('IndexedDB não suportado'));
        return;
      }

      // Verificar modo privado
      try {
        const testRequest = indexedDB.open('test');
        testRequest.onerror = () => {
          console.warn('⚠️ IndexedDB bloqueado (modo privado?)');
          reject(new Error('IndexedDB bloqueado - modo de navegação privada?'));
        };
        testRequest.onsuccess = () => {
          indexedDB.deleteDatabase('test');
          
          // Agora abrir o banco real
          const request = indexedDB.open(DB_NAME, DB_VERSION);

          request.onerror = () => {
            console.error('❌ Erro ao abrir IndexedDB:', request.error);
            reject(request.error);
          };
          
          request.onsuccess = () => {
            dbRef.current = request.result;
            console.log('✅ IndexedDB inicializado');
            resolve(request.result);
          };

          request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            // Criar object store se não existir
            if (!db.objectStoreNames.contains(STORE_NAME)) {
              const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
              store.createIndex('collection', 'collection', { unique: false });
              store.createIndex('timestamp', 'timestamp', { unique: false });
              store.createIndex('compressed', 'compressed', { unique: false });
              console.log('✅ Object store criado');
            }
          };
        };
      } catch (error) {
        console.error('❌ Erro ao testar IndexedDB:', error);
        reject(error);
      }
    });
  }, []);

  /**
   * Inicializa Worker Python
   */
  const initPythonWorker = useCallback(() => {
    if (!workerRef.current) {
      try {
        workerRef.current = new Worker(
          new URL('../workers/pythonCalculations.worker.js', import.meta.url),
          { type: 'module' }
        );
        console.log('✅ Worker Python inicializado');
      } catch (error) {
        console.error('❌ Erro ao inicializar Worker Python:', error);
        return null;
      }
    }
    return workerRef.current;
  }, []);

  /**
   * Comprime dados usando Python
   */
  const compressDataWithPython = useCallback((data, collectionName) => {
    return new Promise((resolve, reject) => {
      // CORREÇÃO 1: Verificar se worker foi inicializado
      const worker = initPythonWorker();
      if (!worker) {
        reject(new Error('Worker Python não disponível'));
        return;
      }

      const messageId = `compress_${Date.now()}`;

      const handleMessage = (event) => {
        if (event.data.id === messageId) {
          worker.removeEventListener('message', handleMessage);
          
          if (event.data.error) {
            reject(new Error(event.data.error));
          } else {
            resolve(event.data.result);
          }
        }
      };

      // CORREÇÃO 4: Verificar se Pyodide está pronto
      const handleError = (event) => {
        worker.removeEventListener('error', handleError);
        console.error('❌ Erro no Worker Python:', event);
        reject(new Error('Erro ao processar no Worker Python'));
      };

      worker.addEventListener('message', handleMessage);
      worker.addEventListener('error', handleError);

      try {
        worker.postMessage({
          id: messageId,
          type: 'COMPRESS_DATA',
          payload: {
            data: JSON.stringify(data),
            collectionName
          }
        });
      } catch (error) {
        worker.removeEventListener('message', handleMessage);
        worker.removeEventListener('error', handleError);
        reject(error);
        return;
      }

      // Timeout de 30 segundos
      setTimeout(() => {
        worker.removeEventListener('message', handleMessage);
        worker.removeEventListener('error', handleError);
        reject(new Error('Timeout ao comprimir dados - Worker não respondeu'));
      }, 30000);
    });
  }, [initPythonWorker]);

  /**
   * Descomprime dados usando Python
   */
  const decompressDataWithPython = useCallback((compressedData) => {
    return new Promise((resolve, reject) => {
      // CORREÇÃO 1: Verificar se worker foi inicializado
      const worker = initPythonWorker();
      if (!worker) {
        reject(new Error('Worker Python não disponível'));
        return;
      }

      const messageId = `decompress_${Date.now()}`;

      const handleMessage = (event) => {
        if (event.data.id === messageId) {
          worker.removeEventListener('message', handleMessage);
          
          if (event.data.error) {
            reject(new Error(event.data.error));
          } else {
            resolve(event.data.result);
          }
        }
      };

      const handleError = (event) => {
        worker.removeEventListener('error', handleError);
        console.error('❌ Erro no Worker Python:', event);
        reject(new Error('Erro ao processar no Worker Python'));
      };

      worker.addEventListener('message', handleMessage);
      worker.addEventListener('error', handleError);

      try {
        worker.postMessage({
          id: messageId,
          type: 'DECOMPRESS_DATA',
          payload: { compressedData }
        });
      } catch (error) {
        worker.removeEventListener('message', handleMessage);
        worker.removeEventListener('error', handleError);
        reject(error);
        return;
      }

      // Timeout de 30 segundos
      setTimeout(() => {
        worker.removeEventListener('message', handleMessage);
        worker.removeEventListener('error', handleError);
        reject(new Error('Timeout ao descomprimir dados - Worker não respondeu'));
      }, 30000);
    });
  }, [initPythonWorker]);

  /**
   * Salva dados no IndexedDB
   */
  const saveToIndexedDB = useCallback(async (collectionName, data, compressed = false) => {
    if (!dbRef.current) {
      await initIndexedDB();
    }

    // CORREÇÃO 5: Verificar permissões de armazenamento
    if (navigator.storage && navigator.storage.persist) {
      const isPersisted = await navigator.storage.persisted();
      if (!isPersisted) {
        console.log('⏳ Solicitando armazenamento persistente...');
        const granted = await navigator.storage.persist();
        if (granted) {
          console.log('✅ Armazenamento persistente concedido');
        } else {
          console.warn('⚠️ Armazenamento persistente negado - dados podem ser limpos pelo navegador');
        }
      }
    }

    return new Promise((resolve, reject) => {
      try {
        const transaction = dbRef.current.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        const record = {
          id: collectionName,
          collection: collectionName,
          data: data,
          compressed: compressed,
          timestamp: Date.now(),
          count: Array.isArray(data) ? data.length : Object.keys(data).length
        };

        const request = store.put(record);

        request.onsuccess = () => {
          console.log(`💾 ${collectionName} salvo no cache (${record.count} registros)`);
          resolve(record);
        };
        
        request.onerror = () => {
          console.error(`❌ Erro ao salvar ${collectionName}:`, request.error);
          reject(request.error);
        };

        transaction.onerror = () => {
          console.error(`❌ Erro na transação ao salvar ${collectionName}:`, transaction.error);
          reject(transaction.error);
        };
      } catch (error) {
        console.error(`❌ Erro ao criar transação para ${collectionName}:`, error);
        reject(error);
      }
    });
  }, [initIndexedDB]);

  /**
   * Carrega dados do IndexedDB
   */
  const loadFromIndexedDB = useCallback(async (collectionName) => {
    if (!dbRef.current) {
      await initIndexedDB();
    }

    return new Promise((resolve, reject) => {
      const transaction = dbRef.current.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(collectionName);

      request.onsuccess = () => {
        const record = request.result;
        
        if (!record) {
          resolve(null);
          return;
        }

        // Verificar se o cache ainda é válido
        const now = Date.now();
        if (now - record.timestamp > CACHE_DURATION) {
          console.log(`⏰ Cache expirado para ${collectionName}`);
          resolve(null);
          return;
        }

        resolve(record);
      };

      request.onerror = () => reject(request.error);
    });
  }, [initIndexedDB]);

  /**
   * Baixa uma coleção do Firebase
   */
  const downloadCollection = useCallback(async (collectionName) => {
    try {
      console.log(`📥 Baixando coleção: ${collectionName}`);
      
      const querySnapshot = await getDocs(collection(db, collectionName));
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Converter timestamps Firestore para ISO string
        ...(doc.data().criadoEm && { 
          criadoEm: doc.data().criadoEm?.toDate?.()?.toISOString() || doc.data().criadoEm 
        }),
        ...(doc.data().atualizadoEm && { 
          atualizadoEm: doc.data().atualizadoEm?.toDate?.()?.toISOString() || doc.data().atualizadoEm 
        })
      }));

      console.log(`✅ ${collectionName}: ${data.length} documentos baixados`);
      return data;
    } catch (error) {
      console.error(`❌ Erro ao baixar ${collectionName}:`, error);
      throw error;
    }
  }, []);

  /**
   * Sincroniza todas as coleções de uma vez
   */
  const syncAllCollections = useCallback(async (forceRefresh = false) => {
    if (isSyncing) {
      console.log('⚠️ Sincronização já em andamento');
      return;
    }

    try {
      setIsSyncing(true);
      setError(null);
      setSyncProgress(0);

      console.log('🔄 Iniciando sincronização completa...');

      // Inicializar IndexedDB
      await initIndexedDB();

      const totalCollections = COLLECTIONS.length;
      const allData = {};

      // Baixar todas as coleções em paralelo
      const downloadPromises = COLLECTIONS.map(async (collectionName, index) => {
        try {
          // Verificar cache primeiro (se não for forçar refresh)
          if (!forceRefresh) {
            const cached = await loadFromIndexedDB(collectionName);
            if (cached) {
              console.log(`💾 Usando cache para ${collectionName}`);
              allData[collectionName] = cached.data;
              setSyncProgress(((index + 1) / totalCollections) * 100);
              return cached.data;
            }
          }

          // Baixar do Firebase
          const data = await downloadCollection(collectionName);
          
          // Comprimir dados grandes (> 100 itens) com Python
          let dataToStore = data;
          let isCompressed = false;

          if (data.length > 100) {
            try {
              console.log(`🗜️ Comprimindo ${collectionName} (${data.length} itens)...`);
              dataToStore = await compressDataWithPython(data, collectionName);
              isCompressed = true;
              console.log(`✅ ${collectionName} comprimido com sucesso`);
            } catch (compressError) {
              console.warn(`⚠️ Falha ao comprimir ${collectionName}, salvando sem compressão:`, compressError);
              // CORREÇÃO: Fallback - salvar sem compressão se Python falhar
              dataToStore = data;
              isCompressed = false;
            }
          }

          // Salvar no IndexedDB
          try {
            await saveToIndexedDB(collectionName, dataToStore, isCompressed);
          } catch (dbError) {
            console.error(`❌ Erro ao salvar ${collectionName} no IndexedDB:`, dbError);
            // CORREÇÃO: Continuar mesmo se salvar falhar (usar dados em memória)
          }
          
          // Adicionar aos dados em memória (usar dados originais, não comprimidos)
          allData[collectionName] = data;

          // Atualizar progresso
          setSyncProgress(((index + 1) / totalCollections) * 100);

          return data;
        } catch (error) {
          console.error(`❌ Erro ao processar ${collectionName}:`, error);
          throw error;
        }
      });

      // Aguardar todos os downloads
      await Promise.all(downloadPromises);

      // Atualizar estado
      setCachedData(allData);
      setLastSyncTime(new Date());
      setSyncProgress(100);

      console.log('✅ Sincronização completa finalizada!');
      
      // Calcular tamanho total
      const totalRecords = Object.values(allData).reduce((sum, arr) => sum + arr.length, 0);
      console.log(`📊 Total de registros: ${totalRecords}`);

      return allData;
    } catch (error) {
      console.error('❌ Erro durante sincronização:', error);
      setError(error.message);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  }, [
    isSyncing,
    initIndexedDB,
    loadFromIndexedDB,
    downloadCollection,
    compressDataWithPython,
    saveToIndexedDB
  ]);

  /**
   * Carrega dados do cache (IndexedDB)
   */
  const loadCachedData = useCallback(async () => {
    try {
      console.log('📂 Carregando dados do cache...');
      
      await initIndexedDB();
      const allData = {};
      let hasValidCache = false;

      for (const collectionName of COLLECTIONS) {
        const cached = await loadFromIndexedDB(collectionName);
        
        if (cached) {
          hasValidCache = true;
          
          // Descomprimir se necessário
          if (cached.compressed) {
            try {
              console.log(`🗜️ Descomprimindo ${collectionName}...`);
              const decompressed = await decompressDataWithPython(cached.data);
              allData[collectionName] = JSON.parse(decompressed);
            } catch (error) {
              console.error(`❌ Erro ao descomprimir ${collectionName}:`, error);
              allData[collectionName] = [];
            }
          } else {
            allData[collectionName] = cached.data;
          }

          console.log(`✅ ${collectionName}: ${allData[collectionName].length} registros do cache`);
        } else {
          allData[collectionName] = [];
        }
      }

      if (hasValidCache) {
        setCachedData(allData);
        console.log('✅ Dados carregados do cache');
        return allData;
      }

      return null;
    } catch (error) {
      console.error('❌ Erro ao carregar cache:', error);
      return null;
    }
  }, [initIndexedDB, loadFromIndexedDB, decompressDataWithPython]);

  /**
   * Configurar listeners em tempo real (quando online)
   */
  const setupRealtimeListeners = useCallback(() => {
    if (!isOnline) return;

    console.log('🔔 Configurando listeners em tempo real...');

    // Limpar listeners anteriores
    unsubscribersRef.current.forEach(unsub => unsub());
    unsubscribersRef.current = [];

    COLLECTIONS.forEach(collectionName => {
      try {
        const unsubscribe = onSnapshot(
          collection(db, collectionName),
          (snapshot) => {
            const data = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));

            // Atualizar cache
            setCachedData(prev => ({
              ...prev,
              [collectionName]: data
            }));

            // Atualizar IndexedDB em background
            saveToIndexedDB(collectionName, data, false).catch(console.error);

            console.log(`🔄 ${collectionName} atualizado em tempo real (${data.length} registros)`);
          },
          (error) => {
            console.error(`❌ Erro no listener de ${collectionName}:`, error);
          }
        );

        unsubscribersRef.current.push(unsubscribe);
      } catch (error) {
        console.error(`❌ Erro ao criar listener para ${collectionName}:`, error);
      }
    });
  }, [isOnline, saveToIndexedDB]);

  /**
   * Limpar cache
   */
  const clearCache = useCallback(async () => {
    try {
      if (!dbRef.current) {
        await initIndexedDB();
      }

      const transaction = dbRef.current.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      await store.clear();

      setCachedData({});
      setLastSyncTime(null);
      
      console.log('🗑️ Cache limpo com sucesso');
    } catch (error) {
      console.error('❌ Erro ao limpar cache:', error);
      throw error;
    }
  }, [initIndexedDB]);

  /**
   * Inicialização
   */
  useEffect(() => {
    const init = async () => {
      try {
        // CORREÇÃO: Tentar inicializar IndexedDB com fallback
        let cacheAvailable = true;
        try {
          await initIndexedDB();
        } catch (dbError) {
          console.warn('⚠️ IndexedDB não disponível, cache desabilitado:', dbError);
          cacheAvailable = false;
          setError('Cache offline não disponível neste navegador');
        }

        // Tentar carregar do cache primeiro (se disponível)
        if (cacheAvailable) {
          const cached = await loadCachedData();

          if (cached) {
            console.log('✅ Dados carregados do cache, app pronto para uso offline');
          }
        }

        // Se online, sincronizar em background
        if (isOnline) {
          console.log('🌐 Online - iniciando sincronização em background...');
          syncAllCollections().catch(err => {
            console.error('❌ Erro na sincronização automática:', err);
            setError(`Erro na sincronização: ${err.message}`);
          });
          setupRealtimeListeners();
        } else {
          console.log('📴 Offline - usando dados em cache');
          if (!cacheAvailable) {
            setError('Sem conexão e cache não disponível - algumas funcionalidades podem não funcionar');
          }
        }
      } catch (error) {
        console.error('❌ Erro na inicialização:', error);
        setError(error.message);
      }
    };

    init();

    // Cleanup
    return () => {
      unsubscribersRef.current.forEach(unsub => {
        try {
          unsub();
        } catch (error) {
          console.error('Erro ao limpar listener:', error);
        }
      });
      unsubscribersRef.current = [];
    };
  }, []);

  /**
   * Monitorar status online/offline
   */
  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 Conexão restaurada');
      setIsOnline(true);
      syncAllCollections().catch(console.error);
      setupRealtimeListeners();
    };

    const handleOffline = () => {
      console.log('📴 Conexão perdida - modo offline');
      setIsOnline(false);
      // Limpar listeners
      unsubscribersRef.current.forEach(unsub => unsub());
      unsubscribersRef.current = [];
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncAllCollections, setupRealtimeListeners]);

  return {
    // Estado
    isOnline,
    isSyncing,
    syncProgress,
    lastSyncTime,
    cachedData,
    error,
    
    // Métodos
    syncAllCollections,
    loadCachedData,
    clearCache,
    
    // Helpers
    getCachedCollection: (collectionName) => cachedData[collectionName] || [],
    isCacheValid: lastSyncTime && (Date.now() - lastSyncTime.getTime() < CACHE_DURATION),
    cacheAge: lastSyncTime ? Math.floor((Date.now() - lastSyncTime.getTime()) / 1000 / 60) : null // em minutos
  };
};

export default useOfflineSync;
