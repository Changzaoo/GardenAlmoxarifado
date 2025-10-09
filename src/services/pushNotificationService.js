import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { doc, setDoc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { toast } from 'react-toastify';

// Importações opcionais do Capacitor (apenas em ambiente nativo)
let PushNotifications = null;
let Capacitor = null;

try {
  const capacitorCore = require('@capacitor/core');
  Capacitor = capacitorCore.Capacitor;
  
  // Só importar PushNotifications se estiver em ambiente nativo
  if (Capacitor && Capacitor.isNativePlatform()) {
    const pushNotifications = require('@capacitor/push-notifications');
    PushNotifications = pushNotifications.PushNotifications;
  }
} catch (error) {

}

/**
 * PushNotificationService - Gerencia notificações push para web e mobile
 * Integra Firebase Cloud Messaging (FCM) e Capacitor Push Notifications
 */
class PushNotificationService {
  constructor() {
    this.messaging = null;
    this.currentUserId = null;
    this.isNative = Capacitor ? Capacitor.isNativePlatform() : false;
    this.initialized = false;
    this.notificationSound = null;
    this.loadNotificationSound();
  }

  /**
   * Carrega o som de notificação
   */
  loadNotificationSound() {
    try {
      this.notificationSound = new Audio('/sounds/notification.mp3');
      this.notificationSound.volume = 0.5;
    } catch (error) {

    }
  }

  /**
   * Toca o som de notificação
   */
  playNotificationSound() {
    if (this.notificationSound) {
      this.notificationSound.play().catch(err => {

      });
    }
  }

  /**
   * Verifica se o usuario esta na pagina de mensagens
   */
  isOnMessagesPage() {
    return window.location.hash.includes('#/mensagens') || 
           window.location.pathname.includes('/mensagens');
  }

  /**
   * Verifica se a aba/janela esta ativa
   */
  isWindowActive() {
    return document.hasFocus() && !document.hidden;
  }

  /**
   * Inicializa o serviço de notificações push
   */
  async initialize(userId) {
    if (this.initialized && this.currentUserId === userId) {

      return;
    }

    this.currentUserId = userId;

    try {
      if (this.isNative) {
        await this.initializeNative(userId);
      } else {
        await this.initializeWeb(userId);
      }
      this.initialized = true;

    } catch (error) {
      console.error('❌ Erro:', error);

    }
  }

  /**
   * Inicializa notificações nativas (iOS/Android)
   */
  async initializeNative(userId) {
    if (!PushNotifications) {

      return;
    }

    try {
      const permission = await PushNotifications.requestPermissions();
      
      if (permission.receive !== 'granted') {
        toast.warn('Notificações desativadas');
        return;
      }

      await PushNotifications.register();

      await PushNotifications.addListener('registration', async (token) => {

        await this.saveToken(userId, token.value);

      });

      await PushNotifications.addListener('pushNotificationReceived', (notification) => {

        // NAO mostrar notificacao se estiver na pagina de mensagens E app ativo
        if (this.isOnMessagesPage() && this.isWindowActive()) {

          return;
        }
        
        this.handleNotificationReceived(notification);
        this.playNotificationSound();
        toast.info(notification.body || 'Nova mensagem', { icon: '💬' });
      });

      await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        this.handleNotificationTapped(action.notification);
      });

      await PushNotifications.addListener('registrationError', (error) => {
        console.error('❌ Erro:', error);
      });

    } catch (error) {
      console.error('❌ Erro:', error);
    }
  }

  /**
   * Inicializa notificações web (browser)
   */
  async initializeWeb(userId) {
    try {

      if (!('Notification' in window)) {
        toast.info('Navegador não suporta notificações');
        return;
      }

      if (Notification.permission === 'denied') {
        toast.warn('Notificações bloqueadas');
        return;
      }

      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {

          // NAO mostrar notificacao de teste ao inicializar
        } else {
          toast.warn('Notificações desativadas');
          return;
        }
      }

      const { default: app } = await import('../firebaseConfig');
      this.messaging = getMessaging(app);

      const vapidKey = process.env.REACT_APP_FIREBASE_VAPID_KEY;
      
      if (!vapidKey) {

        this.setupLocalNotifications();
        return;
      }

      try {
        const token = await getToken(this.messaging, { vapidKey });
        
        if (token) {
          await this.saveToken(userId, token);

        } else {
          this.setupLocalNotifications();
        }

        onMessage(this.messaging, (payload) => {
          const notification = payload.notification || {};
          
          // NAO mostrar notificacao se estiver na pagina de mensagens E janela ativa
          if (this.isOnMessagesPage() && this.isWindowActive()) {

            return;
          }
          
          this.showBrowserNotification(
            notification.title || 'Nova Mensagem',
            notification.body || 'Você recebeu uma mensagem',
            notification.icon || '/logo.png',
            notification.click_action
          );
          
          this.playNotificationSound();
          
          toast.info(notification.body || 'Nova mensagem', {
            icon: '💬',
            onClick: () => {
              if (notification.click_action) {
                window.location.href = notification.click_action;
              }
            }
          });
        });

      } catch (tokenError) {

        this.setupLocalNotifications();
      }

    } catch (error) {
      console.error('❌ Erro:', error);
    }
  }

  /**
   * Notificações locais (desenvolvimento)
   */
  setupLocalNotifications() {

    // NAO mostrar notificacao de teste
  }

  /**
   * Mostra notificação do navegador
   */
  showBrowserNotification(title, body, icon = '/logo.png', clickAction = null) {
    if (Notification.permission !== 'granted') return;

    try {
      const notification = new Notification(title, {
        body,
        icon,
        badge: icon,
        tag: 'msg-' + Date.now(),
        requireInteraction: false,
        vibrate: [200, 100, 200]
      });

      notification.onclick = () => {
        window.focus();
        window.location.hash = clickAction || '#/mensagens';
        notification.close();
      };

      setTimeout(() => notification.close(), 10000);
      this.playNotificationSound();

    } catch (error) {
      console.error('❌ Erro notificação:', error);
    }
  }

  /**
   * Salva token no Firestore
   */
  async saveToken(userId, token) {
    try {
      const userRef = doc(db, 'usuarios', userId);
      const userDoc = await getDoc(userRef);

      const tokenData = {
        token,
        platform: this.isNative && Capacitor ? Capacitor.getPlatform() : 'web',
        registeredAt: new Date().toISOString()
      };

      if (userDoc.exists()) {
        await updateDoc(userRef, {
          fcmTokens: arrayUnion(tokenData)
        });
      } else {
        await setDoc(userRef, {
          fcmTokens: [tokenData]
        }, { merge: true });
      }

    } catch (error) {
      console.error('❌ Erro salvar token:', error);
    }
  }

  /**
   * Handler notificação recebida
   */
  handleNotificationReceived(notification) {
    if ('setAppBadge' in navigator) {
      navigator.setAppBadge(1).catch(() => {});
    }
    
    window.dispatchEvent(new CustomEvent('nova-mensagem', {
      detail: notification
    }));
  }

  /**
   * Handler notificação tocada
   */
  handleNotificationTapped(notification) {
    if ('clearAppBadge' in navigator) {
      navigator.clearAppBadge().catch(() => {});
    }
    
    const conversaId = notification.data?.conversaId;
    window.location.href = conversaId 
      ? `/#/mensagens?conversa=${conversaId}`
      : '/#/mensagens';
  }

  /**
   * Notificação de teste
   */
  async sendTestNotification() {
    this.showBrowserNotification(
      'Teste de Notificação 🧪',
      'Funcionando perfeitamente!',
      '/logo.png'
    );
    
    this.playNotificationSound();
    toast.success('Teste OK!');
  }

  /**
   * Cleanup
   */
  cleanup() {
    if (this.isNative && PushNotifications) {
      PushNotifications.removeAllListeners();
    }
    this.initialized = false;
  }
}

const pushNotificationService = new PushNotificationService();
export default pushNotificationService;
