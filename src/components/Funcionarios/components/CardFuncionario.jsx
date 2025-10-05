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

const CardFuncionario = ({
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

  // Função para calcular a média das avaliações (retorna o tipo e a média)
  const calcularMedia = (avaliacoes) => {
    // Verificar se existem avaliações
    if (!avaliacoes || !Array.isArray(avaliacoes) || avaliacoes.length === 0) {
      return { tipo: null, media: 0 };
    }
    
    // Separar avaliações por tipo
    const avaliacoesDesempenho = avaliacoes.filter(av => 
      av.tipo === 'desempenho' || av.tipo === 'avaliacao_supervisor'
    );
    const avaliacoesTarefas = avaliacoes.filter(av => 
      (av.tipo === 'regular' || av.tipoAvaliacao === 'tarefa') && av.tipo !== 'avaliacao_supervisor'
    );
    
    // Calcular médias individuais
    const mediaDesempenho = avaliacoesDesempenho.length > 0
      ? avaliacoesDesempenho.reduce((sum, av) => sum + (av.estrelas || av.nota || 0), 0) / avaliacoesDesempenho.length
      : 0;
    
    const mediaTarefas = avaliacoesTarefas.length > 0
      ? avaliacoesTarefas.reduce((sum, av) => sum + (av.nota || 0), 0) / avaliacoesTarefas.length
      : 0;
    
    // Retornar média do tipo que existe
    if (avaliacoesDesempenho.length === 0 && avaliacoesTarefas.length > 0) {
      return { tipo: 'tarefas', media: mediaTarefas };
    }
    if (avaliacoesTarefas.length === 0 && avaliacoesDesempenho.length > 0) {
      return { tipo: 'desempenho', media: mediaDesempenho };
    }
    if (avaliacoesDesempenho.length === 0 && avaliacoesTarefas.length === 0) {
      return { tipo: null, media: 0 };
    }
    
    // Se tem os dois tipos, retorna a média de desempenho
    return { 
      tipo: 'geral', 
      media: mediaDesempenho
    };
  };
  return (
    <motion.div 
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`group relative overflow-hidden bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-2xl border border-white/20 dark:border-gray-700/50 hover:border-blue-400/50 dark:hover:border-blue-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/25 dark:hover:shadow-blue-500/10 ${
        func.demitido && filtroAtual !== 'demitidos' ? 'opacity-60' : ''
      }`}
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
        {/* Header Section Modernizado */}
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
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-blue-600 flex items-center justify-center shadow-xl ring-4 ring-white/50 dark:ring-gray-700/50 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/20" />
                  <span className="relative text-white text-xl font-bold">
                    {func.nome?.charAt(0)?.toUpperCase() || 'F'}
                  </span>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full opacity-80" />
                </div>
              )}
              
              {/* Status indicators */}
              {func.demitido ? (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-red-500 to-red-600 rounded-full border-3 border-white dark:border-gray-800 flex items-center justify-center shadow-lg"
                >
                  <UserX className="w-3 h-3 text-white" />
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
                  className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border-2 border-white dark:border-gray-800 shadow-lg"
                />
              )}
            </motion.div>

            {/* Info Principal com melhor tipografia */}
            <div className="flex-1 min-w-0">
              <motion.div 
                whileHover={{ x: 4 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-3 mb-2"
              >
                <h3 
                  className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent truncate cursor-pointer hover:from-blue-600 hover:to-purple-600 dark:hover:from-blue-400 dark:hover:to-purple-400 transition-all duration-300"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClick();
                  }}
                  title="Ver perfil completo"
                >
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
                  <div className="flex items-center justify-center w-6 h-6 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-lg">
                    <Briefcase className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 truncate">
                    {func.cargo || 'Cargo não definido'}
                  </p>
                </div>
                {func.matricula && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-6 h-6 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-lg">
                      <Target className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                    </div>
                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      ID: {func.matricula}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Menu de Ações Modernizado */}
          {!isFuncionario && !readonly && (
            <div className="relative flex-shrink-0" ref={menuRef}>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuAberto(!menuAberto);
                }}
                className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 hover:from-blue-100 hover:to-purple-100 dark:hover:from-blue-900/50 dark:hover:to-purple-900/50 rounded-xl shadow-lg transition-all duration-200 group-hover:shadow-xl"
                title="Opções"
              >
                <MoreVertical className="w-4 h-4 text-gray-600 dark:text-gray-300" />
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
                      <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg">
                        <Edit className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span>Editar Funcionário</span>
                    </motion.button>

                  <div className="h-px bg-gray-200 dark:bg-gray-700 my-1.5"></div>

                  {func.demitido ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuAberto(false);
                        reintegrarFuncionario(func);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors flex items-center gap-3"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Reintegrar</span>
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuAberto(false);
                        demitirFuncionario(func);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors flex items-center gap-3"
                    >
                      <UserX className="w-4 h-4" />
                      <span>Demitir</span>
                    </button>
                  )}

                  <div className="h-px bg-gray-200 dark:bg-gray-700 my-1.5"></div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuAberto(false);
                      confirmarExclusao(func);
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-3"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Excluir</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Stats Grid - Design Corporativo */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {/* Performance Score */}
          {(() => {
            const avaliacoesDesempenho = funcionariosStats[func.id]?.avaliacoes?.filter(av => 
              av.tipo === 'desempenho' || av.tipo === 'avaliacao_supervisor'
            ) || [];
            const media = avaliacoesDesempenho.length > 0
              ? (avaliacoesDesempenho.reduce((sum, av) => sum + (av.estrelas || av.nota || 0), 0) / avaliacoesDesempenho.length).toFixed(1)
              : '0';
            
            const mediaNum = parseFloat(media);
            let bgColor = '';
            let textColor = '';
            let iconColor = '';
            
            if (mediaNum >= 4.5) {
              bgColor = 'bg-emerald-50 dark:bg-emerald-900/20';
              textColor = 'text-emerald-700 dark:text-emerald-400';
              iconColor = 'text-emerald-600 dark:text-emerald-500';
            } else if (mediaNum >= 3.5) {
              bgColor = 'bg-blue-50 dark:bg-blue-900/20';
              textColor = 'text-blue-700 dark:text-blue-400';
              iconColor = 'text-blue-600 dark:text-blue-500';
            } else if (mediaNum >= 2.5) {
              bgColor = 'bg-amber-50 dark:bg-amber-900/20';
              textColor = 'text-amber-700 dark:text-amber-400';
              iconColor = 'text-amber-600 dark:text-amber-500';
            } else if (mediaNum > 0) {
              bgColor = 'bg-red-50 dark:bg-red-900/20';
              textColor = 'text-red-700 dark:text-red-400';
              iconColor = 'text-red-600 dark:text-red-500';
            } else {
              bgColor = 'bg-gray-50 dark:bg-gray-700/50';
              textColor = 'text-gray-600 dark:text-gray-400';
              iconColor = 'text-gray-500 dark:text-gray-500';
            }

            return (
              <div className={`${bgColor} rounded-lg p-3 border border-gray-200 dark:border-gray-700`}>
                <div className="flex items-center gap-2 mb-1">
                  <Award className={`w-4 h-4 ${iconColor}`} />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Performance</span>
                </div>
                <div className={`text-2xl font-bold ${textColor}`}>{media}</div>
              </div>
            );
          })()}

          {/* Tasks Rating */}
          {(() => {
            const avaliacoesTarefas = funcionariosStats[func.id]?.avaliacoes?.filter(av => av.tipo === 'regular') || [];
            const autoavaliacoesTarefas = funcionariosStats[func.id]?.avaliacoes?.filter(av => av.tipoAvaliacao === 'tarefa') || [];
            
            const mediaRegular = avaliacoesTarefas.length > 0
              ? (avaliacoesTarefas.reduce((sum, av) => sum + (av.nota || 0), 0) / avaliacoesTarefas.length)
              : 0;
              
            const mediaAutoavaliacao = autoavaliacoesTarefas.length > 0
              ? (autoavaliacoesTarefas.reduce((sum, av) => sum + (av.nota || 0), 0) / autoavaliacoesTarefas.length)
              : 0;
            
            const totalAvaliacoes = avaliacoesTarefas.length + autoavaliacoesTarefas.length;
            const media = totalAvaliacoes > 0
              ? ((mediaRegular * avaliacoesTarefas.length + mediaAutoavaliacao * autoavaliacoesTarefas.length) / totalAvaliacoes).toFixed(1)
              : '0';
            
            const mediaNum = parseFloat(media);
            let bgColor = '';
            let textColor = '';
            let iconColor = '';
            
            if (mediaNum >= 4.5) {
              bgColor = 'bg-emerald-50 dark:bg-emerald-900/20';
              textColor = 'text-emerald-700 dark:text-emerald-400';
              iconColor = 'text-emerald-600 dark:text-emerald-500';
            } else if (mediaNum >= 3.5) {
              bgColor = 'bg-blue-50 dark:bg-blue-900/20';
              textColor = 'text-blue-700 dark:text-blue-400';
              iconColor = 'text-blue-600 dark:text-blue-500';
            } else if (mediaNum >= 2.5) {
              bgColor = 'bg-amber-50 dark:bg-amber-900/20';
              textColor = 'text-amber-700 dark:text-amber-400';
              iconColor = 'text-amber-600 dark:text-amber-500';
            } else if (mediaNum > 0) {
              bgColor = 'bg-red-50 dark:bg-red-900/20';
              textColor = 'text-red-700 dark:text-red-400';
              iconColor = 'text-red-600 dark:text-red-500';
            } else {
              bgColor = 'bg-gray-50 dark:bg-gray-700/50';
              textColor = 'text-gray-600 dark:text-gray-400';
              iconColor = 'text-gray-500 dark:text-gray-500';
            }

            return (
              <div className={`${bgColor} rounded-lg p-3 border border-gray-200 dark:border-gray-700`}>
                <div className="flex items-center gap-2 mb-1">
                  <Hammer className={`w-4 h-4 ${iconColor}`} />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Tarefas</span>
                </div>
                <div className={`text-2xl font-bold ${textColor}`}>{media}</div>
              </div>
            );
          })()}

          {/* Completed Tasks */}
          {(() => {
            const tarefasConcluidas = funcionariosStats[func.id]?.tarefasConcluidas || 0;
            return (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-500" />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Concluídas</span>
                </div>
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">{tarefasConcluidas}</div>
              </div>
            );
          })()}

          {/* In Progress */}
          {(() => {
            const emAndamento = funcionariosStats[func.id]?.tarefasEmAndamento || 0;
            return (
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-amber-600 dark:text-amber-500" />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Andamento</span>
                </div>
                <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">{emAndamento}</div>
              </div>
            );
          })()}
        </div>

        {/* Informações de Contato - Design Minimalista */}
        {(func.telefone || func.email) && (
          <div className="flex flex-wrap gap-4 pt-3 border-t border-gray-200 dark:border-gray-700">
            {func.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">{func.email}</span>
              </div>
            )}
            {func.telefone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">{func.telefone}</span>
              </div>
            )}
          </div>
        )}

        {/* Avaliações Expandíveis */}
        {funcionariosStats[func.id]?.avaliacoes?.length > 0 && (
          <div className="mt-4 space-y-2">
            <AvaliacoesCard 
              avaliacoes={funcionariosStats[func.id].avaliacoes}
              tipo="autoavaliacao"
              avaliacoesExpandidas={avaliacoesExpandidas}
              setAvaliacoesExpandidas={setAvaliacoesExpandidas}
              funcionarioId={`${func.id}-auto`}
              calcularMediaAvaliacoesDesempenho={calcularMediaAvaliacoesDesempenho}
            />

            <AvaliacoesCard 
              avaliacoes={funcionariosStats[func.id].avaliacoes}
              tipo="regular"
              avaliacoesExpandidas={avaliacoesExpandidas}
              setAvaliacoesExpandidas={setAvaliacoesExpandidas}
              funcionarioId={func.id}
              calcularMediaAvaliacoesDesempenho={calcularMediaAvaliacoesDesempenho}
            />

            <AvaliacoesCard 
              avaliacoes={funcionariosStats[func.id].avaliacoes}
              tipo="desempenho"
              avaliacoesExpandidas={avaliacoesDesempenhoExpandidas}
              setAvaliacoesExpandidas={setAvaliacoesDesempenhoExpandidas}
              funcionarioId={func.id}
              calcularMediaAvaliacoesDesempenho={calcularMediaAvaliacoesDesempenho}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default CardFuncionario;



