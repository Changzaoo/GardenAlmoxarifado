import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HelpCircle, 
  X, 
  UsersRound, 
  Search, 
  Filter,
  Sparkles,
  TrendingUp,
  Star,
  CheckCircle,
  Hammer,
  UserX,
  Users,
  Zap,
  Merge
} from 'lucide-react';

const BarraBuscaModerna = ({ filtroAtual, setFiltroAtual, searchTerm, setSearchTerm, onManageGroups, onUnificar, showGroupsButton = true }) => {
  const [showHelp, setShowHelp] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const filtros = [
    { value: 'nome', label: 'Nome A-Z', icon: Users, color: 'from-blue-500 to-blue-600' },
    { value: 'pontos', label: 'Mais Pontos', icon: Sparkles, color: 'from-yellow-500 to-orange-500' },
    { value: 'avaliacao', label: 'Melhor Avaliados', icon: Star, color: 'from-yellow-400 to-yellow-600' },
    { value: 'tarefas', label: 'Mais Tarefas', icon: CheckCircle, color: 'from-green-500 to-emerald-600' },
    { value: 'emprestimos', label: 'Mais Empréstimos', icon: Hammer, color: 'from-purple-500 to-violet-600' },
    { value: 'demitidos', label: 'Funcionários Inativos', icon: UserX, color: 'from-red-500 to-red-600' }
  ];

  const filtroAtivo = filtros.find(f => f.value === filtroAtual);

  return (
    <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
      {/* Campo de Busca Principal */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="relative flex-1 max-w-lg"
      >
        <input
          type="text"
          placeholder="Buscar funcionários..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-4 pr-4 py-3.5 rounded-2xl text-sm bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 border border-white/20 dark:border-gray-700/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:bg-white dark:focus:bg-gray-800 transition-all duration-300 shadow-lg shadow-blue-500/10 dark:shadow-blue-500/5"
        />
        {searchTerm && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </motion.button>
        )}
      </motion.div>

      {/* Controles de Filtro e Ações */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="flex items-center gap-3"
      >
        {/* Filtro Ativo Elegante */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r ${filtroAtivo?.color || 'from-gray-500 to-gray-600'} text-white shadow-lg hover:shadow-xl transition-all duration-300 min-w-[160px]`}
          >
            <filtroAtivo.icon className="w-4 h-4" />
            <span className="text-sm font-medium truncate">{filtroAtivo?.label}</span>
            <Filter className="w-4 h-4 ml-auto" />
          </motion.button>

          {/* Dropdown de Filtros */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full left-0 mt-2 w-64 bg-white/95 backdrop-blur-sm dark:bg-gray-800/95 border border-white/20 dark:border-gray-700/50 rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/25 py-2 z-50"
              >
                {filtros.map((filtro, index) => (
                  <motion.button
                    key={filtro.value}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    whileHover={{ x: 4, scale: 1.02 }}
                    onClick={() => {
                      setFiltroAtual(filtro.value);
                      setShowFilters(false);
                    }}
                    className={`w-full px-4 py-3 text-left text-sm font-medium rounded-xl mx-2 transition-all duration-200 flex items-center gap-3 ${
                      filtroAtual === filtro.value 
                        ? `bg-gradient-to-r ${filtro.color} text-white shadow-lg` 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    <filtro.icon className={`w-4 h-4 ${
                      filtroAtual === filtro.value 
                        ? 'text-white' 
                        : 'text-gray-600 dark:text-gray-400'
                    }`} />
                    <span>{filtro.label}</span>
                    {filtroAtual === filtro.value && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="ml-auto w-2 h-2 bg-white rounded-full"
                      />
                    )}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Botão de Grupos */}
        {showGroupsButton && (
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={onManageGroups}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 font-medium"
            title="Gerenciar grupos de funcionários"
          >
            <UsersRound className="w-4 h-4" />
            <span className="hidden sm:inline">Grupos</span>
          </motion.button>
        )}

        {/* Botão de Unificar Duplicados */}
        {showGroupsButton && onUnificar && (
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={onUnificar}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 font-medium"
            title="Unificar funcionários duplicados"
          >
            <Merge className="w-4 h-4" />
            <span className="hidden sm:inline">Unificar</span>
          </motion.button>
        )}

        {/* Botão de Ajuda */}
        <motion.button
          whileHover={{ scale: 1.1, rotate: 15 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowHelp(true)}
          className="p-3 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          title="Ajuda"
        >
          <HelpCircle className="w-5 h-5" />
        </motion.button>
      </motion.div>

      {/* Modal de Ajuda Modernizado */}
      <AnimatePresence>
        {showHelp && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowHelp(false)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white/95 backdrop-blur-sm dark:bg-gray-800/95 rounded-3xl p-8 max-w-3xl w-full mx-4 relative border border-white/20 dark:border-gray-700/50 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowHelp(false)}
                className="absolute top-6 right-6 p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </motion.button>

              <div className="flex items-center gap-4 mb-8">
                <Sparkles className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                <div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent">
                    Guia do Sistema
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Entenda como funciona a gestão de funcionários
                  </p>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-4"
                >
                  <div className="flex items-start gap-3">
                    <Star className="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Sistema de Avaliações</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Medidor circular mostra a média de avaliações de desempenho. Martelo representa avaliações de tarefas específicas.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Estatísticas</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Acompanhe tarefas concluídas, em andamento e empréstimos ativos em tempo real.</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-4"
                >
                  <div className="flex items-start gap-3">
                    <Zap className="w-6 h-6 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Sistema de Pontos</h3>
                      <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        <li>• 20 pontos por ferramenta devolvida</li>
                        <li>• 50 pontos por tarefa concluída</li>
                        <li>• Até 50 pontos por avaliação média</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Filter className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Filtros Inteligentes</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Use os filtros para encontrar rapidamente funcionários por desempenho, atividade ou status.</p>
                    </div>
                  </div>
                </motion.div>
              </div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl border border-blue-200/50 dark:border-blue-700/30"
              >
                <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">💡 Dica Pro</h4>
                <p className="text-sm text-blue-800 dark:text-blue-400">
                  Clique em qualquer funcionário para ver seu perfil detalhado com histórico completo de atividades e desempenho.
                </p>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BarraBuscaModerna;