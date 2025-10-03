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
    if (!usuario) {
      console.log('⚠️ Nenhum usuário logado');
      return false;
    }
    
    const usuarioNome = usuario?.nome?.toLowerCase();
    const usuarioId = String(usuario?.id);
    const usuarioEmail = usuario?.email?.toLowerCase();
    
    console.log('🔍 Verificando tarefa:', tarefa.titulo, {
      usuarioLogado: { id: usuarioId, nome: usuarioNome, email: usuarioEmail }
    });
    
    // Função helper melhorada - match por ID, nome ou email
    const matchUser = (value) => {
      if (!value) return false;
      const valueLower = String(value).toLowerCase();
      const valueStr = String(value);
      
      // Match exato por ID (string ou number)
      if (valueStr === usuarioId) return true;
      if (valueLower === usuarioId.toLowerCase()) return true;
      
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
    
    // Verificar array de funcionarios (objetos completos)
    const estaNosFuncionarios = tarefa.funcionarios?.some(func => {
      return matchUser(func.id) || matchUser(func.nome) || matchUser(func.email);
    });
    
    // Verificar campos legados (funcionario e responsavel)
    const ehResponsavel = matchUser(tarefa.responsavel);
    const ehFuncionario = matchUser(tarefa.funcionario);
    
    const resultado = estaNosIds || estaNosFuncionarios || ehResponsavel || ehFuncionario;
    
    // Log detalhado para debug
    console.log(resultado ? '✅' : '❌', `Tarefa "${tarefa.titulo}":`, {
      resultado,
      checks: {
        estaNosIds,
        estaNosFuncionarios,
        ehResponsavel,
        ehFuncionario
      },
      tarefa: {
        funcionariosIds: tarefa.funcionariosIds,
        funcionarios: tarefa.funcionarios,
        funcionario: tarefa.funcionario,
        responsavel: tarefa.responsavel
      },
      usuario: {
        usuarioId,
        usuarioNome,
        usuarioEmail
      }
    });
    
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
    // Se for admin, vê todas
    if (isAdmin) {
      return tarefas;
    }
    
    // Se for Meu Perfil (showOnlyUserTasks=true), não filtra por setor
    // Usuário vê TODAS as tarefas atribuídas a ele, independente do setor
    if (showOnlyUserTasks) {
      console.log('📌 Modo Meu Perfil: mostrando todas as tarefas atribuídas ao usuário, ignorando filtro de setor');
      return tarefas;
    }
    
    // Para página de Tarefas geral, filtra por setor
    return PermissionChecker.filterBySector(tarefas, usuario);
  }, [tarefas, usuario, isAdmin, showOnlyUserTasks]);

  const tarefasFiltradas = tarefasPorSetor
    .filter(tarefa => {
      // Filtro de usuário
      if (showOnlyUserTasks && !isUserAssigned(tarefa)) {
        console.log('❌ Tarefa filtrada (não atribuída):', tarefa.titulo);
        return false;
      }
      
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

  // Log para debug
  useEffect(() => {
    console.log('📊 TAREFAS DEBUG:', {
      totalTarefas: tarefas.length,
      tarefasPorSetor: tarefasPorSetor.length,
      tarefasFiltradas: tarefasFiltradas.length,
      showOnlyUserTasks,
      isAdmin,
      filtroStatus,
      usuarioNivel: usuario?.nivel,
      usuarioSetor: usuario?.setor,
      usuarioId: usuario?.id,
      usuarioNome: usuario?.nome
    });
    
    console.log('📋 Todas as tarefas:', tarefas.map(t => ({
      titulo: t.titulo,
      status: t.status,
      setorId: t.setorId,
      funcionariosIds: t.funcionariosIds,
      funcionarios: t.funcionarios
    })));
    
    if (tarefasFiltradas.length > 0) {
      console.log('✅ Tarefas que passaram no filtro:', tarefasFiltradas.map(t => ({
        titulo: t.titulo,
        status: t.status
      })));
    } else {
      console.log('❌ Nenhuma tarefa passou nos filtros');
    }
  }, [tarefas, tarefasPorSetor, tarefasFiltradas, showOnlyUserTasks, filtroStatus, usuario, isAdmin]);

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

      {/* Barra de Filtros Modernizada */}
      <div className="bg-gradient-to-br from-white via-gray-50 to-blue-50 dark:from-[#1E2732] dark:via-[#1A2332] dark:to-[#1E2742] rounded-2xl shadow-xl border-2 border-gray-200 dark:border-gray-700/50 p-6 relative overflow-hidden">
        {/* Decoração de fundo */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-400/10 to-purple-400/10 dark:from-blue-500/5 dark:to-purple-500/5 rounded-full blur-3xl -z-0" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-indigo-400/10 to-pink-400/10 dark:from-indigo-500/5 dark:to-pink-500/5 rounded-full blur-3xl -z-0" />
        
        <div className="relative z-10 space-y-4">
          {/* Busca com ícone externo */}
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 rounded-xl p-3 shadow-lg">
              <Search className="w-5 h-5 text-white" />
            </div>
            <input
              type="text"
              placeholder="Buscar tarefas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 h-12 px-4 bg-white dark:bg-[#15202B] border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#1D9BF0] focus:border-transparent shadow-md hover:shadow-lg transition-all duration-300 text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
          </div>

          {/* Filtros em Grid com Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Status Filter Card */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 dark:from-green-500 dark:to-emerald-600 rounded-xl opacity-0 group-hover:opacity-20 blur transition-opacity duration-300" />
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="relative w-full h-12 px-4 bg-white dark:bg-[#15202B] border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-transparent shadow-md hover:shadow-lg transition-all duration-300 text-gray-800 dark:text-white cursor-pointer appearance-none bg-no-repeat bg-right pr-10"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                  backgroundSize: '1.5rem',
                  backgroundPosition: 'right 0.75rem center'
                }}
              >
                <option value="todas">Todos os status</option>
                <option value="pendente">Pendentes</option>
                <option value="em_andamento">Em andamento</option>
                <option value="pausada">Pausadas</option>
                <option value="concluida">Concluídas</option>
              </select>
            </div>

            {/* Período Filter Card */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-500 dark:from-blue-500 dark:to-cyan-600 rounded-xl opacity-0 group-hover:opacity-20 blur transition-opacity duration-300" />
              <select
                value={filtroPeriodo}
                onChange={(e) => setFiltroPeriodo(e.target.value)}
                className="relative w-full h-12 px-4 bg-white dark:bg-[#15202B] border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent shadow-md hover:shadow-lg transition-all duration-300 text-gray-800 dark:text-white cursor-pointer appearance-none bg-no-repeat bg-right pr-10"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                  backgroundSize: '1.5rem',
                  backgroundPosition: 'right 0.75rem center'
                }}
              >
                <option value="todos">Todos os períodos</option>
                <option value="hoje">Hoje</option>
                <option value="semana">Últimos 7 dias</option>
                <option value="mes">Último mês</option>
              </select>
            </div>

            {/* Avaliação Filter Card */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 dark:from-yellow-500 dark:to-orange-600 rounded-xl opacity-0 group-hover:opacity-20 blur transition-opacity duration-300" />
              <select
                value={filtroAvaliacao}
                onChange={(e) => setFiltroAvaliacao(e.target.value)}
                className="relative w-full h-12 px-4 bg-white dark:bg-[#15202B] border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 dark:focus:ring-yellow-400 focus:border-transparent shadow-md hover:shadow-lg transition-all duration-300 text-gray-800 dark:text-white cursor-pointer appearance-none bg-no-repeat bg-right pr-10"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                  backgroundSize: '1.5rem',
                  backgroundPosition: 'right 0.75rem center'
                }}
              >
                <option value="todas">Todas as avaliações</option>
                <option value="excelente">Excelente (5★)</option>
                <option value="boa">Boa (4★)</option>
                <option value="regular">Regular (3★)</option>
                <option value="ruim">Ruim (≤ 2★)</option>
                <option value="pendente">Pendente de avaliação</option>
              </select>
            </div>
          </div>

          {/* Botões de Ação com destaque */}
          {showAddButton && usuario.nivel >= NIVEIS_PERMISSAO.SUPERVISOR && (
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={() => setShowAtribuirSemanal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 dark:from-indigo-600 dark:via-purple-600 dark:to-pink-600 text-white rounded-xl hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 dark:hover:from-indigo-700 dark:hover:via-purple-700 dark:hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-purple-500/50 hover:scale-105 font-medium"
              >
                <CalendarDays className="w-5 h-5" />
                <span>Tarefa Semanal</span>
              </button>
              <button
                onClick={() => setShowCriarTarefa(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 dark:from-blue-600 dark:to-cyan-600 text-white rounded-xl hover:from-blue-600 hover:to-cyan-600 dark:hover:from-blue-700 dark:hover:to-cyan-700 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-blue-500/50 hover:scale-105 font-medium"
              >
                <Plus className="w-5 h-5" />
                <span>Nova Tarefa</span>
              </button>
            </div>
          )}
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
              
              // Extrair emoji do título (primeiro caractere se for emoji)
              const emojiRegex = /(\p{Emoji_Presentation}|\p{Extended_Pictographic})/gu;
              const emojiMatch = tarefa.titulo.match(emojiRegex);
              const emoji = emojiMatch ? emojiMatch[0] : null;
              const tituloSemEmoji = emoji ? tarefa.titulo.replace(emoji, '').trim() : tarefa.titulo;
              
              return (
              <div
                key={tarefa.id}
                className="group relative bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer border-2 border-gray-100 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500"
                onClick={() => setTarefaSelecionada(tarefa)}
              >
                {/* Gradiente decorativo de fundo */}
                <div className={`absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity bg-gradient-to-br ${prioridadeColors[tarefa.prioridade || 'baixa']}`}></div>
                
                {/* Barra de prioridade no topo com brilho */}
                <div className={`h-3 bg-gradient-to-r ${prioridadeColors[tarefa.prioridade || 'baixa']} shadow-lg`} />
                
                <div className="relative p-6">
                  {/* Header com ícone */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${prioridadeColors[tarefa.prioridade || 'baixa']} shadow-lg flex-shrink-0 flex items-center justify-center`}>
                      {emoji ? (
                        <span className="text-3xl">{emoji}</span>
                      ) : (
                        statusInfo.icon && React.cloneElement(statusInfo.icon, { className: 'w-6 h-6 text-white' })
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-2 line-clamp-2">
                        {tituloSemEmoji}
                      </h3>
                      
                      {/* Badges de Status e Tempo */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold shadow-md ${statusColors[tarefa.status]}`}>
                          {statusInfo.text}
                        </span>
                        
                        {!readOnly && tarefa.status === 'em_andamento' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full text-xs font-bold shadow-lg shadow-blue-500/50 animate-pulse">
                            <Clock className="w-3.5 h-3.5" />
                            {formatarTempo(temposDecorridos[tarefa.id])}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {tarefa.descricao && (
                    <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
                      <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 leading-relaxed">
                        {tarefa.descricao}
                      </p>
                    </div>
                  )}

                  {/* Funcionários Atribuídos */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="bg-blue-100 dark:bg-blue-900/30 p-1.5 rounded-lg">
                        <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Atribuído para
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(tarefa.funcionarios && tarefa.funcionarios.length > 0) ? (
                        tarefa.funcionarios.map((func, idx) => {
                          const funcionarioCompleto = funcionarios.find(f => 
                            f.id === func.id || 
                            f.email === func.email || 
                            f.nome === func.nome
                          );
                          const photoURL = funcionarioCompleto?.photoURL;
                          const nomeFuncionario = func.nome || func.username || func.email || 'Sem nome';
                          
                          return (
                            <div 
                              key={idx}
                              className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-200 dark:border-blue-700 rounded-full text-sm font-medium text-blue-700 dark:text-blue-300 hover:shadow-md transition-shadow"
                            >
                              {photoURL ? (
                                <img 
                                  src={photoURL} 
                                  alt={nomeFuncionario}
                                  className="w-6 h-6 rounded-full object-cover border-2 border-blue-400 dark:border-blue-500"
                                />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold border-2 border-blue-400 dark:border-blue-500">
                                  {nomeFuncionario.charAt(0).toUpperCase()}
                                </div>
                              )}
                              {nomeFuncionario}
                            </div>
                          );
                        })
                      ) : (
                        (tarefa.funcionariosIds || []).map((funcId, idx) => {
                          const funcionarioEncontrado = funcionarios.find(f => f.id === funcId);
                          const nomeFuncionario = funcionarioEncontrado 
                            ? (funcionarioEncontrado.nome || funcionarioEncontrado.username || funcionarioEncontrado.email || 'Sem nome')
                            : funcId;
                          const photoURL = funcionarioEncontrado?.photoURL;
                          
                          return (
                            <div 
                              key={idx}
                              className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-200 dark:border-blue-700 rounded-full text-sm font-medium text-blue-700 dark:text-blue-300 hover:shadow-md transition-shadow"
                            >
                              {photoURL ? (
                                <img 
                                  src={photoURL} 
                                  alt={nomeFuncionario}
                                  className="w-6 h-6 rounded-full object-cover border-2 border-blue-400 dark:border-blue-500"
                                />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold border-2 border-blue-400 dark:border-blue-500">
                                  {nomeFuncionario.charAt(0).toUpperCase()}
                                </div>
                              )}
                              {nomeFuncionario}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Badge de Prioridade */}
                  {tarefa.prioridade && (
                    <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
                      <div className={`p-2 rounded-lg ${
                        tarefa.prioridade === 'alta' 
                          ? 'bg-red-100 dark:bg-red-900/40' 
                          : tarefa.prioridade === 'média' 
                          ? 'bg-yellow-100 dark:bg-yellow-900/40' 
                          : 'bg-green-100 dark:bg-green-900/40'
                      }`}>
                        <AlertCircle className={`w-4 h-4 ${
                          tarefa.prioridade === 'alta' 
                            ? 'text-red-600 dark:text-red-400' 
                            : tarefa.prioridade === 'média' 
                            ? 'text-yellow-600 dark:text-yellow-400' 
                            : 'text-green-600 dark:text-green-400'
                        }`} />
                      </div>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        Prioridade: {tarefa.prioridade === 'alta' ? '🔥 Alta' : tarefa.prioridade === 'média' ? '⚡ Média' : '✓ Baixa'}
                      </span>
                    </div>
                  )}

                  {/* Avaliações */}
                  {tarefa.status === 'concluida' && (tarefa.avaliacaoSupervisor || tarefa.avaliacaoFuncionario) && (
                    <div className="space-y-3 mb-4 p-4 bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 dark:from-yellow-900/20 dark:via-amber-900/20 dark:to-orange-900/20 rounded-xl border-2 border-yellow-200 dark:border-yellow-800 shadow-md">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="bg-yellow-500 p-1.5 rounded-lg">
                          <Star className="w-4 h-4 text-white fill-white" />
                        </div>
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Avaliações</span>
                      </div>
                      {tarefa.avaliacaoSupervisor && (
                        <div className="flex items-center justify-between p-2 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                          <span className="text-sm font-bold text-gray-800 dark:text-gray-200">👔 Supervisor</span>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, index) => (
                              <Star
                                key={index}
                                className={`w-5 h-5 transition-transform hover:scale-125 ${
                                  index < tarefa.avaliacaoSupervisor
                                    ? 'text-yellow-500 fill-yellow-500 drop-shadow-lg'
                                    : 'text-gray-300 dark:text-gray-600'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                      {tarefa.avaliacaoFuncionario && (
                        <div className="flex items-center justify-between p-2 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                          <span className="text-sm font-bold text-gray-800 dark:text-gray-200">👤 Funcionário</span>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, index) => (
                              <Star
                                key={index}
                                className={`w-5 h-5 transition-transform hover:scale-125 ${
                                  index < tarefa.avaliacaoFuncionario
                                    ? 'text-yellow-500 fill-yellow-500 drop-shadow-lg'
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
                  <div className="mb-4 flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    <div className="bg-gray-200 dark:bg-gray-700 p-1.5 rounded-lg">
                      <Calendar className="w-3.5 h-3.5 text-gray-600 dark:text-gray-300" />
                    </div>
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{formatarDataHora(tarefa.dataCriacao)}</span>
                  </div>

                  {/* Ações */}
                  {!readOnly && (
                    <div className="pt-4 border-t-2 border-gray-200 dark:border-gray-700 flex justify-end gap-2">
                      {tarefa.status === 'pendente' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleIniciarTarefa(tarefa.id);
                          }}
                          className="flex-1 px-4 py-3 text-sm font-bold bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/50 hover:shadow-xl hover:shadow-blue-500/70 hover:scale-105 transition-all duration-200"
                        >
                          <PlayCircle className="w-5 h-5" />
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
                            className="flex-1 px-3 py-3 text-sm font-bold bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/50 hover:shadow-xl hover:shadow-yellow-500/70 hover:scale-105 transition-all duration-200"
                          >
                            <Pause className="w-5 h-5" />
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

