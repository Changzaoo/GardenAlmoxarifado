import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'br.workflow.app',
  appName: 'Workflow',
  webDir: 'build',
  
  // Configurações de tema e aparência
  backgroundColor: '#ffffff',
  
  // Plugins
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    SplashScreen: {
      launchShowDuration: 500,
      launchAutoHide: true,
      launchFadeOutDuration: 300,
      backgroundColor: '#000000', // Será sobrescrito pelo tema
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      androidSpinnerStyle: 'large',
      iosSpinnerStyle: 'small',
      spinnerColor: '#1D9BF0',
      splashFullScreen: false,
      splashImmersive: false,
      layoutName: 'launch_screen',
      useDialog: false
    },
    StatusBar: {
      style: 'dark', // Será sobrescrito pelo tema
      backgroundColor: '#000000', // Será sobrescrito pelo tema
      overlaysWebView: false
    }
  },
  
  // Configurações específicas do Android
  android: {
    backgroundColor: '#ffffff',
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false
  },
  
  // Configurações do servidor (desenvolvimento)
  server: {
    androidScheme: 'https',
    cleartext: false,
    allowNavigation: ['*']
  }
};

export default config;
