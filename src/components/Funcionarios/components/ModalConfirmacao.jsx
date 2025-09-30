import React from 'react';

const ModalConfirmacao = ({ funcionario, onCancel, onConfirm, loading }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#192734] rounded-2xl p-6 w-full max-w-md border border-[#38444D]">
        <h3 className="text-xl font-semibold text-white mb-4">
          Confirmar Exclusão
        </h3>
        <p className="text-sm text-[#8899A6] mb-4">
          Tem certeza que deseja excluir o funcionário "{funcionario.nome}"?
          Esta ação não pode ser desfeita.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-[#8899A6] bg-[#253341] hover:bg-[#192734] rounded-lg transition-colors"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            disabled={loading}
          >
            {loading ? 'Excluindo...' : 'Excluir'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalConfirmacao;