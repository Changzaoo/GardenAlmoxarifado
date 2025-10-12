import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Calendar,
  User,
  Code,
  MessageSquare,
  Trash2,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, where } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useAuth } from '../../hooks/useAuth';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { NIVEIS_PERMISSAO, isAdmin } from '../../constants/permissoes';

const ErrorReportsPage = () => {
  const { usuario } = useAuth();
  const [relatorios, setRelatorios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [busca, setBusca] = useState('');
  const [relatorioSelecionado, setRelatorioSelecionado] = useState(null);
  const [showDetalhes, setShowDetalhes] = useState(false);

  const isAdminUser = isAdmin(usuario?.nivel);

  // Carregar relatórios
  useEffect(() => {
    if (!usuario?.id) return;

    let q;
    if (isAdminUser) {
      // Admin vê todos os relatórios
      q = query(
        collection(db, 'errorReports'),
        orderBy('timestamp', 'desc')
      );
    } else {
      // Usuário normal vê apenas seus próprios relatórios
      q = query(
        collection(db, 'errorReports'),
        where('usuarioId', '==', usuario.id),
        orderBy('timestamp', 'desc')
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const relatoriosData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRelatorios(relatoriosData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [usuario?.id, isAdminUser]);

  // Filtrar relatórios
  const relatoriosFiltrados = relatorios.filter(relatorio => {
    const matchStatus = filtroStatus === 'todos' || relatorio.status === filtroStatus;
    const matchBusca = !busca || 
      relatorio.errorMessage?.toLowerCase().includes(busca.toLowerCase()) ||
      relatorio.usuarioNome?.toLowerCase().includes(busca.toLowerCase()) ||
      relatorio.errorCode?.toLowerCase().includes(busca.toLowerCase());
    
    return matchStatus && matchBusca;
  });

  // Atualizar status do relatório
  const atualizarStatus = async (id, novoStatus) => {
    try {
      const relatorioRef = doc(db, 'errorReports', id);
      await updateDoc(relatorioRef, {
        status: novoStatus,
        atualizadoEm: new Date().toISOString(),
        atualizadoPor: usuario.email
      });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  // Excluir relatório
  const excluirRelatorio = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este relatório?')) return;

    try {
      await deleteDoc(doc(db, 'errorReports', id));
    } catch (error) {
      console.error('Erro ao excluir relatório:', error);
    }
  };

  // Badge de status
  const StatusBadge = ({ status }) => {
    const configs = {
      pendente: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300', icon: Clock, label: 'Pendente' },
      analisando: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300', icon: RefreshCw, label: 'Analisando' },
      resolvido: { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300', icon: CheckCircle, label: 'Resolvido' },
      fechado: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300', icon: XCircle, label: 'Fechado' }
    };

    const config = configs[status] || configs.pendente;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  // Modal de detalhes
  const DetalhesModal = ({ relatorio, onClose }) => {
    if (!relatorio) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Detalhes do Erro
                </h2>
                <StatusBadge status={relatorio.status} />
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <XCircle className="w-6 h-6 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Info do usuário */}
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <User className="w-4 h-4" />
                Informações do Usuário
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Nome:</span>
                  <p className="text-gray-900 dark:text-white font-medium">{relatorio.usuarioNome}</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Email:</span>
                  <p className="text-gray-900 dark:text-white font-medium">{relatorio.usuarioEmail}</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Data:</span>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {format(new Date(relatorio.timestamp), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Código:</span>
                  <p className="text-gray-900 dark:text-white font-mono font-medium">{relatorio.errorCode}</p>
                </div>
              </div>
            </div>

            {/* Mensagem de erro */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Mensagem de Erro
              </h3>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4">
                <p className="text-sm text-red-800 dark:text-red-300 font-mono break-all">
                  {relatorio.errorMessage}
                </p>
              </div>
            </div>

            {/* Stack trace */}
            {relatorio.errorStack && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Code className="w-4 h-4" />
                  Stack Trace
                </h3>
                <div className="bg-gray-900 rounded-xl p-4 overflow-x-auto">
                  <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap break-all">
                    {relatorio.errorStack}
                  </pre>
                </div>
              </div>
            )}

            {/* Descrição do usuário */}
            {relatorio.descricao && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Descrição do Usuário
                </h3>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {relatorio.descricao}
                  </p>
                </div>
              </div>
            )}

            {/* Info técnica */}
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Informações Técnicas
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Navegador:</span>
                  <p className="text-gray-900 dark:text-white font-medium">{relatorio.browserInfo?.name || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Versão:</span>
                  <p className="text-gray-900 dark:text-white font-medium">{relatorio.browserInfo?.version || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">SO:</span>
                  <p className="text-gray-900 dark:text-white font-medium">{relatorio.browserInfo?.os || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">URL:</span>
                  <p className="text-gray-900 dark:text-white font-medium truncate">{relatorio.url || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer com ações */}
          {isAdminUser && (
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
              <button
                onClick={() => atualizarStatus(relatorio.id, 'analisando')}
                disabled={relatorio.status === 'analisando'}
                className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-lg font-medium transition-colors"
              >
                Marcar como Analisando
              </button>
              <button
                onClick={() => atualizarStatus(relatorio.id, 'resolvido')}
                disabled={relatorio.status === 'resolvido'}
                className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-lg font-medium transition-colors"
              >
                Marcar como Resolvido
              </button>
              <button
                onClick={() => excluirRelatorio(relatorio.id)}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-7 h-7 text-red-500" />
              Relatórios de Erros
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {isAdminUser ? 'Gerencie todos os relatórios de erro do sistema' : 'Seus relatórios de erro enviados'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              {relatoriosFiltrados.length}
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {relatoriosFiltrados.length === 1 ? 'relatório' : 'relatórios'}
            </span>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Busca */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por mensagem, usuário ou código..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filtro de status */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="todos">Todos</option>
              <option value="pendente">Pendente</option>
              <option value="analisando">Analisando</option>
              <option value="resolvido">Resolvido</option>
              <option value="fechado">Fechado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de relatórios */}
      {relatoriosFiltrados.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center border border-gray-200 dark:border-gray-700">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Nenhum erro encontrado
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {busca || filtroStatus !== 'todos' 
              ? 'Tente ajustar os filtros de busca'
              : 'Não há relatórios de erro no momento'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {relatoriosFiltrados.map((relatorio) => (
            <div
              key={relatorio.id}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => {
                setRelatorioSelecionado(relatorio);
                setShowDetalhes(true);
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <StatusBadge status={relatorio.status} />
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                      {relatorio.errorCode}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 truncate">
                    {relatorio.errorMessage}
                  </h3>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {relatorio.usuarioNome}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(relatorio.timestamp), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                </div>

                <ExternalLink className="w-5 h-5 text-gray-400 flex-shrink-0" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de detalhes */}
      {showDetalhes && (
        <DetalhesModal
          relatorio={relatorioSelecionado}
          onClose={() => {
            setShowDetalhes(false);
            setRelatorioSelecionado(null);
          }}
        />
      )}
    </div>
  );
};

export default ErrorReportsPage;
