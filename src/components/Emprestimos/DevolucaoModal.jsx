import React, { useState } from 'react';
import { X } from 'lucide-react';

const DevolucaoModal = ({ isOpen, onClose, onConfirm }) => {
  const [devolvidoPorTerceiros, setDevolvidoPorTerceiros] = useState(false);
  const [observacoes, setObservacoes] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(devolvidoPorTerceiros, observacoes);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-md w-full mx-4">
        <div className="p-4 border-b border-gray-200 dark:border-gray-600 dark:border-gray-600 flex items-center justify-between">
          <h3 className="text-lg font-medium text-white">Confirmação de Devolução</h3>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={devolvidoPorTerceiros}
                onChange={(e) => setDevolvidoPorTerceiros(e.target.checked)}
                className="mt-1 h-4 w-4 text-blue-500 dark:text-[#1D9BF0] border-gray-200 dark:border-gray-600 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-[#1D9BF0] bg-white dark:bg-gray-800 dark:bg-gray-700"
              />
              <div className="space-y-1">
                <span className="text-sm font-medium text-white">
                  Ferramenta devolvida por terceiros
                </span>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Marque esta opção se a ferramenta foi devolvida por outra pessoa que não o responsável pelo empréstimo.
                </p>
              </div>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
              Observações
            </label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Adicione observações sobre a devolução (opcional)"
              className="w-full h-24 px-3 py-2 text-gray-900 dark:text-white bg-white dark:bg-gray-800 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#1D9BF0] focus:border-transparent resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-blue-500 dark:bg-[#1D9BF0] text-gray-900 dark:text-white rounded-full hover:bg-[#1A8CD8] transition-colors"
            >
              Confirmar Devolução
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DevolucaoModal;



