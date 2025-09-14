import { useEffect } from 'react';
import { SECURITY_CONFIG, obscure } from '../config/security';

export const useDevToolsProtection = () => {
  useEffect(() => {
    if (!SECURITY_CONFIG.devTools.enabled) return;

    // Esconder console.log e outros métodos
    const originalConsole = { ...console };
    if (SECURITY_CONFIG.devTools.preventConsole) {
      const noop = () => undefined;
      Object.keys(console).forEach(key => {
        try {
          console[key] = noop;
        } catch {}
      });
    }

    // Ofuscar mensagens de erro
    window.addEventListener('error', (event) => {
      if (event.error && event.error.stack) {
        event.error.stack = obscure(event.error.stack);
      }
      if (event.message) {
        event.message = obscure(event.message);
      }
    });

    // Prevenir inspeção de elementos
    if (SECURITY_CONFIG.devTools.preventInspect) {
      document.addEventListener('contextmenu', (e) => e.preventDefault());
      document.addEventListener('keydown', (e) => {
        if (
          (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
          (e.ctrlKey && e.key === 'U') ||
          e.key === 'F12'
        ) {
          e.preventDefault();
        }
      });
    }

    // Detectar e reagir a mudanças no tamanho da janela (DevTools)
    let windowSize = {
      width: window.outerWidth - window.innerWidth,
      height: window.outerHeight - window.innerHeight,
    };

    const checkDevTools = () => {
      const widthThreshold = window.outerWidth - window.innerWidth > 160;
      const heightThreshold = window.outerHeight - window.innerHeight > 160;
      
      if (widthThreshold || heightThreshold) {
        // Ofuscar todo o HTML se o DevTools for aberto
        document.body.innerHTML = obscure(document.body.innerHTML);
        if (SECURITY_CONFIG.devTools.reloadOnDetection) {
          window.location.reload();
        }
      }
    };

    const interval = setInterval(checkDevTools, 1000);

    // Tentar prevenir debugging
    setInterval(() => {
      const startTime = performance.now();
      debugger;
      const endTime = performance.now();
      
      if (endTime - startTime > 100) {
        // Debugger detectado
        window.location.reload();
      }
    }, 1000);

    // Ofuscar nomes de funções e variáveis
    const ofuscateFunction = (fn) => {
      try {
        const ofuscatedName = '_' + Math.random().toString(36).slice(2);
        Object.defineProperty(fn, 'name', { value: ofuscatedName });
        return fn;
      } catch {
        return fn;
      }
    };

    // Aplicar em funções globais comuns
    ['fetch', 'setTimeout', 'setInterval'].forEach(fnName => {
      try {
        window[fnName] = ofuscateFunction(window[fnName]);
      } catch {}
    });

    return () => {
      clearInterval(interval);
      if (SECURITY_CONFIG.devTools.preventConsole) {
        Object.keys(originalConsole).forEach(key => {
          try {
            console[key] = originalConsole[key];
          } catch {}
        });
      }
    };
  }, []);
};