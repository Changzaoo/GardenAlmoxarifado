import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook para gerenciar atualizações da aplicação
 * Verifica periodicamente se há uma nova versão disponível
 */
export const useAppUpdate = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [currentVersion, setCurrentVersion] = useState(null);
  const [newVersion, setNewVersion] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const checkIntervalRef = useRef(null);
  const localVersionRef = useRef(null);

  // Carrega a versão local (embutida no build)
  const loadLocalVersion = useCallback(async () => {
    try {
      const response = await fetch('/version.json', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      const data = await response.json();
      localVersionRef.current = data;
      setCurrentVersion(data);
      return data;
    } catch (error) {
      console.error('Erro ao carregar versão local:', error);
      return null;
    }
  }, []);

  // Verifica se há uma nova versão no servidor
  const checkForUpdate = useCallback(async () => {
    if (isChecking) return;
    
    setIsChecking(true);
    
    try {
      // Adiciona timestamp para evitar cache
      const timestamp = new Date().getTime();
      const response = await fetch(`/version.json?t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {

        return false;
      }

      const serverVersion = await response.json();
      
      // Se ainda não temos a versão local, carrega
      if (!localVersionRef.current) {
        await loadLocalVersion();
      }

      // Compara as versões
      const hasUpdate = isNewerVersion(serverVersion, localVersionRef.current);
      
      if (hasUpdate) {

        setNewVersion(serverVersion);
        setUpdateAvailable(true);
        
        // Notifica o usuário
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Atualização Disponível', {
            body: 'Uma nova versão do sistema está disponível!',
            icon: '/logo192.png',
            badge: '/logo192.png',
            tag: 'app-update',
            requireInteraction: false
          });
        }
      }
      
      return hasUpdate;
    } catch (error) {
      console.error('Erro ao verificar atualizações:', error);
      return false;
    } finally {
      setIsChecking(false);
    }
  }, [isChecking, loadLocalVersion]);

  // Compara versões para determinar se há atualização
  const isNewerVersion = (serverVersion, localVersion) => {
    if (!serverVersion || !localVersion) return false;

    // Compara buildDate
    const serverDate = new Date(serverVersion.buildDate).getTime();
    const localDate = new Date(localVersion.buildDate).getTime();
    
    if (serverDate > localDate) return true;

    // Compara buildNumber se disponível
    if (serverVersion.buildNumber && localVersion.buildNumber) {
      return serverVersion.buildNumber > localVersion.buildNumber;
    }

    // Compara version string como fallback
    return compareVersionStrings(serverVersion.version, localVersion.version);
  };

  // Compara strings de versão (ex: "1.2.3" vs "1.2.4")
  const compareVersionStrings = (v1, v2) => {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const part1 = parts1[i] || 0;
      const part2 = parts2[i] || 0;
      
      if (part1 > part2) return true;
      if (part1 < part2) return false;
    }
    
    return false;
  };

  // Aplica a atualização
  const applyUpdate = useCallback(async () => {
    try {
      // Primeiro, tenta atualizar via Service Worker
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        
        if (registration && registration.waiting) {
          // Ativa o service worker em espera
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          
          // Aguarda um pouco para o SW processar
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Atualiza o registro do SW
        if (registration) {
          await registration.update();
        }
      }

      // Limpa todos os caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }

      // Limpa o localStorage de versão antiga se existir
      localStorage.removeItem('app-version');
      
      // Salva a nova versão antes de recarregar
      if (newVersion) {
        localStorage.setItem('app-version', JSON.stringify(newVersion));
      }

      // Recarrega a página forçando bypass do cache
      window.location.reload(true);
    } catch (error) {
      console.error('Erro ao aplicar atualização:', error);
      // Tenta recarregar mesmo com erro
      window.location.reload(true);
    }
  }, [newVersion]);

  // Descarta a notificação de atualização (posterga)
  const dismissUpdate = useCallback(() => {
    setUpdateAvailable(false);
    // Salva timestamp para não incomodar por um tempo
    localStorage.setItem('update-dismissed-at', Date.now().toString());
  }, []);

  // Inicia verificação periódica
  useEffect(() => {
    // Carrega versão local ao montar
    loadLocalVersion();

    // Verifica imediatamente
    const initialCheck = setTimeout(() => {
      checkForUpdate();
    }, 5000); // 5 segundos após carregar

    // Verifica a cada 5 minutos
    checkIntervalRef.current = setInterval(() => {
      checkForUpdate();
    }, 5 * 60 * 1000); // 5 minutos

    // Verifica quando a janela ganha foco
    const handleFocus = () => {
      checkForUpdate();
    };
    window.addEventListener('focus', handleFocus);

    // Verifica quando volta a ficar online
    const handleOnline = () => {
      checkForUpdate();
    };
    window.addEventListener('online', handleOnline);

    return () => {
      clearTimeout(initialCheck);
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnline);
    };
  }, [loadLocalVersion, checkForUpdate]);

  return {
    updateAvailable,
    currentVersion,
    newVersion,
    isChecking,
    checkForUpdate,
    applyUpdate,
    dismissUpdate
  };
};

export default useAppUpdate;
