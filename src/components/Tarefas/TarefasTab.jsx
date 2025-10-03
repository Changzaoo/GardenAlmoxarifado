import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, orderBy, onSnapshot, updateDoc, doc, deleteDoc, addDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useAuth } from '../../hooks/useAuth';
import { 
  Plus, Star, PauseCircle, PlayCircle, CheckCircle, Clock, CircleDotDashed, 
  Pause, Loader, Trash2, Calendar, User, AlertCircle, Search, Shield, CalendarDays 
} from 'lucide-react';
import { useToast } from '../ToastProvider';
import CriarTarefa from './CriarTarefa';
import DetalheTarefa from './DetalheTarefa';
import AvaliacaoTarefaModal from './AvaliacaoTarefaModal';
import AtribuirTarefaSemanal from './AtribuirTarefaSemanal';
import ConfirmDialog from '../common/ConfirmDialog';
import { formatarDataHora } from '../../utils/dateUtils';
import { useSectorPermissions } from '../../hooks/useSectorPermissions';
import { PermissionChecker } from '../../constants/permissoes';

const NIVEIS_PERMISSAO = {
  FUNCIONARIO: 1,
  SUPERVISOR: 2,
  ADMIN: 3
};

const TarefasTab = ({ 
  funcionarios = [], 
  showOnlyUserTasks = false, 
  showAddButton = true, 
  userFilter = null, 
  readOnly = false,
  defaultFiltros = null
}) => {
  const { usuario } = useAuth();
  const { showToast } = useToast();
  const [tarefas, setTarefas] = useState([]);
  const [showCriarTarefa, setShowCriarTarefa] = useState(false);
  const [showAtribuirSemanal, setShowAtribuirSemanal] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState(defaultFiltros?.status || 'todas');
  const [filtroPeriodo, setFiltroPeriodo] = useState(defaultFiltros?.periodo || 'todos');
  const [filtroAvaliacao, setFiltroAvaliacao] = useState(defaultFiltros?.avaliacao || 'todas');
  const [tarefaSelecionada, setTarefaSelecionada] = useState(null);
  const [temposDecorridos, setTemposDecorridos] = useState({});
  const [showAvaliacaoModal, setShowAvaliacaoModal] = useState(false);
  const [tarefaParaAvaliacao, setTarefaParaAvaliacao] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [quantidadeExibida, setQuantidadeExibida] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const q = query(
      collection(db, 'tarefas'),
      orderBy('dataCriacao', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tarefasData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTarefas(tarefasData);
      
      const temposIniciais = {};
      tarefasData.forEach(tarefa => {
        if (tarefa.status === 'em_andamento' && tarefa.dataInicio) {
          const inicioData = new Date(tarefa.dataInicio);
          let tempo = new Date() - inicioData;
          if (tarefa.tempoPausado) {
            tempo -= tarefa.tempoPausado;
          }
          temposIniciais[tarefa.id] = tempo;
        }
      });
      setTemposDecorridos(temposIniciais);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTemposDecorridos(prevTempos => {
        const novosTempos = { ...prevTempos };
        tarefas.forEach(tarefa => {
          if (tarefa.status === 'em_andamento' && tarefa.dataInicio) {
            const inicioData = new Date(tarefa.dataInicio);
            let tempo = new Date() - inicioData;
            if (tarefa.tempoPausado) {
              tempo -= tarefa.tempoPausado;
            }
            novosTempos[tarefa.id] = tempo;
          }
        });
        return novosTempos;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [tarefas]);

  const calcularTempoTotal = (tarefa) => {
    if (!tarefa.dataInicio) return 0;
    
    const dataInicio = new Date(tarefa.dataInicio);
    const dataFim = new Date();
    let tempoTotal = dataFim - dataInicio;
    
    if (tarefa.tempoPausado) {
      tempoTotal -= tarefa.tempoPausado;
    }
    
    return tempoTotal;
  };

  const handleIniciarTarefa = async (tarefaId) => {
    try {
      await updateDoc(doc(db, 'tarefas', tarefaId), {
        status: 'em_andamento',
        dataInicio: new Date().toISOString()
      });
      showToast('Tarefa iniciada com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao iniciar tarefa:', error);
      showToast('Erro ao iniciar tarefa', 'error');
    }
  };

  const handlePausarTarefa = async (tarefaId) => {
    try {
      const tarefa = tarefas.find(t => t.id === tarefaId);
      const tempoPausadoAnterior = tarefa.tempoPausado || 0;
      const tempoPausaAtual = new Date() - new Date(tarefa.dataInicio);
      
      await updateDoc(doc(db, 'tarefas', tarefaId), {
        status: 'pausada',
        dataPausa: new Date().toISOString(),
        tempoPausado: tempoPausadoAnterior + tempoPausaAtual
      });
      showToast('Tarefa pausada com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao pausar tarefa:', error);
      showToast('Erro ao pausar tarefa', 'error');
    }
  };

  const handleConcluirTarefa = async () => {
    if (!tarefaParaAvaliacao) return;
    
    try {
      const tarefaRef = doc(db, 'tarefas', tarefaParaAvaliacao.id);
      const tempoTotal = calcularTempoTotal(tarefaParaAvaliacao);

      // Primeiro atualizamos o status da tarefa
      await updateDoc(tarefaRef, {
        status: 'concluida',
        dataConclusao: new Date().toISOString(),
        tempoTotal
      });

      // Se o usuário é funcionário, mostramos o modal de autoavaliação
      if (usuario?.nivel === NIVEIS_PERMISSAO.FUNCIONARIO) {
        setShowAvaliacaoModal(true);
      }
      // Se for supervisor ou admin, mostramos o modal de avaliação
      else if (usuario?.nivel >= NIVEIS_PERMISSAO.SUPERVISOR) {
        setShowAvaliacaoModal(true);
      }

      showToast('Tarefa concluída com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao concluir tarefa:', error);
      showToast('Erro ao concluir tarefa', 'error');
      setTarefaParaAvaliacao(null);
    }
  };

  const handleAvaliacaoSubmit = async (avaliacao, comentario) => {
    if (!tarefaParaAvaliacao) return;

    try {
      const tarefaRef = doc(db, 'tarefas', tarefaParaAvaliacao.id);
      const updateData = {};

      if (usuario.nivel === NIVEIS_PERMISSAO.FUNCIONARIO) {
        updateData.avaliacaoFuncionario = avaliacao;
        updateData.comentarioFuncionario = comentario;
      } else if (usuario.nivel >= NIVEIS_PERMISSAO.SUPERVISOR) {
        updateData.avaliacaoSupervisor = avaliacao;
        updateData.comentarioSupervisor = comentario;
      }

      await updateDoc(tarefaRef, updateData);
      showToast('Avaliação registrada com sucesso!', 'success');
      
      if (usuario.nivel === NIVEIS_PERMISSAO.FUNCIONARIO) {
        setShowAvaliacaoModal(false);
      }
      
      setTarefaParaAvaliacao(null);
      setTarefaSelecionada(null);
    } catch (error) {
      console.error('Erro ao registrar avaliação:', error);
      showToast('Erro ao registrar avaliação', 'error');
    }
  };

  const formatarTempo = (ms) => {
    if (!ms) return '-';
    const segundos = Math.floor(ms / 1000);
    const minutos = Math.floor(segundos / 60);
    const horas = Math.floor(minutos / 60);
    
    if (horas > 0) {
      return `${horas}h ${minutos % 60}m`;
    } else if (minutos > 0) {
      return `${minutos}m ${segundos % 60}s`;
    }
    return `${segundos}s`;
  };

  const isUserAssigned = (tarefa) => {
    if (!usuario) return false;
    
    const usuarioNome = usuario?.nome?.toLowerCase();
    const usuarioId = usuario?.id;
    const usuarioEmail = usuario?.email?.toLowerCase();
    
    // Função helper melhorada - match por ID, nome ou email
    const matchUser = (value) => {
      if (!value) return false;
      const valueLower = String(value).toLowerCase();
      
      // Match exato por ID
      if (valueLower === usuarioId) return true;
      
      // Match por nome (exato ou parcial)
      if (usuarioNome && valueLower === usuarioNome) return true;
      if (usuarioNome && valueLower.includes(usuarioNome)) return true;
      if (usuarioNome && usuarioNome.includes(valueLower)) return true;
      
      // Match por email
      if (usuarioEmail && valueLower === usuarioEmail) return true;
      
      return false;
    };
    
    // Se tem filtro de usuário específico
    if (userFilter) {
      const filterLower = userFilter.toLowerCase();
      const matchFilter = (value) => {
        if (!value) return false;
        return String(value).toLowerCase().includes(filterLower);
      };
      
      return matchFilter(tarefa.funcionario) || 
             matchFilter(tarefa.responsavel) ||
             tarefa.funcionariosIds?.some(matchFilter);
    }
    
    // Verificar array de funcionáriosIds (pode conter IDs ou nomes)
    const estaNosIds = tarefa.funcionariosIds?.some(matchUser);
    
    // Verificar campos legados (funcionario e responsavel)
    const ehResponsavel = matchUser(tarefa.responsavel);
    const ehFuncionario = matchUser(tarefa.funcionario);
    
    const resultado = estaNosIds || ehResponsavel || ehFuncionario;
    
    // Debug apenas se não encontrou match
    if (!resultado && showOnlyUserTasks) {
      console.log('❌ Tarefa NÃO atribuída ao usuário:', {
        tarefaTitulo: tarefa.titulo,
        funcionariosIds: tarefa.funcionariosIds,
        funcionario: tarefa.funcionario,
        responsavel: tarefa.responsavel,
        usuarioId,
        usuarioNome,
        usuarioEmail
      });
    }
    
    return resultado;
  };

  const getStatusInfo = (tarefa) => {
    switch(tarefa.status) {
      case 'pendente':
        return {
          icon: <Clock className="w-3 h-3 mr-1" />,
          text: 'Pendente',
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800'
        };
      case 'em_andamento':
        return {
          icon: <PlayCircle className="w-3 h-3 mr-1" />,
          text: 'Em Andamento',
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-800'
        };
      case 'pausada':
        return {
          icon: <PauseCircle className="w-3 h-3 mr-1" />,
          text: 'Pausada',
          bgColor: 'bg-orange-100',
          textColor: 'text-orange-800'
        };
      case 'concluida':
        return {
          icon: <CheckCircle className="w-3 h-3 mr-1" />,
          text: 'Concluída',
          bgColor: 'bg-green-100',
          textColor: 'text-green-800'
        };
      default:
        return {
          icon: <AlertCircle className="w-3 h-3 mr-1" />,
          text: 'Status Desconhecido',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800'
        };
    }
  };

  const isWithinPeriod = (date, period) => {
    if (!date) return false;
    const taskDate = new Date(date);
    const today = new Date();
    
    switch (period) {
      case 'hoje':
        return taskDate.getDate() === today.getDate() &&
               taskDate.getMonth() === today.getMonth() &&
               taskDate.getFullYear() === today.getFullYear();
      case 'semana':
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        return taskDate >= weekAgo;
      case 'mes':
        const monthAgo = new Date(today);
        monthAgo.setMonth(today.getMonth() - 1);
        return taskDate >= monthAgo;
      default:
        return true;
    }
  };

  // Hook de permissões por setor
  const { canViewAllSectors } = useSectorPermissions();
  const isAdmin = canViewAllSectors;

  // Filtrar tarefas por setor (se não for admin)
  const tarefasPorSetor = useMemo(() => {
    if (isAdmin) {
      return tarefas; // Admin vê todas as tarefas
    }
    
    // Filtrar tarefas onde o setorId corresponde ao setor do usuário
    return PermissionChecker.filterBySector(tarefas, usuario);
  }, [tarefas, usuario, isAdmin]);

  const tarefasFiltradas = tarefasPorSetor
    .filter(tarefa => {
      // Filtro de usuário
      if (showOnlyUserTasks && !isUserAssigned(tarefa)) return false;
      
      // Filtro de status
      if (filtroStatus !== 'todas' && tarefa.status !== filtroStatus) return false;
      
      // Filtro de período (baseado na data de criação)
      if (filtroPeriodo !== 'todos' && !isWithinPeriod(tarefa.dataCriacao, filtroPeriodo)) return false;
      
      // Filtro de avaliação
      if (filtroAvaliacao !== 'todas') {
        const avaliacaoSupervisor = Number(tarefa.avaliacaoSupervisor);
        switch (filtroAvaliacao) {
          case 'excelente':
            if (avaliacaoSupervisor < 5) return false;
            break;
          case 'boa':
            if (avaliacaoSupervisor < 4 || avaliacaoSupervisor >= 5) return false;
            break;
          case 'regular':
            if (avaliacaoSupervisor < 3 || avaliacaoSupervisor >= 4) return false;
            break;
          case 'ruim':
            if (avaliacaoSupervisor >= 3) return false;
            break;
          case 'pendente':
            if (tarefa.status === 'concluida' && avaliacaoSupervisor) return false;
            break;
        }
      }
      
      // Filtro de pesquisa
      if (searchTerm) {
        const termLower = searchTerm.toLowerCase();
        return tarefa.titulo.toLowerCase().includes(termLower) ||
               tarefa.descricao?.toLowerCase().includes(termLower) ||
               tarefa.funcionario?.toLowerCase().includes(termLower);
      }
      
      return true;
    })
    .slice(0, quantidadeExibida);

  return (
    <div className="space-y-6">
      {/* Badge informativo para não-admins */}
      {!isAdmin && usuario?.setor && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <p className="text-sm text-blue-800 dark:text-blue-300">
            <strong>Visualização por setor:</strong> Você está vendo apenas as tarefas do setor <strong>{usuario.setor}</strong>.
          </p>
        </div>
      )}

      {/* Barra de Filtros */}
      <div className="bg-white dark:bg-[#1E2732] rounded-lg shadow-md border border-gray-200 dark:border-gray-600 p-4">
        <div className="flex flex-wrap gap-4">
          {/* Busca */}
          <div className="relative flex-1 min-w-[250px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar tarefas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#1D9BF0] dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Filtros */}
          <div className="grid grid-cols-3 gap-4 w-full">
            {/* Status */}
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#1D9BF0] dark:bg-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-[#2C3640]"
            >
              <option value="todas">Todos os status</option>
              <option value="pendente">Pendentes</option>
              <option value="em_andamento">Em andamento</option>
              <option value="pausada">Pausadas</option>
              <option value="concluida">Concluídas</option>
            </select>

            {/* Período */}
            <select
              value={filtroPeriodo}
              onChange={(e) => setFiltroPeriodo(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#1D9BF0] dark:bg-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-[#2C3640]"
            >
              <option value="todos">Todos os períodos</option>
              <option value="hoje">Hoje</option>
              <option value="semana">Últimos 7 dias</option>
              <option value="mes">Último mês</option>
            </select>

            {/* Avaliação */}
            <select
              value={filtroAvaliacao}
              onChange={(e) => setFiltroAvaliacao(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#1D9BF0] dark:bg-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-[#2C3640]"
            >
              <option value="todas">Todas as avaliações</option>
              <option value="excelente">Excelente (5★)</option>
              <option value="boa">Boa (4★)</option>
              <option value="regular">Regular (3★)</option>
              <option value="ruim">Ruim (≤ 2★)</option>
              <option value="pendente">Pendente de avaliação</option>
            </select>

            {/* Botões de Ação */}
            {showAddButton && usuario.nivel >= NIVEIS_PERMISSAO.SUPERVISOR && (
              <>
                <button
                  onClick={() => setShowAtribuirSemanal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-600 dark:to-purple-700 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 dark:hover:from-indigo-700 dark:hover:to-purple-800 transition-all shadow-md hover:shadow-lg"
                >
                  <CalendarDays className="w-4 h-4" /> Tarefa Semanal
                </button>
                <button
                  onClick={() => setShowCriarTarefa(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 dark:bg-[#1D9BF0] text-white rounded-lg hover:bg-blue-600 dark:hover:bg-[#1a8cd8] transition-colors shadow-md hover:shadow-lg"
                >
                  <Plus className="w-4 h-4" /> Nova Tarefa
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal dos Cards */}
      <div className="bg-gray-100 dark:bg-[#15202B] rounded-lg shadow-md border border-gray-200 dark:border-gray-600 p-6">
        {tarefasFiltradas.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center border border-gray-300 dark:border-gray-600">
            <Clock className="w-12 h-12 text-gray-500 dark:text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">{
              searchTerm
                ? 'Nenhuma tarefa encontrada para esta busca'
                : userFilter
                  ? `Nenhuma tarefa encontrada para ${userFilter}`
                  : 'Nenhuma tarefa encontrada'
            }</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tarefasFiltradas.map(tarefa => {
              const statusInfo = getStatusInfo(tarefa);
              const prioridadeColors = {
                alta: 'from-red-500 to-pink-600',
                média: 'from-yellow-500 to-orange-600',
                baixa: 'from-green-500 to-teal-600'
              };
              const statusColors = {
                pendente: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
                em_andamento: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
                pausada: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300',
                concluida: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
              };
              
              return (
              <div
                key={tarefa.id}
                className="group relative bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer border border-gray-200 dark:border-gray-700"
                onClick={() => setTarefaSelecionada(tarefa)}
              >
                {/* Barra de prioridade no topo */}
                <div className={`h-2 bg-gradient-to-r ${prioridadeColors[tarefa.prioridade || 'baixa']}`} />
                
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {tarefa.titulo}
                        </h3>
                      </div>
                      
                      {/* Badge de Status */}
                      <div className="flex items-center gap-2 flex-wrap mb-3">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${statusColors[tarefa.status]}`}>
                          {statusInfo.icon}
                          {statusInfo.text}
                        </span>
                        
                        {!readOnly && tarefa.status === 'em_andamento' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 dark:bg-[#1D9BF0] text-white rounded-full text-xs font-semibold animate-pulse">
                            <Clock className="w-3 h-3" />
                            {formatarTempo(temposDecorridos[tarefa.id])}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {tarefa.descricao && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
                        {tarefa.descricao}
                      </p>
                    </div>
                  )}

                  {/* Funcionários Atribuídos */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Atribuído para
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(tarefa.funcionarios && tarefa.funcionarios.length > 0) ? (
                        tarefa.funcionarios.map((func, idx) => (
                          <div 
                            key={idx}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-200 dark:border-blue-700 rounded-full text-sm font-medium text-blue-700 dark:text-blue-300 hover:shadow-md transition-shadow"
                          >
                            <div className="w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400 animate-pulse" />
                            {func.nome || func.username || func.email || 'Sem nome'}
                          </div>
                        ))
                      ) : (
                        (tarefa.funcionariosIds || []).map((funcId, idx) => {
                          const funcionarioEncontrado = funcionarios.find(f => f.id === funcId);
                          const nomeFuncionario = funcionarioEncontrado 
                            ? (funcionarioEncontrado.nome || funcionarioEncontrado.username || funcionarioEncontrado.email || 'Sem nome')
                            : funcId;
                          
                          return (
                            <div 
                              key={idx}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-200 dark:border-blue-700 rounded-full text-sm font-medium text-blue-700 dark:text-blue-300 hover:shadow-md transition-shadow"
                            >
                              <div className="w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400 animate-pulse" />
                              {nomeFuncionario}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Badge de Prioridade */}
                  {tarefa.prioridade && (
                    <div className="flex items-center gap-2 mb-4">
                      <AlertCircle className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide ${
                        tarefa.prioridade === 'alta' 
                          ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300' 
                          : tarefa.prioridade === 'média' 
                          ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300' 
                          : 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
                      }`}>
                        {tarefa.prioridade === 'alta' ? '🔥 Alta' : tarefa.prioridade === 'média' ? '⚡ Média' : '✓ Baixa'}
                      </span>
                    </div>
                  )}

                  {/* Avaliações */}
                  {tarefa.status === 'concluida' && (
                    <div className="space-y-2 mb-4 p-3 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                      {tarefa.avaliacaoSupervisor && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">👔 Supervisor:</span>
                          <div className="flex items-center gap-0.5">
                            {[...Array(5)].map((_, index) => (
                              <Star
                                key={index}
                                className={`w-4 h-4 transition-transform hover:scale-110 ${
                                  index < tarefa.avaliacaoSupervisor
                                    ? 'text-yellow-500 fill-yellow-500'
                                    : 'text-gray-300 dark:text-gray-600'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                      {tarefa.avaliacaoFuncionario && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">👤 Funcionário:</span>
                          <div className="flex items-center gap-0.5">
                            {[...Array(5)].map((_, index) => (
                              <Star
                                key={index}
                                className={`w-4 h-4 transition-transform hover:scale-110 ${
                                  index < tarefa.avaliacaoFuncionario
                                    ? 'text-yellow-500 fill-yellow-500'
                                    : 'text-gray-300 dark:text-gray-600'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Data de Criação */}
                  <div className="mb-4 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formatarDataHora(tarefa.dataCriacao)}</span>
                  </div>

                  {/* Ações */}
                  {!readOnly && (
                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
                      {tarefa.status === 'pendente' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleIniciarTarefa(tarefa.id);
                          }}
                          className="flex-1 px-4 py-2.5 text-sm font-semibold bg-gradient-to-r from-blue-500 to-blue-600 dark:from-[#1D9BF0] dark:to-[#1a8cd8] text-white rounded-xl flex items-center justify-center gap-2 hover:shadow-lg hover:scale-105 transition-all duration-200"
                        >
                          <PlayCircle className="w-4 h-4" />
                          Iniciar Tarefa
                        </button>
                      )}

                      {tarefa.status === 'em_andamento' && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePausarTarefa(tarefa.id);
                            }}
                            className="flex-1 px-3 py-2.5 text-sm font-semibold bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl flex items-center justify-center gap-2 hover:shadow-lg hover:scale-105 transition-all duration-200"
                          >
                            <Pause className="w-4 h-4" />
                            Pausar
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setTarefaParaAvaliacao(tarefa);
                              handleConcluirTarefa();
                            }}
                            className="flex-1 px-3 py-2.5 text-sm font-semibold bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl flex items-center justify-center gap-2 hover:shadow-lg hover:scale-105 transition-all duration-200"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Concluir
                          </button>
                        </>
                      )}

                      {tarefa.status === 'pausada' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleIniciarTarefa(tarefa.id);
                          }}
                          className="flex-1 px-4 py-2.5 text-sm font-semibold bg-gradient-to-r from-blue-500 to-blue-600 dark:from-[#1D9BF0] dark:to-[#1a8cd8] text-white rounded-xl flex items-center justify-center gap-2 hover:shadow-lg hover:scale-105 transition-all duration-200"
                        >
                          <PlayCircle className="w-4 h-4" />
                          Retomar
                        </button>
                      )}

                      {tarefa.status === 'concluida' && !tarefa.avaliacaoSupervisor && usuario?.nivel >= 2 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setTarefaParaAvaliacao(tarefa);
                            setShowAvaliacaoModal(true);
                          }}
                          className="flex-1 px-4 py-2.5 text-sm font-semibold bg-gradient-to-r from-yellow-500 to-amber-600 text-white rounded-xl flex items-center justify-center gap-2 hover:shadow-lg hover:scale-105 transition-all duration-200"
                        >
                          <Star className="w-4 h-4" />
                          Avaliar Tarefa
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          </div>
        )}
      </div>

      {quantidadeExibida < tarefas.length && (
        <div className="flex justify-center mt-6">
          <button
            onClick={() => setQuantidadeExibida(prev => prev + 10)}
            className="px-4 py-2 text-blue-500 dark:text-[#1D9BF0] hover:bg-blue-500 dark:bg-[#1D9BF0]/10 rounded-lg transition-colors"
          >
            Carregar mais
          </button>
        </div>
      )}

      {showCriarTarefa && (
        <CriarTarefa
          onClose={() => setShowCriarTarefa(false)}
          funcionarios={funcionarios}
        />
      )}

      {showAtribuirSemanal && (
        <AtribuirTarefaSemanal
          onClose={() => setShowAtribuirSemanal(false)}
          funcionarios={funcionarios}
        />
      )}

      {tarefaSelecionada && (
        <DetalheTarefa
          tarefa={tarefaSelecionada}
          onClose={() => setTarefaSelecionada(null)}
          tempoDecorrido={temposDecorridos[tarefaSelecionada.id]}
          onConcluir={
            !readOnly 
              ? () => {
                  setTarefaParaAvaliacao(tarefaSelecionada);
                  handleConcluirTarefa();
                }
              : undefined
          }
        />
      )}

      {showAvaliacaoModal && tarefaParaAvaliacao && (
        <AvaliacaoTarefaModal
          isOpen={showAvaliacaoModal}
          onClose={() => {
            setShowAvaliacaoModal(false);
            setTarefaParaAvaliacao(null);
          }}
          onConfirm={handleAvaliacaoSubmit}
          titulo={usuario.nivel >= NIVEIS_PERMISSAO.SUPERVISOR ? "Avaliar Tarefa" : "Autoavaliação"}
          tipoAvaliacao={usuario.nivel >= NIVEIS_PERMISSAO.SUPERVISOR ? "supervisor" : "colaborador"}
        />
      )}

      {showConfirmDelete && (
        <ConfirmDialog
          message="Tem certeza que deseja excluir esta tarefa?"
          onConfirm={async () => {
            try {
              await deleteDoc(doc(db, 'tarefas', tarefaSelecionada.id));
              showToast('Tarefa excluída com sucesso!', 'success');
              setTarefaSelecionada(null);
            } catch (error) {
              console.error('Erro ao excluir tarefa:', error);
              showToast('Erro ao excluir tarefa', 'error');
            }
            setShowConfirmDelete(false);
          }}
          onCancel={() => setShowConfirmDelete(false)}
        />
      )}
    </div>
  );
};

export default TarefasTab;

