import React from 'react';
import { Users } from 'lucide-react';
import { useFuncionarios } from '../Funcionarios/FuncionariosProvider';

const SeletorFuncionarios = ({ selecionados = [], onChange, disabled = false }) => {
  const { funcionarios } = useFuncionarios();

  const handleToggleFuncionario = (id) => {
    if (selecionados.includes(id)) {
      onChange(selecionados.filter(fId => fId !== id));
    } else {
      onChange([...selecionados, id]);
    }
  };

  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <Users className="w-4 h-4" />
        Responsáveis
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
        {funcionarios.map(funcionario => (
          <label
            key={funcionario.id}
            className={`
              flex items-center gap-2 p-2 rounded-lg cursor-pointer
              ${selecionados.includes(funcionario.id)
                ? 'bg-[#1D9BF0] bg-opacity-10 text-[#1D9BF0]'
                : 'hover:bg-[#1D9BF0] hover:bg-opacity-5'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input
              type="checkbox"
              checked={selecionados.includes(funcionario.id)}
              onChange={() => handleToggleFuncionario(funcionario.id)}
              disabled={disabled}
              className="hidden"
            />
            <div className={`w-4 h-4 border rounded ${
              selecionados.includes(funcionario.id)
                ? 'border-[#1D9BF0] bg-[#1D9BF0]'
                : 'border-[#8899A6]'
            }`}>
              {selecionados.includes(funcionario.id) && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4 text-white"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
            <span className={selecionados.includes(funcionario.id) ? 'font-medium' : ''}>
              {funcionario.nome}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default SeletorFuncionarios;
