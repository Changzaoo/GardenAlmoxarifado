import React from 'react';
import { Wrench, Clock, Award } from 'lucide-react';

const ToolUsageStats = ({ emprestimos, inventario }) => {
  // Calcula estatísticas de uso de ferramentas
  const toolUsageStats = emprestimos.reduce((acc, emp) => {
    emp.ferramentas.forEach(ferramenta => {
      const ferramentaId = typeof ferramenta === 'object' ? ferramenta.id : ferramenta;
      acc[ferramentaId] = (acc[ferramentaId] || 0) + 1;
    });
    return acc;
  }, {});

  // Ordena ferramentas por frequência de uso
  const sortedTools = Object.entries(toolUsageStats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([ferramentaId, count]) => ({
      ferramenta: inventario.find(f => f.id === ferramentaId) || { nome: 'Ferramenta Removida' },
      count
    }));

  return (
    <div className="bg-[#192734] p-4 rounded-xl border border-[#38444D] hover:border-[#1DA1F2] transition-colors">
      <div className="flex items-center gap-2 mb-4">
        <Wrench className="w-5 h-5 text-[#1DA1F2]" />
        <h3 className="text-lg font-semibold text-white">Ferramentas Mais Utilizadas</h3>
      </div>
      <div className="space-y-3">
        {sortedTools.length > 0 ? (
          sortedTools.map(({ ferramenta, count }, index) => (
            <div key={ferramenta.id || index} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {index < 3 && <Award className="w-4 h-4 text-yellow-500" />}
                <span className="text-[#8899A6]">{ferramenta.nome || 'Ferramenta não encontrada'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#1DA1F2]" />
                <span className="text-white font-medium">{count}x</span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-[#8899A6]">
            Nenhum empréstimo registrado ainda
          </div>
        )}
      </div>
    </div>
  );
};

export default ToolUsageStats;