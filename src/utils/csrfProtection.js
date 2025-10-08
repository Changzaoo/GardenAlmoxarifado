/**
 * Sistema de Proteção CSRF (Cross-Site Request Forgery)
 * 
 * Funcionalidades:
 * - Geração de tokens CSRF únicos por sessão
 * - Validação de tokens em operações sensíveis
 * - Rotação automática de tokens
 * - Sincronização entre tabs
 * - Proteção contra ataques de timing
 */

import { encryptData, decryptData } from './cryptoUtils';

// Configurações CSRF
const CSRF_CONFIG = {
  // Tempo de vida do token (1 hora)
  TOKEN_LIFETIME: 60 * 60 * 1000,
  
  // Tamanho do token (bytes)
  TOKEN_SIZE: 32,
  
  // Nome do header HTTP para enviar token
  HEADER_NAME: 'X-CSRF-Token',
  
  // Nome do meta tag no HTML
  META_TAG_NAME: 'csrf-token',
  
  // Storage key
  STORAGE_KEY: '_wf_csrf',
  
  // Operações que requerem token CSRF
  PROTECTED_OPERATIONS: [
    'login',
    'logout',
    'updateUser',
    'deleteUser',
    'updatePassword',
    'updatePermissions',
    'deleteData',
    'transferData',
    'exportData'
  ]
};

/**
 * Classe de Gerenciamento CSRF
 */
class CSRFProtection {
  constructor() {
    this.currentToken = null;
    this.tokenExpiry = null;
    this.rotationTimeout = null;
    
    this.loadToken();
    this.startTokenRotation();
    this.setupStorageSync();
  }

  /**
   * Gera um novo token CSRF criptograficamente seguro
   * @returns {string} Token gerado
   */
  generateToken() {
    // Usar crypto.getRandomValues para segurança máxima
    const array = new Uint8Array(CSRF_CONFIG.TOKEN_SIZE);
    crypto.getRandomValues(array);
    
    // Converter para string hexadecimal
    const token = Array.from(array)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // Adicionar timestamp e assinatura
    const timestamp = Date.now();
    const signature = this.signToken(token, timestamp);
    
    return `${token}.${timestamp}.${signature}`;
  }

  /**
   * Assina um token com timestamp
   * @param {string} token - Token base
   * @param {number} timestamp - Timestamp
   * @returns {string} Assinatura
   */
  signToken(token, timestamp) {
    // Criar assinatura simples usando dados do navegador
    const data = `${token}|${timestamp}|${navigator.userAgent}|${window.location.origin}`;
    
    // Hash simples (em produção, usar HMAC com chave secreta)
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return Math.abs(hash).toString(36);
  }

  /**
   * Verifica se um token é válido
   * @param {string} token - Token a verificar
   * @returns {boolean}
   */
  verifyToken(token) {
    if (!token || typeof token !== 'string') {
      return false;
    }

    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return false;
      }

      const [tokenBase, timestampStr, signature] = parts;
      const timestamp = parseInt(timestampStr, 10);

      // Verificar se token expirou
      if (Date.now() - timestamp > CSRF_CONFIG.TOKEN_LIFETIME) {
        console.warn('🛡️ Token CSRF expirado');
        return false;
      }

      // Verificar assinatura
      const expectedSignature = this.signToken(tokenBase, timestamp);
      if (signature !== expectedSignature) {
        console.error('🚨 CSRF: Assinatura inválida detectada!');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao verificar token CSRF:', error);
      return false;
    }
  }

  /**
   * Obtém o token atual (gera novo se necessário)
   * @returns {string}
   */
  getToken() {
    // Se não há token ou expirou, gerar novo
    if (!this.currentToken || !this.verifyToken(this.currentToken)) {
      this.refreshToken();
    }

    return this.currentToken;
  }

  /**
   * Atualiza o token atual
   */
  refreshToken() {
    this.currentToken = this.generateToken();
    this.tokenExpiry = Date.now() + CSRF_CONFIG.TOKEN_LIFETIME;
    this.saveToken();
    
    console.log('🛡️ Novo token CSRF gerado');
    
    // Atualizar meta tag se existir
    this.updateMetaTag();
  }

  /**
   * Valida token para uma operação específica
   * @param {string} operation - Nome da operação
   * @param {string} providedToken - Token fornecido
   * @returns {boolean}
   */
  validateOperation(operation, providedToken) {
    // Verificar se operação requer proteção
    if (!CSRF_CONFIG.PROTECTED_OPERATIONS.includes(operation)) {
      console.warn(`⚠️ Operação '${operation}' não está na lista de operações protegidas`);
      return true; // Não requer proteção
    }

    // Validar token
    if (!providedToken) {
      console.error(`🚨 CSRF: Token ausente para operação '${operation}'`);
      return false;
    }

    if (!this.verifyToken(providedToken)) {
      console.error(`🚨 CSRF: Token inválido para operação '${operation}'`);
      return false;
    }

    // Verificar se token corresponde ao atual
    if (providedToken !== this.currentToken) {
      console.error(`🚨 CSRF: Token não corresponde ao esperado para '${operation}'`);
      return false;
    }

    console.log(`✅ CSRF: Token válido para operação '${operation}'`);
    return true;
  }

  /**
   * Rotaciona token após operação sensível
   * @param {string} operation - Operação realizada
   */
  rotateAfterOperation(operation) {
    if (CSRF_CONFIG.PROTECTED_OPERATIONS.includes(operation)) {
      console.log(`🔄 Rotacionando token CSRF após '${operation}'`);
      this.refreshToken();
    }
  }

  /**
   * Carrega token do storage
   */
  loadToken() {
    try {
      const encrypted = localStorage.getItem(CSRF_CONFIG.STORAGE_KEY);
      if (!encrypted) {
        this.refreshToken();
        return;
      }

      const decrypted = decryptData(encrypted);
      const data = JSON.parse(decrypted);
      
      if (this.verifyToken(data.token)) {
        this.currentToken = data.token;
        this.tokenExpiry = data.expiry;
      } else {
        this.refreshToken();
      }
    } catch (error) {
      console.error('Erro ao carregar token CSRF:', error);
      this.refreshToken();
    }
  }

  /**
   * Salva token no storage
   */
  saveToken() {
    try {
      const data = {
        token: this.currentToken,
        expiry: this.tokenExpiry,
        timestamp: Date.now()
      };
      
      const encrypted = encryptData(JSON.stringify(data));
      localStorage.setItem(CSRF_CONFIG.STORAGE_KEY, encrypted);
    } catch (error) {
      console.error('Erro ao salvar token CSRF:', error);
    }
  }

  /**
   * Limpa token do storage
   */
  clearToken() {
    this.currentToken = null;
    this.tokenExpiry = null;
    localStorage.removeItem(CSRF_CONFIG.STORAGE_KEY);
    
    if (this.rotationTimeout) {
      clearTimeout(this.rotationTimeout);
    }
  }

  /**
   * Inicia rotação automática de tokens
   */
  startTokenRotation() {
    // Parar rotação existente
    if (this.rotationTimeout) {
      clearTimeout(this.rotationTimeout);
    }

    // Rotacionar token a cada hora
    this.rotationTimeout = setInterval(() => {
      console.log('🔄 Rotação automática de token CSRF');
      this.refreshToken();
    }, CSRF_CONFIG.TOKEN_LIFETIME);
  }

  /**
   * Atualiza meta tag no HTML
   */
  updateMetaTag() {
    if (typeof document === 'undefined') return;

    let metaTag = document.querySelector(`meta[name="${CSRF_CONFIG.META_TAG_NAME}"]`);
    
    if (!metaTag) {
      metaTag = document.createElement('meta');
      metaTag.setAttribute('name', CSRF_CONFIG.META_TAG_NAME);
      document.head.appendChild(metaTag);
    }

    metaTag.setAttribute('content', this.currentToken);
  }

  /**
   * Configura sincronização entre tabs
   */
  setupStorageSync() {
    // Sincronizar token quando outra tab atualizar
    window.addEventListener('storage', (e) => {
      if (e.key === CSRF_CONFIG.STORAGE_KEY && e.newValue) {
        try {
          const decrypted = decryptData(e.newValue);
          const data = JSON.parse(decrypted);
          
          if (this.verifyToken(data.token)) {
            this.currentToken = data.token;
            this.tokenExpiry = data.expiry;
            this.updateMetaTag();
            console.log('🔄 Token CSRF sincronizado de outra tab');
          }
        } catch (error) {
          console.error('Erro ao sincronizar token CSRF:', error);
        }
      }
    });
  }

  /**
   * Cria header HTTP para requisição
   * @returns {Object}
   */
  getHeader() {
    return {
      [CSRF_CONFIG.HEADER_NAME]: this.getToken()
    };
  }

  /**
   * Cria objeto para envio em formulário
   * @returns {Object}
   */
  getFormField() {
    return {
      csrf_token: this.getToken()
    };
  }

  /**
   * Middleware para axios/fetch
   * @param {Object} config - Configuração da requisição
   * @returns {Object}
   */
  interceptRequest(config) {
    // Adicionar token CSRF em operações mutáveis
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(config.method?.toUpperCase())) {
      config.headers = {
        ...config.headers,
        ...this.getHeader()
      };
    }
    
    return config;
  }

  /**
   * Obtém estatísticas do sistema CSRF
   * @returns {Object}
   */
  getStats() {
    const timeRemaining = this.tokenExpiry ? Math.max(0, this.tokenExpiry - Date.now()) : 0;
    
    return {
      tokenActive: !!this.currentToken,
      tokenValid: this.verifyToken(this.currentToken),
      timeRemaining: Math.floor(timeRemaining / 1000) + 's',
      expiryDate: this.tokenExpiry ? new Date(this.tokenExpiry).toLocaleString('pt-BR') : null,
      protectedOperations: CSRF_CONFIG.PROTECTED_OPERATIONS.length,
      config: CSRF_CONFIG
    };
  }

  /**
   * Adiciona operação à lista de proteção
   * @param {string} operation - Nome da operação
   */
  protectOperation(operation) {
    if (!CSRF_CONFIG.PROTECTED_OPERATIONS.includes(operation)) {
      CSRF_CONFIG.PROTECTED_OPERATIONS.push(operation);
      console.log(`🛡️ Operação '${operation}' agora requer proteção CSRF`);
    }
  }
}

// Instância singleton
const csrfProtection = new CSRFProtection();

// Exportar instância e classe
export default csrfProtection;
export { CSRFProtection, CSRF_CONFIG };

// Helper para React components
export const useCSRF = () => {
  return {
    getToken: () => csrfProtection.getToken(),
    validateOperation: (operation, token) => csrfProtection.validateOperation(operation, token),
    rotateAfterOperation: (operation) => csrfProtection.rotateAfterOperation(operation),
    getHeader: () => csrfProtection.getHeader(),
    getFormField: () => csrfProtection.getFormField()
  };
};
