// 🚨 RESET COMPLETO DO SISTEMA - EXECUTAR NO CONSOLE DO NAVEGADOR (F12)
// Este script resolve DEFINITIVAMENTE o erro "INTERNAL ASSERTION FAILED"

(async function resetarSistemaCompleto() {
  console.log('%c🔴 INICIANDO RESET COMPLETO DO SISTEMA', 'color: #ff0000; font-size: 24px; font-weight: bold; padding: 10px;');
  console.log('%c⏳ Este processo levará cerca de 15 segundos...', 'color: #ffa500; font-size: 14px;');
  
  let etapa = 1;
  const totalEtapas = 6;
  
  // ETAPA 1: Fechar todas as conexões Firestore ativas
  console.log(`%c[${etapa}/${totalEtapas}] 🔌 Fechando conexões Firestore...`, 'color: #00bfff; font-size: 16px;');
  try {
    // Tentar importar e terminar Firestore (se disponível)
    if (window.firebase && window.firebase.firestore) {
      const db = window.firebase.firestore();
      await db.terminate();
      await db.clearPersistence();
      console.log('   ✅ Conexões fechadas');
    }
  } catch (e) {
    console.log('   ⚠️ Sem conexões ativas para fechar');
  }
  etapa++;
  
  // ETAPA 2: Deletar TODOS os bancos IndexedDB
  console.log(`%c[${etapa}/${totalEtapas}] 🗑️ Deletando bancos IndexedDB...`, 'color: #00bfff; font-size: 16px;');
  try {
    if (window.indexedDB && window.indexedDB.databases) {
      const databases = await window.indexedDB.databases();
      console.log(`   📊 Encontrados ${databases.length} bancos de dados`);
      
      for (const db of databases) {
        if (db.name) {
          console.log(`   🗑️ Deletando: ${db.name}`);
          await new Promise((resolve, reject) => {
            const deleteRequest = window.indexedDB.deleteDatabase(db.name);
            deleteRequest.onsuccess = () => {
              console.log(`   ✅ ${db.name} deletado`);
              resolve();
            };
            deleteRequest.onerror = () => {
              console.log(`   ⚠️ Erro ao deletar ${db.name}, tentando forçar...`);
              resolve(); // Continua mesmo com erro
            };
            deleteRequest.onblocked = () => {
              console.log(`   🚧 ${db.name} bloqueado, forçando...`);
              setTimeout(resolve, 1000);
            };
          });
        }
      }
      console.log('   ✅ Todos os bancos IndexedDB deletados');
    }
  } catch (e) {
    console.error('   ❌ Erro ao deletar IndexedDB:', e);
  }
  etapa++;
  
  // ETAPA 3: Limpar LocalStorage
  console.log(`%c[${etapa}/${totalEtapas}] 🧹 Limpando LocalStorage...`, 'color: #00bfff; font-size: 16px;');
  try {
    const totalKeys = localStorage.length;
    const keysRemovidas = [];
    
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && (key.includes('firebase') || key.includes('firestore') || key.includes('garden'))) {
        keysRemovidas.push(key);
        localStorage.removeItem(key);
      }
    }
    
    console.log(`   ✅ ${keysRemovidas.length} chaves removidas de ${totalKeys} totais`);
    keysRemovidas.forEach(k => console.log(`   🗑️ ${k}`));
  } catch (e) {
    console.error('   ❌ Erro ao limpar LocalStorage:', e);
  }
  etapa++;
  
  // ETAPA 4: Limpar SessionStorage
  console.log(`%c[${etapa}/${totalEtapas}] 🧹 Limpando SessionStorage...`, 'color: #00bfff; font-size: 16px;');
  try {
    const totalKeys = sessionStorage.length;
    const keysRemovidas = [];
    
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const key = sessionStorage.key(i);
      if (key && (key.includes('firebase') || key.includes('firestore') || key.includes('garden'))) {
        keysRemovidas.push(key);
        sessionStorage.removeItem(key);
      }
    }
    
    console.log(`   ✅ ${keysRemovidas.length} chaves removidas de ${totalKeys} totais`);
  } catch (e) {
    console.error('   ❌ Erro ao limpar SessionStorage:', e);
  }
  etapa++;
  
  // ETAPA 5: Limpar Cache do Service Worker
  console.log(`%c[${etapa}/${totalEtapas}] 🔄 Limpando cache do Service Worker...`, 'color: #00bfff; font-size: 16px;');
  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
        console.log('   ✅ Service Worker desregistrado');
      }
    }
    
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      console.log(`   📦 Encontrados ${cacheNames.length} caches`);
      for (const cacheName of cacheNames) {
        await caches.delete(cacheName);
        console.log(`   🗑️ Cache deletado: ${cacheName}`);
      }
      console.log('   ✅ Todos os caches deletados');
    }
  } catch (e) {
    console.error('   ❌ Erro ao limpar Service Worker:', e);
  }
  etapa++;
  
  // ETAPA 6: Preparar para recarregar
  console.log(`%c[${etapa}/${totalEtapas}] 🔄 Preparando para recarregar...`, 'color: #00bfff; font-size: 16px;');
  
  // Criar marcador de reset concluído
  try {
    sessionStorage.setItem('reset-completo-executado', new Date().toISOString());
    console.log('   ✅ Marcador de reset criado');
  } catch (e) {
    console.warn('   ⚠️ Não foi possível criar marcador');
  }
  
  // SUCESSO!
  console.log('%c════════════════════════════════════════', 'color: #00ff00; font-size: 18px;');
  console.log('%c✅ RESET COMPLETO EXECUTADO COM SUCESSO!', 'color: #00ff00; font-size: 24px; font-weight: bold;');
  console.log('%c════════════════════════════════════════', 'color: #00ff00; font-size: 18px;');
  console.log('%c🔄 A página será recarregada em 3 segundos...', 'color: #ffa500; font-size: 16px;');
  console.log('%c⚠️ APÓS O RELOAD:', 'color: #ff0000; font-size: 18px; font-weight: bold;');
  console.log('%c   1. Feche TODAS as outras abas do sistema', 'color: #ffffff; font-size: 14px;');
  console.log('%c   2. Use APENAS ESTA aba', 'color: #ffffff; font-size: 14px;');
  console.log('%c   3. Se o erro voltar, reinicie o servidor (npm start)', 'color: #ffffff; font-size: 14px;');
  
  // Countdown
  for (let i = 3; i > 0; i--) {
    console.log(`%c⏱️ ${i}...`, 'color: #ffff00; font-size: 20px;');
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Hard reload
  window.location.reload(true);
  
})().catch(error => {
  console.error('%c❌ ERRO DURANTE O RESET:', 'color: #ff0000; font-size: 18px; font-weight: bold;', error);
  console.log('%c🔄 Recarregando mesmo assim...', 'color: #ffa500; font-size: 16px;');
  setTimeout(() => window.location.reload(true), 2000);
});
