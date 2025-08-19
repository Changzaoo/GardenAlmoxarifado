import React from 'react';
import { AuthProvider } from '../../hooks/useAuth';
import InventarioTab from './InventarioTab';

const mockProps = {
  inventario: [],
  emprestimos: [],
  adicionarItem: () => {},
  removerItem: () => {},
  atualizarItem: () => {},
  reimportarInventario: () => {},
  corrigirInventario: () => {},
  readonly: true
};

const StandaloneInventarioTab = () => (
  <AuthProvider>
    <InventarioTab {...mockProps} />
  </AuthProvider>
);

export default StandaloneInventarioTab;
