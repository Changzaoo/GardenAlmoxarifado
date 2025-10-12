/**
 * Enums relacionados a Inventário / Ferramentas
 */

export enum StatusFerramentaEnum {
  DISPONIVEL = 'disponivel',
  EMPRESTADA = 'emprestada',
  MANUTENCAO = 'manutencao',
  DANIFICADA = 'danificada',
  PERDIDA = 'perdida',
  BAIXA = 'baixa',
  RESERVADA = 'reservada'
}

export const StatusFerramentaLabels: Record<StatusFerramentaEnum, string> = {
  [StatusFerramentaEnum.DISPONIVEL]: 'Disponível',
  [StatusFerramentaEnum.EMPRESTADA]: 'Emprestada',
  [StatusFerramentaEnum.MANUTENCAO]: 'Manutenção',
  [StatusFerramentaEnum.DANIFICADA]: 'Danificada',
  [StatusFerramentaEnum.PERDIDA]: 'Perdida',
  [StatusFerramentaEnum.BAIXA]: 'Baixa',
  [StatusFerramentaEnum.RESERVADA]: 'Reservada'
};

export const StatusFerramentaColors: Record<StatusFerramentaEnum, string> = {
  [StatusFerramentaEnum.DISPONIVEL]: 'green',
  [StatusFerramentaEnum.EMPRESTADA]: 'blue',
  [StatusFerramentaEnum.MANUTENCAO]: 'yellow',
  [StatusFerramentaEnum.DANIFICADA]: 'red',
  [StatusFerramentaEnum.PERDIDA]: 'gray',
  [StatusFerramentaEnum.BAIXA]: 'black',
  [StatusFerramentaEnum.RESERVADA]: 'purple'
};

export enum StatusVerificacaoEnum {
  OK = 'ok',
  DIVERGENCIA = 'divergencia',
  PENDENTE = 'pendente'
}

export const StatusVerificacaoLabels: Record<StatusVerificacaoEnum, string> = {
  [StatusVerificacaoEnum.OK]: 'OK',
  [StatusVerificacaoEnum.DIVERGENCIA]: 'Divergência',
  [StatusVerificacaoEnum.PENDENTE]: 'Pendente'
};

export const StatusVerificacaoColors: Record<StatusVerificacaoEnum, string> = {
  [StatusVerificacaoEnum.OK]: 'green',
  [StatusVerificacaoEnum.DIVERGENCIA]: 'red',
  [StatusVerificacaoEnum.PENDENTE]: 'yellow'
};
