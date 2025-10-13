/**
 * Componente de Logo com indicador offline (vermelho quando sem conexão)
 * Substitui logos existentes no app com indicação visual de status
 */

import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

const LogoWithOfflineIndicator = ({ 
  src, 
  alt = "Logo", 
  className = "",
  width,
  height,
  style = {}
}) => {
  const { isOnline } = useOnlineStatus();

  // Estilo de filtro para logo vermelho quando offline
  const offlineStyle = !isOnline ? {
    filter: 'brightness(0) saturate(100%) invert(24%) sepia(95%) saturate(5000%) hue-rotate(355deg) brightness(95%) contrast(105%)',
    opacity: 0.9,
    ...style
  } : style;

  return (
    <div className="relative inline-block">
      <img
        src={src}
        alt={alt}
        className={className}
        width={width}
        height={height}
        style={offlineStyle}
      />
      
      {/* Indicador visual adicional quando offline */}
      {!isOnline && (
        <div 
          className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full border-2 border-white animate-pulse"
          title="Modo Offline"
        />
      )}
    </div>
  );
};

export default LogoWithOfflineIndicator;
