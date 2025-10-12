import React, { useState, useRef } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeSystem';
import ThemeTransition from './ThemeTransition';

const ThemeToggle = ({ size = 'md', showLabel = false, className = '' }) => {
  const { currentTheme, toggleTheme, isLight, isDark } = useTheme();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0 });
  const buttonRef = useRef(null);
  
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };
  
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const handleThemeToggle = (event) => {
    // Capturar posição do botão
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      setButtonPosition({ x: centerX, y: centerY });
    }
    
    // Iniciar transição
    setIsTransitioning(true);
    
    // Atrasar a mudança real do tema para que a animação comece primeiro
    setTimeout(() => {
      toggleTheme();
    }, 200);
  };

  const handleTransitionComplete = () => {
    setIsTransitioning(false);
  };
  
  return (
    <>
      {/* Componente de Transição */}
      <ThemeTransition
        isActive={isTransitioning}
        fromTheme={currentTheme}
        toTheme={isLight ? 'dark' : 'light'}
        onTransitionComplete={handleTransitionComplete}
        buttonPosition={buttonPosition}
      />
      
      <div className={`flex items-center gap-2 ${className}`}>
        {showLabel && (
          <span className={`text-sm font-medium ${
            isDark ? 'text-white' : 'text-gray-700'
          }`}>
            Tema
          </span>
        )}
        
        <button
          ref={buttonRef}
          onClick={handleThemeToggle}
          disabled={isTransitioning}
          className={`
            ${sizes[size]} rounded-lg
            flex items-center justify-center
            transition-all duration-300 ease-in-out
            ${isDark 
              ? 'bg-[#16181C] hover:bg-[#1D1F23] border border-[#2F3336] text-yellow-400' 
              : 'bg-white hover:bg-gray-50 border border-gray-200 text-orange-500'
            }
            ${isTransitioning ? 'opacity-75 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}
            group relative overflow-hidden
          `}
          title={`Trocar para tema ${isLight ? 'escuro' : 'claro'}`}
          aria-label={`Trocar para tema ${isLight ? 'escuro' : 'claro'}`}
        >
          {/* Background animado */}
          <div className={`
            absolute inset-0 opacity-0 group-hover:opacity-10 
            transition-opacity duration-300
            ${isLight ? 'bg-orange-500' : 'bg-yellow-400'}
          `} />
          
          {/* Ícone com animação */}
          <div className="relative z-10 flex items-center justify-center">
            {isLight ? (
              <Sun 
                className={`${iconSizes[size]} transition-all duration-300 
                  ${isTransitioning ? 'animate-pulse' : 'group-hover:rotate-180 group-hover:scale-110'}`} 
              />
            ) : (
              <Moon 
                className={`${iconSizes[size]} transition-all duration-300 
                  ${isTransitioning ? 'animate-pulse' : 'group-hover:-rotate-12 group-hover:scale-110'}`} 
              />
            )}
          </div>
          
          {/* Indicador de estado */}
          <div className={`
            absolute top-1 right-1 w-2 h-2 rounded-full
            transition-all duration-300
            ${isLight ? 'bg-orange-400' : 'bg-yellow-400'}
            ${isTransitioning ? 'animate-ping' : 'opacity-60 group-hover:opacity-100'}
          `} />
        </button>
      </div>
    </>
  );
};

// Componente de toggle mais elaborado com switch
export const ThemeSwitch = ({ className = '' }) => {
  const { currentTheme, toggleTheme, isLight } = useTheme();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0 });
  const switchRef = useRef(null);

  const handleThemeToggle = () => {
    // Capturar posição do switch
    if (switchRef.current) {
      const rect = switchRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      setButtonPosition({ x: centerX, y: centerY });
    }
    
    // Iniciar transição
    setIsTransitioning(true);
    
    // Atrasar a mudança real do tema para que a animação comece primeiro
    setTimeout(() => {
      toggleTheme();
    }, 200);
  };

  const handleTransitionComplete = () => {
    setIsTransitioning(false);
  };
  
  return (
    <>
      {/* Componente de Transição */}
      <ThemeTransition
        isActive={isTransitioning}
        fromTheme={currentTheme}
        toTheme={isLight ? 'dark' : 'light'}
        onTransitionComplete={handleTransitionComplete}
        buttonPosition={buttonPosition}
      />
      
      <div className={`flex items-center gap-3 ${className}`}>
        <Sun className={`w-4 h-4 ${
          isLight ? 'text-orange-500' : 'text-gray-400'
        } transition-colors`} />
        
        <button
          ref={switchRef}
          onClick={handleThemeToggle}
          disabled={isTransitioning}
          className={`
            relative w-14 h-7 rounded-full p-1
            transition-all duration-300 ease-in-out
            ${isLight 
              ? 'bg-gray-200 hover:bg-gray-300' 
              : 'bg-[#1D9BF0] hover:bg-[#1A8CD8]'
            }
            ${isTransitioning ? 'opacity-75 cursor-not-allowed' : ''}
            focus:outline-none focus:ring-2 focus:ring-[#1D9BF0] focus:ring-offset-2
            ${isLight ? 'focus:ring-offset-white' : 'focus:ring-offset-black'}
          `}
          aria-label={`Trocar para tema ${isLight ? 'escuro' : 'claro'}`}
        >
          {/* Bolinha do switch */}
          <div className={`
            w-5 h-5 bg-white dark:bg-gray-800 rounded-full shadow-md
            transition-all duration-300 ease-in-out
            flex items-center justify-center
            ${isLight ? 'translate-x-0' : 'translate-x-7'}
            ${isTransitioning ? 'animate-pulse' : ''}
          `}>
            {isLight ? (
              <Sun className={`w-3 h-3 text-orange-500 ${isTransitioning ? 'animate-spin' : ''}`} />
            ) : (
              <Moon className={`w-3 h-3 text-[#1D9BF0] ${isTransitioning ? 'animate-bounce' : ''}`} />
            )}
          </div>
        </button>
        
        <Moon className={`w-4 h-4 ${
          !isLight ? 'text-[#1D9BF0]' : 'text-gray-400'
        } transition-colors`} />
      </div>
    </>
  );
};

// Componente de seleção de tema mais avançado
export const ThemeSelector = ({ className = '' }) => {
  const { currentTheme, setTheme, themes } = useTheme();
  
  const themeOptions = [
    {
      key: 'light',
      name: 'Claro',
      icon: Sun,
      description: 'Tema claro e limpo',
      colors: ['#FFFFFF', '#F8FAFC', '#1D9BF0']
    },
    {
      key: 'dark',
      name: 'Escuro',
      icon: Moon,
      description: 'Tema escuro moderno',
      colors: ['#000000', '#16181C', '#1D9BF0']
    }
  ];
  
  return (
    <div className={`space-y-2 ${className}`}>
      <h3 className={`text-sm font-medium ${
        currentTheme === 'dark' ? 'text-white' : 'text-gray-900'
      }`}>
        Escolher Tema
      </h3>
      
      <div className="grid gap-2">
        {themeOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = currentTheme === option.key;
          
          return (
            <button
              key={option.key}
              onClick={() => setTheme(option.key)}
              className={`
                p-3 rounded-lg border-2 transition-all duration-200
                flex items-center gap-3 text-left
                ${isSelected
                  ? currentTheme === 'dark'
                    ? 'border-[#1D9BF0] bg-[#1D9BF0]/10'
                    : 'border-[#1D9BF0] bg-blue-50'
                  : currentTheme === 'dark'
                    ? 'border-[#2F3336] hover:border-[#3E4347] bg-[#16181C]'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }
                hover:scale-[1.02] active:scale-[0.98]
              `}
            >
              <div className={`
                w-10 h-10 rounded-lg flex items-center justify-center
                ${currentTheme === 'dark' ? 'bg-[#1D1F23]' : 'bg-gray-100'}
              `}>
                <Icon className={`w-5 h-5 ${
                  isSelected ? 'text-[#1D9BF0]' : currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`} />
              </div>
              
              <div className="flex-1">
                <h4 className={`font-medium ${
                  currentTheme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {option.name}
                </h4>
                <p className={`text-xs ${
                  currentTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {option.description}
                </p>
              </div>
              
              {/* Preview das cores */}
              <div className="flex gap-1">
                {option.colors.map((color, index) => (
                  <div
                    key={index}
                    className="w-3 h-3 rounded-full border border-gray-300"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              
              {/* Indicador de seleção */}
              {isSelected && (
                <div className="w-2 h-2 bg-[#1D9BF0] rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ThemeToggle;

