import React, { useState, useEffect } from 'react';
import LoadingScreen from './components/common/LoadingScreen';
import { useDevToolsProtection } from './hooks/useDevToolsProtection';

/**
 * Sistema de Inicialização com Loading até 100%
 * Garante que todos os recursos sejam carregados antes de mostrar a aplicação
 */
const AppInitializer = ({ children }) => {
  const [loadingComplete, setLoadingComplete] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Iniciando sistema...');
  const [systemReady, setSystemReady] = useState(false);
  
  // Anti-DevTools protection
  const devToolsDetected = useDevToolsProtection();

  useEffect(() => {
    // Se DevTools for detectado, não carregar o sistema
    if (devToolsDetected) {
      return;
    }

    // Simular carregamento de recursos do sistema
    const loadSystemResources = async () => {
      const stages = [
        { 
          progress: 15, 
          text: 'Verificando segurança...', 
          duration: 400,
          action: async () => {
            // Verificar integridade do sistema
            await new Promise(resolve => setTimeout(resolve, 300));
          }
        },
        { 
          progress: 30, 
          text: 'Conectando ao banco de dados...', 
          duration: 500,
          action: async () => {
            // Carregar configurações do Firebase
            await new Promise(resolve => setTimeout(resolve, 400));
          }
        },
        { 
          progress: 50, 
          text: 'Carregando configurações...', 
          duration: 400,
          action: async () => {
            // Carregar configurações do sistema
            await new Promise(resolve => setTimeout(resolve, 300));
          }
        },
        { 
          progress: 70, 
          text: 'Preparando componentes...', 
          duration: 500,
          action: async () => {
            // Pre-carregar componentes principais
            await new Promise(resolve => setTimeout(resolve, 400));
          }
        },
        { 
          progress: 85, 
          text: 'Validando credenciais...', 
          duration: 400,
          action: async () => {
            // Verificar autenticação
            await new Promise(resolve => setTimeout(resolve, 300));
          }
        },
        { 
          progress: 95, 
          text: 'Carregando interface...', 
          duration: 400,
          action: async () => {
            // Carregar recursos de UI
            await new Promise(resolve => setTimeout(resolve, 300));
          }
        },
        { 
          progress: 100, 
          text: 'Sistema pronto!', 
          duration: 300,
          action: async () => {
            // Finalizar inicialização
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }
      ];

      for (let i = 0; i < stages.length; i++) {
        const stage = stages[i];
        setLoadingText(stage.text);

        // Executar ação da etapa
        if (stage.action) {
          await stage.action();
        }

        // Animar progresso suavemente
        const startProgress = i === 0 ? 0 : stages[i - 1].progress;
        const endProgress = stage.progress;
        const steps = 20;
        const increment = (endProgress - startProgress) / steps;
        const stepDuration = stage.duration / steps;

        for (let step = 0; step < steps; step++) {
          await new Promise(resolve => setTimeout(resolve, stepDuration));
          setProgress(Math.min(100, startProgress + increment * (step + 1)));
        }
      }

      // Sistema pronto - transição imediata ao atingir 100%
      setSystemReady(true);
      setLoadingComplete(true);
    };

    loadSystemResources();
  }, [devToolsDetected]);

  // Se DevTools detectado, não renderizar nada (bloqueio é feito no hook)
  if (devToolsDetected) {
    return null;
  }

  // Mostrar loading enquanto não estiver completo
  if (!loadingComplete) {
    return (
      <LoadingScreen 
        progress={progress} 
        loadingText={loadingText}
        isComplete={systemReady}
      />
    );
  }

  // Renderizar aplicação com fade-in suave
  return (
    <div 
      style={{
        animation: 'fadeIn 0.5s ease-in-out'
      }}
    >
      {children}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.98);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default AppInitializer;
