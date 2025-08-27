import React from 'react';
import { useAuth } from '../hooks/useAuth';
import LoadingScreen from './common/LoadingScreen';
import AlmoxarifadoSistema from './AlmoxarifadoSistema';
import LoginFormContainer from './Auth/LoginFormContainer';

const AlmoxarifadoSistemaWrapper = () => {
  const { usuario, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return usuario ? <AlmoxarifadoSistema /> : <LoginFormContainer />;
};

export default AlmoxarifadoSistemaWrapper;
