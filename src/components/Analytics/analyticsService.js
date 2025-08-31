// Importa o hook useWorkflowAnalytics
import { useWorkflowAnalytics } from './useWorkflowAnalytics';

// Função para inicializar o tracking de analytics
export const initializeAnalytics = () => {
  const analytics = useWorkflowAnalytics();

  // Configuração de listeners globais
  window.addEventListener('error', (event) => {
    analytics.trackError('UNCAUGHT_ERROR', event.message, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event?.error?.stack
    });
  });

  // Performance tracking
  if ('performance' in window) {
    // Observa métricas de performance
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        analytics.trackPerformance(entry.name, entry.duration, {
          entryType: entry.entryType,
          startTime: entry.startTime
        });
      });
    });

    // Observa diferentes tipos de métricas
    observer.observe({ entryTypes: ['navigation', 'resource', 'paint', 'mark', 'measure'] });
  }

  // Tracking de sessão
  const startSessionTracking = () => {
    const sessionStart = Date.now();
    
    window.addEventListener('beforeunload', () => {
      const sessionDuration = Date.now() - sessionStart;
      analytics.trackCustomEvent('session_end', {
        duration: sessionDuration,
        endReason: 'page_unload'
      });
    });
  };

  startSessionTracking();
};

// Função para trackear eventos de navegação
export const trackNavigation = (location) => {
  const analytics = useWorkflowAnalytics();
  
  analytics.trackPageView(location.pathname);
};

// Função para trackear interações do usuário
export const trackUserInteraction = (action, details) => {
  const analytics = useWorkflowAnalytics();
  
  analytics.trackFeatureUsage(action, details);
};

// Função para trackear métricas de performance
export const trackPerformanceMetrics = (metrics) => {
  const analytics = useWorkflowAnalytics();
  
  Object.entries(metrics).forEach(([metric, value]) => {
    analytics.trackPerformance(metric, value);
  });
};

// Função para trackear erros
export const trackError = (error, context) => {
  const analytics = useWorkflowAnalytics();
  
  analytics.trackError(error.name, error.message, {
    stack: error.stack,
    ...context
  });
};

// Função para trackear eventos de feature
export const trackFeature = (featureName, action, details = {}) => {
  const analytics = useWorkflowAnalytics();
  
  analytics.trackFeatureUsage(`${featureName}_${action}`, details);
};

// Função para trackear eventos de ferramenta
export const trackToolEvent = (toolId, action, details = {}) => {
  const analytics = useWorkflowAnalytics();
  
  switch (action) {
    case 'borrow':
      analytics.trackToolBorrow(toolId, details.userId);
      break;
    case 'return':
      analytics.trackToolReturn(toolId, details.userId);
      break;
    case 'damaged':
      analytics.trackToolDamaged(toolId, details.userId, details.reason);
      break;
    case 'lost':
      analytics.trackToolLost(toolId, details.userId, details.reason);
      break;
    default:
      analytics.trackCustomEvent(`tool_${action}`, { toolId, ...details });
  }
};

// Função para trackear eventos de tarefa
export const trackTaskEvent = (taskId, action, details = {}) => {
  const analytics = useWorkflowAnalytics();
  
  switch (action) {
    case 'create':
      analytics.trackTaskCreate(taskId, details.taskType);
      break;
    case 'complete':
      analytics.trackTaskComplete(taskId, details.timeToComplete);
      break;
    case 'update':
      analytics.trackTaskUpdate(taskId, details.updateType);
      break;
    case 'delete':
      analytics.trackTaskDelete(taskId, details.reason);
      break;
    default:
      analytics.trackCustomEvent(`task_${action}`, { taskId, ...details });
  }
};

export default {
  initializeAnalytics,
  trackNavigation,
  trackUserInteraction,
  trackPerformanceMetrics,
  trackError,
  trackFeature,
  trackToolEvent,
  trackTaskEvent
};
