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

// Sistema de permissões
export const PermissionChecker = {
  // Verificar se pode visualizar
  canView: (userLevel, section) => {
    return userLevel >= NIVEIS_PERMISSAO.FUNCIONARIO;
  },

  // Verificar se pode criar/editar/deletar dados operacionais (inventário, empréstimos, etc.)
  canManageOperational: (userLevel) => {
    // Funcionário (nivel 1) não pode editar nada
    return userLevel > NIVEIS_PERMISSAO.FUNCIONARIO;
  },

  // Verificar se pode gerenciar funcionários (para empréstimos)
  canManageEmployees: (userLevel) => {
    // Funcionário (nivel 1) não pode editar nada
    return userLevel > NIVEIS_PERMISSAO.FUNCIONARIO;
  },

  // Verificar se pode gerenciar usuários do sistema
  canManageUsers: (userLevel) => {
    // Funcionário (nivel 1) não pode editar nada
    return userLevel > NIVEIS_PERMISSAO.FUNCIONARIO && userLevel >= NIVEIS_PERMISSAO.GERENTE;
  },

  // Verificar se pode criar usuários de nível específico
  canCreateUserLevel: (userLevel, targetLevel) => {
    if (userLevel === NIVEIS_PERMISSAO.FUNCIONARIO) return false;
    if (userLevel === NIVEIS_PERMISSAO.ADMIN) return true;
    if (userLevel === NIVEIS_PERMISSAO.GERENTE) {
      return targetLevel <= NIVEIS_PERMISSAO.SUPERVISOR;
    }
    return false;
  },

  // Verificar se pode editar usuário específico
  canEditUser: (userLevel, userId, targetUserId, targetUserLevel) => {
    if (userLevel === NIVEIS_PERMISSAO.FUNCIONARIO) return false;
    if (userId === targetUserId) return true; // Próprio perfil
    if (userLevel === NIVEIS_PERMISSAO.ADMIN) return true;
    if (userLevel === NIVEIS_PERMISSAO.GERENTE) {
      return targetUserLevel < NIVEIS_PERMISSAO.GERENTE;
    }
    return false;
  },

  // Verificar se pode gerenciar compras
  canManagePurchases: (userLevel) => {
    // Funcionário (nivel 1) não pode editar nada
    return userLevel > NIVEIS_PERMISSAO.FUNCIONARIO;
  }
};
