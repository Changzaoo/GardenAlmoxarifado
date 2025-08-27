import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { NIVEIS_PERMISSAO } from '../constants/permissoes';

// Importação dos componentes das páginas
import AlmoxarifadoJardim from './AlmoxarifadoJardim';
import FuncionariosTab from './Funcionarios/FuncionariosTab';
import ComprasTab from './Compras/ComprasTab';
import InventarioTab from './Inventario/InventarioTab';
import EmprestimosTab from './Emprestimos/EmprestimosTab';
import HistoricoEmprestimosTab from './Emprestimos/HistoricoEmprestimosTab';
import FerramentasDanificadasTab from './Danificadas/FerramentasDanificadasTab';
import TarefasTab from './Tarefas/TarefasTab';

// Componente para proteger rotas baseado no nível de acesso
const PrivateRoute = ({ children, requiredLevel }) => {
  const { usuario } = useAuth();

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  if (usuario.nivel < requiredLevel) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={
        <PrivateRoute requiredLevel={NIVEIS_PERMISSAO.FUNCIONARIO}>
          <AlmoxarifadoJardim />
        </PrivateRoute>
      } />
      
      <Route path="/funcionarios" element={
        <PrivateRoute requiredLevel={NIVEIS_PERMISSAO.SUPERVISOR}>
          <FuncionariosTab />
        </PrivateRoute>
      } />
      
      <Route path="/compras" element={
        <PrivateRoute requiredLevel={NIVEIS_PERMISSAO.SUPERVISOR}>
          <ComprasTab />
        </PrivateRoute>
      } />
      
      <Route path="/inventario" element={
        <PrivateRoute requiredLevel={NIVEIS_PERMISSAO.FUNCIONARIO}>
          <InventarioTab />
        </PrivateRoute>
      } />
      
      <Route path="/emprestimos" element={
        <PrivateRoute requiredLevel={NIVEIS_PERMISSAO.FUNCIONARIO}>
          <EmprestimosTab />
        </PrivateRoute>
      } />
      
      <Route path="/danificadas" element={
        <PrivateRoute requiredLevel={NIVEIS_PERMISSAO.FUNCIONARIO}>
          <FerramentasDanificadasTab />
        </PrivateRoute>
      } />
      
      <Route path="/tarefas" element={
        <PrivateRoute requiredLevel={NIVEIS_PERMISSAO.FUNCIONARIO}>
          <TarefasTab />
        </PrivateRoute>
      } />

      <Route path="/historico-emprestimos" element={
        <PrivateRoute requiredLevel={NIVEIS_PERMISSAO.FUNCIONARIO}>
          <HistoricoEmprestimosTab />
        </PrivateRoute>
      } />

      {/* Rota de fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
