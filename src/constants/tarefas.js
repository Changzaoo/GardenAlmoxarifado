// Estados possíveis das tarefas
export const ESTADOS_TAREFA = {
  PENDENTE: 'pendente',
  EM_ANDAMENTO: 'em_andamento',
  CONCLUIDA: 'concluida',
  CANCELADA: 'cancelada'
};

export const ESTADOS_TAREFA_LABELS = {
  pendente: 'Pendente',
  em_andamento: 'Em Andamento',
  concluida: 'Concluída',
  cancelada: 'Cancelada'
};

// Cores para os estados das tarefas
export const ESTADOS_TAREFA_COLORS = {
  pendente: 'bg-yellow-100 text-yellow-800',
  em_andamento: 'bg-blue-100 text-blue-800',
  concluida: 'bg-green-100 text-green-800',
  cancelada: 'bg-red-100 text-red-800'
};

// Prioridades das tarefas
export const PRIORIDADE_TAREFA = {
  BAIXA: 'baixa',
  MEDIA: 'media',
  ALTA: 'alta',
  URGENTE: 'urgente'
};

export const PRIORIDADE_TAREFA_LABELS = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  urgente: 'Urgente'
};

// Cores para as prioridades
export const PRIORIDADE_TAREFA_COLORS = {
  baixa: 'bg-gray-100 text-gray-800',
  media: 'bg-blue-100 text-blue-800',
  alta: 'bg-orange-100 text-orange-800',
  urgente: 'bg-red-100 text-red-800'
};
