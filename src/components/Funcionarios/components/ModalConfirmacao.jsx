import React from 'react';

const ModalConfirmacao = ({ funcionario, onCancel, onConfirm, loading }) => {
  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 dark:bg-black/70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md border border-gray-200 dark:border-gray-600">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Confirmar Exclusão
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Tem certeza que deseja excluir o funcionário "{funcionario.nome}"?
          Esta ação não pode ser desfeita.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm text-gray-900 dark:text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
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




