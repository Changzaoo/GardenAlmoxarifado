export interface TarefaSemanal {
  id: string;
  titulo: string;
  descricao: string;
  diasDaSemana: number[]; // 0-6, onde 0 é domingo
  funcionariosIds: string[];
  prioridade: 'baixa' | 'media' | 'alta';
  status: 'pendente' | 'em_andamento' | 'concluida';
  criadaEm: string;
  ultimaAtualizacao: string;
  frequencia: 'semanal' | 'mensal';
}

export interface ExecucaoTarefa {
  id: string;
  tarefaId: string;
  funcionarioId: string;
  dataExecucao: string;
  status: 'concluida' | 'nao_concluida';
  observacoes?: string;
}

export interface FuncionarioDisponibilidade {
  funcionarioId: string;
  diasDisponiveis: number[]; // 0-6, onde 0 é domingo
  horarioInicio: string;
  horarioFim: string;
}

// Estado global para gerenciamento de tarefas
export interface TarefasSemanaisState {
  tarefas: TarefaSemanal[];
  execucoes: ExecucaoTarefa[];
  disponibilidades: FuncionarioDisponibilidade[];
  isLoading: boolean;
  error: string | null;
}