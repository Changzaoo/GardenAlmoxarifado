import { useState, useEffect } from 'react';

export const useIsMobile = () => {
  // ✅ CORREÇÃO: Detectar sincronicamente no momento da inicialização
  // Evita flash de desktop em dispositivos mobile
  const [isMobile, setIsMobile] = useState(() => {
    // Verificação durante inicialização (síncrona)
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768;
    }
    return false; // SSR fallback
  });

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Não precisa checar inicialmente (já foi feito no useState)
    // Apenas adicionar listener para mudanças de tamanho da tela
    window.addEventListener('resize', checkIsMobile);

    // Cleanup
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return isMobile;
};
