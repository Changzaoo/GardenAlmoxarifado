import { useEffect, useCallback, useState } from 'react';
import { useIsMobile } from './useIsMobile';

const notificationSound = new Audio('/sounds/notification.mp3');

export const useMessageNotification = () => {
  const isMobile = useIsMobile();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Inicializar notificações
  useEffect(() => {
    const initNotifications = async () => {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        setNotificationsEnabled(permission === 'granted');
      }
    };

    initNotifications();
  }, []);

  // Função para tocar o som de notificação
  const playNotificationSound = useCallback(() => {
    if (!soundEnabled) return;
    
    try {
      notificationSound.currentTime = 0;
      const playPromise = notificationSound.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error('Erro ao tocar som de notificação:', error);
        });
      }
    } catch (error) {
      console.error('Erro ao tocar som de notificação:', error);
    }
  }, [soundEnabled]);

  // Função para enviar notificação
  const sendNotification = useCallback((message) => {
    // Toca o som apenas se a janela estiver em segundo plano ou minimizada
    if (document.visibilityState === 'hidden') {
      playNotificationSound();
    }

    if (notificationsEnabled && document.visibilityState === 'hidden') {
      try {
        const notification = new Notification('Nova mensagem', {
          body: `${message.remetente.nome}: ${message.conteudo}`,
          icon: '/logo.png',
          badge: '/logo.png',
          tag: `chat-${message.chatId}`,
          renotify: true,
          silent: true, // Desabilita o som padrão pois usamos nosso próprio som
          data: {
            chatId: message.chatId,
            messageId: message.id
          },
          actions: [
            {
              action: 'reply',
              title: 'Responder',
              icon: '/logo.png'
            },
            {
              action: 'read',
              title: 'Marcar como lida',
              icon: '/logo.png'
            }
          ]
        });

        notification.onclick = function(event) {
          window.focus();
          if (event.action === 'reply') {
            // Implementar lógica de resposta
          } else if (event.action === 'read') {
            // Implementar lógica de marcar como lida
          }
        };
      } catch (error) {
        console.error('Erro ao enviar notificação:', error);
      }
    }

    // Em dispositivos móveis, atualiza o badge do app
    if (isMobile && 'setAppBadge' in navigator) {
      navigator.setAppBadge().catch(console.error);
    }
  }, [notificationsEnabled, isMobile, playNotificationSound]);

  // Limpar notificações
  const clearNotifications = useCallback(() => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      // Envia uma mensagem para o service worker fechar todas as notificações
      navigator.serviceWorker.controller.postMessage({
        type: 'CLEAR_NOTIFICATIONS'
      });
    }

    // Em dispositivos móveis, limpa o badge do app
    if (isMobile && 'clearAppBadge' in navigator) {
      navigator.clearAppBadge().catch(console.error);
    }

    // Limpa o badge em dispositivos móveis
    if (isMobile && 'clearAppBadge' in navigator) {
      navigator.clearAppBadge().catch(console.error);
    }
  }, [isMobile]);

  // Toggle som
  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => !prev);
  }, []);

  return {
    sendNotification,
    clearNotifications,
    soundEnabled,
    toggleSound,
    notificationsEnabled
  };
};