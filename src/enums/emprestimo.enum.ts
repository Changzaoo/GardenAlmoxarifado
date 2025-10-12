/**
 * Enums relacionados a Empréstimos
 */

export enum StatusEmprestimoEnum {
  ATIVO = 'ativo',
  DEVOLVIDO = 'devolvido',
  PARCIAL = 'parcial',
  ATRASADO = 'atrasado',
  PERDIDO = 'perdido',
  DANIFICADO = 'danificado',
  TRANSFERIDO = 'transferido'
}

export const StatusEmprestimoLabels: Record<StatusEmprestimoEnum, string> = {
  [StatusEmprestimoEnum.ATIVO]: 'Ativo',
  [StatusEmprestimoEnum.DEVOLVIDO]: 'Devolvido',
  [StatusEmprestimoEnum.PARCIAL]: 'Parcial',
  [StatusEmprestimoEnum.ATRASADO]: 'Atrasado',
  [StatusEmprestimoEnum.PERDIDO]: 'Perdido',
  [StatusEmprestimoEnum.DANIFICADO]: 'Danificado',
  [StatusEmprestimoEnum.TRANSFERIDO]: 'Transferido'
};

export const StatusEmprestimoColors: Record<StatusEmprestimoEnum, string> = {
  [StatusEmprestimoEnum.ATIVO]: 'blue',
  [StatusEmprestimoEnum.DEVOLVIDO]: 'green',
  [StatusEmprestimoEnum.PARCIAL]: 'yellow',
  [StatusEmprestimoEnum.ATRASADO]: 'red',
  [StatusEmprestimoEnum.PERDIDO]: 'gray',
  [StatusEmprestimoEnum.DANIFICADO]: 'orange',
  [StatusEmprestimoEnum.TRANSFERIDO]: 'purple'
};

export enum TipoEmprestimoEnum {
  INTERNO = 'interno',
  EXTERNO = 'externo',
  TEMPORARIO = 'temporario',
  PERMANENTE = 'permanente'
}

export const TipoEmprestimoLabels: Record<TipoEmprestimoEnum, string> = {
  [TipoEmprestimoEnum.INTERNO]: 'Interno',
  [TipoEmprestimoEnum.EXTERNO]: 'Externo',
  [TipoEmprestimoEnum.TEMPORARIO]: 'Temporário',
  [TipoEmprestimoEnum.PERMANENTE]: 'Permanente'
};
