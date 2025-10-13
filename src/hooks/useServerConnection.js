import { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';

/**
 * 🔌 Hook para Verificar Conexão com Servidor Firebase
 * Monitora status de conexão em tempo real
 */
export const useServerConnection = (serverId) => {
  const [isConnected, setIsConnected] = useState(false);
  const [latency, setLatency] = useState(null);
  const [lastCheck, setLastCheck] = useState(null);

  useEffect(() => {
    if (!serverId) return;

    let unsubscribe;
    let pingInterval;

    const checkConnection = async () => {
      try {
        const startTime = Date.now();
        const serverRef = doc(db, 'servers', serverId);
        await getDoc(serverRef);
        const endTime = Date.now();
        
        const responseTime = endTime - startTime;
        setLatency(responseTime);
        setIsConnected(true);
        setLastCheck(new Date());
      } catch (error) {
        console.error('Erro ao verificar conexão:', error);
        setIsConnected(false);
        setLatency(null);
      }
    };

    // Verificar conexão inicial
    checkConnection();

    // Monitorar mudanças em tempo real
    const serverRef = doc(db, 'servers', serverId);
    unsubscribe = onSnapshot(serverRef, 
      () => {
        setIsConnected(true);
      },
      () => {
        setIsConnected(false);
      }
    );

    // Fazer ping a cada 30 segundos
    pingInterval = setInterval(checkConnection, 30000);

    return () => {
      if (unsubscribe) unsubscribe();
      if (pingInterval) clearInterval(pingInterval);
    };
  }, [serverId]);

  return { isConnected, latency, lastCheck };
};

/**
 * 🌐 Hook para Verificar Conexão de Todos os Servidores
 */
export const useAllServersConnection = (servers) => {
  const [connectionsStatus, setConnectionsStatus] = useState({});

  useEffect(() => {
    const checkAllConnections = async () => {
      const status = {};
      
      for (const server of servers) {
        try {
          const startTime = Date.now();
          const serverRef = doc(db, 'servers', server.id);
          await getDoc(serverRef);
          const endTime = Date.now();
          
          status[server.id] = {
            isConnected: true,
            latency: endTime - startTime,
            lastCheck: new Date()
          };
        } catch (error) {
          status[server.id] = {
            isConnected: false,
            latency: null,
            lastCheck: new Date()
          };
        }
      }
      
      setConnectionsStatus(status);
    };

    if (servers.length > 0) {
      checkAllConnections();
      
      // Atualizar a cada 30 segundos
      const interval = setInterval(checkAllConnections, 30000);
      
      return () => clearInterval(interval);
    }
  }, [servers]);

  return connectionsStatus;
};
