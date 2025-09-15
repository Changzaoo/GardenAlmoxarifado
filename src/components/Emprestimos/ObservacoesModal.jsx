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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#192734] rounded-xl shadow-lg max-w-md w-full mx-4">
        <div className="p-4 border-b border-[#38444D] flex items-center justify-between">
          <h3 className="text-lg font-medium text-white">Editar Observações</h3>
          <button
            onClick={onClose}
            className="text-[#8899A6] hover:text-white transition-colors"
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
                className="w-full h-32 px-3 py-2 text-white bg-[#253341] border border-[#38444D] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1DA1F2] focus:border-transparent resize-none"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-[#8899A6] hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm bg-[#1DA1F2] text-white rounded-full hover:bg-[#1A8CD8] transition-colors"
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