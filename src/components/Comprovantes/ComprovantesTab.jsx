import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, orderBy, limit, getDocs, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useAuth } from '../../hooks/useAuth';
import { 
  FileText, 
  Search, 
  Filter,
  Calendar,
  Download,
  Eye,
  Package,
  CheckCircle,
  ClipboardCheck,
  Star,
  ChevronDown
} from 'lucide-react';
import ComprovanteVisual from './ComprovanteVisual';
import { gerarComprovantePDF, compartilharComprovantePDF } from '../../utils/comprovanteUtils';
import { buscarTodosComprovantes } from '../../utils/comprovantesFirestore';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * ComprovantesTab - Aba dedicada para visualizar histórico de comprovantes
 * Agora conectada ao Firestore collection 'comprovantes'
 */
const ComprovantesTab = () => {
  const { usuario } = useAuth();
  const [comprovantes, setComprovantes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState('todos'); // todos, emprestimo, devolucao, tarefa, avaliacao
  const [filtroPeriodo, setFiltroPeriodo] = useState('mes'); // hoje, semana, mes, todos
  const [busca, setBusca] = useState('');
  const [comprovanteVisualizado, setComprovanteVisualizado] = useState(null);
  const [showFiltros, setShowFiltros] = useState(false);

  // Carregar comprovantes do Firebase em tempo real
  useEffect(() => {
    if (!usuario) return;

    setLoading(true);

    // Listener em tempo real na collection comprovantes
    const q = query(
      collection(db, 'comprovantes'),
      orderBy('dataCriacao', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const listaComprovantes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setComprovantes(listaComprovantes);
      setLoading(false);
    }, (error) => {
      console.error('Erro ao carregar comprovantes:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [usuario]);

  // Fallback: carregar de empréstimos antigos se collection comprovantes estiver vazia
  const carregarComprovantes = async () => {
    if (!usuario) return;

    setLoading(true);
    try {
      // Primeiro tentar buscar da collection comprovantes
      const comprovantesFirestore = await buscarTodosComprovantes(100);
      
      if (comprovantesFirestore.length > 0) {
        setComprovantes(comprovantesFirestore);
        setLoading(false);
        return;
      }

      // Se não houver na collection comprovantes, buscar dos empréstimos
      const listaComprovantes = [];

      // Carregar empréstimos e devoluções
      const emprestimosRef = collection(db, 'emprestimos');
      const emprestimosQuery = query(
        emprestimosRef,
        orderBy('dataEmprestimo', 'desc'),
        limit(100)
      );
      const emprestimosSnap = await getDocs(emprestimosQuery);
      
      emprestimosSnap.forEach(doc => {
        const data = doc.data();
        
        // Comprovante de empréstimo
        listaComprovantes.push({
          id: doc.id,
          tipo: 'emprestimo',
          data: data.dataEmprestimo,
          quantidade: data.ferramentas?.length || 0,
          de: data.nomeFuncionario || 'Almoxarifado',
          para: data.nomeFuncionario || 'Desconhecido',
          ferramentas: data.nomeFerramentas || [],
          transacaoId: doc.id.slice(0, 13).toUpperCase(),
          status: data.status
        });

        // Comprovante de devolução (se existir)
        if (data.status === 'devolvido' && data.dataDevolucao) {
          listaComprovantes.push({
            id: `${doc.id}-dev`,
            tipo: 'devolucao',
            data: data.dataDevolucao,
            quantidade: data.ferramentas?.length || 0,
            de: data.nomeFuncionario || 'Desconhecido',
            para: 'Almoxarifado',
            ferramentas: data.nomeFerramentas || [],
            transacaoId: doc.id.slice(0, 13).toUpperCase(),
            status: data.status
          });
        }
      });

      // Carregar tarefas concluídas
      const tarefasRef = collection(db, 'tarefas');
      const tarefasQuery = query(
        tarefasRef,
        where('status', '==', 'concluida'),
        orderBy('dataConclusao', 'desc'),
        limit(50)
      );
      const tarefasSnap = await getDocs(tarefasQuery);
      
      tarefasSnap.forEach(doc => {
        const data = doc.data();
        listaComprovantes.push({
          id: doc.id,
          tipo: 'tarefa',
          data: data.dataConclusao || data.dataCriacao,
          quantidade: 1,
          de: data.funcionario || 'Sistema',
          para: data.responsavel || 'Supervisor',
          descricao: data.titulo,
          transacaoId: doc.id.slice(0, 13).toUpperCase(),
          avaliacao: data.avaliacaoSupervisor || data.avaliacaoFuncionario
        });

        // Se tem avaliação, criar comprovante de avaliação
        if (data.avaliacaoSupervisor || data.avaliacaoFuncionario) {
          listaComprovantes.push({
            id: `${doc.id}-aval`,
            tipo: 'avaliacao',
            data: data.dataConclusao || data.dataCriacao,
            quantidade: data.avaliacaoSupervisor || data.avaliacaoFuncionario || 0,
            de: 'Supervisor',
            para: data.funcionario || 'Funcionário',
            descricao: data.titulo,
            comentario: data.comentarioSupervisor || data.comentarioFuncionario || '',
            transacaoId: doc.id.slice(0, 13).toUpperCase()
          });
        }
      });

      // Ordenar por data
      listaComprovantes.sort((a, b) => {
        const dataA = new Date(a.data);
        const dataB = new Date(b.data);
        return dataB - dataA;
      });

      setComprovantes(listaComprovantes);
    } catch (error) {
      console.error('Erro ao carregar comprovantes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar comprovantes
  const comprovantesFiltrados = useMemo(() => {
    return comprovantes.filter(comp => {
      // Filtro por tipo
      if (filtroTipo !== 'todos' && comp.tipo !== filtroTipo) return false;

      // Filtro por período
      if (filtroPeriodo !== 'todos') {
        const dataComp = new Date(comp.data);
        const hoje = new Date();
        
        if (filtroPeriodo === 'hoje') {
          if (dataComp.toDateString() !== hoje.toDateString()) return false;
        } else if (filtroPeriodo === 'semana') {
          const semanaAtras = new Date();
          semanaAtras.setDate(hoje.getDate() - 7);
          if (dataComp < semanaAtras) return false;
        } else if (filtroPeriodo === 'mes') {
          const mesAtras = new Date();
          mesAtras.setMonth(hoje.getMonth() - 1);
          if (dataComp < mesAtras) return false;
        }
      }

      // Filtro por busca (incluindo código de assinatura)
      if (busca) {
        const buscaLower = busca.toLowerCase();
        return (
          comp.de?.toLowerCase().includes(buscaLower) ||
          comp.para?.toLowerCase().includes(buscaLower) ||
          comp.descricao?.toLowerCase().includes(buscaLower) ||
          comp.transacaoId?.toLowerCase().includes(buscaLower) ||
          comp.codigoAssinatura?.toLowerCase().includes(buscaLower) ||
          comp.ferramentas?.some(f => f.toLowerCase().includes(buscaLower))
        );
      }

      return true;
    });
  }, [comprovantes, filtroTipo, filtroPeriodo, busca]);

  // Estatísticas
  const stats = useMemo(() => {
    return {
      total: comprovantesFiltrados.length,
      emprestimos: comprovantesFiltrados.filter(c => c.tipo === 'emprestimo').length,
      devolucoes: comprovantesFiltrados.filter(c => c.tipo === 'devolucao').length,
      tarefas: comprovantesFiltrados.filter(c => c.tipo === 'tarefa').length,
      avaliacoes: comprovantesFiltrados.filter(c => c.tipo === 'avaliacao').length
    };
  }, [comprovantesFiltrados]);

  // Handlers
  const handleVisualizarComprovante = (comprovante) => {
    setComprovanteVisualizado(comprovante);
  };

  const handleBaixarPDF = (comprovante) => {
    gerarComprovantePDF(comprovante.tipo, comprovante);
  };

  const handleCompartilhar = async (comprovante) => {
    await compartilharComprovantePDF(comprovante.tipo, comprovante);
  };

  // Ícone baseado no tipo
  const getIconeTipo = (tipo) => {
    switch (tipo) {
      case 'emprestimo':
        return <Package className="w-5 h-5 text-blue-500" />;
      case 'devolucao':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'tarefa':
        return <ClipboardCheck className="w-5 h-5 text-purple-500" />;
      case 'avaliacao':
        return <Star className="w-5 h-5 text-orange-500" />;
      default:
        return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Carregando comprovantes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 md:pb-0">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-700">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-blue-100 dark:bg-blue-800/50 rounded-xl">
            <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Comprovantes</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Histórico completo de transações e avaliações
            </p>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Total</span>
            <FileText className="w-5 h-5 text-gray-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-blue-200 dark:border-blue-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-blue-600 dark:text-blue-400">Empréstimos</span>
            <Package className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.emprestimos}</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-green-200 dark:border-green-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-green-600 dark:text-green-400">Devoluções</span>
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.devolucoes}</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-purple-200 dark:border-purple-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-purple-600 dark:text-purple-400">Tarefas</span>
            <ClipboardCheck className="w-5 h-5 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.tarefas}</div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-orange-200 dark:border-orange-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-orange-600 dark:text-orange-400">Avaliações</span>
            <Star className="w-5 h-5 text-orange-500" />
          </div>
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.avaliacoes}</div>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Busca */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome, código de assinatura, ID ou ferramenta..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {/* Botão Toggle Filtros */}
          <button
            onClick={() => setShowFiltros(!showFiltros)}
            className="flex items-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-colors font-medium text-gray-700 dark:text-gray-300"
          >
            <Filter className="w-5 h-5" />
            Filtros
            <ChevronDown className={`w-4 h-4 transition-transform ${showFiltros ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Painel de Filtros */}
        {showFiltros && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Filtro por Tipo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tipo de Comprovante
              </label>
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="todos">Todos os tipos</option>
                <option value="emprestimo">Empréstimos</option>
                <option value="devolucao">Devoluções</option>
                <option value="tarefa">Tarefas</option>
                <option value="avaliacao">Avaliações</option>
              </select>
            </div>

            {/* Filtro por Período */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Período
              </label>
              <select
                value={filtroPeriodo}
                onChange={(e) => setFiltroPeriodo(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="hoje">Hoje</option>
                <option value="semana">Últimos 7 dias</option>
                <option value="mes">Último mês</option>
                <option value="todos">Todos os períodos</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Lista de Comprovantes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {comprovantesFiltrados.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">
              Nenhum comprovante encontrado
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              {busca ? 'Tente ajustar sua busca' : 'Não há comprovantes para exibir'}
            </p>
          </div>
        ) : (
          comprovantesFiltrados.map(comprovante => (
            <div
              key={comprovante.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all border border-gray-200 dark:border-gray-700 overflow-hidden group"
            >
              {/* Header do Card */}
              <div className="p-4 bg-gradient-to-r from-gray-50 to-white dark:from-gray-700 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getIconeTipo(comprovante.tipo)}
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                      {comprovante.tipo}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {format(new Date(comprovante.data), 'dd/MM/yyyy', { locale: ptBR })}
                  </span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {comprovante.quantidade}
                  <span className="text-sm font-normal text-gray-600 dark:text-gray-400 ml-2">
                    {comprovante.tipo === 'tarefa' ? 'tarefa' : 
                     comprovante.tipo === 'avaliacao' ? 'estrelas' : 
                     comprovante.quantidade === 1 ? 'item' : 'itens'}
                  </span>
                </div>
              </div>

              {/* Corpo do Card */}
              <div className="p-4 space-y-3">
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">De</div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {comprovante.de}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Para</div>
                  <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {comprovante.para}
                  </div>
                </div>
                {comprovante.descricao && (
                  <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {comprovante.descricao}
                  </div>
                )}
                <div className="text-xs font-mono text-gray-400 dark:text-gray-500">
                  ID: {comprovante.transacaoId}
                </div>
              </div>

              {/* Footer com ações */}
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 flex gap-2">
                <button
                  onClick={() => handleVisualizarComprovante(comprovante)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  <Eye className="w-4 h-4" />
                  Ver
                </button>
                <button
                  onClick={() => handleBaixarPDF(comprovante)}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 rounded-lg transition-colors text-sm font-medium"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de Visualização do Comprovante */}
      {comprovanteVisualizado && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setComprovanteVisualizado(null)}
        >
          <div 
            className="max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <ComprovanteVisual
              tipo={comprovanteVisualizado.tipo}
              dados={comprovanteVisualizado}
              onDownload={() => handleBaixarPDF(comprovanteVisualizado)}
              onShare={() => handleCompartilhar(comprovanteVisualizado)}
            />
            <button
              onClick={() => setComprovanteVisualizado(null)}
              className="mt-4 w-full bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold py-3 rounded-xl transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(ComprovantesTab);
