import React from 'react';

// Exportações principais do sistema de transições de tema
export { default as ThemeTransition } from './ThemeTransition';
export { default as ThemeTransitionDemo } from './ThemeTransitionDemo';
export { useThemeTransition, withThemeTransition } from './useThemeTransition';

// Re-exportar componentes de tema existentes com transições integradas
export { default as ThemeToggle, ThemeSwitch } from './ThemeToggle';

// Tipos de transição disponíveis
export const TRANSITION_TYPES = {
  TV_OFF: 'tv-off',        // Ideal para dark → light
  FLASHLIGHT: 'flashlight' // Ideal para light → dark
};

// Configurações de duração para diferentes dispositivos
export const TRANSITION_DURATIONS = {
  DESKTOP: 1400,
  TABLET: 1200,
  MOBILE: 1000,
  REDUCED_MOTION: 300
};

// Utility function para detectar o tipo de transição baseado no tema
export const getTransitionType = (currentTheme) => {
  return currentTheme === 'light' ? TRANSITION_TYPES.FLASHLIGHT : TRANSITION_TYPES.TV_OFF;
};

// Utility function para detectar se deve usar animação reduzida
export const shouldUseReducedMotion = () => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// Utility function para detectar tipo de dispositivo
export const getDeviceType = () => {
  const width = window.innerWidth;
  if (width <= 480) return 'mobile';
  if (width <= 1024) return 'tablet';
  return 'desktop';
};

// Hook para detectar características do dispositivo
export const useDeviceCapabilities = () => {
  const [capabilities, setCapabilities] = React.useState({
    deviceType: getDeviceType(),
    reducedMotion: shouldUseReducedMotion(),
    duration: TRANSITION_DURATIONS.DESKTOP
  });

  React.useEffect(() => {
    const updateCapabilities = () => {
      const deviceType = getDeviceType();
      const reducedMotion = shouldUseReducedMotion();
      
      let duration = TRANSITION_DURATIONS.DESKTOP;
      if (reducedMotion) {
        duration = TRANSITION_DURATIONS.REDUCED_MOTION;
      } else if (deviceType === 'mobile') {
        duration = TRANSITION_DURATIONS.MOBILE;
      } else if (deviceType === 'tablet') {
        duration = TRANSITION_DURATIONS.TABLET;
      }

      setCapabilities({
        deviceType,
        reducedMotion,
        duration
      });
    };

    updateCapabilities();
    
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    mediaQuery.addEventListener('change', updateCapabilities);
    window.addEventListener('resize', updateCapabilities);

    return () => {
      mediaQuery.removeEventListener('change', updateCapabilities);
      window.removeEventListener('resize', updateCapabilities);
    };
  }, []);

  return capabilities;
};