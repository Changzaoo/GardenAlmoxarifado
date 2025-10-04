import { useEffect } from 'react';

/**
 * Hook para sincronizar theme-color da barra de status/navegação com o tema atual
 * Atualiza a cor da barra de notificações (Android) e status bar (iOS)
 */
export const useThemeColor = (currentTheme) => {
  useEffect(() => {
    const updateThemeColor = () => {
      const themeColorMeta = document.getElementById('theme-color-meta');
      
      if (!themeColorMeta) return;
      
      // Detectar tema atual
      let theme = currentTheme || localStorage.getItem('workflow-theme') || 'system';
      
      if (theme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        theme = prefersDark ? 'dark' : 'light';
      }
      
      // Cores para cada tema - sincronizado com Tailwind
      const colors = {
        light: '#3b82f6', // blue-500 - fundo claro
        dark: '#1f2937'   // gray-800 - fundo escuro
      };
      
      const newColor = colors[theme] || colors.light;
      
      // Atualizar meta tag
      themeColorMeta.setAttribute('content', newColor);
      
      // Atualizar também outras meta tags para garantia
      const allThemeMetas = document.querySelectorAll('meta[name="theme-color"]');
      allThemeMetas.forEach(meta => {
        if (!meta.hasAttribute('media')) {
          meta.setAttribute('content', newColor);
        }
      });
      
      // Para iOS - atualizar status bar style
      const statusBarMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
      if (statusBarMeta) {
        // black-translucent permite que o conteúdo apareça atrás da status bar
        // mas mantém legibilidade
        statusBarMeta.setAttribute('content', theme === 'dark' ? 'black-translucent' : 'default');
      }
      
      console.log(`🎨 Theme color atualizado: ${newColor} (tema: ${theme})`);
    };
    
    // Atualizar imediatamente
    updateThemeColor();
    
    // Observar mudanças no tema do sistema
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (localStorage.getItem('workflow-theme') === 'system') {
        updateThemeColor();
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [currentTheme]);
};

export default useThemeColor;
