import React, { useState } from 'react';
import { X } from 'lucide-react';

const TransferenciaFerramentasModal = ({ onClose, onConfirm, emprestimo, funcionarios }) => {
  const [selectedFuncionario, setSelectedFuncionario] = useState('');
  const [observacao, setObservacao] = useState('');

  const handleSubmit = () => {
    if (!selectedFuncionario) {
      alert('Selecione um funcionário para receber a ferramenta');
      return;
    }

    onConfirm({
      ferramentas: emprestimo.ferramentas,
      funcionarioDestino: selectedFuncionario,
      observacao
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4 pb-24 md:pb-4">
      <div className="bg-gray-100 dark:bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full p-6 max-h-[calc(100vh-12rem)] md:max-h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Transferir Ferramentas
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6 space-y-4">
          <div>
            <h4 className="text-base font-medium text-gray-900 dark:text-white mb-2">
              Ferramenta a ser transferida:
            </h4>
            <div className="space-y-4">
              {emprestimo?.ferramentas.map(tool => (
                <div
                  key={tool.id}
                  className="flex items-center justify-between gap-3 p-2 bg-white dark:bg-gray-800 dark:bg-gray-700 rounded-lg"
                >
                  <span className="text-sm text-white">
                    {tool.nome} ({tool.quantidade} {tool.quantidade > 1 ? 'unidades' : 'unidade'})
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-base font-medium text-gray-900 dark:text-white mb-2">
              Selecione o funcionário que receberá as ferramentas:
            </h4>
            <select
              value={selectedFuncionario}
              onChange={(e) => setSelectedFuncionario(e.target.value)}
              className="w-full bg-white dark:bg-gray-800 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#1D9BF0] transition-colors hover:bg-[#2C3640]"
            >
              <option value="" className="bg-white dark:bg-gray-800">Selecione um funcionário</option>
              {funcionarios?.map(func => (
                <option 
                  key={func.id} 
                  value={func.id}
                  className="bg-white dark:bg-gray-800"
                  disabled={func.id === emprestimo?.funcionarioId}
                >
                  {func.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <h4 className="text-base font-medium text-gray-900 dark:text-white mb-2">
              Observação (opcional):
            </h4>
            <textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Adicione uma observação sobre a transferência..."
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-800 dark:bg-[#22303c] focus:ring-[#1D9BF0] focus:border-[#1D9BF0] h-24 resize-none"
            />
          </div>
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
            className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-white bg-[#1D9BF0] hover:bg-[#1A8CD8] dark:bg-[#1A8CD8] dark:hover:bg-[#1A8CD8]/80 rounded-lg"
          >
            Confirmar Transferência
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransferenciaFerramentasModal;



