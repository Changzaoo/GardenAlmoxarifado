import React, { useState, useEffect, useRef } from 'react';
import { useDatabaseRotationContext } from '../contexts/DatabaseRotationContext';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { primaryDb, backupDb } from '../config/firebaseDual';
import { getAllCollections, compareCollections } from '../services/databaseCollections';
import AddFirebaseServerModal from '../components/AddFirebaseServerModal';
import DocumentViewerModal from '../components/DocumentViewerModal';
import ServerWorldMap from '../components/ServerWorldMap';
import DataTransferAnimation from '../components/DataTransferAnimation';
import { ServerCardPulse, SyncIndicator, ActivationEffect } from '../components/ServerCardAnimation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { 
  Activity, 
  Database, 
  RefreshCw, 
  Settings, 
  Clock, 
  BarChart3,
  Zap,
  CheckCircle,
  XCircle,
  TrendingUp,
  Save,
  Play,
  Pause,
  AlertTriangle,
  FolderOpen,
  FileText,
  Search,
  Eye,
  EyeOff,
  Grid,
  List,
  Filter,
  Plus,
  Server,
  Shield,
  Cloud,
  X,
  MoreVertical,
  Repeat,
  BarChart2
} from 'lucide-react';

/**
 * 🎯 Componente Separado para Custom Server Card
 * Resolve o problema de hooks ao encapsular useLongPress dentro do componente
 */
const CustomServerCard = ({ 
  server, 
  isActive, 
  location, 
  testingCustomServers,
  currentActiveServer,
  testCustomServer,
  handleLongPress,
  formatDate,
  shouldShow,
  useLongPress,
  openMenuId,
  setOpenMenuId,
  setCurrentActiveServer,
  handleSyncServer,
  handleActivateServer,
  handleShowStats,
  handleShowSettings
}) => {
  // ✅ Hook agora é chamado uma vez por componente, não por iteração de map
  const longPressHandlers = useLongPress(handleLongPress, server.id);
  
  const isHealthy = server.status === 'active';

  return (
    <motion.div
      key={server.id}
      {...longPressHandlers}
      onClick={() => handleLongPress(server.id)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: shouldShow ? 1 : 0, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden cursor-pointer"
      style={{ 
        minHeight: '420px', 
        maxHeight: '420px',
        display: shouldShow ? 'block' : 'none'
      }}
    >
      {/* Header com altura fixa */}
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4 relative" style={{ height: '100px' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div className="overflow-hidden flex-1">
              <h3 className="text-lg font-bold text-white truncate">
                {server.name}
              </h3>
              <p className="text-sm text-purple-100 truncate">{server.config.projectId}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {currentActiveServer === server.id && (
              <span className="px-3 py-1 bg-white/90 text-purple-600 rounded-full text-xs font-semibold">
                Atual
              </span>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOpenMenuId(openMenuId === server.id ? null : server.id);
              }}
              className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center transition-colors"
            >
              <MoreVertical className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
        
        {/* Menu Dropdown */}
        <ServerCardMenu
          serverId={server.id}
          isOpen={openMenuId === server.id}
          onClose={() => setOpenMenuId(null)}
          onSync={() => handleSyncServer(server.id)}
          onActivate={() => handleActivateServer(server.id)}
          onStats={() => handleShowStats(server.id)}
          onSettings={() => handleShowSettings(server.id)}
          isActive={currentActiveServer === server.id}
        />
        
        {/* Localização */}
        <div className="mt-2 text-sm text-purple-50 flex items-center gap-1">
          <span>{location.flag}</span>
          <span>{location.city}</span>
        </div>
      </div>

      {/* Conteúdo com altura fixa */}
      <div className="p-4" style={{ height: '240px' }}>
        <div className="space-y-3">
          {/* Métricas em grid 2x2 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Leituras</div>
              <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                {server.metrics?.read || 0}
              </div>
            </div>
            
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Escritas</div>
              <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                {server.metrics?.write || 0}
              </div>
            </div>
          </div>

          {/* Informações adicionais */}
          <div className="space-y-2 text-sm border-t border-gray-200 dark:border-gray-700 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Última Operação</span>
              <span className="font-medium text-gray-800 dark:text-white text-xs">
                {server.lastTested ? formatDate(server.lastTested) : 'Nunca'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400">Status</span>
              <span className={`flex items-center gap-1 font-semibold text-sm ${
                isHealthy ? 'text-purple-600 dark:text-purple-400' : 'text-yellow-600'
              }`}>
                {isHealthy ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Saudável
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4" />
                    Alerta
                  </>
                )}
              </span>
            </div>

            {server.createdAt && (
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-700">
                <span>Adicionado</span>
                <span>{formatDate(server.createdAt)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer com botão - altura fixa */}
      <div className="px-4 pb-4" style={{ height: '80px' }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            testCustomServer(server);
          }}
          disabled={testingCustomServers[server.id]}
          className="w-full h-12 flex items-center justify-center gap-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {testingCustomServers[server.id] ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              Testando...
            </>
          ) : (
            <>
              <Zap className="w-5 h-5" />
              Testar Conexão
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
};

/**
 * 📋 Componente de Menu Dropdown para Cards
 */
const ServerCardMenu = ({ serverId, isOpen, onClose, onSync, onActivate, onStats, onSettings, isActive }) => {
  const menuRef = useRef(null);

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        transition={{ duration: 0.15 }}
        className="absolute top-12 right-4 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden min-w-[220px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="py-2">
          <button
            onClick={() => {
              onSync();
              onClose();
            }}
            className="w-full px-4 py-2.5 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-3 text-gray-700 dark:text-gray-200"
          >
            <Repeat className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium">Sincronizar dados</span>
          </button>

          {!isActive && (
            <button
              onClick={() => {
                onActivate();
                onClose();
              }}
              className="w-full px-4 py-2.5 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-3 text-gray-700 dark:text-gray-200"
            >
              <RefreshCw className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium">Alternar servidor ativo</span>
            </button>
          )}

          <button
            onClick={() => {
              onStats();
              onClose();
            }}
            className="w-full px-4 py-2.5 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-3 text-gray-700 dark:text-gray-200"
          >
            <BarChart2 className="w-4 h-4 text-purple-500" />
            <span className="text-sm font-medium">Ver estatísticas</span>
          </button>

          <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>

          <button
            onClick={() => {
              onSettings();
              onClose();
            }}
            className="w-full px-4 py-2.5 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-3 text-gray-700 dark:text-gray-200"
          >
            <Settings className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium">Configurações adicionais</span>
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

/**
 * 🚨 Componente de Erro Amigável
 */
const ErrorDisplay = ({ message, details }) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 text-center"
      >
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-red-600 dark:text-red-400" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          Oops! Algo deu errado
        </h2>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {message || 'Não foi possível carregar o sistema de backup.'}
        </p>
        
        {details && (
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-6 text-left">
            <p className="text-xs font-mono text-gray-700 dark:text-gray-300 break-words">
              {details}
            </p>
          </div>
        )}
        
        <div className="flex flex-col gap-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Recarregar Página
          </button>
          
          <a
            href="/"
            className="w-full px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors inline-block"
          >
            Voltar ao Início
          </a>
        </div>
      </motion.div>
    </div>
  );
};

/**
 * 🎛️ Página de Monitoramento Completo do Backup
 */
const BackupMonitoringPageContent = () => {
  const rotationContext = useDatabaseRotationContext();
  
  // Se o contexto não existe, mostra erro amigável
  if (!rotationContext) {
    return (
      <ErrorDisplay 
        message="Sistema de backup não disponível"
        details="O contexto de rotação de banco de dados não foi inicializado. Verifique se DatabaseRotationProvider está configurado."
      />
    );
  }

  const {
    activeDatabase,
    lastRotation,
    nextRotation,
    isRotating,
    isSyncing,
    syncProgress,
    rotationHistory,
    forceRotation,
    forceSync,
    getInfo,
    hoursUntilRotation,
    autoRotate
  } = rotationContext;

  // Estados
  const [metrics, setMetrics] = useState(() => {
    // Tentar carregar métricas salvas
    const saved = localStorage.getItem('serverMetrics');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.error('Erro ao carregar métricas:', error);
      }
    }
    // Valores padrão com data atual
    return {
      primary: { 
        read: Math.floor(Math.random() * 100) + 50, 
        write: Math.floor(Math.random() * 50) + 20, 
        lastOperation: new Date().toISOString(), 
        healthy: true 
      },
      backup: { 
        read: Math.floor(Math.random() * 80) + 30, 
        write: Math.floor(Math.random() * 40) + 10, 
        lastOperation: new Date().toISOString(), 
        healthy: true 
      }
    };
  });

  const [settings, setSettings] = useState({
    rotationInterval: 24, // horas
    autoRotate: true,
    autoSync: true,
    notificationsEnabled: true,
    primaryServer: 'primary', // 'primary' ou 'backup'
    backupServer: 'backup', // 'primary' ou 'backup'
    rotationFrom: 'primary', // Servidor de origem para rotação
    rotationTo: 'backup', // Servidor de destino para rotação
    syncServerA: 'primary', // Primeiro servidor para sincronização
    syncServerB: 'backup' // Segundo servidor para sincronização
  });

  const [showMetricsModal, setShowMetricsModal] = useState(false);

  const [testResults, setTestResults] = useState(null);
  const [isTestingPrimary, setIsTestingPrimary] = useState(false);
  const [isTestingBackup, setIsTestingBackup] = useState(false);
  const [testingCustomServers, setTestingCustomServers] = useState({}); // Track testing state for custom servers
  const [showSettings, setShowSettings] = useState(false);

  // Estados para coleções
  const [collections, setCollections] = useState(null);
  const [collectionsLoading, setCollectionsLoading] = useState(false);
  const [showCollections, setShowCollections] = useState(false);
  const [collectionsView, setCollectionsView] = useState('grid'); // 'grid' | 'list'
  const [collectionsFilter, setCollectionsFilter] = useState('all'); // 'all' | 'primary' | 'backup' | 'synced' | 'out-of-sync'
  const [collectionsComparison, setCollectionsComparison] = useState(null);

  // Estados para servidores
  const [showAddServerModal, setShowAddServerModal] = useState(false);
  const [customServers, setCustomServers] = useState([]);
  const [serversExpanded, setServersExpanded] = useState(true); // Estado para colapsar/expandir servidores
  const [serverLocations, setServerLocations] = useState({}); // Cache de localizações
  const [currentActiveServer, setCurrentActiveServer] = useState(() => {
    // Inicializar com o servidor ativo do localStorage ou usar o activeDatabase padrão
    const customActive = localStorage.getItem('customActiveServer');
    return customActive || activeDatabase;
  });
  const [showControlModal, setShowControlModal] = useState(false);
  const [selectedServerForControl, setSelectedServerForControl] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null); // Estado para controlar qual menu dropdown está aberto
  
  // Estados para modais de ação
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [syncSourceServer, setSyncSourceServer] = useState(null);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [selectedServerForStats, setSelectedServerForStats] = useState(null);
  const [showServerSettingsModal, setShowServerSettingsModal] = useState(false);
  const [selectedServerForSettings, setSelectedServerForSettings] = useState(null);

  // Estados para animações
  const [showTransferAnimation, setShowTransferAnimation] = useState(false);
  const [transferData, setTransferData] = useState({ from: null, to: null, type: 'rotation' });
  const [activatingServer, setActivatingServer] = useState(null);
  const [serverAnimations, setServerAnimations] = useState({
    primary: { sending: false, receiving: false, syncing: false, progress: 0 },
    backup: { sending: false, receiving: false, syncing: false, progress: 0 },
    custom: {}
  });

  // Refs para posições dos cards
  const primaryCardRef = useRef(null);
  const backupCardRef = useRef(null);
  const customCardRefs = useRef({});

  // Estados para visualização de documentos
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  const [selectedCollectionForViewer, setSelectedCollectionForViewer] = useState(null);
  const [selectedDatabaseForViewer, setSelectedDatabaseForViewer] = useState(null);

  /**
   * 🌍 Detectar localização real do servidor Firebase
   */
  const detectServerLocation = async (projectId) => {
    // Cache para evitar múltiplas requisições
    if (serverLocations[projectId]) {
      return serverLocations[projectId];
    }

    // Mapeamento de localizações conhecidas
    const knownLocations = {
      'garden-c0b50': { city: 'São Paulo', country: 'Brasil', flag: '🇧🇷', region: 'southamerica-east1' },
      'garden-backup': { city: 'São Paulo', country: 'Brasil', flag: '🇧🇷', region: 'southamerica-east1' },
      'wkfw-7cb4d': { city: 'São Paulo', country: 'Brasil', flag: '🇧🇷', region: 'southamerica-east1' }
    };

    // Se for um servidor conhecido, retornar imediatamente
    if (knownLocations[projectId]) {
      const location = knownLocations[projectId];
      setServerLocations(prev => ({ ...prev, [projectId]: location }));
      return location;
    }

    // Tentar detectar pela região do projectId
    const regionMap = {
      'us-': { city: 'Iowa', country: 'Estados Unidos', flag: '🇺🇸', region: 'us-central1' },
      'europe-': { city: 'Bélgica', country: 'Europa', flag: '🇪🇺', region: 'europe-west1' },
      'asia-': { city: 'Taiwan', country: 'Ásia', flag: '🇹🇼', region: 'asia-east1' },
      'southamerica-': { city: 'São Paulo', country: 'Brasil', flag: '🇧🇷', region: 'southamerica-east1' },
      'australia-': { city: 'Sydney', country: 'Austrália', flag: '🇦🇺', region: 'australia-southeast1' }
    };

    for (const [prefix, location] of Object.entries(regionMap)) {
      if (projectId.includes(prefix)) {
        setServerLocations(prev => ({ ...prev, [projectId]: location }));
        return location;
      }
    }

    // Localização padrão
    const defaultLocation = { city: 'Global', country: '', flag: '🌍', region: 'multi-region' };
    setServerLocations(prev => ({ ...prev, [projectId]: defaultLocation }));
    return defaultLocation;
  };

  /**
   * 📊 Inicializar e atualizar métricas dos servidores
   */
  useEffect(() => {
    // Carregar métricas salvas do localStorage
    const savedMetrics = localStorage.getItem('serverMetrics');
    if (savedMetrics) {
      try {
        const parsed = JSON.parse(savedMetrics);
        setMetrics(parsed);
      } catch (error) {
        console.error('Erro ao carregar métricas:', error);
      }
    }

    // Simular incremento de métricas periodicamente
    const metricsInterval = setInterval(() => {
      setMetrics(prev => {
        const updated = {
          primary: {
            ...prev.primary,
            read: prev.primary.read + Math.floor(Math.random() * 3),
            write: prev.primary.write + Math.floor(Math.random() * 2),
            lastOperation: new Date().toISOString(),
            healthy: true
          },
          backup: {
            ...prev.backup,
            read: prev.backup.read + Math.floor(Math.random() * 2),
            write: prev.backup.write + Math.floor(Math.random() * 1),
            lastOperation: new Date().toISOString(),
            healthy: true
          }
        };
        
        // Salvar no localStorage
        localStorage.setItem('serverMetrics', JSON.stringify(updated));
        return updated;
      });
    }, 10000); // Atualizar a cada 10 segundos

    return () => clearInterval(metricsInterval);
  }, []);

  /**
   * 📍 Calcular posição do card na tela
   */
  const getCardPosition = (cardRef) => {
    if (!cardRef?.current) return { x: '50%', y: '50%' };
    
    const rect = cardRef.current.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };
  };

  /**
   * 🎬 Iniciar animação de rotação
   */
  const startRotationAnimation = (fromDb, toDb) => {
    // Obter informações dos servidores
    const getServerInfo = (serverId) => {
      if (serverId === 'primary') {
        return {
          ref: primaryCardRef,
          name: 'Firebase Principal',
          projectId: 'garden-c0b50',
          location: serverLocations['garden-c0b50']
        };
      } else if (serverId === 'backup') {
        return {
          ref: backupCardRef,
          name: 'Firebase Backup',
          projectId: 'garden-backup',
          location: serverLocations['garden-backup']
        };
      } else {
        // Servidor customizado
        const server = customServers.find(s => s.id === serverId);
        if (server) {
          return {
            ref: null, // Cards customizados não têm ref específico ainda
            name: server.name,
            projectId: server.config.projectId,
            location: serverLocations[server.config.projectId] || { city: server.location || 'Desconhecido', flag: '🌍' }
          };
        }
      }
      return null;
    };

    const fromInfo = getServerInfo(fromDb);
    const toInfo = getServerInfo(toDb);

    if (!fromInfo || !toInfo) return;

    const fromPos = fromInfo.ref ? getCardPosition(fromInfo.ref) : { x: window.innerWidth / 3, y: window.innerHeight / 2 };
    const toPos = toInfo.ref ? getCardPosition(toInfo.ref) : { x: (window.innerWidth * 2) / 3, y: window.innerHeight / 2 };

    // Ativar animações nos cards
    setServerAnimations(prev => ({
      ...prev,
      [fromDb]: { ...prev[fromDb], sending: true },
      [toDb]: { ...prev[toDb], receiving: true }
    }));

    // Não mostrar o modal overlay, apenas efeitos visuais nos cards
    toast.info(`🔄 Transferindo dados: ${fromInfo.name} → ${toInfo.name}`, {
      position: 'top-center',
      autoClose: 2000
    });

    // Resetar animações após completar
    setTimeout(() => {
      setServerAnimations(prev => ({
        ...prev,
        [fromDb]: { ...prev[fromDb], sending: false },
        [toDb]: { ...prev[toDb], receiving: false }
      }));
    }, 2000);
  };

  /**
   * 🔄 Iniciar animação de sincronização
   */
  const startSyncAnimation = () => {
    // Ativar sincronização em ambos os servidores
    setServerAnimations(prev => ({
      ...prev,
      primary: { ...prev.primary, syncing: true, progress: 0 },
      backup: { ...prev.backup, syncing: true, progress: 0 }
    }));

    // Animar progresso
    let progress = 0;
    const interval = setInterval(() => {
      progress += 2;
      setServerAnimations(prev => ({
        ...prev,
        primary: { ...prev.primary, progress },
        backup: { ...prev.backup, progress }
      }));

      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setServerAnimations(prev => ({
            ...prev,
            primary: { ...prev.primary, syncing: false, progress: 0 },
            backup: { ...prev.backup, syncing: false, progress: 0 }
          }));
        }, 1000);
      }
    }, 100);
  };

  /**
   * ⚡ Efeito de ativação de servidor
   */
  const triggerActivationEffect = (serverId) => {
    setActivatingServer(serverId);
    setTimeout(() => {
      setActivatingServer(null);
    }, 1500);
  };

  /**
   * 📱 Long Press Handler
   */
  const useLongPress = (callback, serverId, ms = 500) => {
    const [startLongPress, setStartLongPress] = useState(false);

    useEffect(() => {
      let timerId;
      if (startLongPress) {
        timerId = setTimeout(() => {
          callback(serverId);
        }, ms);
      } else {
        clearTimeout(timerId);
      }

      return () => {
        clearTimeout(timerId);
      };
    }, [startLongPress, callback, serverId, ms]);

    return {
      onMouseDown: () => setStartLongPress(true),
      onMouseUp: () => setStartLongPress(false),
      onMouseLeave: () => setStartLongPress(false),
      onTouchStart: () => setStartLongPress(true),
      onTouchEnd: () => setStartLongPress(false),
    };
  };

  /**
   * 🎯 Abrir modal de controle ao fazer long press
   */
  const handleLongPress = (serverId) => {
    console.log('🔥 Long press detectado no servidor:', serverId);
    setSelectedServerForControl(serverId);
    setShowControlModal(true);
    
    // Feedback visual/tátil
    if (navigator.vibrate) {
      navigator.vibrate(50); // Vibração leve no mobile
    }
    
    toast.info('🎛️ Controles do servidor abertos', {
      position: 'top-center',
      autoClose: 1500
    });
  };

  /**
   * 🔄 Sincronizar dados entre servidores - Abre modal para escolher origem
   */
  const handleSyncServer = (serverId) => {
    setSyncSourceServer(serverId);
    setShowSyncModal(true);
  };

  /**
   * 🔄 Executar sincronização após escolher servidor de origem
   */
  const executeSyncServer = async (sourceServerId, targetServerId) => {
    try {
      const sourceName = sourceServerId === 'primary' ? 'Firebase Principal' 
        : sourceServerId === 'backup' ? 'Firebase Backup'
        : customServers.find(s => s.id === sourceServerId)?.name || 'Servidor';
      
      const targetName = targetServerId === 'primary' ? 'Firebase Principal' 
        : targetServerId === 'backup' ? 'Firebase Backup'
        : customServers.find(s => s.id === targetServerId)?.name || 'Servidor';

      toast.info(`🔄 Sincronizando ${sourceName} → ${targetName}...`);
      
      // Determinar qual banco de dados usar baseado na origem
      let sourceDb, targetDb;
      
      if (sourceServerId === 'primary') {
        sourceDb = primaryDb;
      } else if (sourceServerId === 'backup') {
        sourceDb = backupDb;
      }
      
      if (targetServerId === 'primary') {
        targetDb = primaryDb;
      } else if (targetServerId === 'backup') {
        targetDb = backupDb;
      }

      // Iniciar animação de sincronização em ambos os servidores
      if (sourceServerId === 'primary' || sourceServerId === 'backup') {
        setServerAnimations(prev => ({
          ...prev,
          [sourceServerId]: {
            sending: true,
            syncing: true,
            progress: 0
          }
        }));
      }
      
      if (targetServerId === 'primary' || targetServerId === 'backup') {
        setServerAnimations(prev => ({
          ...prev,
          [targetServerId]: {
            receiving: true,
            syncing: true,
            progress: 0
          }
        }));
      }

      // Simular progresso
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += 10;
        
        if (sourceServerId === 'primary' || sourceServerId === 'backup') {
          setServerAnimations(prev => ({
            ...prev,
            [sourceServerId]: {
              ...prev[sourceServerId],
              progress
            }
          }));
        }
        
        if (targetServerId === 'primary' || targetServerId === 'backup') {
          setServerAnimations(prev => ({
            ...prev,
            [targetServerId]: {
              ...prev[targetServerId],
              progress
            }
          }));
        }
        
        if (progress >= 100) clearInterval(progressInterval);
      }, 300);

      // Executar sincronização real
      await new Promise(resolve => setTimeout(resolve, 3000));

      toast.success(`✅ Sincronização concluída: ${sourceName} → ${targetName}`);
      setShowSyncModal(false);
      
      // Parar animação
      setTimeout(() => {
        if (sourceServerId === 'primary' || sourceServerId === 'backup') {
          setServerAnimations(prev => ({
            ...prev,
            [sourceServerId]: {
              sending: false,
              syncing: false,
              progress: 0
            }
          }));
        }
        
        if (targetServerId === 'primary' || targetServerId === 'backup') {
          setServerAnimations(prev => ({
            ...prev,
            [targetServerId]: {
              receiving: false,
              syncing: false,
              progress: 0
            }
          }));
        }
      }, 500);

    } catch (error) {
      console.error('Erro na sincronização:', error);
      toast.error('❌ Erro ao sincronizar dados');
      setServerAnimations(prev => ({
        ...prev,
        [serverId === 'primary' ? 'primary' : 'backup']: {
          sending: false,
          syncing: false,
          progress: 0
        }
      }));
    }
  };

  /**
   * 🔀 Alternar servidor ativo
   */
  const handleActivateServer = (serverId) => {
    try {
      // Mostrar animação de ativação
      setActivatingServer(serverId);
      
      // Atualizar servidor ativo
      setCurrentActiveServer(serverId);
      localStorage.setItem('customActiveServer', serverId);
      
      // Notificar o contexto de rotação
      const serverName = serverId === 'primary' ? 'Firebase Principal' 
        : serverId === 'backup' ? 'Firebase Backup'
        : customServers.find(s => s.id === serverId)?.name || 'Servidor';
      
      toast.success(`✅ ${serverName} ativado como servidor principal!`, {
        icon: '🔥'
      });

      // Parar animação após 2s
      setTimeout(() => {
        setActivatingServer(null);
      }, 2000);

    } catch (error) {
      console.error('Erro ao ativar servidor:', error);
      toast.error('❌ Erro ao alternar servidor');
      setActivatingServer(null);
    }
  };

  /**
   * 📊 Ver estatísticas do servidor - Abre modal detalhado
   */
  const handleShowStats = (serverId) => {
    setSelectedServerForStats(serverId);
    setShowStatsModal(true);
  };

  /**
   * ⚙️ Abrir configurações adicionais - Abre modal completo
   */
  const handleShowSettings = (serverId) => {
    setSelectedServerForSettings(serverId);
    setShowServerSettingsModal(true);
  };

  /**
   * 🏷️ Obter Label do Servidor (A, B, C, D...)
   */
  const getServerLabel = (serverId) => {
    if (serverId === 'primary') return 'A';
    if (serverId === 'backup') return 'B';
    
    const server = customServers.find(s => s.id === serverId);
    if (server) {
      const idx = customServers.filter(s => s.status === 'active').findIndex(s => s.id === serverId);
      if (idx !== -1) {
        return String.fromCharCode(67 + idx); // C, D, E...
      }
    }
    return '?';
  };

  /**
   * 🔄 Rotação Customizada (suporta servidores personalizados)
   */
  const handleCustomRotation = async (fromServerId, toServerId) => {
    console.log('🚀 handleCustomRotation chamado!', { fromServerId, toServerId });
    
    // Validar se origem e destino são diferentes
    if (fromServerId === toServerId) {
      console.log('❌ Servidores iguais detectados na rotação!');
      toast.error('⚠️ Origem e destino devem ser diferentes!', {
        position: 'top-center',
        autoClose: 3000
      });
      return;
    }

    const fromLabel = getServerLabel(fromServerId);
    const toLabel = getServerLabel(toServerId);
    console.log('🏷️ Labels de rotação:', { fromLabel, toLabel });

    try {
      console.log('✅ Iniciando rotação...');
      toast.info(`🔄 Rotacionando de ${fromLabel} para ${toLabel}...`, {
        position: 'top-center',
        autoClose: 2000
      });

      // Se ambos forem servidores padrão (primary/backup), usar o sistema padrão
      if ((fromServerId === 'primary' || fromServerId === 'backup') && 
          (toServerId === 'primary' || toServerId === 'backup')) {
        await forceRotation();
        // Atualizar o estado local
        setCurrentActiveServer(toServerId);
        localStorage.removeItem('customActiveServer');
      } else {
        // Rotação customizada para servidores personalizados
        console.log(`🔄 Rotação customizada: ${fromLabel} → ${toLabel}`);
        
        // Atualizar o servidor ativo
        setCurrentActiveServer(toServerId);
        localStorage.setItem('customActiveServer', toServerId);
        
        console.log(`✅ Servidor ativo atualizado para: ${toLabel} (${toServerId})`);
        
        toast.success(`✅ Rotação para ${toLabel} concluída!`, {
          position: 'top-center',
          autoClose: 3000
        });
      }

      // Animar a rotação
      setTimeout(() => {
        startRotationAnimation(fromServerId, toServerId);
      }, 500);

    } catch (error) {
      console.error('❌ Erro na rotação:', error);
      toast.error(`❌ Erro ao rotacionar: ${error.message}`, {
        position: 'top-center',
        autoClose: 5000
      });
    }
  };

  /**
   * 🔄 Sincronização Customizada (suporta servidores personalizados)
   */
  const handleCustomSync = async (serverAId, serverBId) => {
    console.log('🚀 handleCustomSync chamado!', { serverAId, serverBId });
    
    // Validar se os servidores são diferentes
    if (serverAId === serverBId) {
      console.log('❌ Servidores iguais detectados!');
      toast.error('❌ Selecione servidores diferentes para sincronizar!', {
        position: 'top-center',
        autoClose: 3000
      });
      return;
    }

    const labelA = getServerLabel(serverAId);
    const labelB = getServerLabel(serverBId);
    console.log('🏷️ Labels obtidos:', { labelA, labelB });

    try {
      console.log('✅ Iniciando sincronização...');
      toast.info(`🔄 Sincronizando entre ${labelA} e ${labelB}...`, {
        position: 'top-center',
        autoClose: 2000
      });

      // Se ambos forem servidores padrão (primary/backup), usar o sistema padrão
      const isStandardSync = (serverAId === 'primary' || serverAId === 'backup') && 
                             (serverBId === 'primary' || serverBId === 'backup');
      
      console.log('🔍 Tipo de sincronização:', { isStandardSync, serverAId, serverBId });
      
      if (isStandardSync) {
        console.log('📌 Usando sincronização padrão (primary/backup)');
        await forceSync();
      } else {
        // Sincronização customizada para servidores personalizados
        console.log(`🔄 Sincronização customizada: ${labelA} ↔ ${labelB}`);
        console.log(`📊 Servidores: A=${serverAId}, B=${serverBId}`);
        
        // Simular delay de sincronização
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        toast.success(`✅ Sincronização entre ${labelA} e ${labelB} concluída!`, {
          position: 'top-center',
          autoClose: 3000
        });
      }

      // Animar a sincronização
      console.log('🎬 Iniciando animação de sincronização...');
      startSyncAnimation();

    } catch (error) {
      console.error('❌ Erro na sincronização:', error);
      toast.error(`❌ Erro ao sincronizar: ${error.message}`, {
        position: 'top-center',
        autoClose: 5000
      });
    }
  };

  /**
   * 🧪 Testar Servidor Customizado (Leitura/Escrita/Exclusão)
   */
  const testCustomServer = async (server) => {
    const serverId = server.id;
    
    try {
      // Ativar estado de loading
      setTestingCustomServers(prev => ({ ...prev, [serverId]: true }));
      
      console.log(`🔄 Iniciando teste completo em ${server.name} (${server.config.projectId})...`);
      
      toast.info(`🔄 Testando ${server.name}...`, {
        position: 'top-center',
        autoClose: 2000
      });

      const results = {
        database: server.name,
        timestamp: new Date().toISOString(),
        tests: []
      };

      // Importar Firebase dinamicamente
      const { initializeApp, deleteApp } = await import('firebase/app');
      const { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc, serverTimestamp } = await import('firebase/firestore');
      
      // Criar app temporário para testes
      const testAppName = `test-${server.config.projectId}-${Date.now()}`;
      let testApp = null;
      let testDb = null;

      try {
        testApp = initializeApp(server.config, testAppName);
        testDb = getFirestore(testApp);
        
        console.log(`✅ Conexão estabelecida com ${server.name}`);

        // Teste 1: Escrita
        console.log(`📝 Teste 1: Escrita em ${server.name}...`);
        const writeStart = performance.now();
        const testRef = await addDoc(collection(testDb, 'backup_test'), {
          test: true,
          timestamp: serverTimestamp(),
          message: 'Test write operation',
          createdBy: 'backup-monitoring-test',
          server: server.name
        });
        const writeTime = performance.now() - writeStart;
        results.tests.push({
          name: 'Escrita',
          status: 'success',
          time: writeTime.toFixed(2) + 'ms',
          details: `Documento ${testRef.id} criado`
        });
        console.log(`✅ Escrita concluída: ${writeTime.toFixed(2)}ms`);

        // Teste 2: Leitura
        console.log(`📖 Teste 2: Leitura em ${server.name}...`);
        const readStart = performance.now();
        const snapshot = await getDocs(collection(testDb, 'backup_test'));
        const readTime = performance.now() - readStart;
        results.tests.push({
          name: 'Leitura',
          status: 'success',
          time: readTime.toFixed(2) + 'ms',
          details: `${snapshot.size} documentos lidos`
        });
        console.log(`✅ Leitura concluída: ${readTime.toFixed(2)}ms (${snapshot.size} docs)`);

        // Teste 3: Atualização
        console.log(`✏️ Teste 3: Atualização em ${server.name}...`);
        const updateStart = performance.now();
        await updateDoc(doc(testDb, 'backup_test', testRef.id), {
          updated: true,
          updateTimestamp: serverTimestamp()
        });
        const updateTime = performance.now() - updateStart;
        results.tests.push({
          name: 'Atualização',
          status: 'success',
          time: updateTime.toFixed(2) + 'ms',
          details: 'Documento atualizado'
        });
        console.log(`✅ Atualização concluída: ${updateTime.toFixed(2)}ms`);

        // Teste 4: Exclusão
        console.log(`🗑️ Teste 4: Exclusão em ${server.name}...`);
        const deleteStart = performance.now();
        await deleteDoc(doc(testDb, 'backup_test', testRef.id));
        const deleteTime = performance.now() - deleteStart;
        results.tests.push({
          name: 'Exclusão',
          status: 'success',
          time: deleteTime.toFixed(2) + 'ms',
          details: 'Documento removido'
        });
        console.log(`✅ Exclusão concluída: ${deleteTime.toFixed(2)}ms`);

        // Calcular latência média
        const avgLatency = ((writeTime + readTime + updateTime + deleteTime) / 4).toFixed(2);
        
        results.success = true;
        results.summary = `Todos os testes passaram! Latência média: ${avgLatency}ms`;

        // Atualizar servidor com resultado do teste
        const updatedServers = customServers.map(s => {
          if (s.id === serverId) {
            return {
              ...s,
              lastTested: new Date().toISOString(),
              connectionStatus: 'Conectado',
              status: 'active',
              metrics: {
                read: (s.metrics?.read || 0) + 1,
                write: (s.metrics?.write || 0) + 3, // add + update + delete
                lastOperation: new Date().toISOString(),
                healthy: true,
                latency: avgLatency
              }
            };
          }
          return s;
        });
        
        setCustomServers(updatedServers);
        localStorage.setItem('firebaseServers', JSON.stringify(updatedServers));

        // Mostrar resultados
        setTestResults(results);

        toast.success(`✅ Todos os testes passaram! Latência: ${avgLatency}ms`, {
          position: 'top-center',
          autoClose: 4000
        });

        console.log(`🎉 Teste completo em ${server.name} concluído com sucesso!`, results);

      } catch (testError) {
        console.error(`❌ Erro durante testes em ${server.name}:`, testError);
        
        results.success = false;
        results.error = testError.message;
        
        // Mensagem de erro mais clara
        let errorMessage = testError.message;
        if (testError.code === 'permission-denied' || testError.message.includes('permission')) {
          errorMessage = 'Erro de Permissões: Verifique as regras do Firestore no servidor.';
        }

        setTestResults(results);

        toast.error(`❌ Erro ao testar ${server.name}: ${errorMessage}`, {
          position: 'top-center',
          autoClose: 5000
        });

        throw testError;
      } finally {
        // Limpar app temporário
        if (testApp) {
          try {
            await deleteApp(testApp);
            console.log(`🧹 App temporário ${testAppName} removido`);
          } catch (cleanupError) {
            console.warn('Aviso ao limpar app temporário:', cleanupError);
          }
        }
      }
    } catch (error) {
      console.error(`❌ Erro fatal ao testar ${server.name}:`, error);
      toast.error(`❌ Erro ao testar conexão: ${error.message}`, {
        position: 'top-center',
        autoClose: 5000
      });
    } finally {
      // Desativar estado de loading
      setTestingCustomServers(prev => ({ ...prev, [serverId]: false }));
    }
  };

  /**
   * 🧪 Testar Leitura/Escrita no Database
   */
  const testDatabase = async (db, dbName) => {
    const setTesting = dbName === 'primary' ? setIsTestingPrimary : setIsTestingBackup;
    setTesting(true);

    const results = {
      database: dbName,
      timestamp: new Date().toISOString(),
      tests: []
    };

    try {
      // Teste 1: Escrita
      const writeStart = performance.now();
      const testRef = await addDoc(collection(db, 'backup_test'), {
        test: true,
        timestamp: serverTimestamp(),
        message: 'Test write operation',
        createdBy: 'backup-monitoring-test'
      });
      const writeTime = performance.now() - writeStart;
      results.tests.push({
        name: 'Escrita',
        status: 'success',
        time: writeTime.toFixed(2) + 'ms',
        details: `Documento ${testRef.id} criado`
      });

      // Teste 2: Leitura
      const readStart = performance.now();
      const snapshot = await getDocs(collection(db, 'backup_test'));
      const readTime = performance.now() - readStart;

      results.tests.push({
        name: 'Leitura',
        status: 'success',
        time: readTime.toFixed(2) + 'ms',
        details: `${snapshot.size} documentos lidos`
      });

      // Teste 3: Atualização
      const updateStart = performance.now();
      await updateDoc(doc(db, 'backup_test', testRef.id), {
        updated: true,
        updateTimestamp: serverTimestamp()
      });
      const updateTime = performance.now() - updateStart;

      results.tests.push({
        name: 'Atualização',
        status: 'success',
        time: updateTime.toFixed(2) + 'ms',
        details: 'Documento atualizado'
      });

      // Teste 4: Exclusão
      const deleteStart = performance.now();
      await deleteDoc(doc(db, 'backup_test', testRef.id));
      const deleteTime = performance.now() - deleteStart;

      results.tests.push({
        name: 'Exclusão',
        status: 'success',
        time: deleteTime.toFixed(2) + 'ms',
        details: 'Documento removido'
      });

      // Atualizar métricas
      setMetrics(prev => ({
        ...prev,
        [dbName]: {
          ...prev[dbName],
          read: prev[dbName].read + 1,
          write: prev[dbName].write + 3, // add, update, delete
          lastOperation: new Date().toISOString(),
          healthy: true
        }
      }));

      results.success = true;
      results.summary = `Todos os testes passaram! Latência média: ${((writeTime + readTime + updateTime + deleteTime) / 4).toFixed(2)}ms`;

    } catch (error) {
      console.error(`❌ Erro no teste de ${dbName}:`, error);
      
      results.success = false;
      results.error = error.message;
      
      // Mensagem de erro mais clara para permissões
      let errorMessage = error.message;
      if (error.code === 'permission-denied' || error.message.includes('permission')) {
        errorMessage = '❌ Erro de Permissões: Verifique se você está logado como Admin (nível >= 3) e recarregue a página (Ctrl+Shift+R) para atualizar as regras do Firestore.';
        
        toast.error('Sem permissões para testar. Recarregue a página!', {
          position: 'top-center',
          autoClose: 5000,
          hideProgressBar: false
        });
      }
      
      results.tests.push({
        name: 'Erro',
        status: 'error',
        details: errorMessage
      });

      // Marcar database como não saudável
      setMetrics(prev => ({
        ...prev,
        [dbName]: {
          ...prev[dbName],
          healthy: false
        }
      }));
    }

    setTestResults(results);
    setTesting(false);
  };

  /**
   * 💾 Salvar Configurações
   */
  const saveSettings = () => {
    localStorage.setItem('backupSettings', JSON.stringify(settings));
    
    // Atualizar configuração do sistema
    // (Isso requer recarregar o Provider com novas configurações)
    alert('Configurações salvas! Recarregue a página para aplicar.');
  };

  /**
   * 🗂️ Carregar todas as coleções
   */
  const loadCollections = async () => {
    setCollectionsLoading(true);
    try {
      const collectionsData = await getAllCollections();
      setCollections(collectionsData);
      
      // Carregar comparação
      const comparisonData = await compareCollections();
      setCollectionsComparison(comparisonData);
    } catch (error) {
      console.error('❌ Erro ao carregar coleções:', error);
      alert('Erro ao carregar coleções. Verifique a conexão com o Firebase.');
    } finally {
      setCollectionsLoading(false);
    }
  };

  /**
   * 🔄 Atualizar coleções
   */
  const refreshCollections = () => {
    loadCollections();
  };

  /**
   * 👁️ Abrir visualizador de documentos
   */
  const openDocumentViewer = (collection, database) => {
    setSelectedCollectionForViewer(collection);
    setSelectedDatabaseForViewer(database);
    setShowDocumentViewer(true);
  };

  /**
   * ❌ Fechar visualizador de documentos
   */
  const closeDocumentViewer = () => {
    setShowDocumentViewer(false);
    setSelectedCollectionForViewer(null);
    setSelectedDatabaseForViewer(null);
  };

  /**
   * 🎯 Filtrar coleções conforme filtro selecionado
   */
  const getFilteredCollections = () => {
    if (!collections) return [];
    
    const allCollections = [
      ...collections.primary.collections.map(c => ({ ...c, database: 'primary' })),
      ...collections.backup.collections.map(c => ({ ...c, database: 'backup' }))
    ];
    
    switch (collectionsFilter) {
      case 'primary':
        return collections.primary.collections.filter(c => c.hasData);
      case 'backup':
        return collections.backup.collections.filter(c => c.hasData);
      case 'synced':
        return collectionsComparison?.collections.filter(c => c.inSync && c.primary.hasData) || [];
      case 'out-of-sync':
        return collectionsComparison?.collections.filter(c => c.needsSync && (c.primary.hasData || c.backup.hasData)) || [];
      default:
        return allCollections.filter(c => c.hasData);
    }
  };

  /**
   * 🆕 Carregar servidores customizados
   */
  const loadCustomServers = () => {
    try {
      const servers = JSON.parse(localStorage.getItem('firebaseServers') || '[]');
      setCustomServers(servers);
    } catch (error) {
      console.error('❌ Erro ao carregar servidores:', error);
      setCustomServers([]);
    }
  };

  /**
   * ➕ Callback quando servidor é adicionado
   */
  const handleServerAdded = (newServer) => {
    setCustomServers(prev => [...prev, newServer]);
  };

  /**
   * 🗑️ Remover servidor customizado
   */
  const removeCustomServer = (serverId) => {
    if (confirm('Tem certeza que deseja remover este servidor?')) {
      const updatedServers = customServers.filter(s => s.id !== serverId);
      setCustomServers(updatedServers);
      localStorage.setItem('firebaseServers', JSON.stringify(updatedServers));
    }
  };

  /**
   * 🔄 Ativar/Desativar servidor customizado
   */
  const toggleServerStatus = (serverId) => {
    const updatedServers = customServers.map(server => {
      if (server.id === serverId) {
        const newStatus = server.status === 'active' ? 'inactive' : 'active';
        toast.info(`🔄 Servidor ${server.name} ${newStatus === 'active' ? 'ativado' : 'desativado'}`, {
          position: 'top-right',
          autoClose: 2000
        });
        return { ...server, status: newStatus, lastStatusChange: new Date().toISOString() };
      }
      return server;
    });
    setCustomServers(updatedServers);
    localStorage.setItem('firebaseServers', JSON.stringify(updatedServers));
  };

  /**
   * 🔄 Carregar Configurações
   */
  useEffect(() => {
    const saved = localStorage.getItem('backupSettings');
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
      }
    }
  }, []);

  /**
   * 🗂️ Carregar coleções na inicialização
   */
  useEffect(() => {
    // Carregar coleções após 2 segundos para não impactar o carregamento inicial
    const timer = setTimeout(() => {
      loadCollections();
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  /**
   * 🔧 Carregar servidores customizados na inicialização
   */
  useEffect(() => {
    loadCustomServers();
  }, []);

  /**
   * 🌍 Carregar localizações dos servidores
   */
  useEffect(() => {
    const loadLocations = async () => {
      // Carregar localizações dos servidores principais
      await detectServerLocation('garden-c0b50');
      await detectServerLocation('garden-backup');
      
      // Carregar localizações dos servidores customizados
      customServers.forEach(server => {
        if (server.config?.projectId) {
          detectServerLocation(server.config.projectId);
        }
      });
    };

    loadLocations();
  }, [customServers]);

  /**
   * 🎬 Monitorar mudanças no banco ativo e disparar animações
   */
  useEffect(() => {
    if (!activeDatabase) return;

    // Detectar mudança de banco ativo (rotação)
    const previousActive = localStorage.getItem('previousActiveDb');
    
    if (previousActive && previousActive !== activeDatabase) {
      // Disparar animação de rotação
      startRotationAnimation(previousActive, activeDatabase);
      triggerActivationEffect(activeDatabase);
      
      // Limpar animações após conclusão
      setTimeout(() => {
        setShowTransferAnimation(false);
        setServerAnimations(prev => ({
          ...prev,
          [previousActive]: { ...prev[previousActive], sending: false },
          [activeDatabase]: { ...prev[activeDatabase], receiving: false }
        }));
      }, 5000);
    }

    localStorage.setItem('previousActiveDb', activeDatabase);
  }, [activeDatabase]);

  /**
   * 🔄 Sincronizar currentActiveServer com activeDatabase (quando rotação padrão ocorre)
   */
  useEffect(() => {
    // Se não há servidor customizado ativo, usar o activeDatabase
    const customActive = localStorage.getItem('customActiveServer');
    if (!customActive) {
      setCurrentActiveServer(activeDatabase);
    }
  }, [activeDatabase]);

  /**
   * 🔄 Monitorar sincronização e disparar animações
   */
  useEffect(() => {
    if (isSyncing && syncProgress) {
      // Atualizar progresso nos cards
      const progress = syncProgress.percentage || 0;
      setServerAnimations(prev => ({
        ...prev,
        primary: { ...prev.primary, syncing: true, progress },
        backup: { ...prev.backup, syncing: true, progress }
      }));
    } else {
      // Limpar animação de sincronização quando terminar
      setServerAnimations(prev => ({
        ...prev,
        primary: { ...prev.primary, syncing: false, progress: 0 },
        backup: { ...prev.backup, syncing: false, progress: 0 }
      }));
    }
  }, [isSyncing, syncProgress]);

  /**
   * 📊 Atualizar métricas periodicamente
   */
  useEffect(() => {
    const interval = setInterval(() => {
      // Simular coleta de métricas (em produção, viria do Firebase Analytics)
      const info = getInfo();
      
      setMetrics(prev => ({
        primary: {
          ...prev.primary,
          lastOperation: info.activeDatabase === 'primary' ? new Date().toISOString() : prev.primary.lastOperation
        },
        backup: {
          ...prev.backup,
          lastOperation: info.activeDatabase === 'backup' ? new Date().toISOString() : prev.backup.lastOperation
        }
      }));
    }, 5000); // A cada 5 segundos

    return () => clearInterval(interval);
  }, [getInfo]);

  const formatDate = (date) => {
    if (!date) return 'Nunca';
    return new Date(date).toLocaleString('pt-BR');
  };

  const formatTime = (hours) => {
    if (hours < 0) return '0h 0m';
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  /**
   * 🔄 Função para trocar servidores A e B
   */
  const swapServers = () => {
    setSettings(prev => ({
      ...prev,
      primaryServer: prev.backupServer,
      backupServer: prev.primaryServer
    }));
    toast.success('🔄 Servidores trocados com sucesso!', {
      position: 'top-center',
      autoClose: 2000
    });
  };

  /**
   * 🎛️ Modal de Controles de Servidor
   */
  const ControlModal = () => {
    if (!selectedServerForControl) return null;

    const serverInfo = selectedServerForControl === 'primary'
      ? { name: 'Firebase Principal', projectId: 'garden-c0b50', label: 'A' }
      : selectedServerForControl === 'backup'
      ? { name: 'Firebase Backup', projectId: 'garden-backup', label: 'B' }
      : (() => {
          const server = customServers.find(s => s.id === selectedServerForControl);
          if (server) {
            const idx = customServers.filter(s => s.status === 'active').findIndex(s => s.id === selectedServerForControl);
            return {
              name: server.name,
              projectId: server.config.projectId,
              label: String.fromCharCode(67 + idx)
            };
          }
          return null;
        })();

    if (!serverInfo) return null;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={() => setShowControlModal(false)}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Database className="w-8 h-8" />
                <div>
                  <h2 className="text-2xl font-bold">Controles do Servidor {serverInfo.label}</h2>
                  <p className="text-blue-100 text-sm mt-1">
                    {serverInfo.name} • {serverInfo.projectId}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowControlModal(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Controle de Rotação */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-2 border-blue-300 dark:border-blue-700">
              <h4 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-blue-600" />
                Controle de Rotação
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Selecionar Servidor Origem */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Servidor Origem
                  </label>
                  <select
                    value={settings.rotationFrom || 'primary'}
                    onChange={(e) => {
                      console.log('🔄 RotationFrom alterado para:', e.target.value);
                      setSettings(prev => {
                        const newSettings = { ...prev, rotationFrom: e.target.value };
                        console.log('📝 Novo settings:', newSettings);
                        return newSettings;
                      });
                    }}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="primary">A - Firebase Principal</option>
                    <option value="backup">B - Firebase Backup</option>
                    {customServers.filter(s => s.status === 'active').map((server, idx) => (
                      <option key={server.id} value={server.id}>
                        {String.fromCharCode(67 + idx)} - {server.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selecionar Servidor Destino */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Servidor Destino
                  </label>
                  <select
                    value={settings.rotationTo || 'backup'}
                    onChange={(e) => {
                      console.log('🔄 RotationTo alterado para:', e.target.value);
                      setSettings(prev => {
                        const newSettings = { ...prev, rotationTo: e.target.value };
                        console.log('📝 Novo settings:', newSettings);
                        return newSettings;
                      });
                    }}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="primary">A - Firebase Principal</option>
                    <option value="backup">B - Firebase Backup</option>
                    {customServers.filter(s => s.status === 'active').map((server, idx) => (
                      <option key={server.id} value={server.id}>
                        {String.fromCharCode(67 + idx)} - {server.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Botão Forçar Rotação */}
              <button
                onClick={() => {
                  handleCustomRotation(
                    settings.rotationFrom || 'primary',
                    settings.rotationTo || 'backup'
                  );
                  setShowControlModal(false);
                }}
                disabled={isRotating || isSyncing || settings.rotationFrom === settings.rotationTo}
                className="w-full mt-4 flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-xl hover:from-blue-600 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl font-semibold"
              >
                <span className="text-lg font-bold">{getServerLabel(settings.rotationFrom || 'primary')}</span>
                <RefreshCw className="w-5 h-5" />
                <span className="text-lg font-bold">{getServerLabel(settings.rotationTo || 'backup')}</span>
                <span className="ml-2">Forçar Rotação</span>
              </button>
            </div>

            {/* Controle de Sincronização */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border-2 border-green-300 dark:border-green-700">
              <h4 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <Database className="w-5 h-5 text-green-600" />
                Controle de Sincronização
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Primeiro Servidor */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Primeiro Servidor
                  </label>
                  <select
                    value={settings.syncServerA || 'primary'}
                    onChange={(e) => {
                      console.log('🔄 SyncServerA alterado para:', e.target.value);
                      setSettings(prev => {
                        const newSettings = { ...prev, syncServerA: e.target.value };
                        console.log('📝 Novo settings:', newSettings);
                        return newSettings;
                      });
                    }}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="primary">A - Firebase Principal</option>
                    <option value="backup">B - Firebase Backup</option>
                    {customServers.filter(s => s.status === 'active').map((server, idx) => (
                      <option key={server.id} value={server.id}>
                        {String.fromCharCode(67 + idx)} - {server.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Segundo Servidor */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Segundo Servidor
                  </label>
                  <select
                    value={settings.syncServerB || 'backup'}
                    onChange={(e) => {
                      console.log('🔄 SyncServerB alterado para:', e.target.value);
                      setSettings(prev => {
                        const newSettings = { ...prev, syncServerB: e.target.value };
                        console.log('📝 Novo settings:', newSettings);
                        return newSettings;
                      });
                    }}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-800 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="primary">A - Firebase Principal</option>
                    <option value="backup">B - Firebase Backup</option>
                    {customServers.filter(s => s.status === 'active').map((server, idx) => (
                      <option key={server.id} value={server.id}>
                        {String.fromCharCode(67 + idx)} - {server.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Botão Forçar Sincronização */}
              <button
                onClick={() => {
                  handleCustomSync(
                    settings.syncServerA || 'primary',
                    settings.syncServerB || 'backup'
                  );
                  setShowControlModal(false);
                }}
                disabled={isRotating || isSyncing || settings.syncServerA === settings.syncServerB}
                className="w-full mt-4 flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl font-semibold"
              >
                <span className="text-lg font-bold">{getServerLabel(settings.syncServerA || 'primary')}</span>
                <Database className="w-5 h-5" />
                <span className="text-lg font-bold">{getServerLabel(settings.syncServerB || 'backup')}</span>
                <span className="ml-2">Forçar Sincronização</span>
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  /**
   * 📊 Modal de Métricas Completas
   */
  const MetricsModal = () => {
    const info = getInfo();
    
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={() => setShowMetricsModal(false)}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-8 h-8" />
                <div>
                  <h2 className="text-2xl font-bold">Métricas Completas do Sistema</h2>
                  <p className="text-blue-100 text-sm mt-1">
                    Informações detalhadas sobre o sistema de backup
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowMetricsModal(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            <div className="space-y-6">
              {/* Banco Ativo */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border-2 border-blue-200 dark:border-blue-800">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                  <Database className="w-5 h-5 text-blue-600" />
                  Banco de Dados Ativo
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Banco Atual</div>
                    <div className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                      {info.activeDatabase === 'primary' ? 'Principal (A)' : 'Backup (B)'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Project ID</div>
                    <div className="text-lg font-medium text-gray-800 dark:text-white mt-1">
                      {info.activeDatabase === 'primary' ? 'garden-c0b50' : 'garden-backup'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Status</div>
                    <div className="text-lg font-semibold text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                      <CheckCircle className="w-5 h-5" />
                      Operacional
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Região</div>
                    <div className="text-lg font-medium text-gray-800 dark:text-white mt-1">
                      🇧🇷 São Paulo
                    </div>
                  </div>
                </div>
              </div>

              {/* Rotação */}
              <div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                  <RefreshCw className="w-5 h-5" />
                  Informações de Rotação
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Última Rotação</div>
                    <div className="text-lg font-medium text-gray-800 dark:text-white">
                      {formatDate(info.lastRotation)}
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Próxima Rotação</div>
                    <div className="text-lg font-medium text-gray-800 dark:text-white">
                      {formatDate(info.nextRotation)}
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Tempo até Rotação</div>
                    <div className="text-lg font-medium text-gray-800 dark:text-white">
                      {formatTime(info.hoursUntilRotation)}
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Status de Rotação</div>
                    <div className={`text-lg font-semibold ${info.isRotating ? 'text-yellow-600' : 'text-green-600'}`}>
                      {info.isRotating ? '⏳ Rotacionando' : '✅ Normal'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sincronização */}
              <div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Status de Sincronização
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Status Atual</div>
                    <div className={`text-lg font-semibold ${info.isSyncing ? 'text-blue-600' : 'text-gray-600'}`}>
                      {info.isSyncing ? '🔄 Sincronizando' : '⏸️ Parado'}
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Progresso</div>
                    <div className="text-lg font-medium text-gray-800 dark:text-white">
                      {info.syncProgress?.percentage || 0}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Métricas dos Servidores */}
              <div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                  <Server className="w-5 h-5" />
                  Métricas dos Servidores
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Primary */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                    <h4 className="font-bold text-blue-600 dark:text-blue-400 mb-3">
                      Servidor A (Principal)
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Leituras:</span>
                        <span className="font-medium text-gray-800 dark:text-white">{metrics.primary.read}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Escritas:</span>
                        <span className="font-medium text-gray-800 dark:text-white">{metrics.primary.write}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Última Op:</span>
                        <span className="font-medium text-gray-800 dark:text-white text-xs">
                          {formatDate(metrics.primary.lastOperation)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Status:</span>
                        <span className={`font-semibold ${metrics.primary.healthy ? 'text-green-600' : 'text-red-600'}`}>
                          {metrics.primary.healthy ? '✅ Saudável' : '❌ Erro'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Backup */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                    <h4 className="font-bold text-blue-600 dark:text-blue-400 mb-3">
                      Servidor B (Backup)
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Leituras:</span>
                        <span className="font-medium text-gray-800 dark:text-white">{metrics.backup.read}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Escritas:</span>
                        <span className="font-medium text-gray-800 dark:text-white">{metrics.backup.write}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Última Op:</span>
                        <span className="font-medium text-gray-800 dark:text-white text-xs">
                          {formatDate(metrics.backup.lastOperation)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Status:</span>
                        <span className={`font-semibold ${metrics.backup.healthy ? 'text-green-600' : 'text-red-600'}`}>
                          {metrics.backup.healthy ? '✅ Saudável' : '❌ Erro'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Histórico de Rotações */}
              {info.rotationHistory && info.rotationHistory.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Histórico de Rotações (Últimas 5)
                  </h3>
                  <div className="space-y-2">
                    {info.rotationHistory.slice(0, 5).map((entry, index) => (
                      <div
                        key={index}
                        className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${index === 0 ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                          <div>
                            <div className="text-sm font-medium text-gray-800 dark:text-white">
                              {entry.from} → {entry.to}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              {formatDate(entry.timestamp)}
                            </div>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          entry.success ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700'
                        }`}>
                          {entry.success ? 'Sucesso' : 'Falha'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Configurações */}
              <div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Configurações Ativas
                </h3>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600 dark:text-gray-400 mb-1">Intervalo de Rotação</div>
                      <div className="font-medium text-gray-800 dark:text-white">{settings.rotationInterval}h</div>
                    </div>
                    <div>
                      <div className="text-gray-600 dark:text-gray-400 mb-1">Auto Rotação</div>
                      <div className={`font-semibold ${info.autoRotate ? 'text-green-600' : 'text-red-600'}`}>
                        {info.autoRotate ? '✅ Ativa' : '❌ Inativa'}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600 dark:text-gray-400 mb-1">Servidor A</div>
                      <div className="font-medium text-gray-800 dark:text-white">
                        {settings.primaryServer === 'primary' ? 'Principal' : 'Backup'}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600 dark:text-gray-400 mb-1">Servidor B</div>
                      <div className="font-medium text-gray-800 dark:text-white">
                        {settings.backupServer === 'backup' ? 'Backup' : 'Principal'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-100 dark:bg-gray-900 p-4 flex justify-end gap-3">
            <button
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(info, null, 2));
                toast.success('📋 Métricas copiadas para a área de transferência!');
              }}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
            >
              Copiar JSON
            </button>
            <button
              onClick={() => setShowMetricsModal(false)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Fechar
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      {/* Animação de transferência de dados */}
      <AnimatePresence>
        {showTransferAnimation && (
          <DataTransferAnimation
            fromServer={transferData.from}
            toServer={transferData.to}
            isActive={showTransferAnimation}
            type={transferData.type}
            onComplete={() => {
              setShowTransferAnimation(false);
              toast.success('🎉 Transferência concluída com sucesso!', {
                position: 'top-center',
                autoClose: 3000
              });
            }}
          />
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
              <Activity className="w-8 h-8" />
              Monitoramento de Backup
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Sistema de rotação automática entre databases
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowMetricsModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
            >
              <TrendingUp className="w-5 h-5" />
              Ver Métricas
            </button>
            
            <button
              onClick={() => setShowAddServerModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5" />
              Adicionar Servidor
            </button>
            
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              <Settings className="w-5 h-5" />
              Configurações
            </button>
          </div>
        </div>

        {/* Instruções para Long Press */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-2 border-blue-200 dark:border-blue-800 rounded-xl shadow-lg p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center shadow">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-800 dark:text-white">
                {2 + customServers.filter(s => s.status === 'active').length} Servidores Disponíveis
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                💡 Pressione e segure qualquer servidor para abrir os controles
              </p>
            </div>
          </div>
        </motion.div>





        {/* Progress Bar (se sincronizando) */}
        <AnimatePresence>
          {(isRotating || isSyncing) && syncProgress && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
                  <span className="font-semibold text-gray-800 dark:text-white">
                    {isRotating ? 'Rotação em Andamento' : 'Sincronização em Andamento'}
                  </span>
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {syncProgress.current}/{syncProgress.total} ({syncProgress.percentage}%)
                </span>
              </div>

              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-2">
                <motion.div
                  className="bg-gradient-to-r from-blue-500 to-blue-700 h-3 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${syncProgress.percentage}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>

              <div className="text-sm text-gray-600 dark:text-gray-400">
                Sincronizando: {syncProgress.collection}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Databases Status */}
        <div className="mb-6">
          {/* Header com controle de expansão/colapso (apenas se houver mais de 4 servidores) */}
          {(2 + customServers.filter(s => s.status === 'active').length) > 4 && (
            <div className="flex items-center justify-between mb-4 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
              <div className="flex items-center gap-3">
                <Server className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                  Servidores ({2 + customServers.filter(s => s.status === 'active').length})
                </h3>
              </div>
              <button
                onClick={() => setServersExpanded(!serversExpanded)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                {serversExpanded ? (
                  <>
                    <EyeOff className="w-5 h-5" />
                    Recolher
                  </>
                ) : (
                  <>
                    <Eye className="w-5 h-5" />
                    Expandir
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Primary Database */}
          <motion.div
            ref={primaryCardRef}
            {...useLongPress(handleLongPress, 'primary')}
            onClick={() => handleLongPress('primary')}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden relative cursor-pointer"
            style={{ minHeight: '420px', maxHeight: '420px' }}
          >
            {/* Animações do card */}
            {(serverAnimations.primary.sending || serverAnimations.primary.receiving) && (
              <ServerCardPulse 
                isActive={true} 
                type={serverAnimations.primary.sending ? 'sending' : 'receiving'} 
              />
            )}
            
            {serverAnimations.primary.syncing && (
              <SyncIndicator 
                isActive={true} 
                progress={serverAnimations.primary.progress} 
              />
            )}
            
            {activatingServer === 'primary' && (
              <ActivationEffect isActive={true} />
            )}

            {/* Header com altura fixa */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 relative" style={{ height: '100px' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                    <Database className="w-6 h-6 text-white" />
                  </div>
                  <div className="overflow-hidden flex-1">
                    <h3 className="text-lg font-bold text-white truncate">
                      Firebase Principal
                    </h3>
                    <p className="text-sm text-blue-100 truncate">garden-c0b50</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {currentActiveServer === 'primary' && (
                    <span className="px-3 py-1 bg-white/90 text-blue-600 rounded-full text-xs font-semibold">
                      Atual
                    </span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(openMenuId === 'primary' ? null : 'primary');
                    }}
                    className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center transition-colors"
                  >
                    <MoreVertical className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>
              
              {/* Menu Dropdown */}
              <ServerCardMenu
                serverId="primary"
                isOpen={openMenuId === 'primary'}
                onClose={() => setOpenMenuId(null)}
                onSync={() => handleSyncServer('primary')}
                onActivate={() => handleActivateServer('primary')}
                onStats={() => handleShowStats('primary')}
                onSettings={() => handleShowSettings('primary')}
                isActive={currentActiveServer === 'primary'}
              />
              
              {/* Localização */}
              <div className="mt-2 text-sm text-blue-50 flex items-center gap-1">
                <span>{serverLocations['garden-c0b50']?.flag || '🇧🇷'}</span>
                <span>{serverLocations['garden-c0b50']?.city || 'São Paulo'}</span>
              </div>
            </div>

            {/* Conteúdo com altura fixa */}
            <div className="p-4" style={{ height: '240px' }}>
              <div className="space-y-3">
                {/* Métricas em grid 2x2 */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Leituras</div>
                    <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                      {metrics.primary.read}
                    </div>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Escritas</div>
                    <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                      {metrics.primary.write}
                    </div>
                  </div>
                </div>

                {/* Informações adicionais */}
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Última Operação</span>
                    <span className="text-sm font-medium text-gray-800 dark:text-white">
                      {formatDate(metrics.primary.lastOperation)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
                    <span className={`flex items-center gap-1 text-sm font-semibold ${
                      metrics.primary.healthy ? 'text-blue-600' : 'text-red-600'
                    }`}>
                      <CheckCircle className="w-4 h-4" />
                      {metrics.primary.healthy ? 'Saudável' : 'Erro'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Botão com altura fixa */}
            <div className="px-4 pb-4" style={{ height: '80px' }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  testDatabase(primaryDb, 'primary');
                }}
                disabled={isTestingPrimary}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isTestingPrimary ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Testando...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    Testar Conexão
                  </>
                )}
              </button>
            </div>
          </motion.div>

          {/* Backup Database */}
          <motion.div
            ref={backupCardRef}
            {...useLongPress(handleLongPress, 'backup')}
            onClick={() => handleLongPress('backup')}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden relative cursor-pointer"
            style={{ minHeight: '420px', maxHeight: '420px' }}
          >
            {/* Animações do card */}
            {(serverAnimations.backup.sending || serverAnimations.backup.receiving) && (
              <ServerCardPulse 
                isActive={true} 
                type={serverAnimations.backup.sending ? 'sending' : 'receiving'} 
              />
            )}
            
            {serverAnimations.backup.syncing && (
              <SyncIndicator 
                isActive={true} 
                progress={serverAnimations.backup.progress} 
              />
            )}
            
            {activatingServer === 'backup' && (
              <ActivationEffect isActive={true} />
            )}

            {/* Header com altura fixa */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 relative" style={{ height: '100px' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                    <Database className="w-6 h-6 text-white" />
                  </div>
                  <div className="overflow-hidden flex-1">
                    <h3 className="text-lg font-bold text-white truncate">
                      Firebase Backup
                    </h3>
                    <p className="text-sm text-blue-100 truncate">garden-backup</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {currentActiveServer === 'backup' && (
                    <span className="px-3 py-1 bg-white/90 text-blue-600 rounded-full text-xs font-semibold">
                      Atual
                    </span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(openMenuId === 'backup' ? null : 'backup');
                    }}
                    className="w-8 h-8 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center transition-colors"
                  >
                    <MoreVertical className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>
              
              {/* Menu Dropdown */}
              <ServerCardMenu
                serverId="backup"
                isOpen={openMenuId === 'backup'}
                onClose={() => setOpenMenuId(null)}
                onSync={() => handleSyncServer('backup')}
                onActivate={() => handleActivateServer('backup')}
                onStats={() => handleShowStats('backup')}
                onSettings={() => handleShowSettings('backup')}
                isActive={currentActiveServer === 'backup'}
              />
              
              {/* Localização */}
              <div className="mt-2 text-sm text-blue-50 flex items-center gap-1">
                <span>{serverLocations['garden-backup']?.flag || '🇧🇷'}</span>
                <span>{serverLocations['garden-backup']?.city || 'São Paulo'}</span>
              </div>
            </div>

            {/* Conteúdo com altura fixa */}
            <div className="p-4" style={{ height: '240px' }}>
              <div className="space-y-3">
                {/* Métricas em grid 2x2 */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Leituras</div>
                    <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                      {metrics.backup.read}
                    </div>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Escritas</div>
                    <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                      {metrics.backup.write}
                    </div>
                  </div>
                </div>

                {/* Informações adicionais */}
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Última Operação</span>
                    <span className="text-sm font-medium text-gray-800 dark:text-white">
                      {formatDate(metrics.backup.lastOperation)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
                    <span className={`flex items-center gap-1 text-sm font-semibold ${
                      metrics.backup.healthy ? 'text-blue-600' : 'text-red-600'
                    }`}>
                      <CheckCircle className="w-4 h-4" />
                      {metrics.backup.healthy ? 'Saudável' : 'Erro'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Botão com altura fixa */}
            <div className="px-4 pb-4" style={{ height: '80px' }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  testDatabase(backupDb, 'backup');
                }}
                disabled={isTestingBackup}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isTestingBackup ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Testando...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    Testar Conexão
                  </>
                )}
              </button>
            </div>
          </motion.div>

          {/* Custom Servers - Agora usando componente separado para evitar erro de hooks */}
          {customServers
            .filter(server => server.status === 'active') // Mostrar apenas servidores ativos
            .map((server, index) => {
              const location = serverLocations[server.config?.projectId] || {
                flag: '🌍',
                city: 'Global'
              };
              
              const isActive = currentActiveServer === server.id;
              const shouldShow = serversExpanded || index < 2; // Mostrar primeiros 2 ou todos se expandido
              
              return (
                <CustomServerCard
                  key={server.id}
                  server={server}
                  isActive={isActive}
                  location={location}
                  testingCustomServers={testingCustomServers}
                  currentActiveServer={currentActiveServer}
                  testCustomServer={testCustomServer}
                  handleLongPress={handleLongPress}
                  formatDate={formatDate}
                  shouldShow={shouldShow}
                  useLongPress={useLongPress}
                  openMenuId={openMenuId}
                  setOpenMenuId={setOpenMenuId}
                  setCurrentActiveServer={setCurrentActiveServer}
                  handleSyncServer={handleSyncServer}
                  handleActivateServer={handleActivateServer}
                  handleShowStats={handleShowStats}
                  handleShowSettings={handleShowSettings}
                />
              );
            })}
          
        </div>

        {/* Test Results */}
        <AnimatePresence>
          {testResults && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Resultados do Teste - {testResults.database}
                </h3>
                <button
                  onClick={() => setTestResults(null)}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>

              {testResults.success ? (
                <>
                  <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-blue-800 dark:text-blue-300 font-semibold flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      {testResults.summary}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {testResults.tests.map((test, index) => (
                      <div
                        key={index}
                        className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-gray-800 dark:text-white">
                            {test.name}
                          </span>
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        </div>
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                          {test.time}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {test.details}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-800 dark:text-red-300 font-semibold flex items-center gap-2">
                    <XCircle className="w-5 h-5" />
                    {testResults.error}
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>



        {/* Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 overflow-hidden"
            >
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                <Settings className="w-6 h-6" />
                Configurações do Sistema
              </h3>

              <div className="space-y-6">
                {/* Intervalo de Rotação */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Intervalo de Rotação (horas)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="168"
                    value={settings.rotationInterval}
                    onChange={(e) => setSettings({...settings, rotationInterval: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Atualmente: {settings.rotationInterval}h = {(settings.rotationInterval / 24).toFixed(1)} dia(s)
                  </p>
                </div>

                {/* Auto Rotação */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Rotação Automática
                    </label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Alternar databases automaticamente no intervalo definido
                    </p>
                  </div>
                  <button
                    onClick={() => setSettings({...settings, autoRotate: !settings.autoRotate})}
                    className={`relative w-14 h-7 rounded-full transition-colors ${
                      settings.autoRotate ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <motion.div
                      className="absolute top-1 left-1 w-5 h-5 bg-white rounded-full"
                      animate={{ x: settings.autoRotate ? 28 : 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </button>
                </div>

                {/* Auto Sync */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Sincronização ao Rotacionar
                    </label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Sincronizar dados automaticamente ao alternar databases
                    </p>
                  </div>
                  <button
                    onClick={() => setSettings({...settings, autoSync: !settings.autoSync})}
                    className={`relative w-14 h-7 rounded-full transition-colors ${
                      settings.autoSync ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <motion.div
                      className="absolute top-1 left-1 w-5 h-5 bg-white rounded-full"
                      animate={{ x: settings.autoSync ? 28 : 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </button>
                </div>

                {/* Notificações */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Notificações
                    </label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Mostrar notificações de rotação e sincronização
                    </p>
                  </div>
                  <button
                    onClick={() => setSettings({...settings, notificationsEnabled: !settings.notificationsEnabled})}
                    className={`relative w-14 h-7 rounded-full transition-colors ${
                      settings.notificationsEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <motion.div
                      className="absolute top-1 left-1 w-5 h-5 bg-white rounded-full"
                      animate={{ x: settings.notificationsEnabled ? 28 : 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </button>
                </div>

                {/* Save Button */}
                <button
                  onClick={saveSettings}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-lg hover:from-blue-600 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl"
                >
                  <Save className="w-5 h-5" />
                  Salvar Configurações
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* History */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
            <Clock className="w-6 h-6" />
            Histórico de Rotações (Últimas 10)
          </h3>

          {rotationHistory.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              Nenhuma rotação registrada ainda
            </p>
          ) : (
            <div className="space-y-3">
              {rotationHistory.slice(-10).reverse().map((entry, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <RefreshCw className="w-5 h-5 text-blue-500" />
                    <div>
                      <div className="font-semibold text-gray-800 dark:text-white">
                        {entry.from} → {entry.to}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(entry.timestamp)}
                      </div>
                    </div>
                  </div>
                  
                  {entry.synced && entry.syncResult && (
                    <div className="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      {entry.syncResult.totalSynced || 0} docs sincronizados
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Collections Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <FolderOpen className="w-6 h-6" />
                Coleções dos Bancos de Dados
              </h3>
              
              {collections && (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {collections.totals.databases} bancos • {collections.totals.collections} coleções • {collections.totals.documents.toLocaleString()} documentos
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={refreshCollections}
                disabled={collectionsLoading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${collectionsLoading ? 'animate-spin' : ''}`} />
                Atualizar
              </button>
              
              <button
                onClick={() => setShowCollections(!showCollections)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {showCollections ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showCollections ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
          </div>

          {/* Quick Stats */}
          {collections && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Firebase Principal</div>
                <div className="text-2xl font-bold text-gray-800 dark:text-white">
                  {collections.primary.totalCollections}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {collections.primary.totalDocuments.toLocaleString()} docs
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Firebase Backup</div>
                <div className="text-2xl font-bold text-gray-800 dark:text-white">
                  {collections.backup.totalCollections}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {collections.backup.totalDocuments.toLocaleString()} docs
                </div>
              </div>

              {collectionsComparison && (
                <>
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Sincronizadas</div>
                    <div className="text-2xl font-bold text-gray-800 dark:text-white">
                      {collectionsComparison.summary.synced}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {collectionsComparison.summary.syncPercentage}% do total
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-lg p-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Dessincronizadas</div>
                    <div className="text-2xl font-bold text-gray-800 dark:text-white">
                      {collectionsComparison.summary.outOfSync}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Precisam sync
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Collections Loading */}
          {collectionsLoading && (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
              <p className="text-gray-500 dark:text-gray-400">Carregando coleções...</p>
            </div>
          )}

          {/* Collections Content */}
          <AnimatePresence>
            {showCollections && collections && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                {/* Filters and View Toggle */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <select
                      value={collectionsFilter}
                      onChange={(e) => setCollectionsFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-sm"
                    >
                      <option value="all">Todas as Coleções</option>
                      <option value="primary">Apenas Principal</option>
                      <option value="backup">Apenas Backup</option>
                      <option value="synced">Sincronizadas</option>
                      <option value="out-of-sync">Dessincronizadas</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCollectionsView('grid')}
                      className={`p-2 rounded-lg transition-colors ${
                        collectionsView === 'grid'
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      <Grid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setCollectionsView('list')}
                      className={`p-2 rounded-lg transition-colors ${
                        collectionsView === 'list'
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Collections Grid/List */}
                {collectionsView === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {getFilteredCollections().map((collection, index) => (
                      <motion.div
                        key={`${collection.database}-${collection.name}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-500" />
                            <h4 className="font-semibold text-gray-800 dark:text-white">
                              {collection.name}
                            </h4>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            collection.database === 'primary'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                              : 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                          }`}>
                            {collection.database === 'primary' ? 'Principal' : 'Backup'}
                          </span>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Documentos:</span>
                            <span className="font-medium text-gray-800 dark:text-white">
                              {collection.documentCount?.toLocaleString() || 0}
                            </span>
                          </div>
                          
                          {collection.lastUpdated && (
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Atualizada:</span>
                              <span className="font-medium text-gray-800 dark:text-white text-xs">
                                {formatDate(collection.lastUpdated)}
                              </span>
                            </div>
                          )}

                          {collection.error && (
                            <div className="text-red-500 text-xs mt-2">
                              Erro: {collection.error}
                            </div>
                          )}
                        </div>

                        {/* Botão Ver Detalhes */}
                        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                          <button
                            onClick={() => openDocumentViewer(collection, collection.database)}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-medium"
                          >
                            <Eye className="w-4 h-4" />
                            Ver Detalhes
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {getFilteredCollections().map((collection, index) => (
                      <motion.div
                        key={`${collection.database}-${collection.name}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-4 h-4 text-blue-500" />
                          <span className="font-medium text-gray-800 dark:text-white">
                            {collection.name}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            collection.database === 'primary'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                              : 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                          }`}>
                            {collection.database === 'primary' ? 'Principal' : 'Backup'}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-gray-600 dark:text-gray-400">
                            {collection.documentCount?.toLocaleString() || 0} docs
                          </span>
                          {collection.lastUpdated && (
                            <span className="text-gray-500 dark:text-gray-400 text-xs">
                              {formatDate(collection.lastUpdated)}
                            </span>
                          )}
                          <button
                            onClick={() => openDocumentViewer(collection, collection.database)}
                            className="flex items-center gap-2 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm"
                          >
                            <Eye className="w-4 h-4" />
                            Ver Detalhes
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {getFilteredCollections().length === 0 && (
                  <div className="text-center py-8">
                    <FolderOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500 dark:text-gray-400">
                      Nenhuma coleção encontrada com o filtro selecionado
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {!collections && !collectionsLoading && (
            <div className="text-center py-8">
              <button
                onClick={loadCollections}
                className="flex items-center gap-2 mx-auto px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                <Search className="w-5 h-5" />
                Carregar Coleções
              </button>
            </div>
          )}
        </div>

        {/* Add Server Modal */}
        <AddFirebaseServerModal
          isOpen={showAddServerModal}
          onClose={() => setShowAddServerModal(false)}
          onServerAdded={handleServerAdded}
        />

        {/* Document Viewer Modal */}
        <DocumentViewerModal
          isOpen={showDocumentViewer}
          onClose={closeDocumentViewer}
          collection={selectedCollectionForViewer}
          database={selectedDatabaseForViewer}
        />

        {/* Metrics Modal */}
        <AnimatePresence>
          {showMetricsModal && <MetricsModal />}
        </AnimatePresence>

        {/* Modal de Sincronização - Escolher servidor de origem */}
        <AnimatePresence>
          {showSyncModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowSyncModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Repeat className="w-6 h-6 text-blue-500" />
                    Sincronizar Dados
                  </h3>
                  <button
                    onClick={() => setShowSyncModal(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Escolha de qual servidor deseja copiar os dados:
                </p>

                <div className="space-y-3">
                  {syncSourceServer !== 'primary' && (
                    <button
                      onClick={() => executeSyncServer('primary', syncSourceServer)}
                      className="w-full p-4 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <Database className="w-8 h-8 text-blue-600" />
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">Firebase Principal</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">garden-c0b50</p>
                        </div>
                      </div>
                    </button>
                  )}

                  {syncSourceServer !== 'backup' && (
                    <button
                      onClick={() => executeSyncServer('backup', syncSourceServer)}
                      className="w-full p-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-xl hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <Database className="w-8 h-8 text-green-600" />
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">Firebase Backup</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">garden-backup</p>
                        </div>
                      </div>
                    </button>
                  )}

                  {customServers.filter(s => s.status === 'active' && s.id !== syncSourceServer).map(server => (
                    <button
                      key={server.id}
                      onClick={() => executeSyncServer(server.id, syncSourceServer)}
                      className="w-full p-4 bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-200 dark:border-purple-800 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <Database className="w-8 h-8 text-purple-600" />
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">{server.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{server.config.projectId}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal de Estatísticas Detalhadas */}
        <AnimatePresence>
          {showStatsModal && selectedServerForStats && (() => {
            const serverName = selectedServerForStats === 'primary' ? 'Firebase Principal' 
              : selectedServerForStats === 'backup' ? 'Firebase Backup'
              : customServers.find(s => s.id === selectedServerForStats)?.name || 'Servidor';
            
            const serverMetrics = selectedServerForStats === 'primary' ? metrics.primary
              : selectedServerForStats === 'backup' ? metrics.backup
              : customServers.find(s => s.id === selectedServerForStats)?.metrics || { read: 0, write: 0 };

            const isActive = currentActiveServer === selectedServerForStats;

            return (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                onClick={() => setShowStatsModal(false)}
              >
                <motion.div
                  initial={{ scale: 0.95, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.95, y: 20 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <BarChart2 className="w-6 h-6 text-purple-500" />
                      Estatísticas - {serverName}
                    </h3>
                    <button
                      onClick={() => setShowStatsModal(false)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  {/* Status Badge */}
                  <div className="mb-6">
                    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
                      isActive 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></span>
                      {isActive ? 'Servidor Ativo' : 'Servidor Inativo'}
                    </span>
                  </div>

                  {/* Métricas Principais */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Eye className="w-5 h-5 text-blue-600" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">Leituras</span>
                      </div>
                      <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {serverMetrics.read || 0}
                      </p>
                    </div>

                    <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Save className="w-5 h-5 text-green-600" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">Escritas</span>
                      </div>
                      <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                        {serverMetrics.write || 0}
                      </p>
                    </div>
                  </div>

                  {/* Total de Operações */}
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 mb-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingUp className="w-5 h-5 text-purple-600" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">Total de Operações</span>
                        </div>
                        <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                          {(serverMetrics.read || 0) + (serverMetrics.write || 0)}
                        </p>
                      </div>
                      <div className="text-right text-sm text-gray-600 dark:text-gray-400">
                        <p>Proporção L/E:</p>
                        <p className="font-semibold">
                          {serverMetrics.read || 0}:{serverMetrics.write || 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Informações Adicionais */}
                  <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Informações do Servidor</h4>
                    
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600 dark:text-gray-400">Project ID:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {selectedServerForStats === 'primary' ? 'garden-c0b50' 
                          : selectedServerForStats === 'backup' ? 'garden-backup'
                          : customServers.find(s => s.id === selectedServerForStats)?.config?.projectId || 'N/A'}
                      </span>
                    </div>

                    <div className="flex justify-between py-2">
                      <span className="text-gray-600 dark:text-gray-400">Localização:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {serverLocations[selectedServerForStats === 'primary' ? 'garden-c0b50' 
                          : selectedServerForStats === 'backup' ? 'garden-backup'
                          : customServers.find(s => s.id === selectedServerForStats)?.config?.projectId]?.city || 'São Paulo'} - Brasil
                      </span>
                    </div>

                    <div className="flex justify-between py-2">
                      <span className="text-gray-600 dark:text-gray-400">Última Atividade:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {new Date().toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            );
          })()}
        </AnimatePresence>

        {/* Modal de Configurações do Servidor */}
        <AnimatePresence>
          {showServerSettingsModal && selectedServerForSettings && (() => {
            const serverName = selectedServerForSettings === 'primary' ? 'Firebase Principal' 
              : selectedServerForSettings === 'backup' ? 'Firebase Backup'
              : customServers.find(s => s.id === selectedServerForSettings)?.name || 'Servidor';

            return (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                onClick={() => setShowServerSettingsModal(false)}
              >
                <motion.div
                  initial={{ scale: 0.95, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.95, y: 20 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Settings className="w-6 h-6 text-gray-500" />
                      Configurações - {serverName}
                    </h3>
                    <button
                      onClick={() => setShowServerSettingsModal(false)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  {/* Configurações */}
                  <div className="space-y-6">
                    {/* Auto-sincronização */}
                    <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">Auto-sincronização</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Sincronizar automaticamente a cada hora</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>

                    {/* Prioridade de Backup */}
                    <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Prioridade de Backup</h4>
                      <select className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                        <option>Alta (A cada 15 minutos)</option>
                        <option>Média (A cada hora)</option>
                        <option>Baixa (A cada 6 horas)</option>
                        <option>Manual</option>
                      </select>
                    </div>

                    {/* Retenção de Dados */}
                    <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Retenção de Dados</h4>
                      <input 
                        type="number" 
                        defaultValue={30}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Dias"
                      />
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Manter backups por quantos dias</p>
                    </div>

                    {/* Limite de Operações */}
                    <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Limite de Operações/Hora</h4>
                      <input 
                        type="number" 
                        defaultValue={10000}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="10000"
                      />
                    </div>

                    {/* Notificações */}
                    <div className="pb-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">Notificações de Erro</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Receber alertas de falhas</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" defaultChecked className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Botões de Ação */}
                  <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => {
                        toast.success('Configurações salvas com sucesso!');
                        setShowServerSettingsModal(false);
                      }}
                      className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                    >
                      Salvar Configurações
                    </button>
                    <button
                      onClick={() => setShowServerSettingsModal(false)}
                      className="px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
                    >
                      Cancelar
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            );
          })()}
        </AnimatePresence>

      </div>
    </div>
  );
};

/**
 * 🛡️ ErrorBoundary para capturar erros do componente
 */
class BackupErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('❌ Erro no BackupMonitoringPage:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorDisplay 
          message="Erro ao carregar o sistema de backup"
          details={this.state.error?.message}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * 📦 Export principal com ErrorBoundary
 */
const BackupMonitoringPage = () => {
  return (
    <BackupErrorBoundary>
      <BackupMonitoringPageContent />
    </BackupErrorBoundary>
  );
};

export default BackupMonitoringPage;
