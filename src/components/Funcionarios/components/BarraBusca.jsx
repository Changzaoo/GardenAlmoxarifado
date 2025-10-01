import React, { useState } from 'react';
import { HelpCircle, X, UsersRound } from 'lucide-react';

const BarraBusca = ({ filtroAtual, setFiltroAtual, searchTerm, setSearchTerm, onManageGroups, showGroupsButton = true }) => {
  const [showHelp, setShowHelp] = useState(false);
  return (
    <div className="flex items-center gap-4 mb-4">
      {/* Dropdown de Filtro */}
      <select
        value={filtroAtual}
        onChange={(e) => setFiltroAtual(e.target.value)}
        className="bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-white px-3 py-2 rounded-lg text-sm border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#1D9BF0] transition-colors cursor-pointer w-[200px]"
      >
        <option value="nome">Nome</option>
        <option value="pontos">Mais Pontos</option>
        <option value="avaliacao">Mais Avaliados</option>
        <option value="tarefas">Mais Tarefas</option>
        <option value="emprestimos">Mais Empréstimos</option>
        <option value="demitidos">Funcionários Demitidos</option>
      </select>

      {/* Campo de Busca */}
      <div className="relative w-36">
        <input
          type="text"
          placeholder="         Buscar..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 pl-12 rounded-lg text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#1D9BF0]"
        />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400"
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

      {/* Botão de Grupos */}
      {showGroupsButton && (
        <button
          onClick={onManageGroups}
          className="bg-blue-500 dark:bg-[#1D9BF0] text-gray-900 dark:text-white px-4 py-2 rounded-lg hover:bg-blue-600 dark:hover:bg-[#1a8cd8] transition-colors flex items-center gap-2"
          title="Gerenciar grupos de funcionários"
        >
          <UsersRound className="w-4 h-4" />
          <span className="text-sm">Grupos</span>
        </button>
      )}

      {/* Ícone de Ajuda */}
      <button
        onClick={() => setShowHelp(true)}
        className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-full transition-colors"
        title="Ajuda"
      >
        <HelpCircle className="w-5 h-5 text-blue-500 dark:text-[#1D9BF0]" />
      </button>

      {/* Modal de Ajuda */}
      {showHelp && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 dark:bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#15202B] rounded-xl p-6 max-w-2xl w-full mx-4 relative border border-gray-200 dark:border-gray-600">
            <button
              onClick={() => setShowHelp(false)}
              className="absolute top-4 right-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Guia do Cartão de Funcionário</h2>
            
            <div className="space-y-4 text-gray-500 dark:text-gray-400">
              <div>
                <h3 className="text-gray-900 dark:text-white font-semibold mb-2">📊 Avaliações</h3>
                <p>• <span className="text-gray-900 dark:text-white">Medidor (Gauge)</span>: Média das avaliações de desempenho do funcionário.</p>
                <p>• <span className="text-gray-900 dark:text-white">Martelo (Hammer)</span>: Média das avaliações de tarefas concluídas.</p>
                <p className="text-sm mt-1">As cores indicam o desempenho: Dourado (⭐ 4.5+), Verde (🟢 3.5+), Amarelo (🟡 2.5+), Vermelho (🔴 abaixo de 2.5)</p>
              </div>

              <div>
                <h3 className="text-gray-900 dark:text-white font-semibold mb-2">📈 Estatísticas</h3>
                <p>• <span className="text-gray-900 dark:text-white">Tarefas Concluídas</span>: Número total de tarefas finalizadas.</p>
                <p>• <span className="text-gray-900 dark:text-white">Em Andamento</span>: Tarefas atualmente em execução.</p>
              </div>

              <div>
                <h3 className="text-gray-900 dark:text-white font-semibold mb-2">🏆 Sistema de Pontos</h3>
                <p>• <span className="text-gray-900 dark:text-white">Ferramentas Devolvidas</span>: 20 pontos por ferramenta</p>
                <p>• <span className="text-gray-900 dark:text-white">Tarefas Concluídas</span>: 50 pontos por tarefa</p>
                <p>• <span className="text-gray-900 dark:text-white">Média de Avaliação</span>: Até 10 pontos baseado na média</p>
              </div>

              <div>
                <h3 className="text-gray-900 dark:text-white font-semibold mb-2">📱 Contato</h3>
                <p>Inclui informações como telefone e outros meios de contato disponíveis.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BarraBusca;





