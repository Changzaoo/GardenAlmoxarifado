import React, { useState, useEffect } from 'react';
import OfflineLogo from './OfflineLogo';

const LoadingScreen = ({ 
  progress: externalProgress, 
  loadingText: externalText,
  isComplete: externalComplete = false,
  fadeOut = false,
  isRedirecting = false // Novo parâmetro para indicar redirecionamento
}) => {
  const [internalProgress, setInternalProgress] = useState(0);
  const [internalText, setInternalText] = useState('Iniciando sistema...');
  const [isComplete, setIsComplete] = useState(false);

  // Use external props if provided, otherwise use internal state
  const progress = externalProgress !== undefined ? externalProgress : internalProgress;
  const loadingText = externalText || internalText;
  const completionState = externalProgress !== undefined ? externalComplete : isComplete;

  // Internal loading simulation when no external progress is provided
  useEffect(() => {
    if (externalProgress === undefined) {
      // Define as fases base (sem redirecionamento)
      const basePhasesBeforeRedirect = [
        { text: 'Conectando com o servidor...', duration: 800, progress: 15 },
        { text: 'Carregando configurações...', duration: 600, progress: 30 },
        { text: 'Verificando autenticação...', duration: 700, progress: 50 },
        { text: 'Carregando dados do usuário...', duration: 500, progress: 70 },
        { text: 'Preparando interface...', duration: 400, progress: 85 }
      ];
      
      // Fase de redirecionamento (só aparece se isRedirecting for true)
      const redirectPhase = { 
        text: 'Redirecionando para página favorita...', 
        duration: 500, 
        progress: 95 
      };
      
      const finalPhase = { 
        text: 'Finalizando...', 
        duration: 300, 
        progress: 100 
      };
      
      // Montar array de fases dinamicamente
      const phases = [
        ...basePhasesBeforeRedirect,
        ...(isRedirecting ? [redirectPhase] : []),
        finalPhase
      ];

      let currentPhase = 0;
      let currentProgress = 0;

      const updateProgress = () => {
        if (currentPhase < phases.length) {
          const phase = phases[currentPhase];
          setInternalText(phase.text);
          
          const increment = (phase.progress - currentProgress) / 20;
          const interval = setInterval(() => {
            currentProgress += increment;
            setInternalProgress(Math.min(currentProgress, phase.progress));
            
            if (currentProgress >= phase.progress) {
              clearInterval(interval);
              currentPhase++;
              if (currentPhase < phases.length) {
                setTimeout(updateProgress, 100);
              } else {
                // Loading complete - não definir isComplete aqui para evitar loop
                setInternalText('Sistema carregado!');
              }
            }
          }, phase.duration / 20);
        }
      };

      updateProgress();
    }
  }, [externalProgress, isRedirecting]);

  return (
    <div 
      className={`fixed inset-0 min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 z-50 ${
        fadeOut ? 'animate-fadeOut' : ''
      }`}
      style={{
        transition: fadeOut ? 'opacity 600ms ease-out' : 'none',
        opacity: fadeOut ? 0 : 1
      }}
    >
      <div className="text-center p-8">
        {/* Logo com animação */}
        <div className="mx-auto w-32 h-32 flex items-center justify-center mb-8 relative">
          <OfflineLogo 
            src="/logo.png" 
            alt="Logo WorkFlow" 
            className="w-full h-full object-contain relative z-10"
            style={{
              animation: completionState ? 'bounceSuccess 0.6s ease-in-out' : 'pulse 2s ease-in-out infinite'
            }}
          />
          {!completionState && (
            <div className="absolute inset-0 rounded-full border-4 border-blue-500 dark:border-blue-400 opacity-20 animate-ping"></div>
          )}
          {completionState && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div 
                className="text-6xl text-green-500 animate-checkmark"
                style={{
                  animation: 'checkmarkPop 0.6s ease-in-out'
                }}
              >
                ✓
              </div>
            </div>
          )}
        </div>

        {/* Nome do sistema */}
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-8">
          WorkFlow
        </h1>

        {/* Barra de progresso */}
        <div className="w-96 max-w-full mx-auto mb-6">
          <div className="relative">
            {/* Background da barra */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden shadow-inner">
              {/* Barra de progresso com gradiente AZUL */}
              <div 
                className="h-full rounded-full transition-all duration-500 ease-out relative overflow-hidden"
                style={{
                  width: `${Math.max(0, Math.min(100, progress))}%`,
                  background: completionState
                    ? 'linear-gradient(90deg, #10b981 0%, #059669 50%, #10b981 100%)'
                    : 'linear-gradient(90deg, #3b82f6 0%, #1d4ed8 50%, #3b82f6 100%)',
                  backgroundSize: '200% 100%',
                  animation: progress < 100 ? 'shimmer 2s infinite' : 'none'
                }}
              >
                {/* Efeito de brilho */}
                {progress < 100 && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                )}
              </div>
            </div>
            
            {/* Porcentagem */}
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {loadingText}
              </span>
              <span className={`text-lg font-bold transition-colors duration-300 ${
                completionState 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-blue-600 dark:text-blue-400'
              }`}>
                {Math.round(Math.max(0, Math.min(100, progress)))}%
              </span>
            </div>
          </div>
        </div>

        {/* Ícone de carregamento giratório ou check */}
        {!completionState ? (
          <div className="flex justify-center items-center gap-2 mt-4">
            <div className="relative">
              <div className="w-8 h-8 border-4 border-blue-200 dark:border-blue-800 rounded-full"></div>
              <div className="w-8 h-8 border-4 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Por favor, aguarde...
            </span>
          </div>
        ) : (
          <div className="flex justify-center items-center gap-2 mt-4">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
              <span className="text-white text-xl">✓</span>
            </div>
            <span className="text-sm text-green-600 dark:text-green-400 font-medium">
              Carregamento concluído!
            </span>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        @keyframes bounceSuccess {
          0%, 20%, 53%, 80%, 100% {
            transform: translate3d(0,0,0);
          }
          40%, 43% {
            transform: translate3d(0, -15px, 0);
          }
          70% {
            transform: translate3d(0, -7px, 0);
          }
          90% {
            transform: translate3d(0, -2px, 0);
          }
        }

        @keyframes checkmarkPop {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.2);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes animate-shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        .animate-shimmer {
          animation: animate-shimmer 2s infinite;
        }

        .animate-checkmark {
          animation: checkmarkPop 0.6s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;
