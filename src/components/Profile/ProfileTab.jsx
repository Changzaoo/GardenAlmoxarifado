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
  Briefcase
} from 'lucide-react';
import MeuInventarioTab from '../Inventario/MeuInventarioTab';
import TarefasTab from '../Tarefas/TarefasTab';
import CronogramaSemanalCard from '../Tarefas/CronogramaSemanalCard';
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
  const [dadosFuncionario, setDadosFuncionario] = useState(null);
  
  // Buscar funcionarioInfo da lista carregada (MESMA FONTE que página de Tarefas)
  // Garante que photoURL e cargo são exatamente os mesmos em todo o sistema
  const funcionarioInfo = funcionarios.find(f => {
    // Tenta match por email (mais confiável)
    if (f.email && usuario?.email && f.email === usuario.email) return true;
    // Tenta match por ID do documento Firestore
    if (f.id === usuario?.id) return true;
    // Tenta match por campo 'id' interno do documento
    if (f.id === usuario?.uid) return true;
    // Tenta match convertendo para string
    if (String(f.id) === String(usuario?.id)) return true;
    if (String(f.email) === String(usuario?.email)) return true;
    return false;
  });
  
  // Buscar dados diretamente do Firestore como fallback
  useEffect(() => {
    if (funcionarioInfo) {
      setDadosFuncionario(funcionarioInfo);
      console.log('✅ Usando dados do FuncionariosProvider:', funcionarioInfo);
      return;
    }
    
    if (!usuario?.email) return;
    
    console.log('⚠️ funcionarioInfo não encontrado, buscando diretamente do Firestore...');
    console.log('Buscando por email:', usuario.email);
    
    const unsubscribe = onSnapshot(
      query(
        collection(db, 'funcionarios'),
        where('email', '==', usuario.email)
      ),
      (snapshot) => {
        if (!snapshot.empty) {
          const dados = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
          console.log('✅ Dados encontrados no Firestore:', dados);
          setDadosFuncionario(dados);
        } else {
          console.log('❌ Nenhum funcionário encontrado com email:', usuario.email);
        }
      }
    );
    
    return () => unsubscribe();
  }, [usuario?.email, funcionarioInfo]);
  
  // PRIORIZAR funcionarioInfo (do contexto) para garantir sincronização
  // Isso garante que cargo, foto e setor sejam os mesmos em todo o sistema
  const dadosExibicao = funcionarioInfo || dadosFuncionario;
  
  // Debug do cargo e usuário
  useEffect(() => {
    console.log('👤 USUÁRIO LOGADO (ProfileTab):', {
      id: usuario?.id,
      nome: usuario?.nome,
      email: usuario?.email,
      funcionarioInfo: funcionarioInfo,
      dadosFuncionario: dadosFuncionario,
      dadosExibicao: dadosExibicao,
      cargo_funcionarioInfo: funcionarioInfo?.cargo,
      cargo_dadosFuncionario: dadosFuncionario?.cargo,
      cargo_dadosExibicao: dadosExibicao?.cargo
    });
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
              {dadosExibicao?.photoURL ? (
                <img 
                  src={dadosExibicao.photoURL} 
                  alt={usuario.nome} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserCircle className="w-20 h-20 text-gray-400" />
              )}
            </div>
            {/* Badge de status online */}
            <div className="absolute bottom-2 right-2 w-7 h-7 bg-green-500 border-4 border-white dark:border-gray-900 rounded-full animate-pulse shadow-lg"></div>
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

      {/* Stats - Redesenhado */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 px-6">
        {/* Card Tarefas */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-gradient-to-br from-green-400 to-emerald-500 p-3 rounded-xl shadow-lg">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <span className="text-3xl font-bold text-gray-900 dark:text-white">{stats.tarefasConcluidas}</span>
          </div>
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Tarefas Concluídas</p>
          <div className="mt-2 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full" style={{ width: '75%' }}></div>
          </div>
        </div>

        {/* Card Ferramentas */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-gradient-to-br from-blue-400 to-sky-500 p-3 rounded-xl shadow-lg">
              <Package className="w-6 h-6 text-white" />
            </div>
            <span className="text-3xl font-bold text-gray-900 dark:text-white">{stats.ferramentasEmprestadas}</span>
          </div>
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Ferramentas Emprestadas</p>
          <div className="mt-2 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-400 to-sky-500 rounded-full" style={{ width: '60%' }}></div>
          </div>
        </div>

        {/* Card Avaliações */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-3 rounded-xl shadow-lg">
              <Star className="w-6 h-6 text-white" />
            </div>
            <span className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats.mediaEstrelas.toFixed(1)}
            </span>
          </div>
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
            {stats.totalAvaliacoes} {stats.totalAvaliacoes === 1 ? 'Avaliação' : 'Avaliações'}
          </p>
          <div className="mt-2 flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star 
                key={star}
                className={`w-3 h-3 ${star <= Math.round(stats.mediaEstrelas) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
              />
            ))}
          </div>
        </div>

      </div>

      {/* Points Breakdown - Card grande */}
      <div className="mt-6 px-6">
        <div className="rounded-2xl p-6 shadow-2xl border border-blue-400/50" style={{ backgroundColor: '#1988d3' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                <Trophy className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-white/80 text-sm font-medium">Detalhamento de Pontos</p>
                <p className="text-3xl font-bold text-white">{stats.pontos.total} pontos</p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-4 h-4 text-white" />
                <span className="text-xs text-white/80 font-medium">Ferramentas Devolvidas</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-white">{stats.pontos.detalhes.ferramentas}</span>
                <span className="text-sm text-white/60">pts</span>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-white" />
                <span className="text-xs text-white/80 font-medium">Tarefas Concluídas</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-white">{stats.pontos.detalhes.tarefas}</span>
                <span className="text-sm text-white/60">pts</span>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-4 h-4 text-white" />
                <span className="text-xs text-white/80 font-medium">Avaliações</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-white">{stats.pontos.detalhes.avaliacao}</span>
                <span className="text-sm text-white/60">pts</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs - Redesenhado com cards modernos */}
      <div className="mt-6 px-6">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button 
            className={`relative overflow-hidden rounded-2xl p-6 transition-all duration-300 transform hover:scale-105 ${
              activeTab === 'inventario' 
                ? 'shadow-xl' 
                : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700'
            }`}
            style={activeTab === 'inventario' ? { backgroundColor: '#1988d3', boxShadow: '0 20px 25px -5px rgba(25, 136, 211, 0.5), 0 8px 10px -6px rgba(25, 136, 211, 0.5)' } : {}}
            onClick={() => setActiveTab('inventario')}
          >
            {activeTab === 'inventario' && (
              <div className="absolute inset-0 bg-white/10"></div>
            )}
            <div className="relative flex items-center gap-3">
              <div className={`p-3 rounded-xl ${
                activeTab === 'inventario' 
                  ? 'bg-white/20 backdrop-blur-sm' 
                  : 'bg-blue-100 dark:bg-blue-900/30'
              }`}>
                <Package className={`w-6 h-6 ${
                  activeTab === 'inventario' 
                    ? 'text-white' 
                    : 'text-blue-600 dark:text-blue-400'
                }`} />
              </div>
              <div className="text-left">
                <h3 className={`font-bold text-lg ${
                  activeTab === 'inventario' 
                    ? 'text-white' 
                    : 'text-gray-900 dark:text-white'
                }`}>
                  Meu Inventário
                </h3>
                <p className={`text-sm ${
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
            className={`relative overflow-hidden rounded-2xl p-6 transition-all duration-300 transform hover:scale-105 ${
              activeTab === 'tarefas' 
                ? 'shadow-xl' 
                : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700'
            }`}
            style={activeTab === 'tarefas' ? { backgroundColor: '#1988d3', boxShadow: '0 20px 25px -5px rgba(25, 136, 211, 0.5), 0 8px 10px -6px rgba(25, 136, 211, 0.5)' } : {}}
            onClick={() => setActiveTab('tarefas')}
          >
            {activeTab === 'tarefas' && (
              <div className="absolute inset-0 bg-white/10"></div>
            )}
            <div className="relative flex items-center gap-3">
              <div className={`p-3 rounded-xl ${
                activeTab === 'tarefas' 
                  ? 'bg-white/20 backdrop-blur-sm' 
                  : 'bg-blue-100 dark:bg-blue-900/30'
              }`}>
                <CheckCircle className={`w-6 h-6 ${
                  activeTab === 'tarefas' 
                    ? 'text-white' 
                    : 'text-blue-600 dark:text-blue-400'
                }`} />
              </div>
              <div className="text-left">
                <h3 className={`font-bold text-lg ${
                  activeTab === 'tarefas' 
                    ? 'text-white' 
                    : 'text-gray-900 dark:text-white'
                }`}>
                  Minhas Tarefas
                </h3>
                <p className={`text-sm ${
                  activeTab === 'tarefas' 
                    ? 'text-white/80' 
                    : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {stats.tarefasConcluidas} concluídas
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

