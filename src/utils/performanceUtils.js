/**
 * Utilitários de Performance e Otimização
 * Reduz consumo de RAM, CPU e GPU
 */

// Debounce - Reduz chamadas de função frequentes
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

// Throttle - Limita execução de funções
export const throttle = (func, limit = 100) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Lazy load images - Carrega imagens sob demanda
export const lazyLoadImage = (imageUrl, placeholder = '/placeholder.png') => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = imageUrl;
    img.onload = () => resolve(imageUrl);
    img.onerror = () => resolve(placeholder);
  });
};

// Intersection Observer para lazy loading
export const createIntersectionObserver = (callback, options = {}) => {
  const defaultOptions = {
    root: null,
    rootMargin: '50px',
    threshold: 0.01
  };
  
  return new IntersectionObserver(callback, { ...defaultOptions, ...options });
};

// Limpar listeners e timers
export const useCleanup = (cleanupFn) => {
  return () => {
    if (cleanupFn) cleanupFn();
  };
};

// Comparação profunda otimizada (para React.memo)
export const deepCompare = (obj1, obj2) => {
  if (obj1 === obj2) return true;
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return false;
  if (obj1 === null || obj2 === null) return false;
  
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) return false;
  
  for (let key of keys1) {
    if (!keys2.includes(key)) return false;
    if (typeof obj1[key] === 'object') {
      if (!deepCompare(obj1[key], obj2[key])) return false;
    } else {
      if (obj1[key] !== obj2[key]) return false;
    }
  }
  
  return true;
};

// Batch updates - Agrupa atualizações de estado
export const batchUpdates = (updates) => {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      updates();
      resolve();
    });
  });
};

// Limpar cache de memória
export const clearMemoryCache = () => {
  // Forçar garbage collection (quando possível)
  if (global.gc) {
    global.gc();
  }
  
  // Limpar cache de imagens
  if (window.caches) {
    caches.keys().then(names => {
      names.forEach(name => {
        if (name.includes('images')) {
          caches.delete(name);
        }
      });
    });
  }
};

// Otimizar renderização de listas
export const virtualizeList = (items, containerHeight, itemHeight) => {
  const visibleItems = Math.ceil(containerHeight / itemHeight) + 2; // +2 buffer
  return {
    visibleItems,
    getVisibleRange: (scrollTop) => {
      const start = Math.floor(scrollTop / itemHeight);
      const end = Math.min(start + visibleItems, items.length);
      return { start, end };
    }
  };
};

// Redimensionar imagens no client-side
export const resizeImage = (file, maxWidth = 800, maxHeight = 800, quality = 0.8) => {
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
        
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/jpeg', quality);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};

// Monitor de performance
export const performanceMonitor = {
  start: (label) => {
    performance.mark(`${label}-start`);
  },
  end: (label) => {
    performance.mark(`${label}-end`);
    performance.measure(label, `${label}-start`, `${label}-end`);
    const measure = performance.getEntriesByName(label)[0];
    console.log(`⚡ ${label}: ${measure.duration.toFixed(2)}ms`);
    performance.clearMarks(`${label}-start`);
    performance.clearMarks(`${label}-end`);
    performance.clearMeasures(label);
  }
};

// Detectar se está em dispositivo de baixo desempenho
export const isLowEndDevice = () => {
  const memory = navigator.deviceMemory; // GB
  const cores = navigator.hardwareConcurrency;
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  
  const isSlowConnection = connection && (connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g');
  const isLowMemory = memory && memory < 4;
  const isLowCores = cores && cores <= 2;
  
  return isSlowConnection || isLowMemory || isLowCores;
};

// Configurações adaptativas baseadas no dispositivo
export const getAdaptiveSettings = () => {
  const isLowEnd = isLowEndDevice();
  
  return {
    enableAnimations: !isLowEnd,
    imageQuality: isLowEnd ? 0.6 : 0.8,
    lazyLoadThreshold: isLowEnd ? 200 : 50,
    debounceTime: isLowEnd ? 500 : 300,
    maxConcurrentRequests: isLowEnd ? 2 : 4,
    enableBlur: !isLowEnd,
    enableShadows: !isLowEnd,
    enableGradients: !isLowEnd
  };
};

// Hook personalizado para detectar visibilidade da tab
export const usePageVisibility = () => {
  const [isVisible, setIsVisible] = React.useState(!document.hidden);
  
  React.useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);
  
  return isVisible;
};

// Otimizar animações Framer Motion
export const getOptimizedMotionProps = () => {
  const isLowEnd = isLowEndDevice();
  
  if (isLowEnd) {
    return {
      initial: false,
      animate: false,
      exit: false,
      transition: { duration: 0 }
    };
  }
  
  return {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2 }
  };
};

export default {
  debounce,
  throttle,
  lazyLoadImage,
  createIntersectionObserver,
  deepCompare,
  batchUpdates,
  clearMemoryCache,
  virtualizeList,
  resizeImage,
  performanceMonitor,
  isLowEndDevice,
  getAdaptiveSettings,
  getOptimizedMotionProps
};
