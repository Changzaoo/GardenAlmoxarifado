// ⚡ SOLUÇÃO IMEDIATA - Cole no Console do Navegador (F12)
// Este código limpa o cache do Firestore AGORA

(async function limparCacheFirestoreAgora() {
  console.log('%c🆘 LIMPEZA DE EMERGÊNCIA INICIADA', 'background: #f00; color: #fff; font-size: 20px; padding: 10px;');
  
  try {
    // Passo 1: Deletar todos os bancos IndexedDB do Firestore
    console.log('🗑️ Deletando bancos IndexedDB...');
    
    if (window.indexedDB && window.indexedDB.databases) {
      const databases = await window.indexedDB.databases();
      console.log('📊 Bancos encontrados:', databases.length);
      
      for (const dbInfo of databases) {
        if (dbInfo.name && (
          dbInfo.name.includes('firestore') ||
          dbInfo.name.includes('firebase') ||
          dbInfo.name.includes('garden-c0b50')
        )) {
          console.log(`🗑️ Deletando: ${dbInfo.name}`);
          const deleteRequest = window.indexedDB.deleteDatabase(dbInfo.name);
          
          await new Promise((resolve, reject) => {
            deleteRequest.onsuccess = () => {
              console.log(`✅ ${dbInfo.name} deletado`);
              resolve();
            };
            deleteRequest.onerror = (e) => {
              console.error(`❌ Erro ao deletar ${dbInfo.name}:`, e);
              resolve(); // Continuar mesmo com erro
            };
            deleteRequest.onblocked = () => {
              console.warn(`⚠️ ${dbInfo.name} está bloqueado, mas será deletado ao fechar`);
              resolve();
            };
          });
        }
      }
    }
    
    // Passo 2: Limpar localStorage relacionado
    console.log('🧹 Limpando localStorage...');
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.includes('firebase') ||
        key.includes('firestore') ||
        key.includes('garden-c0b50')
      )) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => {
      console.log(`🗑️ Removendo localStorage: ${key}`);
      localStorage.removeItem(key);
    });
    
    // Passo 3: Limpar sessionStorage relacionado
    console.log('🧹 Limpando sessionStorage...');
    const sessionKeysToRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && (
        key.includes('firebase') ||
        key.includes('firestore') ||
        key.includes('garden-c0b50')
      )) {
        sessionKeysToRemove.push(key);
      }
    }
    sessionKeysToRemove.forEach(key => {
      console.log(`🗑️ Removendo sessionStorage: ${key}`);
      sessionStorage.removeItem(key);
    });
    
    // Passo 4: Limpar Service Workers
    if ('serviceWorker' in navigator) {
      console.log('🧹 Limpando Service Workers...');
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        console.log('🗑️ Desregistrando Service Worker:', registration.scope);
        await registration.unregister();
      }
    }
    
    // Passo 5: Limpar Cache API
    if ('caches' in window) {
      console.log('🧹 Limpando Cache API...');
      const cacheNames = await caches.keys();
      for (const cacheName of cacheNames) {
        console.log('🗑️ Deletando cache:', cacheName);
        await caches.delete(cacheName);
      }
    }
    
    console.log('%c✅ LIMPEZA COMPLETA!', 'background: #0f0; color: #000; font-size: 20px; padding: 10px;');
    console.log('%c🔄 Recarregando em 3 segundos...', 'background: #00f; color: #fff; font-size: 16px; padding: 8px;');
    
    // Aguardar 3 segundos e recarregar
    setTimeout(() => {
      console.log('%c🔄 RECARREGANDO PÁGINA...', 'background: #f0f; color: #fff; font-size: 20px; padding: 10px;');
      window.location.reload(true); // Force reload
    }, 3000);
    
  } catch (error) {
    console.error('%c❌ ERRO NA LIMPEZA:', 'background: #f00; color: #fff; font-size: 16px; padding: 8px;', error);
    console.log('%c🔄 Recarregando mesmo assim...', 'background: #f80; color: #fff; font-size: 16px; padding: 8px;');
    
    setTimeout(() => {
      window.location.reload(true);
    }, 2000);
  }
})();

// ✅ Script executado! Aguarde a limpeza e o reload automático.
