import React from 'react';
import { useOffline } from '../../hooks/useOffline';

/**
 * Componente wrapper para logos que mudam de cor quando offline
 * Aplica filtro vermelho intenso quando não há conexão
 */
const OfflineLogo = ({ 
  src, 
  alt = "Logo", 
  className = "",
  style = {},
  ...props 
}) => {
  const { isOnline } = useOffline();

  // Filtro CSS para tornar o logo VERMELHO INTENSO quando offline
  const offlineFilter = {
    filter: isOnline 
      ? 'none' 
      : 'brightness(0.5) sepia(1) hue-rotate(-10deg) saturate(8) contrast(1.2)',
    transition: 'filter 0.3s ease-in-out',
    // Adicionar leve sombra vermelha quando offline para aumentar o efeito
    ...(isOnline ? {} : {
      boxShadow: '0 0 10px rgba(255, 0, 0, 0.5)',
      borderRadius: '8px'
    })
  };

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={{
        ...style,
        ...offlineFilter
      }}
      {...props}
    />
  );
};

export default OfflineLogo;
