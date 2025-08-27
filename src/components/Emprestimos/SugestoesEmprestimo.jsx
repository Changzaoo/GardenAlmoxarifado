import React from 'react';
import { useFerramentasAnalytics } from '../../hooks/useFerramentasAnalytics';

const SugestoesEmprestimo = ({ funcionarioSelecionado }) => {
  const { funcionariosRanking, ferramentasRanking, sugestoesPorFuncionario } = useFerramentasAnalytics();

  // Pega as sugestões para o funcionário selecionado
  const sugestoesFuncionario = funcionarioSelecionado 
    ? sugestoesPorFuncionario[funcionarioSelecionado]
    : null;

  return (
    <div className="mt-4 space-y-4">
      {/* Sugestões para o funcionário selecionado */}
      {funcionarioSelecionado && sugestoesFuncionario && sugestoesFuncionario.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 mb-2">
            Ferramentas mais utilizadas por {funcionarioSelecionado}:
          </h3>
          <div className="space-y-1">
            {sugestoesFuncionario.map((ferramenta, index) => (
              <div key={index} className="text-sm text-blue-800 flex items-center">
                <span className="font-medium">{ferramenta.nome}</span>
                <span className="text-blue-600 ml-2">({ferramenta.frequencia}x)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rankings em dropdown */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Funcionários Frequentes
          </label>
          <select className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
            {funcionariosRanking.map((funcionario, index) => (
              <option key={index} value={funcionario.nome}>
                {funcionario.nome} ({funcionario.frequencia} empréstimos)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ferramentas Mais Usadas
          </label>
          <select className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
            {ferramentasRanking.map((ferramenta, index) => (
              <option key={index} value={ferramenta.nome}>
                {ferramenta.nome} ({ferramenta.frequencia} usos)
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default SugestoesEmprestimo;
