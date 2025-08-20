import React from 'react';
import { useTheme } from '../AlmoxarifadoJardim';
import NovoItem from './NovoItem';
import ListaInventario from './ListaInventario';
import { useAuth } from '../../hooks/useAuth';

const InventarioTab = ({ inventario, emprestimos, adicionarItem, removerItem }) => {
  const { usuario } = useAuth();
  const { classes } = useTheme();
  const isFuncionario = usuario?.nivel === 1;
  return (
    <div className={`space-y-6 ${classes.backgroundPrimary}`}> 
      {!isFuncionario && (
        <NovoItem adicionarItem={adicionarItem} />
      )}
      <ListaInventario
        inventario={inventario}
        emprestimos={emprestimos}
        removerItem={removerItem}
        readonly={isFuncionario}
      />
    </div>
  );
};

export default InventarioTab;
