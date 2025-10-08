import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { storage, db } from '../../firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useToast } from '../ToastProvider';
import FuncionarioProfile from './FuncionarioProfile';
import { 
  UsersRound, 
  Users, 
  UserX, 
  Plus, 
  Search, 
  Filter, 
  Grid3X3, 
  List,
  Star,
  TrendingUp,
  Award,
  Target,
  Sparkles,
  User,
  Crown,
  Trophy,
  Building2,
  ChevronDown,
  X
} from 'lucide-react';
import GruposModal from './components/GruposModal';
import ModalUnificarDuplicados from './components/ModalUnificarDuplicados';

// Importando os componentes refatorados
import FormularioAdicao from './components/FormularioAdicao';
import BarraBuscaModerna from './components/BarraBuscaModerna';
import CardFuncionarioModerno from './components/CardFuncionarioModerno';
import ModalEditar from './components/ModalEditar';
import ModalConfirmacao from './components/ModalConfirmacao';
import ModalDetalhesEstatisticas from './components/ModalDetalhesEstatisticas';

// Função para formatar número de telefone
const formatarTelefone = (telefone) => {
  const cleaned = telefone.replace(/\D/g, '');
  let match = cleaned.match(/^(\d{2})(\d{4,5})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return telefone;
};

const FuncionariosTab = ({ funcionarios = [], adicionarFuncionario, removerFuncionario, atualizarFuncionario, readonly }) => {
  const [novoFuncionario, setNovoFuncionario] = useState({ nome: '', cargo: '', telefone: '' });
  const [showGruposModal, setShowGruposModal] = useState(false);
  const [showUnificarModal, setShowUnificarModal] = useState(false);
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [editando, setEditando] = useState(null);
  const [formEdit, setFormEdit] = useState({ nome: '', cargo: '', telefone: '', photoURL: '' });
  const [modalConfirmacao, setModalConfirmacao] = useState(false);
  const [funcionarioParaExcluir, setFuncionarioParaExcluir] = useState(null);
  const [preview, setPreview] = useState(null);
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [funcionariosStats, setFuncionariosStats] = useState({});
  const [funcionariosPontos, setFuncionariosPontos] = useState({});
  const [filtroAtual, setFiltroAtual] = useState('nome');
  const [avaliacoesExpandidas, setAvaliacoesExpandidas] = useState(null);
  const [avaliacoesDesempenhoExpandidas, setAvaliacoesDesempenhoExpandidas] = useState(null);
  const [estatisticaExpandida, setEstatisticaExpandida] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const fileInputRef = useRef();
  
  // Estados para filtros de empresa e setor
  const [empresas, setEmpresas] = useState([]);
  const [setores, setSetores] = useState([]);
  const [empresaSelecionada, setEmpresaSelecionada] = useState('todas');
  const [setorSelecionado, setSetorSelecionado] = useState('todos');

  const calcularPontuacao = (dados) => {
    const pontosPorFerramentasDevolvidas = (dados.ferramentasDevolvidas || 0) * 20;
    const pontosPorTarefasConcluidas = (dados.tarefasConcluidas || 0) * 50;
    const pontosPorAvaliacao = dados.mediaAvaliacao ? Math.round(dados.mediaAvaliacao * 10) : 0;

    return {
      total: pontosPorFerramentasDevolvidas + pontosPorTarefasConcluidas + pontosPorAvaliacao,
      detalhes: {
        ferramentas: pontosPorFerramentasDevolvidas,
        tarefas: pontosPorTarefasConcluidas,
        avaliacao: pontosPorAvaliacao
      }
    };
  };

  // Funções de ordenação
  const ordenarPorNome = (a, b) => a.nome.localeCompare(b.nome);
  const ordenarPorAvaliacao = (a, b) => (
    (funcionariosStats[b.id]?.mediaAvaliacao || 0) - (funcionariosStats[a.id]?.mediaAvaliacao || 0)
  );
  const ordenarPorTarefasConcluidas = (a, b) => (
    (funcionariosStats[b.id]?.tarefasConcluidas || 0) - (funcionariosStats[a.id]?.tarefasConcluidas || 0)
  );
  const ordenarPorEmprestimos = (a, b) => (
    (funcionariosStats[b.id]?.emprestimosAtivos || 0) - (funcionariosStats[a.id]?.emprestimosAtivos || 0)
  );
  const ordenarPorPontos = (a, b) => (
    (funcionariosPontos[b.id]?.total || 0) - (funcionariosPontos[a.id]?.total || 0)
  );

  // Função para obter a função de ordenação atual
  const getFuncaoOrdenacao = () => {
    switch (filtroAtual) {
      case 'avaliacao':
        return ordenarPorAvaliacao;
      case 'tarefas':
        return ordenarPorTarefasConcluidas;
      case 'emprestimos':
        return ordenarPorEmprestimos;
      case 'pontos':
        return ordenarPorPontos;
      case 'demitidos':
        return ordenarPorNome; // Para demitidos, usar ordenação por nome
      default:
        return ordenarPorNome;
    }
  };

  // Função para demitir funcionário
  const demitirFuncionario = async (funcionario) => {
    try {
      const funcionarioAtualizado = {
        ...funcionario,
        demitido: true,
        dataDemissao: new Date().toISOString()
      };
      
      await atualizarFuncionario(funcionario.id, funcionarioAtualizado);
      showToast('Funcionário demitido com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao demitir funcionário:', error);
      showToast('Erro ao demitir funcionário', 'error');
    }
  };

  // Função para reintegrar funcionário
  const reintegrarFuncionario = async (funcionario) => {
    try {
      const funcionarioAtualizado = {
        ...funcionario,
        demitido: false,
        dataDemissao: null,
        dataReintegracao: new Date().toISOString()
      };
      
      await atualizarFuncionario(funcionario.id, funcionarioAtualizado);
      showToast('Funcionário reintegrado com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao reintegrar funcionário:', error);
      showToast('Erro ao reintegrar funcionário', 'error');
    }
  };

  // Função para calcular a média de avaliações de desempenho
  const calcularMediaAvaliacoesDesempenho = (avaliacoes) => {
    if (!avaliacoes || avaliacoes.length === 0) return 0;
    const avaliacoesDesempenho = avaliacoes.filter(av => av.tipo === 'desempenho');
    if (avaliacoesDesempenho.length === 0) return 0;
    
    const soma = avaliacoesDesempenho.reduce((acc, av) => acc + (av.nota || av.estrelas || 0), 0);
    return (soma / avaliacoesDesempenho.length).toFixed(1);
  };

  // Função para filtrar funcionários
  const filtrarFuncionarios = (funcionarios) => {
    if (!funcionarios) return [];
    const searchLower = searchTerm.toLowerCase();
    
    return funcionarios.filter(func => {
      // Filtro por texto de busca
      const matchesSearch = func.nome?.toLowerCase().includes(searchLower) ||
                           func.cargo?.toLowerCase().includes(searchLower) ||
                           func.telefone?.includes(searchTerm) ||
                           func.email?.toLowerCase().includes(searchLower) ||
                           func.matricula?.toLowerCase().includes(searchLower) ||
                           func.setor?.toLowerCase().includes(searchLower);
      
      // Filtro por empresa
      const matchesEmpresa = empresaSelecionada === 'todas' || func.empresaId === empresaSelecionada;
      
      // Filtro por setor
      const matchesSetor = setorSelecionado === 'todos' || func.setorId === setorSelecionado;
      
      // Filtro por status de demissão
      if (filtroAtual === 'demitidos') {
        return matchesSearch && matchesEmpresa && matchesSetor && func.demitido === true;
      } else {
        // Para outros filtros, mostrar apenas funcionários ativos (não demitidos)
        return matchesSearch && matchesEmpresa && matchesSetor && !func.demitido;
      }
    });
  };

  // Processar funcionários com filtro e ordenação
  const funcionariosFiltrados = filtrarFuncionarios(funcionarios);

  // Obter setores filtrados por empresa
  const setoresFiltrados = empresaSelecionada === 'todas' 
    ? setores 
    : setores.filter(setor => setor.empresaId === empresaSelecionada);

  const { usuario } = useAuth();
  const isFuncionario = usuario?.nivel === 'funcionario';
  // Verifica se é supervisor ou acima (nível <= 2)
  const podeCriarFuncionario = usuario && usuario.nivel <= 2;

  // Carregar empresas e setores
  useEffect(() => {
    const carregarEmpresasSetores = async () => {
      try {
        const [empresasSnapshot, setoresSnapshot] = await Promise.all([
          getDocs(collection(db, 'empresas')),
          getDocs(collection(db, 'setores'))
        ]);

        setEmpresas(empresasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setSetores(setoresSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error('Erro ao carregar empresas e setores:', error);
      }
    };
    
    carregarEmpresasSetores();
  }, []);

  // Buscar estatísticas dos funcionários
  useEffect(() => {
    const fetchFuncionariosStats = async () => {
      const stats = {};
      
      for (const func of funcionarios) {
        const tarefasRef = collection(db, 'tarefas');
        const emprestimosRef = collection(db, 'emprestimos');
        const avaliacoesRef = collection(db, 'avaliacoes');
        const avaliacoesDesempenhoRef = collection(db, 'avaliacoesDesempenho');
        
        const [
          funcionariosIdsSnap,
          funcionarioSnap,
          funcionarioLowerSnap,
          responsavelSnap,
          responsavelLowerSnap,
          avaliacoesSnap,
          avaliacoesDesempenhoSnap
        ] = await Promise.all([
          getDocs(query(tarefasRef, where('funcionariosIds', 'array-contains', func.nome))),
          getDocs(query(tarefasRef, where('funcionario', '==', func.nome))),
          getDocs(query(tarefasRef, where('funcionario', '==', func.nome.toLowerCase()))),
          getDocs(query(tarefasRef, where('responsavel', '==', func.nome))),
          getDocs(query(tarefasRef, where('responsavel', '==', func.nome.toLowerCase()))),
          getDocs(query(avaliacoesRef, where('funcionarioId', '==', func.id))),
          getDocs(query(avaliacoesDesempenhoRef, where('funcionarioId', '==', func.id)))
        ]);
        
        let tarefasConcluidas = 0;
        let tarefasEmAndamento = 0;
        let somaAvaliacoes = 0;
        let totalAvaliacoes = 0;
        const avaliacoesArray = [];
        
        // Processar avaliações regulares
        avaliacoesSnap.forEach(doc => {
          const avaliacao = doc.data();
          const isDesempenho = avaliacao.tipo === 'avaliacao_supervisor';
          avaliacoesArray.push({ 
            ...avaliacao, 
            id: doc.id,
            tipo: isDesempenho ? 'desempenho' : 'regular',
            nota: Number(avaliacao.estrelas || avaliacao.nota || 0),
            data: avaliacao.data || new Date().toISOString()
          });
        });
        
        // Processar avaliações de desempenho
        avaliacoesDesempenhoSnap.forEach(doc => {
          const avaliacao = doc.data();
          avaliacoesArray.push({ 
            ...avaliacao, 
            id: doc.id,
            tipo: 'desempenho',
            nota: Number(avaliacao.estrelas || avaliacao.nota || 0),
            comentario: avaliacao.comentario || 'Avaliação de Desempenho',
            data: avaliacao.data || new Date().toISOString()
          });
        });
        
        // Ordenar avaliações por data mais recente
        avaliacoesArray.sort((a, b) => new Date(b.data) - new Date(a.data));
        
        // Processar dados das tarefas
        const processarTarefas = (snapshot) => {
          snapshot.forEach(doc => {
            const tarefa = doc.data();
            if (tarefa.status === 'concluida') {
              tarefasConcluidas++;
              
              // Adicionar autoavaliação do funcionário se existir
              if (tarefa.avaliacaoFuncionario) {
                avaliacoesArray.push({
                  id: `tarefa-${doc.id}-auto`,
                  tipo: 'regular',
                  nota: Number(tarefa.avaliacaoFuncionario),
                  comentario: tarefa.comentarioFuncionario || 'Autoavaliação',
                  data: tarefa.dataAutoavaliacao || tarefa.dataConclusao || new Date().toISOString(),
                  hora: new Date(tarefa.dataAutoavaliacao || tarefa.dataConclusao || new Date()).toLocaleTimeString('pt-BR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  }),
                  avaliador: func.nome,
                  tipoAvaliacao: 'tarefa',
                  nomeTarefa: tarefa.nome || tarefa.titulo,
                  descricaoTarefa: tarefa.descricao,
                  isAutoAvaliacao: true
                });
              }

              // Adicionar avaliação do supervisor se existir
              if (tarefa.avaliacaoSupervisor) {
                avaliacoesArray.push({
                  id: `tarefa-${doc.id}`,
                  tipo: 'regular',
                  nota: Number(tarefa.avaliacaoSupervisor),
                  comentario: tarefa.comentarioSupervisor || 'Avaliação de Tarefa',
                  data: tarefa.dataConclusao || new Date().toISOString(),
                  hora: new Date(tarefa.dataConclusao || new Date()).toLocaleTimeString('pt-BR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  }),
                  avaliador: tarefa.avaliadorNome || usuario.nome,
                  tipoAvaliacao: 'tarefa',
                  nomeTarefa: tarefa.nome || tarefa.titulo,
                  descricaoTarefa: tarefa.descricao
                });
                somaAvaliacoes += Number(tarefa.avaliacaoSupervisor);
                totalAvaliacoes++;
              }
            } else if (tarefa.status === 'em_andamento') {
              tarefasEmAndamento++;
            }
          });
        };
        
        processarTarefas(funcionariosIdsSnap);
        processarTarefas(funcionarioSnap);
        
        // Atualizar os stats do funcionário com as avaliações
        setFuncionariosStats(prev => ({
          ...prev,
          [func.id]: {
            ...prev[func.id],
            avaliacoes: avaliacoesArray,
            tarefasConcluidas,
            tarefasEmAndamento
          }
        }));
        processarTarefas(funcionarioLowerSnap);
        processarTarefas(responsavelSnap);
        processarTarefas(responsavelLowerSnap);

        // Buscar empréstimos
        const [
          emprestimosIdSnap,
          emprestimosNomeSnap,
          emprestimosColabSnap,
          emprestimosRespSnap,
          emprestimosRespLowerSnap
        ] = await Promise.all([
          getDocs(query(emprestimosRef, where('funcionarioId', '==', String(func.id)))),
          getDocs(query(emprestimosRef, where('funcionario', '==', func.nome))),
          getDocs(query(emprestimosRef, where('colaborador', '==', func.nome))),
          getDocs(query(emprestimosRef, where('responsavel', '==', func.nome))),
          getDocs(query(emprestimosRef, where('responsavel', '==', func.nome.toLowerCase())))
        ]);

        const emprestimosAtivos = new Set([
          ...emprestimosIdSnap.docs,
          ...emprestimosNomeSnap.docs,
          ...emprestimosColabSnap.docs,
          ...emprestimosRespSnap.docs,
          ...emprestimosRespLowerSnap.docs
        ]
          .map(doc => ({id: doc.id, ...doc.data()}))
          .filter(emp => emp.status === 'ativo' || emp.status === 'emprestado')
        ).size;

        let ferramentasDevolvidas = 0;
        [emprestimosIdSnap, emprestimosNomeSnap, emprestimosColabSnap, emprestimosRespSnap, emprestimosRespLowerSnap]
          .forEach(snapshot => {
            snapshot.docs.forEach(doc => {
              const emp = doc.data();
              if (emp.status === 'devolvido') {
                ferramentasDevolvidas += emp.ferramentas?.length || 0;
              }
            });
          });

        const statsData = {
          emprestimosAtivos,
          mediaAvaliacao: totalAvaliacoes > 0 ? (somaAvaliacoes / totalAvaliacoes) : 0,
          totalAvaliacoes,
          tarefasConcluidas,
          tarefasEmAndamento,
          ferramentasDevolvidas,
          avaliacoes: avaliacoesArray
        };

        stats[func.id] = statsData;

        // Calcular pontuação
        const pontuacao = calcularPontuacao({
          ferramentasDevolvidas,
          tarefasConcluidas,
          avaliacao: statsData.mediaAvaliacao
        });

        setFuncionariosPontos(prev => ({
          ...prev,
          [func.id]: pontuacao
        }));
      }

      setFuncionariosStats(stats);
    };

    if (funcionarios.length > 0) {
      fetchFuncionariosStats();
    }
  }, [funcionarios]);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);

      try {
        setLoading(true);
        const storageRef = ref(storage, `funcionarios/${editando?.id || Date.now()}`);
        const snapshot = await uploadBytes(storageRef, file);
        const photoURL = await getDownloadURL(snapshot.ref);
        setFormEdit(prev => ({ ...prev, photoURL }));
        
        if (editando) {
          await atualizarFuncionario(editando.id, { ...formEdit, photoURL });
        }
      } catch (error) {
        console.error('Erro ao fazer upload da imagem:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEditar = (func) => {
    setEditando(func);
    const originalData = {
      nome: func.nome || '',
      cargo: func.cargo || '',
      telefone: func.telefone || '',
      photoURL: func.photoURL || null
    };
    setFormEdit(originalData);
    setPreview(func.photoURL || null);
  };

  const handleAdicionar = async (novosDados) => {
    setLoading(true);
    try {
      await adicionarFuncionario({
        ...novosDados,
        photoURL: formEdit.photoURL || ''
      });
      setNovoFuncionario({ nome: '', cargo: '', telefone: '' });
      setFormEdit(prev => ({ ...prev, photoURL: '' }));
      setPreview(null);
      // Fechar formulário após sucesso
      setMostrarFormulario(false);
      showToast('Funcionário adicionado com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao adicionar funcionário:', error);
      showToast('Erro ao adicionar funcionário', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSalvarEdicao = async (dadosAtualizados) => {
    try {
      setLoading(true);
      await atualizarFuncionario(editando.id, dadosAtualizados);
      setEditando(null);
      setPreview(null);
      showToast('Funcionário atualizado com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao atualizar funcionário:', error);
      showToast('Erro ao atualizar funcionário', 'error');
    } finally {
      setLoading(false);
    }
  };

  const confirmarExclusao = (funcionario) => {
    setFuncionarioParaExcluir(funcionario);
    setModalConfirmacao(true);
  };

  const handleRemover = async () => {
    try {
      setLoading(true);
      await removerFuncionario(funcionarioParaExcluir.id);
      setModalConfirmacao(false);
      setFuncionarioParaExcluir(null);
    } catch (error) {
      alert('Erro ao excluir funcionário: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-gray-900 dark:via-slate-900 dark:to-blue-900/20">
      {/* Hero Header */}
      <div className="relative overflow-hidden">
        {/* Background decorativo */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 opacity-95" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-white/5" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }} />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-6 py-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl mb-6">
              <Users className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
              Gestão de Talentos
            </h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Acompanhe, gerencie e desenvolva sua equipe com ferramentas modernas e intuitivas
            </p>
          </motion.div>

          {/* Estatísticas em destaque */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto"
          >
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-white mb-1">
                {funcionarios.filter(f => !f.demitido).length}
              </div>
              <div className="text-blue-100 text-sm font-medium">Funcionários Ativos</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-white mb-1">
                {Object.keys(funcionariosStats).length}
              </div>
              <div className="text-blue-100 text-sm font-medium">Com Avaliações</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-white mb-1">
                {Object.values(funcionariosStats).reduce((acc, stats) => acc + (stats.tarefasConcluidas || 0), 0)}
              </div>
              <div className="text-blue-100 text-sm font-medium">Tarefas Concluídas</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-white mb-1">
                {(Object.values(funcionariosStats).reduce((acc, stats) => acc + (stats.mediaAvaliacao || 0), 0) / Object.keys(funcionariosStats).length || 0).toFixed(1)}
              </div>
              <div className="text-blue-100 text-sm font-medium">Avaliação Média</div>
            </div>
          </motion.div>
          
          {/* Filtros de Empresa e Setor */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-8 max-w-4xl mx-auto"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Filtro por Empresa */}
              <div className="relative">
                <label className="block text-sm font-medium text-blue-100 mb-2">
                  <Building2 className="w-4 h-4 inline mr-2" />
                  Filtrar por Empresa
                </label>
                <div className="relative">
                  <select
                    value={empresaSelecionada}
                    onChange={(e) => {
                      setEmpresaSelecionada(e.target.value);
                      setSetorSelecionado('todos'); // Reset setor quando mudar empresa
                    }}
                    className="w-full bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl px-4 py-3 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/50 appearance-none"
                  >
                    <option value="todas" className="bg-blue-600 text-white">Todas as Empresas</option>
                    {empresas.map(empresa => (
                      <option key={empresa.id} value={empresa.id} className="bg-blue-600 text-white">
                        {empresa.nome}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-200 pointer-events-none" />
                </div>
              </div>

              {/* Filtro por Setor */}
              <div className="relative">
                <label className="block text-sm font-medium text-blue-100 mb-2">
                  <Filter className="w-4 h-4 inline mr-2" />
                  Filtrar por Setor
                </label>
                <div className="relative">
                  <select
                    value={setorSelecionado}
                    onChange={(e) => setSetorSelecionado(e.target.value)}
                    disabled={empresaSelecionada === 'todas'}
                    className={`w-full bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl px-4 py-3 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/50 appearance-none ${
                      empresaSelecionada === 'todas' ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <option value="todos" className="bg-blue-600 text-white">
                      {empresaSelecionada === 'todas' ? 'Selecione uma empresa primeiro' : 'Todos os Setores'}
                    </option>
                    {setoresFiltrados.map(setor => (
                      <option key={setor.id} value={setor.id} className="bg-blue-600 text-white">
                        {setor.nome}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-200 pointer-events-none" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Controles e Filtros */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200/50 dark:bg-gray-900/80 dark:border-gray-700/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col lg:flex-row items-center justify-between gap-4"
          >
            {/* Controles de visualização e Botão Adicionar */}
            <div className="flex items-center gap-3">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {funcionariosFiltrados.length} de {funcionarios.length} funcionários
              </div>
              {filtroAtual === 'demitidos' && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                  <UserX className="w-3 h-3" />
                  Inativos
                </span>
              )}
              
              {/* Botão Adicionar Funcionário na barra */}
              {podeCriarFuncionario && !readonly && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setMostrarFormulario(!mostrarFormulario)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg shadow-md transition-all duration-200"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Adicionar</span>
                </motion.button>
              )}
            </div>

            {/* Barra de Busca e Filtros */}
            <BarraBuscaModerna
              filtroAtual={filtroAtual}
              setFiltroAtual={setFiltroAtual}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              onManageGroups={() => setShowGruposModal(true)}
              onUnificar={() => setShowUnificarModal(true)}
              showGroupsButton={!readonly && usuario?.nivel >= 2}
            />
          </motion.div>
        </div>
      </div>

      {/* Container Principal */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Formulário de Adição (aparece quando botão é clicado) */}
        {podeCriarFuncionario && !readonly && mostrarFormulario && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="mb-6"
          >
            <div className="bg-white/70 backdrop-blur-sm dark:bg-gray-800/70 rounded-2xl border border-white/20 dark:border-gray-700/50 shadow-xl shadow-blue-500/10 dark:shadow-blue-500/5 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
                    <Plus className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Adicionar Novo Funcionário
                  </h2>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setMostrarFormulario(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </motion.button>
              </div>
              <FormularioAdicao
                onSubmit={handleAdicionar}
                  loading={loading}
                  formatarTelefone={formatarTelefone}
                  usuarioLogado={usuario}
                />
            </div>
          </motion.div>
        )}

        {/* Lista de Funcionários */}
        <AnimatePresence>
          {funcionariosFiltrados.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="bg-white/70 backdrop-blur-sm dark:bg-gray-800/70 rounded-2xl border border-white/20 dark:border-gray-700/50 shadow-xl shadow-blue-500/10 dark:shadow-blue-500/5 p-12"
            >
              <div className="flex flex-col items-center justify-center text-center">
                <div className="relative mb-6">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 rounded-2xl flex items-center justify-center">
                    {filtroAtual === 'demitidos' ? (
                      <UserX className="w-12 h-12 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <Users className="w-12 h-12 text-blue-600 dark:text-blue-400" />
                    )}
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  {filtroAtual === 'demitidos' ? 'Nenhum funcionário inativo' : 'Nenhum funcionário encontrado'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 max-w-md leading-relaxed">
                  {filtroAtual === 'demitidos' 
                    ? 'Não há funcionários inativos no sistema. Que ótima notícia!'
                    : searchTerm 
                      ? `Não foram encontrados funcionários que correspondam ao termo "${searchTerm}". Tente ajustar os filtros ou buscar por outros termos.`
                      : 'Comece adicionando seu primeiro funcionário ao sistema e construa sua equipe dos sonhos!'
                  }
                </p>
                {!filtroAtual.includes('demitidos') && !searchTerm && !isFuncionario && !readonly && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-medium rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all duration-200 shadow-lg"
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar Funcionário
                  </motion.button>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6"
            >
              {[...funcionariosFiltrados].sort(getFuncaoOrdenacao()).map((func, index) => (
                <motion.div
                  key={func.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <CardFuncionarioModerno
                    funcionario={func}
                    funcionariosStats={funcionariosStats}
                    funcionariosPontos={funcionariosPontos}
                    isFuncionario={isFuncionario}
                    readonly={readonly}
                    avaliacoesExpandidas={avaliacoesExpandidas}
                    avaliacoesDesempenhoExpandidas={avaliacoesDesempenhoExpandidas}
                    setAvaliacoesExpandidas={setAvaliacoesExpandidas}
                    setAvaliacoesDesempenhoExpandidas={setAvaliacoesDesempenhoExpandidas}
                    handleEditar={handleEditar}
                    confirmarExclusao={confirmarExclusao}
                    calcularMediaAvaliacoesDesempenho={calcularMediaAvaliacoesDesempenho}
                    onClick={() => setFuncionarioSelecionado(func)}
                    demitirFuncionario={demitirFuncionario}
                    reintegrarFuncionario={reintegrarFuncionario}
                    filtroAtual={filtroAtual}
                    estatisticaExpandida={estatisticaExpandida}
                    setEstatisticaExpandida={setEstatisticaExpandida}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modal de Detalhes das Estatísticas */}
      {estatisticaExpandida && (
        <ModalDetalhesEstatisticas
          isOpen={true}
          onClose={() => setEstatisticaExpandida(null)}
          tipo={estatisticaExpandida.tipo}
          funcionario={estatisticaExpandida.funcionario}
          stats={estatisticaExpandida.stats}
          pontos={estatisticaExpandida.pontos}
          horasInfo={estatisticaExpandida.horasInfo}
        />
      )}

      {/* Modal de Perfil do Funcionário */}
      {funcionarioSelecionado && (
        <FuncionarioProfile
          funcionario={funcionarioSelecionado}
          onClose={() => setFuncionarioSelecionado(null)}
        />
      )}

      {/* Modal de Grupos */}
      <GruposModal
        isOpen={showGruposModal}
        onClose={() => setShowGruposModal(false)}
        funcionarios={funcionarios}
      />

      {/* Modal de Unificar Duplicados */}
      <ModalUnificarDuplicados
        isOpen={showUnificarModal}
        onClose={() => setShowUnificarModal(false)}
        onUnificado={() => {
          // Recarregar lista de funcionários
          showToast('Funcionários unificados com sucesso!', 'success');
        }}
      />

      {/* Modal de Edição */}
      {!isFuncionario && editando && (
        <ModalEditar
          editando={editando}
          formEdit={formEdit}
          setFormEdit={setFormEdit}
          preview={preview}
          setPreview={setPreview}
          loading={loading}
          fileInputRef={fileInputRef}
          handleFileChange={handleFileChange}
          handleSalvarEdicao={handleSalvarEdicao}
          setEditando={setEditando}
          formatarTelefone={formatarTelefone}
        />
      )}

      {/* Modal de Confirmação de Exclusão */}
      {modalConfirmacao && funcionarioParaExcluir && (
        <ModalConfirmacao
          funcionario={funcionarioParaExcluir}
          loading={loading}
          onConfirm={handleRemover}
          onCancel={() => {
            setModalConfirmacao(false);
            setFuncionarioParaExcluir(null);
          }}
        />
      )}
    </div>
  );
};

export default FuncionariosTab;

