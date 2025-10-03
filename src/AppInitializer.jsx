import React, { useEffect, useState } from 'react';
import { useDevToolsProtection } from './hooks/useDevToolsProtection';

/**
 * Sistema de Inicialização com Loading adaptado ao tema
 */
const AppInitializer = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [theme, setTheme] = useState('light');
  
  // Anti-DevTools protection
  const devToolsDetected = useDevToolsProtection();

  useEffect(() => {
    // Detectar tema do sistema
    const savedTheme = localStorage.getItem('workflow-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    let currentTheme = 'light';
    if (savedTheme === 'dark' || (savedTheme === 'system' && prefersDark) || (!savedTheme && prefersDark)) {
      currentTheme = 'dark';
    }
    
    setTheme(currentTheme);

    // Aplicar tema ao body
    if (currentTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Simular carregamento mínimo
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // Se DevTools detectado, não renderizar nada (bloqueio é feito no hook)
  if (devToolsDetected) {
    return null;
  }

  // Tela de loading com tema
  if (isLoading) {
    return (
      <div 
        className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
          theme === 'dark' 
            ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
            : 'bg-gradient-to-br from-blue-50 via-white to-purple-50'
        }`}
      >
        <div className="text-center">
          {/* Logo com animação */}
          <div className="w-24 h-24 mx-auto mb-6 animate-bounce">
            <img 
              src="/logo.png" 
              alt="Workflow" 
              className="w-full h-full object-contain"
              style={{
                filter: theme === 'dark' 
                  ? 'drop-shadow(0 0 20px rgba(59, 130, 246, 0.5))' 
                  : 'drop-shadow(0 0 20px rgba(59, 130, 246, 0.3))'
              }}
            />
          </div>

          {/* Spinner */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <div 
              className={`w-3 h-3 rounded-full animate-pulse ${
                theme === 'dark' ? 'bg-blue-400' : 'bg-blue-500'
              }`} 
              style={{ animationDelay: '0ms' }}
            ></div>
            <div 
              className={`w-3 h-3 rounded-full animate-pulse ${
                theme === 'dark' ? 'bg-purple-400' : 'bg-purple-500'
              }`}
              style={{ animationDelay: '150ms' }}
            ></div>
            <div 
              className={`w-3 h-3 rounded-full animate-pulse ${
                theme === 'dark' ? 'bg-pink-400' : 'bg-pink-500'
              }`}
              style={{ animationDelay: '300ms' }}
            ></div>
          </div>

          {/* Texto */}
          <p className={`text-sm font-medium ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Carregando Workflow...
          </p>
        </div>
      </div>
    );
  }

  // Renderizar aplicação
  return <>{children}</>;
};

export default AppInitializer;
