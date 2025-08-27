import React from 'react';
import ReactDOM from 'react-dom/client';
import AlmoxarifadoJardim from './components/AlmoxarifadoJardim';
import ThemeProvider from './components/ThemeProvider';
import './index.css';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <AlmoxarifadoJardim />
    </ThemeProvider>
  </React.StrictMode>
);

// Registrar o service worker para funcionalidade offline
serviceWorkerRegistration.register({
  onUpdate: (registration) => {
    // Notificar o usuário que há uma nova versão disponível
    const shouldUpdate = window.confirm(
      'Nova versão disponível! Deseja atualizar agora?'
    );
    if (shouldUpdate) {
      // Envia mensagem para o service worker atualizar
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      // Recarrega a página
      window.location.reload();
    }
  },
  onSuccess: () => {
    console.log(
      'Service Worker registrado com sucesso! O app agora funciona offline.'
    );
  },
});