import React, { createContext, useContext, useState, useEffect } from 'react';
import { useDatabaseRotation } from '../hooks/useDatabaseRotation';

/**
 * 🔄 Context para Rotação de Database
 */
const DatabaseRotationContext = createContext(null);

/**
 * 🎯 Provider do Sistema de Rotação
 */
export const DatabaseRotationProvider = ({ children, ...options }) => {
  const [showNotification, setShowNotification] = useState(false);
  const [notification, setNotification] = useState(null);

  const rotation = useDatabaseRotation({
    autoRotate: true,
    rotationInterval: 24 * 60 * 60 * 1000, // 24 horas
    syncOnRotation: true,
    collections: [
      'usuarios',
      'mensagens',
      'notificacoes',
      'tarefas',
      'emprestimos',
      'inventario',
      'empresas',
      'setores',
      'cargos',
      'presenca',
      'horarios',
      'folgas',
      'configuracoes'
    ],
    onRotationStart: (fromDb) => {
      console.log(`🔄 Rotação iniciada de: ${fromDb}`);
      setNotification({
        type: 'info',
        title: 'Rotação de Database',
        message: `Alternando database de ${fromDb}...`,
        timestamp: new Date()
      });
      setShowNotification(true);
    },
    onRotationComplete: (toDb, history) => {
      console.log(`✅ Rotação concluída para: ${toDb}`);
      setNotification({
        type: 'success',
        title: 'Rotação Concluída',
        message: `Database alternado para ${toDb} com sucesso!`,
        timestamp: new Date()
      });
      
      // Esconder notificação após 5 segundos
      setTimeout(() => {
        setShowNotification(false);
      }, 5000);
    },
    onSyncProgress: (current, total, collectionName) => {
      console.log(`📊 Sincronizando ${collectionName}: ${current}/${total}`);
    },
    onError: (error) => {
      console.error('❌ Erro na rotação:', error);
      setNotification({
        type: 'error',
        title: 'Erro na Rotação',
        message: error.message,
        timestamp: new Date()
      });
      setShowNotification(true);
      
      // Esconder notificação após 10 segundos
      setTimeout(() => {
        setShowNotification(false);
      }, 10000);
    },
    ...options
  });

  return (
    <DatabaseRotationContext.Provider
      value={{
        ...rotation,
        notification,
        showNotification,
        closeNotification: () => setShowNotification(false)
      }}
    >
      {children}
      
      {/* Notificação de Rotação */}
      {showNotification && notification && (
        <RotationNotification
          notification={notification}
          onClose={() => setShowNotification(false)}
        />
      )}
    </DatabaseRotationContext.Provider>
  );
};

/**
 * 🔔 Componente de Notificação
 */
const RotationNotification = ({ notification, onClose }) => {
  const { type, title, message } = notification;

  const colors = {
    info: 'bg-blue-500',
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500'
  };

  const icons = {
    info: '🔄',
    success: '✅',
    error: '❌',
    warning: '⚠️'
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
      <div className={`${colors[type]} text-white rounded-lg shadow-lg p-4 min-w-[300px] max-w-md`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="text-2xl">{icons[type]}</span>
            <div>
              <h3 className="font-semibold text-lg">{title}</h3>
              <p className="text-sm opacity-90 mt-1">{message}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:opacity-80 transition-opacity"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * 🎯 Hook para usar o context
 */
export const useDatabaseRotationContext = () => {
  const context = useContext(DatabaseRotationContext);
  
  if (!context) {
    throw new Error('useDatabaseRotationContext deve ser usado dentro de DatabaseRotationProvider');
  }
  
  return context;
};

export default DatabaseRotationContext;
