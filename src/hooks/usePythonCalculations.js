/**
 * Hook para Cálculos Otimizados com Python
 * 
 * Usa Web Worker com Pyodide para cálculos pesados,
 * com fallback automático para JavaScript nativo.
 */

import { useRef, useCallback, useState, useEffect } from 'react';

// Threshold: usar Python apenas se dataset for grande o suficiente
const USE_PYTHON_THRESHOLD = {
  inventario: 100,      // 100+ itens
  funcionarios: 50,     // 50+ funcionários
  setores: 10           // 10+ setores
};

export const usePythonCalculations = () => {
  const workerRef = useRef(null);
  const [isPythonReady, setIsPythonReady] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const callbacksRef = useRef(new Map());
  const requestIdRef = useRef(0);

  // Inicializar worker
  useEffect(() => {
    try {
      // Criar worker
      workerRef.current = new Worker(
        new URL('../workers/pythonCalculations.worker.js', import.meta.url),
        { type: 'module' }
      );

      // Handler de mensagens
      workerRef.current.onmessage = (e) => {
        const { type, id, result, error } = e.data;
        const callback = callbacksRef.current.get(id);

        if (callback) {
          if (type === 'SUCCESS') {
            callback.resolve(result);
          } else if (type === 'ERROR') {
            callback.reject(new Error(error));
          }
          callbacksRef.current.delete(id);
        }
      };

      workerRef.current.onerror = (error) => {
        console.error('❌ Erro no worker Python:', error);
        setIsPythonReady(false);
        setIsInitializing(false);
      };

      // Testar se Python está pronto (dá ~3 segundos)
      setTimeout(() => {
        setIsPythonReady(true);
        setIsInitializing(false);
        console.log('✅ Worker Python pronto para uso');
      }, 3000);

    } catch (error) {
      console.warn('⚠️ Não foi possível inicializar Python, usando JavaScript nativo:', error);
      setIsPythonReady(false);
      setIsInitializing(false);
    }

    // Cleanup
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  // Função auxiliar para enviar mensagem ao worker
  const sendMessage = useCallback((type, data) => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current || !isPythonReady) {
        reject(new Error('Worker Python não disponível'));
        return;
      }

      const id = ++requestIdRef.current;
      callbacksRef.current.set(id, { resolve, reject });

      workerRef.current.postMessage({ type, data, id });

      // Timeout de 10 segundos
      setTimeout(() => {
        if (callbacksRef.current.has(id)) {
          callbacksRef.current.delete(id);
          reject(new Error('Timeout: cálculo Python demorou muito'));
        }
      }, 10000);
    });
  }, [isPythonReady]);

  /**
   * Calcular valores de um setor com otimização Python
   */
  const calcularValoresSetor = useCallback(async (
    setorId, 
    setorNome, 
    inventario, 
    ferramentasDanificadas, 
    ferramentasPerdidas
  ) => {
    const usesPython = isPythonReady && inventario.length >= USE_PYTHON_THRESHOLD.inventario;

    if (usesPython) {
      try {
        console.log('🐍 Usando Python para calcular valores do setor');
        const result = await sendMessage('CALCULAR_VALORES_SETOR', {
          inventario,
          danificadas: ferramentasDanificadas,
          perdidas: ferramentasPerdidas,
          setorId,
          setorNome
        });
        return result;
      } catch (error) {
        console.warn('⚠️ Falha no cálculo Python, usando fallback JS:', error);
      }
    }

    // Fallback JavaScript (otimizado)
    console.log('⚡ Usando JavaScript para calcular valores do setor');
    return calcularValoresSetorJS(setorId, setorNome, inventario, ferramentasDanificadas, ferramentasPerdidas);
  }, [isPythonReady, sendMessage]);

  /**
   * Calcular valores de MÚLTIPLOS setores em batch (muito mais eficiente)
   */
  const calcularValoresSetoresBatch = useCallback(async (
    setores,
    inventario,
    ferramentasDanificadas,
    ferramentasPerdidas
  ) => {
    const usesPython = isPythonReady && 
                       setores.length >= USE_PYTHON_THRESHOLD.setores &&
                       inventario.length >= USE_PYTHON_THRESHOLD.inventario;

    if (usesPython) {
      try {
        console.log(`🐍 Usando Python BATCH para calcular ${setores.length} setores`);
        const result = await sendMessage('CALCULAR_VALORES_SETORES_BATCH', {
          setores,
          inventarioBatch: inventario,
          danificadasBatch: ferramentasDanificadas,
          perdidasBatch: ferramentasPerdidas
        });
        return result;
      } catch (error) {
        console.warn('⚠️ Falha no cálculo batch Python, usando fallback JS:', error);
      }
    }

    // Fallback JavaScript
    console.log('⚡ Usando JavaScript BATCH para calcular setores');
    const resultado = {};
    for (const setor of setores) {
      resultado[setor.id] = calcularValoresSetorJS(
        setor.id,
        setor.nome,
        inventario,
        ferramentasDanificadas,
        ferramentasPerdidas
      );
    }
    return resultado;
  }, [isPythonReady, sendMessage]);

  /**
   * Calcular estatísticas de funcionário
   */
  const calcularEstatisticasFuncionario = useCallback(async (
    funcionarioId,
    pontos,
    avaliacoes,
    tarefas,
    registros
  ) => {
    const usesPython = isPythonReady && 
                       (pontos.length + avaliacoes.length + tarefas.length + registros.length) >= 200;

    if (usesPython) {
      try {
        console.log('🐍 Usando Python para calcular estatísticas do funcionário');
        const result = await sendMessage('CALCULAR_ESTATISTICAS_FUNCIONARIO', {
          funcionarioId,
          pontos,
          avaliacoes,
          tarefas,
          registros
        });
        return result;
      } catch (error) {
        console.warn('⚠️ Falha no cálculo Python, usando fallback JS:', error);
      }
    }

    // Fallback JavaScript
    console.log('⚡ Usando JavaScript para calcular estatísticas do funcionário');
    return calcularEstatisticasFuncionarioJS(funcionarioId, pontos, avaliacoes, tarefas, registros);
  }, [isPythonReady, sendMessage]);

  /**
   * Calcular dados do card de um funcionário
   */
  const calcularCardFuncionario = useCallback(async (
    funcionario,
    pontos,
    avaliacoes,
    tarefas,
    emprestimos
  ) => {
    if (isPythonReady) {
      try {
        console.log('🐍 Usando Python para calcular card do funcionário');
        const result = await sendMessage('CALCULAR_CARD_FUNCIONARIO', {
          funcionario,
          pontosFuncionario: pontos,
          avaliacoesFuncionario: avaliacoes,
          tarefasFuncionario: tarefas,
          emprestimosFuncionario: emprestimos
        });
        return result;
      } catch (error) {
        console.warn('⚠️ Falha no cálculo Python, usando fallback JS:', error);
      }
    }

    // Fallback JavaScript
    console.log('⚡ Usando JavaScript para calcular card do funcionário');
    return calcularCardFuncionarioJS(funcionario, pontos, avaliacoes, tarefas, emprestimos);
  }, [isPythonReady, sendMessage]);

  /**
   * Calcular cards de múltiplos funcionários em BATCH (muito mais rápido)
   */
  const calcularCardsFuncionariosBatch = useCallback(async (
    funcionarios,
    pontos,
    avaliacoes,
    tarefas,
    emprestimos
  ) => {
    // Usar Python se tiver 5+ funcionários OU 100+ registros totais
    const totalRegistros = pontos.length + avaliacoes.length + tarefas.length + emprestimos.length;
    const usesPython = isPythonReady && (funcionarios.length >= 5 || totalRegistros >= 100);

    if (usesPython) {
      try {
        console.log(`🐍 Usando Python BATCH para ${funcionarios.length} funcionários`);
        const result = await sendMessage('CALCULAR_CARDS_FUNCIONARIOS_BATCH', {
          funcionarios,
          pontosAll: pontos,
          avaliacoesAll: avaliacoes,
          tarefasAll: tarefas,
          emprestimosAll: emprestimos
        });
        return result;
      } catch (error) {
        console.warn('⚠️ Falha no cálculo Python BATCH, usando fallback JS:', error);
      }
    }

    // Fallback JavaScript - calcular um por um
    console.log(`⚡ Usando JavaScript para calcular ${funcionarios.length} funcionários`);
    const resultados = {};
    for (const func of funcionarios) {
      resultados[func.id] = calcularCardFuncionarioJS(func, pontos, avaliacoes, tarefas, emprestimos);
    }
    return resultados;
  }, [isPythonReady, sendMessage]);

  /**
   * Calcular horas trabalhadas considerando entrada, almoço e saída
   */
  const calcularHorasTrabalhadas = useCallback(async (
    entrada,
    saidaAlmoco,
    retornoAlmoco,
    saida
  ) => {
    // Python sempre é mais preciso para datas/horas
    if (isPythonReady) {
      try {
        console.log('🐍 Usando Python para calcular horas trabalhadas');
        const result = await sendMessage('CALCULAR_HORAS_TRABALHADAS', {
          entrada: entrada?.toISOString(),
          saidaAlmoco: saidaAlmoco?.toISOString(),
          retornoAlmoco: retornoAlmoco?.toISOString(),
          saida: saida?.toISOString()
        });
        return result;
      } catch (error) {
        console.warn('⚠️ Falha no cálculo Python, usando fallback JS:', error);
      }
    }

    // Fallback JavaScript
    console.log('⚡ Usando JavaScript para calcular horas trabalhadas');
    return calcularHorasTrabalhadasJS(entrada, saidaAlmoco, retornoAlmoco, saida);
  }, [isPythonReady, sendMessage]);

  /**
   * Calcular horas esperadas baseado no dia da semana
   * Escala M: Segunda-Sexta 8h, Sábado 4h, Domingo 0h
   */
  const calcularHorasEsperadas = useCallback(async (dataStr) => {
    if (isPythonReady) {
      try {
        const result = await sendMessage('CALCULAR_HORAS_ESPERADAS', {
          data: dataStr
        });
        return result;
      } catch (error) {
        console.warn('⚠️ Falha no cálculo Python, usando fallback JS:', error);
      }
    }

    // Fallback JavaScript
    return calcularHorasEsperadasJS(dataStr);
  }, [isPythonReady, sendMessage]);

  /**
   * Calcular saldo de horas (positivo ou negativo)
   */
  const calcularSaldoHoras = useCallback(async (
    horasTrabalhadasMin,
    horasEsperadasMin
  ) => {
    if (isPythonReady) {
      try {
        const result = await sendMessage('CALCULAR_SALDO_HORAS', {
          horasTrabalhadasMin,
          horasEsperadasMin
        });
        return result;
      } catch (error) {
        console.warn('⚠️ Falha no cálculo Python, usando fallback JS:', error);
      }
    }

    // Fallback JavaScript
    return calcularSaldoHorasJS(horasTrabalhadasMin, horasEsperadasMin);
  }, [isPythonReady, sendMessage]);

  /**
   * Calcular estatísticas de ponto do mês
   */
  const calcularEstatisticasPontoMes = useCallback(async (
    registrosPonto,
    funcionarioId,
    mes,
    ano
  ) => {
    const usesPython = isPythonReady && registrosPonto.length >= 20;

    if (usesPython) {
      try {
        console.log('🐍 Usando Python para calcular estatísticas de ponto do mês');
        const result = await sendMessage('CALCULAR_ESTATISTICAS_PONTO_MES', {
          registrosPonto,
          funcionarioIdPonto: funcionarioId,
          mes,
          ano
        });
        return result;
      } catch (error) {
        console.warn('⚠️ Falha no cálculo Python, usando fallback JS:', error);
      }
    }

    // Fallback JavaScript
    console.log('⚡ Usando JavaScript para calcular estatísticas de ponto');
    return calcularEstatisticasPontoMesJS(registrosPonto, funcionarioId, mes, ano);
  }, [isPythonReady, sendMessage]);

  /**
   * Calcular estatísticas de ponto para múltiplos funcionários em BATCH
   */
  const calcularEstatisticasPontoBatch = useCallback(async (
    registrosPonto,
    funcionariosIds,
    mes,
    ano
  ) => {
    const usesPython = isPythonReady && 
                       funcionariosIds.length >= 10 &&
                       registrosPonto.length >= 50;

    if (usesPython) {
      try {
        console.log(`🐍 Usando Python BATCH para calcular ponto de ${funcionariosIds.length} funcionários`);
        const result = await sendMessage('CALCULAR_ESTATISTICAS_PONTO_BATCH', {
          registrosPontoBatch: registrosPonto,
          funcionariosIds,
          mesBatch: mes,
          anoBatch: ano
        });
        return result;
      } catch (error) {
        console.warn('⚠️ Falha no cálculo batch Python, usando fallback JS:', error);
      }
    }

    // Fallback JavaScript
    console.log('⚡ Usando JavaScript BATCH para calcular ponto');
    const resultado = {};
    for (const funcId of funcionariosIds) {
      resultado[funcId] = calcularEstatisticasPontoMesJS(registrosPonto, funcId, mes, ano);
    }
    return resultado;
  }, [isPythonReady, sendMessage]);

  /**
   * Calcular pontuação completa de um funcionário
   */
  const calcularPontuacaoFuncionario = useCallback(async (
    funcionarioId,
    pontos,
    avaliacoes,
    tarefas,
    emprestimos
  ) => {
    if (isPythonReady) {
      try {
        console.log('🐍 Usando Python para calcular pontuação do funcionário');
        const result = await sendMessage('CALCULAR_PONTUACAO_FUNCIONARIO', {
          pontosFunc: pontos,
          avaliacoesFunc: avaliacoes,
          tarefasFunc: tarefas,
          emprestimosFunc: emprestimos,
          funcionarioIdPont: funcionarioId
        });
        return result;
      } catch (error) {
        console.warn('⚠️ Falha no cálculo Python, usando fallback JS:', error);
      }
    }

    // Fallback JavaScript
    console.log('⚡ Usando JavaScript para calcular pontuação');
    return calcularPontuacaoFuncionarioJS(funcionarioId, pontos, avaliacoes, tarefas, emprestimos);
  }, [isPythonReady, sendMessage]);

  /**
   * Calcular ranking de funcionários
   */
  const calcularRankingFuncionarios = useCallback(async (
    funcionarios,
    pontos,
    avaliacoes,
    tarefas
  ) => {
    // Usar Python se tiver 5+ funcionários
    if (isPythonReady && funcionarios.length >= 5) {
      try {
        console.log(`🐍 Usando Python para calcular ranking de ${funcionarios.length} funcionários`);
        const result = await sendMessage('CALCULAR_RANKING_FUNCIONARIOS', {
          funcionariosRank: funcionarios,
          pontosRank: pontos,
          avaliacoesRank: avaliacoes,
          tarefasRank: tarefas
        });
        return result;
      } catch (error) {
        console.warn('⚠️ Falha no cálculo Python, usando fallback JS:', error);
      }
    }

    // Fallback JavaScript
    console.log('⚡ Usando JavaScript para calcular ranking');
    return calcularRankingFuncionariosJS(funcionarios, pontos, avaliacoes, tarefas);
  }, [isPythonReady, sendMessage]);

  /**
   * Calcular estatísticas gerais do sistema
   */
  const calcularEstatisticasSistema = useCallback(async (
    funcionarios,
    pontos,
    avaliacoes,
    tarefas,
    emprestimos,
    inventario
  ) => {
    // Usar Python se tiver dados significativos
    const totalDados = funcionarios.length + pontos.length + tarefas.length;
    if (isPythonReady && totalDados >= 50) {
      try {
        console.log('🐍 Usando Python para calcular estatísticas do sistema');
        const result = await sendMessage('CALCULAR_ESTATISTICAS_SISTEMA', {
          funcionariosSist: funcionarios,
          pontosSist: pontos,
          avaliacoesSist: avaliacoes,
          tarefasSist: tarefas,
          emprestimosSist: emprestimos,
          inventarioSist: inventario
        });
        return result;
      } catch (error) {
        console.warn('⚠️ Falha no cálculo Python, usando fallback JS:', error);
      }
    }

    // Fallback JavaScript
    console.log('⚡ Usando JavaScript para calcular estatísticas do sistema');
    return calcularEstatisticasSistemaJS(funcionarios, pontos, avaliacoes, tarefas, emprestimos, inventario);
  }, [isPythonReady, sendMessage]);

  /**
   * Calcular tendências mensais
   */
  const calcularTendenciasMensal = useCallback(async (
    dadosHistoricos,
    tipoCalculo
  ) => {
    if (isPythonReady && dadosHistoricos.length >= 3) {
      try {
        console.log('🐍 Usando Python para calcular tendências mensais');
        const result = await sendMessage('CALCULAR_TENDENCIAS_MENSAL', {
          dadosHistoricos,
          tipoCalculo
        });
        return result;
      } catch (error) {
        console.warn('⚠️ Falha no cálculo Python, usando fallback JS:', error);
      }
    }

    // Fallback JavaScript
    console.log('⚡ Usando JavaScript para calcular tendências');
    return calcularTendenciasMensalJS(dadosHistoricos, tipoCalculo);
  }, [isPythonReady, sendMessage]);

  return {
    isPythonReady,
    isInitializing,
    calcularValoresSetor,
    calcularValoresSetoresBatch,
    calcularEstatisticasFuncionario,
    // Funções de cards de funcionários
    calcularCardFuncionario,
    calcularCardsFuncionariosBatch,
    // Funções de ponto
    calcularHorasTrabalhadas,
    calcularHorasEsperadas,
    calcularSaldoHoras,
    calcularEstatisticasPontoMes,
    calcularEstatisticasPontoBatch,
    // Funções de pontuação e ranking
    calcularPontuacaoFuncionario,
    calcularRankingFuncionarios,
    calcularEstatisticasSistema,
    calcularTendenciasMensal
  };
};

// ==================== FALLBACKS JAVASCRIPT ====================

function calcularValoresSetorJS(setorId, setorNome, inventario, ferramentasDanificadas, ferramentasPerdidas) {
  const itensSetor = inventario.filter(item => 
    item.setorId === setorId || item.setorNome === setorNome
  );

  const valorBruto = itensSetor.reduce((sum, item) => {
    const valor = parseFloat(item.valorUnitario || 0);
    const qtd = parseInt(item.quantidade || 0);
    return sum + (valor * qtd);
  }, 0);

  const nomesItensSet = new Set(
    itensSetor.map(i => i.nome.toLowerCase().trim())
  );

  const danificadasSetor = ferramentasDanificadas.filter(d => 
    nomesItensSet.has(d.nomeItem?.toLowerCase().trim())
  );
  const valorDanificadas = danificadasSetor.reduce((sum, d) => 
    sum + (parseFloat(d.valorEstimado) || 0), 0
  );

  const perdidasSetor = ferramentasPerdidas.filter(p => 
    nomesItensSet.has(p.nomeItem?.toLowerCase().trim())
  );
  const valorPerdidas = perdidasSetor.reduce((sum, p) => 
    sum + (parseFloat(p.valorEstimado) || 0), 0
  );

  return {
    valorBruto,
    valorDanificadas,
    valorPerdidas,
    valorLiquido: valorBruto - valorDanificadas - valorPerdidas,
    totalItens: itensSetor.length,
    quantidadeTotal: itensSetor.reduce((sum, item) => 
      sum + parseInt(item.quantidade || 0), 0
    )
  };
}

function calcularEstatisticasFuncionarioJS(funcionarioId, pontos, avaliacoes, tarefas, registros) {
  const pontosFuncionario = pontos.filter(p => p.funcionarioId === funcionarioId);
  const totalPontos = pontosFuncionario.reduce((sum, p) => sum + (parseInt(p.pontos) || 0), 0);

  const avaliacoesFuncionario = avaliacoes.filter(a => a.funcionarioId === funcionarioId);
  const avaliacaoMedia = avaliacoesFuncionario.length > 0
    ? avaliacoesFuncionario.reduce((sum, a) => sum + (parseFloat(a.nota) || 0), 0) / avaliacoesFuncionario.length
    : 0;

  const tarefasFuncionario = tarefas.filter(t => t.funcionarioId === funcionarioId);
  const tarefasPendentes = tarefasFuncionario.filter(t => t.status === 'pendente').length;
  const tarefasConcluidas = tarefasFuncionario.filter(t => t.status === 'concluida').length;

  const registrosFuncionario = registros.filter(r => r.funcionarioId === funcionarioId);
  const horasTrabalhadas = registrosFuncionario.reduce((sum, r) => 
    sum + (parseFloat(r.horasTrabalhadas) || 0), 0
  );
  const horasNegativas = registrosFuncionario.reduce((sum, r) => 
    sum + Math.abs(parseFloat(r.horasNegativas) || 0), 0
  );

  return {
    pontos: totalPontos,
    avaliacaoMedia: Math.round(avaliacaoMedia * 100) / 100,
    tarefasPendentes,
    tarefasConcluidas,
    tarefasTotal: tarefasFuncionario.length,
    horasTrabalhadas: Math.round(horasTrabalhadas * 100) / 100,
    horasNegativas: Math.round(horasNegativas * 100) / 100,
    registrosPonto: registrosFuncionario.length
  };
}

// ==================== FALLBACKS JAVASCRIPT - PONTO ====================

function calcularHorasTrabalhadasJS(entrada, saidaAlmoco, retornoAlmoco, saida) {
  if (!entrada) {
    return { horas: 0, minutos: 0, segundos: 0, totalMinutos: 0, totalSegundos: 0 };
  }

  const agora = new Date();
  let totalSegundos = 0;

  // Cenário 1: Dia completo (com saída)
  if (saida && saidaAlmoco && retornoAlmoco) {
    const segundosManha = Math.floor((saidaAlmoco - entrada) / 1000);
    const segundosTarde = Math.floor((saida - retornoAlmoco) / 1000);
    totalSegundos = segundosManha + segundosTarde;
  }
  // Cenário 2: Voltou do almoço mas não saiu
  else if (retornoAlmoco && saidaAlmoco) {
    const segundosManha = Math.floor((saidaAlmoco - entrada) / 1000);
    const segundosTarde = Math.floor((agora - retornoAlmoco) / 1000);
    totalSegundos = segundosManha + segundosTarde;
  }
  // Cenário 3: Saiu para almoço mas não voltou
  else if (saidaAlmoco) {
    totalSegundos = Math.floor((saidaAlmoco - entrada) / 1000);
  }
  // Cenário 4: Ainda não saiu para almoço
  else {
    totalSegundos = Math.floor((agora - entrada) / 1000);
  }

  totalSegundos = Math.max(0, totalSegundos);

  const horas = Math.floor(totalSegundos / 3600);
  const minutos = Math.floor((totalSegundos % 3600) / 60);
  const segundos = totalSegundos % 60;
  const totalMinutos = Math.floor(totalSegundos / 60);

  return { horas, minutos, segundos, totalMinutos, totalSegundos };
}

function calcularCardFuncionarioJS(funcionario, pontos, avaliacoes, tarefas, emprestimos) {
  const funcionarioId = funcionario.id;

  // 1. PONTOS
  const pontosFuncionario = pontos.filter(p => p.funcionarioId === funcionarioId);
  const totalPontos = pontosFuncionario.reduce((sum, p) => sum + (parseInt(p.pontos) || 0), 0);

  // 2. AVALIAÇÃO MÉDIA
  const avaliacoesFuncionario = avaliacoes.filter(a => a.funcionarioId === funcionarioId);
  const avaliacaoMedia = avaliacoesFuncionario.length > 0
    ? avaliacoesFuncionario.reduce((sum, a) => sum + (parseFloat(a.nota) || 0), 0) / avaliacoesFuncionario.length
    : 0;

  // 3. HORAS NEGATIVAS (placeholder - integração com ponto)
  const horasNegativas = 0; // TODO: calcular de registros de ponto

  // 4. TAREFAS
  const tarefasFuncionario = tarefas.filter(t => t.funcionarioId === funcionarioId);
  const tarefasConcluidas = tarefasFuncionario.filter(t => t.status === 'concluida').length;
  const tarefasTotal = tarefasFuncionario.length;

  // 5. EMPRÉSTIMOS ATIVOS
  const emprestimosFuncionario = emprestimos.filter(e => e.funcionarioId === funcionarioId);
  const emprestimosAtivos = emprestimosFuncionario.filter(e => 
    e.status === 'ativo' || e.status === 'pendente'
  ).length;

  return {
    pontos: totalPontos,
    avaliacaoMedia: Math.round(avaliacaoMedia * 100) / 100,
    horasNegativas,
    tarefasConcluidas,
    tarefasTotal,
    emprestimosAtivos
  };
}

function calcularHorasEsperadasJS(dataStr) {
  try {
    // Parse da data
    const data = new Date(dataStr);
    
    // 0 = Segunda, 1 = Terça, ..., 5 = Sábado, 6 = Domingo
    const diaSemana = data.getDay(); // getDay() retorna 0-6 (Dom-Sáb)
    
    // Segunda a Sexta (1-5): 8 horas = 480 minutos
    if (diaSemana >= 1 && diaSemana <= 5) {
      return 480;
    }
    
    // Sábado (6): 4 horas = 240 minutos
    else if (diaSemana === 6) {
      return 240;
    }
    
    // Domingo (0): 0 horas (folga)
    else {
      return 0;
    }
  } catch (error) {
    console.error('Erro ao calcular horas esperadas:', error);
    return 0;
  }
}

function calcularSaldoHorasJS(horasTrabalhadasMin, horasEsperadasMin) {
  const saldoMinutos = horasTrabalhadasMin - horasEsperadasMin;
  const horas = Math.floor(Math.abs(saldoMinutos) / 60);
  const minutos = Math.abs(saldoMinutos) % 60;

  return {
    saldoMinutos,
    ehPositivo: saldoMinutos >= 0,
    horas,
    minutos,
    formatado: `${saldoMinutos >= 0 ? '+' : '-'}${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`
  };
}

function calcularEstatisticasPontoMesJS(registrosPonto, funcionarioId, mes, ano) {
  const registrosFunc = registrosPonto.filter(r =>
    r.funcionarioId === funcionarioId &&
    r.mes === mes &&
    r.ano === ano
  );

  if (registrosFunc.length === 0) {
    return {
      totalHorasTrabalhadas: 0,
      totalHorasEsperadas: 0,
      saldoMes: 0,
      diasTrabalhados: 0,
      diasFalta: 0,
      horasExtras: 0,
      horasNegativas: 0,
      mediaHorasDia: 0
    };
  }

  let totalTrabalhado = 0;
  let totalEsperado = 0;
  let diasTrabalhados = 0;
  let diasFalta = 0;

  for (const reg of registrosFunc) {
    // Horas trabalhadas do registro
    const horasTrab = parseFloat(reg.horasTrabalhadasMinutos || 0);
    totalTrabalhado += horasTrab;

    // Calcular horas esperadas baseado no dia da semana
    const dataStr = reg.data || reg.dataFormatada || '';
    if (dataStr) {
      const horasEsp = calcularHorasEsperadasJS(dataStr);
      totalEsperado += horasEsp;
    }

    // Contabilizar dias
    if (horasTrab > 0 || reg.status === 'presente') {
      diasTrabalhados += 1;
    } else if (reg.status === 'falta') {
      diasFalta += 1;
      // Somar horas esperadas mesmo em faltas (para calcular saldo negativo)
      if (dataStr) {
        totalEsperado += calcularHorasEsperadasJS(dataStr);
      }
    }
  }

  const saldo = totalTrabalhado - totalEsperado;
  const horasExtras = Math.max(0, saldo);
  const horasNegativas = Math.abs(Math.min(0, saldo));
  const mediaHorasDia = diasTrabalhados > 0 ? totalTrabalhado / diasTrabalhados : 0;

  return {
    totalHorasTrabalhadas: Math.round(totalTrabalhado),
    totalHorasEsperadas: Math.round(totalEsperado),
    saldoMes: Math.round(saldo),
    diasTrabalhados,
    diasFalta,
    horasExtras: Math.round(horasExtras),
    horasNegativas: Math.round(horasNegativas),
    mediaHorasDia: Math.round(mediaHorasDia * 10) / 10
  };
}

// ==================== FALLBACKS JAVASCRIPT - PONTUAÇÃO E RANKING ====================

function calcularPontuacaoFuncionarioJS(funcionarioId, pontos, avaliacoes, tarefas, emprestimos) {
  // Filtrar dados do funcionário
  const pontosFuncionario = pontos.filter(p => p.funcionarioId === funcionarioId);
  const avaliacoesFuncionario = avaliacoes.filter(a => a.funcionarioId === funcionarioId);
  const tarefasFuncionario = tarefas.filter(t => t.funcionarioId === funcionarioId);
  const emprestimosFuncionario = emprestimos.filter(e => e.funcionarioId === funcionarioId);

  // Calcular pontos diretos
  const pontosDiretos = pontosFuncionario.reduce((sum, p) => sum + (parseInt(p.pontos) || 0), 0);

  // Bônus por avaliações
  const avaliacaoMedia = avaliacoesFuncionario.length > 0
    ? avaliacoesFuncionario.reduce((sum, a) => sum + (parseFloat(a.nota) || 0), 0) / avaliacoesFuncionario.length
    : 0;
  const bonusAvaliacoes = Math.round(avaliacaoMedia * 10);

  // Bônus por tarefas concluídas
  const tarefasConcluidas = tarefasFuncionario.filter(t => t.status === 'concluida').length;
  const bonusTarefas = tarefasConcluidas * 5;

  // Penalidade por empréstimos atrasados
  const emprestimosAtrasados = emprestimosFuncionario.filter(e => e.status === 'atrasado').length;
  const penalidadeEmprestimos = emprestimosAtrasados * -10;

  const pontuacaoTotal = pontosDiretos + bonusAvaliacoes + bonusTarefas + penalidadeEmprestimos;

  return {
    pontuacaoTotal: Math.max(0, pontuacaoTotal),
    pontosDiretos,
    bonusAvaliacoes,
    bonusTarefas,
    penalidadeEmprestimos,
    avaliacaoMedia: Math.round(avaliacaoMedia * 100) / 100,
    tarefasConcluidas
  };
}

function calcularRankingFuncionariosJS(funcionarios, pontos, avaliacoes, tarefas) {
  const ranking = funcionarios.map(func => {
    const funcionarioId = func.id;

    // Calcular pontos
    const pontosFuncionario = pontos.filter(p => p.funcionarioId === funcionarioId);
    const totalPontos = pontosFuncionario.reduce((sum, p) => sum + (parseInt(p.pontos) || 0), 0);

    // Calcular avaliação média
    const avaliacoesFuncionario = avaliacoes.filter(a => a.funcionarioId === funcionarioId);
    const avaliacaoMedia = avaliacoesFuncionario.length > 0
      ? avaliacoesFuncionario.reduce((sum, a) => sum + (parseFloat(a.nota) || 0), 0) / avaliacoesFuncionario.length
      : 0;

    // Calcular tarefas
    const tarefasFuncionario = tarefas.filter(t => t.funcionarioId === funcionarioId);
    const tarefasConcluidas = tarefasFuncionario.filter(t => t.status === 'concluida').length;
    const tarefasTotal = tarefasFuncionario.length;
    const taxaConclusao = tarefasTotal > 0 ? (tarefasConcluidas / tarefasTotal * 100) : 0;

    // Pontuação composta
    const pontuacao = totalPontos + (avaliacaoMedia * 10) + (tarefasConcluidas * 5);

    return {
      funcionarioId,
      funcionarioNome: func.nome || '',
      pontuacao: Math.round(pontuacao),
      pontos: totalPontos,
      avaliacaoMedia: Math.round(avaliacaoMedia * 100) / 100,
      tarefasConcluidas,
      tarefasTotal,
      taxaConclusao: Math.round(taxaConclusao * 100) / 100
    };
  });

  // Ordenar por pontuação (decrescente)
  ranking.sort((a, b) => b.pontuacao - a.pontuacao);

  // Adicionar posição
  ranking.forEach((item, index) => {
    item.posicao = index + 1;
  });

  return ranking;
}

function calcularEstatisticasSistemaJS(funcionarios, pontos, avaliacoes, tarefas, emprestimos, inventario) {
  // Estatísticas de funcionários
  const totalFuncionarios = funcionarios.length;
  const funcionariosAtivos = funcionarios.filter(f => f.status === 'ativo').length;

  // Estatísticas de pontos
  const totalPontos = pontos.reduce((sum, p) => sum + (parseInt(p.pontos) || 0), 0);
  const mediaPontos = pontos.length > 0 ? totalPontos / pontos.length : 0;

  // Estatísticas de avaliações
  const totalAvaliacoes = avaliacoes.length;
  const mediaAvaliacoes = avaliacoes.length > 0
    ? avaliacoes.reduce((sum, a) => sum + (parseFloat(a.nota) || 0), 0) / avaliacoes.length
    : 0;

  // Estatísticas de tarefas
  const tarefasPendentes = tarefas.filter(t => t.status === 'pendente').length;
  const tarefasEmAndamento = tarefas.filter(t => t.status === 'em_andamento').length;
  const tarefasConcluidas = tarefas.filter(t => t.status === 'concluida').length;
  const totalTarefas = tarefas.length;
  const taxaConclusaoTarefas = totalTarefas > 0 ? (tarefasConcluidas / totalTarefas * 100) : 0;

  // Estatísticas de empréstimos
  const emprestimosAtivos = emprestimos.filter(e => e.status === 'ativo').length;
  const emprestimosAtrasados = emprestimos.filter(e => e.status === 'atrasado').length;
  const totalEmprestimos = emprestimos.length;

  // Estatísticas de inventário
  const valorTotalInventario = inventario.reduce((sum, item) => {
    const valor = parseFloat(item.valorUnitario || 0);
    const qtd = parseInt(item.quantidade || 0);
    return sum + (valor * qtd);
  }, 0);
  const totalItens = inventario.length;
  const quantidadeTotal = inventario.reduce((sum, item) => sum + parseInt(item.quantidade || 0), 0);

  return {
    funcionarios: {
      total: totalFuncionarios,
      ativos: funcionariosAtivos,
      inativos: totalFuncionarios - funcionariosAtivos
    },
    pontos: {
      total: totalPontos,
      media: Math.round(mediaPontos * 100) / 100
    },
    avaliacoes: {
      total: totalAvaliacoes,
      media: Math.round(mediaAvaliacoes * 100) / 100
    },
    tarefas: {
      total: totalTarefas,
      pendentes: tarefasPendentes,
      emAndamento: tarefasEmAndamento,
      concluidas: tarefasConcluidas,
      taxaConclusao: Math.round(taxaConclusaoTarefas * 100) / 100
    },
    emprestimos: {
      total: totalEmprestimos,
      ativos: emprestimosAtivos,
      atrasados: emprestimosAtrasados
    },
    inventario: {
      totalItens,
      quantidadeTotal,
      valorTotal: Math.round(valorTotalInventario * 100) / 100
    }
  };
}

function calcularTendenciasMensalJS(dadosHistoricos, tipoCalculo) {
  if (!dadosHistoricos || dadosHistoricos.length === 0) {
    return {
      tendencia: 'estavel',
      variacao: 0.0,
      mediaMensal: 0.0,
      projecao: 0.0,
      totalPeriodo: 0
    };
  }

  // Extrair valores baseado no tipo
  let valores;
  if (tipoCalculo === 'pontos') {
    valores = dadosHistoricos.map(d => parseFloat(d.pontos || 0));
  } else if (tipoCalculo === 'tarefas') {
    valores = dadosHistoricos.map(d => parseFloat(d.quantidade || 0));
  } else if (tipoCalculo === 'avaliacoes') {
    valores = dadosHistoricos.map(d => parseFloat(d.nota || 0));
  } else {
    valores = dadosHistoricos.map(d => parseFloat(d.valor || 0));
  }

  // Calcular estatísticas
  const media = valores.reduce((sum, v) => sum + v, 0) / valores.length;
  const total = valores.reduce((sum, v) => sum + v, 0);

  // Calcular tendência
  const meio = Math.floor(valores.length / 2);
  let variacao = 0;
  let tendencia = 'estavel';

  if (meio > 0) {
    const primeiraParte = valores.slice(0, meio);
    const segundaParte = valores.slice(meio);
    
    const mediaPrimeira = primeiraParte.reduce((sum, v) => sum + v, 0) / primeiraParte.length;
    const mediaSegunda = segundaParte.reduce((sum, v) => sum + v, 0) / segundaParte.length;

    if (mediaPrimeira > 0) {
      variacao = ((mediaSegunda - mediaPrimeira) / mediaPrimeira) * 100;
    }

    if (variacao > 10) {
      tendencia = 'crescente';
    } else if (variacao < -10) {
      tendencia = 'decrescente';
    }
  }

  // Projeção simples (média dos últimos 3)
  const ultimos = valores.slice(-3);
  const projecao = ultimos.reduce((sum, v) => sum + v, 0) / ultimos.length;

  return {
    tendencia,
    variacao: Math.round(variacao * 100) / 100,
    mediaMensal: Math.round(media * 100) / 100,
    projecao: Math.round(projecao * 100) / 100,
    totalPeriodo: Math.round(total)
  };
}

