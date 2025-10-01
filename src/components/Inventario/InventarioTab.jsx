// InventarioTab.jsx - Substitua o conteúdo atual por este:

import React from 'react';
import NovoItem from './NovoItem';
import ListaInventario from './ListaInventario';
import { useAuth } from '../../hooks/useAuth';

const InventarioTab = ({
  inventario,
  emprestimos,
  adicionarItem,
  removerItem,
  atualizarItem,
  obterDetalhesEmprestimos
}) => {
  const { usuario } = useAuth();
  const isFuncionario = usuario?.nivel === 1; // NÍVEL 1 = FUNCIONÁRIO
  
  return (
    <div className="space-y-6 bg-[#15202B] text-gray-900 dark:text-white min-h-screen p-4">
      {!isFuncionario && (
        <NovoItem
          adicionarItem={adicionarItem}
        />
      )}
      <ListaInventario
        inventario={inventario}
        emprestimos={emprestimos}
        removerItem={removerItem}
        atualizarItem={atualizarItem}
        readonly={isFuncionario}
        obterDetalhesEmprestimos={obterDetalhesEmprestimos}
      />
    </div>
  );
};

export default InventarioTab;

