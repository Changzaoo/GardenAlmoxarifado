import React from 'react';
import { Wrench, Clock, Award } from 'lucide-react';

const ToolUsageStats = ({ emprestimos, inventario }) => {
  // Calcula estatísticas de uso de ferramentas usando o nome em vez do ID
  const toolUsageStats = emprestimos.reduce((acc, emp) => {
    if (emp.ferramentas) {
      emp.ferramentas.forEach(ferramenta => {
        // Pega o nome da ferramenta, seja ela string ou objeto
        const nomeFerramenta = typeof ferramenta === 'object' ? 
          ferramenta.nome : ferramenta;
        
        // Normaliza o nome para evitar problemas de case
        const nomeNormalizado = nomeFerramenta.trim().toLowerCase();
        
        // Adiciona a quantidade emprestada (se disponível) ou 1
        const quantidade = typeof ferramenta === 'object' ? 
          (ferramenta.quantidade || 1) : 1;
        
        acc[nomeNormalizado] = (acc[nomeNormalizado] || 0) + quantidade;
      });
    }
    return acc;
  }, {});

  // Ordena ferramentas por frequência de uso
  const sortedTools = Object.entries(toolUsageStats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([nomeNormalizado, count]) => {
      // Encontra a ferramenta no inventário
      const ferramenta = inventario.find(f => 
        f.nome.trim().toLowerCase() === nomeNormalizado
      );
      
      return {
        nome: ferramenta ? ferramenta.nome : nomeNormalizado,
        count
      };
    });

  return (
    <div className="bg-[#192734] p-4 rounded-xl border border-[#38444D] hover:border-[#1DA1F2] transition-colors">
      <div className="flex items-center gap-2 mb-4">
        <Wrench className="w-5 h-5 text-[#1DA1F2]" />
        <h3 className="text-lg font-semibold text-white">Ferramentas Mais Utilizadas</h3>
      </div>
      <div className="space-y-3">
        {sortedTools.length > 0 ? (
          sortedTools.map(({ nome, count }, index) => (
            <div key={nome} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {index < 3 && (
                  <Award 
                    className={`w-4 h-4 ${
                      index === 0 ? 'text-yellow-500' :
                      index === 1 ? 'text-gray-400' :
                      'text-amber-700'
                    }`} 
                  />
                )}
                <span className="text-[#8899A6]">
                  {nome.charAt(0).toUpperCase() + nome.slice(1)}
                </span>
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