export const NIVEIS_PERMISSAO = {
  FUNCIONARIO: 1,      // Apenas visualizar
  SUPERVISOR: 2,       // Criar funcionários + todas as funções operacionais
  GERENTE: 3,          // Criar funcionários + usuários supervisor/funcionário
  ADMIN: 4             // Todas as permissões
};

export const NIVEIS_LABELS = {
  1: 'Funcionário',
  2: 'Supervisor/Encarregado', 
  3: 'Gerente',
  4: 'Administrador'
};
