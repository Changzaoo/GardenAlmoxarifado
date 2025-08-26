import { useEffect, useCallback } from 'react';
import { requestNotificationPermission, registerForPush } from '../utils/notificationUtils';

export const useNotifications = () => {
  // Inicializa as notificações no carregamento do componente
  useEffect(() => {
    initializeNotifications();
  }, []);

  // Função para inicializar notificações
  const initializeNotifications = useCallback(async () => {
    try {
      // Solicita permissão para notificações
      const hasPermission = await requestNotificationPermission();
      
      if (hasPermission) {
        // Registra para push notifications
        const subscription = await registerForPush();
        
        if (subscription) {
          // Aqui você pode enviar o subscription para seu backend
          console.log('Push notification subscription:', subscription);
        }
      }
    } catch (error) {
      console.error('Erro ao inicializar notificações:', error);
    }
  }, []);

  return {
    initializeNotifications
  };
};

export default useNotifications;
