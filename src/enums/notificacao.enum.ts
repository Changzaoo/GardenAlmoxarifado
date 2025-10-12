/**
 * Enums relacionados a Notificações
 */

export enum TipoNotificacaoEnum {
  EMPRESTIMO = 'emprestimo',
  DEVOLUCAO = 'devolucao',
  TAREFA = 'tarefa',
  MENSAGEM = 'mensagem',
  AVALIACAO = 'avaliacao',
  PONTO = 'ponto',
  SISTEMA = 'sistema',
  ALERTA = 'alerta',
  TRANSFERENCIA = 'transferencia'
}

export const TipoNotificacaoLabels: Record<TipoNotificacaoEnum, string> = {
  [TipoNotificacaoEnum.EMPRESTIMO]: 'Empréstimo',
  [TipoNotificacaoEnum.DEVOLUCAO]: 'Devolução',
  [TipoNotificacaoEnum.TAREFA]: 'Tarefa',
  [TipoNotificacaoEnum.MENSAGEM]: 'Mensagem',
  [TipoNotificacaoEnum.AVALIACAO]: 'Avaliação',
  [TipoNotificacaoEnum.PONTO]: 'Ponto',
  [TipoNotificacaoEnum.SISTEMA]: 'Sistema',
  [TipoNotificacaoEnum.ALERTA]: 'Alerta',
  [TipoNotificacaoEnum.TRANSFERENCIA]: 'Transferência'
};

export const TipoNotificacaoIcons: Record<TipoNotificacaoEnum, string> = {
  [TipoNotificacaoEnum.EMPRESTIMO]: '🔨',
  [TipoNotificacaoEnum.DEVOLUCAO]: '✅',
  [TipoNotificacaoEnum.TAREFA]: '📋',
  [TipoNotificacaoEnum.MENSAGEM]: '💬',
  [TipoNotificacaoEnum.AVALIACAO]: '⭐',
  [TipoNotificacaoEnum.PONTO]: '⏰',
  [TipoNotificacaoEnum.SISTEMA]: '⚙️',
  [TipoNotificacaoEnum.ALERTA]: '⚠️',
  [TipoNotificacaoEnum.TRANSFERENCIA]: '🔄'
};

export enum PrioridadeNotificacaoEnum {
  BAIXA = 'baixa',
  NORMAL = 'normal',
  ALTA = 'alta',
  URGENTE = 'urgente'
}

export const PrioridadeNotificacaoLabels: Record<PrioridadeNotificacaoEnum, string> = {
  [PrioridadeNotificacaoEnum.BAIXA]: 'Baixa',
  [PrioridadeNotificacaoEnum.NORMAL]: 'Normal',
  [PrioridadeNotificacaoEnum.ALTA]: 'Alta',
  [PrioridadeNotificacaoEnum.URGENTE]: 'Urgente'
};

export const PrioridadeNotificacaoColors: Record<PrioridadeNotificacaoEnum, string> = {
  [PrioridadeNotificacaoEnum.BAIXA]: 'gray',
  [PrioridadeNotificacaoEnum.NORMAL]: 'blue',
  [PrioridadeNotificacaoEnum.ALTA]: 'orange',
  [PrioridadeNotificacaoEnum.URGENTE]: 'red'
};
