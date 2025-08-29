import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useAuth } from '../../hooks/useAuth';
import { Plus, Star, PauseCircle, PlayCircle, CheckCircle } from 'lucide-react';
import { useToast } from '../ToastProvider';
import CriarTarefa from './CriarTarefa';
import DetalheTarefa from './DetalheTarefa';

const NIVEIS_PERMISSAO = {
  FUNCIONARIO: 1,
  SUPERVISOR: 2,
  ADMIN: 3
};

const TarefasTab = ({ funcionarios = [] }) => {
  const { usuario } = useAuth();
  const { showToast } = useToast();
  const [tarefas, setTarefas] = useState([]);
  const [showCriarTarefa, setShowCriarTarefa] = useState(false);
  const [filtro, setFiltro] = useState('todas'); // todas, minhas, pendentes, concluidas
  const [tarefaSelecionada, setTarefaSelecionada] = useState(null);
  const [temposDecorridos, setTemposDecorridos] = useState({});

  // Função para detectar menções na descrição
  const detectarMencoes = (descricao) => {
    const regex = /@(\w+)/g;
    const mencoes = descricao.match(regex) || [];
    return mencoes.map(mencao => mencao.slice(1)); // Remove o @ do início
  };

  useEffect(() => {
    const q = query(collection(db, 'tarefas'), orderBy('dataCriacao', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tarefasData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTarefas(tarefasData);
      
      // Inicializar tempos decorridos para tarefas em andamento
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

  const handleIniciarTarefa = async (tarefaId) => {
    try {
      await updateDoc(doc(db, 'tarefas', tarefaId), {
        status: 'em_andamento',
        funcionarioId: usuario.id,
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

  const handleContinuarTarefa = async (tarefaId) => {
    try {
      await updateDoc(doc(db, 'tarefas', tarefaId), {
        status: 'em_andamento',
        dataContinuacao: new Date().toISOString()
      });
      showToast('Tarefa retomada com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao retomar tarefa:', error);
      showToast('Erro ao retomar tarefa', 'error');
    }
  };

  useEffect(() => {
    // Atualizar o tempo a cada segundo para tarefas em andamento
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
    
    if (tarefa.status === 'em_andamento') {
      return temposDecorridos[tarefa.id] || 0;
    }
    
    let tempoTotal = 0;
    const inicioData = new Date(tarefa.dataInicio);
    
    if (tarefa.status === 'concluida') {
      const fimData = new Date(tarefa.dataConclusao);
      tempoTotal = fimData - inicioData;
    } else if (tarefa.status === 'pausada') {
      const pausaData = new Date(tarefa.dataPausa);
      tempoTotal = pausaData - inicioData;
    }
    
    // Subtrair tempo de pausas anteriores
    if (tarefa.tempoPausado) {
      tempoTotal -= tarefa.tempoPausado;
    }
    
    return tempoTotal;
  };

  const formatarTempo = (ms) => {
    const segundos = Math.floor(ms / 1000);
    const minutos = Math.floor(segundos / 60);
    const horas = Math.floor(minutos / 60);
    
    if (horas > 0) {
      return `${horas}h ${minutos % 60}m`;
    } else if (minutos > 0) {
      return `${minutos}m ${segundos % 60}s`;
    } else {
      return `${segundos}s`;
    }
  };

  const handleConcluirTarefa = async (tarefaId, avaliacao, comentario) => {
    try {
      const tarefa = tarefas.find(t => t.id === tarefaId);
      const tempoTotal = calcularTempoTotal(tarefa);
      
      await updateDoc(doc(db, 'tarefas', tarefaId), {
        status: 'concluida',
        dataConclusao: new Date().toISOString(),
        tempoTotal,
        avaliacao,
        comentarioFuncionario: comentario
      });
      showToast('Tarefa concluída com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao concluir tarefa:', error);
      showToast('Erro ao concluir tarefa', 'error');
    }
  };

  const handleComentarioSupervisor = async (tarefaId, comentario) => {
    if (usuario.nivel < NIVEIS_PERMISSAO.SUPERVISOR) return;

    try {
      await updateDoc(doc(db, 'tarefas', tarefaId), {
        comentarioSupervisor: comentario,
        dataComentarioSupervisor: new Date().toISOString()
      });
      showToast('Comentário adicionado com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
      showToast('Erro ao adicionar comentário', 'error');
    }
  };

  const tarefasFiltradas = tarefas.filter(tarefa => {
    // Verificar se o usuário está atribuído à tarefa
    const isUserAssigned = tarefa.funcionariosIds?.includes(usuario.nome) || tarefa.funcionarios?.some(f => f.nome === usuario.nome);
    
    // Para funcionários regulares, mostrar apenas suas tarefas atribuídas
    if (usuario.nivel === NIVEIS_PERMISSAO.FUNCIONARIO) {
      return isUserAssigned;
    }

    // Para supervisores e admins, aplicar os filtros normalmente
    switch (filtro) {
      case 'minhas':
        return isUserAssigned;
      case 'pendentes':
        return tarefa.status === 'pendente';
      case 'em_andamento':
        return tarefa.status === 'em_andamento';
      case 'pausadas':
        return tarefa.status === 'pausada';
      case 'concluidas':
        return tarefa.status === 'concluida';
      case 'todas':
      default:
        return true;
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Tarefas</h1>
          <p className="text-[#8899A6]">
            {usuario.nivel === NIVEIS_PERMISSAO.FUNCIONARIO
              ? "Suas tarefas atribuídas"
              : "Gerencie as tarefas do almoxarifado"}
          </p>
        </div>
        {usuario.nivel >= NIVEIS_PERMISSAO.SUPERVISOR && (
          <button
            onClick={() => setShowCriarTarefa(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#1DA1F2] text-white rounded-full hover:bg-[#1a91da] transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nova Tarefa
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {usuario.nivel > NIVEIS_PERMISSAO.FUNCIONARIO && (
          <button
            onClick={() => setFiltro('todas')}
            className={`px-4 py-2 rounded-full ${
              filtro === 'todas'
                ? 'bg-[#1DA1F2] text-white'
                : 'text-[#8899A6] hover:bg-[#1D9BF0]/10'
            }`}
          >
            Todas
          </button>
        )}
        
        {usuario.nivel > NIVEIS_PERMISSAO.FUNCIONARIO && (
          <button
            onClick={() => setFiltro('minhas')}
            className={`px-4 py-2 rounded-full ${
              filtro === 'minhas'
                ? 'bg-[#1DA1F2] text-white'
                : 'text-[#8899A6] hover:bg-[#1D9BF0]/10'
            }`}
          >
            Minhas Tarefas
          </button>
        )}

        <button
          onClick={() => setFiltro('pendentes')}
          className={`px-4 py-2 rounded-full ${
            filtro === 'pendentes'
              ? 'bg-[#1DA1F2] text-white'
              : 'text-[#8899A6] hover:bg-[#1D9BF0]/10'
          }`}
        >
          Pendentes
        </button>

        <button
          onClick={() => setFiltro('em_andamento')}
          className={`px-4 py-2 rounded-full ${
            filtro === 'em_andamento'
              ? 'bg-[#1DA1F2] text-white'
              : 'text-[#8899A6] hover:bg-[#1D9BF0]/10'
          }`}
        >
          Em Andamento
        </button>

        <button
          onClick={() => setFiltro('pausadas')}
          className={`px-4 py-2 rounded-full ${
            filtro === 'pausadas'
              ? 'bg-[#1DA1F2] text-white'
              : 'text-[#8899A6] hover:bg-[#1D9BF0]/10'
          }`}
        >
          Pausadas
        </button>

        <button
          onClick={() => setFiltro('concluidas')}
          className={`px-4 py-2 rounded-full ${
            filtro === 'concluidas'
              ? 'bg-[#1DA1F2] text-white'
              : 'text-[#8899A6] hover:bg-[#1D9BF0]/10'
          }`}
        >
          Concluídas
        </button>
      </div>

      {/* Lista de Tarefas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tarefasFiltradas.map((tarefa) => (
          <div
            key={tarefa.id}
            onClick={() => setTarefaSelecionada(tarefa)}
            className="bg-[#192734] p-4 rounded-xl border border-[#38444D] cursor-pointer hover:border-[#1DA1F2] transition-colors"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-lg font-medium text-white">{tarefa.titulo}</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {/* Funcionários atribuídos */}
                  {tarefa.funcionarios?.map((func) => (
                    <span
                      key={func.id}
                      className="inline-flex items-center px-2 py-1 bg-[#2C3C4C] rounded-full text-xs text-[#8899A6]"
                    >
                      {func.nome}
                    </span>
                  ))}
                  {/* Menções na descrição */}
                  {detectarMencoes(tarefa.descricao).map((nome, index) => (
                    <span
                      key={`mention-${index}`}
                      className="inline-flex items-center px-2 py-1 bg-[#1D40AF]/20 rounded-full text-xs text-[#60A5FA]"
                    >
                      @{nome}
                    </span>
                  ))}
                </div>
              </div>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  tarefa.status === 'pendente'
                    ? 'bg-yellow-500/10 text-yellow-500'
                    : tarefa.status === 'em_andamento'
                    ? 'bg-blue-500/10 text-blue-500'
                    : tarefa.status === 'pausada'
                    ? 'bg-orange-500/10 text-orange-500'
                    : 'bg-green-500/10 text-green-500'
                }`}
              >
                {tarefa.status === 'pendente'
                  ? 'Pendente'
                  : tarefa.status === 'em_andamento'
                  ? 'Em Andamento'
                  : tarefa.status === 'pausada'
                  ? 'Pausada'
                  : 'Concluída'}
              </span>
            </div>

            <p className="text-[#8899A6] mb-4">
              {tarefa.descricao.split(/(@\w+)/).map((parte, index) => {
                if (parte.startsWith('@')) {
                  return (
                    <span key={index} className="text-[#60A5FA]">
                      {parte}
                    </span>
                  );
                }
                return parte;
              })}
            </p>

            {/* Tempo da Tarefa */}
            {tarefa.dataInicio && (
              <div className="mb-4 text-sm">
                <span className="text-[#8899A6]">
                  Tempo {tarefa.status === 'concluida' ? 'total' : 'decorrido'}: {' '}
                  <span className="text-white">
                    {formatarTempo(tarefa.status === 'concluida' ? tarefa.tempoTotal : calcularTempoTotal(tarefa))}
                  </span>
                </span>
              </div>
            )}

            {/* Ações da Tarefa */}
            <div className="space-y-2">
              {tarefa.status === 'pendente' && (
                <button
                  onClick={() => handleIniciarTarefa(tarefa.id)}
                  className="w-full py-2 px-4 bg-[#1DA1F2] text-white rounded-full hover:bg-[#1a91da] transition-colors flex items-center justify-center gap-2"
                >
                  <PlayCircle className="w-4 h-4" />
                  Iniciar Tarefa
                </button>
              )}

              {tarefa.status === 'em_andamento' && tarefa.funcionariosAtribuidos?.some(f => f.id === usuario.id) && (
                <>
                  <button
                    onClick={() => handlePausarTarefa(tarefa.id)}
                    className="w-full py-2 px-4 bg-[#F7C52B] text-white rounded-full hover:bg-[#e0b226] transition-colors flex items-center justify-center gap-2"
                  >
                    <PauseCircle className="w-4 h-4" />
                    Pausar Tarefa
                  </button>
                  <button
                    onClick={() => {
                      const avaliacao = prompt('Avalie a tarefa de 1 a 5 estrelas:');
                      const comentario = prompt('Deixe um comentário sobre a tarefa:');
                      if (avaliacao && comentario) {
                        handleConcluirTarefa(tarefa.id, Number(avaliacao), comentario);
                      }
                    }}
                    className="w-full py-2 px-4 bg-[#00BA7C] text-white rounded-full hover:bg-[#00a36d] transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Concluir Tarefa
                  </button>
                </>
              )}

              {tarefa.status === 'pausada' && tarefa.funcionarioId === usuario.id && (
                <button
                  onClick={() => handleContinuarTarefa(tarefa.id)}
                  className="w-full py-2 px-4 bg-[#1DA1F2] text-white rounded-full hover:bg-[#1a91da] transition-colors flex items-center justify-center gap-2"
                >
                  <PlayCircle className="w-4 h-4" />
                  Continuar Tarefa
                </button>
              )}

              {/* Avaliação e Comentários */}
              {tarefa.status === 'concluida' && (
                <div className="mt-4 pt-4 border-t border-[#38444D]">
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < tarefa.avaliacao
                            ? 'text-yellow-500 fill-yellow-500'
                            : 'text-[#38444D]'
                        }`}
                      />
                    ))}
                  </div>
                  {tarefa.comentarioFuncionario && (
                    <p className="text-sm text-[#8899A6] mb-2">
                      <span className="font-medium text-white">Comentário do funcionário:</span>{' '}
                      {tarefa.comentarioFuncionario}
                    </p>
                  )}
                  {usuario.nivel >= NIVEIS_PERMISSAO.SUPERVISOR && (
                    <div className="mt-2">
                      {tarefa.comentarioSupervisor ? (
                        <p className="text-sm text-[#8899A6]">
                          <span className="font-medium text-white">Comentário do supervisor:</span>{' '}
                          {tarefa.comentarioSupervisor}
                        </p>
                      ) : (
                        <button
                          onClick={() => {
                            const comentario = prompt('Digite seu comentário sobre a tarefa:');
                            if (comentario) {
                              handleComentarioSupervisor(tarefa.id, comentario);
                            }
                          }}
                          className="text-sm text-[#1DA1F2] hover:underline"
                        >
                          Adicionar comentário
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Criar Tarefa */}
      {/* Modal de Criar Tarefa */}
      {showCriarTarefa && (
        <CriarTarefa 
          onClose={() => setShowCriarTarefa(false)} 
          funcionarios={funcionarios}
        />
      )}

      {/* Modal de Detalhes da Tarefa */}
      {tarefaSelecionada && (
        <DetalheTarefa
          tarefa={tarefaSelecionada}
          onClose={() => setTarefaSelecionada(null)}
        />
      )}
    </div>
  );
};

export default TarefasTab;
