import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Edit, 
  Trash2, 
  Hammer, 
  Gauge, 
  Clock, 
  UserX, 
  UserCheck, 
  MoreVertical, 
  Mail, 
  Phone, 
  Award, 
  TrendingUp, 
  CheckCircle2, 
  Briefcase,
  Star,
  Target,
  Zap,
  Crown,
  Trophy,
  Heart,
  Sparkles
} from 'lucide-react';
import AvaliacoesCard from './AvaliacoesCard';
import InformacoesContato from './InformacoesContato';

const CardFuncionarioModerno = ({
  funcionario: func,
  funcionariosStats,
  funcionariosPontos,
  isFuncionario,
  readonly,
  avaliacoesExpandidas,
  avaliacoesDesempenhoExpandidas,
  setAvaliacoesExpandidas,
  setAvaliacoesDesempenhoExpandidas,
  handleEditar,
  confirmarExclusao,
  calcularMediaAvaliacoesDesempenho,
  onClick,
  demitirFuncionario,
  reintegrarFuncionario,
  filtroAtual
}) => {
  const [menuAberto, setMenuAberto] = useState(false);
  const menuRef = useRef(null);

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuAberto(false);
      }
    };

    if (menuAberto) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuAberto]);

  // Calcular estatísticas
  const stats = funcionariosStats[func.id] || {};
  const pontos = funcionariosPontos[func.id] || {};
  const mediaAvaliacao = Number(stats.mediaAvaliacao) || 0;
  const tarefasConcluidas = stats.tarefasConcluidas || 0;
  const emprestimosAtivos = stats.emprestimosAtivos || 0;

  return (
    <motion.div 
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`group relative overflow-hidden bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-2xl border border-white/20 dark:border-gray-700/50 hover:border-blue-400/50 dark:hover:border-blue-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/25 dark:hover:shadow-blue-500/10 cursor-pointer ${
        func.demitido && filtroAtual !== 'demitidos' ? 'opacity-60' : ''
      }`}
      onClick={onClick}
    >
      {/* Background decorativo */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white/50 to-purple-50/50 dark:from-blue-900/10 dark:via-gray-800/50 dark:to-purple-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Barra lateral com gradiente animado */}
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl ${
        func.demitido 
          ? 'bg-gradient-to-b from-red-400 to-red-600' 
          : 'bg-gradient-to-b from-blue-400 via-purple-500 to-blue-600'
      } shadow-lg`}>
        <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent rounded-l-2xl" />
      </div>

      <div className="relative pl-6 pr-5 py-6">
        {/* Header Section */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            {/* Avatar com efeitos visuais */}
            <motion.div 
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ duration: 0.2 }}
              className="relative flex-shrink-0"
            >
              {func.photoURL ? (
                <div className="relative">
                  <img 
                    src={func.photoURL} 
                    alt={func.nome} 
                    className="w-16 h-16 rounded-2xl object-cover ring-4 ring-white/50 dark:ring-gray-700/50 shadow-xl"
                  />
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-black/20 via-transparent to-white/20" />
                </div>
              ) : (
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 rounded-2xl flex items-center justify-center relative ring-4 ring-white/50 dark:ring-gray-700/50 shadow-xl">
                  <span className="text-blue-600 dark:text-blue-400 text-xl font-bold">
                    {func.nome?.charAt(0)?.toUpperCase() || 'F'}
                  </span>
                </div>
              )}
              
              {/* Status indicators */}
              {func.demitido ? (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2"
                >
                  <UserX className="w-5 h-5 text-red-500 dark:text-red-400" />
                </motion.div>
              ) : (
                <motion.div 
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.7, 1, 0.7]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full"
                />
              )}
            </motion.div>

            {/* Info Principal */}
            <div className="flex-1 min-w-0">
              <motion.div 
                whileHover={{ x: 4 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-3 mb-2"
              >
                <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent truncate hover:from-blue-600 hover:to-purple-600 dark:hover:from-blue-400 dark:hover:to-purple-400 transition-all duration-300">
                  {func.nome}
                </h3>
                {func.demitido && (
                  <motion.span 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-red-100 to-red-200 text-red-700 dark:from-red-900/30 dark:to-red-800/30 dark:text-red-400 shadow-sm"
                  >
                    <UserX className="w-3 h-3" />
                    Inativo
                  </motion.span>
                )}
              </motion.div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 truncate">
                    {func.cargo || 'Cargo não definido'}
                  </p>
                </div>
                {func.matricula && (
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      ID: {func.matricula}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Menu de Ações */}
          {!isFuncionario && !readonly && (
            <div className="relative flex-shrink-0" ref={menuRef}>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuAberto(!menuAberto);
                }}
                className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                title="Opções"
              >
                <MoreVertical className="w-5 h-5" />
              </motion.button>

              <AnimatePresence>
                {menuAberto && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full right-0 mt-2 w-56 bg-white/95 backdrop-blur-sm dark:bg-gray-800/95 border border-white/20 dark:border-gray-700/50 rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/25 py-2 z-50"
                  >
                    <motion.button
                      whileHover={{ x: 4, backgroundColor: "rgba(59, 130, 246, 0.1)" }}
                      transition={{ duration: 0.2 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuAberto(false);
                        handleEditar(func);
                      }}
                      className="w-full px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 rounded-xl mx-2 transition-all duration-200 flex items-center gap-3"
                    >
                      <Edit className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>Editar Funcionário</span>
                    </motion.button>
                    
                    {func.demitido ? (
                      <motion.button
                        whileHover={{ x: 4, backgroundColor: "rgba(34, 197, 94, 0.1)" }}
                        transition={{ duration: 0.2 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuAberto(false);
                          reintegrarFuncionario(func);
                        }}
                        className="w-full px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 rounded-xl mx-2 transition-all duration-200 flex items-center gap-3"
                      >
                        <UserCheck className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <span>Reintegrar</span>
                      </motion.button>
                    ) : (
                      <motion.button
                        whileHover={{ x: 4, backgroundColor: "rgba(234, 179, 8, 0.1)" }}
                        transition={{ duration: 0.2 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuAberto(false);
                          demitirFuncionario(func);
                        }}
                        className="w-full px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 rounded-xl mx-2 transition-all duration-200 flex items-center gap-3"
                      >
                        <UserX className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                        <span>Demitir</span>
                      </motion.button>
                    )}
                    
                    <motion.button
                      whileHover={{ x: 4, backgroundColor: "rgba(239, 68, 68, 0.1)" }}
                      transition={{ duration: 0.2 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuAberto(false);
                        confirmarExclusao(func);
                      }}
                      className="w-full px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 rounded-xl mx-2 transition-all duration-200 flex items-center gap-3"
                    >
                      <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                      <span>Excluir</span>
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Estatísticas Modernas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {/* Avaliação */}
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="flex flex-col items-center p-3 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl border border-yellow-200/50 dark:border-yellow-700/30"
          >
            <div className="flex items-center gap-1 mb-1">
              <Star className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
              <span className="text-lg font-bold text-yellow-700 dark:text-yellow-300">
                {mediaAvaliacao.toFixed(1)}
              </span>
            </div>
            <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400">Avaliação</span>
          </motion.div>

          {/* Tarefas */}
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="flex flex-col items-center p-3 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200/50 dark:border-blue-700/30"
          >
            <div className="flex items-center gap-1 mb-1">
              <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-lg font-bold text-blue-700 dark:text-blue-300">
                {tarefasConcluidas}
              </span>
            </div>
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400">Tarefas</span>
          </motion.div>

          {/* Empréstimos */}
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="flex flex-col items-center p-3 bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-xl border border-purple-200/50 dark:border-purple-700/30"
          >
            <div className="flex items-center gap-1 mb-1">
              <Hammer className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="text-lg font-bold text-purple-700 dark:text-purple-300">
                {emprestimosAtivos}
              </span>
            </div>
            <span className="text-xs font-medium text-purple-600 dark:text-purple-400">Ativos</span>
          </motion.div>

          {/* Pontos */}
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="flex flex-col items-center p-3 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-xl border border-emerald-200/50 dark:border-emerald-700/30"
          >
            <div className="flex items-center gap-1 mb-1">
              <Trophy className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                {pontos.total || 0}
              </span>
            </div>
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Pontos</span>
          </motion.div>
        </div>

        {/* Informações de Contato */}
        <InformacoesContato funcionario={func} />

        {/* Avaliações */}
        {func.avaliacoes && func.avaliacoes.length > 0 && (
          <div className="mt-4">
            <AvaliacoesCard
              func={func}
              avaliacoesExpandidas={avaliacoesExpandidas}
              setAvaliacoesExpandidas={setAvaliacoesExpandidas}
              avaliacoesDesempenhoExpandidas={avaliacoesDesempenhoExpandidas}
              setAvaliacoesDesempenhoExpandidas={setAvaliacoesDesempenhoExpandidas}
              calcularMediaAvaliacoesDesempenho={calcularMediaAvaliacoesDesempenho}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default CardFuncionarioModerno;