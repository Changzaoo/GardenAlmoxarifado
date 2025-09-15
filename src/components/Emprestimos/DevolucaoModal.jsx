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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#192734] rounded-xl shadow-lg max-w-md w-full mx-4">
        <div className="p-4 border-b border-[#38444D] flex items-center justify-between">
          <h3 className="text-lg font-medium text-white">Confirmação de Devolução</h3>
          <button
            onClick={onClose}
            className="text-[#8899A6] hover:text-white transition-colors"
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
                className="mt-1 h-4 w-4 text-[#1DA1F2] border-[#38444D] rounded focus:ring-[#1DA1F2] bg-[#253341]"
              />
              <div className="space-y-1">
                <span className="text-sm font-medium text-white">
                  Ferramenta devolvida por terceiros
                </span>
                <p className="text-sm text-[#8899A6]">
                  Marque esta opção se a ferramenta foi devolvida por outra pessoa que não o responsável pelo empréstimo.
                </p>
              </div>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-1">
              Observações
            </label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Adicione observações sobre a devolução (opcional)"
              className="w-full h-24 px-3 py-2 text-white bg-[#253341] border border-[#38444D] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1DA1F2] focus:border-transparent resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
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
              Confirmar Devolução
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DevolucaoModal;
