/**
 * 🔓 Script para Descobrir a Senha do Ezequiel
 * 
 * Hash: 861a97d64f1222bed7be2ed5fb683351469a4f03219b133b691754a5ba21cf11e22a91c92064251e4119e4c97972b195a879dd4c0889fb82814a6f3df6bd7d17
 * Salt: 6cb062ef5bed7bd85ffd16fc19847b11
 * 
 * Algoritmo: SHA-512(password + salt + APP_SECRET)
 */

const CryptoJS = require('crypto-js');

// Configurações
const STORED_HASH = "861a97d64f1222bed7be2ed5fb683351469a4f03219b133b691754a5ba21cf11e22a91c92064251e4119e4c97972b195a879dd4c0889fb82814a6f3df6bd7d17";
const SALT = "6cb062ef5bed7bd85ffd16fc19847b11";
const APP_SECRET = "workflow-garden-secure-key-2025";

// Função para testar uma senha
function testPassword(password) {
  const computedHash = CryptoJS.SHA512(password + SALT + APP_SECRET).toString();
  return computedHash === STORED_HASH;
}

// Lista de senhas comuns para testar
const commonPasswords = [
  // Senhas simples
  '123456',
  '123456789',
  '12345678',
  '1234567',
  'password',
  '123123',
  '1234',
  '12345',
  '111111',
  
  // Nomes comuns
  'ezequiel',
  'Ezequiel',
  'EZEQUIEL',
  'ezequiel123',
  'Ezequiel123',
  
  // Variações com Garden
  'garden',
  'Garden',
  'GARDEN',
  'garden123',
  'Garden123',
  'gardenalmoxarifado',
  
  // Variações com Workflow
  'workflow',
  'Workflow',
  'WORKFLOW',
  'workflow123',
  
  // Combinações comuns
  'admin',
  'admin123',
  'Admin123',
  'senha',
  'senha123',
  'Senha123',
  'senhaforte',
  
  // Datas
  '2024',
  '2025',
  '01012024',
  '01012025',
  
  // Padrões de teclado
  'qwerty',
  'qwerty123',
  'asdfgh',
  
  // Variações com nome
  'ezequiel2024',
  'ezequiel2025',
  'eze123',
  'eze',
  
  // Senhas comuns BR
  'brasil',
  'Brasil',
  'brasil123',
  'mudar123',
  'trocar123',
  
  // Palavras relacionadas ao sistema
  'almoxarifado',
  'Almoxarifado',
  'almoxarife',
  'estoque',
  'inventario',
  
  // Mais combinações
  'ezequiel@2024',
  'ezequiel@2025',
  'ez123',
  'ezequiel!',
  'Ezequiel!',
  'Ezequiel@123',
  'ezequiel@123',
  
  // Senhas fracas comuns
  '000000',
  '112233',
  '123321',
  '654321',
  '121212',
  
  // Variações com underscore
  'ezequiel_123',
  'ezequiel_2024',
  'ezequiel_2025',
  
  // Outras
  'ez2024',
  'ez2025',
  'zequiel',
  'Zequiel'
];

console.log('🔍 Iniciando busca pela senha do Ezequiel...\n');
console.log('📊 Informações:');
console.log('   Hash:', STORED_HASH);
console.log('   Salt:', SALT);
console.log('   Algoritmo: SHA-512(password + salt + APP_SECRET)\n');
console.log(`🧪 Testando ${commonPasswords.length} senhas comuns...\n`);

let found = false;
let attempts = 0;

for (const password of commonPasswords) {
  attempts++;
  process.stdout.write(`\r⏳ Testando: ${password.padEnd(30)} (${attempts}/${commonPasswords.length})`);
  
  if (testPassword(password)) {
    console.log('\n\n✅ SENHA ENCONTRADA! 🎉\n');
    console.log('╔════════════════════════════════════╗');
    console.log('║  🔓 SENHA DO EZEQUIEL             ║');
    console.log('╠════════════════════════════════════╣');
    console.log(`║  "${password}"`.padEnd(38) + '║');
    console.log('╚════════════════════════════════════╝\n');
    found = true;
    break;
  }
}

if (!found) {
  console.log('\n\n❌ Senha não encontrada na lista de senhas comuns.\n');
  console.log('💡 Sugestões:');
  console.log('   1. A senha pode ser mais complexa');
  console.log('   2. Pode conter caracteres especiais');
  console.log('   3. Pode ser uma frase ou palavra específica');
  console.log('   4. Considere perguntar diretamente ao Ezequiel\n');
  
  // Permite testar senha customizada
  console.log('🔧 Para testar uma senha específica, use:');
  console.log('   node decrypt-ezequiel-password.js "sua_senha_aqui"\n');
} else {
  console.log('📝 Agora você pode:');
  console.log('   1. Fazer login com essa senha');
  console.log('   2. Alterar a senha do Ezequiel');
  console.log('   3. Resetar a senha se necessário\n');
}

// Se passou uma senha como argumento
if (process.argv[2]) {
  const customPassword = process.argv[2];
  console.log(`\n🧪 Testando senha customizada: "${customPassword}"`);
  
  if (testPassword(customPassword)) {
    console.log('✅ SENHA CORRETA! 🎉\n');
  } else {
    console.log('❌ Senha incorreta.\n');
  }
}

console.log('═'.repeat(50));
