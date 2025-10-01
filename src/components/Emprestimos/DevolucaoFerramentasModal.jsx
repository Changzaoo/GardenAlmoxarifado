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

  const handleConfirmar = () => {
    onConfirm({
      ferramentas: ferramentasSelecionadas,
      devolvidoPorTerceiros,
      emprestimoId: emprestimo.id
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-100 dark:bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-xl w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Devolução de Ferramentas
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M18 6 6 18"></path>
              <path d="m6 6 12 12"></path>
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div className="border border-[#1D9BF0]/20 bg-[#1D9BF0]/20 dark:bg-[#1D9BF0]/10 rounded-lg p-4 mb-4">
            <div className="flex gap-2 items-start">
              <AlertTriangle className="w-5 h-5 text-[#1D9BF0] mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm text-gray-900 dark:text-white font-medium">
                  Instruções para devolução:
                </p>
                <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1 list-disc pl-4">
                  <li>Selecione cada ferramenta que está sendo devolvida individualmente</li>
                  <li>Verifique o estado de cada ferramenta antes de confirmar a devolução</li>
                  <li>Em caso de dano ou perda, informe ao responsável do almoxarifado</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {emprestimo.ferramentas.map((ferramenta, index) => (
              <div
                key={index}
                className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                  ferramentasSelecionadas.includes(ferramenta)
                    ? 'border-[#1D9BF0] bg-[#1D9BF0]/20 dark:bg-[#1D9BF0]/10'
                    : 'border-gray-300 dark:border-gray-700 hover:border-[#1D9BF0] bg-gray-50 dark:bg-gray-800'
                }`}
                onClick={() => handleToggleFerramenta(ferramenta)}
              >
                <input
                  type="checkbox"
                  checked={ferramentasSelecionadas.includes(ferramenta)}
                  onChange={() => handleToggleFerramenta(ferramenta)}
                  className="h-4 w-4 text-[#1D9BF0] rounded border-gray-200 dark:border-gray-600 dark:border-gray-600"
                />
                <div className="ml-3 flex-1">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {typeof ferramenta === 'object' ? ferramenta.nome : ferramenta}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <label className="flex items-start gap-3 cursor-pointer mt-4">
            <input
              type="checkbox"
              checked={devolvidoPorTerceiros}
              onChange={(e) => setDevolvidoPorTerceiros(e.target.checked)}
              className="mt-1 h-4 w-4 text-[#1D9BF0] border-gray-200 dark:border-gray-600 dark:border-gray-600 rounded"
            />
            <div className="space-y-1">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Devolvido por terceiros
              </span>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Marque esta opção se a ferramenta foi devolvida por outra pessoa que não o responsável pelo empréstimo.
              </p>
            </div>
          </label>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-[#22303c] hover:bg-gray-200 dark:hover:bg-[#2C3C4C] rounded-lg focus:outline-none"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmar}
            disabled={ferramentasSelecionadas.length === 0}
            className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-white bg-green-600 hover:bg-green-700 dark:bg-[#1A8CD8] dark:hover:bg-[#1A8CD8]/80 rounded-lg focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirmar Devolução
          </button>
        </div>
      </div>
    </div>
  );
};

export default DevolucaoFerramentasModal;



