import React, { useState, useEffect } from 'react';
import { Maximize2 } from 'lucide-react';

const FullscreenPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const checkFullscreen = () => {
      // Verifica se é um dispositivo móvel
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      if (!isMobile) {
        setShowPrompt(false);
        return;
      }

      // Verifica se está em tela cheia
      const isFullscreen = document.fullscreenElement || 
        document.webkitFullscreenElement || 
        document.mozFullScreenElement || 
        document.msFullscreenElement;

      setShowPrompt(!isFullscreen);
    };

    // Verifica inicialmente
    checkFullscreen();

    // Adiciona listeners para mudanças no estado da tela cheia
    document.addEventListener('fullscreenchange', checkFullscreen);
    document.addEventListener('webkitfullscreenchange', checkFullscreen);
    document.addEventListener('mozfullscreenchange', checkFullscreen);
    document.addEventListener('MSFullscreenChange', checkFullscreen);

    return () => {
      // Remove os listeners
      document.removeEventListener('fullscreenchange', checkFullscreen);
      document.removeEventListener('webkitfullscreenchange', checkFullscreen);
      document.removeEventListener('mozfullscreenchange', checkFullscreen);
      document.removeEventListener('MSFullscreenChange', checkFullscreen);
    };
  }, []);

  const requestFullscreen = () => {
    const element = document.documentElement;

    if (element.requestFullscreen) {
      element.requestFullscreen();
    } else if (element.webkitRequestFullscreen) {
      element.webkitRequestFullscreen();
    } else if (element.mozRequestFullScreen) {
      element.mozRequestFullScreen();
    } else if (element.msRequestFullscreen) {
      element.msRequestFullscreen();
    }
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[70] bg-[#1D9BF0] bg-opacity-10 border border-[#1D9BF0] rounded-lg p-4 text-[#1D9BF0] shadow-lg">
      <div className="flex items-center gap-3">
        <Maximize2 className="w-5 h-5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium">Melhor experiência em tela cheia</p>
          <p className="text-xs opacity-80">O aplicativo funciona melhor em modo tela cheia</p>
        </div>
        <button
          onClick={requestFullscreen}
          className="px-3 py-1.5 bg-[#1D9BF0] text-gray-900 dark:text-white rounded-full text-sm hover:bg-[#1a91da] transition-colors"
        >
          Ativar
        </button>
      </div>
    </div>
  );
};

export default FullscreenPrompt;

