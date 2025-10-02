export const NIVEIS_PERMISSAO = {
  FUNCIONARIO: 1,      // Apenas visualizar
  SUPERVISOR: 2,       // Criar funcionários + todas as funções operacionais
  GERENTE: 3,          // Criar funcionários + usuários supervisor/funcionário
  ADMIN: 4,            // Todas as permissões
  LEGAL: 5            // Acesso especial à área jurídica
};

export const NIVEIS_LABELS = {
  1: 'Funcionário',
  2: 'Supervisor/Encarregado', 
  3: 'Gerente',
  4: 'Administrador',
  5: 'Jurídico'
};

export const PermissionChecker = {
  // Verifica se o usuário pode editar outro usuário
  canEditUser: (nivelEditor, idEditor, idAlvo, nivelAlvo) => {
    // Admin e Legal podem editar qualquer um
    if (nivelEditor === NIVEIS_PERMISSAO.ADMIN || 
        nivelEditor === NIVEIS_PERMISSAO.LEGAL) return true;
    
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
    return nivel === NIVEIS_PERMISSAO.ADMIN;
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
  },

  // ==================== PERMISSÕES POR SETOR ====================
  
  /**
   * Verifica se o usuário pode ver todos os dados ou apenas do seu setor
   * Admin: Vê TUDO
   * Gerente/Supervisor: Vê apenas do seu setor
   * Funcionário: Vê apenas do seu setor
   */
  canViewAllSectors: (nivel) => {
    return nivel === NIVEIS_PERMISSAO.ADMIN;
  },

  /**
   * Verifica se um item pertence ao setor do usuário
   */
  itemBelongsToUserSector: (itemSetorId, userSetorId) => {
    if (!itemSetorId || !userSetorId) return false;
    return itemSetorId === userSetorId;
  },

  /**
   * Filtra uma lista de itens por setor do usuário
   * Se for Admin, retorna tudo
   * Se for Gerente/Supervisor/Funcionário, retorna apenas do seu setor
   */
  filterBySector: (items, usuario) => {
    // Admin vê tudo
    if (usuario.nivel === NIVEIS_PERMISSAO.ADMIN) {
      return items;
    }

    // Outros veem apenas do seu setor
    if (!usuario.setorId) {
      console.warn('Usuário sem setorId definido:', usuario);
      return [];
    }

    return items.filter(item => {
      // Se o item tem setorId, comparar
      if (item.setorId) {
        return item.setorId === usuario.setorId;
      }
      
      // Se o item é um funcionário com setorId
      if (item.funcionarioSetorId) {
        return item.funcionarioSetorId === usuario.setorId;
      }

      // Se o item tem relação com funcionário, verificar o setor do funcionário
      if (item.funcionarioId && item.funcionario) {
        return item.funcionario.setorId === usuario.setorId;
      }

      // Por padrão, não mostrar itens sem setor definido
      return false;
    });
  },

  /**
   * Verifica se o usuário pode gerenciar um item específico
   * Admin: Pode gerenciar tudo
   * Gerente/Supervisor: Pode gerenciar apenas itens do seu setor
   * Funcionário: Não pode gerenciar
   */
  canManageItem: (nivel, itemSetorId, userSetorId) => {
    // Admin pode gerenciar tudo
    if (nivel === NIVEIS_PERMISSAO.ADMIN) return true;

    // Funcionário não pode gerenciar
    if (nivel === NIVEIS_PERMISSAO.FUNCIONARIO) return false;

    // Gerente/Supervisor podem gerenciar apenas do seu setor
    if (nivel >= NIVEIS_PERMISSAO.SUPERVISOR) {
      return itemSetorId === userSetorId;
    }

    return false;
  },

  /**
   * Verifica se um usuário pode criar itens em um determinado setor
   */
  canCreateInSector: (nivel, targetSetorId, userSetorId) => {
    // Admin pode criar em qualquer setor
    if (nivel === NIVEIS_PERMISSAO.ADMIN) return true;

    // Gerente/Supervisor podem criar apenas no seu setor
    if (nivel >= NIVEIS_PERMISSAO.SUPERVISOR) {
      return targetSetorId === userSetorId;
    }

    return false;
  }
};
