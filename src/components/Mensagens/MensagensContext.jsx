import React, { createContext, useContext, useState, useEffect } from 'react';
import { useMensagens } from '../../hooks/useMensagens';

/**
 * Context para gerenciar estado global de mensagens
 */
const MensagensContext = createContext({
  totalNaoLidas: 0
});

export const MensagensProvider = ({ children }) => {
  const { totalNaoLidas } = useMensagens();

  return (
    <MensagensContext.Provider value={{ totalNaoLidas }}>
      {children}
    </MensagensContext.Provider>
  );
};

export const useMensagensContext = () => {
  return useContext(MensagensContext);
};

/**
 * Componente Badge para mostrar contador de mensagens não lidas
 */
export const MensagensBadge = ({ children, className = '' }) => {
  const { totalNaoLidas } = useMensagensContext();

  return (
    <div className={`relative ${className}`}>
      {children}
      {totalNaoLidas > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
          {totalNaoLidas > 99 ? '99+' : totalNaoLidas}
        </span>
      )}
    </div>
  );
};
