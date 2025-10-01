import React from 'react';
import { ChevronDown } from 'lucide-react';

function FerramentaSelector({ ferramentasDisponiveis, onAdicionarFerramenta }) {
  return (
    <div className="relative w-full">
      <select
        onChange={(e) => {
          if (e.target.value) {
            onAdicionarFerramenta(e.target.value);
            e.target.value = ''; // Reset select after adding
          }
        }}
        className="h-[36px] w-full text-sm font-medium rounded-lg appearance-none pl-4 pr-10 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 dark:border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-[#1D9BF0]"
      >
        <option value="">Selecione uma ferramenta...</option>
        {ferramentasDisponiveis
          .sort((a, b) => a.nome.localeCompare(b.nome))
          .map((ferramenta) => (
            <option key={ferramenta.nome} value={ferramenta.nome}>
              {ferramenta.nome} ({ferramenta.disponivel} disponíveis)
            </option>
          ))}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
        <ChevronDown className="h-4 w-4 text-gray-400" />
      </div>
    </div>
  );
}

export default FerramentaSelector;

