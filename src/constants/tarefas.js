// Estados possíveis das tarefas
export const ESTADOS_TAREFA = {
  PENDENTE: 'pendente',
  EM_ANDAMENTO: 'em_andamento',
  CONCLUIDA: 'concluida',
  VERIFICADA: 'verificada',
  CANCELADA: 'cancelada'
};

export const ESTADOS_TAREFA_LABELS = {
  pendente: 'Aguardando',
  em_andamento: 'Em Andamento',
  concluida: 'Concluída',
  verificada: 'Verificada',
  cancelada: 'Cancelada'
};

// Cores para os estados das tarefas (Twitter/X Theme)
export const ESTADOS_TAREFA_COLORS = {
  pendente: 'bg-[#FFF5D9] text-[#FAA626]',
  em_andamento: 'bg-[#E8F5FF] text-[#1D9BF0]',
  concluida: 'bg-[#EBF5FB] text-[#1DA1F2]',
  verificada: 'bg-[#EBF5FB] text-[#1DA1F2] border border-[#1DA1F2]',
  cancelada: 'bg-[#FFE8EA] text-[#F4212E]'
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
