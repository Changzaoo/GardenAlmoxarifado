import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { doc, setDoc, getDoc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { toast } from 'react-toastify';

/**
 * NotificationManager - Sistema avançado de notificações push
 * Features:
 * - Notificações web push (FCM)
 * - Notificações nativas mobile (Capacitor)
 * - Sistema de badges e contadores
 * - Gerenciamento de permissões
 * - Fila de notificações pendentes
 * - Sincronização multi-dispositivo
 * - Sons e vibrações customizáveis
 */

class NotificationManager {
  constructor() {
    this.messaging = null;
    this.currentUserId = null;
    this.initialized = false;
    this.notificationQueue = [];
    this.sounds = {
      message: null,
      mention: null,
      call: null
    };
    this.preferences = {
      enabled: true,
      sound: true,
      vibration: true,
      desktop: true,
      mobile: true,
      showPreview: true,
      playOnFocus: false
    };
    
    this.loadSounds();
    this.loadPreferences();
    this.setupVisibilityListener();
  }

  // ==================== INICIALIZAÇÃO ====================

  /**
   * Inicializa o gerenciador de notificações
   */
  async initialize(userId) {
    if (this.initialized && this.currentUserId === userId) {
      console.log('✅ NotificationManager já inicializado');
      return { success: true, message: 'Já inicializado' };
    }

    console.log('🚀 Inicializando NotificationManager para:', userId);
    this.currentUserId = userId;

    try {
      // Verificar suporte a notificações
      if (!('Notification' in window)) {
        throw new Error('Navegador não suporta notificações');
      }

      // Verificar permissão
      const permission = await this.requestPermission();
      
      if (permission !== 'granted') {
        return { 
          success: false, 
          message: 'Permissão negada',
          permission 
        };
      }

      // Inicializar Firebase Cloud Messaging
      await this.initializeFirebaseMessaging(userId);

      // Registrar service worker se necessário
      await this.registerServiceWorker();

      // Carregar notificações pendentes
      await this.loadPendingNotifications();

      this.initialized = true;
      console.log('✅ NotificationManager inicializado com sucesso');
      
      return { 
        success: true, 
        message: 'Notificações ativadas',
        permission: 'granted'
      };

    } catch (error) {
      console.error('❌ Erro ao inicializar NotificationManager:', error);
      return { 
        success: false, 
        message: error.message,
        error 
      };
    }
  }

  /**
   * Solicita permissão para notificações
   */
  async requestPermission() {
    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      toast.warn('Notificações bloqueadas. Ative nas configurações do navegador.', {
        autoClose: 5000
      });
      return 'denied';
    }

    // Solicitar permissão
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      toast.success('Notificações ativadas! 🔔', { icon: '✅' });
    } else {
      toast.info('Notificações desativadas', { icon: 'ℹ️' });
    }

    return permission;
  }

  /**
   * Inicializa Firebase Cloud Messaging
   */
  async initializeFirebaseMessaging(userId) {
    try {
      // Verificar se está rodando em Capacitor (Android/iOS)
      const isCapacitor = await this.isCapacitorPlatform();
      
      if (isCapacitor) {
        console.log('📱 Inicializando notificações mobile com Capacitor');
        await this.setupCapacitorNotifications(userId);
        return;
      }

      // Web: usar Firebase Cloud Messaging
      console.log('🌐 Inicializando notificações web com FCM');
      const { default: app } = await import('../firebaseConfig');
      this.messaging = getMessaging(app);

      // Obter VAPID key
      const vapidKey = process.env.REACT_APP_FIREBASE_VAPID_KEY;
      
      if (!vapidKey) {
        console.warn('⚠️ VAPID key não configurada - usando modo local');
        this.setupLocalMode();
        return;
      }

      // Obter token FCM
      const token = await getToken(this.messaging, { vapidKey });
      
      if (token) {
        await this.saveToken(userId, token);
        console.log('📱 Token FCM salvo');
      }

      // Listener de mensagens em primeiro plano
      onMessage(this.messaging, (payload) => {
        console.log('📨 Mensagem FCM recebida:', payload);
        this.handleFCMMessage(payload);
      });

    } catch (error) {
      console.error('❌ Erro ao inicializar FCM:', error);
      this.setupLocalMode();
    }
  }

  /**
   * Verifica se está rodando em plataforma Capacitor
   */
  async isCapacitorPlatform() {
    try {
      const { Capacitor } = await import('@capacitor/core');
      return Capacitor.isNativePlatform();
    } catch {
      return false;
    }
  }

  /**
   * Configura notificações no Capacitor (Android/iOS)
   */
  async setupCapacitorNotifications(userId) {
    try {
      const { PushNotifications } = await import('@capacitor/push-notifications');
      const { Capacitor } = await import('@capacitor/core');

      console.log('📱 Plataforma:', Capacitor.getPlatform());

      // Solicitar permissão
      let permStatus = await PushNotifications.checkPermissions();

      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        console.warn('❌ Permissão de notificações negada');
        return;
      }

      // Registrar para receber notificações
      await PushNotifications.register();
      console.log('✅ Push notifications registradas');

      // Listener: token FCM recebido
      await PushNotifications.addListener('registration', async (token) => {
        console.log('📱 Push registration token:', token.value);
        await this.saveToken(userId, token.value);
      });

      // Listener: erro no registro
      await PushNotifications.addListener('registrationError', (error) => {
        console.error('❌ Erro ao registrar push:', error);
      });

      // Listener: notificação recebida (app em primeiro plano)
      await PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('📨 Push recebido:', notification);
        this.handleCapacitorNotification(notification);
      });

      // Listener: notificação clicada
      await PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
        console.log('👆 Notificação clicada:', notification);
        const conversaId = notification.notification?.data?.conversaId;
        this.handleNotificationClick(conversaId);
      });

    } catch (error) {
      console.error('❌ Erro ao configurar Capacitor notifications:', error);
    }
  }

  /**
   * Processa notificação recebida pelo Capacitor
   */
  handleCapacitorNotification(notification) {
    const { title, body, data } = notification;
    
    // Se o app está aberto e na página de mensagens, apenas mostrar toast
    if (this.isOnMessagesPage() && this.isWindowActive()) {
      toast.info(body || 'Nova mensagem', {
        icon: '💬',
        autoClose: 3000
      });
      
      if (this.preferences.sound) {
        this.playSound('message');
      }
      
      return;
    }

    // App em background ou outra página - notificação já foi mostrada pelo sistema
    console.log('📬 Notificação recebida pelo sistema:', title);
  }

  /**
   * Registra service worker
   */
  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/service-worker.js');
        console.log('✅ Service Worker registrado:', registration.scope);
        
        // Configurar comunicação com SW
        this.setupServiceWorkerCommunication(registration);
        
        return registration;
      } catch (error) {
        console.error('❌ Erro ao registrar Service Worker:', error);
      }
    }
  }

  /**
   * Configura comunicação com service worker
   */
  setupServiceWorkerCommunication(registration) {
    // Listener de mensagens do SW
    navigator.serviceWorker.addEventListener('message', (event) => {
      console.log('📬 Mensagem do SW:', event.data);
      
      if (event.data.type === 'NOTIFICATION_CLICKED') {
        this.handleNotificationClick(event.data.conversaId);
      }
    });

    // Enviar configurações para o SW
    this.sendMessageToSW({
      type: 'UPDATE_CONFIG',
      preferences: this.preferences
    });
  }

  /**
   * Envia mensagem para o service worker
   */
  sendMessageToSW(message) {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage(message);
    }
  }

  // ==================== GERENCIAMENTO DE NOTIFICAÇÕES ====================

  /**
   * Processa mensagem FCM recebida
   */
  handleFCMMessage(payload) {
    const notification = payload.notification || {};
    const data = payload.data || {};

    // Verificar se está na página de mensagens e aba ativa
    if (this.isOnMessagesPage() && this.isWindowActive()) {
      console.log('🔕 Usuário está na página - notificação suprimida');
      
      // Apenas tocar som se configurado
      if (this.preferences.sound && this.preferences.playOnFocus) {
        this.playSound('message');
      }
      
      // Mostrar toast discreto
      toast.info(notification.body || 'Nova mensagem', {
        icon: '💬',
        autoClose: 3000,
        position: 'bottom-right'
      });
      
      return;
    }

    // Mostrar notificação completa
    this.showNotification({
      title: notification.title || 'Nova Mensagem',
      body: notification.body || 'Você recebeu uma mensagem',
      icon: notification.icon || '/logo192.png',
      conversaId: data.conversaId,
      senderId: data.senderId,
      senderName: data.senderName
    });
  }

  /**
   * Mostra uma notificação
   */
  async showNotification(options) {
    const {
      title,
      body,
      icon = '/logo192.png',
      conversaId = null,
      senderId = null,
      senderName = null
    } = options;

    // Verificar preferências
    if (!this.preferences.enabled || !this.preferences.desktop) {
      console.log('🔕 Notificações desativadas nas preferências');
      return;
    }

    // Verificar permissão
    if (Notification.permission !== 'granted') {
      console.warn('⚠️ Sem permissão para notificações');
      return;
    }

    try {
      // Criar notificação do navegador
      const notification = new Notification(title, {
        body: this.preferences.showPreview ? body : 'Nova mensagem',
        icon,
        badge: '/logo192.png',
        tag: conversaId ? `msg-${conversaId}` : `msg-${Date.now()}`,
        data: {
          conversaId,
          senderId,
          senderName,
          url: conversaId ? `/#/mensagens?conversa=${conversaId}` : '/#/mensagens'
        },
        requireInteraction: false,
        vibrate: this.preferences.vibration ? [200, 100, 200] : [],
        silent: !this.preferences.sound
      });

      // Handler de clique
      notification.onclick = () => {
        window.focus();
        this.handleNotificationClick(conversaId);
        notification.close();
      };

      // Auto-fechar após 10 segundos
      setTimeout(() => notification.close(), 10000);

      // Tocar som
      if (this.preferences.sound) {
        this.playSound('message');
      }

      // Adicionar à fila
      this.notificationQueue.push({
        id: Date.now(),
        title,
        body,
        conversaId,
        timestamp: new Date().toISOString()
      });

      // Limitar fila a 50 itens
      if (this.notificationQueue.length > 50) {
        this.notificationQueue = this.notificationQueue.slice(-50);
      }

      // Atualizar badge
      this.updateBadge(1);

    } catch (error) {
      console.error('❌ Erro ao mostrar notificação:', error);
      
      // Fallback: toast
      toast.info(body, {
        icon: '💬',
        autoClose: 5000
      });
    }
  }

  /**
   * Atualiza contador de badge
   */
  updateBadge(increment = 0) {
    if ('setAppBadge' in navigator) {
      // Obter contagem atual de não lidas
      const currentCount = this.getCurrentUnreadCount();
      const newCount = currentCount + increment;
      
      navigator.setAppBadge(newCount).catch(err => {
        console.log('Badge API não suportada:', err);
      });

      // Atualizar SW também
      this.sendMessageToSW({
        type: 'UPDATE_BADGE',
        count: newCount
      });
    }
  }

  /**
   * Limpa badge
   */
  clearBadge() {
    if ('clearAppBadge' in navigator) {
      navigator.clearAppBadge().catch(() => {});
    }
    
    this.sendMessageToSW({ type: 'CLEAR_BADGE' });
  }

  /**
   * Obtém contagem de não lidas (implementar conforme seu sistema)
   */
  getCurrentUnreadCount() {
    // Isso deve ser integrado com seu sistema de contagem
    // Por enquanto, retorna o tamanho da fila
    return this.notificationQueue.length;
  }

  // ==================== SONS E FEEDBACK ====================

  /**
   * Carrega sons de notificação
   */
  loadSounds() {
    try {
      this.sounds.message = new Audio('/sounds/notification.mp3');
      this.sounds.message.volume = 0.5;
      
      this.sounds.mention = new Audio('/sounds/mention.mp3');
      this.sounds.mention.volume = 0.6;
      
      this.sounds.call = new Audio('/sounds/call.mp3');
      this.sounds.call.volume = 0.7;
    } catch (error) {
      console.log('ℹ️ Sons não disponíveis');
    }
  }

  /**
   * Toca um som
   */
  playSound(type = 'message') {
    if (!this.preferences.sound) return;
    
    const sound = this.sounds[type];
    if (sound) {
      sound.currentTime = 0;
      sound.play().catch(err => {
        console.log('Não foi possível tocar o som:', err);
      });
    }
  }

  // ==================== PREFERÊNCIAS ====================

  /**
   * Carrega preferências do localStorage
   */
  loadPreferences() {
    try {
      const saved = localStorage.getItem('notification_preferences');
      if (saved) {
        this.preferences = { ...this.preferences, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.error('Erro ao carregar preferências:', error);
    }
  }

  /**
   * Salva preferências
   */
  savePreferences(newPreferences) {
    this.preferences = { ...this.preferences, ...newPreferences };
    localStorage.setItem('notification_preferences', JSON.stringify(this.preferences));
    
    // Atualizar SW
    this.sendMessageToSW({
      type: 'UPDATE_CONFIG',
      preferences: this.preferences
    });
  }

  /**
   * Obtém preferências atuais
   */
  getPreferences() {
    return { ...this.preferences };
  }

  // ==================== HELPERS ====================

  /**
   * Verifica se está na página de mensagens
   */
  isOnMessagesPage() {
    return window.location.hash.includes('#/mensagens') ||
           window.location.pathname.includes('/mensagens');
  }

  /**
   * Verifica se a janela está ativa
   */
  isWindowActive() {
    return document.hasFocus() && !document.hidden;
  }

  /**
   * Configura listener de visibilidade
   */
  setupVisibilityListener() {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.isOnMessagesPage()) {
        // Limpar badge quando voltar para a página
        this.clearBadge();
      }
    });
  }

  /**
   * Handler de clique em notificação
   */
  handleNotificationClick(conversaId) {
    if (conversaId) {
      window.location.hash = `#/mensagens?conversa=${conversaId}`;
    } else {
      window.location.hash = '#/mensagens';
    }
    
    // Limpar badge
    this.clearBadge();
  }

  /**
   * Modo local (desenvolvimento)
   */
  setupLocalMode() {
    console.log('🔧 Modo local ativado (sem FCM)');
  }

  /**
   * Salva token FCM no Firestore
   */
  async saveToken(userId, token) {
    try {
      const userRef = doc(db, 'usuarios', userId);
      const tokenData = {
        token,
        platform: 'web',
        browser: navigator.userAgent,
        registeredAt: serverTimestamp(),
        lastUsed: serverTimestamp()
      };

      await setDoc(userRef, {
        fcmTokens: arrayUnion(tokenData),
        notificationPreferences: this.preferences
      }, { merge: true });

      console.log('✅ Token FCM salvo no Firestore');
    } catch (error) {
      console.error('❌ Erro ao salvar token:', error);
    }
  }

  /**
   * Carrega notificações pendentes
   */
  async loadPendingNotifications() {
    // Obter do service worker
    if (navigator.serviceWorker.controller) {
      const channel = new MessageChannel();
      
      channel.port1.onmessage = (event) => {
        if (event.data.notifications) {
          this.notificationQueue = event.data.notifications;
          console.log('📬 Notificações pendentes carregadas:', this.notificationQueue.length);
        }
      };

      navigator.serviceWorker.controller.postMessage(
        { type: 'GET_PENDING_NOTIFICATIONS' },
        [channel.port2]
      );
    }
  }

  /**
   * Envia notificação de teste
   */
  async sendTestNotification() {
    await this.showNotification({
      title: 'Teste de Notificação 🧪',
      body: 'Sistema de notificações funcionando perfeitamente!',
      icon: '/logo192.png'
    });
    
    toast.success('Notificação de teste enviada!', { icon: '✅' });
  }

  /**
   * Cleanup
   */
  cleanup() {
    this.initialized = false;
    this.currentUserId = null;
    this.notificationQueue = [];
    this.clearBadge();
  }
}

// Exportar instância singleton
const notificationManager = new NotificationManager();
export default notificationManager;
