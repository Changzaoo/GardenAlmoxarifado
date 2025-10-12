import { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';

/**
 * 🔧 Hook para Gerenciamento Completo de Servidores
 * - Monitora servidores em tempo real
 * - Sistema de rotação de backup
 * - Análise de uso por período
 * - Adiciona/remove servidores dinamicamente
 */
export const useServerManagement = () => {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [backupRotation, setBackupRotation] = useState(null);
  const [usageStats, setUsageStats] = useState({});

  // Carregar servidores em tempo real do Firestore
  useEffect(() => {
    const serversRef = collection(db, 'servers');
    const q = query(serversRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const serverList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          lastBackup: doc.data().lastBackup?.toDate(),
          lastUsed: doc.data().lastUsed?.toDate()
        }));
        
        setServers(serverList);
        calculateUsageStats(serverList);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching servers:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Sistema de rotação de backup automático
  useEffect(() => {
    if (servers.length === 0) return;

    const rotateBackup = () => {
      const sortedByLastBackup = [...servers].sort((a, b) => {
        const dateA = a.lastBackup || new Date(0);
        const dateB = b.lastBackup || new Date(0);
        return dateA - dateB;
      });

      const currentServer = sortedByLastBackup[0];
      const nextServer = sortedByLastBackup[1] || sortedByLastBackup[0];
      
      setBackupRotation({
        current: currentServer,
        next: nextServer,
        rotation: sortedByLastBackup.map(s => s.id)
      });

      return currentServer;
    };

    const interval = setInterval(() => {
      const serverToBackup = rotateBackup();
      if (serverToBackup) {
        performBackup(serverToBackup.id);
      }
    }, 60000); // Rotaciona a cada 1 minuto

    rotateBackup(); // Executa imediatamente

    return () => clearInterval(interval);
  }, [servers]);

  // Calcular estatísticas de uso por período
  const calculateUsageStats = (serverList) => {
    const now = new Date();
    const stats = {};

    serverList.forEach(server => {
      const usage = server.usage || [];
      
      stats[server.id] = {
        today: filterUsageByPeriod(usage, 'day', now),
        week: filterUsageByPeriod(usage, 'week', now),
        month: filterUsageByPeriod(usage, 'month', now),
        total: usage.length,
        avgResponseTime: calculateAvgResponseTime(usage),
        uptime: calculateUptime(server)
      };
    });

    setUsageStats(stats);
  };

  // Filtrar uso por período
  const filterUsageByPeriod = (usage, period, referenceDate) => {
    const periodMs = {
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000
    };

    const cutoffDate = new Date(referenceDate.getTime() - periodMs[period]);
    
    return usage.filter(u => {
      const usageDate = u.timestamp?.toDate ? u.timestamp.toDate() : new Date(u.timestamp);
      return usageDate >= cutoffDate;
    }).length;
  };

  // Calcular tempo médio de resposta
  const calculateAvgResponseTime = (usage) => {
    if (!usage || usage.length === 0) return 0;
    
    const responseTimes = usage
      .filter(u => u.responseTime)
      .map(u => u.responseTime);
    
    if (responseTimes.length === 0) return 0;
    
    return responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
  };

  // Calcular uptime do servidor
  const calculateUptime = (server) => {
    if (!server.createdAt) return 100;
    
    const totalTime = Date.now() - server.createdAt.getTime();
    const downtime = server.downtime || 0;
    
    return ((totalTime - downtime) / totalTime * 100).toFixed(2);
  };

  // Adicionar novo servidor
  const addServer = async (serverData) => {
    try {
      const newServer = {
        name: serverData.name,
        region: serverData.region,
        latitude: serverData.latitude,
        longitude: serverData.longitude,
        status: 'active',
        type: serverData.type || 'primary',
        capacity: serverData.capacity || 100,
        currentLoad: 0,
        createdAt: serverTimestamp(),
        lastBackup: null,
        lastUsed: serverTimestamp(),
        usage: [],
        downtime: 0,
        config: {
          autoBackup: true,
          backupInterval: 3600000, // 1 hora
          maxConnections: 1000,
          ...serverData.config
        }
      };

      const docRef = await addDoc(collection(db, 'servers'), newServer);
      
      return { id: docRef.id, ...newServer };
    } catch (err) {
      console.error('Error adding server:', err);
      throw err;
    }
  };

  // Atualizar servidor
  const updateServer = async (serverId, updates) => {
    try {
      const serverRef = doc(db, 'servers', serverId);
      await updateDoc(serverRef, {
        ...updates,
        lastUsed: serverTimestamp()
      });
    } catch (err) {
      console.error('Error updating server:', err);
      throw err;
    }
  };

  // Remover servidor
  const removeServer = async (serverId) => {
    try {
      await deleteDoc(doc(db, 'servers', serverId));
    } catch (err) {
      console.error('Error removing server:', err);
      throw err;
    }
  };

  // Realizar backup
  const performBackup = async (serverId) => {
    try {
      const serverRef = doc(db, 'servers', serverId);
      await updateDoc(serverRef, {
        lastBackup: serverTimestamp(),
        backupCount: (servers.find(s => s.id === serverId)?.backupCount || 0) + 1
      });
    } catch (err) {
      console.error('Error performing backup:', err);
    }
  };

  // Registrar uso do servidor
  const recordUsage = async (serverId, responseTime) => {
    try {
      const server = servers.find(s => s.id === serverId);
      if (!server) return;

      const usage = server.usage || [];
      usage.push({
        timestamp: Timestamp.now(),
        responseTime,
        load: server.currentLoad || 0
      });

      // Manter apenas últimos 1000 registros
      if (usage.length > 1000) {
        usage.shift();
      }

      await updateServer(serverId, { usage });
    } catch (err) {
      console.error('Error recording usage:', err);
    }
  };

  // Obter servidor menos utilizado (para balanceamento)
  const getLeastUsedServer = () => {
    if (servers.length === 0) return null;

    return servers.reduce((least, server) => {
      const leastLoad = least.currentLoad || 0;
      const serverLoad = server.currentLoad || 0;
      return serverLoad < leastLoad ? server : least;
    });
  };

  // Obter estatísticas gerais
  const getOverallStats = () => {
    return {
      totalServers: servers.length,
      activeServers: servers.filter(s => s.status === 'active').length,
      totalCapacity: servers.reduce((sum, s) => sum + (s.capacity || 0), 0),
      averageLoad: servers.reduce((sum, s) => sum + (s.currentLoad || 0), 0) / servers.length || 0,
      totalBackups: servers.reduce((sum, s) => sum + (s.backupCount || 0), 0)
    };
  };

  return {
    servers,
    loading,
    error,
    backupRotation,
    usageStats,
    addServer,
    updateServer,
    removeServer,
    recordUsage,
    getLeastUsedServer,
    getOverallStats
  };
};
