import React, { useState } from 'react';
import { HelpCircle, X, UsersRound, Search, SlidersHorizontal } from 'lucide-react';

const BarraBusca = ({ filtroAtual, setFiltroAtual, searchTerm, setSearchTerm, onManageGroups, showGroupsButton = true }) => {
  const [showHelp, setShowHelp] = useState(false);
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
      {/* Campo de Busca Principal */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Buscar por nome, cargo, email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-2.5 rounded-lg text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
      </div>

      {/* Filtros e Ações */}
      <div className="flex items-center gap-2">
        {/* Dropdown de Filtro com ícone */}
        <div className="relative">
          <SlidersHorizontal className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 w-4 h-4 pointer-events-none" />
          <select
            value={filtroAtual}
            onChange={(e) => setFiltroAtual(e.target.value)}
            className="pl-10 pr-8 py-2.5 rounded-lg text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer appearance-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 0.5rem center',
              backgroundSize: '1.5em 1.5em'
            }}
          >
            <option value="nome">🔤 Nome</option>
            <option value="pontos">🏆 Mais Pontos</option>
            <option value="avaliacao">⭐ Mais Avaliados</option>
            <option value="tarefas">✅ Mais Tarefas</option>
            <option value="emprestimos">🔧 Mais Empréstimos</option>
            <option value="demitidos">❌ Inativos</option>
          </select>
        </div>

        {/* Botão de Grupos */}
        {showGroupsButton && (
          <button
            onClick={onManageGroups}
            className="px-4 py-2.5 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white transition-colors flex items-center gap-2 shadow-sm"
            title="Gerenciar grupos de funcionários"
          >
            <UsersRound className="w-4 h-4" />
            <span className="hidden sm:inline">Grupos</span>
          </button>
        )}

        {/* Botão de Ajuda */}
        <button
          onClick={() => setShowHelp(true)}
          className="p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Ajuda"
        >
          <HelpCircle className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </button>
      </div>

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





