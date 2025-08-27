/**
 * Utilitários para manipulação de datas
 */

export const formatarData = (data) => {
  if (!data) return '-';
  try {
    const dataObj = typeof data === 'string' ? new Date(data.replace(/-/g, '/')) : new Date(data);
    return dataObj.toLocaleDateString('pt-BR');
  } catch (error) {
    console.error('Erro ao formatar data:', data, error);
    return '-';
  }
};

export const formatarHora = (hora) => {
  if (!hora) return '-';
  return hora;
};

export const formatarDataHora = (data) => {
  if (!data) return '-';
  try {
    const dataObj = new Date(data);
    return `${dataObj.toLocaleDateString('pt-BR')} às ${dataObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  } catch (error) {
    console.error('Erro ao formatar data e hora:', data, error);
    return '-';
  }
};

export const obterDataAtual = () => {
  return new Date().toISOString().split('T')[0];
};

export const obterHoraAtual = () => {
  return new Date().toTimeString().slice(0, 5);
};

export const calcularDiasEmprestimo = (dataRetirada) => {
  if (!dataRetirada) return 0;
  
  try {
    const hoje = new Date();
    const dataRetiradaObj = new Date(dataRetirada);
    const diferenca = hoje - dataRetiradaObj;
    const dias = Math.floor(diferenca / (1000 * 60 * 60 * 24));
    return Math.max(0, dias);
  } catch (error) {
    return 0;
  }
};

export const isEmprestimoVencido = (dataRetirada, diasLimite = 7) => {
  const diasEmprestimo = calcularDiasEmprestimo(dataRetirada);
  return diasEmprestimo > diasLimite;
};

export const formatarDuracao = (dataInicio, dataFim = null) => {
  const inicio = new Date(dataInicio);
  const fim = dataFim ? new Date(dataFim) : new Date();
  
  const diferenca = fim - inicio;
  const dias = Math.floor(diferenca / (1000 * 60 * 60 * 24));
  const horas = Math.floor((diferenca % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (dias > 0) {
    return `${dias} dia${dias > 1 ? 's' : ''}`;
  } else if (horas > 0) {
    return `${horas} hora${horas > 1 ? 's' : ''}`;
  } else {
    return 'Menos de 1 hora';
  }
};