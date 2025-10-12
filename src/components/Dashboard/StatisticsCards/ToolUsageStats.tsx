import React, { useState, useEffect } from 'react';
import { Wrench, Clock, Award, Calendar, ChevronLeft, ChevronRight, List, X } from 'lucide-react';

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
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showFullRanking, setShowFullRanking] = useState(false);

  const filterOptions = [
    { value: 'total', label: 'Total', icon: Clock },
    { value: 'dia', label: 'Hoje', icon: Calendar },
    { value: 'semana', label: 'Esta Semana', icon: Calendar },
    { value: 'quinzenal', label: 'Últimas 2 Semanas', icon: Calendar },
    { value: 'mes', label: 'Este Mês', icon: Calendar },
    { value: 'ano', label: 'Este Ano', icon: Calendar }
  ];

  // Fecha o dropdown quando clicar fora dele
  useEffect(() => {
    if (!isFilterOpen) return;

    const handleClickOutside = (event) => {
      const picker = document.getElementById('filter-dropdown');
      if (picker && !picker.contains(event.target)) {
        setIsFilterOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isFilterOpen]);

  // Função para verificar se um empréstimo está no período selecionado
  const isInSelectedPeriod = (dataEmprestimo) => {
    const dataEmp = new Date(dataEmprestimo);
    const agora = new Date();
    
    switch (filterType) {
      case 'dia':
        return dataEmp.toDateString() === agora.toDateString();
      
      case 'semana':
        const inicioSemana = new Date(agora);
        inicioSemana.setDate(agora.getDate() - agora.getDay());
        const fimSemana = new Date(inicioSemana);
        fimSemana.setDate(inicioSemana.getDate() + 6);
        return dataEmp >= inicioSemana && dataEmp <= fimSemana;
      
      case 'quinzenal':
        const inicioQuinzena = new Date(agora);
        inicioQuinzena.setDate(agora.getDate() - 14);
        return dataEmp >= inicioQuinzena && dataEmp <= agora;
      
      case 'mes':
        return dataEmp.getMonth() === agora.getMonth() && dataEmp.getFullYear() === agora.getFullYear();
      
      case 'ano':
        return dataEmp.getFullYear() === agora.getFullYear();
      
      case 'total':
      default:
        return true;
    }
  };

  // Calcula estatísticas de uso de ferramentas usando o nome em vez do ID
  const toolUsageStats = emprestimos.reduce((acc, emp) => {
    // Verifica se o empréstimo está no período selecionado
    if (!isInSelectedPeriod(emp.dataEmprestimo)) {
      return acc;
    }
    if (emp.ferramentas) {
      emp.ferramentas.forEach(ferramenta => {
        // Pega o nome da ferramenta, seja ela string ou objeto
        const nomeFerramenta = typeof ferramenta === 'object' ? 
          ferramenta.nome : ferramenta;
        
        // Normaliza o nome para evitar problemas de case
        const nomeNormalizado = nomeFerramenta.trim().toLowerCase();
        
        // Filtra "Baterias Makita" do ranking
        if (nomeNormalizado.includes('bateria') && nomeNormalizado.includes('makita')) {
          return; // Pula esta ferramenta
        }
        
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

  // Ranking completo (todas as ferramentas)
  const allSortedTools = Object.entries(toolUsageStats)
    .sort(([, a], [, b]) => b - a)
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
          {/* Botão único de filtros */}
          <div className="relative">
            <button
              onClick={() => setIsFilterOpen(prev => !prev)}
              className="px-3 py-1 rounded-full text-sm transition-colors bg-blue-500 dark:bg-[#1D9BF0] text-white flex items-center gap-1.5"
            >
              {(() => {
                const currentFilter = filterOptions.find(f => f.value === filterType);
                const IconComponent = currentFilter?.icon || Clock;
                return (
                  <>
                    <IconComponent className="w-4 h-4" />
                    <span>{currentFilter?.label || 'Total'}</span>
                  </>
                );
              })()}
            </button>

            {/* Dropdown de filtros */}
            {isFilterOpen && (
              <div 
                id="filter-dropdown"
                className="absolute right-0 mt-2 w-48 bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl shadow-lg z-50"
              >
                <div className="p-2">
                  {filterOptions.map((option) => {
                    const IconComponent = option.icon;
                    return (
                      <button
                        key={option.value}
                        onClick={() => {
                          setFilterType(option.value);
                          setIsFilterOpen(false);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                          filterType === option.value
                            ? 'bg-blue-500 dark:bg-[#1D9BF0] text-white'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                        }`}
                      >
                        <IconComponent className="w-4 h-4" />
                        <span>{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          {/* Ícone discreto para ranking completo */}
          <button
            onClick={() => setShowFullRanking(true)}
            className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors opacity-60 hover:opacity-100"
            title="Ver ranking completo"
          >
            <List className="w-3.5 h-3.5" />
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

      {/* Modal do Ranking Completo */}
      {showFullRanking && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl shadow-lg w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-300 dark:border-gray-600 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <List className="w-5 h-5 text-blue-500 dark:text-[#1D9BF0]" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Ranking Completo - Ferramentas Mais Utilizadas</h3>
              </div>
              <button
                onClick={() => setShowFullRanking(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {allSortedTools.length > 0 ? (
                <div className="space-y-3">
                  {allSortedTools.map((tool, index) => (
                    <div key={tool.nome} className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-600 rounded-lg">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-500 dark:bg-[#1D9BF0] text-white rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-gray-900 dark:text-white font-medium">{tool.nome}</h4>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-gray-900 dark:text-white">{tool.count}x</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  Nenhum empréstimo registrado ainda
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ToolUsageStats;


