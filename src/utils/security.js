import { SECURITY_CONFIG } from '../config/security';
import { createHash, randomBytes, scrypt, createCipheriv, createDecipheriv } from 'crypto';

export class SecurityUtils {
  static #loginAttempts = new Map();
  static #passwordHistory = new Map();

  // Password Validation
  static validatePassword(password) {
    const { passwordPolicy } = SECURITY_CONFIG.auth;
    
    if (password.length < passwordPolicy.minLength) {
      return false;
    }
    
    if (passwordPolicy.requireUppercase && !/[A-Z]/.test(password)) {
      return false;
    }
    
    if (passwordPolicy.requireLowercase && !/[a-z]/.test(password)) {
      return false;
    }
    
    if (passwordPolicy.requireNumbers && !/\d/.test(password)) {
      return false;
    }
    
    if (passwordPolicy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return false;
    }
    
    return true;
  }

  // Advanced Encryption
  static async encrypt(data, key) {
    const { algorithm, ivLength, tagLength } = SECURITY_CONFIG.encryption;
    
    const iv = randomBytes(ivLength);
    const salt = randomBytes(SECURITY_CONFIG.encryption.saltLength);
    
    // Derive key using scrypt
    const derivedKey = await new Promise((resolve, reject) => {
      scrypt(key, salt, 32, {
        N: 16384,
        r: 8,
        p: 1
      }, (err, key) => {
        if (err) reject(err);
        resolve(key);
      });
    });

    const cipher = createCipheriv(algorithm, derivedKey, iv, {
      authTagLength: tagLength
    });

    const encrypted = Buffer.concat([
      cipher.update(JSON.stringify(data), 'utf8'),
      cipher.final()
    ]);

    return {
      encrypted: encrypted.toString('base64'),
      iv: iv.toString('base64'),
      salt: salt.toString('base64'),
      tag: cipher.getAuthTag().toString('base64')
    };
  }

  // Advanced Decryption with authentication
  static async decrypt(encryptedData, key) {
    const { algorithm, tagLength } = SECURITY_CONFIG.encryption;
    
    const encrypted = Buffer.from(encryptedData.encrypted, 'base64');
    const iv = Buffer.from(encryptedData.iv, 'base64');
    const salt = Buffer.from(encryptedData.salt, 'base64');
    const tag = Buffer.from(encryptedData.tag, 'base64');

    // Derive key using scrypt
    const derivedKey = await new Promise((resolve, reject) => {
      scrypt(key, salt, 32, {
        N: 16384,
        r: 8,
        p: 1
      }, (err, key) => {
        if (err) reject(err);
        resolve(key);
      });
    });

    const decipher = createDecipheriv(algorithm, derivedKey, iv, {
      authTagLength: tagLength
    });
    
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]);

    return JSON.parse(decrypted.toString('utf8'));
  }

  // Rate Limiting
  static checkRateLimit(userId) {
    const now = Date.now();
    const userAttempts = this.#loginAttempts.get(userId) || [];
    
    // Clear old attempts
    const validAttempts = userAttempts.filter(
      attempt => now - attempt < SECURITY_CONFIG.rateLimit.windowMs
    );
    
    if (validAttempts.length >= SECURITY_CONFIG.rateLimit.maxRequests) {
      return false;
    }
    
    validAttempts.push(now);
    this.#loginAttempts.set(userId, validAttempts);
    return true;
  }

  // Secure Token Generation
  static generateSecureToken(length = 32) {
    return randomBytes(length).toString('base64');
  }

  // Password History Management
  static async addPasswordToHistory(userId, password) {
    const passwordHash = await this.hashPassword(password);
    const history = this.#passwordHistory.get(userId) || [];
    
    history.unshift(passwordHash);
    
    // Keep only the last N passwords as per config
    if (history.length > SECURITY_CONFIG.auth.passwordPolicy.preventReuse) {
      history.pop();
    }
    
    this.#passwordHistory.set(userId, history);
  }

  // Check if password was recently used
  static async isPasswordReused(userId, newPassword) {
    const history = this.#passwordHistory.get(userId) || [];
    const newHash = await this.hashPassword(newPassword);
    
    return history.includes(newHash);
  }

  // Secure Password Hashing
  static async hashPassword(password) {
    const salt = randomBytes(SECURITY_CONFIG.encryption.saltLength);
    
    return new Promise((resolve, reject) => {
      scrypt(password, salt, 64, {
        N: 16384,
        r: 8,
        p: 1
      }, (err, derivedKey) => {
        if (err) reject(err);
        resolve(derivedKey.toString('base64') + '.' + salt.toString('base64'));
      });
    });
  }

  // Secure Password Verification
  static async verifyPassword(password, hash) {
    const [hashedPassword, salt] = hash.split('.');
    
    return new Promise((resolve, reject) => {
      scrypt(password, Buffer.from(salt, 'base64'), 64, {
        N: 16384,
        r: 8,
        p: 1
      }, (err, derivedKey) => {
        if (err) reject(err);
        resolve(derivedKey.toString('base64') === hashedPassword);
      });
    });
  }

  // Input Sanitization
  static sanitizeInput(input) {
    if (typeof input !== 'string') {
      return input;
    }
    
    return input
      .replace(/[<>]/g, '') // Remove < and >
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove inline event handlers
      .trim();
  }

  // Session Token Management
  static generateSessionToken(userId) {
    const timestamp = Date.now();
    const random = this.generateSecureToken(16);
    return Buffer.from(`${userId}.${timestamp}.${random}`).toString('base64');
  }

  // Validate Session Token
  static validateSessionToken(token) {
    try {
      const decoded = Buffer.from(token, 'base64').toString();
      const [userId, timestamp, random] = decoded.split('.');
      
      const tokenAge = Date.now() - parseInt(timestamp);
      if (tokenAge > SECURITY_CONFIG.auth.sessionTimeout) {
        return null;
      }
      
      return userId;
    } catch {
      return null;
    }
  }
}
