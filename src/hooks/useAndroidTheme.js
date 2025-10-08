import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { registerPlugin } from '@capacitor/core';

// Registra o plugin customizado de tema
const ThemeManager = registerPlugin('ThemeManager');

/**
 * Hook para sincronizar o tema com a barra de status e splash screen do Android
 * @param {string} currentTheme - 'light' ou 'dark'
 */
export const useAndroidTheme = (currentTheme) => {
  useEffect(() => {
    // Só executa em plataforma nativa
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const applyTheme = async () => {
      const isDark = currentTheme === 'dark';

      try {
        // 1. Usar plugin customizado para Android
        if (Capacitor.getPlatform() === 'android') {
          try {
            await ThemeManager.setTheme({ theme: currentTheme });
            console.log(`✅ Tema Android atualizado via plugin: ${currentTheme}`);
          } catch (pluginError) {
            console.warn('⚠️ Plugin customizado não disponível, usando fallback:', pluginError);
            
            // Fallback para StatusBar padrão
            // Mantém a cor azul fixa independente do tema
            await StatusBar.setStyle({
              style: Style.Light, // Sempre light para ícones brancos sobre fundo azul
            });

            await StatusBar.setBackgroundColor({
              color: '#2563eb', // Azul fixo (blue-600)
            });

            await StatusBar.setOverlaysWebView({ overlay: false });
          }
        } else if (Capacitor.getPlatform() === 'ios') {
          // iOS usa apenas StatusBar
          await StatusBar.setStyle({
            style: isDark ? Style.Dark : Style.Light,
          });
        }

        // 2. Atualizar meta tags para o tema
        updateMetaTags(isDark);

        // 3. Atualizar Splash Screen (na próxima abertura)
        updateSplashScreenConfig(isDark);

        console.log(`✅ Tema aplicado: ${currentTheme}`);
      } catch (error) {
        console.error('❌ Erro ao aplicar tema:', error);
      }
    };

    applyTheme();
  }, [currentTheme]);
};

/**
 * Atualiza as meta tags para melhor integração com o sistema Android
 */
const updateMetaTags = (isDark) => {
  // Theme color (usado pela barra de tarefas e visão geral)
  let themeColorMeta = document.querySelector('meta[name="theme-color"]');
  if (!themeColorMeta) {
    themeColorMeta = document.createElement('meta');
    themeColorMeta.name = 'theme-color';
    document.head.appendChild(themeColorMeta);
  }
  themeColorMeta.content = isDark ? '#000000' : '#FFFFFF';

  // Color scheme
  let colorSchemeMeta = document.querySelector('meta[name="color-scheme"]');
  if (!colorSchemeMeta) {
    colorSchemeMeta = document.createElement('meta');
    colorSchemeMeta.name = 'color-scheme';
    document.head.appendChild(colorSchemeMeta);
  }
  colorSchemeMeta.content = isDark ? 'dark' : 'light';

  // Apple mobile web app capable (para PWA)
  let appleMeta = document.querySelector('meta[name="apple-mobile-web-app-capable"]');
  if (!appleMeta) {
    appleMeta = document.createElement('meta');
    appleMeta.name = 'apple-mobile-web-app-capable';
    appleMeta.content = 'yes';
    document.head.appendChild(appleMeta);
  }

  // Apple status bar style
  let appleStatusBarMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
  if (!appleStatusBarMeta) {
    appleStatusBarMeta = document.createElement('meta');
    appleStatusBarMeta.name = 'apple-mobile-web-app-status-bar-style';
    document.head.appendChild(appleStatusBarMeta);
  }
  appleStatusBarMeta.content = isDark ? 'black-translucent' : 'default';
};

/**
 * Salva a preferência de tema para o Splash Screen
 * O Capacitor lerá essa configuração na próxima inicialização
 */
const updateSplashScreenConfig = (isDark) => {
  // Salva no localStorage para ser lido pelo capacitor
  localStorage.setItem('workflow-splash-theme', isDark ? 'dark' : 'light');
  
  // Atualiza a cor de fundo do body (usado durante o carregamento)
  document.body.style.backgroundColor = isDark ? '#000000' : '#FFFFFF';
  
  // Atualiza a cor de fundo do HTML root
  document.documentElement.style.backgroundColor = isDark ? '#000000' : '#FFFFFF';
};

/**
 * Esconde o splash screen manualmente quando o app estiver pronto
 */
export const hideSplashScreen = async () => {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    await SplashScreen.hide({
      fadeOutDuration: 300,
    });
    console.log('✅ Splash screen escondido');
  } catch (error) {
    console.error('❌ Erro ao esconder splash screen:', error);
  }
};

/**
 * Mostra o splash screen manualmente
 */
export const showSplashScreen = async () => {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    await SplashScreen.show({
      autoHide: false,
      fadeInDuration: 200,
    });
    console.log('✅ Splash screen mostrado');
  } catch (error) {
    console.error('❌ Erro ao mostrar splash screen:', error);
  }
};

export default useAndroidTheme;
