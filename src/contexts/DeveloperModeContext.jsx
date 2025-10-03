import React, { createContext, useContext, useState, useEffect } from 'react';

/**
 * Contexto para gerenciar o modo desenvolvedor
 * Ativado por long-press (0.5s) no botão de página favorita
 */
const DeveloperModeContext = createContext();

export const useDeveloperMode = () => {
  const context = useContext(DeveloperModeContext);
  if (!context) {
    throw new Error('useDeveloperMode deve ser usado dentro de DeveloperModeProvider');
  }
  return context;
};

export const DeveloperModeProvider = ({ children }) => {
  const [isDeveloperMode, setIsDeveloperMode] = useState(false);
  const [devStats, setDevStats] = useState({
    activatedAt: null,
    sessionDuration: 0,
    actionsPerformed: 0
  });

  // Carregar estado do localStorage
  useEffect(() => {
    const savedMode = localStorage.getItem('workflow-developer-mode');
    if (savedMode === 'enabled') {
      setIsDeveloperMode(true);
      const activatedAt = localStorage.getItem('workflow-dev-activated-at');
      setDevStats(prev => ({
        ...prev,
        activatedAt: activatedAt ? new Date(activatedAt) : new Date()
      }));
    }
  }, []);

  // Salvar estado no localStorage
  useEffect(() => {
    if (isDeveloperMode) {
      localStorage.setItem('workflow-developer-mode', 'enabled');
      if (!devStats.activatedAt) {
        const now = new Date();
        localStorage.setItem('workflow-dev-activated-at', now.toISOString());
        setDevStats(prev => ({ ...prev, activatedAt: now }));
      }
    } else {
      localStorage.removeItem('workflow-developer-mode');
      localStorage.removeItem('workflow-dev-activated-at');
    }
  }, [isDeveloperMode, devStats.activatedAt]);

  // Contador de duração da sessão
  useEffect(() => {
    if (isDeveloperMode && devStats.activatedAt) {
      const interval = setInterval(() => {
        const duration = Math.floor((Date.now() - devStats.activatedAt.getTime()) / 1000);
        setDevStats(prev => ({ ...prev, sessionDuration: duration }));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isDeveloperMode, devStats.activatedAt]);

  const enableDeveloperMode = () => {
    console.log('🔓 Modo Desenvolvedor ATIVADO');
    setIsDeveloperMode(true);
    setDevStats({
      activatedAt: new Date(),
      sessionDuration: 0,
      actionsPerformed: 0
    });
  };

  const disableDeveloperMode = () => {
    console.log('🔒 Modo Desenvolvedor DESATIVADO');
    setIsDeveloperMode(false);
    setDevStats({
      activatedAt: null,
      sessionDuration: 0,
      actionsPerformed: 0
    });
  };

  const toggleDeveloperMode = () => {
    if (isDeveloperMode) {
      disableDeveloperMode();
    } else {
      enableDeveloperMode();
    }
  };

  const incrementAction = () => {
    setDevStats(prev => ({
      ...prev,
      actionsPerformed: prev.actionsPerformed + 1
    }));
  };

  const value = {
    isDeveloperMode,
    devStats,
    enableDeveloperMode,
    disableDeveloperMode,
    toggleDeveloperMode,
    incrementAction
  };

  return (
    <DeveloperModeContext.Provider value={value}>
      {children}
    </DeveloperModeContext.Provider>
  );
};

export default DeveloperModeContext;
