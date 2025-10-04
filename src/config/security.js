import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Funções de ofuscação
export const obscure = (str) => {
  try {
    return btoa(encodeURIComponent(str)).split('').reverse().join('');
  } catch {
    return str;
  }
};

export const deobscure = (str) => {
  try {
    return decodeURIComponent(atob(str.split('').reverse().join('')));
  } catch {
    return str;
  }
};

// Gerador de nomes de classes e IDs ofuscados
const generateObfuscatedName = () => '_' + Math.random().toString(36).slice(2);

export const SECURITY_CONFIG = {
  // Authentication settings
  auth: {
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
    passwordPolicy: {
      minLength: 12,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      preventReuse: 5 // Last 5 passwords
    },
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
  },

  // Proteções contra DevTools
  devTools: {
    enabled: false, // ⚠️ DESABILITADO TEMPORARIAMENTE - Estava causando tela branca
    preventInspect: false, // Impede a inspeção de elementos
    preventConsole: false, // Bloqueia acesso ao console
    preventSourceMap: true, // Remove source maps em produção
    clearDataOnDetection: false, // Limpa dados locais quando DevTools é detectado
    checkInterval: 5000, // Intervalo de verificação em milissegundos (aumentado)
    sizeThreshold: 500, // Diferença máxima permitida entre outer e inner size (aumentado)
  },

  // Ofuscação de código
  obfuscation: {
    enabled: true,
    classNames: {
      container: generateObfuscatedName(),
      header: generateObfuscatedName(),
      content: generateObfuscatedName(),
      button: generateObfuscatedName(),
      input: generateObfuscatedName(),
    },
    dataAttributes: {
      role: generateObfuscatedName(),
      state: generateObfuscatedName(),
      id: generateObfuscatedName(),
    }
  },
  
  // Rate limiting settings
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100 // per windowMs
  },

  // Encryption settings
  encryption: {
    algorithm: 'aes-256-gcm',
    keyLength: 32,
    ivLength: 16,
    saltLength: 32,
    iterations: 100000,
    tagLength: 16,
    pepper: process.env.REACT_APP_CRYPTO_PEPPER // Additional server-side secret
  },

  // Cookie settings
  cookies: {
    secure: true,
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  },

  // Security Headers
  headers: {
    'Content-Security-Policy': `
      default-src 'self';
      script-src 'self' https://apis.google.com;
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https:;
      font-src 'self';
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'none';
    `.replace(/\s+/g, ' ').trim(),
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
  }
};
