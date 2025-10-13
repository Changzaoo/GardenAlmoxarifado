import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useFuncionarios, FuncionariosProvider } from '../Funcionarios/FuncionariosProvider';
import { 
  UserCircle, 
  Star, 
  Package, 
  CheckCircle, 
  ArrowLeft,
  Calendar,
  Trophy,
  MessageSquarePlus,
  Users,
  Building2,
  Briefcase,
  Clock
} from 'lucide-react';
import MeuInventarioTab from '../Inventario/MeuInventarioTab';
import TarefasTab from '../Tarefas/TarefasTab';
import CronogramaSemanalCard from '../Tarefas/CronogramaSemanalCard';
import WorkPontoTab from '../WorkPontoTab';
import AvaliacaoPerfilModal from './AvaliacaoPerfilModal';
import DetalhesFerramentasModal from './DetalhesFerramentasModal';
import DetalhesTarefasModal from './DetalhesTarefasModal';
import DetalhesAvaliacoesModal from './DetalhesAvaliacoesModal';
import AvaliacoesList from './AvaliacoesList';
import DetalhamentoPontosTab from './DetalhamentoPontosTab';
import { collection, query, where, getDocs, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useIsMobile } from '../../hooks/useIsMobile';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { NIVEIS_PERMISSAO, hasSupervisionPermission } from '../../constants/permissoes';

const calcularPontuacao = (dados) => {
  const pontosPorFerramentasDevolvidas = (dados.ferramentasDevolvidas || 0) * 20;
  const pontosPorTarefasConcluidas = (dados.tarefasConcluidas || 0) * 50;
  
  // Calcula pontos por avaliação (5 estrelas = 50 pontos, 4 = 40, 3 = 30, 2 = 20, 1 = 10)
  const pontosPorAvaliacao = dados.mediaEstrelas ? Math.round(dados.mediaEstrelas * 10) : 0;

  return {
    total: pontosPorFerramentasDevolvidas + pontosPorTarefasConcluidas + pontosPorAvaliacao,
    detalhes: {
      ferramentas: pontosPorFerramentasDevolvidas,
      tarefas: pontosPorTarefasConcluidas,
      avaliacao: pontosPorAvaliacao
    }
  };
};

const ProfileTab = () => {
  const { usuario } = useAuth();
  const isMobile = useIsMobile();
  const { funcionarios } = useFuncionarios();
  const [dadosFuncionario, setDadosFuncionario] = useState(null);
  const [modalDetalhes, setModalDetalhes] = useState(null); // 'ferramentas', 'tarefas', 'avaliacoes'
  
  // Buscar funcionarioInfo da lista carregada (MESMA FONTE que página de Tarefas e Funcionários)
  // Garante que photoURL e cargo são exatamente os mesmos em todo o sistema
  const funcionarioInfo = funcionarios.find(f => {
    // Debug: mostrar tentativas de match
    const usuarioMatch = f.usuario && usuario?.usuario && f.usuario.toLowerCase() === usuario.usuario.toLowerCase();
    const idMatch = f.id === usuario?.id;
    const uidMatch = f.id === usuario?.uid;
    const stringIdMatch = String(f.id) === String(usuario?.id);
    const stringUsuarioMatch = String(f.usuario)?.toLowerCase() === String(usuario?.usuario)?.toLowerCase();
    const nomeMatch = f.nome && usuario?.nome && f.nome.toLowerCase() === usuario.nome.toLowerCase();
    
    if (usuarioMatch || idMatch || uidMatch || stringIdMatch || stringUsuarioMatch || nomeMatch) {
      return true;
    }
    return false;
  });
  
  // Buscar dados diretamente do Firestore como fallback
  useEffect(() => {
    if (funcionarioInfo) {
      setDadosFuncionario(funcionarioInfo);
      return;
    }
    
    if (!usuario?.usuario) return;
    // Tentar primeiro na coleção 'funcionarios'
    const unsubscribeFuncionarios = onSnapshot(
      query(
        collection(db, 'funcionarios'),
        where('usuario', '==', usuario.usuario)
      ),
      (snapshot) => {
        if (!snapshot.empty) {
          const dados = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
          setDadosFuncionario(dados);
        } else {
        }
      }
    );
    
    // Tentar também na coleção 'usuario'
    const unsubscribeUsuario = onSnapshot(
      doc(db, 'usuario', usuario.id),
      (docSnap) => {
        if (docSnap.exists()) {
          const dados = { id: docSnap.id, ...docSnap.data() };
          // Só usar se não encontrou em funcionários
          setDadosFuncionario(prev => prev || dados);
        } else {
        }
      }
    );
    
    return () => {
      unsubscribeFuncionarios();
      unsubscribeUsuario();
    };
  }, [usuario?.usuario, funcionarioInfo]);
  
  // PRIORIZAR funcionarioInfo (do contexto) para garantir sincronização
  // Isso garante que cargo, foto e setor sejam os mesmos em todo o sistema
  const dadosExibicao = funcionarioInfo || dadosFuncionario;
  
  // Debug do cargo, foto e usuário
  useEffect(() => {
    const fotoFinal = dadosExibicao?.photoURL || usuario?.photoURL;
    if (!fotoFinal) {
    }
  }, [dadosExibicao, funcionarios, usuario, funcionarioInfo, dadosFuncionario]);
  
  const [activeTab, setActiveTab] = useState('inventario');
  const [emprestimos, setEmprestimos] = useState([]);
  const [cargoFuncionario, setCargoFuncionario] = useState('');
  const [stats, setStats] = useState({
    tarefasConcluidas: 0,
    ferramentasEmprestadas: 0,
    ferramentasDevolvidas: 0,
    mediaEstrelas: 0,
    totalAvaliacoes: 0,
    pontos: {
      total: 0,
      detalhes: {
        ferramentas: 0,
        tarefas: 0,
        avaliacao: 0
      }
    }
  });
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [showAvaliacaoModal, setShowAvaliacaoModal] = useState(false);
  const temPermissaoAvaliacao = hasSupervisionPermission(usuario?.nivel);

  // Carregar cargo do funcionário
  useEffect(() => {
    if (!usuario?.id) return;
    const unsubscribeCargo = onSnapshot(
      query(
        collection(db, 'funcionarios'),
        where('id', '==', String(usuario.id))
      ),
      (snapshot) => {
        if (!snapshot.empty) {
          const funcionarioData = snapshot.docs[0].data();
          setCargoFuncionario(funcionarioData.cargo || '');
        } else {
          setCargoFuncionario('');
        }
      }
    );

    return () => unsubscribeCargo();
  }, [usuario?.id]);

  // Funções de avaliação
  const handleAddAvaliacao = async (estrelas, comentario) => {
    try {
      // Verifica se temos o usuário e seus dados
      if (!usuario?.id) {
        throw new Error('Usuário não encontrado');
      }

      const dataAvaliacao = new Date().toISOString();
      
      const novaAvaliacao = {
        // Dados do funcionário avaliado
        funcionarioId: String(usuario.id),
        funcionarioNome: usuario.nome || '',
        funcionarioUsuario: usuario.usuario || '',
        
        // Dados do avaliador
        avaliadorId: String(usuario.id),
        avaliadorNome: usuario.nome || '',
        avaliadorUsuario: usuario.usuario || '',
        avaliadorCargo: cargoFuncionario || 'Supervisor',
        
        // Dados da avaliação
        estrelas: Number(estrelas),
        comentario,
        data: dataAvaliacao,
        dataCriacao: dataAvaliacao,
        origemAvaliacao: 'Avaliação de Desempenho',
        tipo: 'manual',
        status: 'ativa',
        
        // Metadados
        pontuacaoAtribuida: Number(estrelas) * 10, // 5 estrelas = 50 pontos
        tags: ['avaliacao-manual', 'desempenho'],
        historico: [{
          acao: 'criacao',
          data: dataAvaliacao,
          usuarioId: String(usuario.id),
          usuarioNome: usuario.nome,
          detalhes: 'Avaliação criada manualmente'
        }]
      };
      const docRef = await addDoc(collection(db, 'avaliacoes'), novaAvaliacao);
      // Atualiza as estatísticas localmente
      setStats(prevStats => {
        const novoTotal = prevStats.totalAvaliacoes + 1;
        const novaMedia = ((prevStats.mediaEstrelas * prevStats.totalAvaliacoes) + estrelas) / novoTotal;
        const novosPontos = calcularPontuacao({
          ...prevStats,
          mediaEstrelas: novaMedia,
          totalAvaliacoes: novoTotal
        });

        return {
          ...prevStats,
          totalAvaliacoes: novoTotal,
          mediaEstrelas: novaMedia,
          pontos: novosPontos
        };
      });

      // Fecha o modal após salvar com sucesso
      setShowAvaliacaoModal(false);
    } catch (error) {
      console.error('Erro ao adicionar avaliação:', error);
      alert('Erro ao salvar a avaliação. Por favor, tente novamente.');
    }
  };

  const handleDeleteAvaliacao = async (avaliacaoId) => {
    if (!temPermissaoAvaliacao) {
      return;
    }
    
    if (window.confirm('Tem certeza que deseja excluir esta avaliação?')) {
      try {
        // Em vez de excluir, marca como inativa
        const avaliacaoRef = doc(db, 'avaliacoes', avaliacaoId);
        await updateDoc(avaliacaoRef, {
          status: 'inativa',
          dataExclusao: new Date().toISOString(),
          usuarioExclusao: usuario.usuario
        });
        // A atualização do estado será feita automaticamente pelo onSnapshot
      } catch (error) {
        console.error('Erro ao excluir avaliação:', error);
        alert('Erro ao excluir a avaliação. Por favor, tente novamente.');
      }
    }
  };

  // Carregar avaliações do usuário
  useEffect(() => {
    if (!usuario?.id) {
      return;
    }
    const avaliacoesRef = collection(db, 'avaliacoes');
    const avaliacoesQuery = query(
      avaliacoesRef,
      where('funcionarioId', '==', String(usuario.id)),
      where('status', '==', 'ativa')
    );

    const unsubscribe = onSnapshot(avaliacoesQuery, (snapshot) => {
      const avaliacoesData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          estrelas: Number(data.estrelas),
          data: data.data
        };
      });
      // Ordena por data mais recente
      const avaliacoesOrdenadas = avaliacoesData.sort((a, b) => 
        new Date(b.data) - new Date(a.data)
      );

      setAvaliacoes(avaliacoesOrdenadas);
      
      // Atualiza estatísticas de avaliação
      if (avaliacoesData.length > 0) {
        const somaEstrelas = avaliacoesData.reduce((sum, av) => sum + av.estrelas, 0);
        const media = somaEstrelas / avaliacoesData.length;
        setStats(prevStats => ({
          ...prevStats,
          mediaEstrelas: media,
          totalAvaliacoes: avaliacoesData.length
        }));
      } else {
        setStats(prevStats => ({
          ...prevStats,
          mediaEstrelas: 0,
          totalAvaliacoes: 0
        }));
      }
    }, (error) => {
      console.error('Erro ao carregar avaliações:', error);
    });

    return () => unsubscribe();
  }, [usuario?.id]);

  // Carregar empréstimos do usuário
  useEffect(() => {
    if (!usuario?.id) {
      return;
    }

    const unsubscribe = onSnapshot(
      query(
        collection(db, 'emprestimos'),
        where('funcionarioId', '==', String(usuario.id))
      ),
      (snapshot) => {
        const emprestimosData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setEmprestimos(emprestimosData);
      }
    );

    return () => unsubscribe();
  }, [usuario.id]);

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        // Buscar tarefas concluídas
        const tarefasRef = collection(db, 'tarefas');
        const tarefasQuery = query(
          tarefasRef,
          where('funcionariosIds', 'array-contains', usuario.nome)
        );
        const tarefasSnap = await getDocs(tarefasQuery);
        
        let tarefasConcluidas = 0;
        let somaEstrelas = 0;
        let totalAvaliacoes = 0;
        tarefasSnap.forEach(doc => {
          const tarefa = doc.data();
          if (tarefa.status === 'concluida') {
            tarefasConcluidas++;
            if (tarefa.avaliacaoSupervisor) {
              somaEstrelas += Number(tarefa.avaliacaoSupervisor);
              totalAvaliacoes++;
            }
          }
        });
        // Buscar empréstimos ativos
        const emprestimosRef = collection(db, 'emprestimos');
        const emprestimosQuery = query(
          emprestimosRef,
          where('funcionarioId', '==', String(usuario.id))
        );
        const emprestimosSnap = await getDocs(emprestimosQuery);
        
        let emprestimosAtivos = 0;
        emprestimosSnap.forEach(doc => {
          const emprestimo = doc.data();
          if (emprestimo.status === 'ativo' || emprestimo.status === 'emprestado') {
            // Conta todas as ferramentas do empréstimo
            emprestimosAtivos += emprestimo.ferramentas?.length || 0;
          }
        });
        const mediaEstrelas = totalAvaliacoes > 0 ? (somaEstrelas / totalAvaliacoes) : 0;
        let ferramentasDevolvidas = 0;
        emprestimosSnap.forEach(doc => {
          const emprestimo = doc.data();
          if (emprestimo.status === 'devolvido') {
            ferramentasDevolvidas += emprestimo.ferramentas?.length || 0;
          }
        });

        const statsData = {
          tarefasConcluidas,
          ferramentasEmprestadas: emprestimosAtivos,
          ferramentasDevolvidas,
          mediaEstrelas,
          totalAvaliacoes
        };

        const pontuacao = calcularPontuacao({
          tarefasConcluidas,
          ferramentasDevolvidas,
          mediaEstrelas
        });

        setStats({
          ...statsData,
          pontos: pontuacao
        });
      } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
      }
    };

    fetchUserStats();
  }, [usuario.id]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Cover & Profile Picture - Redesenhado */}
      <div className="relative">
        {/* Banner com gradiente moderno e efeitos */}
        <div className="h-48 bg-gradient-to-br from-blue-500 via-sky-500 to-purple-600 relative overflow-hidden">
          {/* Efeitos de luz no banner */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4"></div>
          
          {/* Padrão de pontos decorativos */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}></div>
        </div>
        
        {/* Foto de Perfil - Sincronizada com página de Tarefas e Ranking */}
        <div className="absolute -bottom-16 left-8">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-900 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center overflow-hidden shadow-2xl transform transition-transform duration-300 group-hover:scale-105">
              {(dadosExibicao?.photoURL || usuario?.photoURL) ? (
                <img 
                  src={dadosExibicao?.photoURL || usuario?.photoURL} 
                  alt={usuario?.nome || 'Usuário'} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error('Erro ao carregar foto:', e.target.src);
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <UserCircle className="w-20 h-20 text-gray-400" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Info - Redesenhado */}
      <div className="mt-20 px-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-700">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {usuario.nome}
              </h2>
              
              {/* Cargo e Setor - Sincronizados com página de Tarefas e Ranking */}
              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1.5 rounded-full bg-blue-500 text-white text-sm font-semibold shadow-md">
                  {dadosExibicao?.cargo || 'N/A'}
                </span>
                {(dadosExibicao?.setor || usuario.setorNome) && (
                  <span className="px-3 py-1.5 rounded-full bg-purple-500 text-white text-sm font-semibold shadow-md">
                    {dadosExibicao?.setor || usuario.setorNome}
                  </span>
                )}
              </div>
              
              {/* Empresa e Setor */}
              {(usuario.empresaNome || usuario.setorNome) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  {usuario.empresaNome && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                      <div className="bg-blue-500 p-2 rounded-lg">
                        <Building2 className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Empresa</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{usuario.empresaNome}</p>
                      </div>
                    </div>
                  )}
                  {usuario.setorNome && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                      <div className="bg-purple-500 p-2 rounded-lg">
                        <Users className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Setor</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{usuario.setorNome}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 px-3 py-2 rounded-lg w-fit">
                <Calendar className="w-4 h-4" />
                <span>
                  Membro desde {format(new Date(usuario.dataCriacao || Date.now()), 'MMMM yyyy', { locale: ptBR })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs - Redesenhado com cards modernos - Otimizado para Mobile */}
      <div className="mt-6 px-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-6">
          <button 
            className={`relative overflow-hidden rounded-xl sm:rounded-2xl p-3 sm:p-6 transition-all duration-300 ${
              activeTab === 'inventario' 
                ? 'shadow-xl scale-105 sm:hover:scale-105' 
                : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:scale-105'
            }`}
            style={activeTab === 'inventario' ? { backgroundColor: '#1988d3', boxShadow: '0 10px 15px -3px rgba(25, 136, 211, 0.4), 0 4px 6px -4px rgba(25, 136, 211, 0.4)' } : {}}
            onClick={() => setActiveTab('inventario')}
          >
            {activeTab === 'inventario' && (
              <div className="absolute inset-0 bg-white/10"></div>
            )}
            <div className="relative flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
              <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl ${
                activeTab === 'inventario' 
                  ? 'bg-white/20 backdrop-blur-sm' 
                  : 'bg-blue-100 dark:bg-blue-900/30'
              }`}>
                <Package className={`w-5 h-5 sm:w-6 sm:h-6 ${
                  activeTab === 'inventario' 
                    ? 'text-white' 
                    : 'text-blue-600 dark:text-blue-400'
                }`} />
              </div>
              <div className="text-center sm:text-left">
                <h3 className={`font-bold text-xs sm:text-lg ${
                  activeTab === 'inventario' 
                    ? 'text-white' 
                    : 'text-gray-900 dark:text-white'
                }`}>
                  Inventário
                </h3>
                <p className={`text-[10px] sm:text-sm ${
                  activeTab === 'inventario' 
                    ? 'text-white/80' 
                    : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {emprestimos?.filter(e => e.status !== 'devolvido').length || 0} ativos
                </p>
              </div>
            </div>
          </button>

          <button 
            className={`relative overflow-hidden rounded-xl sm:rounded-2xl p-3 sm:p-6 transition-all duration-300 ${
              activeTab === 'workponto' 
                ? 'shadow-xl scale-105 sm:hover:scale-105' 
                : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:scale-105'
            }`}
            style={activeTab === 'workponto' ? { backgroundColor: '#3b82f6', boxShadow: '0 10px 15px -3px rgba(59, 130, 246, 0.4), 0 4px 6px -4px rgba(59, 130, 246, 0.4)' } : {}}
            onClick={() => setActiveTab('workponto')}
          >
            {activeTab === 'workponto' && (
              <div className="absolute inset-0 bg-white/10"></div>
            )}
            <div className="relative flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
              <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl ${
                activeTab === 'workponto' 
                  ? 'bg-white/20 backdrop-blur-sm' 
                  : 'bg-blue-100 dark:bg-blue-900/30'
              }`}>
                <Clock className={`w-5 h-5 sm:w-6 sm:h-6 ${
                  activeTab === 'workponto' 
                    ? 'text-white' 
                    : 'text-blue-600 dark:text-blue-400'
                }`} />
              </div>
              <div className="text-center sm:text-left">
                <h3 className={`font-bold text-xs sm:text-lg ${
                  activeTab === 'workponto' 
                    ? 'text-white' 
                    : 'text-gray-900 dark:text-white'
                }`}>
                  WorkPonto
                </h3>
                <p className={`text-[10px] sm:text-sm ${
                  activeTab === 'workponto' 
                    ? 'text-white/80' 
                    : 'text-gray-500 dark:text-gray-400'
                }`}>
                  Registro
                </p>
              </div>
            </div>
          </button>

          <button 
            className={`relative overflow-hidden rounded-xl sm:rounded-2xl p-3 sm:p-6 transition-all duration-300 ${
              activeTab === 'tarefas' 
                ? 'shadow-xl scale-105 sm:hover:scale-105' 
                : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:scale-105'
            }`}
            style={activeTab === 'tarefas' ? { backgroundColor: '#1988d3', boxShadow: '0 10px 15px -3px rgba(25, 136, 211, 0.4), 0 4px 6px -4px rgba(25, 136, 211, 0.4)' } : {}}
            onClick={() => setActiveTab('tarefas')}
          >
            {activeTab === 'tarefas' && (
              <div className="absolute inset-0 bg-white/10"></div>
            )}
            <div className="relative flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
              <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl ${
                activeTab === 'tarefas' 
                  ? 'bg-white/20 backdrop-blur-sm' 
                  : 'bg-blue-100 dark:bg-blue-900/30'
              }`}>
                <CheckCircle className={`w-5 h-5 sm:w-6 sm:h-6 ${
                  activeTab === 'tarefas' 
                    ? 'text-white' 
                    : 'text-blue-600 dark:text-blue-400'
                }`} />
              </div>
              <div className="text-center sm:text-left">
                <h3 className={`font-bold text-xs sm:text-lg ${
                  activeTab === 'tarefas' 
                    ? 'text-white' 
                    : 'text-gray-900 dark:text-white'
                }`}>
                  Tarefas
                </h3>
                <p className={`text-[10px] sm:text-sm ${
                  activeTab === 'tarefas' 
                    ? 'text-white/80' 
                    : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {stats.tarefasConcluidas} feitas
                </p>
              </div>
            </div>
          </button>

          <button 
            className={`relative overflow-hidden rounded-xl sm:rounded-2xl p-3 sm:p-6 transition-all duration-300 ${
              activeTab === 'pontos' 
                ? 'shadow-xl scale-105 sm:hover:scale-105' 
                : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:scale-105'
            }`}
            style={activeTab === 'pontos' ? { backgroundColor: '#1988d3', boxShadow: '0 10px 15px -3px rgba(25, 136, 211, 0.4), 0 4px 6px -4px rgba(25, 136, 211, 0.4)' } : {}}
            onClick={() => setActiveTab('pontos')}
          >
            {activeTab === 'pontos' && (
              <div className="absolute inset-0 bg-white/10"></div>
            )}
            <div className="relative flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
              <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl ${
                activeTab === 'pontos' 
                  ? 'bg-white/20 backdrop-blur-sm' 
                  : 'bg-blue-100 dark:bg-blue-900/30'
              }`}>
                <Trophy className={`w-5 h-5 sm:w-6 sm:h-6 ${
                  activeTab === 'pontos' 
                    ? 'text-white' 
                    : 'text-blue-600 dark:text-blue-400'
                }`} />
              </div>
              <div className="text-center sm:text-left">
                <h3 className={`font-bold text-xs sm:text-lg ${
                  activeTab === 'pontos' 
                    ? 'text-white' 
                    : 'text-gray-900 dark:text-white'
                }`}>
                  Pontos
                </h3>
                <p className={`text-[10px] sm:text-sm ${
                  activeTab === 'pontos' 
                    ? 'text-white/80' 
                    : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {stats.pontos.total} pts
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-6 pb-6">
        {activeTab === 'inventario' && emprestimos && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
            <MeuInventarioTab
              emprestimos={emprestimos}
            />
          </div>
        )}
        {activeTab === 'workponto' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
            <WorkPontoTab />
          </div>
        )}
        {activeTab === 'tarefas' && (
          <div className="space-y-6">
            {/* Cronograma Semanal */}
            <CronogramaSemanalCard />

            {/* Tarefas Individuais */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
              <TarefasTab 
                funcionarios={funcionarios}
                showOnlyUserTasks={true}
                showAddButton={false}
                readOnly={false}
                userFilter={usuario?.nome}
                defaultFiltros={{
                  status: 'todas',
                  periodo: 'todos',
                  avaliacao: 'todas'
                }}
              />
            </div>
          </div>
        )}
        {activeTab === 'pontos' && (
          <>
            {console.log('🔍 ProfileTab passando stats:', stats)}
            <DetalhamentoPontosTab stats={stats} />
          </>
        )}
      </div>

      {/* Modais de Detalhes */}
      <DetalhesFerramentasModal
        isOpen={modalDetalhes === 'ferramentas'}
        onClose={() => setModalDetalhes(null)}
        emprestimos={emprestimos}
        pontos={stats.pontos.detalhes.ferramentas}
      />

      <DetalhesTarefasModal
        isOpen={modalDetalhes === 'tarefas'}
        onClose={() => setModalDetalhes(null)}
        funcionarioId={usuario?.id}
        pontos={stats.pontos.detalhes.tarefas}
      />

      <DetalhesAvaliacoesModal
        isOpen={modalDetalhes === 'avaliacoes'}
        onClose={() => setModalDetalhes(null)}
        funcionarioId={usuario?.id}
        pontos={stats.pontos.detalhes.avaliacao}
      />
    </div>
  );
};

const WrappedProfileTab = () => {
  return (
    <FuncionariosProvider>
      <ProfileTab />
    </FuncionariosProvider>
  );
};

export default WrappedProfileTab;

