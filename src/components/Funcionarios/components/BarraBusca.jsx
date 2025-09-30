import React from 'react';

const BarraBusca = ({ filtroAtual, setFiltroAtual, searchTerm, setSearchTerm }) => {
  return (
    <div className="flex items-center gap-4 mb-4">
      {/* Dropdown de Filtro */}
      <select
        value={filtroAtual}
        onChange={(e) => setFiltroAtual(e.target.value)}
        className="bg-[#192734] text-[#8899A6] hover:bg-[#253341] hover:text-white px-3 py-2 rounded-lg text-sm border border-[#38444D] focus:outline-none focus:ring-2 focus:ring-[#1DA1F2] dark:bg-[#192734] dark:text-[#8899A6] dark:border-[#38444D] dark:hover:bg-[#253341] dark:hover:text-white transition-colors cursor-pointer w-[200px]"
      >
        <option value="nome">Nome</option>
        <option value="pontos">Mais Pontos</option>
        <option value="avaliacao">Mais Avaliados</option>
        <option value="tarefas">Mais Tarefas</option>
        <option value="emprestimos">Mais Empréstimos</option>
      </select>

      {/* Campo de Busca */}
      <div className="relative w-36">
        <input
          type="text"
          placeholder="         Buscar..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 pl-12 rounded-lg text-sm bg-[#192734] border border-[#38444D] text-white focus:outline-none focus:ring-2 focus:ring-[#1DA1F2]"
        />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-[#8899A6]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
    </div>
  );
};

export default BarraBusca;