import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { 
  UserCircle, 
  Star, 
  Package, 
  CheckCircle, 
  ArrowLeft,
  Calendar,
  Trophy,
  MessageSquarePlus,
  Users
} from 'lucide-react';
import { FuncionariosProvider, useFuncionarios } from '../Funcionarios/FuncionariosProvider';
import MeuInventarioTab from '../Inventario/MeuInventarioTab';
import TarefasTab from '../Tarefas/TarefasTab';
import AvaliacaoPerfilModal from './AvaliacaoPerfilModal';
import AvaliacoesList from './AvaliacoesList';
import { collection, query, where, getDocs, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useIsMobile } from '../../hooks/useIsMobile';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { NIVEIS_PERMISSAO } from '../../constants/permissoes';

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
  const funcionarioInfo = funcionarios.find(f => f.id === usuario.id);
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
  const temPermissaoAvaliacao = usuario?.nivel >= NIVEIS_PERMISSAO.SUPERVISOR;

  // Carregar cargo do funcionário
  useEffect(() => {
    if (!usuario?.id) return;

    console.log("Buscando cargo do funcionário:", usuario.id);
    
    const unsubscribeCargo = onSnapshot(
      query(
        collection(db, 'funcionarios'),
        where('id', '==', String(usuario.id))
      ),
      (snapshot) => {
        if (!snapshot.empty) {
          const funcionarioData = snapshot.docs[0].data();
          console.log("Dados do funcionário encontrados:", funcionarioData);
          setCargoFuncionario(funcionarioData.cargo || '');
        } else {
          console.log("Funcionário não encontrado na coleção");
          setCargoFuncionario('');
        }
      }
    );

    return () => unsubscribeCargo();
  }, [usuario?.id]);

  // Funções de avaliação
  const handleAddAvaliacao = async (estrelas, comentario) => {
    try {
      console.log('Adicionando avaliação:', { estrelas, comentario, usuario });
      
      // Verifica se temos o usuário e seus dados
      if (!usuario?.id) {
        throw new Error('Usuário não encontrado');
      }

      const dataAvaliacao = new Date().toISOString();
      
      const novaAvaliacao = {
        // Dados do funcionário avaliado
        funcionarioId: String(usuario.id),
        funcionarioNome: usuario.nome || '',
        funcionarioEmail: usuario.email || '',
        
        // Dados do avaliador
        avaliadorId: String(usuario.id),
        avaliadorNome: usuario.nome || '',
        avaliadorEmail: usuario.email || '',
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

      console.log('Salvando avaliação:', novaAvaliacao);
      const docRef = await addDoc(collection(db, 'avaliacoes'), novaAvaliacao);
      console.log('Avaliação salva com ID:', docRef.id);
      
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
      console.log('Usuário sem permissão para excluir avaliações');
      return;
    }
    
    if (window.confirm('Tem certeza que deseja excluir esta avaliação?')) {
      try {
        console.log('Excluindo avaliação:', avaliacaoId);
        
        // Em vez de excluir, marca como inativa
        const avaliacaoRef = doc(db, 'avaliacoes', avaliacaoId);
        await updateDoc(avaliacaoRef, {
          status: 'inativa',
          dataExclusao: new Date().toISOString(),
          usuarioExclusao: usuario.email
        });

        console.log('Avaliação marcada como inativa');

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
      console.log('ID do usuário não disponível ainda');
      return;
    }

    console.log('Carregando avaliações para usuário:', usuario.id);

    const avaliacoesRef = collection(db, 'avaliacoes');
    const avaliacoesQuery = query(
      avaliacoesRef,
      where('funcionarioId', '==', String(usuario.id)),
      where('status', '==', 'ativa')
    );

    const unsubscribe = onSnapshot(avaliacoesQuery, (snapshot) => {
      console.log('Snapshot de avaliações recebido:', snapshot.size, 'documentos');

      const avaliacoesData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          estrelas: Number(data.estrelas),
          data: data.data
        };
      });

      console.log('Avaliações processadas:', avaliacoesData);

      // Ordena por data mais recente
      const avaliacoesOrdenadas = avaliacoesData.sort((a, b) => 
        new Date(b.data) - new Date(a.data)
      );

      setAvaliacoes(avaliacoesOrdenadas);
      
      // Atualiza estatísticas de avaliação
      if (avaliacoesData.length > 0) {
        const somaEstrelas = avaliacoesData.reduce((sum, av) => sum + av.estrelas, 0);
        const media = somaEstrelas / avaliacoesData.length;
        
        console.log('Atualizando estatísticas:', {
          mediaEstrelas: media,
          totalAvaliacoes: avaliacoesData.length,
          somaEstrelas
        });
        
        setStats(prevStats => ({
          ...prevStats,
          mediaEstrelas: media,
          totalAvaliacoes: avaliacoesData.length
        }));
      } else {
        console.log('Nenhuma avaliação encontrada');
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
    console.log("Iniciando carregamento de empréstimos para usuário:", usuario?.id);
    
    if (!usuario?.id) {
      console.log("ID do usuário não disponível ainda");
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
        console.log("Empréstimos encontrados:", emprestimosData.length);
        console.log("Detalhes dos empréstimos:", emprestimosData);
        setEmprestimos(emprestimosData);
      }
    );

    return () => unsubscribe();
  }, [usuario.id]);

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        console.log("Buscando estatísticas para usuário:", usuario);

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
        
        console.log("Total de tarefas encontradas:", tarefasSnap.size);
        
        tarefasSnap.forEach(doc => {
          const tarefa = doc.data();
          console.log("Tarefa encontrada:", tarefa);
          
          if (tarefa.status === 'concluida') {
            tarefasConcluidas++;
            if (tarefa.avaliacaoSupervisor) {
              console.log("Avaliação encontrada:", tarefa.avaliacaoSupervisor);
              somaEstrelas += Number(tarefa.avaliacaoSupervisor);
              totalAvaliacoes++;
            }
          }
        });

        console.log("Tarefas concluídas:", tarefasConcluidas);
        console.log("Total avaliações:", totalAvaliacoes);
        console.log("Soma estrelas:", somaEstrelas);

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
          console.log("Empréstimo encontrado:", emprestimo);
          if (emprestimo.status === 'ativo' || emprestimo.status === 'emprestado') {
            // Conta todas as ferramentas do empréstimo
            emprestimosAtivos += emprestimo.ferramentas?.length || 0;
          }
        });

        console.log("Ferramentas emprestadas:", emprestimosAtivos);

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
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Cover & Profile Picture */}
      <div className="relative">
        <div className="h-32 bg-[#1D9BF0]/10"></div>
        <div className="absolute -bottom-12 left-4">
          <div className="w-24 h-24 rounded-full border-4 border-white dark:border-black bg-gray-200 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
            {usuario.photoURL ? (
              <img 
                src={usuario.photoURL} 
                alt={usuario.nome} 
                className="w-full h-full object-cover"
              />
            ) : (
              <UserCircle className="w-16 h-16 text-gray-400" />
            )}
          </div>
        </div>
        
        {/* Points Display */}
        <div className="absolute -bottom-12 right-4 flex items-center gap-2 bg-white dark:bg-gray-800 rounded-full px-4 py-2 shadow-md">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <div className="text-lg font-semibold">{stats.pontos.total} pontos</div>
        </div>
      </div>

      {/* Profile Info */}
      <div className="mt-16 px-4">
        <div className="flex items-start gap-6">
          <div className="flex-shrink-0">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white dark:border-gray-800 bg-gray-100 dark:bg-gray-800">
              {funcionarioInfo?.photoURL ? (
                <img 
                  src={funcionarioInfo.photoURL} 
                  alt={usuario.nome} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-600">
                  <Users className="w-12 h-12" />
                </div>
              )}
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {usuario.nome}
            </h2>
            <div className="flex items-center gap-2 mt-1 text-gray-500 dark:text-gray-400">
              <span className="text-sm">{cargoFuncionario || 'Funcionário'}</span>
            </div>
            <div className="flex items-center gap-2 mt-2 text-sm text-gray-500 dark:text-gray-400">
              <Calendar className="w-4 h-4" />
              <span>
                Entrou em {format(new Date(usuario.dataCriacao || Date.now()), 'MMMM yyyy', { locale: ptBR })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mt-6 px-4">
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          <div className="flex items-center gap-2 text-[#1D9BF0]">
            <CheckCircle className="w-5 h-5" />
            <span className="text-lg font-bold">{stats.tarefasConcluidas}</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Tarefas Concluídas</p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          <div className="flex items-center gap-2 text-[#1D9BF0]">
            <Package className="w-5 h-5" />
            <span className="text-lg font-bold">{stats.ferramentasEmprestadas}</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Ferramentas Emprestadas</p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          <div className="flex items-center gap-2 text-[#1D9BF0]">
            <Star className="w-5 h-5" />
            <span className="text-lg font-bold">
              {stats.mediaEstrelas.toFixed(1)}
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {stats.totalAvaliacoes} {stats.totalAvaliacoes === 1 ? 'Avaliação' : 'Avaliações'}
          </p>
        </div>

        {/* Points Breakdown */}
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          <div className="flex items-center gap-2 text-yellow-500">
            <Trophy className="w-5 h-5" />
            <span className="text-lg font-bold">{stats.pontos.total}</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Pontuação Total</p>
          <div className="mt-2 space-y-1 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex justify-between">
              <span>Ferramentas Devolvidas:</span>
              <span>{stats.pontos.detalhes.ferramentas} pts</span>
            </div>
            <div className="flex justify-between">
              <span>Tarefas Concluídas:</span>
              <span>{stats.pontos.detalhes.tarefas} pts</span>
            </div>
            <div className="flex justify-between">
              <span>Avaliações:</span>
              <span>{stats.pontos.detalhes.avaliacao} pts</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6 border-b dark:border-[#2F3336]">
        <div className="flex px-4">
          <button 
            className={`px-6 py-4 font-medium text-sm relative ${
              activeTab === 'inventario' 
                ? 'text-[#1D9BF0] font-bold' 
                : 'text-gray-600 dark:text-gray-400'
            }`}
            onClick={() => setActiveTab('inventario')}
          >
            Meu Inventário
            {activeTab === 'inventario' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#1D9BF0] rounded-full" />
            )}
          </button>
          <button 
            className={`px-6 py-4 font-medium text-sm relative ${
              activeTab === 'tarefas' 
                ? 'text-[#1D9BF0] font-bold' 
                : 'text-gray-600 dark:text-gray-400'
            }`}
            onClick={() => setActiveTab('tarefas')}
          >
            Minhas Tarefas
            {activeTab === 'tarefas' && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#1D9BF0] rounded-full" />
            )}
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-4 px-4">
        {activeTab === 'inventario' && emprestimos && (
          <MeuInventarioTab
            emprestimos={emprestimos}
          />
        )}
        {activeTab === 'tarefas' && (
          <TarefasTab 
            showOnlyUserTasks={true}
            showAddButton={false}
          />
        )}     
      </div>
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
