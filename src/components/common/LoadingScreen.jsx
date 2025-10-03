import React from 'react';
import OfflineLogo from './OfflineLogo';

const LoadingScreen = ({ 
  progress: externalProgress, 
  loadingText: externalText,
  isComplete = false 
}) => {
  const progress = externalProgress ?? 0;
  const loadingText = externalText ?? 'Iniciando sistema...';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="text-center p-8">
        {/* Logo com animação */}
        <div className="mx-auto w-32 h-32 flex items-center justify-center mb-8 relative">
          <OfflineLogo 
            src="/logo.png" 
            alt="Logo WorkFlow" 
            className="w-full h-full object-contain"
            style={{
              animation: isComplete ? 'bounceSuccess 0.6s ease-in-out' : 'pulse 2s ease-in-out infinite'
            }}
          />
          {!isComplete && (
            <div className="absolute inset-0 rounded-full border-4 border-blue-500 dark:border-blue-400 opacity-20 animate-ping"></div>
          )}
          {isComplete && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-6xl animate-checkmark">✓</div>
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
              {/* Barra de progresso com gradiente */}
              <div 
                className="h-full rounded-full transition-all duration-300 ease-out relative overflow-hidden"
                style={{
                  width: `${progress}%`,
                  background: isComplete 
                    ? 'linear-gradient(90deg, #10b981 0%, #059669 50%, #10b981 100%)'
                    : 'linear-gradient(90deg, #3b82f6 0%, #1d4ed8 50%, #3b82f6 100%)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 2s infinite'
                }}
              >
                {/* Efeito de brilho */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
              </div>
            </div>
            
            {/* Porcentagem */}
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {loadingText}
              </span>
              <span className={`text-lg font-bold ${isComplete ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}`}>
                {Math.round(progress)}%
              </span>
            </div>
          </div>
        </div>

        {/* Ícone de carregamento giratório ou check */}
        {!isComplete ? (
          <div className="flex justify-center items-center gap-2 mt-4">
            <div className="relative">
              <div className="w-8 h-8 border-4 border-blue-200 dark:border-blue-900 rounded-full"></div>
              <div className="w-8 h-8 border-4 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Por favor, aguarde...
            </span>
          </div>
        ) : (
          <div className="flex justify-center items-center gap-2 mt-4">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
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
      `}</style>
    </div>
  );
};

export default LoadingScreen;
