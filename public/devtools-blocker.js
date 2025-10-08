/**
 * 🔒 PROTEÇÃO ANTI-DEVTOOLS ULTRA AGRESSIVA
 * 
 * Este sistema detecta e bloqueia IMEDIATAMENTE a abertura do DevTools (F12)
 * ANTES de qualquer arquivo ou componente ser carregado.
 * 
 * Métodos de Detecção:
 * 1. Verificação de tamanho de janela em tempo real
 * 2. Detecção de debugger ativo
 * 3. Verificação de console aberto
 * 4. Monitoramento de eventos de teclado (F12, Ctrl+Shift+I, etc)
 * 5. Detecção de diferença innerWidth/outerWidth
 * 6. Verificação periódica de mudanças na janela
 * 
 * Ações ao Detectar:
 * - Bloqueia TODA a aplicação imediatamente
 * - Remove todo conteúdo da página
 * - Impede carregamento de scripts
 * - Mostra tela de bloqueio permanente
 * - Força reload para desbloquear
 */

(function() {
  'use strict';

  // 🚨 Configurações de Detecção
  const CONFIG = {
    // Intervalo de verificação (ms) - quanto menor, mais agressivo
    CHECK_INTERVAL: 1000, // Era 500 - aumentado para reduzir CPU e falsos positivos
    
    // Threshold de diferença de tamanho (px) - aumentado para evitar falsos positivos
    SIZE_THRESHOLD: 200, // Era 160 - margem maior para variações normais
    
    // Detectar na inicialização - DESABILITADO para evitar bloqueio inicial
    DETECT_ON_INIT: false, // Era true - evita bloqueio ao carregar
    
    // Bloquear teclas de atalho
    BLOCK_SHORTCUTS: true,
    
    // Bloquear menu de contexto
    BLOCK_CONTEXT_MENU: true,
    
    // Modo paranóico (mais agressivo) - DESABILITADO
    PARANOID_MODE: false, // Era true - reduz detecções agressivas
    
    // Número mínimo de métodos que devem confirmar antes de bloquear
    MIN_DETECTIONS_REQUIRED: 3 // Requer 3 métodos confirmando para bloquear
  };

  // 🎯 Estado global
  let isBlocked = false;
  let detectionInterval = null;
  let debuggerCheckInterval = null;

  // � MODO EMERGÊNCIA - Verificar se proteção foi desabilitada
  const isProtectionDisabled = () => {
    try {
      return localStorage.getItem('__DEVTOOLS_DISABLED__') === 'true';
    } catch {
      return false;
    }
  };

  // Se proteção foi desabilitada, não fazer nada
  if (isProtectionDisabled()) {
    console.log('🔓 Proteção DevTools desabilitada via localStorage');
    console.log('ℹ️ Para reativar, execute: localStorage.removeItem("__DEVTOOLS_DISABLED__"); location.reload();');
    return;
  }

  // �🔍 MÉTODO 1: Detecção por Tamanho de Janela
  const detectByWindowSize = () => {
    const widthDiff = window.outerWidth - window.innerWidth;
    const heightDiff = window.outerHeight - window.innerHeight;
    
    // DevTools geralmente adiciona 160-300px de diferença
    return widthDiff > CONFIG.SIZE_THRESHOLD || heightDiff > CONFIG.SIZE_THRESHOLD;
  };

  // 🔍 MÉTODO 2: Detecção por Orientação e Docking
  const detectByOrientation = () => {
    // DevTools muda a orientação da tela em alguns browsers
    const threshold = CONFIG.SIZE_THRESHOLD;
    
    if (window.screen.availWidth - window.innerWidth > threshold) return true;
    if (window.screen.availHeight - window.innerHeight > threshold) return true;
    
    return false;
  };

  // 🔍 MÉTODO 3: Detecção por Console Timing
  const detectByConsoleTiming = () => {
    try {
      const start = performance.now();
      console.profile('devtools-check');
      console.profileEnd('devtools-check');
      const end = performance.now();
      
      // Se console está aberto, o timing é muito maior
      return (end - start) > 10;
    } catch {
      return false;
    }
  };

  // 🔍 MÉTODO 4: Detecção por Debugger Statement
  const detectByDebugger = () => {
    const start = performance.now();
    // eslint-disable-next-line no-debugger
    debugger;
    const end = performance.now();
    
    // Se debugger para a execução, o tempo será muito maior
    return (end - start) > 100;
  };

  // 🔍 MÉTODO 5: Detecção por toString Override
  let toStringDetected = false;
  const detectByToString = () => {
    const element = new Image();
    Object.defineProperty(element, 'id', {
      get: function() {
        toStringDetected = true;
        throw new Error('DevTools detected via toString');
      }
    });
    
    // Trigger toString no console
    try {
      console.log('%c', element);
    } catch {}
    
    return toStringDetected;
  };

  // 🔍 MÉTODO 6: Detecção por Firebug/DevTools API
  const detectByDevToolsAPI = () => {
    return !!(
      window.Firebug?.chrome?.isInitialized ||
      window.devtools?.open ||
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__ ||
      window.__VUE_DEVTOOLS_GLOBAL_HOOK__
    );
  };

  // 🔍 MÉTODO 7: Detecção por Console Object
  const detectByConsoleObject = () => {
    const devtools = /./;
    devtools.toString = function() {
      this.opened = true;
    };
    
    const checkIfOpened = () => {
      console.log('%c', devtools);
      return devtools.opened;
    };
    
    try {
      return checkIfOpened();
    } catch {
      return false;
    }
  };

  // 🎯 FUNÇÃO PRINCIPAL DE DETECÇÃO
  const isDevToolsOpen = () => {
    if (isBlocked) return true;

    // Detectar dispositivos móveis e tablets (não bloquear)
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) return false;

    // Detectar telas pequenas (não bloquear)
    if (window.innerWidth < 800 || window.innerHeight < 600) return false;

    // Combinar múltiplos métodos (apenas os confiáveis)
    const detections = [
      detectByWindowSize(),
      detectByOrientation(),
      CONFIG.PARANOID_MODE && detectByConsoleTiming(),
      CONFIG.PARANOID_MODE && detectByToString(),
      detectByDevToolsAPI(),
      CONFIG.PARANOID_MODE && detectByConsoleObject()
    ].filter(Boolean);

    // DevTools detectado se MIN_DETECTIONS_REQUIRED+ métodos confirmarem
    const minRequired = CONFIG.MIN_DETECTIONS_REQUIRED || 3;
    return detections.length >= minRequired;
  };

  // 🚫 FUNÇÃO DE BLOQUEIO TOTAL
  const blockApplication = (reason = 'DevTools detectado') => {
    if (isBlocked) return;
    
    isBlocked = true;
    console.error(`🚨 ${reason} - Sistema bloqueado`);

    // Parar todos os intervalos
    if (detectionInterval) clearInterval(detectionInterval);
    if (debuggerCheckInterval) clearInterval(debuggerCheckInterval);

    // Limpar timeouts e intervals globais
    const highestId = setTimeout(() => {});
    for (let i = 0; i < highestId; i++) {
      clearTimeout(i);
      clearInterval(i);
    }

    // Remover TUDO da página
    if (document.body) {
      document.body.innerHTML = '';
      document.body.style.cssText = 'margin: 0; padding: 0; overflow: hidden;';
    }

    // Remover React root
    const root = document.getElementById('root');
    if (root) root.innerHTML = '';

    // Remover todos os scripts
    const scripts = document.querySelectorAll('script');
    scripts.forEach(script => script.remove());

    // Criar tela de bloqueio FINAL
    const blockScreen = document.createElement('div');
    blockScreen.id = 'devtools-block-screen';
    blockScreen.innerHTML = `
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { overflow: hidden !important; }
        #devtools-block-screen {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          background: linear-gradient(135deg, #1a1a2e 0%, #0f0f1e 100%) !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          z-index: 2147483647 !important;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        }
        .block-content {
          text-align: center !important;
          color: white !important;
          max-width: 600px !important;
          padding: 60px 40px !important;
          background: rgba(255, 255, 255, 0.05) !important;
          border-radius: 20px !important;
          border: 2px solid rgba(255, 255, 255, 0.1) !important;
          backdrop-filter: blur(10px) !important;
          animation: fadeIn 0.5s ease-in-out !important;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .block-icon {
          font-size: 100px !important;
          margin-bottom: 30px !important;
          animation: pulse 2s infinite !important;
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        .block-title {
          font-size: 36px !important;
          font-weight: 700 !important;
          margin-bottom: 20px !important;
          color: #ff4757 !important;
          text-shadow: 0 0 20px rgba(255, 71, 87, 0.5) !important;
        }
        .block-message {
          font-size: 18px !important;
          color: #cbd5e1 !important;
          line-height: 1.6 !important;
          margin-bottom: 30px !important;
        }
        .block-warning {
          background: rgba(255, 71, 87, 0.15) !important;
          border: 2px solid rgba(255, 71, 87, 0.4) !important;
          border-radius: 12px !important;
          padding: 20px !important;
          margin: 30px 0 !important;
        }
        .block-warning p {
          font-size: 14px !important;
          color: #fca5a5 !important;
          margin: 0 !important;
        }
        .block-button {
          margin-top: 30px !important;
          padding: 16px 32px !important;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
          color: white !important;
          border: none !important;
          border-radius: 12px !important;
          font-size: 18px !important;
          font-weight: 600 !important;
          cursor: pointer !important;
          transition: all 0.3s ease !important;
          box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4) !important;
        }
        .block-button:hover {
          transform: translateY(-2px) !important;
          box-shadow: 0 15px 40px rgba(102, 126, 234, 0.6) !important;
        }
        .block-footer {
          margin-top: 40px !important;
          font-size: 12px !important;
          color: #64748b !important;
        }
      </style>
      <div class="block-content">
        <div class="block-icon">🛡️</div>
        <h1 class="block-title">ACESSO BLOQUEADO</h1>
        <p class="block-message">
          Ferramentas de desenvolvedor foram detectadas.<br>
          O sistema foi bloqueado automaticamente por segurança.
        </p>
        <div class="block-warning">
          <p>⚠️ Este sistema possui proteção ativa contra inspeção não autorizada.</p>
        </div>
        <p class="block-message" style="font-size: 16px; margin-top: 20px;">
          Para continuar usando o sistema:
        </p>
        <ol style="text-align: left; display: inline-block; color: #94a3b8; font-size: 14px; line-height: 2;">
          <li>Feche as Ferramentas de Desenvolvedor (DevTools)</li>
          <li>Feche o Console (F12)</li>
          <li>Clique no botão abaixo para recarregar</li>
        </ol>
        <button class="block-button" onclick="location.reload()">
          🔄 Recarregar Página
        </button>
        <p class="block-footer">
          Código de Erro: DT-${Date.now()}<br>
          Sistema de Proteção WorkFlow v2.0
        </p>
      </div>
    `;

    // Adicionar ao body (criar se não existir)
    if (!document.body) {
      document.body = document.createElement('body');
      document.documentElement.appendChild(document.body);
    }
    
    document.body.appendChild(blockScreen);

    // Impedir qualquer manipulação do DOM
    const observer = new MutationObserver(() => {
      const screen = document.getElementById('devtools-block-screen');
      if (!screen) {
        document.body.innerHTML = '';
        document.body.appendChild(blockScreen);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Bloquear TUDO
    window.stop();
    throw new Error('🚨 DevTools detected - Application blocked');
  };

  // 🔒 BLOQUEAR TECLAS DE ATALHO
  const blockKeyboardShortcuts = (e) => {
    // F12
    if (e.key === 'F12' || e.keyCode === 123) {
      e.preventDefault();
      e.stopImmediatePropagation();
      blockApplication('F12 pressionado');
      return false;
    }

    // Ctrl+Shift+I (Inspecionar)
    if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.keyCode === 73)) {
      e.preventDefault();
      e.stopImmediatePropagation();
      blockApplication('Ctrl+Shift+I detectado');
      return false;
    }

    // Ctrl+Shift+J (Console)
    if (e.ctrlKey && e.shiftKey && (e.key === 'J' || e.keyCode === 74)) {
      e.preventDefault();
      e.stopImmediatePropagation();
      blockApplication('Ctrl+Shift+J detectado');
      return false;
    }

    // Ctrl+Shift+C (Inspetor de elementos)
    if (e.ctrlKey && e.shiftKey && (e.key === 'C' || e.keyCode === 67)) {
      e.preventDefault();
      e.stopImmediatePropagation();
      blockApplication('Ctrl+Shift+C detectado');
      return false;
    }

    // Ctrl+U (Ver código fonte)
    if (e.ctrlKey && (e.key === 'U' || e.keyCode === 85)) {
      e.preventDefault();
      e.stopImmediatePropagation();
      return false;
    }

    // Ctrl+S (Salvar página)
    if (e.ctrlKey && (e.key === 'S' || e.keyCode === 83)) {
      e.preventDefault();
      e.stopImmediatePropagation();
      return false;
    }
  };

  // 🔒 BLOQUEAR MENU DE CONTEXTO
  const blockContextMenu = (e) => {
    e.preventDefault();
    e.stopImmediatePropagation();
    return false;
  };

  // 🚀 INICIALIZAÇÃO IMEDIATA
  const init = () => {
    console.log('🛡️ Proteção Anti-DevTools ativada');

    // Verificação INICIAL (antes de qualquer coisa)
    if (CONFIG.DETECT_ON_INIT && isDevToolsOpen()) {
      blockApplication('DevTools já aberto ao carregar');
      return;
    }

    // Bloquear teclas de atalho
    if (CONFIG.BLOCK_SHORTCUTS) {
      document.addEventListener('keydown', blockKeyboardShortcuts, true);
      window.addEventListener('keydown', blockKeyboardShortcuts, true);
    }

    // Bloquear menu de contexto
    if (CONFIG.BLOCK_CONTEXT_MENU) {
      document.addEventListener('contextmenu', blockContextMenu, true);
    }

    // Verificação contínua
    detectionInterval = setInterval(() => {
      if (isDevToolsOpen()) {
        blockApplication('DevTools aberto durante uso');
      }
    }, CONFIG.CHECK_INTERVAL);

    // Verificação de debugger (mais agressiva)
    if (CONFIG.PARANOID_MODE) {
      debuggerCheckInterval = setInterval(() => {
        if (detectByDebugger()) {
          blockApplication('Debugger detectado');
        }
      }, 1000);
    }

    // Monitorar mudanças de tamanho da janela
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (isDevToolsOpen()) {
          blockApplication('DevTools aberto via resize');
        }
      }, 300);
    });

    // Monitorar visibilidade da página
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && isDevToolsOpen()) {
        blockApplication('DevTools detectado ao voltar à página');
      }
    });

    // Desabilitar console methods
    const noop = () => {};
    ['log', 'debug', 'info', 'warn', 'error', 'table', 'dir', 'dirxml', 'trace', 'group', 'groupCollapsed', 'groupEnd', 'clear', 'count', 'countReset', 'assert', 'profile', 'profileEnd', 'time', 'timeLog', 'timeEnd', 'timeStamp'].forEach(method => {
      try {
        console[method] = noop;
      } catch {}
    });
  };

  // 🎯 EXECUTAR IMEDIATAMENTE (antes de tudo)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Tornar disponível globalmente para debug (em dev)
  if (typeof window !== 'undefined') {
    window.__DEVTOOLS_PROTECTION__ = {
      isBlocked: () => isBlocked,
      check: isDevToolsOpen,
      // Senha para desabilitar (apenas dev)
      disable: (password) => {
        if (password === 'WORKFLOW_DEV_2025') {
          clearInterval(detectionInterval);
          clearInterval(debuggerCheckInterval);
          isBlocked = false;
          
          // Salvar no localStorage para persistir
          try {
            localStorage.setItem('__DEVTOOLS_DISABLED__', 'true');
          } catch {}
          
          console.log('🔓 Proteção desabilitada permanentemente');
          console.log('ℹ️ Para reativar, execute: localStorage.removeItem("__DEVTOOLS_DISABLED__")');
          return true;
        }
        return false;
      },
      // Desabilitar via localStorage (modo emergência)
      emergencyDisable: () => {
        try {
          localStorage.setItem('__DEVTOOLS_DISABLED__', 'true');
          location.reload();
        } catch {}
      }
    };
  }

})();

// Exportar para uso no React (se necessário)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    isDevToolsBlocked: () => window.__DEVTOOLS_PROTECTION__?.isBlocked() || false
  };
}
