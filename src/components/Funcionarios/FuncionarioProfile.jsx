import React, { useState, useEffect } from 'react';
import { X, Users, Phone, Briefcase, CheckCircle, Package, Search, Clock, MessageSquare, ThumbsUp, Gauge, Wrench } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import MeuInventarioTab from '../Inventario/MeuInventarioTab';
import TarefasTab from '../Tarefas/TarefasTab';
import { FuncionariosProvider } from './FuncionariosProvider';
import { formatarData, formatarDataHora } from '../../utils/dateUtils';
import AvaliacoesTab from './AvaliacoesTab';

const FuncionarioProfile = ({ funcionario, onClose }) => {
  const { usuario } = useAuth();
  const isFuncionario = usuario?.nivel === 'funcionario';
  const [activeTab, setActiveTab] = useState('inventario');
  const [emprestimos, setEmprestimos] = useState([]);
  const [filtroEmprestimos, setFiltroEmprestimos] = useState('');
  const [filtroPeriodo, setFiltroPeriodo] = useState('todos'); // 'todos', 'hoje', 'semana', 'mes'
  const [filtroStatus, setFiltroStatus] = useState('todos'); // 'todos', 'emprestado', 'devolvido'
  const [avaliacoesExpandidas, setAvaliacoesExpandidas] = useState({
    desempenho: false,
    tarefas: false,
    autoavaliacoes: false
  });
  const [stats, setStats] = useState({
    tarefasConcluidas: 0,
    tarefasEmAndamento: 0,
    emprestimosAtivos: 0,
    mediaAvaliacoes: 0,
    totalAvaliacoes: 0,
    avaliacoes: [],
    pontosDesempenho: 0
  });

  // Carregar empréstimos do funcionário
  useEffect(() => {
    if (!funcionario?.id || !funcionario?.nome) return;

        // Configurar referências das coleções
        const emprestimosRef = collection(db, 'emprestimos');
        const avaliacoesRef = collection(db, 'avaliacoes');
        const avaliacoesDesempenhoRef = collection(db, 'avaliacoesDesempenho');
        
        // Configurar queries de empréstimos
        const emprestimosQueries = [
          query(emprestimosRef, where('funcionarioId', '==', String(funcionario.id))),
          query(emprestimosRef, where('funcionarioId', '==', Number(funcionario.id))),
          query(emprestimosRef, where('funcionario', '==', funcionario.nome)),
          query(emprestimosRef, where('colaborador', '==', funcionario.nome)),
          query(emprestimosRef, where('responsavel', '==', funcionario.nome.toLowerCase())),
          query(emprestimosRef, where('responsavel', '==', funcionario.nome))
        ];
        
        // Configurar queries de avaliações
        const avaliacoesQueries = [
          query(avaliacoesRef, where('funcionarioId', '==', funcionario.id))
        ];
        
        // Configurar queries de avaliações de desempenho
        const avaliacoesDesempenhoQueries = [
          query(avaliacoesDesempenhoRef, where('funcionarioId', '==', funcionario.id))
        ];
        
        // Combinar todas as queries
        const queries = [
          ...emprestimosQueries,
          ...avaliacoesQueries,
          ...avaliacoesDesempenhoQueries
        ];    const unsubscribes = queries.map(q => 
      onSnapshot(q, (snapshot) => {
        const emprestimosData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        if (emprestimosData.length > 0) {
          // Verificar o tipo de dados baseado no conteúdo
          const isEmprestimo = emprestimosData.length > 0 && ('status' in emprestimosData[0] || 'dataEmprestimo' in emprestimosData[0]);
          const isAvaliacao = emprestimosData.length > 0 && ('nota' in emprestimosData[0] || 'avaliacao' in emprestimosData[0]);
          
          if (isEmprestimo) {
            // Se for um snapshot de empréstimos
            setEmprestimos(prev => {
              const uniqueEmprestimos = [...prev];
              emprestimosData.forEach(emp => {
                if (!uniqueEmprestimos.some(e => e.id === emp.id)) {
                  uniqueEmprestimos.push(emp);
                }
              });
              return uniqueEmprestimos;
            });
          } else if (isAvaliacao) {
            // Se for um snapshot de avaliações (regulares ou desempenho)
            const avaliacoes = emprestimosData.map(av => ({
              ...av,
              tipo: av.tipo || ('avaliacaoDesempenho' in av ? 'desempenho' : 'regular'),
              nota: Number(av.nota || av.estrelas || av.avaliacao || 0),
              data: av.data || new Date().toISOString()
            }));
            
            setStats(prev => {
              const todasAvaliacoes = [...(prev.avaliacoes || [])];
              avaliacoes.forEach(av => {
                if (!todasAvaliacoes.some(a => a.id === av.id)) {
                  todasAvaliacoes.push(av);
                }
              });
              // Ordenar por data mais recente
              todasAvaliacoes.sort((a, b) => new Date(b.data) - new Date(a.data));
              
              // Calcular médias e pontos
              const avaliacoesDesempenho = todasAvaliacoes.filter(av => av.tipo === 'desempenho');
              const avaliacoesRegulares = todasAvaliacoes.filter(av => av.tipo === 'regular');
              
              // Calcular pontos totais (10 pontos por estrela de avaliação de desempenho)
              const pontosDesempenho = avaliacoesDesempenho.reduce((sum, av) => {
                const nota = av.estrelas || av.nota || 0;
                return sum + (nota * 10); // 10 pontos por estrela
              }, 0);
              
              const mediaDesempenho = avaliacoesDesempenho.length > 0
                ? avaliacoesDesempenho.reduce((sum, av) => sum + (av.estrelas || av.nota || 0), 0) / avaliacoesDesempenho.length
                : 0;
              
              const mediaRegular = avaliacoesRegulares.length > 0
                ? avaliacoesRegulares.reduce((sum, av) => sum + (av.estrelas || av.nota || 0), 0) / avaliacoesRegulares.length
                : 0;
              
              return {
                ...prev,
                avaliacoes: todasAvaliacoes,
                mediaAvaliacoes: ((mediaDesempenho + mediaRegular) / 2) || 0,
                totalAvaliacoes: todasAvaliacoes.length,
                pontosDesempenho: pontosDesempenho
              };
            });
          }
        }
      })
    );

    return () => {
      unsubscribes.forEach(unsub => unsub());
      setEmprestimos([]);
    };
  }, [funcionario?.id, funcionario?.nome]);

  // Carregar estatísticas
  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        const tarefasRef = collection(db, 'tarefas');
        const avaliacoesRef = collection(db, 'avaliacoes');
        
        const [
          funcionariosIdsSnap,
          funcionarioSnap,
          funcionarioLowerSnap,
          responsavelSnap,
          responsavelLowerSnap,
          avaliacoesSnap
        ] = await Promise.all([
          getDocs(query(tarefasRef, where('funcionariosIds', 'array-contains', funcionario.nome))),
          getDocs(query(tarefasRef, where('funcionario', '==', funcionario.nome))),
          getDocs(query(tarefasRef, where('funcionario', '==', funcionario.nome.toLowerCase()))),
          getDocs(query(tarefasRef, where('responsavel', '==', funcionario.nome))),
          getDocs(query(tarefasRef, where('responsavel', '==', funcionario.nome.toLowerCase()))),
          getDocs(query(avaliacoesRef, where('funcionarioId', '==', funcionario.id)))
        ]);
        
        let tarefasConcluidas = 0;
        let tarefasEmAndamento = 0;
        let somaAvaliacoes = 0;
        let totalAvaliacoes = 0;
        
        // Carregar avaliações do funcionário
        const avaliacoes = avaliacoesSnap.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            nota: Number(data.estrelas || data.nota || data.avaliacao || 0),
            tipo: data.tipo || (data.avaliacaoDesempenho ? 'desempenho' : 'regular')
          };
        });
        
        const processarTarefas = (snapshot) => {
          snapshot.forEach(doc => {
            const tarefa = doc.data();
            if (tarefa.status === 'concluida') {
              tarefasConcluidas++;
              if (tarefa.avaliacaoSupervisor) {
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
        processarTarefas(funcionarioLowerSnap);
        processarTarefas(responsavelSnap);
        processarTarefas(responsavelLowerSnap);

        // Contar empréstimos ativos
        const emprestimosAtivos = emprestimos.filter(emp => 
          emp.status === 'ativo' || emp.status === 'emprestado'
        ).length;

        // Calcular pontos das avaliações de desempenho
        const avaliacoesDesempenho = avaliacoes.filter(av => av.tipo === 'desempenho');
        const pontosDesempenho = avaliacoesDesempenho.reduce((sum, av) => {
          const nota = av.estrelas || av.nota || 0;
          return sum + (nota * 10); // 10 pontos por estrela
        }, 0);

        setStats({
          tarefasConcluidas,
          tarefasEmAndamento,
          emprestimosAtivos,
          mediaAvaliacoes: totalAvaliacoes > 0 ? (somaAvaliacoes / totalAvaliacoes) : 0,
          totalAvaliacoes,
          avaliacoes,
          pontosDesempenho
        });
      } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
      }
    };

    if (funcionario?.id) {
      fetchUserStats();
    }
  }, [funcionario?.id, funcionario?.nome, emprestimos]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-[#192734] rounded-2xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto relative"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 right-0 z-10 flex justify-end p-4 bg-[#192734]">
          <button 
            onClick={onClose}
            className="text-[#8899A6] hover:text-white transition-colors p-2 hover:bg-[#253341] rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative">
          <div className="h-32 bg-[#1DA1F2]/10"></div>
          <div className="absolute -bottom-16 left-6">
            <div className="w-32 h-32 rounded-full border-4 border-[#192734] bg-[#253341] flex items-center justify-center overflow-hidden">
              {funcionario.photoURL ? (
                <img 
                  src={funcionario.photoURL} 
                  alt={funcionario.nome} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <Users className="w-16 h-16 text-[#8899A6]" />
              )}
            </div>
          </div>
        </div>

        <div className="mt-20 px-6">
          <h2 className="text-2xl font-bold text-white">
            {funcionario.nome}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <Briefcase className="w-4 h-4 text-[#8899A6]" />
            <span className="text-[#8899A6]">{funcionario.cargo}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Phone className="w-4 h-4 text-[#8899A6]" />
            <span className="text-[#8899A6]">{funcionario.telefone}</span>
          </div>
        </div>

        



         

        <div className="mt-6 border-b border-[#2F3336]">
          <div className="flex px-6">
            <button 
              className={`px-6 py-4 font-medium text-sm relative ${
                activeTab === 'inventario' 
                  ? 'text-[#1DA1F2] font-bold' 
                  : 'text-[#8899A6]'
              }`}
              onClick={() => setActiveTab('inventario')}
            >
              Inventário
              {activeTab === 'inventario' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#1DA1F2] rounded-full" />
              )}
            </button>
            <button 
              className={`px-6 py-4 font-medium text-sm relative ${
                activeTab === 'tarefas' 
                  ? 'text-[#1DA1F2] font-bold' 
                  : 'text-[#8899A6]'
              }`}
              onClick={() => setActiveTab('tarefas')}
            >
              Tarefas
              {activeTab === 'tarefas' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#1DA1F2] rounded-full" />
              )}
            </button>
            {usuario?.nivel >= 2 && (
              <button 
                className={`px-6 py-4 font-medium text-sm relative ${
                  activeTab === 'avaliacoes' 
                    ? 'text-[#1DA1F2] font-bold' 
                    : 'text-[#8899A6]'
                }`}
                onClick={() => setActiveTab('avaliacoes')}
              >
                Avaliações
                {activeTab === 'avaliacoes' && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#1DA1F2] rounded-full" />
                )}
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 px-6 pb-6">
          {activeTab === 'inventario' && (
            <>
              <div className="flex gap-4 items-center mb-4">
                <div className="relative flex-1 min-w-[350px]">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8899A6]" />
                  <input
                    type="text"
                    placeholder="Buscar por ferramenta..."
                    value={filtroEmprestimos}
                    onChange={(e) => setFiltroEmprestimos(e.target.value)}
                    className="w-full h-10 pl-10 pr-4 border border-[#38444D] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1DA1F2] bg-[#253341] text-white placeholder-[#8899A6] text-sm"
                  />
                </div>
                <select
                  value={filtroPeriodo}
                  onChange={(e) => setFiltroPeriodo(e.target.value)}
                  className="border border-[#38444D] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1DA1F2] bg-[#253341] text-white hover:bg-[#2C3A48]"
                >
                  <option value="todos">Todos os períodos</option>
                  <option value="hoje">Hoje</option>
                  <option value="semana">Últimos 7 dias</option>
                  <option value="mes">Último mês</option>
                </select>
                <select
                  value={filtroStatus}
                  onChange={(e) => setFiltroStatus(e.target.value)}
                  className="border border-[#38444D] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1DA1F2] bg-[#253341] text-white hover:bg-[#2C3A48]"
                >
                  <option value="todos">Todos os status</option>
                  <option value="emprestado">Não devolvidos</option>
                  <option value="devolvido">Devolvidos</option>
                </select>
              </div>
              <div className="text-sm text-[#8899A6] mb-4">
                {emprestimos.length === 0 ? (
                  'Nenhum empréstimo encontrado para este funcionário'
                ) : (
                  `${emprestimos.length} empréstimo${emprestimos.length !== 1 ? 's' : ''} encontrado${emprestimos.length !== 1 ? 's' : ''}`
                )}
              </div>
              <FuncionariosProvider>
                <MeuInventarioTab
                  emprestimos={emprestimos.filter(emp => {
                    // Filtra por termo de busca
                    if (filtroEmprestimos && !emp.ferramentas?.some(f => 
                      f.nome.toLowerCase().includes(filtroEmprestimos.toLowerCase())
                    )) {
                      return false;
                    }

                    // Filtra por status
                    if (filtroStatus === 'emprestado' && emp.status !== 'ativo') {
                      return false;
                    }
                    if (filtroStatus === 'devolvido' && emp.status !== 'devolvido') {
                      return false;
                    }

                    // Filtra por período
                    if (filtroPeriodo !== 'todos') {
                      const empDate = new Date(emp.dataEmprestimo);
                      const today = new Date();
                      
                      switch (filtroPeriodo) {
                        case 'hoje':
                          return empDate.getDate() === today.getDate() &&
                                empDate.getMonth() === today.getMonth() &&
                                empDate.getFullYear() === today.getFullYear();
                        case 'semana':
                          const weekAgo = new Date(today);
                          weekAgo.setDate(today.getDate() - 7);
                          return empDate >= weekAgo;
                        case 'mes':
                          const monthAgo = new Date(today);
                          monthAgo.setMonth(today.getMonth() - 1);
                          return empDate >= monthAgo;
                        default:
                          return true;
                      }
                    }

                    return true;
                  })}
                  readOnly={true}
                  showEmptyMessage={`Nenhum empréstimo encontrado para ${funcionario.nome}`}
                />
              </FuncionariosProvider>
            </>
          )}
          {activeTab === 'tarefas' && (
            <>
              <div className="text-sm text-[#8899A6] mb-4">
                {stats.tarefasConcluidas > 0 && (
                  `${stats.tarefasConcluidas} tarefa${stats.tarefasConcluidas !== 1 ? 's' : ''}`
                )}
                {stats.totalAvaliacoes > 0 && (
                  ` • Média de avaliação: ${stats.mediaAvaliacoes.toFixed(1)} `
                )}
              </div>
              <FuncionariosProvider>
                <TarefasTab 
                  showOnlyUserTasks={true}
                  showAddButton={false}
                  userFilter={funcionario.nome}
                  readOnly={true}
                  defaultFiltros={{
                    status: 'todas',
                    periodo: 'todos',
                    avaliacao: 'todas'
                  }}
                />
              </FuncionariosProvider>
            </>
          )}
          {activeTab === 'avaliacoes' && (
            <AvaliacoesTab 
              funcionario={funcionario} 
              pontosDesempenho={stats.pontosDesempenho}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default FuncionarioProfile;
