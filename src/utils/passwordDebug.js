/**
 * 🔧 Utilitário de Senha - Debug para Administradores
 * 
 * Este arquivo fornece funções para ajudar a gerenciar senhas
 */

import CryptoJS from 'crypto-js';

const APP_SECRET = 'workflow-garden-secure-key-2025';

/**
 * Gera um hash SHA-512 para uma senha
 */
export const generateHash = (password, salt = null) => {
  const usedSalt = salt || CryptoJS.lib.WordArray.random(16).toString();
  const hash = CryptoJS.SHA512(password + usedSalt + APP_SECRET).toString();
  
  return {
    password: password,
    hash: hash,
    salt: usedSalt,
    version: 2,
    algorithm: 'SHA-512'
  };
};

/**
 * Tenta descobrir a senha testando várias opções comuns
 */
export const bruteForcePassword = (targetHash, targetSalt) => {
  const testPasswords = [
    // Senhas numéricas simples
    '123456', '123456789', '12345678', '1234567890', '123123',
    '111111', '222222', '333333', '000000', '999999',
    
    // Senhas alfabéticas
    'password', 'senha', 'admin', 'user', 'teste',
    'qwerty', 'abc123', 'abcdef', 'asdfgh', 'zxcvbn',
    
    // Nome + variações
    'ezequiel', 'Ezequiel', 'EZEQUIEL', 
    'ezequiel123', 'Ezequiel123', 'ezequiel2024', 'ezequiel2025',
    'ezequiel@123', 'ezequiel@2024', 'ezequiel@2025',
    
    // Garden relacionadas
    'garden', 'Garden', 'GARDEN', 
    'garden123', 'Garden123', 'garden2024', 'garden2025',
    'almoxarifado', 'Almoxarifado', 'almoxarifado123',
    
    // Combinações comuns
    'senha123', 'mudar123', 'trocar123', 'welcome', 'Welcome123',
    '1q2w3e4r', '1qaz2wsx', 'qwer1234', 'asdf1234',
    
    // Datas
    '01012024', '01012025', '31122024', '31122025',
    '10102024', '10102025', '20242024', '20252025',
    
    // Padrões brasileiros
    'brasil', 'Brasil', 'brasil123', 'Brazil123',
    
    // Outras comuns
    'user123', 'teste123', 'padrao123', 'temp123',
    '147258', '159357', '741852', '987654',
    
    // Senhas muito comuns em sistemas corporativos
    'master', 'Master123', 'admin123', 'Admin123',
    'sistema', 'Sistema123', 'empresa', 'Empresa123'
  ];

  console.log(`🔍 Testando ${testPasswords.length} senhas possíveis...`);
  
  for (const password of testPasswords) {
    const computedHash = CryptoJS.SHA512(password + targetSalt + APP_SECRET).toString();
    
    if (computedHash === targetHash) {
      return {
        found: true,
        password: password,
        message: `✅ Senha encontrada: "${password}"`
      };
    }
  }
  
  return {
    found: false,
    password: null,
    message: '❌ Senha não encontrada na lista. Tente adicionar mais opções ou use força bruta completa.'
  };
};

/**
 * Testa se uma senha específica gera o hash fornecido
 */
export const testPassword = (password, targetHash, targetSalt) => {
  const computedHash = CryptoJS.SHA512(password + targetSalt + APP_SECRET).toString();
  return computedHash === targetHash;
};

/**
 * Exibe informações sobre um hash
 */
export const analyzeHash = (hash, salt) => {
  return {
    hash: hash,
    hashLength: hash.length,
    salt: salt,
    saltLength: salt.length,
    algorithm: 'SHA-512',
    version: 2,
    info: 'Hash SHA-512 com salt e APP_SECRET'
  };
};

// Para usar no console do navegador:
if (typeof window !== 'undefined') {
  window.passwordDebug = {
    generateHash,
    bruteForcePassword,
    testPassword,
    analyzeHash,
    // Exemplo de uso:
    help: () => {
      console.log(`
🔧 Utilitário de Debug de Senhas

Funções disponíveis:

1. passwordDebug.generateHash("senha")
   - Gera um hash para a senha fornecida

2. passwordDebug.testPassword("senha", "hash", "salt")
   - Testa se uma senha gera o hash fornecido

3. passwordDebug.bruteForcePassword("hash", "salt")
   - Tenta descobrir a senha usando força bruta

4. passwordDebug.analyzeHash("hash", "salt")
   - Mostra informações sobre o hash

Exemplo:
  passwordDebug.bruteForcePassword(
    "861a97d64f1222bed7be2ed5fb683351469a4f03219b133b691754a5ba21cf11e22a91c92064251e4119e4c97972b195a879dd4c0889fb82814a6f3df6bd7d17",
    "6cb062ef5bed7bd85ffd16fc19847b11"
  );
      `);
    }
  };
  
  console.log('🔧 Utilitário de Debug de Senhas carregado!');
  console.log('Digite passwordDebug.help() para ver as funções disponíveis.');
}

export default {
  generateHash,
  bruteForcePassword,
  testPassword,
  analyzeHash
};
