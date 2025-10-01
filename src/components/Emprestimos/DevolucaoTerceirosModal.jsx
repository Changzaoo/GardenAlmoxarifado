import React, { useState } from 'react';
import { X } from 'lucide-react';

const DevolucaoTerceirosModal = ({ onClose, onConfirm, emprestimo }) => {
  const [devolvidoPorTerceiros, setDevolvidoPorTerceiros] = useState(false);

  const handleSubmit = () => {
    onConfirm(devolvidoPorTerceiros);
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-40 flex items-center justify-center">
        {/* Modal */}
        <div className="relative bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full p-6 m-4 z-50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Confirmar Devolução
            </h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-6">
            <label className="flex items-start space-x-3">
              <input
                type="checkbox"
                checked={devolvidoPorTerceiros}
                onChange={(e) => setDevolvidoPorTerceiros(e.target.checked)}
                className="mt-1 h-4 w-4 text-blue-600 border-gray-200 dark:border-gray-600 rounded"
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

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-600 text-gray-900 dark:text-white rounded hover:bg-blue-700 transition-colors"
            >
              Confirmar Devolução
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default DevolucaoTerceirosModal;



