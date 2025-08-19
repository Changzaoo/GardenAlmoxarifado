import React from 'react';
import { AuthProvider } from '../../hooks/useAuth';
import FerramentasPerdidasTab from './FerramentasPerdidasTab';

const mockProps = {
  ferramentasPerdidas: [],
  inventario: [],
  adicionarFerramentaPerdida: () => {},
  atualizarFerramentaPerdida: () => {},
  removerFerramentaPerdida: () => {},
  readonly: true
};

const StandaloneFerramentasPerdidasTab = () => (
  <AuthProvider>
    <FerramentasPerdidasTab {...mockProps} />
  </AuthProvider>
);

export default StandaloneFerramentasPerdidasTab;
