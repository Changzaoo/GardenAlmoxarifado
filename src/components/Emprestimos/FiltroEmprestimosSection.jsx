import React from 'react';
import { Search } from 'lucide-react';

const FiltroEmprestimosSection = ({
  filtroEmprestimos,
  setFiltroEmprestimos,
  filtroPeriodo,
  setFiltroPeriodo,
  filtroStatus,
  setFiltroStatus
}) => {
  return (
    <div className="flex flex-wrap gap-4 items-center">
      {/* Busca por texto */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8899A6]" />
        <input
          type="text"
          value={filtroEmprestimos}
          onChange={(e) => setFiltroEmprestimos(e.target.value)}
          placeholder="Buscar por funcionário ou ferramenta..."
          className="w-full pl-10 pr-4 py-2 bg-[#192734] text-white rounded-lg border border-[#38444D] focus:border-[#1DA1F2] focus:outline-none"
        />
      </div>

      {/* Filtro por período */}
      <select
        value={filtroPeriodo}
        onChange={(e) => setFiltroPeriodo(e.target.value)}
        className="py-2 px-4 bg-[#192734] text-white rounded-lg border border-[#38444D] focus:border-[#1DA1F2] focus:outline-none"
      >
        <option value="todos">Todos os períodos</option>
        <option value="hoje">Hoje</option>
        <option value="semana">Última semana</option>
        <option value="mes">Último mês</option>
      </select>

      {/* Filtro por status */}
      <select
        value={filtroStatus}
        onChange={(e) => setFiltroStatus(e.target.value)}
        className="py-2 px-4 bg-[#192734] text-white rounded-lg border border-[#38444D] focus:border-[#1DA1F2] focus:outline-none"
      >
        <option value="todos">Todos os status</option>
        <option value="emprestado">Em andamento</option>
        <option value="devolvido">Devolvidos</option>
      </select>
    </div>
  );
};

export default FiltroEmprestimosSection;
