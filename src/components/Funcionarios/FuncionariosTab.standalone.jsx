import React from 'react';
import { AuthProvider } from '../../hooks/useAuth';
import FuncionariosTab from './FuncionariosTab';

const mockProps = {
  funcionarios: [],
  adicionarFuncionario: () => {},
  removerFuncionario: () => {},
  atualizarFuncionario: () => {},
  readonly: true
};

const StandaloneFuncionariosTab = () => (
  <AuthProvider>
    <FuncionariosTab {...mockProps} />
  </AuthProvider>
);

export default StandaloneFuncionariosTab;
