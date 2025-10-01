import React, { useState, useEffect } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { Trophy, Star, CheckCircle, ToolCase, Medal, ChevronDown, Calendar, X, CircleDollarSign, Award, HelpCircle } from 'lucide-react';

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

    // Só adiciona a semana se ela contém pelo menos um dia do mês atual
    if (fimAjustado >= primeiroDia) {
      // Ajustar as datas para mostrar apenas os dias do mês atual
      const inicioAjustado = new Date(Math.max(inicio, primeiroDia));
      
      semanas.push({
        inicio: inicioAjustado,
        fim: fimAjustado,
        label: `${inicioAjustado.getDate()}/${mes + 1} - ${fimAjustado.getDate()}/${mes + 1}`
      });
    }

    inicio = new Date(fim);
    inicio.setDate(inicio.getDate() + 1);
  }

  return semanas;
};

const RankingPontos = () => {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [periodoAtual, setPeriodoAtual] = useState('semana');
  const [mesSelected, setMesSelected] = useState(new Date().getMonth());
  const [anoSelected, setAnoSelected] = useState(new Date().getFullYear());
  const [showMesSelector, setShowMesSelector] = useState(false);
  const [showAnoSelector, setShowAnoSelector] = useState(false);
  const [showSemanaSelector, setShowSemanaSelector] = useState(false);
  const [showPontosExplicacao, setShowPontosExplicacao] = useState(false);
  
  // Calcular as semanas do mês atual
  const semanasDoMes = getSemanasDoMes(anoSelected, mesSelected);
  
  // Encontrar a semana atual
  const getWeekNumber = (hoje) => {
    const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const primeiroDiaSemana = new Date(primeiroDia);
    primeiroDiaSemana.setDate(primeiroDia.getDate() - primeiroDia.getDay() + (primeiroDia.getDay() === 0 ? -6 : 1));
    
    const diff = hoje - primeiroDiaSemana;
    const weekNumber = Math.floor(diff / (7 * 24 * 60 * 60 * 1000));
    
    // Garantir que o número da semana seja válido (não negativo e dentro do limite)
    return Math.max(0, Math.min(weekNumber, semanasDoMes.length - 1));
  };

  const [semanaSelected, setSemanaSelected] = useState(getWeekNumber(new Date()));
  const [selectedFuncionario, setSelectedFuncionario] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

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

  // Selecionar a semana atual do mês ao mudar mês ou ano
  useEffect(() => {
    const hoje = new Date();
    if (hoje.getMonth() === mesSelected && hoje.getFullYear() === anoSelected) {
      setSemanaSelected(getWeekNumber(hoje));
    } else {
      setSemanaSelected(0);
    }
  }, [mesSelected, anoSelected]);



  const filtrarPorPeriodo = (dados) => {
    return dados.map(funcionario => {
      let pontuacaoFiltrada = { ...funcionario.pontuacao };
      
      if (periodoAtual === 'mes' || periodoAtual === 'ano' || periodoAtual === 'semana') {
        let dataLimiteInicio, dataLimiteFim;

        if (periodoAtual === 'semana') {
          // Verificar se a semana selecionada existe no array
          if (semanasDoMes && semanasDoMes[semanaSelected]) {
            dataLimiteInicio = semanasDoMes[semanaSelected].inicio;
            dataLimiteFim = semanasDoMes[semanaSelected].fim;
          } else {
            // Fallback para o mês inteiro se a semana não existir
            dataLimiteInicio = new Date(anoSelected, mesSelected, 1);
            dataLimiteFim = new Date(anoSelected, mesSelected + 1, 0);
          }
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
                const dataDevolucao = new Date(emp.dataDevolucao);
                return dataDevolucao >= dataLimiteInicio && dataDevolucao <= dataLimiteFim;
              })
              .reduce((total, emp) => {
                const dataRetirada = new Date(emp.dataRetirada);
                const dataDevolucao = new Date(emp.dataDevolucao);
                const bonusRetirada = verificarHorarioBonus(dataRetirada);
                const bonusDevolucao = verificarHorarioBonus(dataDevolucao);
                
                let pontosPorFerramenta = 20;
                let pontosBonus = 0;
                
                if (bonusRetirada.bonus) {
                  pontosBonus += pontosPorFerramenta * 0.5;
                  emp.bonusRetirada = true;
                }
                if (bonusDevolucao.bonus) {
                  pontosBonus += pontosPorFerramenta * 0.5;
                  emp.bonusDevolucao = true;
                }
                
                return total + (pontosPorFerramenta + pontosBonus) * (emp.ferramentas?.length || 1);
              }, 0),
            tarefas: (funcionario.tarefas || [])
              .filter(tarefa => {
                const data = new Date(tarefa.dataConclusao);
                return !isNaN(data) && data >= dataLimiteInicio && data <= dataLimiteFim;
              })
              .reduce((total, tarefa) => {
                if (tarefa.status !== 'concluida') {
                  return total;
                }
                
                const prioridadePontos = {
                  baixa: 20,
                  media: 30,
                  média: 30,
                  normal: 30,
                  alta: 50,
                  urgente: 70
                };
                
                // Pontos base pela prioridade
                const prioridadeNormalizada = tarefa.prioridade?.toLowerCase()?.trim() || 'normal';
                let pontos = prioridadePontos[prioridadeNormalizada] || 30;
                
                // Adiciona pontos baseado no tempo estimado (em horas)
                const tempoEstimado = parseFloat(tarefa.tempoEstimado) || 1;
                if (!isNaN(tempoEstimado) && tempoEstimado > 0) {
                  // 5 pontos por hora, máximo de 50 pontos extras
                  const pontosExtra = Math.min(Math.floor(tempoEstimado) * 5, 50);
                  pontos += pontosExtra;
                }
                
                return total + pontos;
              }, 0),
            avaliacao: funcionario.avaliacoes
              .filter(av => {
                const data = new Date(av.data);
                // Verificar se a data é válida
                if (isNaN(data.getTime())) {
                  return false;
                }
                return data >= dataLimiteInicio && data <= dataLimiteFim;
              })
              .reduce((acc, av) => {
                const pontosEstrelas = {
                  5: 50,  // 5 estrelas = 50 pontos
                  4: 40,  // 4 estrelas = 40 pontos
                  3: 30,  // 3 estrelas = 30 pontos
                  2: 20,  // 2 estrelas = 20 pontos
                  1: 10   // 1 estrela = 10 pontos
                };
                return acc + (pontosEstrelas[av.estrelas] || 0);
              }, 0)
          }
        };
        
        pontuacaoFiltrada.total = 
          pontuacaoFiltrada.detalhes.ferramentas + 
          pontuacaoFiltrada.detalhes.tarefas + 
          pontuacaoFiltrada.detalhes.avaliacao;
      } else {
        // Quando não há filtro de período, usar a pontuação total original
        // mas garantir que os pontos de avaliação estejam incluídos
        pontuacaoFiltrada = {
          ...funcionario.pontuacao,
          detalhes: {
            ...funcionario.pontuacao.detalhes,
            avaliacao: funcionario.pontuacao.detalhes.avaliacao || 0
          }
        };
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

  // Função helper para verificar se um funcionário é terceirizado
  const isFuncionarioTerceirizado = (funcionario) => {
    return funcionario.terceirizado === true || 
           funcionario.tercerizado === true || 
           funcionario.tipo === 'terceirizado' ||
           funcionario.tipo === 'tercerizado' ||
           (typeof funcionario.terceirizado === 'string' && funcionario.terceirizado.toLowerCase() === 'sim') ||
           (typeof funcionario.tercerizado === 'string' && funcionario.tercerizado.toLowerCase() === 'sim') ||
           (funcionario.nome && funcionario.nome.toLowerCase().includes('terceirizado')) ||
           (funcionario.nome && funcionario.nome.toLowerCase().includes('tercerizado'));
  };

  const verificarHorarioBonus = (dataHora) => {
    if (!dataHora) return { bonus: false, tipo: null };

    const hora = dataHora.getHours();
    const minutos = dataHora.getMinutes();
    const horaMinutos = hora * 60 + minutos;

    // 7:20 até 7:35 (440 a 455 minutos)
    if (horaMinutos >= 440 && horaMinutos <= 455) {
      return { bonus: true, tipo: 'retirada' };
    }
    
    // 16:00 até 16:05 (960 a 965 minutos)
    if (horaMinutos >= 960 && horaMinutos <= 965) {
      return { bonus: true, tipo: 'devolucao' };
    }

    return { bonus: false, tipo: null };
  };

  const calcularPontuacao = (dados) => {
    const pontos = {
      total: 0,
      detalhes: {
        ferramentas: 0,
        tarefas: 0,
        avaliacao: 0
      }
    };

    // Calcular pontos das ferramentas
    pontos.detalhes.ferramentas = dados.emprestimos?.reduce((total, emp) => {
      let pontosPorFerramenta = 20;
      const qtd = emp.ferramentas?.length || 1;
      
      // Verificar bônus de horário
      const dataRetirada = emp.dataRetirada ? new Date(emp.dataRetirada) : null;
      const dataDevolucao = emp.dataDevolucao ? new Date(emp.dataDevolucao) : null;
      
      let pontosBonus = 0;
      if (dataRetirada) {
        const bonusRetirada = verificarHorarioBonus(dataRetirada);
        if (bonusRetirada.bonus) {
          pontosBonus += pontosPorFerramenta * 0.5; // 50% de bônus
        }
      }
      
      if (dataDevolucao) {
        const bonusDevolucao = verificarHorarioBonus(dataDevolucao);
        if (bonusDevolucao.bonus) {
          pontosBonus += pontosPorFerramenta * 0.5; // 50% de bônus
        }
      }
      
      return total + ((pontosPorFerramenta + pontosBonus) * qtd);
    }, 0) || 0;

    // Calcular pontos das tarefas
    pontos.detalhes.tarefas = dados.tarefas?.reduce((total, tarefa) => {
      // Só conta pontos para tarefas concluídas
      if (tarefa.status !== 'concluida') {
        return total;
      }

      const prioridadePontos = {
        baixa: 20,
        media: 30,
        média: 30,
        normal: 30,
        alta: 50,
        urgente: 70
      };
      
      // Pontos base pela prioridade
      let pontos = prioridadePontos[tarefa.prioridade?.toLowerCase().trim()] || 30;
      
      // Pontos extras pelo tempo estimado
      const tempoEstimado = parseFloat(tarefa.tempoEstimado) || 1;
      if (!isNaN(tempoEstimado)) {
        pontos += Math.min(Math.floor(tempoEstimado) * 5, 50); // 5 pontos por hora, máximo de 50 pontos extras
      }
      
      return total + pontos;
    }, 0) || 0;

    // Calcular pontos das avaliações
    pontos.detalhes.avaliacao = dados.avaliacoes?.reduce((total, av) => {
      // Cada estrela vale 10 pontos
      const pontosPorEstrela = 10;
      // Garantir que temos um número válido de estrelas
      const estrelas = Number(av.estrelas) || 0;
      // Calcular pontos apenas se for um número válido maior que 0
      const totalPontos = !isNaN(estrelas) && estrelas > 0 ? estrelas * pontosPorEstrela : 0;
      
      return total + totalPontos;
    }, 0) || 0;

    // Calcular total
    pontos.total = pontos.detalhes.ferramentas + pontos.detalhes.tarefas + pontos.detalhes.avaliacao;

    return pontos;
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
        // Verificar todas as possíveis variações de terceirizado no campo
        const isTerceirizado = isFuncionarioTerceirizado(funcionario);

        // Só incluir se NÃO for terceirizado
        if (!isTerceirizado) {
          dadosFuncionarios[doc.id] = {
            id: doc.id,
            nome: funcionario.nome,
            photoURL: funcionario.photoURL,
            terceirizado: false,
            tercerizado: false,
            ferramentasDevolvidas: 0,
            tarefasConcluidas: 0,
            avaliacao: 0,
            avaliacoes: []
          };
        }
      });

      // Contar ferramentas devolvidas apenas para não terceirizados
      emprestimosSnap.forEach(doc => {
        const emprestimo = doc.data();
        if (emprestimo.status === 'devolvido' && emprestimo.funcionarioId && dadosFuncionarios[emprestimo.funcionarioId]) {
          // Só conta se o funcionário estiver na lista (não terceirizado)
          dadosFuncionarios[emprestimo.funcionarioId].ferramentasDevolvidas += 
            (emprestimo.ferramentas?.length || 0);
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
                quantidade: emp.ferramentas?.length || 0,
                ferramentas: emp.ferramentas || []
              });
            }
          });

          // Coletar tarefas com datas apenas para não terceirizados
          tarefasSnap.forEach(doc => {
            const tarefa = doc.data();
            // Verifica se é uma tarefa válida e se o funcionário não é terceirizado
            if (tarefa.status?.toLowerCase() === 'concluida' && 
                ((tarefa.responsavelId && dadosFuncionarios[tarefa.responsavelId] === funcionario) || 
                 (tarefa.funcionarioId && dadosFuncionarios[tarefa.funcionarioId] === funcionario) || 
                 (tarefa.responsavel === funcionario.nome && !funcionario.terceirizado))) {
              const dataRef = tarefa.dataConclusao || tarefa.dataAtualizacao || tarefa.dataFinalizacao || doc.updateTime || doc.createTime;
              tarefas.push({
                dataConclusao: typeof dataRef === 'string' ? new Date(dataRef) : dataRef,
                dataRetirada: typeof dataRef === 'string' ? new Date(dataRef) : dataRef,
                prioridade: (tarefa.prioridade || 'normal').toLowerCase().trim(),
                tempoEstimado: parseFloat(tarefa.tempoEstimado) || 1,
                titulo: tarefa.titulo || 'Sem título',
                descricao: tarefa.descricao || '',
                status: (tarefa.status || '').toLowerCase()
              });
            }
          });

          // Coletar avaliações com datas
          avaliacoesSnap.forEach(doc => {
            const avaliacao = doc.data();
            // Verificar todas as formas possíveis de identificar o funcionário
            const matchFuncionario = 
              avaliacao.funcionarioId === funcionario.id || 
              avaliacao.idFuncionario === funcionario.id ||
              (avaliacao.funcionario && avaliacao.funcionario.id === funcionario.id) ||
              (avaliacao.funcionario === funcionario.nome);

            if (matchFuncionario && avaliacao.estrelas) {
              // Garantir que temos uma data válida
              let dataAvaliacao = avaliacao.data || avaliacao.dataAvaliacao || avaliacao.timestamp;
              
              // Se ainda não temos data, usar a data de criação do documento
              if (!dataAvaliacao) {
                dataAvaliacao = doc.metadata?.fromCache ? new Date() : (doc.createTime || new Date());
              }
              
              // Converter para Date se for string
              if (typeof dataAvaliacao === 'string') {
                dataAvaliacao = new Date(dataAvaliacao);
              }

              const avaliacaoComData = {
                data: dataAvaliacao,
                estrelas: Number(avaliacao.estrelas) // Garantir que estrelas seja número
              };
              avaliacoes.push(avaliacaoComData);
            }
          });

          return {
            ...funcionario,
            emprestimos,
            tarefas,
            avaliacoes,
            pontuacao: calcularPontuacao({
              emprestimos,
              tarefas,
              avaliacoes
            })
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
        
        <div className="bg-gradient-to-br from-[#2C3E50] to-[#3498DB] text-white rounded-lg shadow-lg w-full md:w-auto overflow-hidden">
          <div className="p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-6 h-6" strokeWidth={1.5} />
                <h3 className="text-lg font-semibold text-white">Total de Pontos</h3>
              </div>
              <div className="bg-white/10 rounded-lg px-3 py-1 text-sm">
                {filtrarPorPeriodo(rankings)
                  .filter(func => !isFuncionarioTerceirizado(func) && func.pontuacao.total > 0)
                  .length} funcionários
              </div>
            </div>
            
            <div className="flex items-end gap-3 mt-1">
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">
                    {filtrarPorPeriodo(rankings)
                      .filter(func => !isFuncionarioTerceirizado(func) && func.pontuacao.total > 0)
                      .reduce((total, func) => total + func.pontuacao.total, 0)}
                  </span>
                  <span className="text-blue-200">pontos</span>
                  <div className="relative">
                    <HelpCircle
                      className="w-5 h-5 text-blue-200 hover:text-blue-100 cursor-pointer ml-2"
                      onClick={() => setShowPontosExplicacao(prev => !prev)}
                    />
                    {showPontosExplicacao && (
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowPontosExplicacao(false)}
                      >
                        <div
                          className="absolute top-full left-0 mt-2 w-64 bg-gray-800 text-white text-xs rounded-lg p-3 shadow-lg z-50"
                          style={{ pointerEvents: 'auto' }}
                          onClick={e => e.stopPropagation()}
                        >
                          <div className="text-left">
                            <p className="mb-2">Os pontos são calculados da seguinte forma:</p>
                            <ul className="space-y-1">
                              <li className="flex items-center gap-1">
                                <ToolCase className="w-3 h-3 text-blue-400" />
                                20 pontos por ferramenta devolvida
                              </li>
                              <li className="ml-4 text-xs text-gray-300">
                                Bônus de horário:
                              </li>
                              <li className="ml-4 text-xs text-gray-300">
                                • +50% se retirada entre 7:20-7:35
                              </li>
                              <li className="ml-4 text-xs text-gray-300">
                                • +50% se devolvida entre 16:00-16:05
                              </li>
                              <li className="flex items-center gap-1">
                                <CheckCircle className="w-3 h-3 text-green-400" />
                                Tarefas: 20-70 pts + tempo estimado
                              </li>
                              <li className="ml-4 text-xs text-gray-300">
                                • Baixa: 20 pts
                                • Média: 30 pts
                                • Alta: 50 pts
                                • Urgente: 70 pts
                              </li>
                              <li className="ml-4 text-xs text-gray-300">
                                + 5 pts por hora estimada (máx. 50 pts extras)
                              </li>
                              <li className="flex items-center gap-1">
                                <Star className="w-3 h-3 text-yellow-400" />
                                Avaliações por estrelas:
                              </li>
                              <li className="ml-4 text-xs text-gray-300">
                                • Cada estrela vale 10 pontos
                              </li>
                              <li className="ml-4 text-xs text-gray-300">
                                • Ex: 5 estrelas = 50 pts
                              </li>
                              <li className="ml-4 text-xs text-gray-300">
                                • Ex: 3 estrelas = 30 pts
                              </li>
                              <li className="ml-4 text-xs text-gray-300">
                                • 2 estrelas: 20 pts
                              </li>
                              <li className="ml-4 text-xs text-gray-300">
                                • 1 estrela: 10 pts
                              </li>
                            </ul>
                          </div>
                          <div className="absolute left-1/2 -translate-x-1/2 -top-1 w-2 h-2 bg-gray-800 rotate-45"></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-4 mt-3 text-sm">
                  <div className="flex items-center gap-1 relative group">
                    <ToolCase className="w-4 h-4 text-blue-200" />
                    <span>
                      {filtrarPorPeriodo(rankings)
                        .filter(func => !isFuncionarioTerceirizado(func))
                        .reduce((total, func) => total + func.pontuacao.detalhes.ferramentas, 0)} pts
                    </span>
                    {filtrarPorPeriodo(rankings).some(func => 
                      func.emprestimos.some(emp => emp.bonusRetirada || emp.bonusDevolucao)
                    ) && (
                      <>
                        <span className="ml-1 text-yellow-400 text-xs">★</span>
                        <div className="absolute bottom-full left-0 mb-1 hidden group-hover:block bg-gray-800 text-xs text-white p-2 rounded whitespace-nowrap">
                          Inclui bônus de horário
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-4 h-4 text-blue-200" />
                    <span>
                      {filtrarPorPeriodo(rankings)
                        .filter(func => !isFuncionarioTerceirizado(func))
                        .reduce((total, func) => total + func.pontuacao.detalhes.tarefas, 0)} pts
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-blue-200" />
                    <span>
                      {filtrarPorPeriodo(rankings)
                        .filter(func => !isFuncionarioTerceirizado(func))
                        .reduce((total, func) => total + func.pontuacao.detalhes.avaliacao, 0)} pts
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="h-1 w-full bg-gradient-to-r from-blue-200 to-blue-400"></div>
        </div>
      </div>

      <div className="space-y-4">
        {filtrarPorPeriodo(rankings)
          .filter(funcionario => {
            // Verificar todas as possíveis variações de terceirizado
            const isTerceirizado = isFuncionarioTerceirizado(funcionario);

            // Manter apenas funcionários não terceirizados com pontuação
            return !isTerceirizado && funcionario.pontuacao.total > 0;
          })
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
                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <CircleDollarSign className="w-4 h-4 text-yellow-500" />
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
  const [sectionsOpen, setSectionsOpen] = useState({
    emprestimos: true,
    tarefas: true,
    avaliacoes: true
  });

  const toggleSection = (section) => {
    setSectionsOpen(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getDataFormatada = (data) => {
    const date = new Date(data);
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl shadow-xl max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Detalhes dos Pontos - {funcionario.nome}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-4">
          <div className="space-y-4">
            {/* Empréstimos */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
              <div 
                className="flex justify-between items-center mb-2 cursor-pointer"
                onClick={() => toggleSection('emprestimos')}
              >
                <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                  <ToolCase className="w-4 h-4 text-blue-500" />
                  Empréstimos
                  <ChevronDown className={`w-4 h-4 transform transition-transform ${sectionsOpen.emprestimos ? '' : '-rotate-90'}`} />
                </h4>
                <div className="text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Total: </span>
                  <span className="font-medium text-blue-500">{emprestimos.length * 20} pontos</span>
                </div>
              </div>
              {sectionsOpen.emprestimos && (
                <>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-1">
                    <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 px-1.5 py-0.5 rounded font-medium">
                      {emprestimos.reduce((total, emp) => total + emp.quantidade, 0)}
                    </span>
                    ferramentas devolvidas no total
                  </p>
                  <div className="space-y-1">
                    {emprestimos.map((emp, index) => (
                      <div key={index} className="border-b border-gray-100 dark:border-gray-600/20 last:border-0 pb-2 last:pb-0 mb-2 last:mb-0">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600 dark:text-gray-300 font-medium">
                            {getDataFormatada(emp.dataDevolucao)}
                          </span>
                          <span className="font-medium text-blue-500">
                            +{emp.quantidade * 20} pts
                          </span>
                        </div>
                        {emp.ferramentas && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/30 rounded-md p-2">
                            <div className="flex items-center gap-1 mb-1">
                              <ToolCase className="w-3 h-3" />
                              <span className="font-medium">Ferramentas devolvidas:</span>
                            </div>
                            <div className="grid grid-cols-2 gap-1 ml-4">
                              {emp.ferramentas.map((ferramenta, idx) => (
                                <div key={idx} className="flex items-center gap-1">
                                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                                  <span>{ferramenta.nome || ferramenta}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Tarefas */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
              <div 
                className="flex justify-between items-center mb-2 cursor-pointer"
                onClick={() => toggleSection('tarefas')}
              >
                <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Tarefas 
                  <ChevronDown className={`w-4 h-4 transform transition-transform ${sectionsOpen.tarefas ? '' : '-rotate-90'}`} />
                </h4>
                <span className="text-sm font-medium text-green-500">
                  {tarefas.reduce((total, tarefa) => {
                    const prioridadePontos = {
                      baixa: 20,
                      media: 30,
                      média: 30,
                      normal: 30,
                      alta: 50,
                      urgente: 70
                    };
                    let pontos = prioridadePontos[tarefa.prioridade?.toLowerCase().trim()] || 30;
                    const tempoEstimado = parseFloat(tarefa.tempoEstimado) || 1;
                    if (!isNaN(tempoEstimado)) {
                      pontos += Math.min(Math.floor(tempoEstimado) * 5, 50);
                    }
                    return total + pontos;
                  }, 0)} pontos
                </span>
              </div>
              {sectionsOpen.tarefas && (
                <div className="space-y-1">
                {tarefas.map((tarefa, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300 flex flex-col">
                      <div>
                      <span>{getDataFormatada(tarefa.dataConclusao)}</span>
                      <div className="flex flex-col text-xs text-gray-500">
                        <span>{tarefa.titulo || 'Tarefa'}</span>
                        <span>
                          {tarefa.prioridade || 'Média'} • {tarefa.tempoEstimado || '1'}h est.
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="font-medium text-green-500">
                        {(() => {
                          const prioridadePontos = {
                            baixa: 20,
                            media: 30,
                            média: 30,
                            normal: 30,
                            alta: 50,
                            urgente: 70
                          };
                          
                          const pontosPrioridade = prioridadePontos[tarefa.prioridade?.toLowerCase().trim()] || 30;
                          const tempoEstimado = parseFloat(tarefa.tempoEstimado) || 1;
                          const pontosExtra = !isNaN(tempoEstimado) ? Math.min(Math.floor(tempoEstimado) * 5, 50) : 0;
                          const totalPontos = pontosPrioridade + pontosExtra;
                          
                          return `+${totalPontos} pts`;
                        })()}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({(() => {
                          const prioridadePontos = {
                            baixa: 20,
                            media: 30,
                            média: 30,
                            normal: 30,
                            alta: 50,
                            urgente: 70
                          };
                          
                          const pontosPrioridade = prioridadePontos[tarefa.prioridade?.toLowerCase().trim()] || 30;
                          const tempoEstimado = parseFloat(tarefa.tempoEstimado) || 1;
                          const pontosExtra = !isNaN(tempoEstimado) ? Math.min(Math.floor(tempoEstimado) * 5, 50) : 0;
                          
                          return `${pontosPrioridade} base + ${pontosExtra} tempo`;
                        })()})
                      </span>
                    </div>
                    </span>
                  </div>
                ))}
                </div>
              )}
            </div>

            {/* Avaliações */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
              <div 
                className="flex justify-between items-center mb-2 cursor-pointer"
                onClick={() => toggleSection('avaliacoes')}
              >
                <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  Avaliações 
                  <ChevronDown className={`w-4 h-4 transform transition-transform ${sectionsOpen.avaliacoes ? '' : '-rotate-90'}`} />
                </h4>
                <span className="text-sm font-medium text-yellow-500">
                  {avaliacoes.reduce((acc, av) => {
                    const pontosEstrelas = {
                      5: 50,  // 5 estrelas = 50 pontos
                      4: 40,  // 4 estrelas = 40 pontos
                      3: 30,  // 3 estrelas = 30 pontos
                      2: 20,  // 2 estrelas = 20 pontos
                      1: 10   // 1 estrela = 10 pontos
                    };
                    return acc + (pontosEstrelas[av.estrelas] || 0);
                  }, 0)} pontos
                </span>
              </div>
              {sectionsOpen.avaliacoes && (
                <div className="space-y-1">
                  {avaliacoes.map((avaliacao, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-300">
                        {getDataFormatada(avaliacao.data)}
                      </span>
                      <span className="font-medium text-yellow-500">
                        {avaliacao.estrelas}★ (+{(avaliacao.estrelas || 0) * 10} pts)
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center text-base font-bold">
            <span className="text-gray-900 dark:text-white">Pontuação da data selecionada:</span>
            <span className="text-[#1DA1F2]">{funcionario.pontuacao.total} pontos</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RankingPontos;