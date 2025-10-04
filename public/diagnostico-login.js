// Script de diagnóstico de login
// Execute no console do navegador (F12)

console.log('🔍 DIAGNÓSTICO DE LOGIN - Garden Almoxarifado\n');

// Verificar localStorage
console.log('📦 LocalStorage:');
console.log('- usuarios:', localStorage.getItem('usuarios'));
console.log('- usuario-atual:', localStorage.getItem('usuario-atual'));
console.log('');

// Verificar cookies
console.log('🍪 Cookies:');
document.cookie.split(';').forEach(cookie => {
  console.log('  ', cookie.trim());
});
console.log('');

// Verificar service worker
console.log('⚙️ Service Worker:');
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    console.log('- Registros ativos:', registrations.length);
    registrations.forEach((reg, i) => {
      console.log(`  ${i+1}. Scope: ${reg.scope}`);
      console.log(`     Estado: ${reg.active ? 'Ativo' : 'Inativo'}`);
    });
  });
} else {
  console.log('- Service Worker não suportado');
}
console.log('');

// Verificar IndexedDB
console.log('💾 IndexedDB:');
if ('indexedDB' in window) {
  indexedDB.databases().then(dbs => {
    console.log('- Databases:', dbs.length);
    dbs.forEach((db, i) => {
      console.log(`  ${i+1}. ${db.name} (versão ${db.version})`);
    });
  }).catch(() => {
    console.log('- Não foi possível listar databases');
  });
} else {
  console.log('- IndexedDB não suportado');
}
console.log('');

// Verificar Cache API
console.log('📂 Cache API:');
if ('caches' in window) {
  caches.keys().then(cacheNames => {
    console.log('- Caches:', cacheNames.length);
    cacheNames.forEach((name, i) => {
      console.log(`  ${i+1}. ${name}`);
    });
  });
} else {
  console.log('- Cache API não suportado');
}
console.log('');

// Credenciais padrão
console.log('🔑 CREDENCIAIS PADRÃO PARA TESTE:\n');
console.log('══════════════════════════════════════');
console.log('ADMIN:');
console.log('  Email/Usuário: admin');
console.log('  Senha: admin@362*');
console.log('');
console.log('GERENTE:');
console.log('  Email/Usuário: joao');
console.log('  Senha: 123456');
console.log('');
console.log('SUPERVISOR:');
console.log('  Email/Usuário: maria');
console.log('  Senha: 123456');
console.log('');
console.log('FUNCIONÁRIO:');
console.log('  Email/Usuário: pedro');
console.log('  Senha: 123456');
console.log('══════════════════════════════════════\n');

// Função para limpar tudo
console.log('🧹 Para limpar TUDO e começar do zero, execute:');
console.log('%climparTudo()', 'color: #ff6b6b; font-weight: bold; font-size: 14px;');
console.log('');

window.limparTudo = async function() {
  console.log('🗑️ Limpando todos os dados...');
  
  // Limpar localStorage
  localStorage.clear();
  console.log('✅ LocalStorage limpo');
  
  // Limpar cookies
  document.cookie.split(";").forEach(function(c) { 
    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
  });
  console.log('✅ Cookies limpos');
  
  // Limpar IndexedDB
  if ('indexedDB' in window) {
    const dbs = await indexedDB.databases();
    for (const db of dbs) {
      indexedDB.deleteDatabase(db.name);
    }
    console.log('✅ IndexedDB limpo');
  }
  
  // Limpar caches
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    for (const name of cacheNames) {
      await caches.delete(name);
    }
    console.log('✅ Caches limpos');
  }
  
  // Desregistrar service workers
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      await registration.unregister();
    }
    console.log('✅ Service Workers desregistrados');
  }
  
  console.log('\n✨ Tudo limpo! Recarregue a página (F5) para começar do zero.\n');
  
  // Recarregar após 2 segundos
  setTimeout(() => {
    window.location.reload(true);
  }, 2000);
};

console.log('💡 DICA: Se o login não funcionar:');
console.log('   1. Execute limparTudo() no console');
console.log('   2. Aguarde a página recarregar');
console.log('   3. Tente fazer login novamente com as credenciais acima');
console.log('');
