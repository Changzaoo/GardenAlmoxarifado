import React, { useState, useEffect, useMemo, useCallback, useContext } from 'react';
import { collection, query, orderBy, onSnapshot, updateDoc, doc, deleteDoc, addDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useAuth } from '../../hooks/useAuth';
import { 
  Plus, Star, PauseCircle, PlayCircle, CheckCircle, Clock, CircleDotDashed, 
  Pause, Loader, Trash2, Calendar, User, AlertCircle, Search, Shield, 
  Signal, SignalMedium, SignalLow 
} from 'lucide-react';
import { useToast } from '../ToastProvider';
import CriarTarefa from './CriarTarefa';
import DetalheTarefa from './DetalheTarefa';
import AvaliacaoTarefaModal from './AvaliacaoTarefaModal';
import ConfirmDialog from '../common/ConfirmDialog';
import { formatarDataHora } from '../../utils/dateUtils';
import { useSectorPermissions } from '../../hooks/useSectorPermissions';
import { PermissionChecker, hasSupervisionPermission, NIVEIS_PERMISSAO } from '../../constants/permissoes';

// Import opcional do DataContext
let DataContext;
try {
  const module = require('../../context/DataContext');
  DataContext = module.DataContext;
} catch (e) {
  DataContext = null;
}

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
  
  // Tentativa de usar DataContext se disponível
  let tarefasGlobal = [];
  if (DataContext) {
    try {
      const context = useContext(DataContext);
      tarefasGlobal = context?.tarefas || [];
    } catch (e) {
      tarefasGlobal = [];
    }
  }
  const [tarefas, setTarefas] = useState([]);
  const [showCriarTarefa, setShowCriarTarefa] = useState(false);
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
    if (tarefasGlobal.length > 0) {
      setTarefas(tarefasGlobal.sort((a, b) => {
        const dataA = a.dataCriacao?.toDate?.() || new Date(a.dataCriacao);
        const dataB = b.dataCriacao?.toDate?.() || new Date(b.dataCriacao);
        return dataB - dataA;
      }));
      
      const temposIniciais = {};
      tarefasGlobal.forEach(tarefa => {
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
    }
  }, [tarefasGlobal]);

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

  const handleIniciarTarefa = useCallback(async (tarefaId) => {
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
  }, [showToast]);

  const handlePausarTarefa = useCallback(async (tarefaId) => {
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
  }, [tarefas, showToast]);

  const handleConcluirTarefa = useCallback(async () => {
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
      else if (hasSupervisionPermission(usuario?.nivel)) {
        setShowAvaliacaoModal(true);
      }

      showToast('Tarefa concluída com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao concluir tarefa:', error);
      showToast('Erro ao concluir tarefa', 'error');
      setTarefaParaAvaliacao(null);
    }
  }, [tarefaParaAvaliacao, usuario, showToast]);

  const handleAvaliacaoSubmit = async (avaliacao, comentario) => {
    if (!tarefaParaAvaliacao) return;

    try {
      const tarefaRef = doc(db, 'tarefas', tarefaParaAvaliacao.id);
      const updateData = {};

      if (usuario.nivel === NIVEIS_PERMISSAO.FUNCIONARIO) {
        updateData.avaliacaoFuncionario = avaliacao;
        updateData.comentarioFuncionario = comentario;
      } else if (hasSupervisionPermission(usuario.nivel)) {
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
    }
    
    return resultado;
  };

  const getStatusInfo = (tarefa) => {
    switch(tarefa.status) {
      case 'pendente':
        return {
          icon: <Clock className="w-3 h-3 mr-1" />,
          text: 'Pendente',
          bgColor: 'bg-blue-100 dark:bg-blue-900/30',
          textColor: 'text-blue-700 dark:text-blue-300'
        };
      case 'em_andamento':
        return {
          icon: <PlayCircle className="w-3 h-3 mr-1" />,
          text: 'Em Andamento',
          bgColor: 'bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700',
          textColor: 'text-white'
        };
      case 'pausada':
        return {
          icon: <PauseCircle className="w-3 h-3 mr-1" />,
          text: 'Pausada',
          bgColor: 'bg-gray-100 dark:bg-gray-700/50',
          textColor: 'text-gray-700 dark:text-gray-300'
        };
      case 'concluida':
        return {
          icon: <CheckCircle className="w-3 h-3 mr-1" />,
          text: 'Concluída',
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
          textColor: 'text-blue-600 dark:text-blue-400'
        };
      default:
        return {
          icon: <AlertCircle className="w-3 h-3 mr-1" />,
          text: 'Status Desconhecido',
          bgColor: 'bg-gray-100 dark:bg-gray-800',
          textColor: 'text-gray-700 dark:text-gray-400'
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

  // Memoizar tarefas filtradas para evitar recalcular a cada render
  const tarefasFiltradas = useMemo(() => {
    return tarefasPorSetor
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
  }, [tarefasPorSetor, showOnlyUserTasks, filtroStatus, filtroPeriodo, filtroAvaliacao, searchTerm, quantidadeExibida]);

  return (
    <div className="space-y-6">
      {/* Badge informativo para não-admins */}
      {!isAdmin && usuario?.setor && (
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-xl p-4 flex items-center gap-3 shadow-lg">
          <div className="p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-200 font-medium">
            <strong className="text-blue-600 dark:text-blue-400">Visualização por setor:</strong> Você está vendo apenas as tarefas do setor <strong className="text-blue-600 dark:text-blue-400">{usuario.setor}</strong>
          </p>
        </div>
      )}

      {/* Barra de Filtros */}
      <div className="bg-gradient-to-br from-white to-blue-50/30 dark:from-gray-800 dark:to-gray-800 rounded-2xl shadow-xl border-2 border-blue-100 dark:border-blue-900/30 p-6">
        <div className="flex flex-wrap gap-4">
          {/* Busca */}
          <div className="relative flex-1 min-w-[250px]">
            <input
              type="text"
              placeholder="Buscar tarefas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-12 px-4 border-2 border-blue-200 dark:border-blue-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 bg-white dark:bg-gray-700 dark:text-white transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 shadow-sm"
            />
          </div>

          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
            {/* Status */}
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="w-full h-12 border-2 border-blue-200 dark:border-blue-700 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 bg-white dark:bg-gray-700 dark:text-white hover:bg-blue-50 dark:hover:bg-gray-600 transition-all cursor-pointer shadow-sm font-medium"
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
              className="w-full h-12 border-2 border-blue-200 dark:border-blue-700 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 bg-white dark:bg-gray-700 dark:text-white hover:bg-blue-50 dark:hover:bg-gray-600 transition-all cursor-pointer shadow-sm font-medium"
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
              className="w-full h-12 border-2 border-blue-200 dark:border-blue-700 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 bg-white dark:bg-gray-700 dark:text-white hover:bg-blue-50 dark:hover:bg-gray-600 transition-all cursor-pointer shadow-sm font-medium"
            >
              <option value="todas">Todas as avaliações</option>
              <option value="excelente">Excelente (5★)</option>
              <option value="boa">Boa (4★)</option>
              <option value="regular">Regular (3★)</option>
              <option value="ruim">Ruim (≤ 2★)</option>
              <option value="pendente">Pendente de avaliação</option>
            </select>

            {/* Botão Nova Tarefa */}
            {showAddButton && hasSupervisionPermission(usuario.nivel) && (
              <button
                onClick={() => setShowCriarTarefa(true)}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl shadow-lg hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-200 transform hover:scale-105 font-bold"
              >
                <Plus className="w-5 h-5" /> Nova Tarefa
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid dos Cards */}
      <div className="bg-gradient-to-br from-blue-50/30 to-cyan-50/30 dark:from-gray-900 dark:to-gray-800 rounded-2xl shadow-inner border-2 border-blue-100 dark:border-gray-700 p-6">
        {tarefasFiltradas.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center border-2 border-dashed border-blue-200 dark:border-blue-700 shadow-lg">
            <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Clock className="w-10 h-10 text-white" />
            </div>
            <p className="text-lg font-bold text-gray-700 dark:text-gray-200 mb-2">Nenhuma tarefa encontrada</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{
              searchTerm
                ? 'Tente ajustar sua busca'
                : userFilter
                  ? `Não há tarefas para ${userFilter}`
                  : 'Crie uma nova tarefa para começar'
            }</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {tarefasFiltradas.map(tarefa => {
              const statusInfo = getStatusInfo(tarefa);
              return (
              <div
                key={tarefa.id}
                className="group bg-white dark:bg-gray-800 rounded-2xl p-6 border-2 border-blue-100 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-500/20 dark:hover:shadow-blue-400/20 transition-all duration-300 cursor-pointer transform hover:-translate-y-2 hover:scale-[1.02] flex flex-col h-full"
                onClick={() => setTarefaSelecionada(tarefa)}
              >
                {/* Header: Título e Badges de Status - Sempre no topo */}
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-3 line-clamp-2 min-h-[3.5rem]">
                    {tarefa.titulo}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium ${statusInfo.bgColor} ${statusInfo.textColor}`}>
                      {statusInfo.icon}
                      <span className="text-xs">{statusInfo.text}</span>
                    </div>
                    {tarefa.prioridade && (
                      <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                        tarefa.prioridade === 'alta' 
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-700' 
                          : tarefa.prioridade === 'média' 
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-700' 
                            : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700'
                      }`}>
                        {tarefa.prioridade === 'alta' ? (
                          <>
                            <Signal className="w-3.5 h-3.5" />
                            <span>Alta</span>
                          </>
                        ) : tarefa.prioridade === 'média' ? (
                          <>
                            <SignalMedium className="w-3.5 h-3.5" />
                            <span>Média</span>
                          </>
                        ) : (
                          <>
                            <SignalLow className="w-3.5 h-3.5" />
                            <span>Baixa</span>
                          </>
                        )}
                      </span>
                    )}
                    {!readOnly && tarefa.status === 'em_andamento' && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold shadow-md">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="text-xs">{formatarTempo(temposDecorridos[tarefa.id])}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Descrição - Sempre na mesma posição com altura fixa de 3 linhas */}
                <div className="mb-4">
                  {tarefa.descricao ? (
                    <div className="p-3 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-700 dark:to-gray-600 rounded-xl border-2 border-blue-100 dark:border-gray-600 shadow-sm h-[4.5rem] overflow-y-auto">
                      <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed">
                        {tarefa.descricao}
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl h-[4.5rem] flex items-center justify-center">
                      <p className="text-sm text-gray-400 dark:text-gray-500 italic">Sem descrição</p>
                    </div>
                  )}
                </div>

                {/* Funcionários - Sempre na mesma posição */}
                <div className="mb-4 min-h-[2.5rem]">
                  <div className="flex flex-wrap gap-2">
                    {(tarefa.funcionarios && tarefa.funcionarios.length > 0) ? (
                      tarefa.funcionarios.map((func, idx) => (
                        <div 
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 border-2 border-blue-400 dark:border-blue-500 rounded-full text-xs font-bold text-white shadow-md"
                        >
                          {func.fotoUrl ? (
                            <img 
                              src={func.fotoUrl} 
                              alt={func.nome || 'Funcionário'} 
                              className="w-5 h-5 rounded-full object-cover border-2 border-white"
                            />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center border-2 border-white">
                              <User className="w-3 h-3" />
                            </div>
                          )}
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
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 border-2 border-blue-400 dark:border-blue-500 rounded-full text-xs font-bold text-white shadow-md"
                          >
                            {funcionarioEncontrado?.fotoUrl ? (
                              <img 
                                src={funcionarioEncontrado.fotoUrl} 
                                alt={nomeFuncionario} 
                                className="w-5 h-5 rounded-full object-cover border-2 border-white"
                              />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center border-2 border-white">
                                <User className="w-3 h-3" />
                              </div>
                            )}
                            {nomeFuncionario}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Avaliações - Sempre na mesma posição */}
                <div className="mb-4 min-h-[4.5rem]">
                  {tarefa.status === 'concluida' ? (
                    <div className="space-y-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                      {/* Avaliação do Supervisor */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-600 dark:text-gray-400 min-w-[80px]">Supervisor:</span>
                        {tarefa.avaliacaoSupervisor ? (
                          <div className="flex items-center">
                            {[...Array(5)].map((_, index) => (
                              <Star
                                key={index}
                                className={`w-3.5 h-3.5 ${
                                  index < tarefa.avaliacaoSupervisor
                                    ? 'text-yellow-400 fill-yellow-400'
                                    : 'text-gray-300 dark:text-gray-600'
                                }`}
                              />
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs italic text-gray-400 dark:text-gray-500">Ainda não avaliado</span>
                        )}
                      </div>
                      {/* Avaliação do Funcionário */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-600 dark:text-gray-400 min-w-[80px]">Funcionário:</span>
                        {tarefa.avaliacaoFuncionario ? (
                          <div className="flex items-center">
                            {[...Array(5)].map((_, index) => (
                              <Star
                                key={index}
                                className={`w-3.5 h-3.5 ${
                                  index < tarefa.avaliacaoFuncionario
                                    ? 'text-yellow-400 fill-yellow-400'
                                    : 'text-gray-300 dark:text-gray-600'
                                }`}
                              />
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs italic text-gray-400 dark:text-gray-500">Ainda não avaliado</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                      <p className="text-xs text-gray-400 dark:text-gray-500 italic text-center">Avaliações disponíveis após conclusão</p>
                    </div>
                  )}
                </div>

                {/* Spacer para empurrar data e botões para o fundo */}
                <div className="flex-grow"></div>

                {/* Data de Criação - Sempre no mesmo lugar (antes dos botões) */}
                <div className="mb-3 pb-3 border-b-2 border-blue-100 dark:border-gray-700">
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span>Criada em {formatarDataHora(tarefa.dataCriacao)}</span>
                  </div>
                </div>

                {/* Botões de Ação - Sempre no final do card */}
                {!readOnly && (
                  <div className="flex justify-end gap-2 min-h-[2.5rem]">
                    {tarefa.status === 'pendente' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleIniciarTarefa(tarefa.id);
                        }}
                        className="px-4 py-2 text-sm bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl flex items-center gap-1.5 transition-all shadow-md hover:shadow-lg font-bold"
                      >
                        <PlayCircle className="w-4 h-4" />
                        Iniciar
                      </button>
                    )}

                    {tarefa.status === 'em_andamento' && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePausarTarefa(tarefa.id);
                          }}
                          className="px-4 py-2 text-sm bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white rounded-xl flex items-center gap-1.5 transition-all shadow-md hover:shadow-lg font-bold"
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
                          className="px-4 py-2 text-sm bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl flex items-center gap-1.5 transition-all shadow-md hover:shadow-lg font-bold"
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
                        className="px-4 py-2 text-sm bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl flex items-center gap-1.5 transition-all shadow-md hover:shadow-lg font-bold"
                      >
                        <PlayCircle className="w-4 h-4" />
                        Retomar
                      </button>
                    )}

                    {tarefa.status === 'concluida' && !tarefa.avaliacaoSupervisor && hasSupervisionPermission(usuario?.nivel) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setTarefaParaAvaliacao(tarefa);
                          setShowAvaliacaoModal(true);
                        }}
                        className="px-4 py-2 text-sm bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl flex items-center gap-1.5 transition-all shadow-md hover:shadow-lg font-bold"
                      >
                        <Star className="w-4 h-4" />
                        Avaliar
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          </div>
        )}
      </div>

      {quantidadeExibida < tarefas.length && (
        <div className="flex justify-center mt-8">
          <button
            onClick={() => setQuantidadeExibida(prev => prev + 10)}
            className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-2 border-blue-400 dark:border-blue-500 rounded-xl transition-all duration-200 font-bold shadow-lg hover:shadow-xl hover:shadow-blue-500/30 transform hover:-translate-y-1 hover:scale-105"
          >
            Carregar mais tarefas
          </button>
        </div>
      )}

      {showCriarTarefa && (
        <CriarTarefa
          onClose={() => setShowCriarTarefa(false)}
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
          titulo={hasSupervisionPermission(usuario.nivel) ? "Avaliar Tarefa" : "Autoavaliação"}
          tipoAvaliacao={hasSupervisionPermission(usuario.nivel) ? "supervisor" : "colaborador"}
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

// Memoizar componente para evitar re-renders desnecessários
export default React.memo(TarefasTab);

