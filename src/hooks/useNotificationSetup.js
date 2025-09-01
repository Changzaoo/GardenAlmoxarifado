import { useState, useEffect } from 'react';
import { useToast } from '../components/ToastProvider';

export const useNotificationSetup = () => {
  const [permission, setPermission] = useState(Notification.permission);
  const { showToast } = useToast();

  useEffect(() => {
    checkNotificationSupport();
  }, []);

  const checkNotificationSupport = async () => {
    try {
      // Verifica se o navegador suporta notificações
      if (!('Notification' in window)) {
        showToast('Seu navegador não suporta notificações', 'warning');
        return false;
      }

      // Verifica service worker
      if (!('serviceWorker' in navigator)) {
        showToast('Seu navegador não suporta recursos necessários para notificações', 'warning');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao verificar suporte a notificações:', error);
      return false;
    }
  };

  const requestPermission = async () => {
    try {
      if (!(await checkNotificationSupport())) return false;

      if (permission === 'granted') return true;

      // Solicita permissão
      const newPermission = await Notification.requestPermission();
      setPermission(newPermission);

      if (newPermission === 'granted') {
        showToast('Notificações ativadas com sucesso!', 'success');
        await registerServiceWorker();
        return true;
      } else {
        showToast('Permissão para notificações negada', 'warning');
        return false;
      }
    } catch (error) {
      console.error('Erro ao solicitar permissão para notificações:', error);
      showToast('Erro ao configurar notificações', 'error');
      return false;
    }
  };

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      if (registration.active) {
        console.log('Service Worker ativo');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao registrar Service Worker:', error);
      return false;
    }
  };

  return {
    permission,
    requestPermission,
    isSupported: 'Notification' in window && 'serviceWorker' in navigator
  };
};
