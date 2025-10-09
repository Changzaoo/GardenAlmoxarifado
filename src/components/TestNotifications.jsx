import React from 'react';
import { Bell, Send } from 'lucide-react';
import pushNotificationService from '../services/pushNotificationService';
import { toast } from 'react-toastify';

/**
 * Componente para testar notificações push
 * Use apenas em desenvolvimento
 */
const TestNotifications = () => {
  const handleTestNotification = () => {
    pushNotificationService.sendTestNotification();
  };

  const handleCheckPermission = () => {
    if (!('Notification' in window)) {
      toast.error('Navegador não suporta notificações');
      return;
    }

    const permission = Notification.permission;
    
    switch (permission) {
      case 'granted':
        toast.success('✅ Permissão concedida!');
        break;
      case 'denied':
        toast.error('❌ Permissão negada - Ative nas configurações do navegador');
        break;
      case 'default':
        toast.info('⚠️ Permissão não solicitada ainda');
        break;
      default:
        toast.info(`Status: ${permission}`);
    }
  };

  const handleRequestPermission = async () => {
    if (!('Notification' in window)) {
      toast.error('Navegador não suporta notificações');
      return;
    }

    if (Notification.permission === 'denied') {
      toast.error('Permissão negada. Ative nas configurações do navegador.');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        toast.success('✅ Permissão concedida!');
        // Enviar notificação de teste
        pushNotificationService.sendTestNotification();
      } else {
        toast.warn('Permissão negada');
      }
    } catch (error) {
      toast.error('Erro ao solicitar permissão');
      console.error(error);
    }
  };

  const handleShowInfo = () => {
    const info = {
      'Suporte': 'Notification' in window ? '✅ Sim' : '❌ Não',
      'Permissão': Notification.permission || 'N/A',
      'Service Worker': 'serviceWorker' in navigator ? '✅ Sim' : '❌ Não',
      'VAPID Key': process.env.REACT_APP_FIREBASE_VAPID_KEY ? '✅ Configurada' : '❌ Não configurada'
    };

    Object.entries(info).forEach(([key, value]) => {

    });

    toast.info('Veja o console (F12) para detalhes');
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 space-y-2 max-w-xs">
      <div className="flex items-center gap-2 mb-3">
        <Bell className="w-5 h-5 text-blue-500" />
        <h3 className="font-bold text-gray-900 dark:text-white">
          Teste de Notificações
        </h3>
      </div>

      <button
        onClick={handleTestNotification}
        className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
      >
        <Send className="w-4 h-4" />
        Enviar Teste
      </button>

      <button
        onClick={handleCheckPermission}
        className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
      >
        Verificar Permissão
      </button>

      <button
        onClick={handleRequestPermission}
        className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
      >
        Solicitar Permissão
      </button>

      <button
        onClick={handleShowInfo}
        className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
      >
        Mostrar Info
      </button>

      <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
        Apenas para desenvolvimento
      </p>
    </div>
  );
};

export default TestNotifications;
