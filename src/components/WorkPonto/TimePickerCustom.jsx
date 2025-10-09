import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Check, X } from 'lucide-react';

const TimePickerCustom = ({ 
  value = '', 
  onChange, 
  onSave, 
  onCancel, 
  label = 'Selecione o horário',
  color = 'blue' // green, orange, blue, red
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedHour, setSelectedHour] = useState('');
  const [selectedMinute, setSelectedMinute] = useState('');
  const pickerRef = useRef(null);

  // Inicializar com valor existente
  useEffect(() => {
    if (value && value !== '--:--') {
      const [h, m] = value.split(':');
      setSelectedHour(h);
      setSelectedMinute(m);
    } else {
      setSelectedHour('');
      setSelectedMinute('');
    }
  }, [value]);

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        handleCancel();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  const colorClasses = {
    green: {
      bg: 'bg-green-500',
      bgLight: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-500',
      text: 'text-green-600 dark:text-green-400',
      hover: 'hover:bg-green-500',
      selected: 'bg-green-500 text-white'
    },
    orange: {
      bg: 'bg-orange-500',
      bgLight: 'bg-orange-50 dark:bg-orange-900/20',
      border: 'border-orange-500',
      text: 'text-orange-600 dark:text-orange-400',
      hover: 'hover:bg-orange-500',
      selected: 'bg-orange-500 text-white'
    },
    blue: {
      bg: 'bg-blue-500',
      bgLight: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-500',
      text: 'text-blue-600 dark:text-blue-400',
      hover: 'hover:bg-blue-500',
      selected: 'bg-blue-500 text-white'
    },
    red: {
      bg: 'bg-red-500',
      bgLight: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-500',
      text: 'text-red-600 dark:text-red-400',
      hover: 'hover:bg-red-500',
      selected: 'bg-red-500 text-white'
    }
  };

  const colors = colorClasses[color] || colorClasses.blue;

  const handleHourSelect = (hour) => {
    setSelectedHour(hour);
    // Se já tem minuto selecionado, salva automaticamente
    if (selectedMinute) {
      const newValue = `${hour}:${selectedMinute}`;
      onChange?.(newValue);
      onSave?.(newValue);
      setIsOpen(false);
    }
  };

  const handleMinuteSelect = (minute) => {
    setSelectedMinute(minute);
    // Se já tem hora selecionada, salva automaticamente
    if (selectedHour) {
      const newValue = `${selectedHour}:${minute}`;
      onChange?.(newValue);
      onSave?.(newValue);
      setIsOpen(false);
    }
  };

  const handleSave = () => {
    if (selectedHour && selectedMinute) {
      const timeValue = `${selectedHour}:${selectedMinute}`;
      onSave?.(timeValue);
      setIsOpen(false);
    } else if (!selectedHour && !selectedMinute) {
      // Se não selecionou nada, considerar como remoção
      onSave?.('');
      setIsOpen(false);
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    onCancel?.();
  };

  const handleClear = () => {
    setSelectedHour('');
    setSelectedMinute('');
    onChange?.('');
  };

  const displayValue = selectedHour && selectedMinute 
    ? `${selectedHour}:${selectedMinute}` 
    : value || '--:--';

  return (
    <div className="relative" ref={pickerRef}>
      {/* Botão de exibição */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all font-mono text-lg flex items-center justify-between ${
          isOpen 
            ? `${colors.border} ${colors.bgLight} ring-4 ring-${color}-500/30` 
            : `border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:${colors.border}`
        } ${colors.text}`}
      >
        <span className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          {displayValue}
        </span>
        {value && value !== '--:--' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </button>

      {/* Picker Dialog */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.15 }}
            className={`absolute top-full left-0 mt-2 z-50 ${colors.bgLight} border-2 ${colors.border} rounded-xl shadow-2xl overflow-hidden backdrop-blur-lg`}
            style={{ minWidth: '320px' }}
          >
            {/* Header */}
            <div className={`${colors.bg} px-4 py-3 flex items-center justify-between`}>
              <div className="flex items-center gap-2 text-white">
                <Clock className="w-5 h-5" />
                <span className="font-semibold">{label}</span>
              </div>
              <div className="text-white text-xl font-bold font-mono">
                {selectedHour || '--'}:{selectedMinute || '--'}
              </div>
            </div>

            {/* Seletores */}
            <div className="grid grid-cols-2 gap-4 p-4">
              {/* Horas */}
              <div>
                <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 text-center">
                  HORA
                </div>
                <div className="h-48 overflow-y-auto custom-scrollbar bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  {hours.map((hour) => (
                    <button
                      key={hour}
                      onClick={() => handleHourSelect(hour)}
                      className={`w-full px-4 py-2 text-center font-mono transition-colors ${
                        selectedHour === hour
                          ? `${colors.selected} font-bold`
                          : `text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700`
                      }`}
                    >
                      {hour}
                    </button>
                  ))}
                </div>
              </div>

              {/* Minutos */}
              <div>
                <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2 text-center">
                  MINUTO
                </div>
                <div className="h-48 overflow-y-auto custom-scrollbar bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  {minutes.map((minute) => (
                    <button
                      key={minute}
                      onClick={() => handleMinuteSelect(minute)}
                      className={`w-full px-4 py-2 text-center font-mono transition-colors ${
                        selectedMinute === minute
                          ? `${colors.selected} font-bold`
                          : `text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700`
                      }`}
                    >
                      {minute}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Ações */}
            <div className="grid grid-cols-3 gap-2 p-4 bg-gray-50 dark:bg-gray-900/50">
              <button
                onClick={handleClear}
                className="px-4 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                Limpar
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className={`px-4 py-2 ${colors.bg} hover:opacity-90 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                  (!selectedHour || !selectedMinute) && 'opacity-50 cursor-not-allowed'
                }`}
                disabled={!selectedHour || !selectedMinute}
              >
                <Check className="w-4 h-4" />
                Salvar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.5);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(156, 163, 175, 0.7);
        }
      `}</style>
    </div>
  );
};

export default TimePickerCustom;
