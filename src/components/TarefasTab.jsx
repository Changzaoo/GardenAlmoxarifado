import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useFuncionarios } from './Funcionarios/FuncionariosProvider';
import TarefaCard from './TarefaCard';
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
  Tag
} from 'lucide-react';
import { 
  ESTADOS_TAREFA, 
  ESTADOS_TAREFA_LABELS, 
  ESTADOS_TAREFA_COLORS,
  PRIORIDADE_TAREFA,
  PRIORIDADE_TAREFA_LABELS,
  PRIORIDADE_TAREFA_COLORS
} from '../constants/tarefas';
import { NIVEIS_PERMISSAO } from './AlmoxarifadoJardim';

// Componente principal
const TarefasTab = ({ usuario }) => {
  // Estados
  const { funcionarios } = useFuncionarios();
  const [tarefas, setTarefas] = useState([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [tarefaEditando, setTarefaEditando] = useState(null);
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [ferramentasEmprestadas, setFerramentasEmprestadas] = useState([]);
  
  const [novaTarefa, setNovaTarefa] = useState({
    titulo: '',
    descricao: '',
    status: ESTADOS_TAREFA.PENDENTE,
    prioridade: PRIORIDADE_TAREFA.MEDIA,
    dataLimite: '',
    responsavel: '', // ID do funcionário responsável
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

      if (!novaTarefa.responsavel) {
        alert('Por favor, selecione um funcionário responsável');
        return;
      }

      // Debug dos dados da nova tarefa
      console.log('DEBUG - Dados da nova tarefa:', {
        titulo: novaTarefa.titulo,
        responsavel: novaTarefa.responsavel,
        status: novaTarefa.status,
        criadorId: usuario.id
      });

      // Verificar se o responsável existe
      const funcionarioSelecionado = funcionarios?.find(f => f.id === novaTarefa.responsavel);
      
      // Debug do funcionário selecionado
      console.log('DEBUG - Funcionário responsável:', funcionarioSelecionado ? {
        id: funcionarioSelecionado.id,
        nome: funcionarioSelecionado.nome,
        nivel: funcionarioSelecionado.nivel
      } : 'Não encontrado');
      
      console.log('Criando nova tarefa com dados:', {
        responsavel: novaTarefa.responsavel,
        funcionarioNome: funcionarioSelecionado?.nome,
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
      responsavel: tarefa.responsavel // Mantém o responsável atual
    });
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
      categoria: '',
      observacoes: '',
      responsavel: '', // Limpa o responsável selecionado
      criadorId: '' // Limpa o criador
    });
    setTarefaEditando(null);
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Minhas Tarefas</h2>
          <p className="text-gray-600">Gerencie suas tarefas e atividades</p>
        </div>
        {usuario?.nivel > NIVEIS_PERMISSAO.FUNCIONARIO && (
          <button
            onClick={() => {
              limparFormulario();
              setModalAberto(true);
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nova Tarefa
          </button>
        )}
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded">
              <AlertCircle className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{estatisticas.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-yellow-600">Pendentes</p>
              <p className="text-2xl font-bold text-gray-900">{estatisticas.pendentes}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded">
              <AlertTriangle className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-600">Em Andamento</p>
              <p className="text-2xl font-bold text-gray-900">{estatisticas.emAndamento}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-green-600">Concluídas</p>
              <p className="text-2xl font-bold text-gray-900">{estatisticas.concluidas}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        <button
          onClick={() => setFiltroStatus('todos')}
          className={
            'px-3 py-1 rounded-full text-sm font-medium ' +
            (filtroStatus === 'todos'
              ? 'bg-gray-200 text-gray-800'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200')
          }
        >
          Todas
        </button>
        {Object.entries(ESTADOS_TAREFA).map(([key, value]) => (
          <button
            key={key}
            onClick={() => setFiltroStatus(value)}
            className={'px-3 py-1 rounded-full text-sm font-medium ' + 
              (filtroStatus === value
                ? ESTADOS_TAREFA_COLORS[value]
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200')
            }
          >
            {ESTADOS_TAREFA_LABELS[value]}
          </button>
        ))}
      </div>

      {/* Lista de Tarefas */}
      <div className="space-y-4">
        {tarefasFiltradas.map((tarefa) => (
          <div
            key={tarefa.id}
            className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:border-gray-300 transition-colors"
          >
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <h3 className="font-medium text-gray-900">{tarefa.titulo}</h3>
                <p className="text-gray-600 text-sm">{tarefa.descricao}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm font-medium text-gray-600">Responsável:</span>
                  <span className="text-sm text-gray-800 bg-gray-100 px-2 py-1 rounded-md">
                    {funcionarios?.find(f => f.id === tarefa.responsavel)?.nome || 'Não atribuído'}
                  </span>
                </div>
              </div>
              {usuario?.nivel > NIVEIS_PERMISSAO.FUNCIONARIO && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => abrirModalEdicao(tarefa)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => removerTarefa(tarefa.id)}
                    className="p-1 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            
            <div className="mt-4 flex flex-wrap gap-2">
              <span className={'px-2 py-1 rounded-full text-xs font-medium ' + ESTADOS_TAREFA_COLORS[tarefa.status]}>
                {ESTADOS_TAREFA_LABELS[tarefa.status]}
              </span>
              <span className={'px-2 py-1 rounded-full text-xs font-medium ' + PRIORIDADE_TAREFA_COLORS[tarefa.prioridade]}>
                {PRIORIDADE_TAREFA_LABELS[tarefa.prioridade]}
              </span>
              {tarefa.categoria && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  {tarefa.categoria}
                </span>
              )}
              {tarefa.dataLimite && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatarData(tarefa.dataLimite)}
                </span>
              )}
            </div>
            
            {tarefa.observacoes && (
              <p className="mt-2 text-sm text-gray-500">{tarefa.observacoes}</p>
            )}
          </div>
        ))}

        {tarefasFiltradas.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <div className="flex justify-center mb-4">
              <AlertCircle className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">Nenhuma tarefa encontrada</h3>
            <p className="text-gray-500">Não existem tarefas para os filtros selecionados.</p>
          </div>
        )}
      </div>

      {/* Modal de Adicionar/Editar */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">
                  {tarefaEditando ? 'Editar Tarefa' : 'Nova Tarefa'}
                </h3>
                <button
                  onClick={() => {
                    setModalAberto(false);
                    limparFormulario();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={tarefaEditando ? atualizarTarefa : adicionarTarefa} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título
                  </label>
                  <input
                    type="text"
                    value={novaTarefa.titulo}
                    onChange={(e) => setNovaTarefa({ ...novaTarefa, titulo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição
                  </label>
                  <textarea
                    value={novaTarefa.descricao}
                    onChange={(e) => setNovaTarefa({ ...novaTarefa, descricao: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={novaTarefa.status}
                      onChange={(e) => setNovaTarefa({ ...novaTarefa, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      {Object.entries(ESTADOS_TAREFA_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prioridade
                    </label>
                    <select
                      value={novaTarefa.prioridade}
                      onChange={(e) => setNovaTarefa({ ...novaTarefa, prioridade: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      {Object.entries(PRIORIDADE_TAREFA_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data Limite
                    </label>
                    <input
                      type="date"
                      value={novaTarefa.dataLimite}
                      onChange={(e) => setNovaTarefa({ ...novaTarefa, dataLimite: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Funcionário Responsável
                    </label>
                    <select
                      value={novaTarefa.responsavel || ''}
                      onChange={(e) => setNovaTarefa({ ...novaTarefa, responsavel: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    >
                      <option value="">Selecione um funcionário</option>
                      {funcionarios?.map((funcionario) => (
                        <option key={funcionario.id} value={funcionario.id}>
                          {funcionario.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Categoria
                    </label>
                    <input
                      type="text"
                      value={novaTarefa.categoria}
                      onChange={(e) => setNovaTarefa({ ...novaTarefa, categoria: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Ex: Manutenção, Limpeza, etc"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observações
                  </label>
                  <textarea
                    value={novaTarefa.observacoes}
                    onChange={(e) => setNovaTarefa({ ...novaTarefa, observacoes: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Observações adicionais..."
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setModalAberto(false);
                      limparFormulario();
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
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
