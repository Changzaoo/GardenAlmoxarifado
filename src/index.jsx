import React from 'react';
import ReactDOM from 'react-dom/client';
import Seed from './components/Workflow';
import { ThemeProvider } from './components/Theme/ThemeSystem';
import AppInitializer from './components/common/AppInitializer';
import './index.css';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

// Componente Root que gerencia o estado da aplicação
const Root = () => {
  return (
    <AppInitializer>
      <ThemeProvider>
        <Seed />
      </ThemeProvider>
    </AppInitializer>
  );
};

// Renderização inicial
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<Root />);

// Register service worker
serviceWorkerRegistration.register();