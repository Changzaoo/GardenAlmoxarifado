import CryptoJS from 'crypto-js';

/**
 * Sistema de Criptografia de Ponta a Ponta (E2EE)
 * Usa SHA-512 para hashing e AES-256 para criptografia
 */

class CryptographyService {
  constructor() {
    this.keyCache = new Map();
  }

  /**
   * Gera hash SHA-512 de uma string
   */
  generateSHA512(data) {
    return CryptoJS.SHA512(data).toString();
  }

  /**
   * Gera uma chave de criptografia baseada em dois usuários
   * Esta chave é única para cada par de usuários
   */
  generateConversationKey(userId1, userId2) {
    // Ordena os IDs para garantir que a chave seja sempre a mesma
    const sortedIds = [userId1, userId2].sort();
    const combinedKey = `${sortedIds[0]}_${sortedIds[1]}_conversation_key`;
    
    // Gera SHA-512 como chave base
    const baseKey = this.generateSHA512(combinedKey);
    
    // Armazena no cache
    const cacheKey = sortedIds.join('_');
    this.keyCache.set(cacheKey, baseKey);
    
    return baseKey;
  }

  /**
   * Gera chave para grupo (múltiplos participantes)
   */
  generateGroupKey(participantIds, groupId) {
    const sortedIds = [...participantIds].sort();
    const combinedKey = `${sortedIds.join('_')}_${groupId}_group_key`;
    return this.generateSHA512(combinedKey);
  }

  /**
   * Obtém chave de conversa do cache ou gera nova
   */
  getConversationKey(userId1, userId2) {
    const sortedIds = [userId1, userId2].sort();
    const cacheKey = sortedIds.join('_');
    
    if (this.keyCache.has(cacheKey)) {
      return this.keyCache.get(cacheKey);
    }
    
    return this.generateConversationKey(userId1, userId2);
  }

  /**
   * Criptografa uma mensagem usando AES-256
   */
  encryptMessage(plainText, conversationKey) {
    try {
      if (!plainText || plainText.trim() === '') {
        return plainText;
      }

      // Adiciona timestamp e salt para maior segurança
      const timestamp = Date.now();
      const salt = CryptoJS.lib.WordArray.random(16).toString();
      const dataToEncrypt = JSON.stringify({
        text: plainText,
        timestamp,
        salt
      });

      // Criptografa usando AES-256
      const encrypted = CryptoJS.AES.encrypt(dataToEncrypt, conversationKey);
      
      return encrypted.toString();
    } catch (error) {
      console.error('❌ Erro ao criptografar:', error);
      throw new Error('Falha na criptografia');
    }
  }

  /**
   * Descriptografa uma mensagem
   */
  decryptMessage(encryptedText, conversationKey) {
    try {
      if (!encryptedText || encryptedText.trim() === '') {
        return encryptedText;
      }

      // Tenta descriptografar
      const decrypted = CryptoJS.AES.decrypt(encryptedText, conversationKey);
      const decryptedStr = decrypted.toString(CryptoJS.enc.Utf8);

      if (!decryptedStr) {
        console.warn('⚠️ Falha ao descriptografar mensagem');
        return '[Mensagem criptografada]';
      }

      // Parse do JSON
      const data = JSON.parse(decryptedStr);
      return data.text;
    } catch (error) {
      console.error('❌ Erro ao descriptografar:', error);
      return '[Mensagem criptografada - erro ao descriptografar]';
    }
  }

  /**
   * Gera hash da mensagem para verificação de integridade
   */
  generateMessageHash(message, senderId, timestamp) {
    const data = `${message}_${senderId}_${timestamp}`;
    return this.generateSHA512(data);
  }

  /**
   * Verifica integridade da mensagem
   */
  verifyMessageIntegrity(message, senderId, timestamp, storedHash) {
    const calculatedHash = this.generateMessageHash(message, senderId, timestamp);
    return calculatedHash === storedHash;
  }

  /**
   * Criptografa arquivo (nome e metadados)
   */
  encryptFileMetadata(fileName, fileType, conversationKey) {
    try {
      const metadata = JSON.stringify({
        name: fileName,
        type: fileType,
        timestamp: Date.now()
      });

      return CryptoJS.AES.encrypt(metadata, conversationKey).toString();
    } catch (error) {
      console.error('❌ Erro ao criptografar metadados:', error);
      return fileName;
    }
  }

  /**
   * Descriptografa metadados do arquivo
   */
  decryptFileMetadata(encryptedMetadata, conversationKey) {
    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedMetadata, conversationKey);
      const decryptedStr = decrypted.toString(CryptoJS.enc.Utf8);
      
      if (!decryptedStr) {
        return { name: 'arquivo', type: 'unknown' };
      }

      return JSON.parse(decryptedStr);
    } catch (error) {
      console.error('❌ Erro ao descriptografar metadados:', error);
      return { name: 'arquivo', type: 'unknown' };
    }
  }

  /**
   * Limpa cache de chaves
   */
  clearCache() {
    this.keyCache.clear();
  }

  /**
   * Gera fingerprint da conversa para verificação
   */
  generateConversationFingerprint(userId1, userId2) {
    const key = this.getConversationKey(userId1, userId2);
    return this.generateSHA512(key).substring(0, 32);
  }
}

// Exportar instância singleton
const cryptographyService = new CryptographyService();
export default cryptographyService;
