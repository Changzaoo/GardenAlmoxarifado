import React, { useState, useEffect } from 'react';
import { useNotification } from '../components/NotificationProvider';
import { useAuth } from '../hooks/useAuth';
import { db } from '../firebaseConfig';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
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
  X,
  AlertTriangle,
  Clock,
  ChevronRight,
  Users
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
    case 'correction_start':
      return <Clock className="w-5 h-5 text-blue-500" />;
    case 'correction_complete':
      return <CheckCheck className="w-5 h-5 text-green-500" />;
    case 'correction_error':
      return <AlertCircle className="w-5 h-5 text-red-500" />;
    case 'correction':
      return <Users className="w-5 h-5 text-purple-500" />;
    default:
      return <Bell className="w-5 h-5 text-gray-500" />;
  }
};

const NotificationsPage = ({ onNavigate }) => {
  const { usuario } = useAuth();
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
  const [tarefas, setTarefas] = useState([]);

  // Buscar tarefas atribuídas ao funcionário
  useEffect(() => {
    if (!usuario?.id) {

      return;
    }

    const buscaPor = usuario.nome || usuario.id;

    const tarefasRef = collection(db, 'tarefas');
    
    // Buscar tarefas por NOME (tarefas antigas) e por ID (tarefas novas)
    // Vamos buscar por nome primeiro, que é como as tarefas antigas foram salvas
    const q = query(
      tarefasRef,
      where('funcionariosIds', 'array-contains', buscaPor)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {

      const tarefasData = snapshot.docs.map(doc => {
        const data = doc.data();

        return {
          id: doc.id,
          ...data
        };
      });
      
      // Ordenar por data de criação no cliente
      tarefasData.sort((a, b) => {
        const dateA = a.dataCriacao ? new Date(a.dataCriacao).getTime() : 0;
        const dateB = b.dataCriacao ? new Date(b.dataCriacao).getTime() : 0;
        return dateB - dateA; // Mais recentes primeiro
      });

      setTarefas(tarefasData);
    }, (error) => {
      console.error('NotificationsPage: Erro ao carregar tarefas:', error);
    });

    return () => unsubscribe();
  }, [usuario]);

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
    
    // Navegar para a página apropriada baseado no tipo
    if (onNavigate) {
      if (notif.tipo === 'tarefa') {
        onNavigate('tarefas');
      } else if (notif.tipo === 'emprestimo') {
        onNavigate('emprestimos');
      }
    }
  };

  const handleTarefaClick = (tarefa) => {
    // Navegar para a página de tarefas quando clicar em uma tarefa
    if (onNavigate) {
      onNavigate('tarefas');
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

        {/* Mensagem quando não há tarefas */}
        {(filter === 'todas' || filter === 'tarefa') && tarefas.length === 0 && (
          <div className="mb-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6 text-center">
            <ClipboardList className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400">
              Nenhuma tarefa atribuída a você ainda
            </p>
          </div>
        )}

        {/* Tarefas Atribuídas */}
        {(filter === 'todas' || filter === 'tarefa') && tarefas.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-3 px-2 flex items-center gap-2">
              <ClipboardList className="w-5 h-5" />
              Suas Tarefas ({tarefas.length})
            </h2>
            <div className="space-y-3">
              {tarefas.map((tarefa) => (
                <div
                  key={tarefa.id}
                  onClick={() => handleTarefaClick(tarefa)}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow hover:shadow-lg transition-all cursor-pointer border-l-4 border-blue-500 hover:scale-[1.01] group"
                  title="Clique para ir para Tarefas"
                >
                  <div className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Ícone da Tarefa */}
                      <div className="flex-shrink-0 p-3 rounded-full bg-blue-100 dark:bg-blue-900">
                        <ClipboardList className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                      </div>

                      {/* Conteúdo da Tarefa */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">
                              {tarefa.titulo}
                            </h3>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                tarefa.prioridade === 'alta' 
                                  ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                                  : tarefa.prioridade === 'media'
                                  ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
                                  : 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                              }`}>
                                {tarefa.prioridade === 'alta' ? '🔴 Alta' : tarefa.prioridade === 'media' ? '🟡 Média' : '🟢 Baixa'}
                              </span>
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                tarefa.status === 'concluida'
                                  ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                                  : tarefa.status === 'em_andamento'
                                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                              }`}>
                                {tarefa.status === 'concluida' ? '✅ Concluída' : tarefa.status === 'em_andamento' ? '🔄 Em Andamento' : '⏳ Pendente'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 whitespace-pre-wrap">
                          {tarefa.descricao}
                        </p>

                        {/* Funcionários Atribuídos */}
                        {tarefa.funcionarios && tarefa.funcionarios.length > 0 && (
                          <div className="mb-3 flex items-center gap-2 flex-wrap">
                            <Users className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            <div className="flex gap-1 flex-wrap">
                              {tarefa.funcionarios.map((func, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full border border-blue-200 dark:border-blue-800"
                                >
                                  {func.nome}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              <span>Criada {getTimeAgo(tarefa.dataCriacao)}</span>
                            </div>
                            {tarefa.criadoPor && (
                              <div className="flex items-center gap-1">
                                <span>por</span>
                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                  {tarefa.criadoPor.nome || 'Administrador'}
                                </span>
                              </div>
                            )}
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lista de Notificações */}
        <div className="space-y-3">
          {filteredNotifications.length === 0 && tarefas.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
              <Bell className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                {filter === 'todas' 
                  ? 'Nenhuma notificação ou tarefa ainda' 
                  : `Nenhuma notificação ${filter === 'nao-lidas' ? 'não lida' : `do tipo "${filter}"`}`
                }
              </p>
            </div>
          ) : filteredNotifications.length > 0 ? (
            <>
              <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-3 px-2 flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notificações ({filteredNotifications.length})
              </h2>
              {filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`bg-white dark:bg-gray-800 rounded-xl shadow hover:shadow-lg transition-all cursor-pointer overflow-hidden hover:scale-[1.01] group ${
                    !notif.lida ? 'border-l-4 border-blue-500' : ''
                  }`}
                  title={notif.tipo === 'tarefa' ? 'Clique para ir para Tarefas' : notif.tipo === 'emprestimo' ? 'Clique para ir para Empréstimos' : ''}
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
                        
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            {getTimeAgo(notif.timestamp)}
                          </p>
                          {(notif.tipo === 'tarefa' || notif.tipo === 'emprestimo') && (
                            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : null}
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
