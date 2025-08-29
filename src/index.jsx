import React, { Suspense, lazy, useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import ThemeProvider from './components/ThemeProvider';
import './index.css';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import { verificarConexaoFirebase } from './utils/verificarConexao';
import ErrorBoundary from './components/ErrorBoundary';

const Workflow = lazy(() => import('./components/Workflow'));

const App = () => {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        const conexaoOk = await verificarConexaoFirebase();
        if (!conexaoOk) {
          throw new Error('Não foi possível conectar ao servidor. Verifique sua conexão com a internet.');
        }
        setIsLoading(false);
      } catch (err) {
        console.error('Erro na inicialização:', err);
        setError(err.message);
        setIsLoading(false);
      }
    };

    init();
  }, []);

  if (error) {
    return <ErrorBoundary error={error} />;
  }

  return (
    <React.StrictMode>
      <ThemeProvider>
        <Suspense fallback={
          <div className="min-h-screen bg-gray-100 dark:bg-[#15202B] flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#1DA1F2] mx-auto mb-4"></div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Carregando Sistema do Almoxarifado...
              </h1>
            </div>
          </div>
        }>
          <Workflow />
        </Suspense>
      </ThemeProvider>
    </React.StrictMode>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(<App />);

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