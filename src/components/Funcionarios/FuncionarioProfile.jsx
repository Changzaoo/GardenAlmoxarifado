import React, { useState, useEffect } from 'react';
import { X, Users, Phone, Briefcase, CheckCircle, Package, Clock, ThumbsUp, Gauge, Edit2, Calendar } from 'lucide-react';
import CargoSelect from './components/CargoSelect';
import { useAuth } from '../../hooks/useAuth';
import { collection, query, where, getDocs, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { formatarData, formatarDataHora } from '../../utils/dateUtils';
import AvaliacoesTab from './AvaliacoesTab';

const FuncionarioProfile = ({ funcionario, onClose }) => {
  const { usuario } = useAuth();
  const isFuncionario = usuario?.nivel === 'funcionario';
  const [editandoCargo, setEditandoCargo] = useState(false);
  const [cargoTemp, setCargoPerfil] = useState(funcionario.cargo || '');
  const [stats, setStats] = useState({
    tarefasConcluidas: 0,
    tarefasEmAndamento: 0,
    emprestimosAtivos: 0,
    mediaAvaliacoes: 0,
    totalAvaliacoes: 0,
    avaliacoes: [],
    pontosDesempenho: 0,
    pontosRegistrados: 0,
    pontosHoje: 0,
    pontosSemana: 0,
    pontosMes: 0,
    ultimoPonto: null
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
            // Se for um snapshot de empréstimos - atualizar contador
            const emprestimosAtivos = emprestimosData.filter(emp => 
              emp.status === 'ativo' || emp.status === 'emprestado' || !emp.dataDevolucao
            ).length;
            
            setStats(prev => ({
              ...prev,
              emprestimosAtivos
            }));
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

        // Calcular pontos das avaliações de desempenho
        const avaliacoesDesempenho = avaliacoes.filter(av => av.tipo === 'desempenho');
        const pontosDesempenho = avaliacoesDesempenho.reduce((sum, av) => {
          const nota = av.estrelas || av.nota || 0;
          return sum + (nota * 10); // 10 pontos por estrela
        }, 0);

        setStats(prev => ({
          ...prev,
          tarefasConcluidas,
          tarefasEmAndamento,
          mediaAvaliacoes: totalAvaliacoes > 0 ? (somaAvaliacoes / totalAvaliacoes) : 0,
          totalAvaliacoes,
          avaliacoes,
          pontosDesempenho
        }));
      } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
      }
    };

    if (funcionario?.id) {
      fetchUserStats();
    }
  }, [funcionario?.id, funcionario?.nome]);

  // Buscar pontos do WorkPonto
  useEffect(() => {
    if (!funcionario?.id) return;

    const pontosRef = collection(db, 'pontos');
    const q = query(
      pontosRef,
      where('funcionarioId', '==', String(funcionario.id)),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const pontos = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Calcular estatísticas
      const agora = new Date();
      const hoje = agora.toISOString().split('T')[0];
      
      // Início da semana (domingo)
      const inicioSemana = new Date(agora);
      inicioSemana.setDate(agora.getDate() - agora.getDay());
      inicioSemana.setHours(0, 0, 0, 0);
      
      // Início do mês
      const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);

      const pontosHoje = pontos.filter(p => p.data?.startsWith(hoje)).length;
      const pontosSemana = pontos.filter(p => {
        const dataPonto = new Date(p.timestamp);
        return dataPonto >= inicioSemana;
      }).length;
      const pontosMes = pontos.filter(p => {
        const dataPonto = new Date(p.timestamp);
        return dataPonto >= inicioMes;
      }).length;

      setStats(prev => ({
        ...prev,
        pontosRegistrados: pontos.length,
        pontosHoje,
        pontosSemana,
        pontosMes,
        ultimoPonto: pontos[0] || null
      }));
    });

    return () => unsubscribe();
  }, [funcionario?.id]);

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 dark:bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto relative"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 right-0 z-10 flex justify-end p-4 bg-white dark:bg-gray-800">
          <button 
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative">
          <div className="h-32 bg-blue-500 dark:bg-[#1D9BF0]/10"></div>
          <div className="absolute -bottom-16 left-6">
            <div className="w-32 h-32 rounded-full border-4 border-[#192734] bg-white dark:bg-gray-700 flex items-center justify-center overflow-hidden">
              {funcionario.photoURL ? (
                <img 
                  src={funcionario.photoURL} 
                  alt={funcionario.nome} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <Users className="w-16 h-16 text-gray-500 dark:text-gray-400" />
              )}
            </div>
          </div>
        </div>

        <div className="mt-20 px-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent mb-2">
                {funcionario.nome}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <Briefcase className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <div className="flex-1">
                  {editandoCargo ? (
                    <CargoSelect
                      value={cargoTemp}
                      onChange={setCargoPerfil}
                      className="bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 dark:text-gray-400">{funcionario.cargo || 'Cargo não definido'}</span>
                      {usuario?.nivel >= 2 && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditandoCargo(true);
                            setCargoPerfil(funcionario.cargo || '');
                          }}
                          className="p-1 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors"
                        >
                          <Edit2 className="w-3 h-3 text-blue-500 dark:text-[#1D9BF0]" />
                        </button>
                      )}
                </div>
              )}
            </div>
          </div>
          {editandoCargo && (
            <div className="flex gap-2 mt-2">
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  try {
                    const funcionarioRef = doc(db, 'funcionarios', funcionario.id);
                    await updateDoc(funcionarioRef, { cargo: cargoTemp });
                    setEditandoCargo(false);
                  } catch (error) {
                    console.error('Erro ao atualizar cargo:', error);
                  }
                }}
                className="px-3 py-1 bg-green-500 text-gray-900 dark:text-white rounded-lg text-sm hover:bg-green-600 transition-colors"
              >
                Salvar
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditandoCargo(false);
                  setCargoPerfil(funcionario.cargo || '');
                }}
                className="px-3 py-1 bg-red-500 text-gray-900 dark:text-white rounded-lg text-sm hover:bg-red-600 transition-colors"
              >
                Cancelar
              </button>
            </div>
          )}
              <div className="flex items-center gap-2 mt-2">
                <Phone className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-gray-500 dark:text-gray-400">{funcionario.telefone}</span>
              </div>
            </div>
          </div>

          {/* Cards de Estatísticas Modernos */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            {/* Pontos Desempenho */}
            <button
              onClick={() => {/* Pode adicionar ação futura */}}
              className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer text-left"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg">
                  <Gauge className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">Pontos</span>
              </div>
              <span className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">{stats.pontosDesempenho || 0}</span>
            </button>

            {/* Avaliação */}
            <button
              onClick={() => {/* Pode adicionar ação futura */}}
              className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl p-4 border border-yellow-200 dark:border-yellow-800 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer text-left"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg">
                  <ThumbsUp className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <span className="text-xs font-semibold text-yellow-700 dark:text-yellow-300 uppercase tracking-wide">Avaliação</span>
              </div>
              <span className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{stats.mediaAvaliacoes.toFixed(1)} ⭐</span>
            </button>

            {/* Tarefas Concluídas */}
            <button
              onClick={() => {/* Pode adicionar ação futura */}}
              className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer text-left"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide">Tarefas</span>
              </div>
              <span className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.tarefasConcluidas}</span>
            </button>

            {/* Em Andamento */}
            <button
              onClick={() => {/* Pode adicionar ação futura */}}
              className="bg-gradient-to-br from-cyan-50 to-sky-50 dark:from-cyan-900/20 dark:to-sky-900/20 rounded-xl p-4 border border-cyan-200 dark:border-cyan-800 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer text-left"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-cyan-100 dark:bg-cyan-900/50 rounded-lg">
                  <Clock className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                </div>
                <span className="text-xs font-semibold text-cyan-700 dark:text-cyan-300 uppercase tracking-wide">Em Andamento</span>
              </div>
              <span className="text-2xl font-bold text-cyan-900 dark:text-cyan-100">{stats.tarefasEmAndamento}</span>
            </button>

            {/* Empréstimos */}
            <button
              onClick={() => {/* Pode adicionar ação futura */}}
              className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-800 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer text-left"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                  <Package className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wide">Empréstimos</span>
              </div>
              <span className="text-2xl font-bold text-purple-900 dark:text-purple-100">{stats.emprestimosAtivos}</span>
            </button>
          </div>

          {/* Seção de Pontos WorkPonto */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-2xl p-6 border border-blue-200 dark:border-blue-800/30 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-xl">
                <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100">Registro de Pontos WorkPonto</h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {/* Total de Pontos */}
              <div className="bg-white dark:bg-gray-800/50 rounded-xl p-4 border border-blue-100 dark:border-blue-900/30">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase">Total</span>
                </div>
                <span className="text-3xl font-bold text-blue-900 dark:text-blue-100">{stats.pontosRegistrados}</span>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">pontos registrados</p>
              </div>

              {/* Pontos Hoje */}
              <div className="bg-white dark:bg-gray-800/50 rounded-xl p-4 border border-green-100 dark:border-green-900/30">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-xs font-semibold text-green-700 dark:text-green-300 uppercase">Hoje</span>
                </div>
                <span className="text-3xl font-bold text-green-900 dark:text-green-100">{stats.pontosHoje}</span>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">pontos hoje</p>
              </div>

              {/* Pontos Semana */}
              <div className="bg-white dark:bg-gray-800/50 rounded-xl p-4 border border-purple-100 dark:border-purple-900/30">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span className="text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase">Semana</span>
                </div>
                <span className="text-3xl font-bold text-purple-900 dark:text-purple-100">{stats.pontosSemana}</span>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">pontos nesta semana</p>
              </div>

              {/* Pontos Mês */}
              <div className="bg-white dark:bg-gray-800/50 rounded-xl p-4 border border-orange-100 dark:border-orange-900/30">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  <span className="text-xs font-semibold text-orange-700 dark:text-orange-300 uppercase">Mês</span>
                </div>
                <span className="text-3xl font-bold text-orange-900 dark:text-orange-100">{stats.pontosMes}</span>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">pontos neste mês</p>
              </div>
            </div>

            {/* Último Ponto Registrado */}
            {stats.ultimoPonto && (
              <div className="bg-white dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                      <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Último Registro</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(stats.ultimoPonto.timestamp).toLocaleDateString('pt-BR')} às{' '}
                        {new Date(stats.ultimoPonto.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      stats.ultimoPonto.tipo === 'entrada' ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300' :
                      stats.ultimoPonto.tipo === 'saida_almoco' ? 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300' :
                      stats.ultimoPonto.tipo === 'retorno_almoco' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' :
                      'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300'
                    }`}>
                      {stats.ultimoPonto.tipo === 'entrada' ? '🟢 Entrada' :
                       stats.ultimoPonto.tipo === 'saida_almoco' ? '🟠 Saída Almoço' :
                       stats.ultimoPonto.tipo === 'retorno_almoco' ? '🔵 Retorno Almoço' :
                       '🔴 Saída'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {usuario?.nivel >= 2 && (
          <>
            <div className="mt-6 border-b border-gray-200 dark:border-[#2F3336]">
              <div className="flex px-6">
                <button 
                  className="px-6 py-4 font-medium text-sm relative text-blue-500 dark:text-[#1D9BF0] font-bold"
                >
                  Avaliações
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 dark:bg-[#1D9BF0] rounded-full" />
                </button>
              </div>
            </div>

            <div className="mt-4 px-6 pb-6">
              <AvaliacoesTab 
                funcionario={funcionario} 
                pontosDesempenho={stats.pontosDesempenho}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FuncionarioProfile;





