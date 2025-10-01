import React, { useEffect, useState } from 'react';
import * as serviceWorkerRegistration from '../serviceWorkerRegistration';

export const PWAUpdateAvailable = () => {
  const [waitingWorker, setWaitingWorker] = useState(null);
  const [showReload, setShowReload] = useState(false);

  useEffect(() => {
    const config = {
      onUpdate: registration => {
        setWaitingWorker(registration.waiting);
        setShowReload(true);
      }
    };

    serviceWorkerRegistration.register(config);
  }, []);

  const reloadPage = () => {
    waitingWorker?.postMessage({ type: 'SKIP_WAITING' });
    setShowReload(false);
    window.location.reload();
  };

  if (!showReload) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl shadow-lg max-w-md w-full mx-4">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Nova atualização disponível!</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Uma nova versão do aplicativo está disponível. Atualize para obter as últimas melhorias e correções.</p>
          <div className="flex justify-end">
            <button
              onClick={reloadPage}
              className="px-6 py-3 bg-blue-500 dark:bg-[#1D9BF0] text-gray-900 dark:text-white rounded-full font-medium hover:bg-blue-600 dark:hover:bg-[#1a8cd8] transition-colors"
            >
              Atualizar agora
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PWAUpdateAvailable;

