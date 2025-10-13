import React, { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';

/**
 * Componente que gerencia atualizações automáticas do Service Worker
 * - Verifica atualizações a cada 60 segundos
 * - Atualiza automaticamente sem intervenção do usuário
 * - Mostra notificação visual durante atualização
 */
export const AutoUpdateManager = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('');

  useEffect(() => {
    // Não faz nada em desenvolvimento
    if (process.env.NODE_ENV !== 'production') {
      return;
    }

    // Verificar se o navegador suporta service workers
    if (!('serviceWorker' in navigator)) {
      return;
    }

    let updateCheckInterval;
    let registration;

    const checkForUpdates = async () => {
      try {
        if (registration) {
          console.log('🔄 Verificando atualizações...');
          await registration.update();
        }
      } catch (error) {
        console.error('Erro ao verificar atualizações:', error);
      }
    };

    const setupAutoUpdate = async () => {
      try {
        // Obter a registration do service worker
        registration = await navigator.serviceWorker.getRegistration();
        
        if (!registration) {
          console.log('Service Worker não registrado');
          return;
        }

        console.log('✅ Service Worker registrado, configurando auto-update...');

        // Verificar atualizações a cada 60 segundos
        updateCheckInterval = setInterval(checkForUpdates, 60000);

        // Também verificar na primeira execução
        setTimeout(checkForUpdates, 5000);

        // Listener para detectar quando uma nova versão está disponível
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          console.log('🆕 Nova versão encontrada!');

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('📦 Nova versão instalada, preparando atualização...');
              setUpdateMessage('Nova versão disponível! Atualizando...');
              setIsUpdating(true);

              // Enviar mensagem para o service worker pular a espera
              newWorker.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        });

        // Listener para quando o service worker é atualizado
        let refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (!refreshing) {
            refreshing = true;
            console.log('🔄 Service Worker atualizado! Recarregando página...');
            setUpdateMessage('Aplicando atualização...');
            
            // Pequeno delay para o usuário ver a mensagem
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          }
        });

      } catch (error) {
        console.error('Erro ao configurar auto-update:', error);
      }
    };

    setupAutoUpdate();

    // Cleanup
    return () => {
      if (updateCheckInterval) {
        clearInterval(updateCheckInterval);
      }
    };
  }, []);

  // Não renderizar nada se não estiver atualizando
  if (!isUpdating) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-[9999] animate-slideInRight">
      <div className="bg-blue-500 dark:bg-blue-600 text-white rounded-lg shadow-2xl p-4 flex items-center gap-3 min-w-[280px] border border-blue-400">
        <RefreshCw className="w-5 h-5 animate-spin" />
        <div className="flex-1">
          <p className="font-medium">{updateMessage}</p>
          <p className="text-xs opacity-90">Por favor, aguarde...</p>
        </div>
      </div>
    </div>
  );
};

export default AutoUpdateManager;
