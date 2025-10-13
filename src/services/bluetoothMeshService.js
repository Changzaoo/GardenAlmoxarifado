/**
 * Serviço de Bluetooth Mesh para sincronização P2P entre dispositivos
 * Permite compartilhar dados offline via Bluetooth quando não há internet
 */

class BluetoothMeshService {
  constructor() {
    // UUIDs personalizados para o serviço Workflow
    this.SERVICE_UUID = '12345678-1234-5678-1234-56789abcdef0';
    this.CHARACTERISTIC_UUID = '12345678-1234-5678-1234-56789abcdef1';
    
    this.device = null;
    this.server = null;
    this.service = null;
    this.characteristic = null;
    this.isConnected = false;
    this.discoveredDevices = new Set();
    this.listeners = new Set();
    this.autoSync = true;
    
    // Fila de operações para sincronizar
    this.syncQueue = [];
    
    // Verificar suporte
    this.isSupported = 'bluetooth' in navigator;
    
    // Varredura automática
    this.autoScanEnabled = false;
    this.scanInterval = null;
    this.SCAN_INTERVAL_MS = 5 * 60 * 1000; // 5 minutos
    this.isMobile = this.detectMobile();
    this.permissionGranted = false;
    
    if (!this.isSupported) {

    }
  }

  /**
   * Detectar se é dispositivo móvel
   */
  detectMobile() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
  }

  /**
   * Verificar se Bluetooth está disponível
   */
  async isBluetoothAvailable() {

    if (!this.isSupported) {

      return false;
    }
    
    try {
      // Verificar se getAvailability existe
      if (!navigator.bluetooth.getAvailability) {

        // Em alguns navegadores/dispositivos, getAvailability não existe
        // mas o Bluetooth funciona. Então retornamos true.
        return true;
      }
      
      const availability = await navigator.bluetooth.getAvailability();

      return availability;
    } catch (error) {
      console.error('❌ Erro ao verificar disponibilidade do Bluetooth:', error);
      // Se houver erro mas Bluetooth existe, assumir que está disponível
      return true;
    }
  }

  /**
   * Solicitar permissão de Bluetooth (especialmente para mobile)
   */
  async requestPermission() {
    if (!this.isSupported) {
      throw new Error('Bluetooth não é suportado neste dispositivo');
    }

    try {
      // Verificar se já tem permissão
      if (this.permissionGranted) {

        return true;
      }

      // No Web Bluetooth, a permissão é solicitada durante requestDevice
      // Mas podemos verificar disponibilidade primeiro
      const available = await this.isBluetoothAvailable();
      
      if (!available) {
        throw new Error('Bluetooth não está disponível. Por favor, ative o Bluetooth nas configurações do dispositivo.');
      }

      // Mostrar dialog de solicitação de permissão
      this.notifyListeners('permissionRequested');
      
      return true;
    } catch (error) {
      console.error('❌ Erro ao solicitar permissão:', error);
      throw error;
    }
  }

  /**
   * Iniciar varredura automática periódica (a cada 5 minutos)
   */
  startAutoScan() {
    if (!this.isSupported) {

      return;
    }

    if (this.autoScanEnabled) {

      return;
    }

    this.autoScanEnabled = true;

    // Executar primeira varredura imediatamente
    this.performQuickScan();

    // Configurar varreduras periódicas
    this.scanInterval = setInterval(() => {
      if (this.autoScanEnabled && !this.isConnected) {

        this.performQuickScan();
      }
    }, this.SCAN_INTERVAL_MS);

    this.notifyListeners('autoScanStarted');
  }

  /**
   * Parar varredura automática
   */
  stopAutoScan() {
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }

    this.autoScanEnabled = false;

    this.notifyListeners('autoScanStopped');
  }

  /**
   * Realizar varredura rápida de dispositivos próximos
   */
  async performQuickScan() {
    if (!this.isSupported || this.isConnected) {
      return;
    }

    try {

      this.notifyListeners('scanStarted');

      // Web Bluetooth não permite scan passivo em background
      // Solução: Verificar se há operações pendentes e notificar usuário
      const { default: offlineService } = await import('./offlineService');
      const pendingCount = await offlineService.getPendingCount();

      if (pendingCount > 0) {

        this.notifyListeners('deviceNearbyWithData', { 
          pendingCount,
          message: 'Dispositivos próximos podem ter dados para sincronizar'
        });
      }

      this.notifyListeners('scanCompleted');
    } catch (error) {
      console.error('❌ Erro na varredura:', error);
      this.notifyListeners('scanError', { error: error.message });
    }
  }

  /**
   * Conectar automaticamente se dispositivo conhecido for detectado
   */
  async autoConnectIfAvailable() {
    if (!this.autoSync || this.isConnected) {
      return;
    }

    try {
      // Tentar reconectar ao último dispositivo conhecido
      if (this.device && !this.device.gatt.connected) {

        await this.connect();
      }
    } catch (error) {

    }
  }

  /**
   * Solicitar conexão com dispositivo próximo
   */
  async requestDevice() {
    if (!this.isSupported) {
      throw new Error('Web Bluetooth não é suportado neste navegador');
    }

    try {

      this.device = await navigator.bluetooth.requestDevice({
        filters: [
          { services: [this.SERVICE_UUID] }
        ],
        optionalServices: [this.SERVICE_UUID]
      });

      // Adicionar listener para desconexão
      this.device.addEventListener('gattserverdisconnected', () => {

        this.isConnected = false;
        this.notifyListeners('disconnected');
      });

      return this.device;
    } catch (error) {
      console.error('❌ Erro ao solicitar dispositivo:', error);
      throw error;
    }
  }

  /**
   * Conectar ao dispositivo selecionado
   */
  async connect() {
    if (!this.device) {
      throw new Error('Nenhum dispositivo selecionado. Use requestDevice() primeiro.');
    }

    try {

      // Conectar ao servidor GATT
      this.server = await this.device.gatt.connect();

      // Obter serviço
      this.service = await this.server.getPrimaryService(this.SERVICE_UUID);

      // Obter característica
      this.characteristic = await this.service.getCharacteristic(this.CHARACTERISTIC_UUID);

      this.isConnected = true;
      this.notifyListeners('connected', { device: this.device.name });

      // Iniciar escuta de notificações
      await this.startNotifications();

      // Auto-sincronizar se habilitado
      if (this.autoSync) {
        await this.syncWithPeer();
      }

      return true;
    } catch (error) {
      console.error('❌ Erro ao conectar:', error);
      this.isConnected = false;
      throw error;
    }
  }

  /**
   * Iniciar escuta de notificações do peer
   */
  async startNotifications() {
    if (!this.characteristic) {
      throw new Error('Característica não disponível');
    }

    try {
      await this.characteristic.startNotifications();

      this.characteristic.addEventListener('characteristicvaluechanged', (event) => {
        this.handleIncomingData(event.target.value);
      });
    } catch (error) {
      console.error('❌ Erro ao iniciar notificações:', error);
    }
  }

  /**
   * Processar dados recebidos de outro dispositivo
   */
  handleIncomingData(dataView) {
    try {
      // Converter ArrayBuffer para string
      const decoder = new TextDecoder('utf-8');
      const jsonString = decoder.decode(dataView);
      const data = JSON.parse(jsonString);

      // Processar operações recebidas
      if (data.type === 'sync') {
        this.processSyncData(data.operations);
      } else if (data.type === 'request') {
        this.handleSyncRequest();
      }

      this.notifyListeners('dataReceived', data);
    } catch (error) {
      console.error('❌ Erro ao processar dados recebidos:', error);
    }
  }

  /**
   * Processar operações sincronizadas de outro dispositivo
   */
  async processSyncData(operations) {
    if (!operations || operations.length === 0) {

      return;
    }

    // Importar offlineService dinamicamente
    const { default: offlineService } = await import('./offlineService');

    let savedCount = 0;

    for (const operation of operations) {
      try {
        // Salvar operação no IndexedDB local
        await offlineService.savePendingOperation(operation);
        savedCount++;
      } catch (error) {
        console.error('❌ Erro ao salvar operação recebida:', error);
      }
    }

    this.notifyListeners('syncCompleted', { receivedCount: savedCount });

    // Se estiver online, sincronizar com Firebase
    if (navigator.onLine) {

      await offlineService.syncPendingOperations();
    }
  }

  /**
   * Enviar dados para dispositivo conectado
   */
  async sendData(data) {
    if (!this.isConnected || !this.characteristic) {
      throw new Error('Não conectado a nenhum dispositivo');
    }

    try {
      // Converter objeto para JSON e depois para ArrayBuffer
      const jsonString = JSON.stringify(data);
      const encoder = new TextEncoder();
      const arrayBuffer = encoder.encode(jsonString);

      // Bluetooth LE tem limite de ~20 bytes por transmissão
      // Dividir em chunks se necessário
      const chunkSize = 20;
      for (let i = 0; i < arrayBuffer.length; i += chunkSize) {
        const chunk = arrayBuffer.slice(i, i + chunkSize);
        await this.characteristic.writeValue(chunk);
      }

      return true;
    } catch (error) {
      console.error('❌ Erro ao enviar dados:', error);
      throw error;
    }
  }

  /**
   * Sincronizar operações pendentes com peer
   */
  async syncWithPeer() {

    // Importar offlineService
    const { default: offlineService } = await import('./offlineService');

    // Obter operações pendentes
    const pendingOps = await offlineService.getPendingOperations();

    if (pendingOps.length === 0) {

      // Solicitar operações do peer
      await this.sendData({
        type: 'request',
        message: 'Solicitar operações pendentes'
      });
      
      return;
    }

    try {
      await this.sendData({
        type: 'sync',
        operations: pendingOps,
        timestamp: Date.now()
      });

      this.notifyListeners('syncSent', { sentCount: pendingOps.length });
    } catch (error) {
      console.error('❌ Erro na sincronização:', error);
      throw error;
    }
  }

  /**
   * Responder a solicitação de sincronização
   */
  async handleSyncRequest() {

    await this.syncWithPeer();
  }

  /**
   * Desconectar do dispositivo atual
   */
  disconnect() {
    if (this.device && this.device.gatt.connected) {
      this.device.gatt.disconnect();

    }

    this.device = null;
    this.server = null;
    this.service = null;
    this.characteristic = null;
    this.isConnected = false;

    this.notifyListeners('disconnected');
  }

  /**
   * Escanear dispositivos próximos (experimental)
   */
  async scanDevices() {
    if (!this.isSupported) {
      throw new Error('Web Bluetooth não é suportado');
    }

    try {
      // Nota: Web Bluetooth não permite scan passivo
      // Usuário precisa escolher dispositivo manualmente
      return await this.requestDevice();
    } catch (error) {
      console.error('❌ Erro ao escanear:', error);
      throw error;
    }
  }

  /**
   * Adicionar listener para eventos
   */
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notificar todos os listeners
   */
  notifyListeners(event, data) {
    this.listeners.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Erro ao notificar listener:', error);
      }
    });
  }

  /**
   * Configurar sincronização automática
   */
  setAutoSync(enabled) {
    this.autoSync = enabled;

  }

  /**
   * Obter status da conexão
   */
  getStatus() {
    return {
      isSupported: this.isSupported,
      isConnected: this.isConnected,
      deviceName: this.device?.name || null,
      autoSync: this.autoSync
    };
  }
}

// Exportar instância singleton
const bluetoothMeshService = new BluetoothMeshService();
export default bluetoothMeshService;
