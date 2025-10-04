import React from 'react';
import { X, AlertTriangle, CheckCircle, Info, AlertCircle } from 'lucide-react';
import './CustomModal.css';

/**
 * Modal Customizado para substituir alert, confirm e prompt nativos
 * 
 * Tipos:
 * - alert: Simples aviso
 * - confirm: Confirmação com OK/Cancelar
 * - success: Mensagem de sucesso
 * - error: Mensagem de erro
 * - info: Informação
 */

const CustomModal = ({ 
  isOpen, 
  onClose, 
  onConfirm,
  type = 'alert', // 'alert', 'confirm', 'success', 'error', 'info'
  title,
  message,
  confirmText = 'OK',
  cancelText = 'Cancelar',
  showCancel = false
}) => {
  if (!isOpen) return null;

  // Configurações por tipo
  const configs = {
    alert: {
      icon: AlertCircle,
      iconColor: 'text-blue-600 dark:text-blue-400',
      iconBg: 'bg-blue-100 dark:bg-blue-900/30',
      title: title || 'Aviso',
      buttonColor: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
    },
    confirm: {
      icon: AlertTriangle,
      iconColor: 'text-yellow-600 dark:text-yellow-400',
      iconBg: 'bg-yellow-100 dark:bg-yellow-900/30',
      title: title || 'Confirmação',
      buttonColor: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
    },
    success: {
      icon: CheckCircle,
      iconColor: 'text-green-600 dark:text-green-400',
      iconBg: 'bg-green-100 dark:bg-green-900/30',
      title: title || 'Sucesso',
      buttonColor: 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
    },
    error: {
      icon: AlertCircle,
      iconColor: 'text-red-600 dark:text-red-400',
      iconBg: 'bg-red-100 dark:bg-red-900/30',
      title: title || 'Erro',
      buttonColor: 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
    },
    info: {
      icon: Info,
      iconColor: 'text-blue-600 dark:text-blue-400',
      iconBg: 'bg-blue-100 dark:bg-blue-900/30',
      title: title || 'Informação',
      buttonColor: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
    }
  };

  const config = configs[type] || configs.alert;
  const Icon = config.icon;

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 dark:bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-gray-700 animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${config.iconBg}`}>
              <Icon className={`w-6 h-6 ${config.iconColor}`} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {config.title}
            </h3>
          </div>
          {type === 'alert' && (
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
            {message}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 pt-0">
          {(showCancel || type === 'confirm') && (
            <button
              onClick={handleCancel}
              className="flex-1 px-4 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium transition-all transform hover:scale-105"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={handleConfirm}
            className={`flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r ${config.buttonColor} text-white font-medium shadow-md transition-all transform hover:scale-105`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomModal;
