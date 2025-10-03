import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useDeveloperMode } from '../../contexts/DeveloperModeContext';
import { 
  Database, 
  Activity, 
  HardDrive, 
  Wifi,
  Users,
  Package,
  FileText,
  Clock,
  TrendingUp,
  Server,
  Cpu,
  MemoryStick,
  Globe,
  Smartphone,
  Code,
  Terminal,
  GitBranch,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Download,
  RefreshCw,
  Eye,
  Trash2,
  Settings
} from 'lucide-react';
import { db } from '../../firebaseConfig';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';

/**
 * Painel de Desenvolvedor Completo
 * Análise profunda de todos os dados do sistema
 */
const DeveloperPanel = () => {
  const { usuario } = useAuth();
  const { isDeveloperMode, devStats, disableDeveloperMode, incrementAction } = useDeveloperMode();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [systemData, setSystemData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Coletar dados do sistema
  const collectSystemData = async () => {
    setLoading(true);
    incrementAction();
    
    try {
      const data = {
        timestamp: new Date().toISOString(),
        
        // Dados do Navegador
        browser: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language,
          languages: navigator.languages,
          cookieEnabled: navigator.cookieEnabled,
          onLine: navigator.onLine,
          deviceMemory: navigator.deviceMemory || 'N/A',
          hardwareConcurrency: navigator.hardwareConcurrency || 'N/A',
          maxTouchPoints: navigator.maxTouchPoints || 0,
          vendor: navigator.vendor,
          doNotTrack: navigator.doNotTrack
        },

        // Dados da Tela
        screen: {
          width: window.screen.width,
          height: window.screen.height,
          availWidth: window.screen.availWidth,
          availHeight: window.screen.availHeight,
          colorDepth: window.screen.colorDepth,
          pixelDepth: window.screen.pixelDepth,
          orientation: window.screen.orientation?.type || 'N/A',
          devicePixelRatio: window.devicePixelRatio
        },

        // Dados da Janela
        window: {
          innerWidth: window.innerWidth,
          innerHeight: window.innerHeight,
          outerWidth: window.outerWidth,
          outerHeight: window.outerHeight,
          scrollX: window.scrollX,
          scrollY: window.scrollY
        },

        // Performance
        performance: {
          memory: performance.memory ? {
            usedJSHeapSize: (performance.memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
            totalJSHeapSize: (performance.memory.totalJSHeapSize / 1048576).toFixed(2) + ' MB',
            jsHeapSizeLimit: (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB'
          } : 'N/A',
          timing: performance.timing ? {
            loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
            domReadyTime: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
            connectTime: performance.timing.connectEnd - performance.timing.connectStart
          } : 'N/A'
        },

        // LocalStorage
        localStorage: {
          items: Object.keys(localStorage).length,
          keys: Object.keys(localStorage),
          data: Object.fromEntries(
            Object.keys(localStorage).map(key => [
              key,
              {
                value: localStorage.getItem(key),
                size: new Blob([localStorage.getItem(key)]).size
              }
            ])
          ),
          totalSize: Object.keys(localStorage).reduce((total, key) => {
            return total + new Blob([localStorage.getItem(key)]).size;
          }, 0)
        },

        // SessionStorage
        sessionStorage: {
          items: Object.keys(sessionStorage).length,
          keys: Object.keys(sessionStorage),
          totalSize: Object.keys(sessionStorage).reduce((total, key) => {
            return total + new Blob([sessionStorage.getItem(key)]).size;
          }, 0)
        },

        // Cookies
        cookies: {
          count: document.cookie.split(';').filter(c => c.trim()).length,
          list: document.cookie.split(';').map(c => c.trim().split('=')[0])
        },

        // IndexedDB
        indexedDB: await getIndexedDBInfo(),

        // Firebase Collections
        firebase: await getFirebaseInfo(),

        // Service Worker
        serviceWorker: {
          supported: 'serviceWorker' in navigator,
          controller: navigator.serviceWorker?.controller ? 'Ativo' : 'Inativo',
          ready: await navigator.serviceWorker?.ready ? 'Pronto' : 'Não pronto'
        },

        // Web Bluetooth
        bluetooth: {
          supported: 'bluetooth' in navigator,
          available: await navigator.bluetooth?.getAvailability() || false
        },

        // Geolocalização
        geolocation: {
          supported: 'geolocation' in navigator
        },

        // Notificações
        notifications: {
          supported: 'Notification' in window,
          permission: typeof Notification !== 'undefined' ? Notification.permission : 'N/A'
        },

        // Rede
        network: {
          type: navigator.connection?.effectiveType || 'N/A',
          downlink: navigator.connection?.downlink || 'N/A',
          rtt: navigator.connection?.rtt || 'N/A',
          saveData: navigator.connection?.saveData || false
        },

        // Usuário logado
        user: {
          id: usuario?.id || 'N/A',
          nome: usuario?.nome || 'N/A',
          email: usuario?.email || 'N/A',
          nivel: usuario?.nivel || 'N/A',
          empresa: usuario?.empresa || 'N/A',
          setor: usuario?.setor || 'N/A'
        },

        // Tema
        theme: {
          current: localStorage.getItem('workflow-theme') || 'system',
          prefersDark: window.matchMedia('(prefers-color-scheme: dark)').matches
        }
      };

      setSystemData(data);
    } catch (error) {
      console.error('Erro ao coletar dados do sistema:', error);
    } finally {
      setLoading(false);
    }
  };

  // Obter informações do IndexedDB
  const getIndexedDBInfo = async () => {
    try {
      const dbs = await indexedDB.databases();
      return {
        supported: true,
        databases: dbs.length,
        list: dbs.map(db => ({
          name: db.name,
          version: db.version
        }))
      };
    } catch (error) {
      return { supported: false, error: error.message };
    }
  };

  // Obter informações do Firebase
  const getFirebaseInfo = async () => {
    try {
      const collections = [
        'usuarios',
        'empresas',
        'setores',
        'funcionarios',
        'inventario',
        'emprestimos',
        'transferencias',
        'tarefas',
        'conversas',
        'mensagens',
        'notificacoes'
      ];

      const counts = {};
      for (const collectionName of collections) {
        try {
          const snapshot = await getDocs(collection(db, collectionName));
          counts[collectionName] = snapshot.size;
        } catch (error) {
          counts[collectionName] = 'Erro: ' + error.message;
        }
      }

      return {
        connected: true,
        collections: counts,
        total: Object.values(counts).reduce((sum, count) => 
          typeof count === 'number' ? sum + count : sum, 0
        )
      };
    } catch (error) {
      return { connected: false, error: error.message };
    }
  };

  // Coletar dados ao montar
  useEffect(() => {
    collectSystemData();
  }, []);

  // Auto-refresh a cada 10 segundos
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        collectSystemData();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // Exportar dados
  const exportData = () => {
    const dataStr = JSON.stringify(systemData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `workflow-dev-data-${Date.now()}.json`;
    link.click();
    incrementAction();
  };

  // Limpar dados
  const clearAllData = () => {
    if (window.confirm('⚠️ ATENÇÃO: Isso vai limpar TODOS os dados locais (localStorage, sessionStorage, cookies). Continuar?')) {
      localStorage.clear();
      sessionStorage.clear();
      document.cookie.split(";").forEach(c => {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      alert('✅ Dados locais limpos!');
      window.location.reload();
    }
  };

  // Formatar bytes
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Formatar duração
  const formatDuration = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  if (!isDeveloperMode) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-sm overflow-hidden">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900 to-indigo-900 p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-lg">
                <Terminal className="w-6 h-6 text-purple-300" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <Code className="w-5 h-5" />
                  Painel de Desenvolvedor
                </h1>
                <p className="text-sm text-purple-200">
                  Sessão: {formatDuration(devStats.sessionDuration)} | Ações: {devStats.actionsPerformed}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`p-2 rounded-lg transition-all ${
                  autoRefresh 
                    ? 'bg-green-500/20 text-green-300' 
                    : 'bg-gray-700 text-gray-400'
                }`}
                title={autoRefresh ? 'Auto-refresh ativo' : 'Auto-refresh desativado'}
              >
                <RefreshCw className={`w-5 h-5 ${autoRefresh ? 'animate-spin' : ''}`} />
              </button>
              
              <button
                onClick={collectSystemData}
                className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-all"
                title="Atualizar dados"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              
              <button
                onClick={exportData}
                className="p-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg transition-all"
                title="Exportar dados"
              >
                <Download className="w-5 h-5" />
              </button>
              
              <button
                onClick={clearAllData}
                className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-all"
                title="Limpar todos os dados"
              >
                <Trash2 className="w-5 h-5" />
              </button>
              
              <button
                onClick={disableDeveloperMode}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all font-medium"
              >
                Sair
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-4 overflow-x-auto">
            {[
              { id: 'overview', label: 'Visão Geral', icon: Activity },
              { id: 'browser', label: 'Navegador', icon: Globe },
              { id: 'storage', label: 'Armazenamento', icon: HardDrive },
              { id: 'firebase', label: 'Firebase', icon: Database },
              { id: 'performance', label: 'Performance', icon: TrendingUp },
              { id: 'network', label: 'Rede', icon: Wifi },
              { id: 'apis', label: 'APIs', icon: Server },
              { id: 'user', label: 'Usuário', icon: Users }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-white text-purple-900'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <RefreshCw className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
                <p className="text-white text-lg">Coletando dados do sistema...</p>
              </div>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto">
              {/* TAB: Visão Geral */}
              {activeTab === 'overview' && systemData && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard
                    icon={<Database className="w-6 h-6" />}
                    title="Firebase"
                    value={systemData.firebase.total}
                    subtitle="documentos totais"
                    color="blue"
                  />
                  <StatCard
                    icon={<HardDrive className="w-6 h-6" />}
                    title="LocalStorage"
                    value={systemData.localStorage.items}
                    subtitle={formatBytes(systemData.localStorage.totalSize)}
                    color="green"
                  />
                  <StatCard
                    icon={<Cpu className="w-6 h-6" />}
                    title="Memória JS"
                    value={systemData.performance.memory !== 'N/A' ? systemData.performance.memory.usedJSHeapSize : 'N/A'}
                    subtitle="em uso"
                    color="purple"
                  />
                  <StatCard
                    icon={<Wifi className="w-6 h-6" />}
                    title="Conexão"
                    value={systemData.network.type}
                    subtitle={systemData.browser.onLine ? 'Online' : 'Offline'}
                    color="orange"
                  />
                </div>
              )}

              {/* TAB: Navegador */}
              {activeTab === 'browser' && systemData && (
                <DataTable
                  title="Informações do Navegador"
                  data={systemData.browser}
                />
              )}

              {/* TAB: Armazenamento */}
              {activeTab === 'storage' && systemData && (
                <div className="space-y-4">
                  <DataTable
                    title="LocalStorage"
                    data={systemData.localStorage}
                  />
                  <DataTable
                    title="SessionStorage"
                    data={systemData.sessionStorage}
                  />
                  <DataTable
                    title="Cookies"
                    data={systemData.cookies}
                  />
                  <DataTable
                    title="IndexedDB"
                    data={systemData.indexedDB}
                  />
                </div>
              )}

              {/* TAB: Firebase */}
              {activeTab === 'firebase' && systemData && (
                <DataTable
                  title="Coleções Firebase"
                  data={systemData.firebase}
                />
              )}

              {/* TAB: Performance */}
              {activeTab === 'performance' && systemData && (
                <div className="space-y-4">
                  <DataTable
                    title="Memória"
                    data={systemData.performance.memory}
                  />
                  <DataTable
                    title="Timing"
                    data={systemData.performance.timing}
                  />
                  <DataTable
                    title="Tela"
                    data={systemData.screen}
                  />
                  <DataTable
                    title="Janela"
                    data={systemData.window}
                  />
                </div>
              )}

              {/* TAB: Rede */}
              {activeTab === 'network' && systemData && (
                <DataTable
                  title="Informações de Rede"
                  data={systemData.network}
                />
              )}

              {/* TAB: APIs */}
              {activeTab === 'apis' && systemData && (
                <div className="space-y-4">
                  <DataTable
                    title="Service Worker"
                    data={systemData.serviceWorker}
                  />
                  <DataTable
                    title="Bluetooth"
                    data={systemData.bluetooth}
                  />
                  <DataTable
                    title="Geolocalização"
                    data={systemData.geolocation}
                  />
                  <DataTable
                    title="Notificações"
                    data={systemData.notifications}
                  />
                </div>
              )}

              {/* TAB: Usuário */}
              {activeTab === 'user' && systemData && (
                <div className="space-y-4">
                  <DataTable
                    title="Dados do Usuário"
                    data={systemData.user}
                  />
                  <DataTable
                    title="Tema"
                    data={systemData.theme}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Componente de Card de Estatística
const StatCard = ({ icon, title, value, subtitle, color }) => {
  const colors = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600'
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-lg p-4 text-white shadow-lg`}>
      <div className="flex items-center justify-between mb-2">
        <div className="p-2 bg-white/20 rounded-lg">
          {icon}
        </div>
      </div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-sm opacity-90">{title}</div>
      <div className="text-xs opacity-75 mt-1">{subtitle}</div>
    </div>
  );
};

// Componente de Tabela de Dados
const DataTable = ({ title, data }) => {
  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg">
      <div className="bg-gray-900 px-4 py-3 border-b border-gray-700">
        <h3 className="text-lg font-bold text-white">{title}</h3>
      </div>
      <div className="p-4">
        <div className="overflow-x-auto">
          <table className="w-full">
            <tbody>
              {Object.entries(data).map(([key, value]) => (
                <tr key={key} className="border-b border-gray-700 hover:bg-gray-750">
                  <td className="py-3 px-4 text-gray-400 font-mono text-sm">{key}</td>
                  <td className="py-3 px-4 text-white font-mono text-sm">
                    {typeof value === 'object' ? (
                      <pre className="text-xs overflow-x-auto">
                        {JSON.stringify(value, null, 2)}
                      </pre>
                    ) : (
                      String(value)
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DeveloperPanel;
