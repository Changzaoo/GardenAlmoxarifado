import CryptoJS from 'crypto-js';

// A chave secreta deve vir das variáveis de ambiente
if (!process.env.REACT_APP_CRYPTO_SECRET) {
  throw new Error('REACT_APP_CRYPTO_SECRET environment variable is not set');
}

const APP_SECRET = process.env.REACT_APP_CRYPTO_SECRET;
const SALT_ITERATIONS = 10000; // Número de iterações para derivação da chave
const KEY_SIZE = 256; // Tamanho da chave em bits
const IV_SIZE = 128; // Tamanho do vetor de inicialização em bits

// Função para gerar um salt seguro
const generateSecureSalt = () => {
  return CryptoJS.lib.WordArray.random(16).toString();
};

// Função para derivar uma chave segura usando PBKDF2
const deriveKey = (password, salt) => {
  return CryptoJS.PBKDF2(password, salt, {
    keySize: KEY_SIZE / 32,
    iterations: SALT_ITERATIONS
  });
};

// Função para encriptar dados
export const encryptData = (data, customSalt = '') => {
  try {
    const key = generateEncryptionKey(customSalt);
    const jsonStr = JSON.stringify(data);
    
    // Adiciona metadados para validação
    const dataWithMeta = {
      data: jsonStr,
      timestamp: Date.now(),
      appSignature: CryptoJS.SHA512(APP_SECRET).toString().slice(0, 32)
    };

    const encrypted = CryptoJS.AES.encrypt(
      JSON.stringify(dataWithMeta),
      key
    ).toString();

    return {
      content: encrypted,
      salt: customSalt,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('Erro ao encriptar dados:', error);
    throw new Error('Falha na encriptação dos dados');
  }
};

// Função para decriptar dados
export const decryptData = (encryptedData, customSalt = '') => {
  try {
    const { content, timestamp } = encryptedData;
    const key = generateEncryptionKey(customSalt);

    const decrypted = CryptoJS.AES.decrypt(content, key);
    const decryptedStr = decrypted.toString(CryptoJS.enc.Utf8);
    const parsedData = JSON.parse(decryptedStr);

    // Verifica a assinatura do aplicativo
    const expectedSignature = CryptoJS.SHA512(APP_SECRET).toString().slice(0, 32);
    if (parsedData.appSignature !== expectedSignature) {
      throw new Error('Assinatura do aplicativo inválida');
    }

    // Verifica se os dados não estão muito antigos (mais de 24 horas)
    const dataAge = Date.now() - parsedData.timestamp;
    if (dataAge > 24 * 60 * 60 * 1000) {
      throw new Error('Dados expirados');
    }

    return JSON.parse(parsedData.data);
  } catch (error) {
    console.error('Erro ao decriptar dados:', error);
    throw new Error('Falha na decriptação dos dados');
  }
};

// Função para validar se os dados foram criados pelo aplicativo
export const validateAppData = (encryptedData) => {
  try {
    const { content } = encryptedData;
    const key = generateEncryptionKey(encryptedData.salt || '');
    
    const decrypted = CryptoJS.AES.decrypt(content, key);
    const decryptedStr = decrypted.toString(CryptoJS.enc.Utf8);
    const parsedData = JSON.parse(decryptedStr);

    const expectedSignature = CryptoJS.SHA512(APP_SECRET).toString().slice(0, 32);
    return parsedData.appSignature === expectedSignature;
  } catch {
    return false;
  }
};

// Função para gerar um hash SHA-512 de um valor
export const generateHash = (value) => {
  return CryptoJS.SHA512(value.toString()).toString();
};

// Função para gerar um ID único baseado em timestamp e dados
export const generateSecureId = (prefix = '') => {
  const timestamp = Date.now();
  const random = Math.random().toString();
  const hash = generateHash(`${timestamp}-${random}-${APP_SECRET}`);
  return `${prefix}${hash.slice(0, 16)}`;
};
