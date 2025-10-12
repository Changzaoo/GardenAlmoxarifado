import React, { useState } from 'react';
import { Monitor, Smartphone, Flashlight, Tv } from 'lucide-react';
import ThemeTransition from './ThemeTransition';

const ThemeTransitionDemo = () => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionType, setTransitionType] = useState('tv-off');
  const [demoMode, setDemoMode] = useState('tv-off');

  const startDemo = (type) => {
    setTransitionType(type);
    setIsTransitioning(true);
  };

  const handleTransitionComplete = () => {
    setIsTransitioning(false);
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <ThemeTransition
        isTransitioning={isTransitioning}
        transitionType={transitionType}
        onTransitionComplete={handleTransitionComplete}
      />
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Demonstração de Transições de Tema
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Teste os diferentes efeitos visuais de transição de tema premium
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Efeito TV */}
        <button
          onClick={() => startDemo('tv-off')}
          disabled={isTransitioning}
          className={`
            p-4 rounded-lg border-2 transition-all duration-200
            ${demoMode === 'tv-off' 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
              : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
            }
            ${isTransitioning ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
          `}
        >
          <div className="flex items-center gap-3 mb-2">
            <Tv className="w-5 h-5 text-blue-500" />
            <span className="font-medium text-gray-900 dark:text-white">
              Efeito TV Desligando
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 text-left">
            Simula uma TV CRT vintage desligando com linhas de varredura, ruído e linha de shutdown.
            Ideal para transição: Escuro → Claro
          </p>
        </button>

        {/* Efeito Lanterna */}
        <button
          onClick={() => startDemo('flashlight')}
          disabled={isTransitioning}
          className={`
            p-4 rounded-lg border-2 transition-all duration-200
            ${demoMode === 'flashlight' 
              ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' 
              : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
            }
            ${isTransitioning ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
          `}
        >
          <div className="flex items-center gap-3 mb-2">
            <Flashlight className="w-5 h-5 text-yellow-500" />
            <span className="font-medium text-gray-900 dark:text-white">
              Efeito Lanterna
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 text-left">
            Simula uma lanterna potente ofuscando a tela com raios de luz e partículas brilhantes.
            Ideal para transição: Claro → Escuro
          </p>
        </button>
      </div>

      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div className="flex items-start gap-3">
          <Monitor className="w-5 h-5 text-gray-500 mt-0.5" />
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-1">
              Otimizações Incluídas
            </h4>
            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
              <li>• Responsivo para mobile e desktop</li>
              <li>• Suporte a preferências de acessibilidade (reduced motion)</li>
              <li>• Otimizações de performance com will-change e backface-visibility</li>
              <li>• Animações suaves de 60fps com transform e opacity</li>
              <li>• Z-index apropriado para overlay completo da tela</li>
            </ul>
          </div>
        </div>
      </div>

      {isTransitioning && (
        <div className="mt-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-2 bg-blue-100 dark:bg-blue-900/20 rounded-full">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm text-blue-600 dark:text-blue-400">
              Executando transição...
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeTransitionDemo;