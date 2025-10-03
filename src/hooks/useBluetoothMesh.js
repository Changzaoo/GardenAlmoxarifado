import { useState, useEffect, useCallback } from 'react';
import bluetoothMeshService from '../services/bluetoothMeshService';

/**
 * Hook para gerenciar conexões Bluetooth Mesh e sincronização P2P
 */
export const useBluetoothMesh = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [syncStats, setSyncStats] = useState({ sent: 0, received: 0 });
  
  // Estados para varredura automática
  const [isAutoScanEnabled, setIsAutoScanEnabled] = useState(false);
  const [lastScanTime, setLastScanTime] = useState(null);
  const [pendingDataNearby, setPendingDataNearby] = useState(null);

  // Verificar suporte ao carregar
  useEffect(() => {
    const checkSupport = async () => {
      console.log('🔍 Verificando suporte Bluetooth...');
      console.log('- navigator.bluetooth:', 'bluetooth' in navigator);
      console.log('- User Agent:', navigator.userAgent);
      console.log('- É mobile:', bluetoothMeshService.isMobile);
      
      const available = await bluetoothMeshService.isBluetoothAvailable();
      console.log('- Bluetooth disponível:', available);
      
      setIsSupported(available);
    };
    checkSupport();
  }, []);

  // Listener para eventos do Bluetooth
  useEffect(() => {
    const unsubscribe = bluetoothMeshService.addListener((event, data) => {
      console.log('🔔 Evento Bluetooth:', event, data);

      switch (event) {
        case 'connected':
          setIsConnected(true);
          setConnectedDevice(data.device);
          break;

        case 'disconnected':
          setIsConnected(false);
          setConnectedDevice(null);
          break;

        case 'syncSent':
          setSyncStats(prev => ({ ...prev, sent: data.sentCount }));
          setLastSyncTime(new Date());
          break;

        case 'syncCompleted':
          setSyncStats(prev => ({ ...prev, received: data.receivedCount }));
          setLastSyncTime(new Date());
          break;

        case 'dataReceived':
          console.log('📥 Dados recebidos:', data);
          break;

        case 'autoScanStarted':
          setIsAutoScanEnabled(true);
          console.log('✅ Varredura automática iniciada');
          break;

        case 'autoScanStopped':
          setIsAutoScanEnabled(false);
          console.log('⏹️ Varredura automática parada');
          break;

        case 'scanStarted':
          setIsScanning(true);
          break;

        case 'scanCompleted':
          setIsScanning(false);
          setLastScanTime(new Date());
          console.log('✅ Varredura concluída');
          break;

        case 'deviceNearbyWithData':
          setPendingDataNearby(data);
          console.log('📱 Dispositivos próximos com dados:', data);
          break;

        case 'scanError':
          setIsScanning(false);
          console.error('❌ Erro na varredura:', data.error);
          break;

        default:
          break;
      }
    });

    return unsubscribe;
  }, []);

  // Solicitar e conectar a dispositivo
  const connectToDevice = useCallback(async () => {
    if (!isSupported) {
      throw new Error('Bluetooth não é suportado neste dispositivo/navegador');
    }

    setIsScanning(true);
    try {
      await bluetoothMeshService.requestDevice();
      await bluetoothMeshService.connect();
      console.log('✅ Conectado com sucesso');
      return true;
    } catch (error) {
      console.error('❌ Erro ao conectar:', error);
      throw error;
    } finally {
      setIsScanning(false);
    }
  }, [isSupported]);

  // Desconectar do dispositivo atual
  const disconnect = useCallback(() => {
    bluetoothMeshService.disconnect();
  }, []);

  // Sincronizar manualmente
  const syncNow = useCallback(async () => {
    if (!isConnected) {
      throw new Error('Não está conectado a nenhum dispositivo');
    }

    setIsSyncing(true);
    try {
      await bluetoothMeshService.syncWithPeer();
      console.log('✅ Sincronização concluída');
      return true;
    } catch (error) {
      console.error('❌ Erro ao sincronizar:', error);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  }, [isConnected]);

  // Ativar/desativar auto-sync
  const setAutoSync = useCallback((enabled) => {
    bluetoothMeshService.setAutoSync(enabled);
  }, []);

  // Obter status completo
  const getStatus = useCallback(() => {
    return bluetoothMeshService.getStatus();
  }, []);

  // Iniciar varredura automática
  const startAutoScan = useCallback(() => {
    bluetoothMeshService.startAutoScan();
  }, []);

  // Parar varredura automática
  const stopAutoScan = useCallback(() => {
    bluetoothMeshService.stopAutoScan();
  }, []);

  // Executar varredura única manualmente
  const performQuickScan = useCallback(async () => {
    if (!isSupported) {
      throw new Error('Bluetooth não é suportado neste dispositivo/navegador');
    }
    await bluetoothMeshService.performQuickScan();
  }, [isSupported]);

  return {
    // Estado
    isSupported,
    isConnected,
    connectedDevice,
    isScanning,
    isSyncing,
    lastSyncTime,
    syncStats,
    
    // Estados de varredura automática
    isAutoScanEnabled,
    lastScanTime,
    pendingDataNearby,

    // Ações
    connectToDevice,
    disconnect,
    syncNow,
    setAutoSync,
    getStatus,
    
    // Ações de varredura
    startAutoScan,
    stopAutoScan,
    performQuickScan
  };
};

export default useBluetoothMesh;
