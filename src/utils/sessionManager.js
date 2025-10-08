/**
 * Sistema de Gerenciamento de Sessão
 * 
 * Funcionalidades:
 * - Timeout automático de sessão após inatividade
 * - Renovação automática de sessão durante atividade
 * - Alerta antes da expiração
 * - Monitoramento de atividade do usuário
 * - Proteção contra sessões muito longas
 */

import { encryptData, decryptData } from './cryptoUtils';

// Configurações de Sessão
const SESSION_CONFIG = {
  // Tempo de inatividade antes do logout (30 minutos)
  INACTIVITY_TIMEOUT: 30 * 60 * 1000,
  
  // Tempo máximo de sessão (8 horas)
  MAX_SESSION_DURATION: 8 * 60 * 60 * 1000,
  
  // Tempo de alerta antes da expiração (2 minutos)
  WARNING_BEFORE_EXPIRY: 2 * 60 * 1000,
  
  // Intervalo de verificação de inatividade (30 segundos)
  CHECK_INTERVAL: 30 * 1000,
  
  // Eventos que renovam a sessão
  ACTIVITY_EVENTS: ['mousedown', 'keypress', 'scroll', 'touchstart', 'click']
};

const STORAGE_KEY = '_wf_session';

/**
 * Classe de Gerenciamento de Sessão
 */
class SessionManager {
  constructor() {
    this.sessionData = null;
    this.checkInterval = null;
    this.warningCallback = null;
    this.logoutCallback = null;
    this.activityListeners = [];
    
    this.loadSession();
  }

  /**
   * Inicia gerenciamento de sessão
   * @param {Function} onWarning - Callback chamado antes da expiração
   * @param {Function} onLogout - Callback chamado ao expirar
   */
  startSession(onWarning, onLogout) {
    this.warningCallback = onWarning;
    this.logoutCallback = onLogout;
    
    // Criar nova sessão ou renovar existente
    const now = Date.now();
    
    if (!this.sessionData || this.isExpired()) {
      this.sessionData = {
        startTime: now,
        lastActivity: now,
        warningShown: false,
        sessionId: this.generateSessionId()
      };
    } else {
      // Renovar sessão existente
      this.sessionData.lastActivity = now;
      this.sessionData.warningShown = false;
    }
    
    this.saveSession();
    this.startMonitoring();
    
    console.log('✅ Sessão iniciada:', {
      sessionId: this.sessionData.sessionId.substring(0, 8) + '...',
      timeout: SESSION_CONFIG.INACTIVITY_TIMEOUT / 60000 + ' minutos'
    });
  }

  /**
   * Renova a sessão (chamado em atividade do usuário)
   */
  renewSession() {
    if (!this.sessionData) return;
    
    const now = Date.now();
    this.sessionData.lastActivity = now;
    this.sessionData.warningShown = false;
    this.saveSession();
  }

  /**
   * Verifica se a sessão expirou
   * @returns {boolean}
   */
  isExpired() {
    if (!this.sessionData) return true;
    
    const now = Date.now();
    const inactiveTime = now - this.sessionData.lastActivity;
    const totalTime = now - this.sessionData.startTime;
    
    // Expirou por inatividade
    if (inactiveTime >= SESSION_CONFIG.INACTIVITY_TIMEOUT) {
      return true;
    }
    
    // Expirou por duração máxima
    if (totalTime >= SESSION_CONFIG.MAX_SESSION_DURATION) {
      return true;
    }
    
    return false;
  }

  /**
   * Verifica se deve mostrar alerta
   * @returns {boolean}
   */
  shouldShowWarning() {
    if (!this.sessionData || this.sessionData.warningShown) return false;
    
    const now = Date.now();
    const inactiveTime = now - this.sessionData.lastActivity;
    const timeUntilExpiry = SESSION_CONFIG.INACTIVITY_TIMEOUT - inactiveTime;
    
    return timeUntilExpiry <= SESSION_CONFIG.WARNING_BEFORE_EXPIRY;
  }

  /**
   * Obtém tempo restante até expiração
   * @returns {number} Segundos restantes
   */
  getTimeRemaining() {
    if (!this.sessionData) return 0;
    
    const now = Date.now();
    const inactiveTime = now - this.sessionData.lastActivity;
    const timeUntilExpiry = SESSION_CONFIG.INACTIVITY_TIMEOUT - inactiveTime;
    
    return Math.max(0, Math.floor(timeUntilExpiry / 1000));
  }

  /**
   * Inicia monitoramento de sessão
   */
  startMonitoring() {
    // Parar monitoramento existente
    this.stopMonitoring();
    
    // Adicionar listeners de atividade
    SESSION_CONFIG.ACTIVITY_EVENTS.forEach(eventType => {
      const listener = () => this.renewSession();
      document.addEventListener(eventType, listener, { passive: true });
      this.activityListeners.push({ eventType, listener });
    });
    
    // Verificar sessão periodicamente
    this.checkInterval = setInterval(() => {
      this.checkSession();
    }, SESSION_CONFIG.CHECK_INTERVAL);
    
    // Verificar imediatamente
    this.checkSession();
  }

  /**
   * Para monitoramento de sessão
   */
  stopMonitoring() {
    // Remover listeners de atividade
    this.activityListeners.forEach(({ eventType, listener }) => {
      document.removeEventListener(eventType, listener);
    });
    this.activityListeners = [];
    
    // Parar interval
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Verifica estado da sessão
   */
  checkSession() {
    if (this.isExpired()) {
      this.handleExpiration();
      return;
    }
    
    if (this.shouldShowWarning() && this.warningCallback) {
      this.sessionData.warningShown = true;
      this.saveSession();
      
      const remaining = this.getTimeRemaining();
      this.warningCallback(remaining);
    }
  }

  /**
   * Manipula expiração de sessão
   */
  handleExpiration() {
    console.warn('⚠️ Sessão expirada por inatividade');
    
    this.stopMonitoring();
    this.clearSession();
    
    if (this.logoutCallback) {
      this.logoutCallback('Sessão expirada por inatividade.');
    }
  }

  /**
   * Encerra sessão manualmente
   */
  endSession() {
    this.stopMonitoring();
    this.clearSession();
  }

  /**
   * Carrega sessão do storage
   */
  loadSession() {
    try {
      const encrypted = localStorage.getItem(STORAGE_KEY);
      if (!encrypted) return;
      
      const decrypted = decryptData(encrypted);
      this.sessionData = JSON.parse(decrypted);
      
      // Verificar se sessão ainda é válida
      if (this.isExpired()) {
        this.clearSession();
      }
    } catch (error) {
      console.error('Erro ao carregar sessão:', error);
      this.clearSession();
    }
  }

  /**
   * Salva sessão no storage
   */
  saveSession() {
    try {
      if (!this.sessionData) return;
      
      const encrypted = encryptData(JSON.stringify(this.sessionData));
      localStorage.setItem(STORAGE_KEY, encrypted);
    } catch (error) {
      console.error('Erro ao salvar sessão:', error);
    }
  }

  /**
   * Limpa sessão do storage
   */
  clearSession() {
    this.sessionData = null;
    localStorage.removeItem(STORAGE_KEY);
  }

  /**
   * Gera ID único para sessão
   * @returns {string}
   */
  generateSessionId() {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 15);
    const userAgent = navigator.userAgent.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0).toString(36);
    
    return `${timestamp}-${randomStr}-${userAgent}`;
  }

  /**
   * Obtém informações da sessão
   * @returns {Object}
   */
  getSessionInfo() {
    if (!this.sessionData) {
      return {
        active: false,
        message: 'Nenhuma sessão ativa'
      };
    }
    
    const now = Date.now();
    const inactiveMinutes = Math.floor((now - this.sessionData.lastActivity) / 60000);
    const totalMinutes = Math.floor((now - this.sessionData.startTime) / 60000);
    const remainingSeconds = this.getTimeRemaining();
    
    return {
      active: true,
      sessionId: this.sessionData.sessionId,
      startTime: new Date(this.sessionData.startTime).toLocaleString('pt-BR'),
      lastActivity: new Date(this.sessionData.lastActivity).toLocaleString('pt-BR'),
      inactiveMinutes,
      totalMinutes,
      remainingSeconds,
      maxDuration: SESSION_CONFIG.MAX_SESSION_DURATION / 3600000 + ' horas',
      inactivityTimeout: SESSION_CONFIG.INACTIVITY_TIMEOUT / 60000 + ' minutos'
    };
  }

  /**
   * Obtém configurações de sessão
   * @returns {Object}
   */
  getConfig() {
    return {
      inactivityTimeout: SESSION_CONFIG.INACTIVITY_TIMEOUT,
      maxSessionDuration: SESSION_CONFIG.MAX_SESSION_DURATION,
      warningTime: SESSION_CONFIG.WARNING_BEFORE_EXPIRY,
      checkInterval: SESSION_CONFIG.CHECK_INTERVAL
    };
  }

  /**
   * Atualiza configurações (apenas para testes/admin)
   * @param {Object} newConfig
   */
  updateConfig(newConfig) {
    Object.assign(SESSION_CONFIG, newConfig);
    console.warn('⚠️ Configurações de sessão atualizadas:', SESSION_CONFIG);
    
    // Reiniciar monitoramento com novas configurações
    if (this.checkInterval) {
      this.stopMonitoring();
      this.startMonitoring();
    }
  }
}

// Instância singleton
const sessionManager = new SessionManager();

export default sessionManager;
export { SessionManager, SESSION_CONFIG };
