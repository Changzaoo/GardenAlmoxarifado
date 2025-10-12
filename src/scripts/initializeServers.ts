import { db } from '../firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * 🔧 Script para Inicializar os 3 Servidores Padrão
 * Executa uma vez para criar os servidores iniciais no Firestore
 */

const defaultServers = [
  {
    name: 'Servidor Principal Brasil',
    region: 'southamerica-east1',
    latitude: -23.5505,
    longitude: -46.6333,
    status: 'active',
    type: 'primary',
    capacity: 100,
    currentLoad: 35,
    country: 'Brasil',
    flag: '🇧🇷',
    config: {
      autoBackup: true,
      backupInterval: 3600000, // 1 hora
      maxConnections: 1000
    }
  },
  {
    name: 'Servidor Backup EUA',
    region: 'us-central1',
    latitude: 41.2619,
    longitude: -93.6250,
    status: 'active',
    type: 'backup',
    capacity: 150,
    currentLoad: 28,
    country: 'EUA',
    flag: '🇺🇸',
    config: {
      autoBackup: true,
      backupInterval: 7200000, // 2 horas
      maxConnections: 1500
    }
  },
  {
    name: 'Servidor Europa',
    region: 'europe-west1',
    latitude: 50.4501,
    longitude: 3.8196,
    status: 'active',
    type: 'primary',
    capacity: 120,
    currentLoad: 42,
    country: 'Bélgica',
    flag: '🇧🇪',
    config: {
      autoBackup: true,
      backupInterval: 3600000, // 1 hora
      maxConnections: 1200
    }
  }
];

export const initializeDefaultServers = async () => {
  try {
    const serversRef = collection(db, 'servers');
    
    for (const server of defaultServers) {
      const serverData = {
        ...server,
        createdAt: serverTimestamp(),
        lastBackup: null,
        lastUsed: serverTimestamp(),
        usage: [],
        downtime: 0,
        backupCount: 0
      };
      
      const docRef = await addDoc(serversRef, serverData);
    }
    return { success: true, count: defaultServers.length };
    
  } catch (error) {
    console.error('❌ Erro ao inicializar servidores:', error);
    return { success: false, error: error.message };
  }
};

// Executar automaticamente se chamado diretamente
if (typeof window !== 'undefined' && window.location.search.includes('init-servers')) {
  initializeDefaultServers();
}
