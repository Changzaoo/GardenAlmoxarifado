import CryptoJS from 'crypto-js';

// Chave de aplicativo única - Isso deve ser mantido em segurança e não deve ser compartilhado
const APP_SECRET = process.env.REACT_APP_CRYPTO_SECRET || 'almo-garden-secure-key-2025';

// Função para gerar um salt baseado em data/hora
const generateTimeSalt = () => {
  const now = new Date();
  const timeComponents = [
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    now.getHours(),
    Math.floor(now.getMinutes() / 15) // Agrupa em blocos de 15 minutos para reduzir variação
  ];
  return timeComponents.join('-');
};

// Função para gerar uma chave de encriptação
const generateEncryptionKey = (customSalt = '') => {
  const timeSalt = generateTimeSalt();
  const baseString = `${APP_SECRET}-${timeSalt}-${customSalt}`;
  return CryptoJS.SHA512(baseString).toString();
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
