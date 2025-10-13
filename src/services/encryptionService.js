import CryptoJS from 'crypto-js';

const SECRET_KEY = 'SUA_CHAVE_SECRETA_MUITO_FORTE'; // Armazene isso em variáveis de ambiente em produção

export const encryptData = (data) => {
  return CryptoJS.AES.encrypt(JSON.stringify(data), SECRET_KEY).toString();
};

export const decryptData = (ciphertext) => {
  const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
  return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
};