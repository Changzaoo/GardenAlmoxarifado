/**
 * 📊 Sistema de Monitoramento de Versão e Analytics
 * 
 * Este arquivo gerencia:
 * - Versionamento automático
 * - Detecção de atualizações
 * - Coleta de dados de sistema
 * - Métricas de performance
 */

export const APP_VERSION = '1.0.0'; // Será atualizado automaticamente no build
export const BUILD_DATE = new Date().toISOString();

/**
 * Detecta informações do sistema do usuário
 */
export const getSystemInfo = () => {
  const ua = navigator.userAgent;
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  
  // Detectar SO
  let os = 'Unknown';
  if (ua.indexOf('Win') !== -1) os = 'Windows';
  else if (ua.indexOf('Mac') !== -1) os = 'MacOS';
  else if (ua.indexOf('Linux') !== -1) os = 'Linux';
  else if (ua.indexOf('Android') !== -1) os = 'Android';
  else if (ua.indexOf('iOS') !== -1 || ua.indexOf('iPhone') !== -1 || ua.indexOf('iPad') !== -1) os = 'iOS';

  // Detectar navegador e versão
  let browser = 'Unknown';
  let browserVersion = 'Unknown';
  
  if (ua.indexOf('Firefox') !== -1) {
    browser = 'Firefox';
    browserVersion = ua.match(/Firefox\/(\d+\.\d+)/)?.[1] || 'Unknown';
  } else if (ua.indexOf('SamsungBrowser') !== -1) {
    browser = 'Samsung Internet';
    browserVersion = ua.match(/SamsungBrowser\/(\d+\.\d+)/)?.[1] || 'Unknown';
  } else if (ua.indexOf('Opera') !== -1 || ua.indexOf('OPR') !== -1) {
    browser = 'Opera';
    browserVersion = ua.match(/(?:Opera|OPR)\/(\d+\.\d+)/)?.[1] || 'Unknown';
  } else if (ua.indexOf('Edg') !== -1) {
    browser = 'Microsoft Edge';
    browserVersion = ua.match(/Edg\/(\d+\.\d+)/)?.[1] || 'Unknown';
  } else if (ua.indexOf('Chrome') !== -1) {
    browser = 'Google Chrome';
    browserVersion = ua.match(/Chrome\/(\d+\.\d+)/)?.[1] || 'Unknown';
  } else if (ua.indexOf('Safari') !== -1) {
    browser = 'Safari';
    browserVersion = ua.match(/Version\/(\d+\.\d+)/)?.[1] || 'Unknown';
  }

  // Tipo de dispositivo
  const isMobile = /Mobile|Android|iPhone|iPad|iPod/.test(ua);
  const isTablet = /iPad|Android(?!.*Mobile)/.test(ua);
  const deviceType = isTablet ? 'Tablet' : (isMobile ? 'Mobile' : 'Desktop');

  // Informações de conexão
  const connectionType = connection?.effectiveType || 'Unknown';
  const downlink = connection?.downlink || null; // Mbps
  const rtt = connection?.rtt || null; // Round-trip time em ms
  const saveData = connection?.saveData || false;

  // Informações de tela
  const screenInfo = {
    width: window.screen.width,
    height: window.screen.height,
    availWidth: window.screen.availWidth,
    availHeight: window.screen.availHeight,
    colorDepth: window.screen.colorDepth,
    pixelRatio: window.devicePixelRatio || 1
  };

  // Idioma
  const language = navigator.language || (navigator as any).userLanguage;

  // Timezone
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return {
    os,
    browser,
    browserVersion,
    deviceType,
    isMobile,
    isTablet,
    userAgent: ua,
    connection: {
      type: connectionType,
      downlink: downlink ? `${downlink} Mbps` : 'Unknown',
      rtt: rtt ? `${rtt} ms` : 'Unknown',
      saveData
    },
    screen: screenInfo,
    language,
    timezone,
    timestamp: new Date().toISOString()
  };
};

/**
 * Mede a velocidade de carregamento
 */
export const getLoadPerformance = () => {
  const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  
  if (!perfData) return null;

  return {
    // Tempos de carregamento
    domainLookup: Math.round(perfData.domainLookupEnd - perfData.domainLookupStart),
    tcpConnection: Math.round(perfData.connectEnd - perfData.connectStart),
    requestTime: Math.round(perfData.responseStart - perfData.requestStart),
    responseTime: Math.round(perfData.responseEnd - perfData.responseStart),
    domProcessing: Math.round(perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart),
    loadComplete: Math.round(perfData.loadEventEnd - perfData.loadEventStart),
    
    // Tempos totais
    totalLoadTime: Math.round(perfData.loadEventEnd - perfData.fetchStart),
    domReady: Math.round(perfData.domContentLoadedEventEnd - perfData.fetchStart),
    
    // Tamanho transferido
    transferSize: perfData.transferSize || 0,
    encodedBodySize: perfData.encodedBodySize || 0,
    decodedBodySize: perfData.decodedBodySize || 0
  };
};

/**
 * Obtém geolocalização do usuário (com permissão)
 */
export const getGeolocation = (): Promise<{
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
} | null> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        });
      },
      (error) => {
        console.warn('Geolocation error:', error.message);
        resolve(null);
      },
      {
        timeout: 10000,
        maximumAge: 0,
        enableHighAccuracy: false
      }
    );
  });
};

/**
 * Obtém localização aproximada via IP (API pública)
 */
export const getLocationByIP = async (): Promise<{
  ip: string;
  city: string;
  region: string;
  country: string;
  loc: string;
  org: string;
  timezone: string;
} | null> => {
  try {
    const response = await fetch('https://ipapi.co/json/', {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    return {
      ip: data.ip,
      city: data.city,
      region: data.region,
      country: data.country_name,
      loc: `${data.latitude},${data.longitude}`,
      org: data.org || 'Unknown',
      timezone: data.timezone
    };
  } catch (error) {
    console.warn('IP location error:', error);
    return null;
  }
};

/**
 * Verifica se há uma nova versão disponível
 */
export const checkForUpdates = async (): Promise<{
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
}> => {
  try {
    // Busca o version.json do servidor (será criado no build)
    const response = await fetch('/version.json?' + Date.now(), {
      cache: 'no-cache'
    });
    
    if (!response.ok) {
      return {
        hasUpdate: false,
        currentVersion: APP_VERSION,
        latestVersion: APP_VERSION
      };
    }
    
    const data = await response.json();
    const latestVersion = data.version;
    const hasUpdate = latestVersion !== APP_VERSION;
    
    return {
      hasUpdate,
      currentVersion: APP_VERSION,
      latestVersion
    };
  } catch (error) {
    console.error('Error checking for updates:', error);
    return {
      hasUpdate: false,
      currentVersion: APP_VERSION,
      latestVersion: APP_VERSION
    };
  }
};

/**
 * Força atualização da aplicação
 */
export const forceUpdate = () => {
  // Limpar todos os caches
  if ('caches' in window) {
    caches.keys().then((names) => {
      names.forEach((name) => {
        caches.delete(name);
      });
    });
  }

  // Desregistrar service workers
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        registration.unregister();
      });
    });
  }

  // Recarregar página
  window.location.reload();
};

/**
 * Coleta todos os dados de analytics
 */
export const collectAnalytics = async () => {
  const systemInfo = getSystemInfo();
  const performance = getLoadPerformance();
  const geolocation = await getGeolocation();
  const ipLocation = await getLocationByIP();
  
  return {
    version: APP_VERSION,
    buildDate: BUILD_DATE,
    systemInfo,
    performance,
    geolocation,
    ipLocation,
    timestamp: new Date().toISOString()
  };
};
