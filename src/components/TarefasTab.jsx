import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useFuncionarios } from './Funcionarios/FuncionariosProvider';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Plus,
  Edit2,
  Trash2,
  X,
  Calendar,
  AlertCircle,
  ListTodo,
  Users,
  ChevronDown
} from 'lucide-react';
import { 
  ESTADOS_TAREFA, 
  ESTADOS_TAREFA_LABELS,
  PRIORIDADE_TAREFA,
  PRIORIDADE_TAREFA_LABELS
} from '../constants/tarefas';
import { NIVEIS_PERMISSAO } from './AlmoxarifadoJardim';

const TarefasTab = ({ usuario }) => {
  // Estados
  const { funcionarios } = useFuncionarios();
  const [tarefas, setTarefas] = useState([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [tarefaEditando, setTarefaEditando] = useState(null);
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [selecionandoResponsaveis, setSelecionandoResponsaveis] = useState(false);
  const [funcionariosSelecionados, setFuncionariosSelecionados] = useState([]);
  
  const [novaTarefa, setNovaTarefa] = useState({
    titulo: '',
    descricao: '',
    status: ESTADOS_TAREFA.PENDENTE,
    prioridade: PRIORIDADE_TAREFA.MEDIA,
    dataLimite: '',
    responsaveis: [], // Lista de IDs dos funcionários responsáveis
    categoria: '',
    observacoes: ''
  });

  // Carregar ferramentas emprestadas do usuário
  useEffect(() => {
    if (!usuario?.id) return;

    const carregarFerramentasEmprestadas = async () => {
      try {
        const emprestimosRef = collection(db, 'emprestimos');
        const q = query(
          emprestimosRef,
          where('funcionarioId', '==', usuario.id),
          where('status', '==', 'ativo')
        );

        const unsubscribe = onSnapshot(q, async (snapshot) => {
          const emprestimos = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

          // Buscar detalhes das ferramentas
          const inventarioRef = collection(db, 'inventario');
          const ferramentasPromises = emprestimos.map(async (emprestimo) => {
            const ferramentaDoc = await getDocs(
              query(inventarioRef, where('id', '==', emprestimo.ferramentaId))
            );
            const ferramentaData = ferramentaDoc.docs[0]?.data();
            return {
              ...emprestimo,
              ferramenta: ferramentaData || { nome: 'Ferramenta não encontrada' }
            };
          });

          const ferramentasCompletas = await Promise.all(ferramentasPromises);
          
          console.log('Ferramentas emprestadas:', ferramentasCompletas);
          setFerramentasEmprestadas(ferramentasCompletas);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Erro ao carregar ferramentas emprestadas:', error);
      }
    };

    carregarFerramentasEmprestadas();
  }, [usuario?.id]);

  // Carregar tarefas do usuário
  useEffect(() => {
    if (!usuario?.id || !funcionarios) {
      console.log('Usuário não autenticado ou funcionários não carregados:', {
        temId: !!usuario?.id,
        temFuncionarios: !!funcionarios,
        quantidadeFuncionarios: funcionarios?.length
      });
      return;
    }

    try {
      // Encontra o funcionário atual nos registros para logging
      const funcionarioAtual = funcionarios.find(f => f.id === usuario.id);
      
      // Log específico para debug do usuário "tche"
      const tcheFuncionario = funcionarios.find(f => f.nome?.toLowerCase().includes('tche'));
      if (tcheFuncionario) {
        console.log('DEBUG - Dados do funcionário Tche:', {
          id: tcheFuncionario.id,
          nome: tcheFuncionario.nome,
          nivel: tcheFuncionario.nivel,
          estaLogado: usuario.id === tcheFuncionario.id
        });
      }
      
      console.log('DEBUG - Dados do usuário e funcionários:', {
        usuarioId: usuario.id,
        funcionarioAtual: funcionarioAtual ? {
          id: funcionarioAtual.id,
          nome: funcionarioAtual.nome
        } : null,
        nivel: usuario.nivel,
        todosOsFuncionarios: funcionarios.map(f => ({
          id: f.id,
          nome: f.nome
        }))
      });

      const tarefasRef = collection(db, 'tarefas');
      let constraints = [];

      // Se não for admin, filtra por responsável
      if (usuario.nivel <= NIVEIS_PERMISSAO.FUNCIONARIO) {
        console.log('Aplicando filtro de responsável:', usuario.id);
        constraints.push(where('responsavel', '==', usuario.id));
      }

      // Adiciona filtro de status se não for 'todos'
      if (filtroStatus !== 'todos') {
        console.log('Aplicando filtro de status:', filtroStatus);
        constraints.push(where('status', '==', filtroStatus));
      }

      // Cria a query com todas as restrições
      // Constrói a query base
      let q;
      if (usuario.nivel > NIVEIS_PERMISSAO.FUNCIONARIO) {
        // Admin vê todas as tarefas
        console.log('DEBUG - Configurando query para admin');
        q = query(tarefasRef);
      } else {
        // Funcionário regular vê apenas suas tarefas
        console.log('DEBUG - Configurando query para funcionário regular:', {
          usuarioId: usuario.id,
          nome: funcionarioAtual?.nome,
          nivel: usuario.nivel
        });

        // Verifica se o campo 'responsavel' da tarefa corresponde ao ID do funcionário
        constraints.push(where('responsavel', '==', funcionarioAtual?.id || usuario.id));
        
        // Se tiver filtro de status, adiciona
        if (filtroStatus !== 'todos') {
          constraints.push(where('status', '==', filtroStatus));
        }
        
        q = query(tarefasRef, ...constraints);

        // Debug da query final
        console.log('DEBUG - Query final para busca de tarefas:', {
          responsavel: funcionarioAtual?.id || usuario.id,
          status: filtroStatus,
          constraints: constraints.map(c => ({
            field: c._field?.stringValue,
            operator: c._op?.toString(),
            value: c._value?.stringValue
          }))
        });
      }

      console.log('DEBUG - Query final configurada:', {
        ehAdmin: usuario.nivel > NIVEIS_PERMISSAO.FUNCIONARIO,
        filtros: {
          responsavel: usuario.id,
          status: filtroStatus !== 'todos' ? filtroStatus : 'todos'
        }
      });

      const unsubscribe = onSnapshot(q, (snapshot) => {
        console.log('DEBUG - Snapshot de tarefas recebido:', {
          quantidadeDocumentos: snapshot.docs.length,
          documentos: snapshot.docs.map(doc => ({
            id: doc.id,
            responsavel: doc.data().responsavel,
            titulo: doc.data().titulo
          }))
        });

        let tarefasData = snapshot.docs.map(doc => {
          const tarefa = {
            id: doc.id,
            ...doc.data()
          };
          // Adiciona informações do responsável
          const responsavel = funcionarios.find(f => f.id === tarefa.responsavel);
          
          console.log('DEBUG - Processando tarefa:', {
            tarefaId: tarefa.id,
            responsavelId: tarefa.responsavel,
            responsavelEncontrado: !!responsavel,
            responsavelNome: responsavel?.nome
          });
          
          return {
            ...tarefa,
            responsavelNome: responsavel?.nome || 'Não atribuído',
            responsavelInfo: responsavel
          };
        });

        // Se for admin, carrega todas as tarefas
        if (usuario.nivel > NIVEIS_PERMISSAO.FUNCIONARIO) {
          const todasTarefasRef = collection(db, 'tarefas');
          const todasTarefasQuery = query(todasTarefasRef);
          
          // Busca todas as tarefas em uma única chamada
          getDocs(todasTarefasQuery).then((todosSnapshot) => {
            tarefasData = todosSnapshot.docs.map(doc => {
              const tarefa = {
                id: doc.id,
                ...doc.data()
              };
              const responsavel = funcionarios.find(f => f.id === tarefa.responsavel);
              return {
                ...tarefa,
                responsavelNome: responsavel?.nome || 'Não atribuído',
                responsavelInfo: responsavel
              };
            });

            console.log('Todas as tarefas carregadas (admin):', {
              quantidade: tarefasData.length,
              tarefas: tarefasData.map(t => ({
                id: t.id,
                titulo: t.titulo,
                responsavel: t.responsavel,
                responsavelNome: t.responsavelNome,
                status: t.status
              }))
            });

            setTarefas(tarefasData);
          });
        } else {
          console.log('Tarefas do funcionário carregadas:', {
            quantidade: tarefasData.length,
            tarefas: tarefasData.map(t => ({
              id: t.id,
              titulo: t.titulo,
              responsavel: t.responsavel,
              responsavelNome: t.responsavelNome,
              status: t.status
            }))
          });

          setTarefas(tarefasData);
        }
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Erro ao configurar listener de tarefas:', error);
      alert('Erro ao carregar tarefas: ' + error.message);
    }
  }, [usuario]);

  // Adicionar nova tarefa
  const adicionarTarefa = async (e) => {
    e.preventDefault();
    
    try {
      // Validações
      if (!novaTarefa.titulo.trim()) {
        alert('Por favor, preencha o título da tarefa');
        return;
      }

      if (novaTarefa.responsaveis.length === 0) {
        alert('Por favor, selecione pelo menos um funcionário responsável');
        return;
      }

      // Debug dos dados da nova tarefa
      console.log('DEBUG - Dados da nova tarefa:', {
        titulo: novaTarefa.titulo,
        responsaveis: novaTarefa.responsaveis,
        status: novaTarefa.status,
        criadorId: usuario.id
      });

      // Verificar se o responsável existe
      const funcionariosSelecionados = funcionarios?.filter(f => novaTarefa.responsaveis.includes(f.id)) || [];
      
      // Debug dos funcionários selecionados
      console.log('DEBUG - Funcionários responsáveis:', funcionariosSelecionados.map(f => ({
        id: f.id,
        nome: f.nome,
        nivel: f.nivel
      })));
      
      console.log('Criando nova tarefa com dados:', {
        responsaveis: novaTarefa.responsaveis,
        funcionariosNomes: funcionariosSelecionados.map(f => f.nome),
        criadorId: usuario.id
      });

      const tarefaData = {
        ...novaTarefa,
        titulo: novaTarefa.titulo.trim(),
        descricao: novaTarefa.descricao.trim(),
        criadorId: usuario.id,
        responsavel: novaTarefa.responsavel, // ID do funcionário responsável
        status: ESTADOS_TAREFA.PENDENTE,
        dataCriacao: new Date().toISOString(),
        dataAtualizacao: new Date().toISOString()
      };
      
      console.log('Salvando nova tarefa no Firestore:', {
        ...tarefaData,
        responsavelNome: funcionarioSelecionado?.nome, // Apenas para debug
        responsavelId: novaTarefa.responsavel
      });
      
      // Salvar no Firestore
      const docRef = await addDoc(collection(db, 'tarefas'), tarefaData);
      console.log('Tarefa criada com ID:', docRef.id);
      
      setModalAberto(false);
      limparFormulario();
      
      // Feedback visual
      alert('Tarefa criada com sucesso!');
    } catch (error) {
      console.error('Erro ao adicionar tarefa:', error);
      alert('Erro ao criar tarefa: ' + error.message);
    }
  };

  // Atualizar tarefa existente
  const atualizarTarefa = async (e) => {
    e.preventDefault();
    try {
      const tarefaRef = doc(db, 'tarefas', tarefaEditando);
      const tarefa = {
        ...novaTarefa,
        dataAtualizacao: new Date().toISOString()
      };
      await updateDoc(tarefaRef, tarefa);
      setModalAberto(false);
      setTarefaEditando(null);
      limparFormulario();
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
    }
  };

  // Remover tarefa
  const removerTarefa = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir esta tarefa?')) return;
    try {
      await deleteDoc(doc(db, 'tarefas', id));
    } catch (error) {
      console.error('Erro ao remover tarefa:', error);
    }
  };

  // Abrir modal para edição
  const abrirModalEdicao = (tarefa) => {
    setTarefaEditando(tarefa.id);
    setNovaTarefa({
      titulo: tarefa.titulo,
      descricao: tarefa.descricao,
      status: tarefa.status,
      prioridade: tarefa.prioridade,
      dataLimite: tarefa.dataLimite,
      categoria: tarefa.categoria,
      observacoes: tarefa.observacoes,
      responsaveis: Array.isArray(tarefa.responsaveis) ? tarefa.responsaveis : [tarefa.responsavel]
    });
    setFuncionariosSelecionados(Array.isArray(tarefa.responsaveis) ? tarefa.responsaveis : [tarefa.responsavel]);
    setModalAberto(true);
  };

  // Limpar formulário
  const limparFormulario = () => {
    setNovaTarefa({
      titulo: '',
      descricao: '',
      status: ESTADOS_TAREFA.PENDENTE,
      prioridade: PRIORIDADE_TAREFA.MEDIA,
      dataLimite: '',
      responsaveis: [],
      categoria: '',
      observacoes: '',
      criadorId: ''
    });
    setFuncionariosSelecionados([]);
    setTarefaEditando(null);
    setSelecionandoResponsaveis(false);
  };

  // Função para formatar data
  const formatarData = (dataString) => {
    if (!dataString) return '';
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR');
  };

  // Filtrar e organizar tarefas por status
  const tarefasFiltradas = tarefas.filter(tarefa => {
    // Se for admin, mostra todas as tarefas
    if (usuario.nivel > NIVEIS_PERMISSAO.FUNCIONARIO) {
      return filtroStatus === 'todos' ? true : tarefa.status === filtroStatus;
    }
    
    // Para funcionários regulares, mostra apenas suas tarefas
    const ehResponsavel = tarefa.responsavel === usuario.id;
    if (!ehResponsavel) return false;
    
    return filtroStatus === 'todos' ? true : tarefa.status === filtroStatus;
  }).sort((a, b) => {
    // Ordenar por prioridade e status
    const prioridadeOrdem = {
      'alta': 0,
      'media': 1,
      'baixa': 2
    };
    
    const statusOrdem = {
      [ESTADOS_TAREFA.PENDENTE]: 0,
      [ESTADOS_TAREFA.EM_ANDAMENTO]: 1,
      [ESTADOS_TAREFA.CONCLUIDA]: 2
    };

    // Primeiro ordena por status
    if (statusOrdem[a.status] !== statusOrdem[b.status]) {
      return statusOrdem[a.status] - statusOrdem[b.status];
    }
    
    // Depois por prioridade
    return prioridadeOrdem[a.prioridade] - prioridadeOrdem[b.prioridade];
  });

  // Estatísticas
  const estatisticas = {
    total: tarefas.length,
    pendentes: tarefas.filter(t => t.status === ESTADOS_TAREFA.PENDENTE).length,
    emAndamento: tarefas.filter(t => t.status === ESTADOS_TAREFA.EM_ANDAMENTO).length,
    concluidas: tarefas.filter(t => t.status === ESTADOS_TAREFA.CONCLUIDA).length
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#1D9BF0] bg-opacity-10 rounded-lg flex items-center justify-center">
            <ListTodo className="w-5 h-5 text-[#1D9BF0]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#FFFFFF]">Minhas Tarefas</h2>
            <p className="text-[#8899A6]">Gerencie suas tarefas e atividades</p>
          </div>
        </div>

        {usuario?.nivel > NIVEIS_PERMISSAO.FUNCIONARIO && (
          <button
            onClick={() => {
              limparFormulario();
              setModalAberto(true);
            }}
            className="bg-[#1DA1F2] text-white rounded-full px-4 py-2 flex items-center justify-center gap-2 hover:bg-[#1a91da] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nova Tarefa
          </button>
        )}
      </div>      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#192734] border border-[#38444D] rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#1D9BF0] bg-opacity-10 rounded-lg">
              <AlertCircle className="w-6 h-6 text-[#1D9BF0]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#8899A6]">Total</p>
              <p className="text-2xl font-bold text-[#FFFFFF]">{estatisticas.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-[#192734] border border-[#38444D] rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#FFD700] bg-opacity-10 rounded-lg">
              <Clock className="w-6 h-6 text-[#FFD700]" />
            </div>
            <div>
              <p className={`text-sm font-medium text-[#FFD700]`}>Pendentes</p>
              <p className="text-2xl font-bold text-[#FFFFFF]">{estatisticas.pendentes}</p>
            </div>
          </div>
        </div>
        <div className="bg-[#192734] border border-[#38444D] rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#1D9BF0] bg-opacity-10 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-[#1D9BF0]" />
            </div>
            <div>
              <p className={`text-sm font-medium text-[#1D9BF0]`}>Em Andamento</p>
              <p className="text-2xl font-bold text-[#FFFFFF]">{estatisticas.emAndamento}</p>
            </div>
          </div>
        </div>
        <div className="bg-[#192734] border border-[#38444D] rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#00BA7C] bg-opacity-10 rounded-lg">
              <CheckCircle2 className="w-6 h-6 text-[#00BA7C]" />
            </div>
            <div>
              <p className={`text-sm font-medium text-[#00BA7C]`}>Concluídas</p>
              <p className="text-2xl font-bold text-[#FFFFFF]">{estatisticas.concluidas}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        <button
          onClick={() => setFiltroStatus('todos')}
          className={
            'px-3 py-1 rounded-full text-sm font-medium transition-colors ' +
            (filtroStatus === 'todos'
              ? 'bg-[#1D9BF0] bg-opacity-10 text-[#1D9BF0]'
              : 'bg-[#253341] hover:bg-[#2C3640] text-[#8899A6]')
          }
        >
          Todas
        </button>
        {Object.entries(ESTADOS_TAREFA).map(([key, value]) => {
          const colorMap = {
            [ESTADOS_TAREFA.PENDENTE]: '#FFD700',
            [ESTADOS_TAREFA.EM_ANDAMENTO]: '#1D9BF0',
            [ESTADOS_TAREFA.CONCLUIDA]: '#00BA7C',
          };
          const color = colorMap[value];
          
          return (
            <button
              key={key}
              onClick={() => setFiltroStatus(value)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filtroStatus === value
                  ? `bg-[${color}] bg-opacity-10 text-[${color}]`
                  : 'bg-[#253341] hover:bg-[#2C3640] text-[#8899A6]'
              }`}
            >
              {ESTADOS_TAREFA_LABELS[value]}
            </button>
          );
        })}
      </div>

      {/* Lista de Tarefas */}
      <div className="space-y-4">
        {tarefasFiltradas.map((tarefa) => (
          <div
            key={tarefa.id}
            className="bg-[#192734] border border-[#38444D] rounded-lg p-4"
          >
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <h3 className="font-medium text-[#FFFFFF]">{tarefa.titulo}</h3>
                <p className="text-sm text-[#8899A6]">{tarefa.descricao}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm font-medium text-[#8899A6]">Responsável:</span>
                  <span className="text-sm text-[#FFFFFF] bg-[#1D9BF0] bg-opacity-5 px-2 py-1 rounded-full">
                    {funcionarios?.find(f => f.id === tarefa.responsavel)?.nome || 'Não atribuído'}
                  </span>
                </div>
              </div>
              {usuario?.nivel > NIVEIS_PERMISSAO.FUNCIONARIO && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => abrirModalEdicao(tarefa)}
                    className="p-2 hover:bg-[#1D9BF0] hover:bg-opacity-10 rounded-full transition-colors"
                  >
                    <Edit2 className="w-4 h-4 text-[#1D9BF0]" />
                  </button>
                  <button
                    onClick={() => removerTarefa(tarefa.id)}
                    className="p-2 hover:bg-[#F4212E] hover:bg-opacity-10 rounded-full transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-[#F4212E]" />
                  </button>
                </div>
              )}
            </div>
            
            <div className="mt-4 flex flex-wrap gap-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                tarefa.status === ESTADOS_TAREFA.PENDENTE ? 'bg-[#FFD700] bg-opacity-10 text-[#FFD700]' :
                tarefa.status === ESTADOS_TAREFA.EM_ANDAMENTO ? 'bg-[#1D9BF0] bg-opacity-10 text-[#1D9BF0]' :
                'bg-[#00BA7C] bg-opacity-10 text-[#00BA7C]'
              }`}>
                {ESTADOS_TAREFA_LABELS[tarefa.status]}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                tarefa.prioridade === PRIORIDADE_TAREFA.ALTA ? 'bg-[#F4212E] bg-opacity-10 text-[#F4212E]' :
                tarefa.prioridade === PRIORIDADE_TAREFA.MEDIA ? 'bg-[#1D9BF0] bg-opacity-10 text-[#1D9BF0]' :
                'bg-[#00BA7C] bg-opacity-10 text-[#00BA7C]'
              }`}>
                {PRIORIDADE_TAREFA_LABELS[tarefa.prioridade]}
              </span>
              {tarefa.categoria && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-[#1D9BF0] bg-opacity-10 text-[#1D9BF0]">
                  {tarefa.categoria}
                </span>
              )}
              {tarefa.dataLimite && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-[#253341] text-[#FFFFFF] flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatarData(tarefa.dataLimite)}
                </span>
              )}
            </div>
            
            {tarefa.observacoes && (
              <p className="mt-2 text-sm text-[#8899A6]">{tarefa.observacoes}</p>
            )}
          </div>
        ))}

        {tarefasFiltradas.length === 0 && (
          <div className="bg-[#192734] border border-[#38444D] rounded-lg text-center py-12">
            <div className="flex justify-center mb-4">
              <AlertCircle className={`w-12 h-12 text-[#1D9BF0]`} />
            </div>
            <h3 className="text-lg font-medium text-[#FFFFFF]">Nenhuma tarefa encontrada</h3>
            <p className="text-[#8899A6]">Não existem tarefas para os filtros selecionados.</p>
          </div>
        )}
      </div>

      {/* Modal de Adicionar/Editar */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#192734] border border-[#38444D] rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-[#253341] p-6 rounded-xl">
              {/* Header do Modal */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-[#FFFFFF]">
                  {tarefaEditando ? 'Editar Tarefa' : 'Nova Tarefa'}
                </h3>
                <button
                  onClick={() => {
                    setModalAberto(false);
                    limparFormulario();
                  }}
                  className="text-[#8899A6] hover:text-[#FFFFFF] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={tarefaEditando ? atualizarTarefa : adicionarTarefa} className="space-y-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-[#FFFFFF] mb-2">
                      Título
                    </label>
                    <input
                      type="text"
                      value={novaTarefa.titulo}
                      onChange={(e) => setNovaTarefa({ ...novaTarefa, titulo: e.target.value })}
                      className="w-full bg-[#253341] border border-[#38444D] rounded-lg px-4 py-2 text-[#FFFFFF] focus:border-[#1D9BF0] focus:ring-1 focus:ring-[#1D9BF0]"
                      placeholder="Digite o título da tarefa"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#FFFFFF] mb-2">
                      Data Limite
                    </label>
                    <input
                      type="datetime-local"
                      value={novaTarefa.dataLimite}
                      onChange={(e) => setNovaTarefa({ ...novaTarefa, dataLimite: e.target.value })}
                      className="w-full bg-[#253341] border border-[#38444D] rounded-lg px-4 py-2 text-[#FFFFFF] focus:border-[#1D9BF0] focus:ring-1 focus:ring-[#1D9BF0]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#FFFFFF] mb-2">
                    Descrição
                  </label>
                  <textarea
                    value={novaTarefa.descricao}
                    onChange={(e) => setNovaTarefa({ ...novaTarefa, descricao: e.target.value })}
                    rows={3}
                    className="w-full bg-[#253341] border border-[#38444D] rounded-lg px-4 py-2 text-[#FFFFFF] focus:border-[#1D9BF0] focus:ring-1 focus:ring-[#1D9BF0]"
                    placeholder="Descreva os detalhes da tarefa"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-[#FFFFFF] mb-2">
                      Prioridade
                    </label>
                    <select
                      value={novaTarefa.prioridade}
                      onChange={(e) => setNovaTarefa({ ...novaTarefa, prioridade: e.target.value })}
                      className="w-full bg-[#253341] border border-[#38444D] rounded-lg px-4 py-2 text-[#FFFFFF] focus:border-[#1D9BF0] focus:ring-1 focus:ring-[#1D9BF0]"
                    >
                      {Object.entries(PRIORIDADE_TAREFA_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#FFFFFF] mb-2">
                      Responsáveis
                    </label>
                    <div className="flex flex-col gap-2">
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setSelecionandoResponsaveis(!selecionandoResponsaveis)}
                          className="w-full bg-[#253341] border border-[#38444D] rounded-lg px-4 py-2 text-[#FFFFFF] focus:border-[#1D9BF0] focus:ring-1 focus:ring-[#1D9BF0] flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-[#8899A6]" />
                            <span className="text-[#FFFFFF]">
                              {funcionariosSelecionados.length > 0
                                ? `${funcionariosSelecionados.length} selecionado(s)`
                                : 'Selecionar funcionários...'}
                            </span>
                          </div>
                          <ChevronDown className={`w-4 h-4 text-[#8899A6] transition-transform ${
                            selecionandoResponsaveis ? 'rotate-180' : ''
                          }`} />
                        </button>
                        
                        {selecionandoResponsaveis && (
                          <div className="absolute z-10 mt-1 w-full bg-[#253341] border border-[#38444D] rounded-lg shadow-lg">
                            <div className="p-2 max-h-48 overflow-y-auto">
                              {funcionarios?.map((funcionario) => (
                                <label
                                  key={funcionario.id}
                                  className="flex items-center gap-2 px-2 py-1 hover:bg-[#192734] rounded cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    checked={funcionariosSelecionados.includes(funcionario.id)}
                                    onChange={() => {
                                      const isSelected = funcionariosSelecionados.includes(funcionario.id);
                                      const newSelecionados = isSelected
                                        ? funcionariosSelecionados.filter(id => id !== funcionario.id)
                                        : [...funcionariosSelecionados, funcionario.id];
                                      setFuncionariosSelecionados(newSelecionados);
                                      setNovaTarefa({ ...novaTarefa, responsaveis: newSelecionados });
                                    }}
                                    className="text-[#1D9BF0] bg-[#253341] border-[#38444D] rounded focus:ring-[#1D9BF0]"
                                  />
                                  <span className="text-[#FFFFFF]">{funcionario.nome}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-2 flex flex-wrap gap-2">
                        {funcionariosSelecionados.map((id) => {
                          const funcionario = funcionarios?.find(f => f.id === id);
                          if (!funcionario) return null;
                          
                          return (
                            <span
                              key={id}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-[#1D9BF0] bg-opacity-10 text-[#1D9BF0] rounded-full text-sm"
                            >
                              {funcionario.nome}
                              <button
                                type="button"
                                onClick={() => {
                                  const newSelecionados = funcionariosSelecionados.filter(fid => fid !== id);
                                  setFuncionariosSelecionados(newSelecionados);
                                  setNovaTarefa({ ...novaTarefa, responsaveis: newSelecionados });
                                }}
                                className="hover:text-[#FFFFFF] transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-6">
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#1D9BF0] hover:bg-[#1A8CD8] rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    {tarefaEditando ? 'Salvar Alterações' : 'Criar Tarefa'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TarefasTab;
