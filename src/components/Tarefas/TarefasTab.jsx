import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, orderBy, onSnapshot, updateDoc, doc, deleteDoc, addDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useAuth } from '../../hooks/useAuth';
import { 
  Plus, Star, PauseCircle, PlayCircle, CheckCircle, Clock, CircleDotDashed, 
  Pause, Loader, Trash2, Calendar, User, AlertCircle, Search, Shield 
} from 'lucide-react';
import { useToast } from '../ToastProvider';
import CriarTarefa from './CriarTarefa';
import DetalheTarefa from './DetalheTarefa';
import AvaliacaoTarefaModal from './AvaliacaoTarefaModal';
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

            {/* Botão Nova Tarefa */}
            {showAddButton && usuario.nivel >= NIVEIS_PERMISSAO.SUPERVISOR && (
              <button
                onClick={() => setShowCriarTarefa(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 dark:bg-[#1D9BF0] text-gray-900 dark:text-white rounded-lg hover:bg-blue-600 dark:hover:bg-[#1a8cd8] transition-colors"
              >
                <Plus className="w-4 h-4" /> Nova Tarefa
              </button>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tarefasFiltradas.map(tarefa => {
              const statusInfo = getStatusInfo(tarefa);
              return (
              <div
                key={tarefa.id}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:border-[#1D9BF0] transition-colors cursor-pointer"
                onClick={() => setTarefaSelecionada(tarefa)}
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {tarefa.titulo}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        {statusInfo.icon}
                        <span>{statusInfo.text}</span>
                        {!readOnly && tarefa.status === 'em_andamento' && (
                          <span className="text-blue-500 dark:text-[#1D9BF0] font-medium ml-2">
                            {formatarTempo(temposDecorridos[tarefa.id])}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {tarefa.descricao && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                        {tarefa.descricao}
                      </p>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        {/* Primeiro tenta usar o array de funcionarios (objetos) */}
                        {(tarefa.funcionarios && tarefa.funcionarios.length > 0) ? (
                          tarefa.funcionarios.map((func, idx) => (
                            <div 
                              key={idx}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-full text-sm text-blue-700 dark:text-blue-300"
                            >
                              <User className="w-3 h-3" />
                              {func.nome || func.username || func.email || 'Sem nome'}
                            </div>
                          ))
                        ) : (
                          /* Se não tem funcionarios (objetos), tenta buscar por funcionariosIds */
                          (tarefa.funcionariosIds || []).map((funcId, idx) => {
                            const funcionarioEncontrado = funcionarios.find(f => f.id === funcId);
                            const nomeFuncionario = funcionarioEncontrado 
                              ? (funcionarioEncontrado.nome || funcionarioEncontrado.username || funcionarioEncontrado.email || 'Sem nome')
                              : funcId;
                            
                            return (
                              <div 
                                key={idx}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-full text-sm text-blue-700 dark:text-blue-300"
                              >
                                <User className="w-3 h-3" />
                                {nomeFuncionario}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {tarefa.prioridade && (
                      <div className="flex items-center gap-2 mt-4">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Prioridade:</span>
                        <span className={`text-sm ${
                          tarefa.prioridade === 'alta' ? 'text-red-500' :
                          tarefa.prioridade === 'média' ? 'text-blue-500 dark:text-[#1D9BF0]' :
                          'text-green-500'
                        }`}>
                          {tarefa.prioridade.charAt(0).toUpperCase() + tarefa.prioridade.slice(1)}
                        </span>
                      </div>
                    )}

                    {tarefa.status === 'concluida' && (
                      <div className="space-y-2 mt-4">
                        {tarefa.avaliacaoSupervisor && (
                          <div className="flex items-center gap-1">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Supervisor:</span>
                            <div className="flex items-center">
                              {[...Array(5)].map((_, index) => (
                                <Star
                                  key={index}
                                  className={`w-3.5 h-3.5 ${
                                    index < tarefa.avaliacaoSupervisor
                                      ? 'text-yellow-400 fill-yellow-400'
                                      : 'text-[#38444D]'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                        {tarefa.avaliacaoFuncionario && (
                          <div className="flex items-center gap-1">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Funcionário:</span>
                            <div className="flex items-center">
                              {[...Array(5)].map((_, index) => (
                                <Star
                                  key={index}
                                  className={`w-3.5 h-3.5 ${
                                    index < tarefa.avaliacaoFuncionario
                                      ? 'text-yellow-400 fill-yellow-400'
                                      : 'text-[#38444D]'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>Criada em {formatarDataHora(tarefa.dataCriacao)}</span>
                    </div>
                  </div>

                  {!readOnly && (
                    <div className="mt-4 flex justify-end gap-2">
                      {tarefa.status === 'pendente' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleIniciarTarefa(tarefa.id);
                          }}
                          className="px-3 py-1 text-sm bg-blue-500 dark:bg-[#1D9BF0] text-gray-900 dark:text-white rounded-full flex items-center gap-1 hover:bg-blue-600 dark:hover:bg-[#1a8cd8] transition-colors"
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
                            className="px-3 py-1 text-sm bg-[#F7BE38] text-gray-900 dark:text-white rounded-full flex items-center gap-1 hover:bg-[#f0b730] transition-colors"
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
                            className="px-3 py-1 text-sm bg-[#4CAF50] text-gray-900 dark:text-white rounded-full flex items-center gap-1 hover:bg-[#43a047] transition-colors"
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
                          className="px-3 py-1 text-sm bg-blue-500 dark:bg-[#1D9BF0] text-gray-900 dark:text-white rounded-full flex items-center gap-1 hover:bg-blue-600 dark:hover:bg-[#1a8cd8] transition-colors"
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
                          className="px-3 py-1 text-sm bg-blue-500 dark:bg-[#1D9BF0] text-gray-900 dark:text-white rounded-full flex items-center gap-1 hover:bg-blue-600 dark:hover:bg-[#1a8cd8] transition-colors"
                        >
                          <Star className="w-4 h-4" />
                          Avaliar
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

