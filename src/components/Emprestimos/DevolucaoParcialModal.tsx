import React, { useState } from 'react';

const DevolucaoParcialModal = ({ emprestimo, onClose, onConfirm }) => {
  const [devolvidoPorTerceiros, setDevolvidoPorTerceiros] = useState(false);

  // Verificação de segurança para garantir que emprestimo e ferramentas existem
  if (!emprestimo || !Array.isArray(emprestimo.ferramentas)) {
    console.error('Empréstimo inválido:', emprestimo);
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-lg w-full">
        <h2 className="text-xl font-semibold mb-4 text-red-600">Erro</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Não foi possível carregar os dados do empréstimo.
        </p>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-gray-900 dark:text-white rounded hover:bg-gray-700 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    // Como agora só trabalhamos com uma ferramenta por vez, podemos passar diretamente a primeira ferramenta
    onConfirm(emprestimo.ferramentas, devolvidoPorTerceiros);
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-lg w-full">
      <h2 className="text-xl font-semibold mb-4 dark:text-white">Devolução de Ferramentas</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <p className="text-gray-600 dark:text-gray-300 mb-2">Ferramenta a ser devolvida:</p>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {emprestimo.ferramentas.map((ferramenta) => (
              <div key={ferramenta.id} className="flex items-center">
                <span className="text-gray-700 dark:text-gray-200">
                  {ferramenta.nome}
                  {ferramenta.quantidade > 1 && (
                    <span className="text-gray-500 dark:text-gray-400 ml-2">
                      ({ferramenta.quantidade} unidades)
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={devolvidoPorTerceiros}
              onChange={(e) => setDevolvidoPorTerceiros(e.target.checked)}
              className="form-checkbox h-5 w-5 text-blue-600 rounded border-gray-200 dark:border-gray-600 dark:border-gray-600"
            />
            <span className="text-gray-700 dark:text-gray-200">
              Devolvido por terceiros
            </span>
          </label>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-gray-900 dark:text-white rounded hover:bg-blue-700 transition-colors"
          >
            Confirmar Devolução
          </button>
        </div>
      </form>
    </div>
  );
};

export default DevolucaoParcialModal;


