import React from 'react';
import NovoItem from './NovoItem';
import ListaInventario from './ListaInventario';

const InventarioTab = ({
  inventario,
  emprestimos,
  adicionarItem,
  removerItem
}) => {
  return (
    <div className="space-y-6">
      <NovoItem 
        adicionarItem={adicionarItem}
      />
      
      <ListaInventario
        inventario={inventario}
        emprestimos={emprestimos}
        removerItem={removerItem}
      />
    </div>
  );
};

export default InventarioTab;