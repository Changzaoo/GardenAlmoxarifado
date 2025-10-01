import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useAuth } from '../../hooks/useAuth';
import { 
  Plus, Star, PauseCircle, PlayCircle, CheckCircle, Clock, CircleDotDashed, 
  Pause, Loader, Trash2, Calendar, User, AlertCircle, Search 
} from 'lucide-react';
import { useToast } from '../ToastProvider';
import CriarTarefa from './CriarTarefa';
import DetalheTarefa from './DetalheTarefa';
import AvaliacaoTarefaModal from './AvaliacaoTarefaModal';
import ConfirmDialog from '../common/ConfirmDialog';
import { formatarDataHora } from '../../utils/dateUtils';

const NIVEIS_PERMISSAO = {
  FUNCIONARIO: 1,
  SUPERVISOR: 2,
  ADMIN: 3
};

const TarefasTab = ({ funcionarios = [], showOnlyUserTasks = false, showAddButton = true, userFilter = null, readOnly = false }) => {
  const { usuario } = useAuth();
  const { showToast } = useToast();
  const [tarefas, setTarefas] = useState([]);
  const [showCriarTarefa, setShowCriarTarefa] = useState(false);
  const [filtro, setFiltro] = useState('todas');
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
      const tempoTotal = calcularTempoTotal(tarefaParaAvaliacao);
      await updateDoc(doc(db, 'tarefas', tarefaParaAvaliacao.id), {
        status: 'concluida',
        dataConclusao: new Date().toISOString(),
        tempoTotal
      });
      setShowAvaliacaoModal(true);
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
    if (userFilter) {
      return tarefa.funcionario === userFilter || 
             tarefa.funcionariosIds?.includes(userFilter);
    }
    return tarefa.funcionario === usuario?.nome || 
           tarefa.funcionariosIds?.includes(usuario?.nome);
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

  const tarefasFiltradas = tarefas
    .filter(tarefa => {
      if (showOnlyUserTasks && !isUserAssigned(tarefa)) return false;
      if (filtro !== 'todas' && tarefa.status !== filtro) return false;
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
      <div className="flex items-center gap-4 mb-6">
        <div className="relative w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="     Buscar tarefas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-10 pr-4 border border-gray-200 dark:border-gray-600 dark:border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#1D9BF0] dark:bg-white dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-4 flex-1">
          <select
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="w-40 border border-gray-200 dark:border-gray-600 dark:border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#1D9BF0] dark:bg-white dark:bg-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-[#2C3640]"
          >
            <option value="todas">Todas as tarefas</option>
            <option value="pendente">Pendentes</option>
            <option value="em_andamento">Em andamento</option>
            <option value="pausada">Pausadas</option>
            <option value="concluida">Concluídas</option>
          </select>

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tarefasFiltradas.map(tarefa => {
          const statusInfo = getStatusInfo(tarefa);
          
          return (
            <div
              key={tarefa.id}
              className="bg-white dark:bg-gray-700 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200"
              onClick={() => !readOnly && setTarefaSelecionada(tarefa)}
            >
              <div className="p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      {tarefa.titulo}
                    </h3>
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.textColor}`}>
                      {statusInfo.icon}
                      {statusInfo.text}
                    </div>
                  </div>
                  {!readOnly && tarefa.status === 'em_andamento' && (
                    <div className="text-blue-600 dark:text-blue-400 font-medium">
                      {formatarTempo(temposDecorridos[tarefa.id])}
                    </div>
                  )}
                </div>

                {tarefa.descricao && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                      {tarefa.descricao}
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Funcionários:</h4>
                    <div className="flex flex-wrap gap-2">
                      {[...(tarefa.funcionariosIds || []), tarefa.funcionario]
                        .filter(Boolean)
                        .map((func, idx) => (
                          <div 
                            key={idx}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-600 rounded text-sm text-gray-700 dark:text-gray-300"
                          >
                            <User className="w-3 h-3" />
                            {func}
                          </div>
                        ))}
                    </div>
                  </div>

                  {tarefa.prioridade && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Prioridade:</span>
                      <span className={`text-sm ${
                        tarefa.prioridade === 'alta' ? 'text-red-500' :
                        tarefa.prioridade === 'média' ? 'text-yellow-500' :
                        'text-green-500'
                      }`}>
                        {tarefa.prioridade.charAt(0).toUpperCase() + tarefa.prioridade.slice(1)}
                      </span>
                    </div>
                  )}

                  {tarefa.status === 'concluida' && (
                    <div className="space-y-2">
                      {tarefa.avaliacaoSupervisor && !readOnly && (
                        <div className="flex items-center gap-1 text-yellow-500">
                          <Star className="w-4 h-4 fill-current" />
                          <span className="text-sm font-medium">Avaliação do Supervisor: {tarefa.avaliacaoSupervisor}</span>
                        </div>
                      )}
                      {tarefa.avaliacaoFuncionario && !readOnly && (
                        <div className="flex items-center gap-1 text-blue-500">
                          <Star className="w-4 h-4 fill-current" />
                          <span className="text-sm font-medium">Avaliação do Funcionário: {tarefa.avaliacaoFuncionario}</span>
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
              </div>
            </div>
          );
        })}
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
          onIniciar={() => handleIniciarTarefa(tarefaSelecionada.id)}
          onPausar={() => handlePausarTarefa(tarefaSelecionada.id)}
          onConcluir={() => {
            setTarefaParaAvaliacao(tarefaSelecionada);
            handleConcluirTarefa();
          }}
          onDelete={() => setShowConfirmDelete(true)}
        />
      )}

      {showAvaliacaoModal && tarefaParaAvaliacao && (
        <AvaliacaoTarefaModal
          onClose={() => {
            setShowAvaliacaoModal(false);
            setTarefaParaAvaliacao(null);
          }}
          onSubmit={handleAvaliacaoSubmit}
          isSupervisor={usuario.nivel >= NIVEIS_PERMISSAO.SUPERVISOR}
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


