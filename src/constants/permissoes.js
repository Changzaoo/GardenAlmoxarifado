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

export const PermissionChecker = {
  // Verifica se o usuário pode editar outro usuário
  canEditUser: (nivelEditor, idEditor, idAlvo, nivelAlvo) => {
    // Admin pode editar qualquer um
    if (nivelEditor === NIVEIS_PERMISSAO.ADMIN) return true;
    
    // Gerente pode editar supervisores e funcionários
    if (nivelEditor === NIVEIS_PERMISSAO.GERENTE && 
        nivelAlvo <= NIVEIS_PERMISSAO.SUPERVISOR) return true;
    
    // Supervisor pode editar apenas funcionários
    if (nivelEditor === NIVEIS_PERMISSAO.SUPERVISOR && 
        nivelAlvo === NIVEIS_PERMISSAO.FUNCIONARIO) return true;
    
    // Usuário pode editar próprio perfil
    if (idEditor === idAlvo) return true;
    
    return false;
  },

  // Verifica se o usuário pode gerenciar operações (inventário, empréstimos, etc)
  canManageOperational: (nivel) => {
    return nivel >= NIVEIS_PERMISSAO.SUPERVISOR;
  },

  // Verifica se o usuário pode gerenciar funcionários
  canManageEmployees: (nivel) => {
    return nivel >= NIVEIS_PERMISSAO.SUPERVISOR;
  },

  // Verifica se o usuário pode gerenciar usuários do sistema
  canManageUsers: (nivel) => {
    return nivel >= NIVEIS_PERMISSAO.GERENTE;
  },

  // Verifica se o usuário pode excluir registros
  canDelete: (nivel) => {
    return nivel >= NIVEIS_PERMISSAO.SUPERVISOR;
  },

  // Verifica se o usuário pode ver informações sensíveis
  canViewSensitiveInfo: (nivel) => {
    return nivel >= NIVEIS_PERMISSAO.SUPERVISOR;
  },

  // Verifica se o usuário pode realizar operações administrativas
  canPerformAdminActions: (nivel) => {
    return nivel === NIVEIS_PERMISSAO.ADMIN;
  }
};
