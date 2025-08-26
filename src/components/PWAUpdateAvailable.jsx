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
    <div className="fixed bottom-4 right-4 z-50 bg-green-600 text-white rounded-lg shadow-lg p-4">
      <p className="mb-2">Nova versão disponível!</p>
      <button
        onClick={reloadPage}
        className="bg-white text-green-600 px-4 py-2 rounded hover:bg-green-50 transition-colors"
      >
        Atualizar
      </button>
    </div>
  );
};

export default PWAUpdateAvailable;
