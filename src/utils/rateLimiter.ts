/**
 * Sistema de Rate Limiting para Proteção contra Brute-Force
 * 
 * Funcionalidades:
 * - Limita tentativas de login por IP/usuário
 * - Delay exponencial após falhas
 * - Bloqueio temporário após múltiplas tentativas
 * - Armazenamento seguro de tentativas
 * - Limpeza automática de registros antigos
 */

import { encryptData, decryptData } from './cryptoUtils';

// Configurações de Rate Limiting
const RATE_LIMIT_CONFIG = {
  // Máximo de tentativas antes do bloqueio
  MAX_ATTEMPTS: 5,
  
  // Janela de tempo para contar tentativas (15 minutos)
  TIME_WINDOW: 15 * 60 * 1000,
  
  // Tempo de bloqueio após exceder tentativas (30 minutos)
  LOCKOUT_DURATION: 30 * 60 * 1000,
  
  // Delay base entre tentativas (segundos)
  BASE_DELAY: 1,
  
  // Multiplicador para delay exponencial
  DELAY_MULTIPLIER: 2,
  
  // Tempo para limpar registros antigos (24 horas)
  CLEANUP_INTERVAL: 24 * 60 * 60 * 1000
};

const STORAGE_KEY = '_wf_rl_data';

/**
 * Classe principal do Rate Limiter
 */
class RateLimiter {
  constructor() {
    this.attempts = new Map();
    this.loadFromStorage();
    this.startCleanupTimer();
  }

  /**
   * Carrega dados de tentativas do storage (criptografados)
   */
  loadFromStorage() {
    try {
      const encrypted = localStorage.getItem(STORAGE_KEY);
      if (!encrypted) return;

      const decrypted = decryptData(encrypted);
      const data = JSON.parse(decrypted);
      
      // Converter de volta para Map
      this.attempts = new Map(Object.entries(data.attempts || {}));
      
      // Limpar registros expirados ao carregar
      this.cleanupExpiredRecords();
    } catch (error) {
      console.error('Erro ao carregar rate limiter:', error);
      this.attempts = new Map();
    }
  }

  /**
   * Salva dados de tentativas no storage (criptografados)
   */
  saveToStorage() {
    try {
      // Converter Map para objeto para serialização
      const data = {
        attempts: Object.fromEntries(this.attempts),
        timestamp: Date.now()
      };
      
      const encrypted = encryptData(JSON.stringify(data));
      localStorage.setItem(STORAGE_KEY, encrypted);
    } catch (error) {
      console.error('Erro ao salvar rate limiter:', error);
    }
  }

  /**
   * Gera identificador único para o cliente
   * Usa múltiplos fatores para dificultar bypass
   */
  getClientIdentifier(username = '') {
    const factors = [
      username.toLowerCase(),
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset()
    ];
    
    // Hash simples dos fatores
    return btoa(factors.join('|')).substring(0, 32);
  }

  /**
   * Registra tentativa de login
   * @param {string} username - Nome de usuário
   * @param {boolean} success - Se a tentativa foi bem-sucedida
   * @returns {Object} Status da tentativa
   */
  recordAttempt(username, success = false) {
    const identifier = this.getClientIdentifier(username);
    const now = Date.now();
    
    let record = this.attempts.get(identifier) || {
      attempts: [],
      lockoutUntil: null,
      lastAttempt: null
    };

    // Se estiver bloqueado, verificar se ainda está no período de bloqueio
    if (record.lockoutUntil && now < record.lockoutUntil) {
      const remainingTime = Math.ceil((record.lockoutUntil - now) / 1000);
      return {
        allowed: false,
        locked: true,
        remainingTime,
        message: `Conta temporariamente bloqueada. Tente novamente em ${this.formatTime(remainingTime)}.`
      };
    }

    // Se login bem-sucedido, limpar registros
    if (success) {
      this.attempts.delete(identifier);
      this.saveToStorage();
      return { allowed: true, locked: false };
    }

    // Remover tentativas fora da janela de tempo
    const cutoff = now - RATE_LIMIT_CONFIG.TIME_WINDOW;
    record.attempts = record.attempts.filter(time => time > cutoff);

    // Adicionar nova tentativa
    record.attempts.push(now);
    record.lastAttempt = now;

    // Verificar se excedeu o limite
    if (record.attempts.length >= RATE_LIMIT_CONFIG.MAX_ATTEMPTS) {
      record.lockoutUntil = now + RATE_LIMIT_CONFIG.LOCKOUT_DURATION;
      this.attempts.set(identifier, record);
      this.saveToStorage();

      const lockoutMinutes = Math.ceil(RATE_LIMIT_CONFIG.LOCKOUT_DURATION / 60000);
      return {
        allowed: false,
        locked: true,
        remainingTime: lockoutMinutes * 60,
        message: `Muitas tentativas de login. Conta bloqueada por ${lockoutMinutes} minutos.`
      };
    }

    // Calcular delay necessário
    const attemptCount = record.attempts.length;
    const delay = this.calculateDelay(attemptCount);
    
    this.attempts.set(identifier, record);
    this.saveToStorage();

    return {
      allowed: true,
      locked: false,
      delay,
      attemptsRemaining: RATE_LIMIT_CONFIG.MAX_ATTEMPTS - attemptCount,
      message: attemptCount > 2 
        ? `${RATE_LIMIT_CONFIG.MAX_ATTEMPTS - attemptCount} tentativas restantes antes do bloqueio.`
        : null
    };
  }

  /**
   * Calcula delay exponencial baseado no número de tentativas
   * @param {number} attemptCount - Número de tentativas
   * @returns {number} Delay em segundos
   */
  calculateDelay(attemptCount) {
    if (attemptCount <= 1) return 0;
    
    const delay = RATE_LIMIT_CONFIG.BASE_DELAY * 
                  Math.pow(RATE_LIMIT_CONFIG.DELAY_MULTIPLIER, attemptCount - 1);
    
    return Math.min(delay, 30); // Máximo de 30 segundos
  }

  /**
   * Verifica se um usuário pode fazer login agora
   * @param {string} username - Nome de usuário
   * @returns {Object} Status de permissão
   */
  canAttemptLogin(username) {
    const identifier = this.getClientIdentifier(username);
    const now = Date.now();
    const record = this.attempts.get(identifier);

    if (!record) {
      return { allowed: true, locked: false };
    }

    // Verificar bloqueio
    if (record.lockoutUntil && now < record.lockoutUntil) {
      const remainingTime = Math.ceil((record.lockoutUntil - now) / 1000);
      return {
        allowed: false,
        locked: true,
        remainingTime,
        message: `Conta temporariamente bloqueada. Tente novamente em ${this.formatTime(remainingTime)}.`
      };
    }

    // Verificar delay necessário
    if (record.lastAttempt) {
      const attemptCount = record.attempts.filter(
        time => time > (now - RATE_LIMIT_CONFIG.TIME_WINDOW)
      ).length;
      
      const requiredDelay = this.calculateDelay(attemptCount) * 1000;
      const timeSinceLastAttempt = now - record.lastAttempt;

      if (timeSinceLastAttempt < requiredDelay) {
        const waitTime = Math.ceil((requiredDelay - timeSinceLastAttempt) / 1000);
        return {
          allowed: false,
          locked: false,
          waitTime,
          message: `Por favor, aguarde ${waitTime} segundos antes de tentar novamente.`
        };
      }
    }

    return { allowed: true, locked: false };
  }

  /**
   * Limpa registros expirados
   */
  cleanupExpiredRecords() {
    const now = Date.now();
    const cutoff = now - RATE_LIMIT_CONFIG.TIME_WINDOW;
    
    for (const [identifier, record] of this.attempts.entries()) {
      // Remover se não está bloqueado e não tem tentativas recentes
      if (!record.lockoutUntil || now >= record.lockoutUntil) {
        const recentAttempts = record.attempts.filter(time => time > cutoff);
        if (recentAttempts.length === 0) {
          this.attempts.delete(identifier);
        }
      }
    }
    
    this.saveToStorage();
  }

  /**
   * Inicia timer de limpeza automática
   */
  startCleanupTimer() {
    setInterval(() => {
      this.cleanupExpiredRecords();
    }, RATE_LIMIT_CONFIG.CLEANUP_INTERVAL);
  }

  /**
   * Formata tempo em formato legível
   * @param {number} seconds - Segundos
   * @returns {string} Tempo formatado
   */
  formatTime(seconds) {
    if (seconds < 60) {
      return `${seconds} segundo${seconds !== 1 ? 's' : ''}`;
    }
    
    const minutes = Math.ceil(seconds / 60);
    return `${minutes} minuto${minutes !== 1 ? 's' : ''}`;
  }

  /**
   * Limpa todos os registros (apenas para debug/admin)
   */
  clearAll() {
    this.attempts.clear();
    localStorage.removeItem(STORAGE_KEY);
  }

  /**
   * Obtém estatísticas do rate limiter
   * @returns {Object} Estatísticas
   */
  getStats() {
    let totalAttempts = 0;
    let lockedAccounts = 0;
    
    for (const record of this.attempts.values()) {
      totalAttempts += record.attempts.length;
      if (record.lockoutUntil && Date.now() < record.lockoutUntil) {
        lockedAccounts++;
      }
    }
    
    return {
      totalRecords: this.attempts.size,
      totalAttempts,
      lockedAccounts,
      config: RATE_LIMIT_CONFIG
    };
  }
}

// Instância singleton
const rateLimiter = new RateLimiter();

// Exportar instância e classe
export default rateLimiter;
export { RateLimiter, RATE_LIMIT_CONFIG };
