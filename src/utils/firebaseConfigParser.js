/**
 * 🔧 Utilitário para Parse de Configuração Firebase
 * Extrai informações automaticamente de código Firebase colado
 */

/**
 * Parse de configuração Firebase colada (aceita código completo com imports)
 */
export const parseFirebaseConfig = (configText) => {
  try {
    // Remover comentários (tanto // quanto /* */)
    let cleanText = configText
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove /* */
      .replace(/\/\/.*/g, ''); // Remove //
    // Extrair valores usando regex mais flexível
    const extractValue = (key) => {
      // Tentar formato: key: "value"
      const regex1 = new RegExp(`${key}:\\s*["']([^"']+)["']`, 'i');
      const match1 = cleanText.match(regex1);
      if (match1) {
        return match1[1];
      }
      
      // Tentar formato: key = "value"
      const regex2 = new RegExp(`${key}\\s*=\\s*["']([^"']+)["']`, 'i');
      const match2 = cleanText.match(regex2);
      if (match2) {
        return match2[1];
      }
      return null;
    };

    const config = {
      apiKey: extractValue('apiKey'),
      authDomain: extractValue('authDomain'),
      projectId: extractValue('projectId'),
      storageBucket: extractValue('storageBucket'),
      messagingSenderId: extractValue('messagingSenderId'),
      appId: extractValue('appId'),
      measurementId: extractValue('measurementId')
    };

    // Validar se encontrou informações essenciais
    if (!config.projectId && !config.authDomain) {
      throw new Error('Não foi possível extrair informações do Firebase');
    }

    return config;
  } catch (error) {
    console.error('Erro ao fazer parse da configuração:', error);
    throw error;
  }
};

/**
 * Detectar região Firebase pela URL authDomain ou projectId
 */
export const detectFirebaseRegion = (config) => {
  const authDomain = config.authDomain || '';
  const projectId = config.projectId || '';
  // Mapa de regiões Firebase com coordenadas
  const regionMap = {
    // América do Norte
    'us-central1': { coords: [-93.6250, 41.2619], name: 'Iowa, EUA', country: 'EUA', flag: '🇺🇸' },
    'us-east1': { coords: [-79.8431, 33.8361], name: 'Carolina do Sul, EUA', country: 'EUA', flag: '🇺🇸' },
    'us-east4': { coords: [-77.4874, 39.0458], name: 'Virginia, EUA', country: 'EUA', flag: '🇺🇸' },
    'us-west1': { coords: [-121.9044, 45.5898], name: 'Oregon, EUA', country: 'EUA', flag: '🇺🇸' },
    'us-west2': { coords: [-118.2437, 34.0522], name: 'Los Angeles, EUA', country: 'EUA', flag: '🇺🇸' },
    'us-west3': { coords: [-111.8910, 40.7608], name: 'Utah, EUA', country: 'EUA', flag: '🇺🇸' },
    'us-west4': { coords: [-115.1398, 36.1699], name: 'Nevada, EUA', country: 'EUA', flag: '🇺🇸' },
    
    // América do Sul
    'southamerica-east1': { coords: [-46.6333, -23.5505], name: 'São Paulo, Brasil', country: 'Brasil', flag: '🇧🇷' },
    'southamerica-west1': { coords: [-70.6483, -33.4489], name: 'Santiago, Chile', country: 'Chile', flag: '🇨🇱' },
    
    // Europa
    'europe-west1': { coords: [3.8196, 50.4501], name: 'Bélgica', country: 'Bélgica', flag: '🇧🇪' },
    'europe-west2': { coords: [-0.1276, 51.5074], name: 'Londres, Inglaterra', country: 'Reino Unido', flag: '🇬🇧' },
    'europe-west3': { coords: [8.6821, 50.1109], name: 'Frankfurt, Alemanha', country: 'Alemanha', flag: '🇩🇪' },
    'europe-west4': { coords: [4.8952, 52.3702], name: 'Amsterdã, Holanda', country: 'Holanda', flag: '🇳🇱' },
    'europe-west6': { coords: [8.5417, 47.3769], name: 'Zurique, Suíça', country: 'Suíça', flag: '🇨🇭' },
    'europe-central2': { coords: [21.0122, 52.2297], name: 'Varsóvia, Polônia', country: 'Polônia', flag: '🇵🇱' },
    'europe-north1': { coords: [24.9384, 60.1699], name: 'Finlândia', country: 'Finlândia', flag: '🇫🇮' },
    
    // Ásia
    'asia-east1': { coords: [121.0654, 24.0514], name: 'Taiwan', country: 'Taiwan', flag: '🇹🇼' },
    'asia-east2': { coords: [114.1095, 22.3964], name: 'Hong Kong', country: 'Hong Kong', flag: '🇭🇰' },
    'asia-northeast1': { coords: [139.6917, 35.6762], name: 'Tóquio, Japão', country: 'Japão', flag: '🇯🇵' },
    'asia-northeast2': { coords: [126.9780, 37.5665], name: 'Seul, Coreia do Sul', country: 'Coreia do Sul', flag: '🇰🇷' },
    'asia-northeast3': { coords: [126.9780, 37.5665], name: 'Seul, Coreia do Sul', country: 'Coreia do Sul', flag: '🇰🇷' },
    'asia-south1': { coords: [72.8777, 19.0760], name: 'Mumbai, Índia', country: 'Índia', flag: '🇮🇳' },
    'asia-south2': { coords: [77.5946, 28.7041], name: 'Delhi, Índia', country: 'Índia', flag: '🇮🇳' },
    'asia-southeast1': { coords: [103.8198, 1.3521], name: 'Singapura', country: 'Singapura', flag: '🇸🇬' },
    'asia-southeast2': { coords: [106.8456, -6.2088], name: 'Jacarta, Indonésia', country: 'Indonésia', flag: '🇮🇩' },
    
    // Austrália
    'australia-southeast1': { coords: [151.2093, -33.8688], name: 'Sydney, Austrália', country: 'Austrália', flag: '🇦🇺' },
    'australia-southeast2': { coords: [144.9631, -37.8136], name: 'Melbourne, Austrália', country: 'Austrália', flag: '🇦🇺' },
    
    // Oriente Médio
    'me-west1': { coords: [34.7818, 32.0853], name: 'Tel Aviv, Israel', country: 'Israel', flag: '🇮🇱' },
    'me-central1': { coords: [50.5577, 26.0667], name: 'Bahrein', country: 'Bahrein', flag: '🇧🇭' },
    
    // África
    'africa-south1': { coords: [28.2293, -25.7479], name: 'Joanesburgo, África do Sul', country: 'África do Sul', flag: '🇿🇦' }
  };

  // Tentar detectar região pela URL
  for (const [region, data] of Object.entries(regionMap)) {
    if (authDomain.includes(region) || projectId.includes(region)) {
      return { region, ...data };
    }
  }
  
  // Detectar por padrões conhecidos do projeto
  // garden-c0b50 = Principal Brasil
  if (projectId.includes('garden-c0b50')) {
    return { region: 'southamerica-east1', ...regionMap['southamerica-east1'] };
  }
  
  // garden-backup = Backup EUA
  if (projectId.includes('garden-backup')) {
    return { region: 'us-central1', ...regionMap['us-central1'] };
  }
  
  // Tentar detectar por padrão de nome de projeto
  // Projetos brasileiros geralmente têm -br ou brasil no nome
  if (projectId.match(/br|brasil|brazil/i)) {
    return { region: 'southamerica-east1', ...regionMap['southamerica-east1'] };
  }
  
  // Backup como padrão se tiver "backup" no nome
  if (projectId.match(/backup/i)) {
    return { region: 'us-central1', ...regionMap['us-central1'] };
  }
  
  // Default: us-central1 (região padrão do Firebase)
  return { region: 'us-central1', ...regionMap['us-central1'] };
};

/**
 * Gerar nome amigável para o servidor baseado na configuração
 */
export const generateServerName = (config, regionInfo) => {
  const projectId = config.projectId || 'unknown';
  const location = regionInfo.name || regionInfo.region || 'Unknown';
  
  // Nomes específicos para os projetos Garden
  if (projectId.includes('garden-c0b50')) {
    return 'Firebase Principal';
  }
  
  if (projectId.includes('garden-backup')) {
    return 'Firebase Backup';
  }
  
  // Criar nome baseado no projectId e localização
  const baseName = projectId
    .split('-')[0]
    .replace(/[^a-zA-Z0-9]/g, '')
    .substring(0, 20);
  
  return `${baseName.charAt(0).toUpperCase() + baseName.slice(1)} - ${location}`;
};

/**
 * Criar objeto de servidor completo a partir da configuração colada
 */
export const createServerFromConfig = (configText) => {
  try {
    const config = parseFirebaseConfig(configText);
    const regionInfo = detectFirebaseRegion(config);
    const name = generateServerName(config, regionInfo);
    
    return {
      name,
      region: regionInfo.region,
      latitude: regionInfo.coords[1],
      longitude: regionInfo.coords[0],
      country: regionInfo.country,
      flag: regionInfo.flag,
      status: 'active',
      type: 'primary',
      capacity: 100,
      currentLoad: 0,
      config: {
        projectId: config.projectId,
        authDomain: config.authDomain,
        apiKey: config.apiKey ? '***' + config.apiKey.slice(-8) : null, // Ocultar API key
        autoBackup: true,
        backupInterval: 3600000,
        maxConnections: 1000
      }
    };
  } catch (error) {
    console.error('Erro ao criar servidor:', error);
    throw error;
  }
};

/**
 * Validar configuração Firebase
 */
export const validateFirebaseConfig = (config) => {
  const errors = [];
  
  if (!config.projectId) {
    errors.push('projectId é obrigatório');
  }
  
  if (!config.authDomain) {
    errors.push('authDomain é obrigatório');
  }
  
  if (config.authDomain && !config.authDomain.includes('.firebaseapp.com')) {
    errors.push('authDomain deve ser um domínio Firebase válido');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};
