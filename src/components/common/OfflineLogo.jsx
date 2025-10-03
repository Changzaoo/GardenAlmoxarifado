import React from 'react';
import { useOffline } from '../../hooks/useOffline';

/**
 * Componente wrapper para logos que mudam de cor quando offline
 * Aplica filtro vermelho quando não há conexão
 */
const OfflineLogo = ({ 
  src, 
  alt = "Logo", 
  className = "",
  style = {},
  ...props 
}) => {
  const { isOnline } = useOffline();

  // Filtro CSS para tornar o logo vermelho quando offline
  const offlineFilter = {
    filter: isOnline 
      ? 'none' 
      : 'brightness(0.4) sepia(1) hue-rotate(-50deg) saturate(6)',
    transition: 'filter 0.3s ease-in-out'
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
