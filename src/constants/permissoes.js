// 🔐 Sistema de Níveis de Permissão REVERSIVO (0 = Máxima Permissão)
export const NIVEIS_PERMISSAO = {
  ADMIN: 0,           // Acesso total ao sistema (MÁXIMA PERMISSÃO)
  FUNCIONARIO: 1,     // Acesso básico
  SUPERVISOR: 2,      // Supervisiona um setor
  GERENTE_SETOR: 3,   // Gerencia um setor
  GERENTE_GERAL: 4,   // Gerencia múltiplos setores
  RH: 5,              // Recursos Humanos
  CEO: 6              // Diretor Executivo
};

export const NIVEIS_LABELS = {
  [NIVEIS_PERMISSAO.ADMIN]: 'Administrador',
  [NIVEIS_PERMISSAO.FUNCIONARIO]: 'Funcionário',
  [NIVEIS_PERMISSAO.SUPERVISOR]: 'Supervisor',
  [NIVEIS_PERMISSAO.GERENTE_SETOR]: 'Gerente de Setor',
  [NIVEIS_PERMISSAO.GERENTE_GERAL]: 'Gerente Geral',
  [NIVEIS_PERMISSAO.RH]: 'RH',
  [NIVEIS_PERMISSAO.CEO]: 'CEO'
};

/**
 * Verificação especial para administrador - Acesso TOTAL
 * Admin (nível 0) sempre tem acesso a TUDO
 */
export const isAdminTotal = (nivel) => {
  return nivel === NIVEIS_PERMISSAO.ADMIN;
};

/**
 * Verificação de permissão universal
 * Admin sempre passa, outros seguem lógica reversiva
 */
export const temPermissaoUniversal = (nivelUsuario, nivelNecessario) => {
  // Admin (nível 0) sempre tem acesso total
  if (isAdminTotal(nivelUsuario)) {
    return true;
  }
  // Outros seguem lógica reversiva (menor nível = maior permissão)
  return nivelUsuario <= nivelNecessario;
};

export const NIVEIS_DESCRICAO = {
  [NIVEIS_PERMISSAO.ADMIN]: 'Acesso total ao sistema',
  [NIVEIS_PERMISSAO.FUNCIONARIO]: 'Acesso básico às funcionalidades',
  [NIVEIS_PERMISSAO.SUPERVISOR]: 'Supervisiona equipe do setor',
  [NIVEIS_PERMISSAO.GERENTE_SETOR]: 'Gerencia um setor específico',
  [NIVEIS_PERMISSAO.GERENTE_GERAL]: 'Gerencia múltiplos setores',
  [NIVEIS_PERMISSAO.RH]: 'Gestão de recursos humanos',
  [NIVEIS_PERMISSAO.CEO]: 'Diretor executivo - visão estratégica'
};

export const NIVEIS_ICONE = {
  [NIVEIS_PERMISSAO.ADMIN]: '👑',
  [NIVEIS_PERMISSAO.FUNCIONARIO]: '👤',
  [NIVEIS_PERMISSAO.SUPERVISOR]: '👔',
  [NIVEIS_PERMISSAO.GERENTE_SETOR]: '📊',
  [NIVEIS_PERMISSAO.GERENTE_GERAL]: '🎯',
  [NIVEIS_PERMISSAO.RH]: '💼',
  [NIVEIS_PERMISSAO.CEO]: '🏆'
};

// 📄 Configuração de acesso às páginas do menu
export const PERMISSOES_PAGINAS = {
  'meu-perfil': {
    niveisPermitidos: [0, 1, 2, 3, 4, 5, 6], // Todos
    descricao: 'Perfil do usuário'
  },
  'ranking': {
    niveisPermitidos: [0, 1, 2, 3, 4, 5, 6], // Todos
    descricao: 'Ranking de pontuação'
  },
  'notificacoes': {
    niveisPermitidos: [0, 1, 2, 3, 4, 5, 6], // Todos
    descricao: 'Notificações'
  },
  'relatorios-erro': {
    niveisPermitidos: [0, 1, 2, 3, 4, 5, 6], // ✅ Todos (incluindo funcionário)
    descricao: 'Relatórios de erro'
  },
  'mensagens': {
    niveisPermitidos: [0, 1, 2, 3, 4, 5, 6], // Todos
    descricao: 'Sistema de mensagens'
  },
  'tarefas': {
    niveisPermitidos: [0, 1, 2, 3, 4, 5, 6], // Todos
    descricao: 'Tarefas semanais'
  },
  'escala': {
    niveisPermitidos: [0, 1, 2, 3, 4, 5, 6], // ✅ Todos (incluindo funcionário)
    descricao: 'Escala de trabalho'
  },
  'inventario': {
    niveisPermitidos: [0, 1, 2, 3, 4, 5, 6], // ✅ Todos (incluindo funcionário)
    descricao: 'Inventário'
  },
  'meu-inventario': {
    niveisPermitidos: [0, 1, 2, 3, 4, 5, 6], // Todos
    descricao: 'Meu inventário'
  },
  'emprestimos': {
    niveisPermitidos: [0, 1, 2, 3, 4, 5, 6], // ✅ Todos (incluindo funcionário)
    descricao: 'Empréstimos'
  },
  'funcionarios': {
    niveisPermitidos: [0, 1, 2, 3, 4, 5, 6], // ✅ Todos (incluindo funcionário)
    descricao: 'Gestão de funcionários'
  },
  'empresas-setores': {
    niveisPermitidos: [0, 1, 2, 3, 4, 5, 6], // ✅ Todos (incluindo funcionário)
    descricao: 'Empresas & Setores'
  },
  'backup-monitoring': {
    niveisPermitidos: [0, 1, 2, 3, 4, 5, 6], // ✅ Todos (incluindo funcionário)
    descricao: 'Backup & Monitoramento'
  },
  'password-reset-manager': {
    niveisPermitidos: [0, 1, 2, 3, 4, 5, 6], // ✅ Todos (incluindo funcionário)
    descricao: 'Códigos de Redefinição'
  },
  'feed-social': {
    niveisPermitidos: [0, 1, 2, 3, 4, 5, 6], // Todos
    descricao: 'Feed Social'
  }
};

// Função auxiliar para verificar se usuário tem permissão para acessar uma página
export const temPermissao = (nivelUsuario, paginaId) => {
  const pagina = PERMISSOES_PAGINAS[paginaId];
  if (!pagina) return false;
  return pagina.niveisPermitidos.includes(nivelUsuario);
};

// Função para obter label do nível
export const getLabelNivel = (nivel) => {
  return NIVEIS_LABELS[nivel] || 'Desconhecido';
};

// Função para obter ícone do nível
export const getIconeNivel = (nivel) => {
  return NIVEIS_ICONE[nivel] || '❓';
};

// ==================== FUNÇÕES AUXILIARES ====================

/**
 * Verifica se um nível é Administrador
 * SEMPRE use esta função ao invés de comparar com 0 diretamente
 */
export const isAdmin = (nivel) => {
  return nivel === NIVEIS_PERMISSAO.ADMIN; // 0
};

/**
 * Verifica se um nível tem permissões de alto nível
 * SISTEMA REVERSIVO: Níveis menores = Maior permissão
 * Admin (0), Funcionário (1), Supervisor (2) têm permissões altas
 */
export const hasHighLevelPermission = (nivel) => {
  return nivel <= NIVEIS_PERMISSAO.SUPERVISOR; // 0, 1, 2
};

/**
 * Verifica se um nível tem permissões de gerenciamento
 * SISTEMA REVERSIVO: Níveis menores = Maior permissão
 * Admin (0), Funcionário (1), Supervisor (2), Gerente Setor (3) têm permissões de gerenciamento
 */
export const hasManagementPermission = (nivel) => {
  return nivel <= NIVEIS_PERMISSAO.GERENTE_SETOR; // 0, 1, 2, 3
};

/**
 * Verifica se um nível tem permissões de supervisão
 * SISTEMA REVERSIVO: Níveis menores = Maior permissão
 * Admin (0), Funcionário (1), Supervisor (2) têm permissões de supervisão
 */
export const hasSupervisionPermission = (nivel) => {
  return nivel <= NIVEIS_PERMISSAO.SUPERVISOR; // 0, 1, 2
};

/**
 * Verifica se um nível é Funcionário básico
 */
export const isFuncionario = (nivel) => {
  return nivel === NIVEIS_PERMISSAO.FUNCIONARIO;
};/**
 * Compara níveis de permissão corretamente
 * Admin (0) é o nível MAIS ALTO, CEO (6) é o segundo mais alto
 * Retorna true se nivel1 tem permissão maior ou igual a nivel2
 */
export const nivelMaiorOuIgual = (nivel1, nivel2) => {
  // Admin sempre tem maior permissão
  if (nivel1 === NIVEIS_PERMISSAO.ADMIN) return true;
  if (nivel2 === NIVEIS_PERMISSAO.ADMIN) return false;
  
  // CEO e RH são iguais em hierarquia, mas maiores que os demais
  const hierarchy = {
    [NIVEIS_PERMISSAO.ADMIN]: 7,        // 0 = maior permissão
    [NIVEIS_PERMISSAO.CEO]: 6,          // 6
    [NIVEIS_PERMISSAO.RH]: 6,           // 5 (mesmo nível do CEO)
    [NIVEIS_PERMISSAO.GERENTE_GERAL]: 5, // 4
    [NIVEIS_PERMISSAO.GERENTE_SETOR]: 4, // 3
    [NIVEIS_PERMISSAO.SUPERVISOR]: 3,    // 2
    [NIVEIS_PERMISSAO.FUNCIONARIO]: 2    // 1
  };
  
  return hierarchy[nivel1] >= hierarchy[nivel2];
};

export const PermissionChecker = {
  // Verifica se o usuário pode visualizar funcionalidades básicas
  canView: (nivel) => {
    // Admin sempre pode visualizar tudo
    if (isAdminTotal(nivel)) return true;
    // Todos os outros usuários autenticados podem visualizar funcionalidades básicas
    return nivel !== undefined && nivel !== null;
  },

  // Verifica se o usuário pode editar outro usuário
  // SISTEMA REVERSIVO: Níveis menores = Maior permissão
  canEditUser: (nivelEditor, idEditor, idAlvo, nivelAlvo) => {
    // Admin pode editar qualquer um
    if (isAdmin(nivelEditor)) return true;
    
    // Usuário pode editar próprio perfil
    if (idEditor === idAlvo) return true;
    
    // Sistema reversivo: só pode editar usuários de nível MAIOR (menor permissão)
    // Ex: Supervisor (2) pode editar Gerente Setor (3), Gerente Geral (4), etc.
    if (nivelEditor < nivelAlvo) return true;
    
    return false;
  },

  // Verifica se o usuário pode gerenciar operações (inventário, empréstimos, etc)
  canManageOperational: (nivel) => {
    return hasSupervisionPermission(nivel);
  },

  // Verifica se o usuário pode gerenciar funcionários
  canManageEmployees: (nivel) => {
    return hasManagementPermission(nivel);
  },

  // Verifica se o usuário pode gerenciar usuários do sistema
  canManageUsers: (nivel) => {
    return isAdmin(nivel) || nivel <= NIVEIS_PERMISSAO.SUPERVISOR; // 0, 1, 2
  },

  // Verifica se o usuário pode excluir registros
  canDelete: (nivel) => {
    return hasManagementPermission(nivel);
  },

  // Verifica se o usuário pode ver informações sensíveis
  canViewSensitiveInfo: (nivel) => {
    return hasHighLevelPermission(nivel);
  },

  // Verifica se o usuário pode realizar operações administrativas
  canPerformAdminActions: (nivel) => {
    return isAdmin(nivel);
  },

  // ==================== PERMISSÕES POR SETOR ====================
  
  /**
   * Verifica se o usuário pode ver todos os dados ou apenas do seu setor
   * Admin, CEO, RH, Gerente Geral: Vê TUDO
   * Gerente Setor/Supervisor/Funcionário: Vê apenas do seu setor
   */
  canViewAllSectors: (nivel) => {
    return hasHighLevelPermission(nivel);
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
   * Admin, CEO, RH, Gerente Geral: Vê tudo
   * Gerente Setor/Supervisor/Funcionário: Vê apenas do seu setor
   */
  filterBySector: (items, usuario) => {
    // Admin, CEO, RH, Gerente Geral veem tudo
    if (PermissionChecker.canViewAllSectors(usuario.nivel)) {
      return items;
    }

    // Outros veem apenas do seu setor
    if (!usuario.setorId) {
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
   * Admin, CEO, RH, Gerente Geral: Pode gerenciar tudo
   * Gerente Setor/Supervisor: Pode gerenciar apenas itens do seu setor
   * Funcionário: Não pode gerenciar
   */
  canManageItem: (nivel, itemSetorId, userSetorId) => {
    // Admin, CEO, RH, Gerente Geral podem gerenciar tudo
    if (hasHighLevelPermission(nivel)) return true;

    // Funcionário não pode gerenciar
    if (isFuncionario(nivel)) return false;

    // Gerente Setor/Supervisor podem gerenciar apenas do seu setor
    if (hasSupervisionPermission(nivel)) {
      return itemSetorId === userSetorId;
    }

    return false;
  },

  /**
   * Verifica se um usuário pode criar itens em um determinado setor
   */
  canCreateInSector: (nivel, targetSetorId, userSetorId) => {
    // Admin, CEO, RH, Gerente Geral podem criar em qualquer setor
    if (hasHighLevelPermission(nivel)) return true;

    // Gerente Setor/Supervisor podem criar apenas no seu setor
    if (hasSupervisionPermission(nivel)) {
      return targetSetorId === userSetorId;
    }

    return false;
  }
};
