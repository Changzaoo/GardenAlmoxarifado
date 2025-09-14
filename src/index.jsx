import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import Workflow from './components/Workflow';
import ThemeProvider from './components/ThemeProvider';
import SecurityBlockScreen from './components/SecurityBlockScreen';
import './index.css';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import { SECURITY_CONFIG } from './config/security';

// Função para verificar se o DevTools está aberto
const isDevToolsOpen = () => {
  if (!SECURITY_CONFIG.devTools.enabled) return false;
  const widthThreshold = window.outerWidth - window.innerWidth > SECURITY_CONFIG.devTools.sizeThreshold;
  const heightThreshold = window.outerHeight - window.innerHeight > SECURITY_CONFIG.devTools.sizeThreshold;
  return widthThreshold || heightThreshold;
};

// Bloquear teclas de desenvolvedor
const blockDevKeys = (e) => {
  const blockedKeys = [
    { key: 'F12', code: 123 },
    { key: 'I', ctrl: true, shift: true },
    { key: 'J', ctrl: true, shift: true },
    { key: 'C', ctrl: true, shift: true },
    { key: 'K', ctrl: true, shift: true },
    { key: 'U', ctrl: true }
  ];

  const isBlocked = blockedKeys.some(combo => {
    if (combo.key === e.key || e.keyCode === combo.code) {
      if (combo.ctrl && combo.shift) {
        return e.ctrlKey && e.shiftKey;
      }
      if (combo.ctrl) {
        return e.ctrlKey;
      }
      return true;
    }
    return false;
  });

  if (isBlocked) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }
};

// Componente Root que gerencia o estado da aplicação
const Root = () => {
  const [isDevToolsDetected, setIsDevToolsDetected] = useState(isDevToolsOpen());

  useEffect(() => {
    // Configurar proteções
    window.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('keydown', blockDevKeys);
    
    const checkDevTools = () => {
      const detected = isDevToolsOpen();
      if (detected !== isDevToolsDetected) {
        setIsDevToolsDetected(detected);
        if (detected && SECURITY_CONFIG.devTools.clearDataOnDetection) {
          window.localStorage.clear();
          window.sessionStorage.clear();
        }
      }
    };

    const interval = setInterval(checkDevTools, SECURITY_CONFIG.devTools.checkInterval);
    window.addEventListener('resize', checkDevTools);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', checkDevTools);
      window.removeEventListener('contextmenu', (e) => e.preventDefault());
      window.removeEventListener('keydown', blockDevKeys);
    };
  }, [isDevToolsDetected]);

  if (isDevToolsDetected) {
    return <SecurityBlockScreen />;
  }

  return (
    <ThemeProvider>
      <Workflow />
    </ThemeProvider>
  );
};

// Renderização inicial
const root = ReactDOM.createRoot(document.getElementById('root'));

if (isDevToolsOpen()) {
  root.render(<SecurityBlockScreen />);
} else {
  root.render(<Root />);
}

// Register service worker
serviceWorkerRegistration.register();