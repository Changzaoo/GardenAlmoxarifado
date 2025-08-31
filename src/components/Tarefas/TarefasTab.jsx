import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, updateDoc, doc } from 'firebase/firestore';
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
  const [filtro, setFiltro] = useState('todas');
  const [tarefaSelecionada, setTarefaSelecionada] = useState(null);
  const [temposDecorridos, setTemposDecorridos] = useState({});

  useEffect(() => {
    const q = query(collection(db, 'tarefas'), orderBy('dataCriacao', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tarefasData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTarefas(tarefasData);
      
      // Inicializar tempos decorridos
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

  // Atualizar tempos a cada segundo
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

  // Separar tarefas por status
  const tarefasPendentes = tarefas.filter(t => t.status === 'pendente');
  const tarefasEmAndamento = tarefas.filter(t => t.status === 'em_andamento');
  const tarefasPausadas = tarefas.filter(t => t.status === 'pausada');
  const tarefasConcluidas = tarefas.filter(t => t.status === 'concluida');

  // Filtrar tarefas
  const filtrarTarefas = (tarefasLista) => {
    return tarefasLista.filter(tarefa => {
      const isUserAssigned = tarefa.funcionariosIds?.includes(usuario.nome) || 
                            tarefa.funcionarios?.some(f => f.nome === usuario.nome);

      if (usuario.nivel === NIVEIS_PERMISSAO.FUNCIONARIO) {
        return isUserAssigned;
      }

      switch (filtro) {
        case 'minhas':
          return isUserAssigned;
        case 'todas':
        default:
          return true;
      }
    });
  };

  // Aplicar filtros
  const tarefasPendentesFiltradas = filtrarTarefas(tarefasPendentes);
  const tarefasEmAndamentoFiltradas = filtrarTarefas(tarefasEmAndamento);
  const tarefasPausadasFiltradas = filtrarTarefas(tarefasPausadas);
  const tarefasConcluidasFiltradas = filtrarTarefas(tarefasConcluidas);

  const renderTarefaCard = (tarefa) => (
    <div
      key={tarefa.id}
      onClick={() => setTarefaSelecionada(tarefa)}
      className={`bg-[#192734] p-4 rounded-xl border border-[#38444D] cursor-pointer hover:border-[#1DA1F2] transition-colors ${
        tarefa.status === 'pendente' ? 'border-l-4 border-l-yellow-500' :
        tarefa.status === 'em_andamento' ? 'border-l-4 border-l-blue-500' :
        tarefa.status === 'pausada' ? 'border-l-4 border-l-orange-500' :
        'border-l-4 border-l-green-500'
      }`}
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-medium text-white">{tarefa.titulo}</h3>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          tarefa.status === 'pendente' ? 'bg-yellow-500/10 text-yellow-500' :
          tarefa.status === 'em_andamento' ? 'bg-blue-500/10 text-blue-500' :
          tarefa.status === 'pausada' ? 'bg-orange-500/10 text-orange-500' :
          'bg-green-500/10 text-green-500'
        }`}>
          {tarefa.status === 'pendente' ? 'Pendente' :
           tarefa.status === 'em_andamento' ? 'Em Andamento' :
           tarefa.status === 'pausada' ? 'Pausada' :
           'Concluída'}
        </span>
      </div>

      <p className="text-[#8899A6] mb-4">{tarefa.descricao}</p>

      {/* Tempo Estimado */}
      <div className="text-sm text-[#8899A6] mb-4">
        Tempo estimado: <span className="text-white">{tarefa.tempoEstimado || 'Não definido'}</span>
      </div>

      {/* Avaliações */}
      <div className="flex flex-col items-end gap-2 mt-2 mb-4">
        {/* Nota do supervisor (dada pelo colaborador) - visível apenas para supervisores */}
        {usuario.nivel >= NIVEIS_PERMISSAO.SUPERVISOR && (
          <div>
            <div className="text-xs text-[#8899A6] mb-1">Supervisor:</div>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    tarefa.status === 'concluida' && i < (tarefa.notaFuncionario || 0)
                      ? 'text-yellow-500 fill-yellow-500'
                      : 'text-[#38444D]'
                  }`}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* Nota da tarefa (dada pelo colaborador) */}
        <div>
          <div className="text-xs text-[#8899A6] mb-1">Colaborador:</div>
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  tarefa.status === 'concluida' && i < (tarefa.notaTarefa || 0)
                    ? 'text-yellow-500 fill-yellow-500'
                    : 'text-[#38444D]'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Nota Final (média das avaliações) */}
        {tarefa.status === 'concluida' && tarefa.notaTarefa && tarefa.notaFuncionario && (
          <div className="mt-2 border-t border-[#38444D] pt-2">
            <div className="text-xs text-[#8899A6] mb-1">Nota Final:</div>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => {
                const notaMedia = (tarefa.notaTarefa + tarefa.notaFuncionario) / 2;
                const starFill = i < Math.floor(notaMedia);
                const starHalf = !starFill && i < Math.ceil(notaMedia) && notaMedia % 1 >= 0.5;
                
                return (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      starFill || starHalf ? 'text-yellow-500 fill-yellow-500' : 'text-[#38444D]'
                    }`}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>

      {tarefa.dataInicio && (
        <div className="text-sm text-[#8899A6] mb-4">
          Tempo {tarefa.status === 'concluida' ? 'total' : 'decorrido'}: {' '}
          <span className="text-white">
            {formatarTempo(tarefa.status === 'concluida' ? tarefa.tempoTotal : calcularTempoTotal(tarefa))}
          </span>
        </div>
      )}

      {tarefa.status !== 'concluida' && (
        <div className="flex gap-2 mt-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePausarTarefa(tarefa.id);
            }}
            className="flex-1 py-2 px-4 bg-[#F7C52B] text-white rounded-full hover:bg-[#e0b226] transition-colors flex items-center justify-center gap-2"
          >
            <PauseCircle className="w-4 h-4" />
            Pausar
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              const avaliacao = prompt('Avalie a tarefa de 1 a 5 estrelas:');
              const comentario = prompt('Deixe um comentário sobre a tarefa:');
              if (avaliacao && comentario) {
                handleConcluirTarefa(tarefa.id, Number(avaliacao), comentario);
              }
            }}
            className="flex-1 py-2 px-4 bg-[#00BA7C] text-white rounded-full hover:bg-[#00a36d] transition-colors flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            Concluir
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header e Filtros */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div>          
            <p className="text-[#8899A6]">
              {usuario.nivel === NIVEIS_PERMISSAO.FUNCIONARIO
                }
            </p>
          </div>
          <div className="flex gap-2">
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
          </div>
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

      {/* Seções de Tarefas */}
      <div className="space-y-4">
        {/* Em Andamento */}
        {tarefasEmAndamentoFiltradas.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-white mb-3 flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              Em Andamento ({tarefasEmAndamentoFiltradas.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tarefasEmAndamentoFiltradas.map(renderTarefaCard)}
            </div>
          </div>
        )}

        {/* Pendentes */}
        {tarefasPendentesFiltradas.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-white mb-3 flex items-center">
              <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
              Pendentes ({tarefasPendentesFiltradas.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tarefasPendentesFiltradas.map(renderTarefaCard)}
            </div>
          </div>
        )}

        {/* Pausadas */}
        {tarefasPausadasFiltradas.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-white mb-3 flex items-center">
              <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
              Pausadas ({tarefasPausadasFiltradas.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tarefasPausadasFiltradas.map(renderTarefaCard)}
            </div>
          </div>
        )}

        {/* Concluídas */}
        {tarefasConcluidasFiltradas.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-white mb-4 flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              Concluídas ({tarefasConcluidasFiltradas.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tarefasConcluidasFiltradas.map(renderTarefaCard)}
            </div>
          </div>
        )}
      </div>

      {/* Modais */}
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
        />
      )}
    </div>
  );
};

export default TarefasTab;
