import React from 'react';
import { AuthProvider } from '../../hooks/useAuth';
import EmprestimosTab from './EmprestimosTab';

const mockProps = {
  emprestimos: [],
  inventario: [],
  funcionarios: [],
  adicionarEmprestimo: () => {},
  removerEmprestimo: () => {},
  atualizarEmprestimo: () => {},
  devolverFerramentas: () => {},
  readonly: true
};

const StandaloneEmprestimosTab = () => (
  <AuthProvider>
    <EmprestimosTab {...mockProps} />
  </AuthProvider>
);

export default StandaloneEmprestimosTab;
