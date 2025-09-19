import React, { useState, useEffect } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { Trophy, Star, CheckCircle, ToolCase, Medal, ChevronDown, Calendar, X } from 'lucide-react';

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

// Função para obter as semanas do mês
const getSemanasDoMes = (ano, mes) => {
  const primeiroDia = new Date(ano, mes, 1);
  const ultimoDia = new Date(ano, mes + 1, 0);
  const semanas = [];

  // Ajusta para começar da primeira segunda-feira se o mês não começar em uma
  let inicio = new Date(primeiroDia);
  inicio.setDate(inicio.getDate() - inicio.getDay() + (inicio.getDay() === 0 ? -6 : 1));

  while (inicio <= ultimoDia) {
    const fim = new Date(inicio);
    fim.setDate(fim.getDate() + 6);

    // Ajusta o fim da semana para não ultrapassar o mês
    const fimAjustado = new Date(Math.min(fim, ultimoDia));

    semanas.push({
      inicio: new Date(inicio),
      fim: fimAjustado,
      label: `${inicio.getDate()}/${mes + 1} - ${fimAjustado.getDate()}/${mes + 1}`
    });

    inicio = new Date(fim);
    inicio.setDate(inicio.getDate() + 1);
  }

  return semanas;
};

const RankingPontos = () => {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [periodoAtual, setPeriodoAtual] = useState('geral'); // 'geral', 'mes', 'ano', 'semana'
  const [mesSelected, setMesSelected] = useState(new Date().getMonth());
  const [anoSelected, setAnoSelected] = useState(new Date().getFullYear());
  const [showMesSelector, setShowMesSelector] = useState(false);
  const [showAnoSelector, setShowAnoSelector] = useState(false);
  const [showSemanaSelector, setShowSemanaSelector] = useState(false);
  const [semanaSelected, setSemanaSelected] = useState(0);
  const [selectedFuncionario, setSelectedFuncionario] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  
  // Calcular as semanas do mês atual
  const semanasDoMes = getSemanasDoMes(anoSelected, mesSelected);

  // Fechar seletores quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.selector-container')) {
        setShowMesSelector(false);
        setShowAnoSelector(false);
        setShowSemanaSelector(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Resetar semana selecionada quando mudar mês ou ano
  useEffect(() => {
    setSemanaSelected(0);
  }, [mesSelected, anoSelected]);



  const filtrarPorPeriodo = (dados) => {
    return dados.map(funcionario => {
      let pontuacaoFiltrada = { ...funcionario.pontuacao };
      
      if (periodoAtual === 'mes' || periodoAtual === 'ano' || periodoAtual === 'semana') {
        let dataLimiteInicio, dataLimiteFim;

        if (periodoAtual === 'semana') {
          dataLimiteInicio = semanasDoMes[semanaSelected].inicio;
          dataLimiteFim = semanasDoMes[semanaSelected].fim;
        } else if (periodoAtual === 'mes') {
          dataLimiteInicio = new Date(anoSelected, mesSelected, 1);
          dataLimiteFim = new Date(anoSelected, mesSelected + 1, 0);
        } else { // ano
          dataLimiteInicio = new Date(anoSelected, 0, 1);
          dataLimiteFim = new Date(anoSelected, 11, 31, 23, 59, 59);
        }
        
        // Filtrar empréstimos e tarefas pelo período
        pontuacaoFiltrada = {
          ...pontuacaoFiltrada,
          total: 0,
          detalhes: {
            ferramentas: funcionario.emprestimos
              .filter(emp => {
                const data = new Date(emp.dataDevolucao);
                return data >= dataLimiteInicio && data <= dataLimiteFim;
              })
              .length * 20,
            tarefas: funcionario.tarefas
              .filter(tarefa => {
                const data = new Date(tarefa.dataConclusao);
                return data >= dataLimiteInicio && data <= dataLimiteFim;
              })
              .length * 50,
            avaliacao: funcionario.avaliacoes
              .filter(av => {
                const data = new Date(av.data);
                return data >= dataLimiteInicio && data <= dataLimiteFim;
              })
              .reduce((acc, av) => acc + (av.estrelas * 10), 0)
          }
        };
        
        pontuacaoFiltrada.total = 
          pontuacaoFiltrada.detalhes.ferramentas + 
          pontuacaoFiltrada.detalhes.tarefas + 
          pontuacaoFiltrada.detalhes.avaliacao;
      }

      return {
        ...funcionario,
        pontuacao: pontuacaoFiltrada
      };
    });
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const calcularPontuacao = (dados) => {
    const pontosPorFerramentasDevolvidas = (dados.ferramentasDevolvidas || 0) * 20;
    const pontosPorTarefasConcluidas = (dados.tarefasConcluidas || 0) * 50;
    
    // Calcula pontos por avaliação (5 estrelas = 50 pontos, 4 = 40, 3 = 30, 2 = 20, 1 = 10)
    const pontosPorAvaliacao = dados.avaliacao ? Math.round(dados.avaliacao * 10) : 0;

    return {
      total: pontosPorFerramentasDevolvidas + pontosPorTarefasConcluidas + pontosPorAvaliacao,
      detalhes: {
        ferramentas: pontosPorFerramentasDevolvidas,
        tarefas: pontosPorTarefasConcluidas,
        avaliacao: pontosPorAvaliacao
      }
    };
  };

  const carregarDados = async () => {
    try {
      const funcionariosRef = collection(db, 'usuarios');
      const emprestimosRef = collection(db, 'emprestimos');
      const tarefasRef = collection(db, 'tarefas');
      const avaliacoesRef = collection(db, 'avaliacoes');

      // Buscar todos os dados necessários
      const [funcionariosSnap, emprestimosSnap, tarefasSnap, avaliacoesSnap] = await Promise.all([
        getDocs(funcionariosRef),
        getDocs(emprestimosRef),
        getDocs(tarefasRef),
        getDocs(avaliacoesRef)
      ]);

      // Processar funcionários
      const dadosFuncionarios = {};
      funcionariosSnap.forEach(doc => {
        const funcionario = doc.data();
        dadosFuncionarios[doc.id] = {
          id: doc.id,
          nome: funcionario.nome,
          photoURL: funcionario.photoURL,
          ferramentasDevolvidas: 0,
          tarefasConcluidas: 0,
          avaliacao: 0,
          avaliacoes: []
        };
      });

      // Contar ferramentas devolvidas
      emprestimosSnap.forEach(doc => {
        const emprestimo = doc.data();
        if (emprestimo.status === 'devolvido' && emprestimo.funcionarioId) {
          if (dadosFuncionarios[emprestimo.funcionarioId]) {
            dadosFuncionarios[emprestimo.funcionarioId].ferramentasDevolvidas += 
              (emprestimo.ferramentas?.length || 0);
          }
        }
      });

      // Contar tarefas concluídas
      tarefasSnap.forEach(doc => {
        const tarefa = doc.data();
        if (tarefa.status === 'concluida' && tarefa.responsavelId) {
          if (dadosFuncionarios[tarefa.responsavelId]) {
            dadosFuncionarios[tarefa.responsavelId].tarefasConcluidas++;
          }
        }
      });

      // Calcular média das avaliações
      avaliacoesSnap.forEach(doc => {
        const avaliacao = doc.data();
        if (avaliacao.funcionarioId && avaliacao.estrelas) {
          if (dadosFuncionarios[avaliacao.funcionarioId]) {
            dadosFuncionarios[avaliacao.funcionarioId].avaliacoes.push(avaliacao.estrelas);
          }
        }
      });

      // Calcular média das avaliações
      Object.values(dadosFuncionarios).forEach(funcionario => {
        if (funcionario.avaliacoes.length > 0) {
          funcionario.avaliacao = funcionario.avaliacoes.reduce((a, b) => a + b, 0) / funcionario.avaliacoes.length;
        }
      });

      // Preparar dados com datas
      const rankingList = Object.values(dadosFuncionarios)
        .map(funcionario => {
          const emprestimos = [];
          const tarefas = [];
          const avaliacoes = [];

          // Coletar empréstimos com datas
          emprestimosSnap.forEach(doc => {
            const emp = doc.data();
            if (emp.status === 'devolvido' && emp.funcionarioId === funcionario.id) {
              emprestimos.push({
                dataDevolucao: emp.dataDevolucao,
                quantidade: emp.ferramentas?.length || 0
              });
            }
          });

          // Coletar tarefas com datas
          tarefasSnap.forEach(doc => {
            const tarefa = doc.data();
            if (tarefa.status === 'concluida' && tarefa.responsavelId === funcionario.id) {
              tarefas.push({
                dataConclusao: tarefa.dataConclusao || tarefa.dataAtualizacao
              });
            }
          });

          // Coletar avaliações com datas
          avaliacoesSnap.forEach(doc => {
            const avaliacao = doc.data();
            if (avaliacao.funcionarioId === funcionario.id) {
              avaliacoes.push({
                data: avaliacao.data || doc.createTime,
                estrelas: avaliacao.estrelas
              });
            }
          });

          return {
            ...funcionario,
            emprestimos,
            tarefas,
            avaliacoes,
            pontuacao: calcularPontuacao(funcionario)
          };
        });

      setRankings(rankingList);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setLoading(false);
    }
  };

  const renderPosicaoIcon = (posicao) => {
    switch (posicao) {
      case 0:
        return <Medal className="w-6 h-6 text-yellow-500" />;
      case 1:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 2:
        return <Medal className="w-6 h-6 text-amber-600" />;
      default:
        return <div className="w-6 h-6 flex items-center justify-center font-medium text-gray-500">
          {posicao + 1}
        </div>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      {showDetails && selectedFuncionario && (
        <DetalhesPontos
          funcionario={selectedFuncionario}
          onClose={() => {
            setShowDetails(false);
            setSelectedFuncionario(null);
          }}
        />
      )}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex flex-col gap-2 w-full md:w-auto">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            Ranking de Pontos
          </h2>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setPeriodoAtual('geral')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                periodoAtual === 'geral'
                  ? 'bg-[#1DA1F2] text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Geral
            </button>

            <div className="relative selector-container">
              <button
                onClick={() => {
                  setPeriodoAtual('semana');
                  setShowSemanaSelector(!showSemanaSelector);
                  setShowMesSelector(false);
                  setShowAnoSelector(false);
                }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  periodoAtual === 'semana'
                    ? 'bg-[#1DA1F2] text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <Calendar className="w-4 h-4" />
                Semana {semanaSelected + 1}
                <ChevronDown className="w-4 h-4" />
              </button>

              {showSemanaSelector && (
                <div className="absolute z-20 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2">
                  {semanasDoMes.map((semana, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSemanaSelected(index);
                        setShowSemanaSelector(false);
                      }}
                      className={`w-full px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-left flex items-center justify-between ${
                        semanaSelected === index ? 'text-[#1DA1F2] font-medium' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <span>Semana {index + 1}</span>
                      <span className="text-xs text-gray-500">{semana.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="relative selector-container">
              <button
                onClick={() => {
                  setPeriodoAtual('mes');
                  setShowMesSelector(!showMesSelector);
                  setShowSemanaSelector(false);
                  setShowAnoSelector(false);
                }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  periodoAtual === 'mes'
                    ? 'bg-[#1DA1F2] text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <Calendar className="w-4 h-4" />
                {MESES[mesSelected]}
                <ChevronDown className="w-4 h-4" />
              </button>
              
              {showMesSelector && (
                <div className="absolute z-10 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 grid grid-cols-2 gap-1">
                  {MESES.map((mes, index) => (
                    <button
                      key={mes}
                      onClick={() => {
                        setMesSelected(index);
                        setShowMesSelector(false);
                      }}
                      className={`px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-left ${
                        mesSelected === index ? 'text-[#1DA1F2] font-medium' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {mes}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative selector-container">
              <button
                onClick={() => {
                  setPeriodoAtual('ano');
                  setShowAnoSelector(!showAnoSelector);
                  setShowMesSelector(false);
                  setShowSemanaSelector(false);
                }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  periodoAtual === 'ano'
                    ? 'bg-[#1DA1F2] text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <Calendar className="w-4 h-4" />
                {anoSelected}
                <ChevronDown className="w-4 h-4" />
              </button>

              {showAnoSelector && (
                <div className="absolute z-10 mt-2 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2">
                  {[...Array(5)].map((_, i) => {
                    const ano = new Date().getFullYear() - i;
                    return (
                      <button
                        key={ano}
                        onClick={() => {
                          setAnoSelected(ano);
                          setShowAnoSelector(false);
                        }}
                        className={`w-full px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-left ${
                          anoSelected === ano ? 'text-[#1DA1F2] font-medium' : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {ano}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white rounded-lg p-4 flex items-center gap-3 shadow-lg w-full md:w-auto">
          <Trophy className="w-8 h-8" fill="white" />
          <div>
            <p className="text-sm text-yellow-100">Total de Pontos</p>
            <p className="text-2xl font-bold">
              {filtrarPorPeriodo(rankings)
                .filter(func => func.pontuacao.total > 0)
                .reduce((total, func) => total + func.pontuacao.total, 0)}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {filtrarPorPeriodo(rankings)
          .filter(funcionario => funcionario.pontuacao.total > 0)
          .sort((a, b) => b.pontuacao.total - a.pontuacao.total)
          .map((funcionario, index) => (
          <div 
            key={funcionario.id}
            onClick={() => {
              setSelectedFuncionario(funcionario);
              setShowDetails(true);
            }}
            className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800/80 rounded-lg p-4 shadow border border-gray-100 dark:border-gray-700/50 hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12">
                {renderPosicaoIcon(index)}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  {funcionario.photoURL ? (
                    <img 
                      src={funcionario.photoURL} 
                      alt={funcionario.nome}
                      className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <span className="text-xl font-medium text-gray-600 dark:text-gray-300">
                        {funcionario.nome.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 dark:text-white">{funcionario.nome}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {funcionario.pontuacao.total} pontos
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mt-3">
                  <div className="flex items-center gap-2">
                    <ToolCase className="w-4 h-4 text-blue-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {funcionario.pontuacao.detalhes.ferramentas} pts
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {funcionario.pontuacao.detalhes.tarefas} pts
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {funcionario.pontuacao.detalhes.avaliacao} pts
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>


    </div>
  );
};

const DetalhesPontos = ({ funcionario, onClose }) => {
  const { emprestimos, tarefas, avaliacoes } = funcionario;

  const getDataFormatada = (data) => {
    const date = new Date(data);
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl shadow-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Detalhes dos Pontos - {funcionario.nome}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Empréstimos */}
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <ToolCase className="w-5 h-5 text-blue-500" />
              Empréstimos ({emprestimos.length * 20} pontos)
            </h4>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <div className="space-y-2">
                {emprestimos.map((emp, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300">
                      Data: {getDataFormatada(emp.dataDevolucao)}
                    </span>
                    <span className="font-medium text-blue-500">
                      +{emp.quantidade * 20} pontos
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tarefas */}
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Tarefas ({tarefas.length * 50} pontos)
            </h4>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <div className="space-y-2">
                {tarefas.map((tarefa, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300">
                      Data: {getDataFormatada(tarefa.dataConclusao)}
                    </span>
                    <span className="font-medium text-green-500">+50 pontos</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Avaliações */}
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              Avaliações ({avaliacoes.reduce((acc, av) => acc + (av.estrelas * 10), 0)} pontos)
            </h4>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <div className="space-y-2">
                {avaliacoes.map((avaliacao, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300">
                      Data: {getDataFormatada(avaliacao.data)}
                    </span>
                    <span className="font-medium text-yellow-500">
                      {avaliacao.estrelas} estrelas (+{avaliacao.estrelas * 10} pontos)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center text-lg font-bold">
              <span className="text-gray-900 dark:text-white">Total de Pontos:</span>
              <span className="text-[#1DA1F2]">{funcionario.pontuacao.total} pontos</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RankingPontos;