import React, { useState } from 'react';
import { useNotification } from '../components/NotificationProvider';
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  ClipboardList, 
  Package,
  AlertCircle,
  Volume2,
  VolumeX,
  Filter,
  X
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const NotificationIcon = ({ tipo }) => {
  switch (tipo) {
    case 'tarefa':
      return <ClipboardList className="w-5 h-5 text-blue-500" />;
    case 'emprestimo':
      return <Package className="w-5 h-5 text-green-500" />;
    case 'ferramenta':
      return <Package className="w-5 h-5 text-orange-500" />;
    default:
      return <Bell className="w-5 h-5 text-gray-500" />;
  }
};

const NotificationsPage = () => {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead,
    soundEnabled,
    toggleSound
  } = useNotification();
  
  const [filter, setFilter] = useState('todas'); // 'todas', 'nao-lidas', 'tarefa', 'emprestimo'
  const [showFilters, setShowFilters] = useState(false);

  const getTimeAgo = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      const date = timestamp?.toDate?.() || new Date(timestamp);
      return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
    } catch (error) {
      return '';
    }
  };

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'nao-lidas') return !notif.lida;
    if (filter === 'tarefa') return notif.tipo === 'tarefa';
    if (filter === 'emprestimo') return notif.tipo === 'emprestimo';
    return true;
  });

  const handleNotificationClick = (notif) => {
    if (!notif.lida) {
      markAsRead(notif.id);
    }
  };

  const getTipoLabel = (tipo) => {
    switch (tipo) {
      case 'tarefa':
        return 'Tarefa';
      case 'emprestimo':
        return 'Empréstimo';
      case 'ferramenta':
        return 'Ferramenta';
      default:
        return 'Notificação';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                <Bell className="w-6 h-6 text-blue-600 dark:text-blue-300" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                  Notificações
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {unreadCount > 0 ? `${unreadCount} não lida${unreadCount > 1 ? 's' : ''}` : 'Nenhuma notificação não lida'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Botão de Som */}
              <button
                onClick={toggleSound}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title={soundEnabled ? 'Desativar som' : 'Ativar som'}
              >
                {soundEnabled ? (
                  <Volume2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                ) : (
                  <VolumeX className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                )}
              </button>

              {/* Botão de Filtro */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Filtros"
              >
                <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>

              {/* Marcar todas como lidas */}
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span className="hidden sm:inline">Marcar todas como lidas</span>
                </button>
              )}
            </div>
          </div>

          {/* Filtros */}
          {showFilters && (
            <div className="flex flex-wrap gap-2 pt-4 border-t dark:border-gray-700">
              {[
                { value: 'todas', label: 'Todas' },
                { value: 'nao-lidas', label: 'Não lidas' },
                { value: 'tarefa', label: 'Tarefas' },
                { value: 'emprestimo', label: 'Empréstimos' }
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setFilter(value)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    filter === value
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Lista de Notificações */}
        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
              <Bell className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                {filter === 'todas' 
                  ? 'Nenhuma notificação ainda' 
                  : `Nenhuma notificação ${filter === 'nao-lidas' ? 'não lida' : `do tipo "${filter}"`}`
                }
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-all cursor-pointer overflow-hidden ${
                  !notif.lida ? 'border-l-4 border-blue-500' : ''
                }`}
              >
                <div className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Ícone */}
                    <div className={`flex-shrink-0 p-3 rounded-full ${
                      !notif.lida 
                        ? 'bg-blue-100 dark:bg-blue-900' 
                        : 'bg-gray-100 dark:bg-gray-700'
                    }`}>
                      <NotificationIcon tipo={notif.tipo} />
                    </div>

                    {/* Conteúdo */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <h3 className={`font-semibold ${
                            !notif.lida 
                              ? 'text-gray-900 dark:text-white' 
                              : 'text-gray-600 dark:text-gray-400'
                          }`}>
                            {notif.titulo}
                          </h3>
                          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                            {getTipoLabel(notif.tipo)}
                          </span>
                        </div>
                        
                        {!notif.lida && (
                          <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {notif.mensagem}
                      </p>
                      
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        {getTimeAgo(notif.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Info sobre notificações */}
        {notifications.length > 0 && (
          <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800 dark:text-blue-300">
                <p className="font-medium mb-1">Sobre as notificações</p>
                <ul className="space-y-1 text-blue-700 dark:text-blue-400">
                  <li>• Você receberá notificações quando novas tarefas forem atribuídas a você</li>
                  <li>• Notificações também serão enviadas quando ferramentas forem emprestadas em seu nome</li>
                  <li>• Use os filtros para organizar as notificações por tipo</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
