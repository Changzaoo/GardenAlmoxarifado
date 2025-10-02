import React, { useState } from 'react';
import { CheckCircle, AlertTriangle } from 'lucide-react';

const DevolucaoFerramentasModal = ({ emprestimo, onConfirm, onClose }) => {
  const [ferramentasSelecionadas, setFerramentasSelecionadas] = useState([]);
  const [devolvidoPorTerceiros, setDevolvidoPorTerceiros] = useState(false);

  const handleToggleFerramenta = (ferramenta) => {
    if (ferramentasSelecionadas.includes(ferramenta)) {
      setFerramentasSelecionadas(prev => prev.filter(f => f !== ferramenta));
    } else {
      setFerramentasSelecionadas(prev => [...prev, ferramenta]);
    }
  };

  const handleSelecionarTodas = () => {
    if (ferramentasSelecionadas.length === emprestimo.ferramentas.length) {
      setFerramentasSelecionadas([]);
    } else {
      setFerramentasSelecionadas([...emprestimo.ferramentas]);
    }
  };

  const handleConfirmar = () => {
    onConfirm({
      ferramentas: ferramentasSelecionadas,
      devolvidoPorTerceiros,
      emprestimoId: emprestimo.id
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-xl w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Devolução de Ferramentas
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M18 6 6 18"></path>
              <path d="m6 6 12 12"></path>
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div className="border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-4">
            <div className="flex gap-3 items-start">
              <AlertTriangle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <p className="text-sm text-gray-900 dark:text-white font-semibold">
                  Instruções para devolução:
                </p>
                <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1 list-disc pl-4">
                  <li>Selecione cada ferramenta que está sendo devolvida individualmente</li>
                  <li>Verifique o estado de cada ferramenta antes de confirmar a devolução</li>
                  <li>Em caso de dano ou perda, informe ao responsável do almoxarifado</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {ferramentasSelecionadas.length} de {emprestimo.ferramentas.length} selecionada(s)
            </span>
            <button
              type="button"
              onClick={handleSelecionarTodas}
              className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              {ferramentasSelecionadas.length === emprestimo.ferramentas.length ? 'Desmarcar Todas' : 'Selecionar Todas'}
            </button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {emprestimo.ferramentas.map((ferramenta, index) => (
              <div
                key={index}
                className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  ferramentasSelecionadas.includes(ferramenta)
                    ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30'
                    : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 bg-white dark:bg-gray-700/50'
                }`}
                onClick={() => handleToggleFerramenta(ferramenta)}
              >
                <input
                  type="checkbox"
                  checked={ferramentasSelecionadas.includes(ferramenta)}
                  onChange={() => handleToggleFerramenta(ferramenta)}
                  className="h-5 w-5 text-blue-600 dark:text-blue-500 rounded border-gray-300 dark:border-gray-600 focus:ring-blue-500 cursor-pointer"
                />
                <div className="ml-3 flex-1">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {typeof ferramenta === 'object' ? ferramenta.nome : ferramenta}
                  </span>
                </div>
                {ferramentasSelecionadas.includes(ferramenta) && (
                  <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                )}
              </div>
            ))}
          </div>

          <label className="flex items-start gap-3 cursor-pointer mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-colors">
            <input
              type="checkbox"
              checked={devolvidoPorTerceiros}
              onChange={(e) => setDevolvidoPorTerceiros(e.target.checked)}
              className="mt-1 h-5 w-5 text-blue-600 dark:text-blue-500 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 cursor-pointer"
            />
            <div className="space-y-1">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                Devolvido por terceiros
              </span>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Marque esta opção se a ferramenta foi devolvida por outra pessoa que não o responsável pelo empréstimo.
              </p>
            </div>
          </label>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmar}
            disabled={ferramentasSelecionadas.length === 0}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-green-600"
          >
            Confirmar Devolução ({ferramentasSelecionadas.length})
          </button>
        </div>
      </div>
    </div>
  );
};

export default DevolucaoFerramentasModal;



