import { useMemo } from 'react';
import { useAuth } from './useAuth';
import { PermissionChecker } from '../constants/permissoes';

/**
 * Hook personalizado para gerenciar permissões por setor
 * Facilita o filtro e verificação de dados baseados no setor do usuário
 */
export const useSectorPermissions = () => {
  const { usuario } = useAuth();

  const permissions = useMemo(() => {
    if (!usuario) {
      return {
        canViewAllSectors: false,
        canManageCurrentSector: false,
        userSetorId: null,
        filterBySector: () => [],
        canManageItem: () => false,
        canCreateInSector: () => false,
      };
    }

    return {
      /**
       * Se o usuário pode ver todos os setores (Admin)
       */
      canViewAllSectors: PermissionChecker.canViewAllSectors(usuario.nivel),

      /**
       * Se o usuário pode gerenciar seu setor atual
       */
      canManageCurrentSector: usuario.nivel >= 2, // Supervisor ou superior

      /**
       * ID do setor do usuário
       */
      userSetorId: usuario.setorId,

      /**
       * Nome do setor do usuário
       */
      userSetorNome: usuario.setorNome,

      /**
       * Empresa do usuário
       */
      userEmpresaId: usuario.empresaId,
      userEmpresaNome: usuario.empresaNome,

      /**
       * Filtra uma lista de itens pelo setor do usuário
       * @param {Array} items - Lista de itens a filtrar
       * @returns {Array} - Lista filtrada
       */
      filterBySector: (items) => {
        if (!items || !Array.isArray(items)) return [];
        return PermissionChecker.filterBySector(items, usuario);
      },

      /**
       * Verifica se o usuário pode gerenciar um item específico
       * @param {string} itemSetorId - ID do setor do item
       * @returns {boolean}
       */
      canManageItem: (itemSetorId) => {
        return PermissionChecker.canManageItem(
          usuario.nivel,
          itemSetorId,
          usuario.setorId
        );
      },

      /**
       * Verifica se o usuário pode criar itens em um setor específico
       * @param {string} targetSetorId - ID do setor alvo
       * @returns {boolean}
       */
      canCreateInSector: (targetSetorId) => {
        return PermissionChecker.canCreateInSector(
          usuario.nivel,
          targetSetorId,
          usuario.setorId
        );
      },

      /**
       * Verifica se um item pertence ao setor do usuário
       * @param {string} itemSetorId - ID do setor do item
       * @returns {boolean}
       */
      itemBelongsToUserSector: (itemSetorId) => {
        return PermissionChecker.itemBelongsToUserSector(
          itemSetorId,
          usuario.setorId
        );
      },

      /**
       * Retorna uma mensagem descritiva da permissão do usuário
       */
      getPermissionScope: () => {
        if (PermissionChecker.canViewAllSectors(usuario.nivel)) {
          return 'Visualizando todos os setores';
        }
        return `Visualizando apenas: ${usuario.setorNome || 'Setor não definido'}`;
      },

      /**
       * Informações completas do usuário
       */
      usuario,
    };
  }, [usuario]);

  return permissions;
};

/**
 * Hook para filtrar dados de inventário por setor
 */
export const useInventoryBySector = (inventario) => {
  const { filterBySector, canViewAllSectors, userSetorNome } = useSectorPermissions();

  const filteredInventory = useMemo(() => {
    return filterBySector(inventario);
  }, [inventario, filterBySector]);

  return {
    inventario: filteredInventory,
    totalItems: filteredInventory.length,
    canViewAll: canViewAllSectors,
    sectorName: userSetorNome,
  };
};

/**
 * Hook para filtrar funcionários por setor
 */
export const useEmployeesBySector = (funcionarios) => {
  const { filterBySector, canViewAllSectors, userSetorNome } = useSectorPermissions();

  const filteredEmployees = useMemo(() => {
    return filterBySector(funcionarios);
  }, [funcionarios, filterBySector]);

  return {
    funcionarios: filteredEmployees,
    totalEmployees: filteredEmployees.length,
    canViewAll: canViewAllSectors,
    sectorName: userSetorNome,
  };
};

/**
 * Hook para filtrar empréstimos por setor
 */
export const useLoansBySector = (emprestimos) => {
  const { filterBySector, canViewAllSectors, userSetorNome } = useSectorPermissions();

  const filteredLoans = useMemo(() => {
    return filterBySector(emprestimos);
  }, [emprestimos, filterBySector]);

  return {
    emprestimos: filteredLoans,
    totalLoans: filteredLoans.length,
    canViewAll: canViewAllSectors,
    sectorName: userSetorNome,
  };
};

/**
 * Hook para filtrar tarefas por setor
 */
export const useTasksBySector = (tarefas) => {
  const { filterBySector, canViewAllSectors, userSetorNome } = useSectorPermissions();

  const filteredTasks = useMemo(() => {
    return filterBySector(tarefas);
  }, [tarefas, filterBySector]);

  return {
    tarefas: filteredTasks,
    totalTasks: filteredTasks.length,
    canViewAll: canViewAllSectors,
    sectorName: userSetorNome,
  };
};
