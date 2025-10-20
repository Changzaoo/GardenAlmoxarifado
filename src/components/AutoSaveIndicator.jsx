/**
 * 💾 COMPONENTE: Indicador de Auto-Save
 * 
 * Mostra status de salvamento automático do estado
 */

import React from 'react';
import { Save, Check, AlertCircle, Clock } from 'lucide-react';

const AutoSaveIndicator = ({ 
  isSaving, 
  lastSaveTime, 
  error,
  position = 'bottom-right',
  compact = false 
}) => {
  // Calcular tempo desde último save
  const getTimeSinceLastSave = () => {
    if (!lastSaveTime) return null;
    
    const now = Date.now();
    const diff = now - lastSaveTime.getTime();
    
    if (diff < 1000) return 'agora';
    if (diff < 60000) return `${Math.floor(diff / 1000)}s atrás`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}min atrás`;
    return `${Math.floor(diff / 3600000)}h atrás`;
  };

  // Posição
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  };

  // Não mostrar nada se não houver atividade
  if (!isSaving && !lastSaveTime && !error) {
    return null;
  }

  return (
    <div 
      className={`
        fixed ${positionClasses[position]} z-50
        ${compact ? 'p-2' : 'px-4 py-2'}
        bg-white dark:bg-gray-800 
        border border-gray-200 dark:border-gray-700
        rounded-lg shadow-lg
        flex items-center gap-2
        transition-all duration-300
        ${isSaving ? 'scale-105' : 'scale-100'}
      `}
    >
      {/* Ícone de status */}
      {error ? (
        <AlertCircle className="w-4 h-4 text-red-500" />
      ) : isSaving ? (
        <Save className="w-4 h-4 text-blue-500 animate-pulse" />
      ) : (
        <Check className="w-4 h-4 text-green-500" />
      )}

      {/* Texto (se não compacto) */}
      {!compact && (
        <div className="flex flex-col">
          <span className={`
            text-xs font-medium
            ${error ? 'text-red-600 dark:text-red-400' : ''}
            ${isSaving ? 'text-blue-600 dark:text-blue-400' : ''}
            ${!isSaving && !error ? 'text-green-600 dark:text-green-400' : ''}
          `}>
            {error ? 'Erro ao salvar' : isSaving ? 'Salvando...' : 'Salvo'}
          </span>
          
          {lastSaveTime && !error && !isSaving && (
            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {getTimeSinceLastSave()}
            </span>
          )}
        </div>
      )}

      {/* Animação de progresso (quando salvando) */}
      {isSaving && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 rounded-b-lg overflow-hidden">
          <div className="h-full bg-blue-500 animate-pulse" style={{ 
            width: '100%',
            animation: 'progress 1s ease-in-out infinite'
          }} />
        </div>
      )}

      <style jsx>{`
        @keyframes progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default AutoSaveIndicator;
