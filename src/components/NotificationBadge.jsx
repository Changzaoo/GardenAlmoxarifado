import React, { useState } from 'react';
import { Bell, Archive, MessageCircle, Tool, FileText, ArrowLeftRight } from 'lucide-react';
import { useNotification } from './NotificationProvider';

const NotificationIcon = ({ tipo }) => {
  switch (tipo) {
    case 'legal':
      return <FileText className="w-5 h-5 text-blue-400" />;
    case 'tarefa':
      return <Archive className="w-5 h-5 text-yellow-400" />;
    case 'mensagem':
      return <MessageCircle className="w-5 h-5 text-green-400" />;
    case 'estoque':
      return <Tool className="w-5 h-5 text-red-400" />;
    case 'transferencia':
      return <ArrowLeftRight className="w-5 h-5 text-purple-400" />;
    default:
      return <Bell className="w-5 h-5 text-gray-400" />;
  }
};

export const NotificationBadge = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotification();

  const getTimeAgo = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp?.toDate?.() || new Date(timestamp);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'agora';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m atrás`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h atrás`;
    return `${Math.floor(seconds / 86400)}d atrás`;
  };

  return (
    <div className="relative">
      {/* Botão da notificação */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-gray-700 dark:hover:text-white focus:outline-none focus:text-white"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-gray-900 dark:text-white bg-red-500 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown de notificações */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-700 rounded-lg shadow-lg z-50 border border-gray-300 dark:border-gray-600 overflow-hidden">
          <div className="p-4 border-b border-gray-300 dark:border-gray-600 flex justify-between items-center">
            <h3 className="text-lg font-medium text-white">Notificações</h3>
            <div className="flex space-x-4">
              {notifications.length > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-500 dark:text-[#1D9BF0] hover:text-blue-600 dark:hover:text-[#1a8cd8]"
                >
                  Marcar todas como lidas
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-sm text-gray-400 hover:text-white"
              >
                Fechar
              </button>
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-400">
                Nenhuma notificação
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-300 dark:border-gray-600 hover:bg-white dark:bg-gray-800 transition-colors cursor-pointer ${
                    !notification.lida ? 'bg-white dark:bg-gray-800' : ''
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      <NotificationIcon tipo={notification.tipo} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">
                        {notification.titulo}
                      </p>
                      <p className="text-sm text-gray-400">
                        {notification.mensagem}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {getTimeAgo(notification.data)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBadge;



