/**
 * Utilitários para otimização de memória
 */

import { query, limit, startAfter, endBefore, orderBy } from 'firebase/firestore';

// Configurações de limites para queries
export const QUERY_LIMITS = {
  MESSAGES: 50, // Limitar mensagens carregadas por conversa
  CONVERSATIONS: 30, // Limitar conversas carregadas
  LOANS: 100, // Limitar empréstimos carregados
  TASKS: 50, // Limitar tarefas carregadas
  NOTIFICATIONS: 50, // Limitar notificações
  INVENTORY: 200, // Limitar inventário (geralmente menor)
  EMPLOYEES: 100, // Limitar funcionários
  EVALUATIONS: 20, // Limitar avaliações
};

// Cache simples para evitar re-queries desnecessárias
const queryCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export const getCachedQuery = (key) => {
  const cached = queryCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
};

export const setCachedQuery = (key, data) => {
  queryCache.set(key, {
    data,
    timestamp: Date.now()
  });
};

export const clearQueryCache = (key) => {
  if (key) {
    queryCache.delete(key);
  } else {
    queryCache.clear();
  }
};

// Gerenciador de listeners para prevenir memory leaks
class ListenerManager {
  constructor() {
    this.listeners = new Map();
  }

  add(key, unsubscribe) {
    // Se já existe um listener com essa chave, remove primeiro
    this.remove(key);
    this.listeners.set(key, unsubscribe);
  }

  remove(key) {
    const unsubscribe = this.listeners.get(key);
    if (unsubscribe && typeof unsubscribe === 'function') {
      unsubscribe();
      this.listeners.delete(key);
    }
  }

  removeAll() {
    this.listeners.forEach((unsubscribe) => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    });
    this.listeners.clear();
  }

  getActiveCount() {
    return this.listeners.size;
  }
}

export const listenerManager = new ListenerManager();

// Helper para criar queries com limit
export const createLimitedQuery = (baseQuery, limitCount) => {
  return query(baseQuery, limit(limitCount));
};

// Debounce para prevenir múltiplas atualizações rápidas
export const debounce = (func, wait = 300) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle para limitar frequência de execução
export const throttle = (func, limit = 1000) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Cleanup de event listeners do DOM
export const cleanupEventListeners = (element, events) => {
  if (!element) return;
  
  events.forEach(({ type, handler, options }) => {
    element.removeEventListener(type, handler, options);
  });
};

// Monitor de memória (apenas em desenvolvimento)
export const logMemoryUsage = () => {
  if (process.env.NODE_ENV !== 'development') return;
  
  if (performance.memory) {
    const { usedJSHeapSize, totalJSHeapSize, jsHeapSizeLimit } = performance.memory;
  }
};

// Lazy loading de imagens
export const lazyLoadImage = (src, placeholder = '/placeholder.png') => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(src);
    img.onerror = () => resolve(placeholder);
    img.src = src;
  });
};

// Compressão de imagens
export const compressImage = async (file, maxWidth = 800, maxHeight = 800, quality = 0.7) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            resolve(new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            }));
          },
          'image/jpeg',
          quality
        );
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};

// Limpeza de dados antigos do localStorage
export const cleanupLocalStorage = (daysOld = 7) => {
  try {
    const keys = Object.keys(localStorage);
    const cutoffDate = Date.now() - (daysOld * 24 * 60 * 60 * 1000);

    keys.forEach(key => {
      try {
        const item = localStorage.getItem(key);
        if (item) {
          const data = JSON.parse(item);
          if (data.timestamp && data.timestamp < cutoffDate) {
            localStorage.removeItem(key);
          }
        }
      } catch (e) {
        // Ignora erros de parsing
      }
    });
  } catch (error) {
    console.error('Erro ao limpar localStorage:', error);
  }
};

// Executar limpeza no carregamento
if (typeof window !== 'undefined') {
  // Limpa cache de queries antigas a cada hora
  setInterval(() => {
    const now = Date.now();
    queryCache.forEach((value, key) => {
      if (now - value.timestamp > CACHE_DURATION) {
        queryCache.delete(key);
      }
    });
  }, 60 * 60 * 1000);

  // Limpa localStorage na inicialização
  cleanupLocalStorage();

  // Log de memória em desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    setInterval(logMemoryUsage, 30000); // A cada 30 segundos
  }
}
