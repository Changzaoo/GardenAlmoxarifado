// Hook para usar o analytics
import { useAnalytics } from './AnalyticsProvider';

// Constantes para eventos
export const ANALYTICS_EVENTS = {
  // Eventos de Página
  PAGE_VIEW: 'page_view',
  
  // Eventos de Usuário
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  USER_REGISTER: 'user_register',
  
  // Eventos de Ferramenta
  TOOL_SEARCH: 'tool_search',
  TOOL_BORROW: 'tool_borrow',
  TOOL_RETURN: 'tool_return',
  TOOL_MARK_DAMAGED: 'tool_mark_damaged',
  TOOL_MARK_LOST: 'tool_mark_lost',
  
  // Eventos de Tarefa
  TASK_CREATE: 'task_create',
  TASK_COMPLETE: 'task_complete',
  TASK_UPDATE: 'task_update',
  TASK_DELETE: 'task_delete',
  
  // Eventos de Sistema
  SYSTEM_ERROR: 'system_error',
  PERFORMANCE_METRIC: 'performance_metric',
  FEATURE_USAGE: 'feature_usage'
};

// Hook personalizado para facilitar o tracking de eventos específicos do workflow
export const useWorkflowAnalytics = () => {
  const analytics = useAnalytics();

  return {
    // Métodos para tracking de páginas
    trackPageView: (pageName) => {
      analytics.trackEvent(ANALYTICS_EVENTS.PAGE_VIEW, { page: pageName });
    },

    // Métodos para tracking de usuários
    trackUserLogin: (userId) => {
      analytics.trackEvent(ANALYTICS_EVENTS.USER_LOGIN, { userId });
    },
    
    trackUserLogout: (userId) => {
      analytics.trackEvent(ANALYTICS_EVENTS.USER_LOGOUT, { userId });
    },
    
    trackUserRegister: (userId) => {
      analytics.trackEvent(ANALYTICS_EVENTS.USER_REGISTER, { userId });
    },

    // Métodos para tracking de ferramentas
    trackToolSearch: (searchTerm, results) => {
      analytics.trackEvent(ANALYTICS_EVENTS.TOOL_SEARCH, {
        searchTerm,
        resultCount: results?.length
      });
    },
    
    trackToolBorrow: (toolId, userId) => {
      analytics.trackEvent(ANALYTICS_EVENTS.TOOL_BORROW, { toolId, userId });
    },
    
    trackToolReturn: (toolId, userId) => {
      analytics.trackEvent(ANALYTICS_EVENTS.TOOL_RETURN, { toolId, userId });
    },
    
    trackToolDamaged: (toolId, userId, reason) => {
      analytics.trackEvent(ANALYTICS_EVENTS.TOOL_MARK_DAMAGED, {
        toolId,
        userId,
        reason
      });
    },
    
    trackToolLost: (toolId, userId, reason) => {
      analytics.trackEvent(ANALYTICS_EVENTS.TOOL_MARK_LOST, {
        toolId,
        userId,
        reason
      });
    },

    // Métodos para tracking de tarefas
    trackTaskCreate: (taskId, taskType) => {
      analytics.trackEvent(ANALYTICS_EVENTS.TASK_CREATE, {
        taskId,
        taskType
      });
    },
    
    trackTaskComplete: (taskId, timeToComplete) => {
      analytics.trackEvent(ANALYTICS_EVENTS.TASK_COMPLETE, {
        taskId,
        timeToComplete
      });
    },
    
    trackTaskUpdate: (taskId, updateType) => {
      analytics.trackEvent(ANALYTICS_EVENTS.TASK_UPDATE, {
        taskId,
        updateType
      });
    },
    
    trackTaskDelete: (taskId, reason) => {
      analytics.trackEvent(ANALYTICS_EVENTS.TASK_DELETE, {
        taskId,
        reason
      });
    },

    // Métodos para tracking de sistema
    trackError: (errorCode, errorMessage, errorContext) => {
      analytics.trackEvent(ANALYTICS_EVENTS.SYSTEM_ERROR, {
        code: errorCode,
        message: errorMessage,
        context: errorContext
      });
    },
    
    trackPerformance: (metricName, value, context) => {
      analytics.trackEvent(ANALYTICS_EVENTS.PERFORMANCE_METRIC, {
        metric: metricName,
        value,
        context
      });
    },
    
    trackFeatureUsage: (featureName, details) => {
      analytics.trackEvent(ANALYTICS_EVENTS.FEATURE_USAGE, {
        feature: featureName,
        ...details
      });
    },

    // Método genérico para eventos customizados
    trackCustomEvent: (eventName, eventData) => {
      analytics.trackEvent(eventName, eventData);
    }
  };
};

export default useWorkflowAnalytics;
