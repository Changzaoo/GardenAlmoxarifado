import React, { useState, useEffect } from 'react';
import { Wrench, Clock, Award, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

const mesesDoAno = [
  { valor: 0, nome: 'Janeiro' },
  { valor: 1, nome: 'Fevereiro' },
  { valor: 2, nome: 'Março' },
  { valor: 3, nome: 'Abril' },
  { valor: 4, nome: 'Maio' },
  { valor: 5, nome: 'Junho' },
  { valor: 6, nome: 'Julho' },
  { valor: 7, nome: 'Agosto' },
  { valor: 8, nome: 'Setembro' },
  { valor: 9, nome: 'Outubro' },
  { valor: 10, nome: 'Novembro' },
  { valor: 11, nome: 'Dezembro' }
];

const ToolUsageStats = ({ emprestimos, inventario }) => {
  const [filterType, setFilterType] = useState('total');
  const hoje = new Date();
  const [selectedMonth, setSelectedMonth] = useState(hoje.getMonth());
  const [selectedYear, setSelectedYear] = useState(hoje.getFullYear());
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Fecha o dropdown quando clicar fora dele
  useEffect(() => {
    if (!isDatePickerOpen) return;

    const handleClickOutside = (event) => {
      const picker = document.getElementById('date-picker-dropdown');
      if (picker && !picker.contains(event.target)) {
        setIsDatePickerOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDatePickerOpen]);

  // Calcula estatísticas de uso de ferramentas usando o nome em vez do ID
  const toolUsageStats = emprestimos.reduce((acc, emp) => {
    // Verifica se o empréstimo está no mês atual (se filtro mensal estiver ativo)
    if (filterType === 'mensal') {
      const dataEmp = new Date(emp.dataEmprestimo);
      if (dataEmp.getMonth() !== selectedMonth || dataEmp.getFullYear() !== selectedYear) {
        return acc;
      }
    }
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
    .slice(0, 10)
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
    <div className="bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm p-4 hover:border-blue-500 dark:hover:border-[#1D9BF0] transition-colors">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Wrench className="w-5 h-5 text-blue-500 dark:text-[#1D9BF0]" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Ferramentas Mais Utilizadas</h3>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => {
              setFilterType('mensal');
              setIsDatePickerOpen(prev => !prev);
            }}
            className={`px-3 py-1 rounded-full text-sm transition-colors relative ${
              filterType === 'mensal'
                ? 'bg-blue-500 dark:bg-[#1D9BF0] text-white'
                : 'text-gray-600 dark:text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#283340]'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span>{filterType === 'mensal' ? `${mesesDoAno[selectedMonth].nome.substring(0, 3)}/${selectedYear}` : 'Mensal'}</span>
            </div>

            {/* Date Picker Dropdown */}
            {isDatePickerOpen && filterType === 'mensal' && (
              <div 
                id="date-picker-dropdown"
                className="absolute right-0 mt-2 w-[280px] bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl shadow-lg z-50"
              >
                <div className="p-3">
                  {/* Header com ano e navegação */}
                  <div className="flex items-center justify-between mb-4">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedYear(selectedYear - 1);
                      }}
                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#38444D] rounded-full transition-colors text-gray-600 dark:text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    
                    <span className="text-gray-900 dark:text-white font-medium">{selectedYear}</span>
                    
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedYear(selectedYear + 1);
                      }}
                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#38444D] rounded-full transition-colors text-gray-600 dark:text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Grid de meses */}
                  <div className="grid grid-cols-3 gap-2">
                    {mesesDoAno.map((mes) => (
                      <button
                        key={mes.valor}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMonth(mes.valor);
                          setIsDatePickerOpen(false);
                        }}
                        className={`
                          p-2 rounded text-sm font-medium transition-colors
                          ${selectedMonth === mes.valor 
                            ? 'bg-blue-500 dark:bg-[#1D9BF0] text-white' 
                            : 'text-gray-600 dark:text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#38444D] hover:text-gray-900 dark:hover:text-white'}
                        `}
                      >
                        {mes.nome.substring(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </button>
          
          <button
            onClick={() => setFilterType('total')}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              filterType === 'total'
                ? 'bg-blue-500 dark:bg-[#1D9BF0] text-white'
                : 'text-gray-600 dark:text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#283340]'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>Total</span>
            </div>
          </button>
        </div>
      </div>
      <div className="space-y-2">
        {sortedTools.length > 0 ? (
          sortedTools.map(({ nome, count }, index) => (
            <div key={nome} className="flex items-center justify-between p-2 rounded hover:bg-gray-50 dark:hover:bg-white dark:bg-gray-700 transition-colors">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex items-center justify-center w-6">
                  {index < 3 ? (
                    <Award 
                      className={`w-5 h-5 ${
                        index === 0 ? 'text-yellow-500' :
                        index === 1 ? 'text-gray-400' :
                        'text-amber-700'
                      }`} 
                    />
                  ) : (
                    <span className="text-gray-600 dark:text-gray-500 dark:text-gray-400 text-sm font-medium">
                      {index + 1}
                    </span>
                  )}
                </div>
                <span className="text-gray-700 dark:text-gray-500 dark:text-gray-400 truncate">
                  {nome.charAt(0).toUpperCase() + nome.slice(1)}
                </span>
              </div>
              <div className="flex items-center gap-2 ml-3">
                <Clock className="w-4 h-4 text-blue-500 dark:text-[#1D9BF0]" />
                <span className="text-gray-900 dark:text-white font-medium whitespace-nowrap">{count}x</span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-600 dark:text-gray-500 dark:text-gray-400 py-4">
            {filterType === 'mensal' 
              ? 'Nenhum empréstimo registrado este mês'
              : 'Nenhum empréstimo registrado ainda'
            }
          </div>
        )}
      </div>
    </div>
  );
};

export default ToolUsageStats;


