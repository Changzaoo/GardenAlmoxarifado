console.log('=== TESTE DE IMPORTAÇÃO ===');
try {
  const { db, auth, storage, primaryDb } = require('./src/config/firebaseMulti.js');
  console.log('db:', db);
  console.log('auth:', auth);
  console.log('storage:', storage);
  console.log('primaryDb:', primaryDb);
} catch (error) {
  console.error('ERRO:', error.message);
  console.error('Stack:', error.stack);
}
