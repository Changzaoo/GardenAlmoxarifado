/**
 * Enums relacionados a Tarefas
 */

export enum StatusTarefaEnum {
  PENDENTE = 'pendente',
  EM_ANDAMENTO = 'em_andamento',
  CONCLUIDA = 'concluida',
  CANCELADA = 'cancelada',
  ATRASADA = 'atrasada'
}

export const StatusTarefaLabels: Record<StatusTarefaEnum, string> = {
  [StatusTarefaEnum.PENDENTE]: 'Pendente',
  [StatusTarefaEnum.EM_ANDAMENTO]: 'Em Andamento',
  [StatusTarefaEnum.CONCLUIDA]: 'Concluída',
  [StatusTarefaEnum.CANCELADA]: 'Cancelada',
  [StatusTarefaEnum.ATRASADA]: 'Atrasada'
};

export const StatusTarefaColors: Record<StatusTarefaEnum, string> = {
  [StatusTarefaEnum.PENDENTE]: 'gray',
  [StatusTarefaEnum.EM_ANDAMENTO]: 'blue',
  [StatusTarefaEnum.CONCLUIDA]: 'green',
  [StatusTarefaEnum.CANCELADA]: 'red',
  [StatusTarefaEnum.ATRASADA]: 'orange'
};

export enum TipoTarefaEnum {
  MANUTENCAO = 'manutencao',
  LIMPEZA = 'limpeza',
  INSTALACAO = 'instalacao',
  VERIFICACAO = 'verificacao',
  REPARO = 'reparo',
  OUTROS = 'outros'
}

export const TipoTarefaLabels: Record<TipoTarefaEnum, string> = {
  [TipoTarefaEnum.MANUTENCAO]: 'Manutenção',
  [TipoTarefaEnum.LIMPEZA]: 'Limpeza',
  [TipoTarefaEnum.INSTALACAO]: 'Instalação',
  [TipoTarefaEnum.VERIFICACAO]: 'Verificação',
  [TipoTarefaEnum.REPARO]: 'Reparo',
  [TipoTarefaEnum.OUTROS]: 'Outros'
};

export enum PrioridadeTarefaEnum {
  BAIXA = 'baixa',
  MEDIA = 'media',
  ALTA = 'alta',
  URGENTE = 'urgente'
}

export const PrioridadeTarefaLabels: Record<PrioridadeTarefaEnum, string> = {
  [PrioridadeTarefaEnum.BAIXA]: 'Baixa',
  [PrioridadeTarefaEnum.MEDIA]: 'Média',
  [PrioridadeTarefaEnum.ALTA]: 'Alta',
  [PrioridadeTarefaEnum.URGENTE]: 'Urgente'
};

export const PrioridadeTarefaColors: Record<PrioridadeTarefaEnum, string> = {
  [PrioridadeTarefaEnum.BAIXA]: 'gray',
  [PrioridadeTarefaEnum.MEDIA]: 'blue',
  [PrioridadeTarefaEnum.ALTA]: 'orange',
  [PrioridadeTarefaEnum.URGENTE]: 'red'
};

export enum FrequenciaTarefaEnum {
  DIARIA = 'diaria',
  SEMANAL = 'semanal',
  QUINZENAL = 'quinzenal',
  MENSAL = 'mensal',
  TRIMESTRAL = 'trimestral',
  SEMESTRAL = 'semestral',
  ANUAL = 'anual'
}

export const FrequenciaTarefaLabels: Record<FrequenciaTarefaEnum, string> = {
  [FrequenciaTarefaEnum.DIARIA]: 'Diária',
  [FrequenciaTarefaEnum.SEMANAL]: 'Semanal',
  [FrequenciaTarefaEnum.QUINZENAL]: 'Quinzenal',
  [FrequenciaTarefaEnum.MENSAL]: 'Mensal',
  [FrequenciaTarefaEnum.TRIMESTRAL]: 'Trimestral',
  [FrequenciaTarefaEnum.SEMESTRAL]: 'Semestral',
  [FrequenciaTarefaEnum.ANUAL]: 'Anual'
};
