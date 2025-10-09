import React from 'react';

const AnalyticsProvider = ({ children }) => {
  const trackEvent = (eventName, eventData = {}) => {
    // Aqui você pode implementar a lógica real de tracking

    // Exemplo de implementação:
    try {
      // Adicionar timestamp ao evento
      const eventWithTimestamp = {
        ...eventData,
        timestamp: new Date().toISOString(),
        // Você pode adicionar mais metadados aqui
        userAgent: navigator.userAgent,
        language: navigator.language,
        screenResolution: `${window.screen.width}x${window.screen.height}`
      };

      // Você pode enviar para um serviço de analytics aqui
      // Por exemplo, Firebase Analytics, Google Analytics, etc.
      
      // Por enquanto, apenas logamos no console

    } catch (error) {
      console.error('Error tracking event:', error);
    }
  };

  // Funções auxiliares para tipos comuns de eventos
  const trackPageView = (pageName) => {
    trackEvent('page_view', { page: pageName });
  };

  const trackUserAction = (actionName, actionDetails) => {
    trackEvent('user_action', {
      action: actionName,
      ...actionDetails
    });
  };

  const trackError = (errorMessage, errorDetails) => {
    trackEvent('error', {
      message: errorMessage,
      ...errorDetails
    });
  };

  const trackFeatureUsage = (featureName, featureDetails) => {
    trackEvent('feature_usage', {
      feature: featureName,
      ...featureDetails
    });
  };

  const trackPerformance = (metricName, value) => {
    trackEvent('performance', {
      metric: metricName,
      value: value
    });
  };

  // Contexto que será disponibilizado para os componentes
  const analyticsContext = {
    trackEvent,
    trackPageView,
    trackUserAction,
    trackError,
    trackFeatureUsage,
    trackPerformance
  };

  return (
    <AnalyticsContext.Provider value={analyticsContext}>
      {children}
    </AnalyticsContext.Provider>
  );
};

// Hook personalizado para usar o contexto de analytics
export const useAnalytics = () => {
  const context = React.useContext(AnalyticsContext);
  if (context === undefined) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
};

// Criação do contexto
export const AnalyticsContext = React.createContext(undefined);

export default AnalyticsProvider;
