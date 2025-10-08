/**
 * Configuração de Data de Início para Cálculo de Horas
 * 
 * Define a partir de qual data o sistema deve começar a contar
 * as horas dos funcionários no mês atual.
 * 
 * Útil para resetar o cálculo de horas durante o mês,
 * desconsiderando dias anteriores.
 */

// Data de início para cálculo de horas (08/10/2025)
export const DATA_INICIO_CALCULO_HORAS = new Date(2025, 9, 8); // Mês 9 = Outubro (zero-indexed)

/**
 * Obtém a data de início para cálculo de horas
 * Se a data configurada for no mês atual, usa ela
 * Caso contrário, usa o primeiro dia do mês
 */
export const obterDataInicioCalculoHoras = () => {
  const hoje = new Date();
  const dataInicio = new Date(DATA_INICIO_CALCULO_HORAS);
  dataInicio.setHours(0, 0, 0, 0);

  // Se a data de início for no mês atual, usa ela
  if (
    dataInicio.getMonth() === hoje.getMonth() &&
    dataInicio.getFullYear() === hoje.getFullYear()
  ) {
    return dataInicio;
  }

  // Caso contrário, usa o primeiro dia do mês atual
  return new Date(hoje.getFullYear(), hoje.getMonth(), 1);
};

/**
 * Verifica se uma data está dentro do período de cálculo
 */
export const estaDentroPeriodoCalculo = (data) => {
  const dataInicio = obterDataInicioCalculoHoras();
  return new Date(data) >= dataInicio;
};
