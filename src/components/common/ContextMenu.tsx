import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

/**
 * ContextMenu - Menu de contexto para long press e right click
 * 
 * @param {Array} options - Array de opções do menu
 * @param {Function} onClose - Callback quando menu fecha
 * @param {Object} position - Posição {x, y} do menu
 * @param {string} title - Título opcional do menu
 */
const ContextMenu = ({ options, onClose, position, title }) => {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Ajustar posição para não sair da tela
  const getAdjustedPosition = () => {
    if (!menuRef.current) return position;

    const rect = menuRef.current.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    let { x, y } = position;

    // Ajustar horizontalmente
    if (x + rect.width > windowWidth) {
      x = windowWidth - rect.width - 10;
    }
    if (x < 10) {
      x = 10;
    }

    // Ajustar verticalmente
    if (y + rect.height > windowHeight) {
      y = windowHeight - rect.height - 10;
    }
    if (y < 10) {
      y = 10;
    }

    return { x, y };
  };

  const adjustedPosition = getAdjustedPosition();

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-30 z-50 animate-fadeIn" onClick={onClose} />
      
      {/* Menu */}
      <div
        ref={menuRef}
        className="fixed z-50 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 min-w-[200px] max-w-[280px] animate-scaleIn overflow-hidden"
        style={{
          left: `${adjustedPosition.x}px`,
          top: `${adjustedPosition.y}px`,
        }}
      >
        {/* Header */}
        {title && (
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-900">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        )}

        {/* Options */}
        <div className="py-2">
          {options.map((option, index) => {
            if (option.type === 'separator') {
              return (
                <div
                  key={index}
                  className="my-1 border-t border-gray-200 dark:border-gray-700"
                />
              );
            }

            const Icon = option.icon;
            const isDanger = option.danger;

            return (
              <button
                key={index}
                onClick={() => {
                  option.onClick();
                  onClose();
                }}
                disabled={option.disabled}
                className={`w-full px-4 py-3 flex items-center gap-3 transition-colors text-left ${
                  option.disabled
                    ? 'opacity-50 cursor-not-allowed'
                    : isDanger
                    ? 'hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                {Icon && (
                  <Icon className={`w-5 h-5 flex-shrink-0 ${
                    isDanger ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
                  }`} />
                )}
                <div className="flex-1 min-w-0">
                  <div className={`font-medium ${
                    isDanger ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'
                  }`}>
                    {option.label}
                  </div>
                  {option.description && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {option.description}
                    </div>
                  )}
                </div>
                {option.badge && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full">
                    {option.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.15s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.2s ease-out;
        }
      `}</style>
    </>
  );
};

/**
 * useLongPress - Hook para detectar long press
 * 
 * @param {Function} onLongPress - Callback quando long press detectado
 * @param {number} delay - Tempo em ms para considerar long press (padrão 500ms)
 */
export const useLongPress = (onLongPress, delay = 500) => {
  const [longPressTriggered, setLongPressTriggered] = useState(false);
  const timeout = useRef(null);
  const target = useRef(null);

  const start = (event) => {
    setLongPressTriggered(false);
    target.current = event.currentTarget;

    // Previne seleção de texto
    event.target.style.userSelect = 'none';
    event.target.style.webkitUserSelect = 'none';

    timeout.current = setTimeout(() => {
      onLongPress(event);
      setLongPressTriggered(true);
    }, delay);
  };

  const clear = () => {
    timeout.current && clearTimeout(timeout.current);
    if (target.current) {
      target.current.style.userSelect = '';
      target.current.style.webkitUserSelect = '';
    }
  };

  return {
    onMouseDown: start,
    onTouchStart: start,
    onMouseUp: clear,
    onMouseLeave: clear,
    onTouchEnd: clear,
    onContextMenu: (event) => {
      event.preventDefault();
      onLongPress(event);
    },
  };
};

export default ContextMenu;
