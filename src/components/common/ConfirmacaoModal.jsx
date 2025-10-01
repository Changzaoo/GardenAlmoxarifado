import React from 'react';
import { twitterThemeConfig } from '../../styles/twitterThemeConfig';
import { AlertTriangle } from 'lucide-react';

const ConfirmacaoModal = ({ isOpen, onClose, onConfirm, titulo, mensagem }) => {
  const { colors, classes } = twitterThemeConfig;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50">
      <div className={`${classes.card} w-full max-w-md p-6 bg-white dark:bg-gray-800 dark:bg-[#15202B]`}>
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-[#F4212E]" />
          <h3 className={`text-xl font-medium ${colors.text}`}>{titulo}</h3>
        </div>

        <p className={`${colors.textSecondary} mb-6`}>{mensagem}</p>

        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-full border ${colors.border} ${colors.text} hover:bg-opacity-10 hover:bg-[#1D9BF0] transition-colors`}
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 rounded-full bg-[#F4212E] text-gray-900 dark:text-white hover:bg-[#DC1F2B] transition-colors"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmacaoModal;


