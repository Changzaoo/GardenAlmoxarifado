import { db } from '../firebaseConfig';
import { collection, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';

/**
 * 🔧 Script para Adicionar os Servidores "Firebase Principal" e "Firebase Backup"
 */

const serversToAdd = [
  {
    name: 'Firebase Principal',
    projectId: 'garden-c0b50',
    region: 'southamerica-east1',
    latitude: -23.5505,
    longitude: -46.6333,
    status: 'active',
    type: 'primary',
    capacity: 100,
    currentLoad: 0,
    country: 'Brasil',
    flag: '🇧🇷',
    config: {
      projectId: 'garden-c0b50',
      authDomain: 'garden-c0b50.firebaseapp.com',
      autoBackup: true,
      backupInterval: 3600000,
      maxConnections: 1000
    }
  },
  {
    name: 'Firebase Backup',
    projectId: 'garden-backup',
    region: 'us-central1',
    latitude: 41.2619,
    longitude: -93.6250,
    status: 'active',
    type: 'backup',
    capacity: 100,
    currentLoad: 0,
    country: 'EUA',
    flag: '🇺🇸',
    config: {
      projectId: 'garden-backup',
      authDomain: 'garden-backup.firebaseapp.com',
      autoBackup: true,
      backupInterval: 7200000,
      maxConnections: 1000
    }
  }
];

export const addGardenServers = async () => {
  try {
    const serversRef = collection(db, 'servers');
    const snapshot = await getDocs(serversRef);
    // Se já existem servidores, não adicionar duplicados
    const existingProjects = new Set();
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.projectId) {
        existingProjects.add(data.projectId);
      }
    });
    
    let addedCount = 0;
    
    for (const server of serversToAdd) {
      if (existingProjects.has(server.projectId)) {
        continue;
      }
      
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
      addedCount++;
    }
    
    if (addedCount === 0) {
    } else {
    }
    
    return { success: true, added: addedCount, existing: snapshot.size };
    
  } catch (error) {
    console.error('❌ Erro ao adicionar servidores:', error);
    return { success: false, error: error.message };
  }
};

// Executar automaticamente se chamado diretamente
if (typeof window !== 'undefined' && window.location.search.includes('add-garden-servers')) {
  addGardenServers();
}
