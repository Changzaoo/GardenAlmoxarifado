import { useState, useEffect } from 'react';

/**
 * Hook para detectar status de conexão online/offline
 * Atualiza em tempo real quando o status muda
 */
export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      console.log('🟢 Conexão restaurada');
      setIsOnline(true);
      setWasOffline(true);
      
      // Limpar flag após 3 segundos
      setTimeout(() => setWasOffline(false), 3000);
    };

    const handleOffline = () => {
      console.log('🔴 Conexão perdida - Modo offline ativado');
      setIsOnline(false);
    };

    // Listeners de eventos do navegador
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Verificação periódica (backup)
    const intervalId = setInterval(() => {
      const online = navigator.onLine;
      if (online !== isOnline) {
        setIsOnline(online);
        if (online) {
          console.log('🟢 Conexão detectada (verificação periódica)');
          setWasOffline(true);
          setTimeout(() => setWasOffline(false), 3000);
        } else {
          console.log('🔴 Desconexão detectada (verificação periódica)');
        }
      }
    }, 5000); // Verifica a cada 5 segundos

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, [isOnline]);

  return { isOnline, wasOffline };
};
