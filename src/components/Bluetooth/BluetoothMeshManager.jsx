import React, { useState, useEffect } from 'react';
import { useBluetoothMesh } from '../../hooks/useBluetoothMesh';
import { useOffline } from '../../hooks/useOffline';
import { useDeveloperMode } from '../../contexts/DeveloperModeContext';

/**
 * Componente para gerenciar conexões Bluetooth Mesh
 * Funciona AUTOMATICAMENTE em background
 * Interface visível APENAS no modo desenvolvedor
 */
const BluetoothMeshManager = () => {
  const {
    isSupported,
    isConnected,
    connectedDevice,
    isScanning,
    isSyncing,
    lastSyncTime,
    syncStats,
    isAutoScanEnabled,
    lastScanTime,
    pendingDataNearby,
    connectToDevice,
    disconnect,
    syncNow,
    setAutoSync,
    startAutoScan,
    stopAutoScan,
    performQuickScan
  } = useBluetoothMesh();

  const { isOnline, pendingCount } = useOffline();
  const { isDeveloperMode } = useDeveloperMode();
  const [showPanel, setShowPanel] = useState(false);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const [error, setError] = useState(null);

  // Inicializar automaticamente quando o app carrega
  useEffect(() => {
    if (isSupported) {
      console.log('🔵 Bluetooth Mesh: Iniciando modo automático...');
      
      // Ativar auto-sync
      setAutoSync(true);
      
      // Iniciar auto-scan (se em mobile)
      if (isAutoScanEnabled === false) {
        startAutoScan();
      }
      
      console.log('✅ Bluetooth Mesh: Modo automático ativado');
    }
  }, [isSupported]);

  // Tentar auto-conectar quando detectar dados próximos
  useEffect(() => {
    if (pendingDataNearby && !isConnected && isSupported) {
      console.log('📱 Dados próximos detectados, tentando conexão automática...');
      // Auto-connect seria ideal, mas Web Bluetooth requer interação do usuário
      // Apenas logamos para o desenvolvedor ver
    }
  }, [pendingDataNearby, isConnected, isSupported]);

  // Conectar a dispositivo
  const handleConnect = async () => {
    setError(null);
    try {
      await connectToDevice();
    } catch (err) {
      if (err.name === 'NotFoundError') {
        setError('Nenhum dispositivo Workflow encontrado próximo');
      } else if (err.name === 'NotSupportedError') {
        setError('Bluetooth não é suportado neste navegador');
      } else {
        setError(err.message || 'Erro ao conectar');
      }
    }
  };

  // Sincronizar manualmente
  const handleSync = async () => {
    setError(null);
    try {
      await syncNow();
    } catch (err) {
      setError(err.message || 'Erro ao sincronizar');
    }
  };

  // Toggle auto-sync
  const handleToggleAutoSync = () => {
    const newValue = !autoSyncEnabled;
    setAutoSyncEnabled(newValue);
    setAutoSync(newValue);
  };

  // Formatar tempo desde última sincronização ou varredura
  const formatLastSync = (time = lastSyncTime) => {
    if (!time) return 'Nunca';
    
    const now = new Date();
    const diff = now - time;
    
    if (diff < 60000) return 'Agora mesmo';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min atrás`;
    return time.toLocaleTimeString();
  };

  // Debug: sempre logar o estado de suporte
  console.log('BluetoothMeshManager - isSupported:', isSupported);

  // Não mostrar interface se:
  // 1. Bluetooth não for suportado
  // 2. Não estiver em modo desenvolvedor
  if (!isSupported || !isDeveloperMode) {
    return null;
  }

  return (
    <div className="fixed bottom-20 right-4 z-40">
      {/* Botão flutuante - APENAS MODO DEV */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        className={`
          w-14 h-14 rounded-full shadow-lg flex items-center justify-center
          transition-all duration-300 hover:scale-110
          ${isConnected 
            ? 'bg-blue-500 hover:bg-blue-600' 
            : 'bg-gray-500 hover:bg-gray-600'
          }
          text-white
        `}
        title={isConnected ? 'Bluetooth conectado' : 'Bluetooth desconectado'}
      >
        <svg 
          className={`w-6 h-6 ${isConnected ? 'animate-pulse' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" 
          />
        </svg>
      </button>

      {/* Painel de controle */}
      {showPanel && (
        <div className="absolute bottom-16 right-0 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-2xl animate-slide-up">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                </svg>
                <h3 className="font-bold text-lg dark:text-white">Bluetooth Mesh</h3>
              </div>
              <button
                onClick={() => setShowPanel(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Sincronize dados com dispositivos próximos
            </p>
          </div>

          {/* Conteúdo */}
          <div className="p-4 space-y-4">
            {/* Aviso se Bluetooth não suportado */}
            {!isSupported && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div className="flex-1">
                    <h4 className="font-bold text-yellow-900 dark:text-yellow-100 mb-2">
                      Bluetooth não disponível
                    </h4>
                    <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-3">
                      O Web Bluetooth não está disponível neste navegador/dispositivo.
                    </p>
                    <div className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1">
                      <p><strong>Android:</strong> Use Chrome ou Edge</p>
                      <p><strong>iOS:</strong> Use Safari ou Chrome (iOS 16+)</p>
                      <p><strong>Desktop:</strong> Bluetooth disponível no Chrome, Edge e Opera</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Status da conexão */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Status:</span>
                <span className={`text-sm font-bold ${isConnected ? 'text-blue-600' : 'text-gray-600'}`}>
                  {isConnected ? '🔗 Conectado' : '⚪ Desconectado'}
                </span>
              </div>
              
              {isConnected && connectedDevice && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Dispositivo:</span> {connectedDevice}
                </div>
              )}
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                <div className="text-xs text-gray-600 dark:text-gray-400">Enviados</div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {syncStats.sent}
                </div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                <div className="text-xs text-gray-600 dark:text-gray-400">Recebidos</div>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {syncStats.received}
                </div>
              </div>
            </div>

            {/* Informações adicionais */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Operações pendentes:</span>
                <span className="font-medium dark:text-white">{pendingCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Última sincronização:</span>
                <span className="font-medium dark:text-white">{formatLastSync()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Última varredura:</span>
                <span className="font-medium dark:text-white">
                  {lastScanTime ? formatLastSync(lastScanTime) : 'Nunca'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Status da internet:</span>
                <span className={`font-medium ${isOnline ? 'text-green-600' : 'text-orange-600'}`}>
                  {isOnline ? '🌐 Online' : '📴 Offline'}
                </span>
              </div>
            </div>

            {/* Alerta de dados próximos */}
            {pendingDataNearby && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <span className="text-xl">📱</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Dados disponíveis para sincronizar
                    </div>
                    <div className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                      {pendingDataNearby.pendingCount} operações pendentes detectadas
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Auto-sync toggle */}
            <div className={`flex items-center justify-between bg-gray-50 dark:bg-gray-900 rounded-lg p-3 ${!isSupported ? 'opacity-50' : ''}`}>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Sincronização automática
              </span>
              <button
                onClick={handleToggleAutoSync}
                disabled={!isSupported}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${!isSupported ? 'cursor-not-allowed' : ''}
                  ${autoSyncEnabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}
                `}
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${autoSyncEnabled ? 'translate-x-6' : 'translate-x-1'}
                  `}
                />
              </button>
            </div>

            {/* Auto-scan toggle */}
            <div className={`flex items-center justify-between bg-gray-50 dark:bg-gray-900 rounded-lg p-3 ${!isSupported ? 'opacity-50' : ''}`}>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Varredura automática
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Busca dispositivos a cada 5 minutos
                </div>
              </div>
              <button
                onClick={isAutoScanEnabled ? stopAutoScan : startAutoScan}
                disabled={!isSupported}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${!isSupported ? 'cursor-not-allowed' : ''}
                  ${isAutoScanEnabled ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'}
                `}
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${isAutoScanEnabled ? 'translate-x-6' : 'translate-x-1'}
                  `}
                />
              </button>
            </div>

            {/* Erro */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-sm text-red-800 dark:text-red-200">
                  ⚠️ {error}
                </p>
              </div>
            )}

            {/* Botões de ação */}
            <div className="space-y-2">
              {/* Botão de varredura rápida */}
              <button
                onClick={async () => {
                  setError(null);
                  try {
                    await performQuickScan();
                  } catch (err) {
                    setError(err.message || 'Erro ao fazer varredura');
                  }
                }}
                disabled={!isSupported || isScanning}
                className={`
                  w-full py-2.5 rounded-lg font-medium transition-all text-sm
                  ${(!isSupported || isScanning)
                    ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed text-gray-500'
                    : 'bg-purple-500 hover:bg-purple-600 text-white'
                  }
                `}
              >
                {isScanning ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">🔍</span>
                    Varrendo...
                  </span>
                ) : (
                  '🔍 Fazer Varredura Rápida'
                )}
              </button>

              {!isConnected ? (
                <button
                  onClick={handleConnect}
                  disabled={!isSupported || isScanning}
                  className={`
                    w-full py-3 rounded-lg font-medium transition-all
                    ${(!isSupported || isScanning)
                      ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed text-gray-500'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }
                  `}
                >
                  {isScanning ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin">🔍</span>
                      Procurando dispositivos...
                    </span>
                  ) : (
                    '🔗 Conectar a Dispositivo'
                  )}
                </button>
              ) : (
                <>
                  <button
                    onClick={handleSync}
                    disabled={isSyncing}
                    className={`
                      w-full py-3 rounded-lg font-medium transition-all
                      ${isSyncing
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-green-500 hover:bg-green-600 text-white'
                      }
                    `}
                  >
                    {isSyncing ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="animate-spin">🔄</span>
                        Sincronizando...
                      </span>
                    ) : (
                      '🔄 Sincronizar Agora'
                    )}
                  </button>

                  <button
                    onClick={disconnect}
                    className="w-full py-3 rounded-lg font-medium bg-red-500 hover:bg-red-600 text-white transition-all"
                  >
                    🔌 Desconectar
                  </button>
                </>
              )}
            </div>

            {/* Informação sobre Bluetooth */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
              <p className="text-xs text-blue-800 dark:text-blue-200">
                💡 <strong>Dica:</strong> Mantenha o Bluetooth ativado e os dispositivos próximos 
                (até 10 metros) para sincronização automática de dados offline.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* CSS para animações */}
      <style jsx>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default BluetoothMeshManager;
