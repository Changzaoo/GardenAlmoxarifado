import React, { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';

/**
 * Modal para solicitar permissão de notificações no primeiro acesso
 */
const NotificationPermissionModal = () => {
  const [showModal, setShowModal] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    // Verificar se já pediu permissão antes
    const hasAskedPermission = localStorage.getItem('hasAskedNotificationPermission');
    
    // Verificar se o navegador suporta notificações
    const supportsNotifications = 'Notification' in window;
    
    // Mostrar modal se:
    // 1. Navegador suporta notificações
    // 2. Nunca pediu permissão antes
    // 3. Permissão ainda não foi concedida ou negada
    if (
      supportsNotifications && 
      !hasAskedPermission && 
      Notification.permission === 'default'
    ) {
      // Aguardar 2 segundos após o carregamento para não ser intrusivo
      const timer = setTimeout(() => {
        setShowModal(true);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    
    try {
      const permission = await Notification.requestPermission();

      // Marcar que já pediu permissão
      localStorage.setItem('hasAskedNotificationPermission', 'true');
      
      // Mostrar notificação de teste se permitido
      if (permission === 'granted') {
        new Notification('Notificações ativadas! 🎉', {
          body: 'Você receberá notificações de mensagens e atualizações importantes.',
          icon: '/logo192.png',
          badge: '/logo192.png',
          tag: 'welcome-notification'
        });
      }
      
      setShowModal(false);
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleDismiss = () => {
    // Marcar que já pediu permissão (mesmo se recusou)
    localStorage.setItem('hasAskedNotificationPermission', 'true');
    setShowModal(false);
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-fadeIn">
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 animate-slideUp">
        {/* Botão Fechar */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Ícone */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
            <Bell className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </div>
        </div>

        {/* Título */}
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white text-center mb-3">
          Ativar notificações?
        </h2>

        {/* Descrição */}
        <p className="text-gray-600 dark:text-gray-300 text-center mb-6 leading-relaxed">
          Receba notificações em tempo real sobre:
        </p>

        {/* Lista de benefícios */}
        <ul className="space-y-3 mb-8">
          <li className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-blue-600 dark:text-blue-400 text-sm">✓</span>
            </div>
            <span className="text-gray-700 dark:text-gray-300">Novas mensagens no chat</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-purple-600 dark:text-purple-400 text-sm">✓</span>
            </div>
            <span className="text-gray-700 dark:text-gray-300">Atualizações de tarefas</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-green-600 dark:text-green-400 text-sm">✓</span>
            </div>
            <span className="text-gray-700 dark:text-gray-300">Alertas importantes do sistema</span>
          </li>
        </ul>

        {/* Botões */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleDismiss}
            className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
          >
            Agora não
          </button>
          <button
            onClick={handleRequestPermission}
            disabled={isRequesting}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRequesting ? 'Solicitando...' : 'Permitir'}
          </button>
        </div>

        {/* Nota */}
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
          Você pode alterar essa configuração a qualquer momento nas configurações do navegador
        </p>
      </div>
    </div>
  );
};

export default NotificationPermissionModal;
