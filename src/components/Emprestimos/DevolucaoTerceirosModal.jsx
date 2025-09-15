import React, { useState } from 'react';
import { X } from 'lucide-react';

const DevolucaoTerceirosModal = ({ onClose, onConfirm }) => {
  const [devolvidoPorTerceiros, setDevolvidoPorTerceiros] = useState(false);

  const handleSubmit = () => {
    onConfirm(devolvidoPorTerceiros);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-100 dark:bg-[#192734] rounded-lg shadow-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Confirmação de Devolução</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={devolvidoPorTerceiros}
              onChange={(e) => setDevolvidoPorTerceiros(e.target.checked)}
              className="mt-1 h-4 w-4 text-[#1D9BF0] border-gray-300 dark:border-gray-600 rounded focus:ring-[#1D9BF0] bg-white dark:bg-gray-700"
            />
            <div className="space-y-1">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Ferramenta devolvida por terceiros
              </span>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Marque esta opção se a ferramenta foi devolvida por outra pessoa que não o responsável pelo empréstimo.
              </p>
            </div>
          </label>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-[#22303c] hover:bg-gray-200 dark:hover:bg-[#2C3C4C] rounded-lg"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-sm font-medium text-white bg-[#1D9BF0] hover:bg-[#1A8CD8] dark:bg-[#1A8CD8] dark:hover:bg-[#1A8CD8]/80 rounded-lg"
          >
            Confirmar Devolução
          </button>
        </div>
      </div>
    </div>
  );
};

export default DevolucaoTerceirosModal;
