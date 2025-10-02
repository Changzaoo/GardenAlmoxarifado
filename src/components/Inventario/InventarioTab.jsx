// InventarioTab.jsx - Com filtro por setor

import React, { useMemo } from 'react';
import NovoItem from './NovoItem';
import ListaInventario from './ListaInventario';
import { useAuth } from '../../hooks/useAuth';
import { useSectorPermissions } from '../../hooks/useSectorPermissions';
import { Shield, Building2 } from 'lucide-react';

const InventarioTab = ({
  inventario,
  emprestimos,
  adicionarItem,
  removerItem,
  atualizarItem,
  obterDetalhesEmprestimos
}) => {
  const { usuario } = useAuth();
  const { 
    filterBySector, 
    canViewAllSectors, 
    userSetorNome, 
    getPermissionScope 
  } = useSectorPermissions();
  
  const isFuncionario = usuario?.nivel === 1; // NÍVEL 1 = FUNCIONÁRIO

  // Filtrar inventário por setor
  const inventarioFiltrado = useMemo(() => {
    return filterBySector(inventario);
  }, [inventario, filterBySector]);

  // Filtrar empréstimos por setor
  const emprestimosFiltrados = useMemo(() => {
    return filterBySector(emprestimos);
  }, [emprestimos, filterBySector]);
  
  return (
    <div className="space-y-6 bg-gray-50 dark:bg-[#15202B] text-gray-900 dark:text-white min-h-screen p-4">
      {/* Badge de informação de setor */}
      {!canViewAllSectors && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg px-4 py-3 flex items-center gap-3">
          <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
              {getPermissionScope()}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
              Você está visualizando apenas os itens do seu setor ({inventarioFiltrado.length} itens)
            </p>
          </div>
        </div>
      )}

      {canViewAllSectors && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg px-4 py-3 flex items-center gap-3">
          <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
          <div className="flex-1">
            <p className="text-sm font-medium text-green-800 dark:text-green-300">
              Modo Administrador - Visualizando todos os setores
            </p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
              Total de {inventarioFiltrado.length} itens em todos os setores
            </p>
          </div>
        </div>
      )}

      {!isFuncionario && (
        <NovoItem
          adicionarItem={adicionarItem}
          userSetorId={usuario?.setorId}
          userSetorNome={userSetorNome}
        />
      )}
      <ListaInventario
        inventario={inventarioFiltrado}
        emprestimos={emprestimosFiltrados}
        removerItem={removerItem}
        atualizarItem={atualizarItem}
        readonly={isFuncionario}
        obterDetalhesEmprestimos={obterDetalhesEmprestimos}
      />
    </div>
  );
};

export default InventarioTab;

