import { useEffect, useState } from 'react';
import { SECURITY_CONFIG, obscure } from '../config/security';

/**
 * 🔒 Sistema Anti-DevTools Ultra Robusto
 * Bloqueia COMPLETAMENTE o carregamento do sistema se DevTools (F12) for detectado
 * Detecta abertura do console em TEMPO REAL e impede acesso imediato
 */
export const useDevToolsProtection = () => {
  const [devToolsDetected, setDevToolsDetected] = useState(false);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    // 🍎 Detectar se está no iOS (deve ser declarado primeiro)
    const isIOSDevice = () => {
      return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
             (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    };

    // 🚨 Verificação INICIAL antes de carregar qualquer coisa
    const initialCheck = () => {
      // 🍎 Pular verificação inicial no iOS
      if (isIOSDevice()) {
        return false;
      }
      
      const isDevToolsOpen = 
        window.outerWidth - window.innerWidth > 160 ||
        window.outerHeight - window.innerHeight > 160;
      
      if (isDevToolsOpen) {
        blockApplication('DevTools detectado ao iniciar');
        return true;
      }
      return false;
    };

    // Se DevTools já está aberto, bloquear IMEDIATAMENTE
    if (initialCheck()) {
      return;
    }

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

    // ==================== MÉTODOS DE DETECÇÃO DE DEVTOOLS ====================

    // 🍎 Detectar se está rodando no iOS
    const isIOS = () => {
      return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
             (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    };

    // 🍎 Detectar se está rodando no Safari do iOS
    const isIOSSafari = () => {
      const ua = navigator.userAgent;
      const iOS = /iPad|iPhone|iPod/.test(ua);
      const webkit = /WebKit/.test(ua);
      const notChrome = !/CriOS/.test(ua);
      return iOS && webkit && notChrome;
    };

    // Método 1: Detecção por tamanho de janela (DESABILITADO NO iOS)
    const checkWindowSize = () => {
      // 🍎 Desabilitar no iOS - Safari faz zoom que altera dimensões da janela
      if (isIOS() || isIOSSafari()) {
        return false;
      }
      
      const widthThreshold = window.outerWidth - window.innerWidth > 300;
      const heightThreshold = window.outerHeight - window.innerHeight > 300;
      return widthThreshold || heightThreshold;
    };

    // Método 2: Detecção por console.log timing
    const checkConsoleOpen = () => {
      const start = performance.now();
      // eslint-disable-next-line no-console
      console.profile('devtools');
      // eslint-disable-next-line no-console
      console.profileEnd('devtools');
      const end = performance.now();
      return end - start > 100;
    };

    // Método 3: Detecção por debugger timing
    const checkDebugger = () => {
      const start = performance.now();
      // eslint-disable-next-line no-debugger
      debugger;
      const end = performance.now();
      return end - start > 100;
    };

    // Método 4: Detecção por toString override
    let devToolsOpen = false;
    const element = new Image();
    Object.defineProperty(element, 'id', {
      get: function() {
        devToolsOpen = true;
        return 'devtools-detector';
      }
    });

    // Método 5: Detecção por firebug
    const checkFirebug = () => {
      return window.Firebug && window.Firebug.chrome && window.Firebug.chrome.isInitialized;
    };

    // Método 6: Detecção por diferença de innerHeight/outerHeight (DESABILITADO NO iOS)
    const checkHeightDifference = () => {
      // 🍎 Desabilitar no iOS - Safari faz zoom que altera dimensões
      if (isIOS() || isIOSSafari()) {
        return false;
      }
      
      const threshold = 300;
      return window.outerHeight - window.innerHeight > threshold || 
             window.outerWidth - window.innerWidth > threshold;
    };

    // Função principal de detecção (combina todos os métodos)
    const detectDevTools = () => {
      // Tentar múltiplos métodos de detecção (métodos mais confiáveis)
      const method1 = checkWindowSize();
      const method2 = checkHeightDifference();
      const method3 = devToolsOpen;
      const method4 = checkFirebug();

      // Requer MÚLTIPLAS detecções para evitar falsos positivos
      const detectionCount = [method1, method2, method3, method4].filter(Boolean).length;
      
      // Só bloqueia se 2 ou mais métodos detectarem
      if (detectionCount >= 2) {
        return true;
      }

      // Trigger para método 4 (toString)
      requestAnimationFrame(() => {
        console.log('%c', element);
      });

      return false;
    };

    // Função de bloqueio total do sistema
    const blockSystem = () => {
      console.log('🚨 DevTools detectado - Sistema bloqueado');
      setDevToolsDetected(true);

      // Limpar todo o conteúdo da página
      document.body.innerHTML = '';

      // Criar tela de bloqueio
      const blockScreen = document.createElement('div');
      blockScreen.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      `;

      blockScreen.innerHTML = `
        <div style="text-align: center; color: white; max-width: 600px; padding: 40px;">
          <div style="font-size: 80px; margin-bottom: 20px;">🛡️</div>
          <h1 style="font-size: 32px; margin-bottom: 20px; color: #ef4444;">Acesso Bloqueado</h1>
          <p style="font-size: 18px; color: #cbd5e1; margin-bottom: 30px;">
            Ferramentas de desenvolvedor foram detectadas.
          </p>
          <p style="font-size: 14px; color: #94a3b8; margin-bottom: 20px;">
            Este sistema possui proteção ativa contra inspeção não autorizada.
          </p>
          <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; padding: 20px; margin-top: 30px;">
            <p style="font-size: 13px; color: #fca5a5; margin: 0;">
              ⚠️ Feche as ferramentas de desenvolvedor e recarregue a página para continuar.
            </p>
          </div>
          <button onclick="location.reload()" style="
            margin-top: 30px;
            padding: 12px 24px;
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 6px;
            font-size: 16px;
            cursor: pointer;
            transition: background 0.2s;
          " onmouseover="this.style.background='#2563eb'" onmouseout="this.style.background='#3b82f6'">
            Recarregar Página
          </button>
        </div>
      `;

      document.body.appendChild(blockScreen);

      // Bloquear todas as tentativas de manipulação
      document.addEventListener('DOMContentLoaded', (e) => e.stopImmediatePropagation(), true);
      window.addEventListener('load', (e) => e.stopImmediatePropagation(), true);

      // Prevenir qualquer script de ser executado
      const scripts = document.getElementsByTagName('script');
      for (let script of scripts) {
        script.remove();
      }

      // Impedir que a aplicação React seja montada
      const root = document.getElementById('root');
      if (root) {
        root.innerHTML = '';
      }

      // Throw error para parar execução de qualquer código
      throw new Error('DevTools detected - System blocked');
    };

    // Verificação contínua a cada 1000ms (menos agressivo para evitar falsos positivos)
    const detectionInterval = setInterval(() => {
      if (detectDevTools()) {
        clearInterval(detectionInterval);
        blockSystem();
      }
    }, 1000);

    // Desabilitar debugger check (causa falsos positivos)
    // const debuggerInterval = setInterval(() => {
    //   if (checkDebugger()) {
    //     clearInterval(debuggerInterval);
    //     clearInterval(detectionInterval);
    //     blockSystem();
    //   }
    // }, 1000);

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

    // Cleanup
    return () => {
      clearInterval(detectionInterval);
      // clearInterval(debuggerInterval); // Comentado pois debuggerInterval foi desabilitado
      if (SECURITY_CONFIG.devTools.preventConsole) {
        Object.keys(originalConsole).forEach(key => {
          try {
            console[key] = originalConsole[key];
          } catch {}
        });
      }
    };
  }, []);

  return devToolsDetected;
};