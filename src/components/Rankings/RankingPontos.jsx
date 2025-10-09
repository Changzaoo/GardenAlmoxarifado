import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { Trophy, Star, CheckCircle, ToolCase, Medal, ChevronDown, Calendar, X, CircleDollarSign, Award, HelpCircle, Shield } from 'lucide-react';
import { useSectorPermissions } from '../../hooks/useSectorPermissions';
import { PermissionChecker } from '../../constants/permissoes';
import { useAuth } from '../../hooks/useAuth';
import { useFuncionarios } from '../Funcionarios/FuncionariosProvider';

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
  const { usuario } = useAuth();
  const { funcionarios: funcionariosContext } = useFuncionarios(); // Usar o mesmo contexto da página de tarefas
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [periodoAtual, setPeriodoAtual] = useState('semana');
  const [mesSelected, setMesSelected] = useState(new Date().getMonth());
  const [anoSelected, setAnoSelected] = useState(new Date().getFullYear());
  const [showMesSelector, setShowMesSelector] = useState(false);
  const [showAnoSelector, setShowAnoSelector] = useState(false);
  const [showSemanaSelector, setShowSemanaSelector] = useState(false);
  const [showPontosExplicacao, setShowPontosExplicacao] = useState(false);

  // Hook de permissões por setor
  const { canViewAllSectors } = useSectorPermissions();
  const isAdmin = canViewAllSectors;
  
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
    // Log uma única vez com informações do período
    if (dados.length > 0 && (periodoAtual === 'mes' || periodoAtual === 'ano' || periodoAtual === 'semana')) {
      let dataLimiteInicio, dataLimiteFim;
      
      if (periodoAtual === 'semana' && semanasDoMes && semanasDoMes[semanaSelected]) {
        dataLimiteInicio = semanasDoMes[semanaSelected].inicio;
        dataLimiteFim = semanasDoMes[semanaSelected].fim;
      } else if (periodoAtual === 'mes') {
        dataLimiteInicio = new Date(anoSelected, mesSelected, 1);
        dataLimiteFim = new Date(anoSelected, mesSelected + 1, 0);
      } else if (periodoAtual === 'ano') {
        dataLimiteInicio = new Date(anoSelected, 0, 1);
        dataLimiteFim = new Date(anoSelected, 11, 31, 23, 59, 59);
      }
      
      if (dataLimiteInicio && dataLimiteFim) {

      }
    }
    
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
        const emprestimosNoPeriodo = funcionario.emprestimos.filter(emp => {
          const dataDevolucao = new Date(emp.dataDevolucao);
          const noPeriodo = dataDevolucao >= dataLimiteInicio && dataDevolucao <= dataLimiteFim;
          return noPeriodo;
        });
        
        pontuacaoFiltrada = {
          ...pontuacaoFiltrada,
          total: 0,
          detalhes: {
            ferramentas: emprestimosNoPeriodo
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
                const noPeriodo = !isNaN(data) && data >= dataLimiteInicio && data <= dataLimiteFim;
                return noPeriodo;
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
                const noPeriodo = data >= dataLimiteInicio && data <= dataLimiteFim;
                return noPeriodo;
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
    // Só carregar dados quando funcionariosContext estiver disponível
    if (funcionariosContext && funcionariosContext.length > 0) {

      carregarDados();
    }
  }, [funcionariosContext]); // Recarregar quando o contexto mudar

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

      // Buscar empréstimos, tarefas, avaliações E todas as coleções de usuários
      // Funcionários vêm do contexto (FuncionariosProvider) que já unifica as 3 coleções
      const emprestimosRef = collection(db, 'emprestimos');
      const tarefasRef = collection(db, 'tarefas');
      const avaliacoesRef = collection(db, 'avaliacoes');
      const autoavaliacoesRef = collection(db, 'autoavaliacoes');
      const usuariosRef = collection(db, 'usuarios'); // PLURAL
      const usuarioRef = collection(db, 'usuario'); // SINGULAR (legado)

      // Buscar dados necessários de TODAS as fontes
      const [emprestimosSnap, tarefasSnap, avaliacoesSnap, autoavaliacoesSnap, usuariosSnap, usuarioSnap] = await Promise.all([
        getDocs(emprestimosRef),
        getDocs(tarefasRef),
        getDocs(avaliacoesRef),
        getDocs(autoavaliacoesRef),
        getDocs(usuariosRef),
        getDocs(usuarioRef)
      ]);

      // Processar funcionários - USAR APENAS O CONTEXTO (fonte única de verdade)
      const dadosFuncionarios = {};
      const nomesParaIds = {}; // Mapear nomes para IDs
      const emailsProcessados = new Set(); // Evitar duplicatas por email

      // Contadores para debug
      let totalProcessados = 0;
      let puladosTerceirizados = 0;
      let puladosDuplicados = 0;
      
      // USAR APENAS funcionariosContext como fonte única de verdade
      // Nota: FuncionariosProvider já filtra demitidos, mas vamos garantir
      funcionariosContext.forEach(funcionario => {
        const isTerceirizado = isFuncionarioTerceirizado(funcionario);
        const email = funcionario.email?.toLowerCase();
        
        // IMPORTANTE: Não incluir funcionários demitidos
        if (funcionario.demitido === true) {

          return;
        }
        
        // Debug: verificar por que está sendo pulado
        if (isTerceirizado) {
          puladosTerceirizados++;
          return;
        }
        
        if (email && emailsProcessados.has(email)) {
          puladosDuplicados++;
          return;
        }
        
        const nome = funcionario.nome || funcionario.username || funcionario.email;
        
        totalProcessados++;
        
        dadosFuncionarios[funcionario.id] = {
          id: funcionario.id,
          nome: nome,
          email: funcionario.email,
          photoURL: funcionario.photoURL || null,
          cargo: funcionario.cargo || null,
          setor: funcionario.setor || null,
          terceirizado: false,
          tercerizado: false,
          ferramentasDevolvidas: 0,
          tarefasConcluidas: 0,
          avaliacao: 0,
          avaliacoes: []
        };
        
        if (nome) {
          nomesParaIds[nome.toLowerCase()] = funcionario.id;
        }
        if (email) {
          emailsProcessados.add(email);
        }
      });
      
      const comFotoContexto = Object.values(dadosFuncionarios).filter(f => f.photoURL).length;
      
      // Verificar se há nomes/emails duplicados no funcionariosContext
      const nomesNoContexto = funcionariosContext.map(f => f.nome?.toLowerCase()).filter(Boolean);
      const emailsNoContexto = funcionariosContext.map(f => f.email?.toLowerCase()).filter(Boolean);
      const duplicatasContexto = [];
      
      const nomesSetContexto = new Set();
      const emailsSetContexto = new Set();
      
      funcionariosContext.forEach(f => {
        const nome = f.nome?.toLowerCase();
        const email = f.email?.toLowerCase();
        
        if (nome && nomesSetContexto.has(nome)) {
          duplicatasContexto.push(`Nome duplicado no CONTEXTO: ${f.nome} (ID: ${f.id})`);
        }
        if (email && emailsSetContexto.has(email)) {
          duplicatasContexto.push(`Email duplicado no CONTEXTO: ${f.email} (ID: ${f.id})`);
        }
        
        if (nome) nomesSetContexto.add(nome);
        if (email) emailsSetContexto.add(email);
      });
      
      if (duplicatasContexto.length > 0) {
        console.error('❌ DUPLICATAS NO funcionariosContext:', duplicatasContexto);
      }

      // PROCESSAR usuários da collection 'usuarios' para:
      // 1. Adicionar usuários que não estão no funcionariosContext
      // 2. Atualizar photoURL de funcionários existentes se usuário tiver foto
      let usuariosAdicionados = 0;
      let fotosAtualizadas = 0;
      let usuariosPuladosDuplicados = 0;
      
      usuariosSnap.forEach(doc => {
        const usuario = { id: doc.id, ...doc.data() };
        const isTerceirizado = isFuncionarioTerceirizado(usuario);
        const email = usuario.email?.toLowerCase();
        const nome = usuario.nome || usuario.username || usuario.email;
        const nomeNormalizado = nome?.toLowerCase();
        
        // IMPORTANTE: Não incluir terceirizados ou demitidos
        if (isTerceirizado || usuario.demitido === true) {
          if (usuario.demitido === true) {

          }
          return;
        }
        
        // Se o funcionário JÁ existe por ID, atualizar apenas photoURL se usuário tiver foto
        if (dadosFuncionarios[usuario.id]) {
          if (usuario.photoURL && !dadosFuncionarios[usuario.id].photoURL) {
            dadosFuncionarios[usuario.id].photoURL = usuario.photoURL;
            fotosAtualizadas++;

          }
          return; // Já foi processado, não adicionar novamente
        }
        
        // IMPORTANTE: Verificar duplicata por EMAIL (mesmo com ID diferente)
        if (email && emailsProcessados.has(email)) {
          usuariosPuladosDuplicados++;

          // Atualizar foto se o funcionário existente não tiver
          if (usuario.photoURL) {
            const funcExistenteId = Object.values(dadosFuncionarios).find(f => f.email?.toLowerCase() === email)?.id;
            if (funcExistenteId && !dadosFuncionarios[funcExistenteId].photoURL) {
              dadosFuncionarios[funcExistenteId].photoURL = usuario.photoURL;
              fotosAtualizadas++;

            }
          }
          return;
        }
        
        // IMPORTANTE: Verificar duplicata por NOME (mesmo com ID e email diferentes)
        if (nomeNormalizado && nomesParaIds[nomeNormalizado]) {
          usuariosPuladosDuplicados++;

          // Atualizar foto se o funcionário existente não tiver
          if (usuario.photoURL) {
            const funcExistenteId = nomesParaIds[nomeNormalizado];
            if (funcExistenteId && !dadosFuncionarios[funcExistenteId].photoURL) {
              dadosFuncionarios[funcExistenteId].photoURL = usuario.photoURL;
              fotosAtualizadas++;

            }
          }
          return;
        }
        
        usuariosAdicionados++;
        
        dadosFuncionarios[usuario.id] = {
          id: usuario.id,
          nome: nome,
          email: usuario.email,
          photoURL: usuario.photoURL || null,
          cargo: usuario.cargo || null,
          setor: usuario.setor || null,
          terceirizado: false,
          tercerizado: false,
          ferramentasDevolvidas: 0,
          tarefasConcluidas: 0,
          avaliacao: 0,
          avaliacoes: []
        };
        
        if (nome) {
          nomesParaIds[nome.toLowerCase()] = usuario.id;
        }
        if (email) {
          emailsProcessados.add(email);
        }
      });

      // Contar ferramentas devolvidas - CORRIGIDO para buscar por ID E nome
      let emprestimosSemMatch = [];
      emprestimosSnap.forEach(doc => {
        const emprestimo = doc.data();
        
        if (emprestimo.status === 'devolvido') {
          let funcionarioEncontrado = null;
          
          // 1. Tentar por funcionarioId direto
          if (emprestimo.funcionarioId && dadosFuncionarios[emprestimo.funcionarioId]) {
            funcionarioEncontrado = dadosFuncionarios[emprestimo.funcionarioId];
          }
          
          // 2. Tentar por colaboradorId (campo alternativo)
          if (!funcionarioEncontrado && emprestimo.colaboradorId && dadosFuncionarios[emprestimo.colaboradorId]) {
            funcionarioEncontrado = dadosFuncionarios[emprestimo.colaboradorId];
          }
          
          // 3. Tentar por nome (funcionarioNome, colaborador, nomeFuncionario)
          if (!funcionarioEncontrado) {
            const nomeEmprestimo = (emprestimo.funcionarioNome || emprestimo.colaborador || emprestimo.nomeFuncionario || '').toLowerCase();
            if (nomeEmprestimo) {
              const idPorNome = nomesParaIds[nomeEmprestimo];
              if (idPorNome && dadosFuncionarios[idPorNome]) {
                funcionarioEncontrado = dadosFuncionarios[idPorNome];
              }
            }
          }
          
          // 4. Se encontrou, contabilizar ferramentas devolvidas
          if (funcionarioEncontrado) {
            funcionarioEncontrado.ferramentasDevolvidas += (emprestimo.ferramentas?.length || 0);
          } else {
            // Debug: registrar empréstimos sem match para análise
            emprestimosSemMatch.push({
              id: doc.id,
              funcionarioId: emprestimo.funcionarioId,
              colaborador: emprestimo.colaborador,
              funcionarioNome: emprestimo.funcionarioNome,
              nomeFuncionario: emprestimo.nomeFuncionario
            });
          }
        }
      });
      
      if (emprestimosSemMatch.length > 0) {
        console.warn(`⚠️ ${emprestimosSemMatch.length} empréstimos devolvidos não foram contabilizados:`, emprestimosSemMatch.slice(0, 5));
      }

      // Contar tarefas concluídas - CORRIGIDO para buscar por nome E ID
      tarefasSnap.forEach(doc => {
        const tarefa = doc.data();
        if (tarefa.status === 'concluida' || tarefa.status === 'Concluída') {
          // Tentar encontrar o funcionário por ID primeiro
          let encontrou = false;
          
          // Verificar por funcionariosIds (array)
          if (tarefa.funcionariosIds && Array.isArray(tarefa.funcionariosIds)) {
            tarefa.funcionariosIds.forEach(id => {
              // Pode ser ID ou nome
              if (dadosFuncionarios[id]) {
                dadosFuncionarios[id].tarefasConcluidas++;
                encontrou = true;
              } else {
                // Tentar encontrar por nome
                const idPorNome = nomesParaIds[id.toLowerCase()];
                if (idPorNome && dadosFuncionarios[idPorNome]) {
                  dadosFuncionarios[idPorNome].tarefasConcluidas++;
                  encontrou = true;
                }
              }
            });
          }
          
          // Fallback: tentar por responsavelId
          if (!encontrou && tarefa.responsavelId && dadosFuncionarios[tarefa.responsavelId]) {
            dadosFuncionarios[tarefa.responsavelId].tarefasConcluidas++;
          }
        }
      });

      // Calcular média das avaliações - CORRIGIDO para buscar por ID E nome
      let avaliacoesProcessadas = 0;
      avaliacoesSnap.forEach(doc => {
        const avaliacao = doc.data();
        if (avaliacao.estrelas) {
          let funcionarioEncontrado = null;
          
          // 1. Tentar por funcionarioId direto
          if (avaliacao.funcionarioId && dadosFuncionarios[avaliacao.funcionarioId]) {
            funcionarioEncontrado = dadosFuncionarios[avaliacao.funcionarioId];
          }
          
          // 2. Tentar por nome do funcionário
          if (!funcionarioEncontrado && avaliacao.funcionarioNome) {
            const idPorNome = nomesParaIds[avaliacao.funcionarioNome.toLowerCase()];
            if (idPorNome && dadosFuncionarios[idPorNome]) {
              funcionarioEncontrado = dadosFuncionarios[idPorNome];
            }
          }
          
          // 3. Adicionar avaliação se encontrou o funcionário
          if (funcionarioEncontrado) {
            funcionarioEncontrado.avaliacoes.push(avaliacao.estrelas);
            avaliacoesProcessadas++;
          }
        }
      });

      // Processar autoavaliações - MESMO padrão das avaliações
      let autoavaliacoesProcessadas = 0;
      autoavaliacoesSnap.forEach(doc => {
        const autoavaliacao = doc.data();
        if (autoavaliacao.estrelas) {
          let funcionarioEncontrado = null;
          
          // 1. Tentar por funcionarioId direto
          if (autoavaliacao.funcionarioId && dadosFuncionarios[autoavaliacao.funcionarioId]) {
            funcionarioEncontrado = dadosFuncionarios[autoavaliacao.funcionarioId];
          }
          
          // 2. Tentar por userId (autoavaliações podem usar userId)
          if (!funcionarioEncontrado && autoavaliacao.userId && dadosFuncionarios[autoavaliacao.userId]) {
            funcionarioEncontrado = dadosFuncionarios[autoavaliacao.userId];
          }
          
          // 3. Tentar por nome do funcionário
          if (!funcionarioEncontrado && autoavaliacao.funcionarioNome) {
            const idPorNome = nomesParaIds[autoavaliacao.funcionarioNome.toLowerCase()];
            if (idPorNome && dadosFuncionarios[idPorNome]) {
              funcionarioEncontrado = dadosFuncionarios[idPorNome];
            }
          }
          
          // 4. Adicionar autoavaliação se encontrou o funcionário
          if (funcionarioEncontrado) {
            funcionarioEncontrado.avaliacoes.push(autoavaliacao.estrelas);
            autoavaliacoesProcessadas++;
          }
        }
      });

      // Calcular média das avaliações
      Object.values(dadosFuncionarios).forEach(funcionario => {
        if (funcionario.avaliacoes.length > 0) {
          funcionario.avaliacao = funcionario.avaliacoes.reduce((a, b) => a + b, 0) / funcionario.avaliacoes.length;
        }
      });

      // VERIFICAR DUPLICATAS EM dadosFuncionarios ANTES de criar rankingList
      const nomesPrevios = new Set();
      const emailsPrevios = new Set();
      const duplicatasPrevias = [];
      
      Object.values(dadosFuncionarios).forEach(func => {
        const nomeKey = func.nome?.toLowerCase();
        const emailKey = func.email?.toLowerCase();
        
        if (nomeKey && nomesPrevios.has(nomeKey)) {
          duplicatasPrevias.push(`⚠️ dadosFuncionarios tem nome duplicado: ${func.nome} (ID: ${func.id})`);
        }
        if (emailKey && emailsPrevios.has(emailKey)) {
          duplicatasPrevias.push(`⚠️ dadosFuncionarios tem email duplicado: ${func.email} (ID: ${func.id})`);
        }
        
        if (nomeKey) nomesPrevios.add(nomeKey);
        if (emailKey) emailsPrevios.add(emailKey);
      });
      
      if (duplicatasPrevias.length > 0) {
        console.error('❌ DUPLICATAS EM dadosFuncionarios (ANTES de criar rankingList):', duplicatasPrevias);
      }

      // Preparar dados com datas
      const rankingList = Object.values(dadosFuncionarios)
        .map(funcionario => {
          const emprestimos = [];
          const tarefas = [];
          const avaliacoes = [];

          // Coletar empréstimos com datas - CORRIGIDO para buscar por ID E nome
          emprestimosSnap.forEach(doc => {
            const emp = doc.data();
            
            if (emp.status === 'devolvido') {
              let pertenceAoFuncionario = false;
              
              // 1. Verificar por IDs diretos
              pertenceAoFuncionario = 
                emp.funcionarioId === funcionario.id || 
                emp.colaboradorId === funcionario.id;
              
              // 2. Verificar por nome (case-insensitive)
              if (!pertenceAoFuncionario) {
                const nomeEmprestimo = (emp.funcionarioNome || emp.colaborador || emp.nomeFuncionario || '').toLowerCase();
                const nomeFuncionario = (funcionario.nome || '').toLowerCase();
                
                if (nomeEmprestimo && nomeFuncionario && nomeEmprestimo === nomeFuncionario) {
                  pertenceAoFuncionario = true;
                }
              }
              
              if (pertenceAoFuncionario) {
                emprestimos.push({
                  dataDevolucao: emp.dataDevolucao,
                  dataRetirada: emp.dataRetirada || emp.dataEmprestimo || emp.dataCriacao,
                  quantidade: emp.ferramentas?.length || 0,
                  ferramentas: emp.ferramentas || []
                });
              }
            }
          });

          // Coletar tarefas com datas - CORRIGIDO para buscar por nome E ID
          tarefasSnap.forEach(doc => {
            const tarefa = doc.data();
            const statusLower = (tarefa.status || '').toLowerCase();
            
            if (statusLower === 'concluida' || statusLower === 'concluída') {
              let pertenceAoFuncionario = false;
              
              // Verificar por funcionariosIds (array) - pode conter nomes OU IDs
              if (tarefa.funcionariosIds && Array.isArray(tarefa.funcionariosIds)) {
                pertenceAoFuncionario = tarefa.funcionariosIds.some(id => {
                  // Verificar por ID direto
                  if (id === funcionario.id) return true;
                  // Verificar por nome
                  if (id.toLowerCase() === funcionario.nome.toLowerCase()) return true;
                  return false;
                });
              }
              
              // Fallback: verificar outros campos
              if (!pertenceAoFuncionario) {
                pertenceAoFuncionario = 
                  tarefa.responsavelId === funcionario.id ||
                  tarefa.funcionarioId === funcionario.id ||
                  (tarefa.responsavel && tarefa.responsavel.toLowerCase() === funcionario.nome.toLowerCase());
              }
              
              if (pertenceAoFuncionario) {
                const dataRef = tarefa.dataConclusao || tarefa.dataAtualizacao || tarefa.dataFinalizacao || doc.updateTime || doc.createTime;
                tarefas.push({
                  dataConclusao: typeof dataRef === 'string' ? new Date(dataRef) : dataRef,
                  dataRetirada: typeof dataRef === 'string' ? new Date(dataRef) : dataRef,
                  prioridade: (tarefa.prioridade || 'normal').toLowerCase().trim(),
                  tempoEstimado: parseFloat(tarefa.tempoEstimado) || 1,
                  titulo: tarefa.titulo || 'Sem título',
                  descricao: tarefa.descricao || '',
                  status: statusLower
                });
              }
            }
          });

          // Coletar avaliações com datas - CORRIGIDO para buscar por ID E nome
          avaliacoesSnap.forEach(doc => {
            const avaliacao = doc.data();
            let matchFuncionario = false;
            
            // 1. Verificar por IDs diretos
            matchFuncionario = 
              avaliacao.funcionarioId === funcionario.id || 
              avaliacao.idFuncionario === funcionario.id ||
              (avaliacao.funcionario && avaliacao.funcionario.id === funcionario.id);
            
            // 2. Verificar por nome
            if (!matchFuncionario) {
              if (avaliacao.funcionarioNome && avaliacao.funcionarioNome.toLowerCase() === funcionario.nome.toLowerCase()) {
                matchFuncionario = true;
              } else if (avaliacao.funcionario === funcionario.nome) {
                matchFuncionario = true;
              } else if (typeof avaliacao.funcionario === 'object' && avaliacao.funcionario.nome === funcionario.nome) {
                matchFuncionario = true;
              }
            }

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

          // Coletar autoavaliações com datas - MESMO padrão das avaliações
          autoavaliacoesSnap.forEach(doc => {
            const autoavaliacao = doc.data();
            let matchFuncionario = false;
            
            // 1. Verificar por IDs diretos
            matchFuncionario = 
              autoavaliacao.funcionarioId === funcionario.id || 
              autoavaliacao.userId === funcionario.id ||
              autoavaliacao.idFuncionario === funcionario.id ||
              (autoavaliacao.funcionario && autoavaliacao.funcionario.id === funcionario.id);
            
            // 2. Verificar por nome
            if (!matchFuncionario) {
              if (autoavaliacao.funcionarioNome && autoavaliacao.funcionarioNome.toLowerCase() === funcionario.nome.toLowerCase()) {
                matchFuncionario = true;
              } else if (autoavaliacao.funcionario === funcionario.nome) {
                matchFuncionario = true;
              } else if (typeof autoavaliacao.funcionario === 'object' && autoavaliacao.funcionario.nome === funcionario.nome) {
                matchFuncionario = true;
              }
            }

            if (matchFuncionario && autoavaliacao.estrelas) {
              // Garantir que temos uma data válida
              let dataAutoavaliacao = autoavaliacao.data || autoavaliacao.dataAvaliacao || autoavaliacao.timestamp;
              
              // Se ainda não temos data, usar a data de criação do documento
              if (!dataAutoavaliacao) {
                dataAutoavaliacao = doc.metadata?.fromCache ? new Date() : (doc.createTime || new Date());
              }
              
              // Converter para Date se for string
              if (typeof dataAutoavaliacao === 'string') {
                dataAutoavaliacao = new Date(dataAutoavaliacao);
              }

              const autoavaliacaoComData = {
                data: dataAutoavaliacao,
                estrelas: Number(autoavaliacao.estrelas) // Garantir que estrelas seja número
              };
              avaliacoes.push(autoavaliacaoComData);
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

      // Agrupar funcionários com o mesmo nome e unir seus pontos
      const funcionariosPorNome = new Map();
      
      rankingList.forEach(func => {
        const nomeKey = func.nome?.toLowerCase().trim();
        
        if (!nomeKey) return; // Ignorar funcionários sem nome
        
        if (funcionariosPorNome.has(nomeKey)) {
          // Funcionário já existe - unir os dados
          const funcionarioExistente = funcionariosPorNome.get(nomeKey);
          
          // Unir empréstimos
          funcionarioExistente.emprestimos = [
            ...funcionarioExistente.emprestimos,
            ...func.emprestimos
          ];
          
          // Unir tarefas
          funcionarioExistente.tarefas = [
            ...funcionarioExistente.tarefas,
            ...func.tarefas
          ];
          
          // Unir avaliações
          funcionarioExistente.avaliacoes = [
            ...funcionarioExistente.avaliacoes,
            ...func.avaliacoes
          ];
          
          // Manter foto se existir em qualquer dos perfis
          if (!funcionarioExistente.photoURL && func.photoURL) {
            funcionarioExistente.photoURL = func.photoURL;
          }
          
          // Recalcular pontuação com os dados unidos
          funcionarioExistente.pontuacao = calcularPontuacao({
            emprestimos: funcionarioExistente.emprestimos,
            tarefas: funcionarioExistente.tarefas,
            avaliacoes: funcionarioExistente.avaliacoes
          });

        } else {
          // Primeira vez vendo este nome - adicionar ao mapa
          funcionariosPorNome.set(nomeKey, { ...func });
        }
      });
      
      // Converter de volta para array
      const rankingListUnificado = Array.from(funcionariosPorNome.values());

      setRankings(rankingListUnificado);
      setLoading(false);
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error);
      setLoading(false);
    }
  };

  const renderPosicaoIcon = (posicao) => {
    switch (posicao) {
      case 0:
        return (
          <div className="m-3 flex items-center justify-center w-14 h-14 rounded-full bg-yellow-400 shadow-lg border-3 border-yellow-300">
            <Trophy className="w-7 h-7 text-white fill-white" />
          </div>
        );
      case 1:
        return (
          <div className="m-3 flex items-center justify-center w-14 h-14 rounded-full bg-gray-400 dark:bg-gray-500 shadow-lg border-3 border-gray-300 dark:border-gray-400">
            <Medal className="w-7 h-7 text-white" />
          </div>
        );
      case 2:
        return (
          <div className="m-3 flex items-center justify-center w-14 h-14 rounded-full bg-orange-500 shadow-lg border-3 border-orange-400">
            <Medal className="w-7 h-7 text-white" />
          </div>
        );
      default:
        return (
          <div className="m-3 flex items-center justify-center w-14 h-14 rounded-full bg-gray-200 dark:bg-gray-700 shadow-md border-2 border-gray-300 dark:border-gray-600">
            <span className="text-xl font-bold text-gray-700 dark:text-gray-300">{posicao + 1}</span>
          </div>
        );
    }
  };

  // Filtrar rankings por setor (se não for admin)
  const rankingsPorSetor = useMemo(() => {
    if (isAdmin) {
      return rankings; // Admin vê todos os rankings
    }
    
    // Filtrar funcionários onde o setorId corresponde ao setor do usuário
    return PermissionChecker.filterBySector(rankings, usuario);
  }, [rankings, usuario, isAdmin]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Badge informativo para não-admins */}
      {!isAdmin && usuario?.setor && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <p className="text-sm text-blue-800 dark:text-blue-300">
            <strong>Visualização por setor:</strong> Você está vendo apenas o ranking do setor <strong>{usuario.setor}</strong>.
          </p>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border-2 border-gray-200 dark:border-gray-700">
      {showDetails && selectedFuncionario && (
        <DetalhesPontos
          funcionario={selectedFuncionario}
          periodoAtual={periodoAtual}
          mesSelected={mesSelected}
          anoSelected={anoSelected}
          semanaSelected={semanaSelected}
          semanasDoMes={semanasDoMes}
          onClose={() => {
            setShowDetails(false);
            setSelectedFuncionario(null);
          }}
        />
      )}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex flex-col gap-2 w-full md:w-auto">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#1D9BF0] rounded-lg">
              <Trophy className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Ranking de Pontos
            </h2>
          </div>
          
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
                    ? 'bg-blue-500 dark:bg-[#1D9BF0] text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <Calendar className="w-4 h-4" />
                Semana {semanaSelected + 1}
                <ChevronDown className="w-4 h-4" />
              </button>

              {showSemanaSelector && (
                <div className="absolute z-20 mt-2 w-48 bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2">
                  {semanasDoMes.map((semana, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSemanaSelected(index);
                        setShowSemanaSelector(false);
                      }}
                      className={`w-full px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-left flex items-center justify-between ${
                        semanaSelected === index ? 'text-blue-500 dark:text-[#1D9BF0] font-medium' : 'text-gray-700 dark:text-gray-300'
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
                    ? 'bg-blue-500 dark:bg-[#1D9BF0] text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <Calendar className="w-4 h-4" />
                {MESES[mesSelected]}
                <ChevronDown className="w-4 h-4" />
              </button>
              
              {showMesSelector && (
                <div className="absolute z-10 mt-2 w-48 bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 grid grid-cols-2 gap-1">
                  {MESES.map((mes, index) => (
                    <button
                      key={mes}
                      onClick={() => {
                        setMesSelected(index);
                        setShowMesSelector(false);
                      }}
                      className={`px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-left ${
                        mesSelected === index ? 'text-blue-500 dark:text-[#1D9BF0] font-medium' : 'text-gray-700 dark:text-gray-300'
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
                    ? 'bg-blue-500 dark:bg-[#1D9BF0] text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <Calendar className="w-4 h-4" />
                {anoSelected}
                <ChevronDown className="w-4 h-4" />
              </button>

              {showAnoSelector && (
                <div className="absolute z-10 mt-2 w-32 bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2">
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
                          anoSelected === ano ? 'text-blue-500 dark:text-[#1D9BF0] font-medium' : 'text-gray-700 dark:text-gray-300'
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
        
        <div className="bg-[#1D9BF0] dark:bg-[#1A8CD8] text-white rounded-lg shadow-lg w-full md:w-auto overflow-hidden border-2 border-[#1A8CD8] dark:border-[#1779BE]">
          <div className="p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-6 h-6 text-white" strokeWidth={2} />
                <h3 className="text-lg font-bold text-white">Total de Pontos</h3>
              </div>
              <div className="bg-white/20 rounded-lg px-3 py-1 text-sm font-semibold backdrop-blur-sm">
                {filtrarPorPeriodo(rankingsPorSetor)
                  .filter(func => !isFuncionarioTerceirizado(func) && func.pontuacao.total > 0)
                  .length} funcionários
              </div>
            </div>
            
            <div className="flex items-end gap-3 mt-1">
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-white">
                    {filtrarPorPeriodo(rankingsPorSetor)
                      .filter(func => !isFuncionarioTerceirizado(func) && func.pontuacao.total > 0)
                      .reduce((total, func) => total + func.pontuacao.total, 0)}
                  </span>
                  <span className="text-white/90 font-medium">pontos</span>
                  <div className="relative">
                    <HelpCircle
                      className="w-5 h-5 text-white/80 hover:text-white cursor-pointer ml-2"
                      onClick={() => setShowPontosExplicacao(prev => !prev)}
                    />
                    {showPontosExplicacao && (
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowPontosExplicacao(false)}
                      >
                        <div
                          className="absolute top-full left-0 mt-2 w-64 bg-gray-800 text-gray-900 dark:text-white text-xs rounded-lg p-3 shadow-lg z-50"
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
                
                <div className="flex gap-4 mt-3 text-sm font-medium">
                  <div className="flex items-center gap-1.5 relative group bg-white/10 rounded-lg px-2 py-1 backdrop-blur-sm">
                    <ToolCase className="w-4 h-4 text-white" />
                    <span className="text-white">
                      {filtrarPorPeriodo(rankingsPorSetor)
                        .filter(func => !isFuncionarioTerceirizado(func))
                        .reduce((total, func) => total + func.pontuacao.detalhes.ferramentas, 0)} pts
                    </span>
                    {filtrarPorPeriodo(rankingsPorSetor).some(func => 
                      func.emprestimos.some(emp => emp.bonusRetirada || emp.bonusDevolucao)
                    ) && (
                      <>
                        <Star className="w-3 h-3 text-yellow-300 fill-yellow-300" />
                        <div className="absolute bottom-full left-0 mb-1 hidden group-hover:block bg-gray-800 text-xs text-white p-2 rounded whitespace-nowrap shadow-lg">
                          Inclui bônus de horário
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/10 rounded-lg px-2 py-1 backdrop-blur-sm">
                    <CheckCircle className="w-4 h-4 text-white" />
                    <span className="text-white">
                      {filtrarPorPeriodo(rankingsPorSetor)
                        .filter(func => !isFuncionarioTerceirizado(func))
                        .reduce((total, func) => total + func.pontuacao.detalhes.tarefas, 0)} pts
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/10 rounded-lg px-2 py-1 backdrop-blur-sm">
                    <Star className="w-4 h-4 text-white" />
                    <span className="text-white">
                      {filtrarPorPeriodo(rankingsPorSetor)
                        .filter(func => !isFuncionarioTerceirizado(func))
                        .reduce((total, func) => total + func.pontuacao.detalhes.avaliacao, 0)} pts
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="h-1 w-full bg-white/30"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(() => {
          const rankingsFiltrados = filtrarPorPeriodo(rankingsPorSetor);
          
          // DEBUG: Logs detalhados de filtragem

          const comPontuacao = rankingsFiltrados.filter(f => f.pontuacao.total > 0);
          const terceirizados = rankingsFiltrados.filter(f => isFuncionarioTerceirizado(f));
          const terceirizadosComPontos = rankingsFiltrados.filter(f => isFuncionarioTerceirizado(f) && f.pontuacao.total > 0);
          
          // Mostrar TODOS os funcionários e suas pontuações (ordenados por pontos)
          const todosComPontuacao = rankingsFiltrados
            .map(f => ({
              nome: f.nome,
              pontos: f.pontuacao.total,
              ferramentas: f.pontuacao.detalhes.ferramentas,
              tarefas: f.pontuacao.detalhes.tarefas,
              avaliacao: f.pontuacao.detalhes.avaliacao,
              terceirizado: isFuncionarioTerceirizado(f),
              demitido: f.demitido || false,
              temAtividades: (f.emprestimos?.length || 0) + (f.tarefas?.length || 0) + (f.avaliacoes?.length || 0) > 0
            }))
            .sort((a, b) => b.pontos - a.pontos);

          console.table(todosComPontuacao.slice(0, 30)); // Primeiros 30 funcionários
          
          // Verificar funcionários que têm atividades mas pontuação = 0
          const comAtividadesSemPontos = rankingsFiltrados.filter(f => {
            const temAtividades = (f.emprestimos && f.emprestimos.length > 0) || 
                                 (f.tarefas && f.tarefas.length > 0) || 
                                 (f.avaliacoes && f.avaliacoes.length > 0);
            return temAtividades && f.pontuacao.total === 0;
          });
          
          if (comAtividadesSemPontos.length > 0) {
            console.warn('⚠️ FUNCIONÁRIOS COM ATIVIDADES MAS SEM PONTOS:', comAtividadesSemPontos.map(f => ({
              nome: f.nome,
              emprestimos: f.emprestimos?.length || 0,
              tarefas: f.tarefas?.length || 0,
              avaliacoes: f.avaliacoes?.length || 0,
              pontuacao: f.pontuacao
            })));
          }
          
          return rankingsFiltrados
            .filter(funcionario => {
              // Verificar todas as possíveis variações de terceirizado
              const isTerceirizado = isFuncionarioTerceirizado(funcionario);

              // IMPORTANTE: Filtrar demitidos, terceirizados e sem pontuação
              return !isTerceirizado && 
                     !funcionario.demitido && 
                     funcionario.pontuacao.total > 0;
            })
            .sort((a, b) => b.pontuacao.total - a.pontuacao.total)
            .map((funcionario, index) => {
            const isPodium = index < 3;
            const isFirst = index === 0;
            
            return (
              <div 
                key={funcionario.id}
                onClick={() => {
                  setSelectedFuncionario(funcionario);
                  setShowDetails(true);
                }}
                className={`
                  relative overflow-hidden rounded-2xl cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl
                  ${isFirst 
                    ? 'bg-[#1D9BF0] dark:bg-[#1A8CD8] border-4 border-yellow-400 shadow-xl' 
                    : isPodium 
                      ? 'bg-white dark:bg-gray-800 border-3 border-gray-300 dark:border-gray-600 shadow-lg'
                      : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 shadow-md'
                  }
                `}
              >
                {/* Posição Badge - Canto Superior Esquerdo */}
                <div className="absolute top-0 left-0 z-10">
                  {renderPosicaoIcon(index)}
                </div>

                {/* Conteúdo do Card */}
                <div className={`p-6 pt-16 ${isFirst ? 'text-white' : ''}`}>
                  {/* Avatar e Nome */}
                  <div className="flex flex-col items-center mb-4">
                    {funcionario.photoURL ? (
                      <img 
                        src={funcionario.photoURL} 
                        alt={funcionario.nome}
                        className={`w-24 h-24 rounded-full object-cover shadow-lg mb-3 ${
                          isFirst 
                            ? 'border-4 border-yellow-400' 
                            : 'border-4 border-[#1D9BF0]'
                        }`}
                      />
                    ) : (
                      <div className={`w-24 h-24 rounded-full flex items-center justify-center shadow-lg mb-3 ${
                        isFirst 
                          ? 'bg-yellow-400 border-4 border-yellow-300' 
                          : 'bg-[#1D9BF0] border-4 border-[#1A8CD8]'
                      }`}>
                        <span className="text-4xl font-bold text-white">
                          {funcionario.nome.charAt(0)}
                        </span>
                      </div>
                    )}
                    
                    <h3 className={`text-xl font-bold text-center mb-2 ${
                      isFirst ? 'text-white' : 'text-gray-900 dark:text-white'
                    }`}>
                      {funcionario.nome}
                    </h3>
                    
                    {/* Pontuação Total */}
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                      isFirst 
                        ? 'bg-yellow-400' 
                        : 'bg-[#1D9BF0]'
                    } shadow-lg`}>
                      <Trophy className="w-5 h-5 text-white" />
                      <span className="text-2xl font-bold text-white">
                        {funcionario.pontuacao.total}
                      </span>
                      <span className="text-sm font-semibold text-white">pts</span>
                    </div>
                  </div>

                  {/* Detalhes dos Pontos */}
                  <div className="space-y-2 mt-4">
                    {/* Ferramentas */}
                    <div className={`flex items-center justify-between px-3 py-2 rounded-lg ${
                      isFirst 
                        ? 'bg-white/20 backdrop-blur-sm' 
                        : 'bg-blue-50 dark:bg-blue-900/20'
                    }`}>
                      <div className="flex items-center gap-2">
                        <ToolCase className={`w-5 h-5 ${
                          isFirst ? 'text-white' : 'text-blue-600 dark:text-blue-400'
                        }`} />
                        <span className={`text-sm font-medium ${
                          isFirst ? 'text-white' : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          Ferramentas
                        </span>
                      </div>
                      <span className={`text-lg font-bold ${
                        isFirst ? 'text-white' : 'text-blue-600 dark:text-blue-400'
                      }`}>
                        {funcionario.pontuacao.detalhes.ferramentas}
                      </span>
                    </div>

                    {/* Tarefas */}
                    <div className={`flex items-center justify-between px-3 py-2 rounded-lg ${
                      isFirst 
                        ? 'bg-white/20 backdrop-blur-sm' 
                        : 'bg-green-50 dark:bg-green-900/20'
                    }`}>
                      <div className="flex items-center gap-2">
                        <CheckCircle className={`w-5 h-5 ${
                          isFirst ? 'text-white' : 'text-green-600 dark:text-green-400'
                        }`} />
                        <span className={`text-sm font-medium ${
                          isFirst ? 'text-white' : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          Tarefas
                        </span>
                      </div>
                      <span className={`text-lg font-bold ${
                        isFirst ? 'text-white' : 'text-green-600 dark:text-green-400'
                      }`}>
                        {funcionario.pontuacao.detalhes.tarefas}
                      </span>
                    </div>

                    {/* Avaliações */}
                    <div className={`flex items-center justify-between px-3 py-2 rounded-lg ${
                      isFirst 
                        ? 'bg-white/20 backdrop-blur-sm' 
                        : 'bg-yellow-50 dark:bg-yellow-900/20'
                    }`}>
                      <div className="flex items-center gap-2">
                        <Star className={`w-5 h-5 ${
                          isFirst ? 'text-white' : 'text-yellow-600 dark:text-yellow-400'
                        }`} />
                        <span className={`text-sm font-medium ${
                          isFirst ? 'text-white' : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          Avaliações
                        </span>
                      </div>
                      <span className={`text-lg font-bold ${
                        isFirst ? 'text-white' : 'text-yellow-600 dark:text-yellow-400'
                      }`}>
                        {funcionario.pontuacao.detalhes.avaliacao}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Efeito de brilho no hover */}
                <div className="absolute inset-0 bg-white/0 hover:bg-white/5 transition-all pointer-events-none"></div>
              </div>
            );
          });
        })()}
      </div>
      </div>
    </div>
  );
};

const DetalhesPontos = ({ funcionario, periodoAtual, mesSelected, anoSelected, semanaSelected, semanasDoMes, onClose }) => {
  const [sectionsOpen, setSectionsOpen] = useState({
    emprestimos: false,
    tarefas: false,
    avaliacoes: false
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

  // Filtrar dados pelo período selecionado
  const filtrarDadosPorPeriodo = () => {
    let dataLimiteInicio, dataLimiteFim;

    if (periodoAtual === 'semana' && semanasDoMes && semanasDoMes[semanaSelected]) {
      dataLimiteInicio = semanasDoMes[semanaSelected].inicio;
      dataLimiteFim = semanasDoMes[semanaSelected].fim;
    } else if (periodoAtual === 'mes') {
      dataLimiteInicio = new Date(anoSelected, mesSelected, 1);
      dataLimiteFim = new Date(anoSelected, mesSelected + 1, 0);
    } else if (periodoAtual === 'ano') {
      dataLimiteInicio = new Date(anoSelected, 0, 1);
      dataLimiteFim = new Date(anoSelected, 11, 31, 23, 59, 59);
    } else {
      // Sem filtro de período, mostrar tudo
      return {
        emprestimos: funcionario.emprestimos || [],
        tarefas: funcionario.tarefas || [],
        avaliacoes: funcionario.avaliacoes || []
      };
    }

    // Filtrar empréstimos pelo período
    const emprestimosFiltrados = (funcionario.emprestimos || []).filter(emp => {
      const dataDevolucao = new Date(emp.dataDevolucao);
      return dataDevolucao >= dataLimiteInicio && dataDevolucao <= dataLimiteFim;
    });

    // Filtrar tarefas pelo período
    const tarefasFiltradas = (funcionario.tarefas || []).filter(tarefa => {
      const data = new Date(tarefa.dataConclusao);
      return !isNaN(data) && data >= dataLimiteInicio && data <= dataLimiteFim;
    });

    // Filtrar avaliações pelo período
    const avaliacoesFiltradas = (funcionario.avaliacoes || []).filter(av => {
      const data = new Date(av.data);
      return !isNaN(data.getTime()) && data >= dataLimiteInicio && data <= dataLimiteFim;
    });

    return {
      emprestimos: emprestimosFiltrados,
      tarefas: tarefasFiltradas,
      avaliacoes: avaliacoesFiltradas
    };
  };

  const { emprestimos, tarefas, avaliacoes } = filtrarDadosPorPeriodo();

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-3xl shadow-xl max-h-[85vh] flex flex-col">
        {/* Header com gradiente */}
        <div className="bg-gradient-to-r from-[#1D9BF0] to-[#1A8CD8] p-6 rounded-t-lg">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              {/* Foto do funcionário */}
              {funcionario.photoURL ? (
                <img 
                  src={funcionario.photoURL} 
                  alt={funcionario.nome}
                  className="w-16 h-16 rounded-full object-cover border-4 border-white/30 shadow-lg"
                />
              ) : (
                <div className="w-16 h-16 rounded-full flex items-center justify-center bg-white/20 border-4 border-white/30 shadow-lg">
                  <span className="text-2xl font-bold text-white">
                    {funcionario.nome.charAt(0)}
                  </span>
                </div>
              )}
              
              <div>
                <h3 className="text-xl font-bold text-white mb-1">
                  {funcionario.nome}
                </h3>
                <p className="text-blue-100 text-sm">Detalhes de Pontuação</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Cards de resumo */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <ToolCase className="w-4 h-4 text-white" />
                <span className="text-xs text-blue-100">Ferramentas</span>
              </div>
              <p className="text-2xl font-bold text-white">{funcionario.pontuacao.detalhes.ferramentas}</p>
              <p className="text-xs text-blue-100">pontos</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-4 h-4 text-white" />
                <span className="text-xs text-blue-100">Tarefas</span>
              </div>
              <p className="text-2xl font-bold text-white">{funcionario.pontuacao.detalhes.tarefas}</p>
              <p className="text-xs text-blue-100">pontos</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Star className="w-4 h-4 text-white" />
                <span className="text-xs text-blue-100">Avaliações</span>
              </div>
              <p className="text-2xl font-bold text-white">{funcionario.pontuacao.detalhes.avaliacao}</p>
              <p className="text-xs text-blue-100">pontos</p>
            </div>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-4">
          <div className="space-y-4">
            {/* Empréstimos */}
            <div className="bg-white dark:bg-gray-700/50 rounded-lg border-2 border-gray-200 dark:border-gray-600">
              <div 
                className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/70 transition-colors rounded-t-lg"
                onClick={() => toggleSection('emprestimos')}
              >
                <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <ToolCase className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <div>Empréstimos</div>
                    <div className="text-xs font-normal text-gray-500 dark:text-gray-400">
                      {emprestimos.reduce((total, emp) => total + emp.quantidade, 0)} ferramentas devolvidas
                    </div>
                  </div>
                  <ChevronDown className={`w-5 h-5 ml-2 transform transition-transform ${sectionsOpen.emprestimos ? '' : '-rotate-90'}`} />
                </h4>
                <div className="text-right">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Total</div>
                  <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {funcionario.pontuacao.detalhes.ferramentas} pts
                  </div>
                </div>
              </div>
              {sectionsOpen.emprestimos && (
                <div className="px-4 pb-4 space-y-2 max-h-[300px] overflow-y-auto">
                  {emprestimos.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                      Nenhum empréstimo registrado neste período
                    </p>
                  ) : (
                    emprestimos.map((emp, index) => (
                      <div key={index} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded text-xs font-medium">
                              {getDataFormatada(emp.dataDevolucao)}
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {emp.quantidade} {emp.quantidade === 1 ? 'ferramenta' : 'ferramentas'}
                            </span>
                          </div>
                          <span className="font-bold text-blue-600 dark:text-blue-400">
                            +{emp.quantidade * 20} pts
                          </span>
                        </div>
                        {emp.ferramentas && emp.ferramentas.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                            <div className="grid grid-cols-2 gap-1.5">
                              {emp.ferramentas.map((ferramenta, idx) => (
                                <div key={idx} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                  <span className="truncate">{ferramenta.nome || ferramenta}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Tarefas */}
            <div className="bg-white dark:bg-gray-700/50 rounded-lg border-2 border-gray-200 dark:border-gray-600">
              <div 
                className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/70 transition-colors rounded-t-lg"
                onClick={() => toggleSection('tarefas')}
              >
                <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <div>Tarefas Concluídas</div>
                    <div className="text-xs font-normal text-gray-500 dark:text-gray-400">
                      {tarefas.length} {tarefas.length === 1 ? 'tarefa' : 'tarefas'}
                    </div>
                  </div>
                  <ChevronDown className={`w-5 h-5 ml-2 transform transition-transform ${sectionsOpen.tarefas ? '' : '-rotate-90'}`} />
                </h4>
                <div className="text-right">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Total</div>
                  <div className="text-xl font-bold text-green-600 dark:text-green-400">
                    {funcionario.pontuacao.detalhes.tarefas} pts
                  </div>
                </div>
              </div>
              {sectionsOpen.tarefas && (
                <div className="px-4 pb-4 space-y-2 max-h-[300px] overflow-y-auto">
                  {tarefas.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                      Nenhuma tarefa concluída neste período
                    </p>
                  ) : (
                    tarefas.map((tarefa, index) => {
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
                      
                      return (
                        <div key={index} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white mb-1">
                                {tarefa.titulo || 'Tarefa sem título'}
                              </div>
                              <div className="flex items-center gap-2 text-xs">
                                <span className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-1 rounded font-medium">
                                  {getDataFormatada(tarefa.dataConclusao)}
                                </span>
                                <span className={`px-2 py-1 rounded font-medium ${
                                  (tarefa.prioridade?.toLowerCase() === 'urgente') ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' :
                                  (tarefa.prioridade?.toLowerCase() === 'alta') ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' :
                                  'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                }`}>
                                  {tarefa.prioridade || 'Média'}
                                </span>
                                <span className="text-gray-500 dark:text-gray-400">
                                  {tarefa.tempoEstimado || '1'}h
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-green-600 dark:text-green-400 text-lg">
                                +{totalPontos} pts
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {pontosPrioridade} + {pontosExtra}
                              </div>
                            </div>
                          </div>
                          {tarefa.descricao && (
                            <div className="text-xs text-gray-600 dark:text-gray-300 mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                              {tarefa.descricao}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Avaliações */}
            <div className="bg-white dark:bg-gray-700/50 rounded-lg border-2 border-gray-200 dark:border-gray-600">
              <div 
                className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/70 transition-colors rounded-t-lg"
                onClick={() => toggleSection('avaliacoes')}
              >
                <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                    <Star className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <div>Avaliações</div>
                    <div className="text-xs font-normal text-gray-500 dark:text-gray-400">
                      {avaliacoes.length} {avaliacoes.length === 1 ? 'avaliação' : 'avaliações'}
                    </div>
                  </div>
                  <ChevronDown className={`w-5 h-5 ml-2 transform transition-transform ${sectionsOpen.avaliacoes ? '' : '-rotate-90'}`} />
                </h4>
                <div className="text-right">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Total</div>
                  <div className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
                    {funcionario.pontuacao.detalhes.avaliacao} pts
                  </div>
                </div>
              </div>
              {sectionsOpen.avaliacoes && (
                <div className="px-4 pb-4 space-y-2 max-h-[300px] overflow-y-auto">
                  {avaliacoes.length === 0 ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                      Nenhuma avaliação registrada neste período
                    </p>
                  ) : (
                    avaliacoes.map((avaliacao, index) => {
                      const pontosEstrelas = {
                        5: 50,
                        4: 40,
                        3: 30,
                        2: 20,
                        1: 10
                      };
                      
                      return (
                        <div key={index} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 px-2 py-1 rounded text-xs font-medium">
                                {getDataFormatada(avaliacao.data)}
                              </div>
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star 
                                    key={i} 
                                    className={`w-4 h-4 ${
                                      i < avaliacao.estrelas 
                                        ? 'text-yellow-400 fill-yellow-400' 
                                        : 'text-gray-300 dark:text-gray-600'
                                    }`}
                                  />
                                ))}
                                <span className="ml-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                                  {avaliacao.estrelas}/5
                                </span>
                              </div>
                            </div>
                            <div className="font-bold text-yellow-600 dark:text-yellow-400 text-lg">
                              +{pontosEstrelas[avaliacao.estrelas] || 0} pts
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer com total */}
        <div className="p-6 border-t-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                Pontuação Total do Período
              </div>
              <div className="text-3xl font-bold text-[#1D9BF0]">
                {funcionario.pontuacao.total}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                pontos acumulados
              </div>
            </div>
            <div className="text-right space-y-1">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500 dark:text-gray-400">Ferramentas:</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {funcionario.pontuacao.detalhes.ferramentas} pts
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500 dark:text-gray-400">Tarefas:</span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  {funcionario.pontuacao.detalhes.tarefas} pts
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500 dark:text-gray-400">Avaliações:</span>
                <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                  {funcionario.pontuacao.detalhes.avaliacao} pts
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RankingPontos;

