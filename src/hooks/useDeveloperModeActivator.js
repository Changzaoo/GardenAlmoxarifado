import React, { useState, useRef } from 'react';
import { useDeveloperMode } from '../contexts/DeveloperModeContext';
import { useAuth } from '../hooks/useAuth';
import { NIVEIS_PERMISSAO } from '../constants/permissoes';

/**
 * Hook para detectar long-press (segurar por 0.5s)
 * Ativa modo desenvolvedor se usuário for ADMIN
 */
export const useDeveloperModeActivator = () => {
  const { enableDeveloperMode, isDeveloperMode } = useDeveloperMode();
  const { usuario } = useAuth();
  const [isLongPressing, setIsLongPressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const timeoutRef = useRef(null);
  const intervalRef = useRef(null);

  const isAdmin = usuario?.nivel === NIVEIS_PERMISSAO.ADMIN;

  const handlePressStart = (e) => {
    if (!isAdmin || isDeveloperMode) return;

    e.preventDefault();
    setIsLongPressing(true);
    setProgress(0);

    // Progresso visual
    let currentProgress = 0;
    intervalRef.current = setInterval(() => {
      currentProgress += 2; // 50 passos em 500ms (2% a cada 10ms)
      setProgress(currentProgress);
      
      if (currentProgress >= 100) {
        clearInterval(intervalRef.current);
      }
    }, 10);

    // Timer de 500ms
    timeoutRef.current = setTimeout(() => {
      clearInterval(intervalRef.current);
      setIsLongPressing(false);
      setProgress(0);
      
      // Ativar modo desenvolvedor
      enableDeveloperMode();
      
      // Feedback visual
      if (navigator.vibrate) {
        navigator.vibrate([50, 100, 50]);
      }
      
      // Mostrar toast de confirmação
      console.log('🔓 MODO DESENVOLVEDOR ATIVADO!');
      
      // Criar notificação visual temporária
      const toast = document.createElement('div');
      toast.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-purple-600 text-white px-6 py-3 rounded-lg shadow-2xl z-[10000] animate-bounce';
      toast.innerHTML = '🔓 <strong>Modo Desenvolvedor Ativado!</strong>';
      document.body.appendChild(toast);
      
      setTimeout(() => {
        toast.remove();
      }, 3000);
    }, 500);
  };

  const handlePressEnd = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setIsLongPressing(false);
    setProgress(0);
  };

  return {
    isAdmin,
    isDeveloperMode,
    isLongPressing,
    progress,
    longPressHandlers: {
      onMouseDown: handlePressStart,
      onMouseUp: handlePressEnd,
      onMouseLeave: handlePressEnd,
      onTouchStart: handlePressStart,
      onTouchEnd: handlePressEnd,
      onTouchCancel: handlePressEnd
    }
  };
};

/**
 * Componente de indicador visual de long-press
 * Mostra progresso circular enquanto usuário segura
 */
export const DeveloperModeActivationIndicator = ({ isActive, progress }) => {
  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center pointer-events-none">
      <div className="bg-black/80 backdrop-blur-sm rounded-full p-8 shadow-2xl">
        <div className="relative w-32 h-32">
          {/* Círculo de progresso */}
          <svg className="w-32 h-32 transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="56"
              fill="none"
              stroke="#374151"
              strokeWidth="8"
            />
            <circle
              cx="64"
              cy="64"
              r="56"
              fill="none"
              stroke="url(#gradient)"
              strokeWidth="8"
              strokeDasharray={`${2 * Math.PI * 56}`}
              strokeDashoffset={`${2 * Math.PI * 56 * (1 - progress / 100)}`}
              strokeLinecap="round"
              className="transition-all duration-100"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8B5CF6" />
                <stop offset="100%" stopColor="#EC4899" />
              </linearGradient>
            </defs>
          </svg>

          {/* Ícone central */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-white text-center">
              <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div className="text-sm font-bold">{Math.round(progress)}%</div>
            </div>
          </div>
        </div>
        
        <div className="text-center mt-4 text-white text-sm font-medium">
          Segure para ativar<br />Modo Desenvolvedor
        </div>
      </div>
    </div>
  );
};

export default useDeveloperModeActivator;
