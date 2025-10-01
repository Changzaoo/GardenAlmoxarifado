import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { NIVEIS_PERMISSAO } from '../constants/permissoes';
import { RouteStateManager } from './RouteStateManager';

// Importação dos componentes das páginas
import Seed from './Seed';
import AlmoxarifadoJardim from './Seed';  // Assuming this is the correct import
import FuncionariosTab from './Funcionarios/FuncionariosTab';
import ComprasTab from './Compras/ComprasTab';
import InventarioTab from './Inventario/InventarioTab';
import EmprestimosTab from './Emprestimos/EmprestimosTab';
import HistoricoPage from '../pages/HistoricoPage';
import FerramentasDanificadasTab from './Danificadas/FerramentasDanificadasTab';
import RankingPontos from './Rankings/RankingPontos';
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

// Componente para restaurar a última rota
const RestoreLastRoute = () => {
  const navigate = useNavigate();
  const { usuario } = useAuth();

  useEffect(() => {
    // Se o usuário estiver logado, tenta restaurar a última rota
    if (usuario) {
      const lastRoute = localStorage.getItem('lastRoute');
      const lastRouteState = localStorage.getItem('lastRouteState');
      
      if (lastRoute && lastRoute !== '/login') {
        const state = lastRouteState ? JSON.parse(lastRouteState) : {};
        navigate(lastRoute, { 
          state: state.state,
          replace: true 
        });
      }
    }
  }, [usuario, navigate]);

  return null;
};

const AppRoutes = () => {
  return (
    <>
      <RouteStateManager />
      <RestoreLastRoute />
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
        <Route path="/historico-emprestimos" element={
          <PrivateRoute requiredLevel={NIVEIS_PERMISSAO.FUNCIONARIO}>
            <HistoricoPage />
          </PrivateRoute>
        } />
        <Route path="/ranking" element={
          <PrivateRoute requiredLevel={NIVEIS_PERMISSAO.FUNCIONARIO}>
            <RankingPontos />
          </PrivateRoute>
        } />
        {/* Rota de fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

export default AppRoutes;
