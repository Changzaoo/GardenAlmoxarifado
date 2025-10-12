import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const PrivateRoute = ({ children, requiredLevel }) => {
  const { usuario } = useAuth();
  const userLevel = parseInt(usuario?.nivel) || 1;

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  // Se não houver nível requerido, apenas verifica se está autenticado
  if (!requiredLevel) {
    return children;
  }

  // Verifica se o usuário tem o nível necessário
  if (userLevel < requiredLevel) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default PrivateRoute;
