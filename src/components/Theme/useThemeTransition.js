import { useState, useCallback } from 'react';
import ThemeTransition from './ThemeTransition';

// Hook personalizado para gerenciar transições de tema
export const useThemeTransition = () => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionType, setTransitionType] = useState('tv-off');

  const startTransition = useCallback((currentTheme, onThemeChange) => {
    // Determinar tipo de transição baseado no tema atual
    const newTransitionType = currentTheme === 'light' ? 'flashlight' : 'tv-off';
    
    setTransitionType(newTransitionType);
    setIsTransitioning(true);
    
    // Executar mudança de tema após um breve delay para permitir que a animação comece
    setTimeout(() => {
      onThemeChange();
    }, 200);
  }, []);

  const completeTransition = useCallback(() => {
    setIsTransitioning(false);
  }, []);

  return {
    isTransitioning,
    transitionType,
    startTransition,
    completeTransition
  };
};

// Componente wrapper para adicionar transições a qualquer botão de tema
export const withThemeTransition = (WrappedComponent) => {
  return (props) => {
    const {
      isTransitioning,
      transitionType,
      startTransition,
      completeTransition
    } = useThemeTransition();

    return (
      <>
        <ThemeTransition
          isTransitioning={isTransitioning}
          transitionType={transitionType}
          onTransitionComplete={completeTransition}
        />
        <WrappedComponent
          {...props}
          isTransitioning={isTransitioning}
          startTransition={startTransition}
        />
      </>
    );
  };
};