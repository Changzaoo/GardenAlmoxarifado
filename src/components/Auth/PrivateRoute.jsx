import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const PrivateRoute = ({ children }) => {
  const { usuario } = useAuth();

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default PrivateRoute;
