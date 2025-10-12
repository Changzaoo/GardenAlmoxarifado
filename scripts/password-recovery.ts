/**
 * 🔓 Script de Recuperação de Senha
 * 
 * Este script tenta descobrir a senha original através de força bruta
 * usando senhas comuns para o hash SHA-512 fornecido.
 */

import CryptoJS from 'crypto-js';

const APP_SECRET = 'workflow-garden-secure-key-2025';

// Dados do Ezequiel
const targetHash = '861a97d64f1222bed7be2ed5fb683351469a4f03219b133b691754a5ba21cf11e22a91c92064251e4119e4c97972b195a879dd4c0889fb82814a6f3df6bd7d17';
const targetSalt = '6cb062ef5bed7bd85ffd16fc19847b11';

// Lista de senhas comuns para testar
const commonPasswords = [
  // Senhas simples
  '123456', '123456789', '12345678', 'password', '1234567890',
  'qwerty', 'abc123', '111111', '123123', 'admin',
  
  // Variações com nome
  'ezequiel', 'Ezequiel', 'EZEQUIEL', 'ezequiel123', 'Ezequiel123',
  'ezequiel2024', 'ezequiel2025', 'ezequiel@123',
  
  // Garden relacionadas
  'garden', 'Garden', 'GARDEN', 'garden123', 'Garden123',
  'garden2024', 'garden2025', 'almoxarifado', 'Almoxarifado',
  
  // Senhas brasileiras comuns
  'senha', 'senha123', 'mudar123', 'trocar123',
  
  // Datas comuns
  '01012024', '01012025', '10102024', '10102025',
  
  // Padrões de teclado
  'qwerty123', 'asdfgh', 'zxcvbn', '1qaz2wsx',
  
  // Outras comuns
  'welcome', 'Welcome123', 'user123', 'teste', 'teste123'
];

console.log('🔍 Iniciando busca pela senha original...\n');
console.log('📊 Dados fornecidos:');
console.log('Hash:', targetHash);
console.log('Salt:', targetSalt);
console.log(`\n🔑 Testando ${commonPasswords.length} senhas comuns...\n`);

let found = false;

for (const password of commonPasswords) {
  // Gera o hash da mesma forma que o sistema faz
  const computedHash = CryptoJS.SHA512(password + targetSalt + APP_SECRET).toString();
  
  if (computedHash === targetHash) {
    console.log('✅ SENHA ENCONTRADA!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🔓 Senha original: "${password}"`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    found = true;
    break;
  }
}

if (!found) {
  console.log('❌ Senha não encontrada na lista de senhas comuns.');
  console.log('\n💡 Sugestões:');
  console.log('1. A senha pode ser mais complexa');
  console.log('2. Adicione mais senhas ao array commonPasswords');
  console.log('3. Use força bruta com mais combinações');
  console.log('4. Verifique se o APP_SECRET está correto');
  console.log('\n📝 Para adicionar a senha manualmente:');
  console.log('   Use a função encryptPassword("sua_senha") no sistema');
}

export { targetHash, targetSalt, commonPasswords };
