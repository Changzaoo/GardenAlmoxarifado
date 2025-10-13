import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const ObservacoesModal = ({ isOpen, onClose, onSave, observacoes: initialObservacoes }) => {
  const [observacoes, setObservacoes] = useState(initialObservacoes || '');

  useEffect(() => {
    setObservacoes(initialObservacoes || '');
  }, [initialObservacoes]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(observacoes);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-md w-full mx-4">
        <div className="p-4 border-b border-gray-200 dark:border-gray-600 dark:border-gray-600 flex items-center justify-between">
          <h3 className="text-lg font-medium text-white">Editar Observações</h3>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          <div className="space-y-4">
            <div>
              <textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Adicione suas observações aqui..."
                className="w-full h-32 px-3 py-2 text-gray-900 dark:text-white bg-white dark:bg-gray-800 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#1D9BF0] focus:border-transparent resize-none"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm bg-blue-500 dark:bg-[#1D9BF0] text-gray-900 dark:text-white rounded-full hover:bg-blue-600 dark:hover:bg-[#1a8cd8] transition-colors"
              >
                Salvar
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ObservacoesModal;



