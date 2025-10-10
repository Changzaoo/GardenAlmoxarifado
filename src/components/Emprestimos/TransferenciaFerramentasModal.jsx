import React, { useState } from 'react';
import { X, Package2, User } from 'lucide-react';

const TransferenciaFerramentasModal = ({ onClose, onConfirm, emprestimo, funcionarios }) => {
  const [selectedFuncionario, setSelectedFuncionario] = useState('');
  const [observacao, setObservacao] = useState('');

  const handleSubmit = () => {
    if (!selectedFuncionario) {
      alert('Selecione um funcionário para receber as ferramentas');
      return;
    }

    // Encontra o funcionário selecionado
    const funcionarioObj = funcionarios.find(f => f.id === selectedFuncionario);
    
    if (!funcionarioObj) {
      alert('Funcionário não encontrado');
      return;
    }

    onConfirm({
      ferramentas: emprestimo.ferramentas,
      funcionarioDestino: funcionarioObj, // Passa o objeto completo
      observacao
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4 pb-24 md:pb-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 max-h-[calc(100vh-12rem)] md:max-h-[calc(100vh-4rem)] overflow-y-auto border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Transferir Ferramentas
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5">
          {/* Ferramentas */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Package2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                Ferramentas a Transferir
              </h4>
            </div>
            <div className="space-y-2">
              {emprestimo?.ferramentas.map(tool => (
                <div
                  key={tool.id}
                  className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {tool.nome}
                    </span>
                    <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full font-semibold">
                      {tool.quantidade} {tool.quantidade > 1 ? 'unidades' : 'unidade'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Funcionário Destino */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <User className="w-5 h-5 text-green-600 dark:text-green-400" />
              <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                Funcionário Destino
              </h4>
            </div>
            <select
              value={selectedFuncionario}
              onChange={(e) => setSelectedFuncionario(e.target.value)}
              className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all"
            >
              <option value="" className="bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                Selecione um funcionário
              </option>
              {funcionarios?.map(func => (
                <option 
                  key={func.id} 
                  value={func.id}
                  className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  disabled={func.id === emprestimo?.funcionarioId}
                >
                  {func.nome} {func.id === emprestimo?.funcionarioId ? '(Atual)' : ''}
                </option>
              ))}
            </select>
            {!selectedFuncionario && (
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Selecione o funcionário que receberá as ferramentas
              </p>
            )}
          </div>

          {/* Observação */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Observação (opcional)
            </h4>
            <textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Adicione uma observação sobre a transferência..."
              className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all h-24 resize-none"
            />
          </div>
        </div>

        {/* Botões */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-all shadow-sm"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedFuncionario}
            className={`px-5 py-2.5 text-sm font-semibold rounded-lg transition-all shadow-md ${
              selectedFuncionario
                ? 'text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
                : 'text-gray-400 bg-gray-200 dark:bg-gray-700 cursor-not-allowed'
            }`}
          >
            Confirmar Transferência
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransferenciaFerramentasModal;



