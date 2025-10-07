import { format, differenceInMinutes, parseISO, addMinutes, subMinutes } from 'date-fns';

/**
 * Utilitários para controle de ponto eletrônico
 * Sistema de tolerância, cálculo de horas e advertências
 */

// Constantes
export const TOLERANCIA_MINUTOS = 10;
export const MAX_ADVERTENCIAS = 3;
export const PREMIO_ASSIDUIDADE = 100; // R$ 100

/**
 * Tipo de registro de ponto
 */
export const TIPO_PONTO = {
  ENTRADA: 'entrada',
  ALMOCO: 'almoco',
  RETORNO: 'retorno',
  SAIDA: 'saida'
};

/**
 * Calcula a diferença em minutos entre dois horários
 * @param {Date|string} horarioEsperado - Horário que deveria ser
 * @param {Date|string} horarioReal - Horário que foi batido
 * @returns {number} - Diferença em minutos (positivo = atrasado, negativo = adiantado)
 */
export const calcularDiferencaMinutos = (horarioEsperado, horarioReal) => {
  const esperado = typeof horarioEsperado === 'string' ? parseISO(horarioEsperado) : horarioEsperado;
  const real = typeof horarioReal === 'string' ? parseISO(horarioReal) : horarioReal;
  
  return differenceInMinutes(real, esperado);
};

/**
 * Verifica se o ponto está dentro da tolerância de 10 minutos
 * @param {Date|string} horarioEsperado 
 * @param {Date|string} horarioReal 
 * @returns {Object} { dentroTolerancia, diferencaMinutos, tipo }
 */
export const validarTolerancia = (horarioEsperado, horarioReal) => {
  const diferenca = calcularDiferencaMinutos(horarioEsperado, horarioReal);
  const dentroTolerancia = Math.abs(diferenca) <= TOLERANCIA_MINUTOS;
  
  let tipo = 'pontual';
  if (diferenca < -TOLERANCIA_MINUTOS) {
    tipo = 'adiantado'; // Chegou muito cedo
  } else if (diferenca > TOLERANCIA_MINUTOS) {
    tipo = 'atrasado'; // Chegou muito tarde
  } else if (diferenca < 0) {
    tipo = 'hora_positiva'; // Dentro da tolerância, mas adiantado
  } else if (diferenca > 0) {
    tipo = 'hora_negativa'; // Dentro da tolerância, mas atrasado
  }
  
  return {
    dentroTolerancia,
    diferencaMinutos: diferenca,
    tipo,
    mensagem: getMensagemTolerancia(tipo, diferenca)
  };
};

/**
 * Retorna mensagem de acordo com o tipo de ponto
 */
const getMensagemTolerancia = (tipo, diferenca) => {
  const absDiff = Math.abs(diferenca);
  
  switch (tipo) {
    case 'pontual':
      return 'Ponto registrado no horário!';
    case 'hora_positiva':
      return `+${absDiff} min - Hora positiva creditada!`;
    case 'hora_negativa':
      return `-${diferenca} min - Hora negativa registrada`;
    case 'adiantado':
      return `Você chegou ${absDiff} minutos antes do permitido`;
    case 'atrasado':
      return `⚠️ ATENÇÃO: Atraso de ${diferenca} minutos!`;
    default:
      return 'Ponto registrado';
  }
};

/**
 * Verifica se pode bater o ponto (dentro da janela de 10 minutos)
 * @param {string} horarioEsperado - Formato "HH:mm"
 * @param {Date} agora - Hora atual
 * @returns {Object} { podeBater, motivoBloqueio, proximaJanela }
 */
export const podeBaterPonto = (horarioEsperado, agora = new Date()) => {
  if (!horarioEsperado) {
    return { 
      podeBater: false, 
      motivoBloqueio: 'Horário não configurado para este funcionário',
      proximaJanela: null
    };
  }
  
  // Criar data com o horário esperado
  const [horas, minutos] = horarioEsperado.split(':');
  const horarioEsperadoCompleto = new Date(agora);
  horarioEsperadoCompleto.setHours(parseInt(horas), parseInt(minutos), 0, 0);
  
  // Janela de tolerância: 10 min antes até 10 min depois
  const janelaInicio = subMinutes(horarioEsperadoCompleto, TOLERANCIA_MINUTOS);
  const janelaFim = addMinutes(horarioEsperadoCompleto, TOLERANCIA_MINUTOS);
  
  const dentroJanela = agora >= janelaInicio && agora <= janelaFim;
  
  if (dentroJanela) {
    return { podeBater: true, motivoBloqueio: null, proximaJanela: null };
  }
  
  // Se ainda não chegou na janela
  if (agora < janelaInicio) {
    return {
      podeBater: false,
      motivoBloqueio: `Aguarde até ${format(janelaInicio, 'HH:mm')} para bater o ponto`,
      proximaJanela: janelaInicio
    };
  }
  
  // Se passou da janela
  return {
    podeBater: false,
    motivoBloqueio: `Janela de ponto encerrada às ${format(janelaFim, 'HH:mm')}. Procure seu supervisor.`,
    proximaJanela: null
  };
};

/**
 * Calcula as horas trabalhadas em um período
 * @param {Date|string} inicio 
 * @param {Date|string} fim 
 * @returns {Object} { horas, minutos, totalMinutos, formatado }
 */
export const calcularHorasTrabalhadas = (inicio, fim) => {
  if (!inicio || !fim) {
    return { horas: 0, minutos: 0, totalMinutos: 0, formatado: '0h 0m' };
  }
  
  const inicioDate = typeof inicio === 'string' ? parseISO(inicio) : inicio;
  const fimDate = typeof fim === 'string' ? parseISO(fim) : fim;
  
  const totalMinutos = differenceInMinutes(fimDate, inicioDate);
  const horas = Math.floor(totalMinutos / 60);
  const minutos = totalMinutos % 60;
  
  return {
    horas,
    minutos,
    totalMinutos,
    formatado: `${horas}h ${minutos}m`
  };
};

/**
 * Calcula o saldo de horas do dia
 * @param {Object} registros - { entrada, almoco, retorno, saida }
 * @param {Object} horarios - { entrada, almoco, retorno, saida }
 * @returns {Object} Resumo completo do dia
 */
export const calcularSaldoDia = (registros, horarios) => {
  if (!registros.entrada) {
    return null;
  }
  
  let saldoMinutos = 0;
  let advertencias = [];
  
  // Validar cada ponto
  ['entrada', 'almoco', 'retorno', 'saida'].forEach(tipo => {
    if (registros[tipo] && horarios[tipo]) {
      const validacao = validarTolerancia(
        combinarDataHora(registros.entrada, horarios[tipo]),
        registros[tipo]
      );
      
      if (validacao.tipo === 'hora_positiva') {
        saldoMinutos -= Math.abs(validacao.diferencaMinutos); // Chegou antes
      } else if (validacao.tipo === 'hora_negativa') {
        saldoMinutos += validacao.diferencaMinutos; // Chegou depois
      } else if (validacao.tipo === 'atrasado') {
        advertencias.push({
          tipo,
          minutos: validacao.diferencaMinutos,
          mensagem: `Atraso de ${validacao.diferencaMinutos} min no ${getTipoLabel(tipo)}`
        });
        saldoMinutos += validacao.diferencaMinutos;
      }
    }
  });
  
  // Calcular horas trabalhadas
  const periodoManha = registros.almoco ? 
    calcularHorasTrabalhadas(registros.entrada, registros.almoco) : null;
  
  const periodoTarde = (registros.retorno && registros.saida) ?
    calcularHorasTrabalhadas(registros.retorno, registros.saida) : null;
  
  const totalTrabalhado = periodoManha && periodoTarde ?
    periodoManha.totalMinutos + periodoTarde.totalMinutos : 
    (periodoManha?.totalMinutos || 0);
  
  return {
    saldoMinutos,
    saldoFormatado: formatarSaldo(saldoMinutos),
    advertencias,
    periodoManha,
    periodoTarde,
    totalTrabalhado: {
      minutos: totalTrabalhado,
      formatado: formatarMinutosParaHoras(totalTrabalhado)
    }
  };
};

/**
 * Combina uma data com um horário no formato "HH:mm"
 */
const combinarDataHora = (data, horario) => {
  const [horas, minutos] = horario.split(':');
  const resultado = new Date(data);
  resultado.setHours(parseInt(horas), parseInt(minutos), 0, 0);
  return resultado;
};

/**
 * Formata minutos em formato de horas
 */
const formatarMinutosParaHoras = (minutos) => {
  const horas = Math.floor(Math.abs(minutos) / 60);
  const mins = Math.abs(minutos) % 60;
  const sinal = minutos < 0 ? '-' : '+';
  return `${sinal}${horas}h ${mins}m`;
};

/**
 * Formata saldo de horas
 */
const formatarSaldo = (minutos) => {
  if (minutos === 0) return '0h 0m';
  return formatarMinutosParaHoras(minutos);
};

/**
 * Retorna label amigável do tipo de ponto
 */
const getTipoLabel = (tipo) => {
  const labels = {
    entrada: 'Entrada',
    almoco: 'Almoço',
    retorno: 'Retorno',
    saida: 'Saída'
  };
  return labels[tipo] || tipo;
};

/**
 * Verifica se funcionário mantém assiduidade
 * @param {Array} advertencias - Lista de advertências
 * @param {Array} faltas - Lista de faltas sem justificativa
 * @returns {Object} Status de assiduidade
 */
export const verificarAssiduidade = (advertencias = [], faltas = []) => {
  const totalAdvertencias = advertencias.length;
  const totalFaltas = faltas.length;
  
  const perdeuAssiduidade = totalAdvertencias >= MAX_ADVERTENCIAS || totalFaltas > 0;
  
  return {
    temAssiduidade: !perdeuAssiduidade,
    totalAdvertencias,
    totalFaltas,
    advertenciasRestantes: Math.max(0, MAX_ADVERTENCIAS - totalAdvertencias),
    mensagem: perdeuAssiduidade 
      ? `❌ Assiduidade perdida (${totalAdvertencias} advertências, ${totalFaltas} faltas)`
      : `✅ Assiduidade mantida (${advertenciasRestantes} advertências restantes)`,
    premioValor: perdeuAssiduidade ? 0 : PREMIO_ASSIDUIDADE,
    advertenciasRestantes: Math.max(0, MAX_ADVERTENCIAS - totalAdvertencias)
  };
};

/**
 * Gera resumo mensal de pontos
 */
export const gerarResumoMensal = (pontos = []) => {
  let totalHorasTrabalhadas = 0;
  let totalHorasExtras = 0;
  let totalAdvertencias = [];
  let diasTrabalhados = 0;
  let faltas = [];
  
  pontos.forEach(ponto => {
    if (ponto.saida) {
      diasTrabalhados++;
      
      const saldo = calcularSaldoDia(ponto, ponto.horariosEsperados);
      if (saldo) {
        totalHorasTrabalhadas += saldo.totalTrabalhado.minutos;
        
        if (saldo.saldoMinutos < 0) {
          totalHorasExtras += Math.abs(saldo.saldoMinutos);
        }
        
        totalAdvertencias = totalAdvertencias.concat(saldo.advertencias);
      }
    } else if (ponto.falta && !ponto.justificativa) {
      faltas.push(ponto);
    }
  });
  
  const assiduidade = verificarAssiduidade(totalAdvertencias, faltas);
  
  return {
    diasTrabalhados,
    totalHorasTrabalhadas: formatarMinutosParaHoras(totalHorasTrabalhadas),
    totalHorasExtras: formatarMinutosParaHoras(totalHorasExtras),
    totalAdvertencias: totalAdvertencias.length,
    totalFaltas: faltas.length,
    assiduidade
  };
};

/**
 * Valida se todos os campos de horário estão preenchidos
 */
export const validarHorariosCompletos = (horarios) => {
  if (!horarios) return false;
  
  return !!(
    horarios.entrada &&
    horarios.almoco &&
    horarios.retorno &&
    horarios.saida
  );
};
