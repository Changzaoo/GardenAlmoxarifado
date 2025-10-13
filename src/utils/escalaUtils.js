/**
 * Mapeamento de tipos de escala para horários detalhados
 * Usado para validação de ponto eletrônico
 */

export const HORARIOS_POR_ESCALA = {
  M: {
    label: 'M - 6x1',
    descricao: '6x1 Segunda a Sexta 07:20-16:20, Sábado/Domingo 07:20-13:20',
    semana: {
      entrada: '07:20',
      almoco: '12:00',
      retorno: '13:00',
      saida: '16:20'
    },
    fimDeSemana: {
      entrada: '07:20',
      almoco: '10:20',
      retorno: '11:20',
      saida: '13:20'
    }
  },
  M1: {
    label: 'M1 - 6x1',
    descricao: '6x1 Horário 07:00-15:20, almoço 12:00-13:00',
    semana: {
      entrada: '07:00',
      almoco: '12:00',
      retorno: '13:00',
      saida: '15:20'
    },
    fimDeSemana: {
      entrada: '07:00',
      almoco: '10:00',
      retorno: '11:00',
      saida: '13:00'
    }
  },
  M4: {
    label: 'M4 - 5x2',
    descricao: '5x2 Segunda a Sexta 06:00-15:40, almoço 10:30-11:30',
    semana: {
      entrada: '06:00',
      almoco: '10:30',
      retorno: '11:30',
      saida: '15:40'
    },
    fimDeSemana: null // Não trabalha no fim de semana
  },
  FOLGA: {
    label: 'FOLGA',
    descricao: 'Dia de folga',
    semana: null,
    fimDeSemana: null
  },
  FERIAS: {
    label: 'FÉRIAS',
    descricao: 'Período de férias',
    semana: null,
    fimDeSemana: null
  },
  ATESTADO: {
    label: 'ATESTADO',
    descricao: 'Atestado médico',
    semana: null,
    fimDeSemana: null
  },
  FOLGA_EXTRA: {
    label: 'FOLGA EXTRA',
    descricao: 'Folga extra concedida',
    semana: null,
    fimDeSemana: null
  }
};

/**
 * Obtém os horários esperados para um funcionário em um dia específico
 * @param {string} tipoEscala - Tipo de escala (M, M1, M4, etc)
 * @param {Date} data - Data do dia
 * @returns {Object|null} Horários esperados ou null se for folga/férias
 */
export const obterHorariosEsperados = (tipoEscala, data = new Date()) => {
  const escala = HORARIOS_POR_ESCALA[tipoEscala];
  
  if (!escala) {
    return null;
  }
  
  // Se for folga, férias ou atestado, não há horários
  if (!escala.semana) {
    return null;
  }
  
  // Verificar se é fim de semana (sábado=6, domingo=0)
  const diaSemana = data.getDay();
  const ehFimDeSemana = diaSemana === 0 || diaSemana === 6;
  
  if (ehFimDeSemana) {
    return escala.fimDeSemana || null;
  }
  
  return escala.semana;
};

/**
 * Obtém a escala de um funcionário para um dia específico
 * @param {Object} funcionario - Dados do funcionário
 * @param {Date} data - Data do dia
 * @param {Object} escalas - Objeto com todas as escalas
 * @returns {string|null} Tipo de escala do dia
 */
export const obterEscalaDoDia = (funcionario, data, escalas = {}) => {
  const dataKey = data.toISOString().split('T')[0];
  const funcionarioId = funcionario.id;
  
  // Verificar se há escala específica para este dia
  if (escalas[funcionarioId] && escalas[funcionarioId][dataKey]) {
    return escalas[funcionarioId][dataKey];
  }
  
  // Se não houver escala específica, usar a escala padrão do funcionário
  return funcionario.escala || funcionario.tipoEscala || null;
};

/**
 * Verifica se o funcionário deve trabalhar neste dia
 * @param {string} tipoEscala - Tipo de escala
 * @returns {boolean}
 */
export const deveTrabalharNoDia = (tipoEscala) => {
  const escalasQueNaoTrabalham = ['FOLGA', 'FERIAS', 'ATESTADO', 'FOLGA_EXTRA', 'VAZIO'];
  return tipoEscala && !escalasQueNaoTrabalham.includes(tipoEscala);
};

/**
 * Formata horário para exibição
 */
export const formatarHorario = (horario) => {
  if (!horario) return '--:--';
  return horario;
};

/**
 * Obtém descrição completa da jornada
 */
export const obterDescricaoJornada = (tipoEscala, data = new Date()) => {
  const horarios = obterHorariosEsperados(tipoEscala, data);
  
  if (!horarios) {
    const escala = HORARIOS_POR_ESCALA[tipoEscala];
    return escala?.descricao || 'Não definido';
  }
  
  return `${horarios.entrada} - ${horarios.saida} (Almoço: ${horarios.almoco} - ${horarios.retorno})`;
};
