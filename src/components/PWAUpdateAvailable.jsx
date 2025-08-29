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
      <div className="bg-[#192734] border border-[#38444D] rounded-xl shadow-lg max-w-md w-full mx-4">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Nova atualização disponível!</h2>
          <p className="text-[#8899A6] mb-6">Uma nova versão do aplicativo está disponível. Atualize para obter as últimas melhorias e correções.</p>
          <div className="flex justify-end">
            <button
              onClick={reloadPage}
              className="px-6 py-3 bg-[#1DA1F2] text-white rounded-full font-medium hover:bg-[#1a91da] transition-colors"
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
