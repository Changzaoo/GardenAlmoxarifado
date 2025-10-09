import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
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
  Sparkles,
  Timer,
  X,
  Mail,
  MapPin,
  Calendar,
  Building2
} from 'lucide-react';
import AvaliacoesCard from './AvaliacoesCard';
import InformacoesContato from './InformacoesContato';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../../../firebaseConfig';
import { getOptimizedMotionProps } from '../../../utils/performanceUtils';
import { obterHorariosEsperados } from '../../../utils/escalaUtils';

const CardFuncionarioModerno = memo(({
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
  filtroAtual,
  estatisticaExpandida,
  setEstatisticaExpandida
}) => {
  const [menuAberto, setMenuAberto] = useState(false);
  const [horasInfo, setHorasInfo] = useState(null);
  const [mostrarCartaoVisitas, setMostrarCartaoVisitas] = useState(false);
  const menuRef = useRef(null);

  // Buscar informações de horas do funcionário em TEMPO REAL
  useEffect(() => {
    if (!func.id) return;

    const hoje = new Date();
    const dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const mesReferencia = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;

    // Listener para pontos
    const pontosQuery = query(
      collection(db, 'pontos'),
      where('funcionarioId', '==', String(func.id))
    );

    const ajustesQuery = query(
      collection(db, 'ajustes_manuais_horas'),
      where('funcionarioId', '==', String(func.id)),
      where('mesReferencia', '==', mesReferencia),
      where('ativo', '==', true)
    );

    const unsubscribePontos = onSnapshot(pontosQuery, (pontosSnapshot) => {
      const pontosMes = pontosSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(ponto => {
          const dataPonto = ponto.data?.toDate ? ponto.data.toDate() : new Date(ponto.timestamp || ponto.data);
          return dataPonto >= dataInicio;
        });

      onSnapshot(ajustesQuery, (ajustesSnapshot) => {
        const ajustesManuais = ajustesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Calcular total de minutos de ajustes manuais
        const minutosAjustesManuais = ajustesManuais.reduce((total, ajuste) => {
          return total + (ajuste.minutos || 0);
        }, 0);

        // Agrupar pontos por dia (data sem hora)
        const pontosPorDia = {};
        pontosMes.forEach(ponto => {
          const data = ponto.data?.toDate ? ponto.data.toDate() : new Date(ponto.timestamp || ponto.data);
          const dataKey = data.toISOString().split('T')[0];
          
          if (!pontosPorDia[dataKey]) {
            pontosPorDia[dataKey] = {
              entrada: null,
              saida_almoco: null,
              retorno_almoco: null,
              saida: null
            };
          }
          
          pontosPorDia[dataKey][ponto.tipo] = data;
        });

        // Calcular total de horas trabalhadas e esperadas por dia
        let totalMinutosTrabalhados = 0;
        let totalMinutosEsperados = 0;
        let diasComPonto = 0;

        Object.entries(pontosPorDia).forEach(([dataKey, dia]) => {
          if (!dia.entrada) return;
          
          const dataPonto = new Date(dataKey);
          const tipoEscala = func.escala || func.tipoEscala || 'M';
          const horariosEsperados = obterHorariosEsperados(tipoEscala, dataPonto);
          
          if (!horariosEsperados) return;

          let minutosTrabalhados = 0;
          
          if (dia.saida_almoco) {
            const manha = (dia.saida_almoco - dia.entrada) / (1000 * 60);
            minutosTrabalhados += Math.max(0, manha);
          }
          
          if (dia.retorno_almoco && dia.saida) {
            const tarde = (dia.saida - dia.retorno_almoco) / (1000 * 60);
            minutosTrabalhados += Math.max(0, tarde);
          }
          
          if (dia.saida_almoco) {
            diasComPonto++;
            totalMinutosTrabalhados += minutosTrabalhados;

            const [hEntrada, mEntrada] = horariosEsperados.entrada.split(':').map(Number);
            const [hAlmoco, mAlmoco] = horariosEsperados.almoco.split(':').map(Number);
            const [hRetorno, mRetorno] = horariosEsperados.retorno.split(':').map(Number);
            const [hSaida, mSaida] = horariosEsperados.saida.split(':').map(Number);
            
            const minutosEntradaAlmoco = (hAlmoco * 60 + mAlmoco) - (hEntrada * 60 + mEntrada);
            const minutosRetornoSaida = (hSaida * 60 + mSaida) - (hRetorno * 60 + mRetorno);
            const minutosEsperadosDia = minutosEntradaAlmoco + minutosRetornoSaida;
            
            totalMinutosEsperados += minutosEsperadosDia;
          }
        });

        const saldoMinutos = (totalMinutosTrabalhados + minutosAjustesManuais) - totalMinutosEsperados;

        const formatarHoras = (minutos) => {
          const h = Math.floor(Math.abs(minutos) / 60);
          const m = Math.abs(minutos) % 60;
          return `${h}h ${m.toString().padStart(2, '0')}m`;
        };

        setHorasInfo({
          totalHoras: formatarHoras(totalMinutosTrabalhados + minutosAjustesManuais),
          totalHorasEsperadas: formatarHoras(totalMinutosEsperados),
          saldoMinutos: saldoMinutos,
          saldoFormatado: formatarHoras(saldoMinutos),
          positivo: saldoMinutos >= 0,
          diasTrabalhados: diasComPonto,
          ajustesManuais: ajustesManuais.length > 0 ? ajustesManuais : null,
          minutosAjustados: minutosAjustesManuais
        });
      });
    });

    return () => {
      unsubscribePontos();
    };
  }, [func.id, func.escala, func.tipoEscala, func.nome]);

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

  // Calcular estatísticas com useMemo para evitar recálculos
  const stats = useMemo(() => funcionariosStats[func.id] || {}, [funcionariosStats, func.id]);
  const pontos = useMemo(() => funcionariosPontos[func.id] || {}, [funcionariosPontos, func.id]);
  const mediaAvaliacao = useMemo(() => Number(stats.mediaAvaliacao) || 0, [stats.mediaAvaliacao]);
  const tarefasConcluidas = useMemo(() => stats.tarefasConcluidas || 0, [stats.tarefasConcluidas]);
  const emprestimosAtivos = useMemo(() => stats.emprestimosAtivos || 0, [stats.emprestimosAtivos]);

  // Callbacks memoizados para evitar recriação
  const handleCardClick = useCallback(() => {
    if (onClick) onClick();
  }, [onClick]);

  const handleMenuToggle = useCallback((e) => {
    e.stopPropagation();
    setMenuAberto(prev => !prev);
  }, []);

  const handleCloseMenu = useCallback((e, action) => {
    e.stopPropagation();
    setMenuAberto(false);
    if (action) action();
  }, []);

  const handleOpenCartao = useCallback((e) => {
    e.stopPropagation();
    setMostrarCartaoVisitas(true);
  }, []);

  const handleCloseCartao = useCallback(() => {
    setMostrarCartaoVisitas(false);
  }, []);

  // Props de animação otimizadas
  const motionProps = useMemo(() => getOptimizedMotionProps(), []);

  return (
    <motion.div 
      whileHover={motionProps.animate ? { y: -8, scale: 1.02 } : undefined}
      transition={motionProps.transition || { duration: 0.3, ease: "easeOut" }}
      className={`group relative overflow-hidden bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 rounded-2xl border border-white/20 dark:border-gray-700/50 hover:border-blue-400/50 dark:hover:border-blue-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/25 dark:hover:shadow-blue-500/10 cursor-pointer ${
        func.demitido && filtroAtual !== 'demitidos' ? 'opacity-60' : ''
      }`}
      onClick={handleCardClick}
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
              whileHover={motionProps.animate ? { scale: 1.1, rotate: 5 } : undefined}
              transition={motionProps.transition || { duration: 0.2 }}
              className="relative flex-shrink-0 cursor-pointer"
              onClick={handleOpenCartao}
            >
              {func.photoURL ? (
                <div className="relative">
                  <img 
                    src={func.photoURL} 
                    alt={func.nome} 
                    loading="lazy"
                    decoding="async"
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
              
              {/* Status indicator - Demitido */}
              {func.demitido && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2"
                >
                  <UserX className="w-5 h-5 text-red-500 dark:text-red-400" />
                </motion.div>
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
                whileHover={motionProps.animate ? { scale: 1.1 } : undefined}
                whileTap={motionProps.animate ? { scale: 0.9 } : undefined}
                onClick={handleMenuToggle}
                className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                title="Opções"
              >
                <MoreVertical className="w-5 h-5" />
              </motion.button>

              <AnimatePresence>
                {menuAberto && (
                  <motion.div 
                    initial={motionProps.initial}
                    animate={motionProps.animate ? { opacity: 1, scale: 1, y: 0 } : undefined}
                    exit={motionProps.exit}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full right-0 mt-2 w-56 bg-white/95 backdrop-blur-sm dark:bg-gray-800/95 border border-white/20 dark:border-gray-700/50 rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/25 py-2 z-50"
                  >
                    <motion.button
                      whileHover={motionProps.animate ? { x: 4, backgroundColor: "rgba(59, 130, 246, 0.1)" } : undefined}
                      transition={{ duration: 0.2 }}
                      onClick={(e) => handleCloseMenu(e, () => handleEditar(func))}
                      className="w-full px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 rounded-xl mx-2 transition-all duration-200 flex items-center gap-3"
                    >
                      <Edit className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span>Editar Funcionário</span>
                    </motion.button>
                    
                    {func.demitido ? (
                      <motion.button
                        whileHover={motionProps.animate ? { x: 4, backgroundColor: "rgba(34, 197, 94, 0.1)" } : undefined}
                        transition={{ duration: 0.2 }}
                        onClick={(e) => handleCloseMenu(e, () => reintegrarFuncionario(func))}
                        className="w-full px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 rounded-xl mx-2 transition-all duration-200 flex items-center gap-3"
                      >
                        <UserCheck className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <span>Reintegrar</span>
                      </motion.button>
                    ) : (
                      <motion.button
                        whileHover={motionProps.animate ? { x: 4, backgroundColor: "rgba(234, 179, 8, 0.1)" } : undefined}
                        transition={{ duration: 0.2 }}
                        onClick={(e) => handleCloseMenu(e, () => demitirFuncionario(func))}
                        className="w-full px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 rounded-xl mx-2 transition-all duration-200 flex items-center gap-3"
                      >
                        <UserX className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                        <span>Demitir</span>
                      </motion.button>
                    )}
                    
                    <motion.button
                      whileHover={motionProps.animate ? { x: 4, backgroundColor: "rgba(239, 68, 68, 0.1)" } : undefined}
                      transition={{ duration: 0.2 }}
                      onClick={(e) => handleCloseMenu(e, () => confirmarExclusao(func))}
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

        {/* Estatísticas Modernas - Layout Vertical */}
        <div className="space-y-2 mb-6">
          {/* 1. Pontos */}
          <motion.div 
            whileHover={{ scale: 1.01, x: 4 }}
            transition={{ duration: 0.2 }}
            className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-xl border border-emerald-200/50 dark:border-emerald-700/30 overflow-hidden cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              if (setEstatisticaExpandida) {
                setEstatisticaExpandida(estatisticaExpandida?.funcionarioId === func.id && estatisticaExpandida?.tipo === 'pontos' 
                  ? null 
                  : { funcionarioId: func.id, tipo: 'pontos', funcionario: func, stats, pontos, horasInfo }
                );
              }
            }}
          >
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl">
                  <Trophy className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1">
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 block uppercase tracking-wide">Pontos</span>
                  <span className="text-xl font-bold text-emerald-700 dark:text-emerald-300">
                    {pontos.total || 0} pts
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 2. Avaliação */}
          <motion.div 
            whileHover={{ scale: 1.01, x: 4 }}
            transition={{ duration: 0.2 }}
            className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl border border-yellow-200/50 dark:border-yellow-700/30 overflow-hidden cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              if (setEstatisticaExpandida) {
                setEstatisticaExpandida(estatisticaExpandida?.funcionarioId === func.id && estatisticaExpandida?.tipo === 'avaliacao' 
                  ? null 
                  : { funcionarioId: func.id, tipo: 'avaliacao', funcionario: func, stats, pontos, horasInfo }
                );
              }
            }}
          >
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="p-2.5 bg-yellow-100 dark:bg-yellow-900/50 rounded-xl">
                  <Star className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="flex-1">
                  <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400 block uppercase tracking-wide">Avaliação</span>
                  <span className="text-xl font-bold text-yellow-700 dark:text-yellow-300">
                    {mediaAvaliacao.toFixed(1)} ⭐
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 3. Horas */}
          <motion.div 
            whileHover={{ scale: 1.01, x: 4 }}
            transition={{ duration: 0.2 }}
            className={`rounded-xl border overflow-hidden cursor-pointer ${
              horasInfo?.positivo
                ? 'bg-gradient-to-r from-cyan-50 to-sky-50 dark:from-cyan-900/20 dark:to-sky-900/20 border-cyan-200/50 dark:border-cyan-700/30'
                : 'bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 border-rose-200/50 dark:border-rose-700/30'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              if (setEstatisticaExpandida) {
                setEstatisticaExpandida(estatisticaExpandida?.funcionarioId === func.id && estatisticaExpandida?.tipo === 'horas' 
                  ? null 
                  : { funcionarioId: func.id, tipo: 'horas', funcionario: func, stats, pontos, horasInfo }
                );
              }
            }}
          >
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3 flex-1">
                <div className={`p-2.5 rounded-xl ${
                  horasInfo?.saldoMinutos === 0
                    ? 'bg-gray-100 dark:bg-gray-800/50'
                    : horasInfo?.positivo
                    ? 'bg-cyan-100 dark:bg-cyan-900/50'
                    : 'bg-rose-100 dark:bg-rose-900/50'
                }`}>
                  {horasInfo?.saldoMinutos === 0 ? (
                    <CheckCircle2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  ) : horasInfo?.positivo ? (
                    <TrendingUp className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                  ) : (
                    <Timer className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                  )}
                </div>
                <div className="flex-1">
                  <span className={`text-xs font-medium block uppercase tracking-wide ${
                    horasInfo?.saldoMinutos === 0
                      ? 'text-gray-600 dark:text-gray-400'
                      : horasInfo?.positivo
                      ? 'text-cyan-600 dark:text-cyan-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}>
                    {horasInfo?.saldoMinutos === 0 ? 'Horas Normais' : horasInfo?.positivo ? 'Horas Positivas' : 'Horas Negativas'}
                  </span>
                  <span className={`text-xl font-bold font-mono ${
                    horasInfo?.saldoMinutos === 0
                      ? 'text-gray-700 dark:text-gray-300'
                      : horasInfo?.positivo
                      ? 'text-cyan-700 dark:text-cyan-300'
                      : 'text-rose-700 dark:text-rose-300'
                  }`}>
                    {horasInfo?.positivo && horasInfo?.saldoMinutos > 0 ? '+' : ''}{horasInfo?.saldoFormatado || '--h --m'}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 4. Tarefas */}
          <motion.div 
            whileHover={{ scale: 1.01, x: 4 }}
            transition={{ duration: 0.2 }}
            className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200/50 dark:border-blue-700/30 overflow-hidden cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              if (setEstatisticaExpandida) {
                setEstatisticaExpandida(estatisticaExpandida?.funcionarioId === func.id && estatisticaExpandida?.tipo === 'tarefas' 
                  ? null 
                  : { funcionarioId: func.id, tipo: 'tarefas', funcionario: func, stats, pontos, horasInfo }
                );
              }
            }}
          >
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="p-2.5 bg-blue-100 dark:bg-blue-900/50 rounded-xl">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400 block uppercase tracking-wide">Tarefas</span>
                  <span className="text-xl font-bold text-blue-700 dark:text-blue-300">
                    {tarefasConcluidas} concluídas
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 5. Empréstimos */}
          <motion.div 
            whileHover={{ scale: 1.01, x: 4 }}
            transition={{ duration: 0.2 }}
            className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-xl border border-purple-200/50 dark:border-purple-700/30 overflow-hidden cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              if (setEstatisticaExpandida) {
                setEstatisticaExpandida(estatisticaExpandida?.funcionarioId === func.id && estatisticaExpandida?.tipo === 'emprestimos' 
                  ? null 
                  : { funcionarioId: func.id, tipo: 'emprestimos', funcionario: func, stats, pontos, horasInfo }
                );
              }
            }}
          >
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="p-2.5 bg-purple-100 dark:bg-purple-900/50 rounded-xl">
                  <Hammer className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <span className="text-xs font-medium text-purple-600 dark:text-purple-400 block uppercase tracking-wide">Empréstimos</span>
                  <span className="text-xl font-bold text-purple-700 dark:text-purple-300">
                    {emprestimosAtivos} ativos
                  </span>
                </div>
              </div>
            </div>
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

      {/* Modal Cartão de Visitas */}
      <AnimatePresence>
        {mostrarCartaoVisitas && (
          <motion.div
            initial={motionProps.initial}
            animate={motionProps.animate ? { opacity: 1 } : undefined}
            exit={motionProps.exit}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={handleCloseCartao}
          >
            <motion.div
              initial={motionProps.initial}
              animate={motionProps.animate ? { scale: 1, opacity: 1, y: 0 } : undefined}
              exit={motionProps.exit}
              transition={motionProps.transition || { type: "spring", duration: 0.5 }}
              className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header com gradiente */}
              <div className="relative bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 p-8 text-white">
                <button
                  onClick={handleCloseCartao}
                  className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
                
                {/* Foto grande */}
                <div className="flex flex-col items-center">
                  {func.photoURL ? (
                    <motion.img 
                      initial={motionProps.initial}
                      animate={motionProps.animate ? { scale: 1 } : undefined}
                      transition={motionProps.transition || { type: "spring", delay: 0.2 }}
                      src={func.photoURL} 
                      alt={func.nome}
                      loading="lazy"
                      decoding="async"
                      className="w-32 h-32 rounded-3xl object-cover ring-4 ring-white/50 shadow-2xl mb-4"
                    />
                  ) : (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", delay: 0.2 }}
                      className="w-32 h-32 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center ring-4 ring-white/50 shadow-2xl mb-4"
                    >
                      <span className="text-white text-5xl font-bold">
                        {func.nome?.charAt(0)?.toUpperCase() || 'F'}
                      </span>
                    </motion.div>
                  )}
                  
                  <motion.h2 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-2xl font-bold mb-1"
                  >
                    {func.nome}
                  </motion.h2>
                  
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="flex items-center gap-2 text-white/90"
                  >
                    <Briefcase className="w-4 h-4" />
                    <span className="text-sm">{func.cargo || func.funcao || 'Funcionário'}</span>
                  </motion.div>
                </div>
              </div>

              {/* Corpo do cartão */}
              <div className="p-6 space-y-4">
                {/* Informações de contato */}
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                  className="space-y-3"
                >
                  {func.telefone && (
                    <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                      <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
                        <Phone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-gray-500 dark:text-gray-400">Telefone</div>
                        <div className="font-semibold text-gray-900 dark:text-white">{func.telefone}</div>
                      </div>
                    </div>
                  )}

                  {func.email && (
                    <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                      <div className="p-2 bg-purple-100 dark:bg-purple-800 rounded-lg">
                        <Mail className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-gray-500 dark:text-gray-400">E-mail</div>
                        <div className="font-semibold text-gray-900 dark:text-white text-sm">{func.email}</div>
                      </div>
                    </div>
                  )}

                  {func.setor && (
                    <div className="flex items-center gap-3 p-3 bg-cyan-50 dark:bg-cyan-900/20 rounded-xl">
                      <div className="p-2 bg-cyan-100 dark:bg-cyan-800 rounded-lg">
                        <Building2 className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-gray-500 dark:text-gray-400">Setor</div>
                        <div className="font-semibold text-gray-900 dark:text-white">{func.setor}</div>
                      </div>
                    </div>
                  )}

                  {func.endereco && (
                    <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                      <div className="p-2 bg-green-100 dark:bg-green-800 rounded-lg">
                        <MapPin className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-gray-500 dark:text-gray-400">Endereço</div>
                        <div className="font-semibold text-gray-900 dark:text-white text-sm">{func.endereco}</div>
                      </div>
                    </div>
                  )}

                  {func.dataContratacao && (
                    <div className="flex items-center gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                      <div className="p-2 bg-orange-100 dark:bg-orange-800 rounded-lg">
                        <Calendar className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-gray-500 dark:text-gray-400">Contratação</div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {new Date(func.dataContratacao).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>

                {/* Estatísticas resumidas */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-200 dark:border-gray-700"
                >
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {funcionariosPontos?.[func.id] || 0}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Pontos</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 flex items-center justify-center gap-1">
                      {func.mediaAvaliacoes?.toFixed(1) || '0.0'}
                      <Star className="w-4 h-4 fill-yellow-500" />
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Avaliação</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {func.avaliacoes?.length || 0}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Avaliações</div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

// Função de comparação para React.memo - evita re-renders desnecessários
CardFuncionarioModerno.displayName = 'CardFuncionarioModerno';

export default CardFuncionarioModerno;