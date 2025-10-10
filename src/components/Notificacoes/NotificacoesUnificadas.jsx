import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, updateDoc, doc, where, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useAuth } from '../../hooks/useAuth';
import { Bell, Check, CheckCheck, Trash2, Package2, MessageSquare, AlertCircle, Info, Clock, User } from 'lucide-react';

const NotificacoesUnificadas = () => {
  const [notificacoes, setNotificacoes] = useState([]);
  const [filtro, setFiltro] = useState('todas'); // todas, nao-lidas, lidas
  const [tipoFiltro, setTipoFiltro] = useState('todos'); // todos, lembrete_emprestimo, mensagem, etc
  const [loading, setLoading] = useState(true);
  const { usuario } = useAuth();

  useEffect(() => {
    if (!usuario) return;

    // Query para buscar notificações do usuário ou do sistema
    const notificacoesRef = collection(db, 'notificacoes');
    
    // Busca notificações direcionadas ao usuário ou notificações gerais
    const q = query(
      notificacoesRef,
      orderBy('dataCriacao', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        
        // Filtra por funcionário se a notificação for específica
        if (data.funcionarioId && data.funcionarioId !== usuario.id) {
          return;
        }
        
        notifs.push({
          id: doc.id,
          ...data
        });
      });
      
      setNotificacoes(notifs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [usuario]);

  const marcarComoLida = async (notifId) => {
    try {
      const notifRef = doc(db, 'notificacoes', notifId);
      await updateDoc(notifRef, {
        lida: true,
        dataLeitura: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  };

  const marcarTodasComoLidas = async () => {
    try {
      const naoLidas = notificacoes.filter(n => !n.lida);
      
      for (const notif of naoLidas) {
        const notifRef = doc(db, 'notificacoes', notif.id);
        await updateDoc(notifRef, {
          lida: true,
          dataLeitura: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  };

  const excluirNotificacao = async (notifId) => {
    try {
      const notifRef = doc(db, 'notificacoes', notifId);
      await deleteDoc(notifRef);
    } catch (error) {
      console.error('Erro ao excluir notificação:', error);
    }
  };

  const excluirTodasLidas = async () => {
    try {
      const lidas = notificacoes.filter(n => n.lida);
      
      for (const notif of lidas) {
        const notifRef = doc(db, 'notificacoes', notif.id);
        await deleteDoc(notifRef);
      }
    } catch (error) {
      console.error('Erro ao excluir notificações lidas:', error);
    }
  };

  const getIconePorTipo = (tipo) => {
    switch (tipo) {
      case 'lembrete_emprestimo':
        return <Bell className="w-5 h-5 text-orange-500" />;
      case 'mensagem':
        return <MessageSquare className="w-5 h-5 text-blue-500" />;
      case 'emprestimo':
        return <Package2 className="w-5 h-5 text-green-500" />;
      case 'devolucao':
        return <CheckCheck className="w-5 h-5 text-emerald-500" />;
      case 'alerta':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  const getCorPorTipo = (tipo) => {
    switch (tipo) {
      case 'lembrete_emprestimo':
        return 'border-l-orange-500 bg-orange-50 dark:bg-orange-900/10';
      case 'mensagem':
        return 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/10';
      case 'emprestimo':
        return 'border-l-green-500 bg-green-50 dark:bg-green-900/10';
      case 'devolucao':
        return 'border-l-emerald-500 bg-emerald-50 dark:bg-emerald-900/10';
      case 'alerta':
        return 'border-l-red-500 bg-red-50 dark:bg-red-900/10';
      default:
        return 'border-l-gray-500 bg-gray-50 dark:bg-gray-900/10';
    }
  };

  const notificacoesFiltradas = notificacoes.filter(notif => {
    if (filtro === 'nao-lidas' && notif.lida) return false;
    if (filtro === 'lidas' && !notif.lida) return false;
    if (tipoFiltro !== 'todos' && notif.tipo !== tipoFiltro) return false;
    return true;
  });

  const naoLidasCount = notificacoes.filter(n => !n.lida).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <Bell className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Notificações
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {naoLidasCount > 0 ? `${naoLidasCount} não lida${naoLidasCount !== 1 ? 's' : ''}` : 'Todas as notificações lidas'}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            {naoLidasCount > 0 && (
              <button
                onClick={marcarTodasComoLidas}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all text-sm font-semibold shadow-sm hover:shadow-md"
              >
                <CheckCheck className="w-4 h-4" />
                <span>Marcar Todas como Lidas</span>
              </button>
            )}
            
            {notificacoes.some(n => n.lida) && (
              <button
                onClick={excluirTodasLidas}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all text-sm font-semibold shadow-sm hover:shadow-md"
              >
                <Trash2 className="w-4 h-4" />
                <span>Limpar Lidas</span>
              </button>
            )}
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-3">
          <div className="flex gap-2">
            <button
              onClick={() => setFiltro('todas')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                filtro === 'todas'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Todas ({notificacoes.length})
            </button>
            <button
              onClick={() => setFiltro('nao-lidas')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                filtro === 'nao-lidas'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Não Lidas ({naoLidasCount})
            </button>
            <button
              onClick={() => setFiltro('lidas')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                filtro === 'lidas'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Lidas ({notificacoes.filter(n => n.lida).length})
            </button>
          </div>

          <select
            value={tipoFiltro}
            onChange={(e) => setTipoFiltro(e.target.value)}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="todos">Todos os Tipos</option>
            <option value="lembrete_emprestimo">Lembretes</option>
            <option value="mensagem">Mensagens</option>
            <option value="emprestimo">Empréstimos</option>
            <option value="devolucao">Devoluções</option>
            <option value="alerta">Alertas</option>
          </select>
        </div>
      </div>

      {/* Lista de Notificações */}
      <div className="space-y-3">
        {notificacoesFiltradas.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center border border-gray-200 dark:border-gray-700">
            <Bell className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              Nenhuma notificação encontrada
            </p>
          </div>
        ) : (
          notificacoesFiltradas.map((notif) => (
            <div
              key={notif.id}
              className={`bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all border-l-4 overflow-hidden ${
                getCorPorTipo(notif.tipo)
              } ${
                !notif.lida ? 'border-2 border-blue-200 dark:border-blue-800' : 'border border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="p-4">
                <div className="flex items-start gap-4">
                  {/* Ícone */}
                  <div className="flex-shrink-0 mt-1">
                    {getIconePorTipo(notif.tipo)}
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-base font-bold text-gray-900 dark:text-white">
                        {notif.titulo}
                      </h3>
                      {!notif.lida && (
                        <span className="flex-shrink-0 ml-2 w-2 h-2 bg-blue-600 rounded-full"></span>
                      )}
                    </div>

                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                      {notif.mensagem}
                    </p>

                    {/* Informações adicionais */}
                    {notif.ferramentas && notif.ferramentas.length > 0 && (
                      <div className="mb-3 p-3 bg-gray-100 dark:bg-gray-700/50 rounded-lg">
                        <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Ferramentas:</p>
                        <div className="flex flex-wrap gap-2">
                          {notif.ferramentas.map((ferr, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-white dark:bg-gray-800 rounded text-xs font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600"
                            >
                              {ferr}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Metadados */}
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-4">
                        {notif.remetenteNome && (
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span>{notif.remetenteNome}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            {new Date(notif.dataCriacao).toLocaleDateString('pt-BR')} às{' '}
                            {new Date(notif.dataCriacao).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Ações */}
                      <div className="flex items-center gap-2">
                        {!notif.lida && (
                          <button
                            onClick={() => marcarComoLida(notif.id)}
                            className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
                            title="Marcar como lida"
                          >
                            <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </button>
                        )}
                        <button
                          onClick={() => excluirNotificacao(notif.id)}
                          className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificacoesUnificadas;
