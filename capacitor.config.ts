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
      launchShowDuration: 0,
      launchAutoHide: true,
      backgroundColor: '#ffffff',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      androidSpinnerStyle: 'large',
      iosSpinnerStyle: 'small',
      spinnerColor: '#3b82f6',
      splashFullScreen: true,
      splashImmersive: true,
      layoutName: 'launch_screen',
      useDialog: true
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
