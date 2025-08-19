import React from 'react';
import { AuthProvider } from '../../hooks/useAuth';
import FerramentasDanificadasTab from './FerramentasDanificadasTab';

// Exemplo de props fictícios para visualização isolada
const mockProps = {
  ferramentasDanificadas: [],
  inventario: [],
  adicionarFerramentaDanificada: () => {},
  atualizarFerramentaDanificada: () => {},
  removerFerramentaDanificada: () => {},
  readonly: true
};

const StandaloneFerramentasDanificadas = () => (
  <AuthProvider>
    <FerramentasDanificadasTab {...mockProps} />
  </AuthProvider>
);

export default StandaloneFerramentasDanificadas;
