import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ClipboardCheck, 
  Package, 
  CheckCircle, 
  Calendar, 
  BarChart3, 
  TrendingUp,
  Sparkles,
  FileCheck
} from 'lucide-react';

const VerificacaoMensalAnimation = ({ 
  verificacao, // { mes, ano, total_itens, itens_verificados, inconsistencias }
  onComplete 
}) => {
  const [phase, setPhase] = useState('start'); // start -> scanning -> analyzing -> reporting -> complete
  const [itemsScanned, setItemsScanned] = useState(0);

  useEffect(() => {
    const timeline = [
      { phase: 'start', duration: 500 },
      { phase: 'scanning', duration: 2500 },
      { phase: 'analyzing', duration: 2000 },
      { phase: 'reporting', duration: 1500 },
      { phase: 'complete', duration: 800 }
    ];

    let currentIndex = 0;
    const runTimeline = () => {
      if (currentIndex < timeline.length) {
        const current = timeline[currentIndex];
        setPhase(current.phase);
        setTimeout(() => {
          currentIndex++;
          runTimeline();
        }, current.duration);
      } else {
        setTimeout(() => {
          onComplete?.();
        }, 500);
      }
    };

    runTimeline();
  }, [onComplete]);

  // Animação de contagem durante scanning
  useEffect(() => {
    if (phase === 'scanning') {
      const totalItems = verificacao?.total_itens || 100;
      const increment = totalItems / 25;
      const interval = setInterval(() => {
        setItemsScanned((prev) => {
          const next = prev + increment;
          return next >= totalItems ? totalItems : next;
        });
      }, 100);

      return () => clearInterval(interval);
    } else if (phase === 'start') {
      setItemsScanned(0);
    }
  }, [phase, verificacao]);

  // Partículas de scan
  const scanParticles = Array.from({ length: 20 }).map((_, i) => ({
    id: i,
    delay: i * 0.1,
  }));

  // Barras de dados
  const dataPoints = Array.from({ length: 8 }).map((_, i) => ({
    id: i,
    height: 40 + Math.random() * 60,
    delay: i * 0.1,
  }));

  const porcentagemConcluida = verificacao?.total_itens
    ? Math.round((verificacao.itens_verificados / verificacao.total_itens) * 100)
    : 0;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="relative w-full max-w-6xl">
        <motion.div
          className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl shadow-2xl p-8 relative overflow-hidden"
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', duration: 0.6 }}
        >
          {/* Fundo animado com grid */}
          <motion.div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'linear-gradient(to right, #3B82F6 1px, transparent 1px), linear-gradient(to bottom, #3B82F6 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
            animate={{
              backgroundPosition: ['0px 0px', '40px 40px'],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'linear',
            }}
          />

          <div className="relative z-10">
            {/* Título */}
            <motion.div
              className="text-center mb-8"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              <motion.div
                className="inline-flex items-center gap-3 mb-3"
                animate={{
                  scale: phase === 'scanning' ? [1, 1.05, 1] : 1,
                }}
                transition={{ duration: 1, repeat: phase === 'scanning' ? Infinity : 0 }}
              >
                <ClipboardCheck className="w-10 h-10 text-blue-600" />
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Verificação Mensal de Inventário
                </h2>
                <Calendar className="w-10 h-10 text-blue-600" />
              </motion.div>
              <p className="text-gray-600 dark:text-gray-400">
                {phase === 'start' && 'Iniciando verificação...'}
                {phase === 'scanning' && 'Escaneando itens do inventário...'}
                {phase === 'analyzing' && 'Analisando dados coletados...'}
                {phase === 'reporting' && 'Gerando relatório...'}
                {phase === 'complete' && 'Verificação concluída com sucesso!'}
              </p>
            </motion.div>

            {/* Layout Principal - 3 Seções */}
            <div className="grid grid-cols-3 gap-6 mb-8">
              {/* Seção 1: Scanner */}
              <div className="flex flex-col items-center gap-4">
                <motion.div
                  className="relative w-48 h-48"
                  animate={{
                    scale: phase === 'scanning' ? [1, 1.02, 1] : 1,
                  }}
                  transition={{ duration: 1, repeat: phase === 'scanning' ? Infinity : 0 }}
                >
                  <div className="w-full h-full bg-gradient-to-br from-blue-400 to-cyan-600 rounded-3xl flex items-center justify-center shadow-2xl relative overflow-hidden">
                    {/* Linha de scan horizontal */}
                    {phase === 'scanning' && (
                      <motion.div
                        className="absolute left-0 right-0 h-2 bg-gradient-to-r from-transparent via-white to-transparent"
                        animate={{
                          y: [0, 180, 0],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: 'linear',
                        }}
                      />
                    )}

                    <Package className="w-24 h-24 text-white z-10" />

                    {/* Partículas de scan */}
                    {phase === 'scanning' && (
                      <>
                        {scanParticles.map((particle) => (
                          <motion.div
                            key={particle.id}
                            className="absolute left-1/2 top-0 w-1 h-1 bg-white rounded-full"
                            animate={{
                              y: [0, 190],
                              opacity: [0, 1, 0],
                            }}
                            transition={{
                              duration: 1.5,
                              delay: particle.delay,
                              repeat: Infinity,
                            }}
                          />
                        ))}
                      </>
                    )}

                    {/* Ondas de verificação */}
                    {phase === 'scanning' && (
                      <>
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            className="absolute inset-0 border-4 border-cyan-300 rounded-3xl"
                            initial={{ scale: 1, opacity: 0.6 }}
                            animate={{ scale: 1.5, opacity: 0 }}
                            transition={{
                              duration: 2,
                              delay: i * 0.7,
                              repeat: Infinity,
                            }}
                          />
                        ))}
                      </>
                    )}
                  </div>

                  {/* Checkmark quando completo */}
                  {phase === 'complete' && (
                    <motion.div
                      className="absolute inset-0 bg-green-500/90 backdrop-blur-sm rounded-3xl flex items-center justify-center"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                    >
                      <CheckCircle className="w-28 h-28 text-white" />
                    </motion.div>
                  )}
                </motion.div>

                {/* Contador de Itens Escaneados */}
                <motion.div
                  className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg min-w-[180px]"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold mb-2">
                    Itens Escaneados
                  </p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {Math.floor(itemsScanned)}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    de {verificacao?.total_itens || 0}
                  </p>
                </motion.div>
              </div>

              {/* Seção 2: Análise */}
              <div className="flex flex-col items-center gap-4">
                <motion.div
                  className="relative w-48 h-48 bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-xl"
                  animate={{
                    scale: phase === 'analyzing' ? [1, 1.02, 1] : 1,
                  }}
                  transition={{ duration: 1, repeat: phase === 'analyzing' ? Infinity : 0 }}
                >
                  {/* Gráfico de barras animado */}
                  <div className="flex items-end justify-between h-full gap-1">
                    {dataPoints.map((point) => (
                      <motion.div
                        key={point.id}
                        className="flex-1 bg-gradient-to-t from-blue-500 to-cyan-500 rounded-t-md"
                        initial={{ height: 0 }}
                        animate={{
                          height: phase === 'analyzing' || phase === 'reporting' || phase === 'complete'
                            ? `${point.height}%`
                            : 0,
                        }}
                        transition={{
                          duration: 0.8,
                          delay: point.delay,
                        }}
                      />
                    ))}
                  </div>

                  {/* Ícone de análise */}
                  <motion.div
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                    animate={{
                      scale: phase === 'analyzing' ? [1, 1.2, 1] : 0,
                      opacity: phase === 'analyzing' ? 1 : 0,
                    }}
                    transition={{ duration: 1, repeat: phase === 'analyzing' ? Infinity : 0 }}
                  >
                    <BarChart3 className="w-16 h-16 text-blue-600" />
                  </motion.div>

                  {/* Ondas de análise */}
                  {phase === 'analyzing' && (
                    <>
                      {[0, 1].map((i) => (
                        <motion.div
                          key={i}
                          className="absolute inset-0 border-4 border-blue-400 rounded-2xl"
                          initial={{ scale: 0.9, opacity: 0.6 }}
                          animate={{ scale: 1.1, opacity: 0 }}
                          transition={{
                            duration: 1.5,
                            delay: i * 0.75,
                            repeat: Infinity,
                          }}
                        />
                      ))}
                    </>
                  )}
                </motion.div>

                {/* Estatísticas */}
                <motion.div
                  className="bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl p-4 shadow-lg min-w-[180px] text-white"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <TrendingUp className="w-5 h-5" />
                    <span className="text-xs font-semibold uppercase">Progresso</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {porcentagemConcluida}%
                  </p>
                  <p className="text-xs opacity-90 mt-1">
                    Verificação completa
                  </p>
                </motion.div>
              </div>

              {/* Seção 3: Relatório */}
              <div className="flex flex-col items-center gap-4">
                <motion.div
                  className="relative w-48 h-48"
                  animate={{
                    scale: phase === 'reporting' ? [1, 1.02, 1] : 1,
                  }}
                  transition={{ duration: 0.8, repeat: phase === 'reporting' ? Infinity : 0 }}
                >
                  <div className="w-full h-full bg-gradient-to-br from-green-400 to-emerald-600 rounded-3xl flex items-center justify-center shadow-2xl relative overflow-hidden">
                    <FileCheck className="w-24 h-24 text-white z-10" />

                    {/* Linhas de escrita do relatório */}
                    {phase === 'reporting' && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <motion.div
                            key={i}
                            className="w-full h-1.5 bg-white/30 rounded-full"
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{
                              duration: 0.6,
                              delay: i * 0.2,
                              repeat: Infinity,
                              repeatDelay: 1,
                            }}
                          />
                        ))}
                      </div>
                    )}

                    {/* Ondas de conclusão */}
                    {phase === 'reporting' && (
                      <>
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            className="absolute inset-0 border-4 border-green-300 rounded-3xl"
                            initial={{ scale: 1, opacity: 0.6 }}
                            animate={{ scale: 1.5, opacity: 0 }}
                            transition={{
                              duration: 1.8,
                              delay: i * 0.6,
                              repeat: Infinity,
                            }}
                          />
                        ))}
                      </>
                    )}
                  </div>
                </motion.div>

                {/* Status do Relatório */}
                <motion.div
                  className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg min-w-[180px]"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">
                      Status
                    </span>
                    <motion.div
                      className={`w-3 h-3 rounded-full ${
                        phase === 'complete' ? 'bg-green-500' : 'bg-blue-500'
                      }`}
                      animate={{
                        scale: phase !== 'complete' ? [1, 1.5, 1] : 1,
                      }}
                      transition={{ duration: 1, repeat: phase !== 'complete' ? Infinity : 0 }}
                    />
                  </div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {phase === 'complete' ? 'Concluído' : 'Em Progresso'}
                  </p>
                </motion.div>
              </div>
            </div>

            {/* Card de Resumo */}
            <motion.div
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Resumo da Verificação - {verificacao?.mes || 'Mês'}/{verificacao?.ano || 'Ano'}
              </h4>
              <div className="grid grid-cols-3 gap-6">
                <div className="flex flex-col items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                  <p className="text-xs text-blue-600 dark:text-blue-400 uppercase font-semibold mb-2">
                    Total de Itens
                  </p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {verificacao?.total_itens || 0}
                  </p>
                </div>
                <div className="flex flex-col items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                  <p className="text-xs text-green-600 dark:text-green-400 uppercase font-semibold mb-2">
                    Verificados
                  </p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {verificacao?.itens_verificados || 0}
                  </p>
                </div>
                <div className="flex flex-col items-center p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
                  <p className="text-xs text-red-600 dark:text-red-400 uppercase font-semibold mb-2">
                    Inconsistências
                  </p>
                  <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                    {verificacao?.inconsistencias || 0}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Barra de Progresso Global */}
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 via-cyan-500 to-green-500"
                initial={{ width: '0%' }}
                animate={{
                  width:
                    phase === 'start'
                      ? '10%'
                      : phase === 'scanning'
                      ? '35%'
                      : phase === 'analyzing'
                      ? '65%'
                      : phase === 'reporting'
                      ? '90%'
                      : '100%',
                }}
                transition={{ duration: 0.6 }}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Processando verificação mensal...
            </p>

            {/* Confetti de conclusão */}
            {phase === 'complete' && (
              <div className="absolute inset-0 pointer-events-none">
                {Array.from({ length: 50 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: ['#3B82F6', '#06B6D4', '#10B981', '#F59E0B'][i % 4],
                      left: '50%',
                      top: '30%',
                    }}
                    initial={{ scale: 0, x: 0, y: 0 }}
                    animate={{
                      scale: [0, 1, 0],
                      x: (Math.random() - 0.5) * 800,
                      y: (Math.random() - 0.5) * 600,
                      opacity: [1, 1, 0],
                    }}
                    transition={{
                      duration: 2,
                      delay: i * 0.02,
                    }}
                  />
                ))}
              </div>
            )}

            {/* Sparkles finais */}
            {phase === 'complete' && (
              <div className="absolute inset-0 pointer-events-none">
                {Array.from({ length: 25 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute"
                    style={{
                      left: '50%',
                      top: '40%',
                    }}
                    initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                    animate={{
                      scale: [0, 1.5, 0],
                      x: (Math.random() - 0.5) * 600,
                      y: (Math.random() - 0.5) * 500,
                      opacity: [1, 1, 0],
                    }}
                    transition={{
                      duration: 1.8,
                      delay: i * 0.05,
                    }}
                  >
                    <Sparkles className="w-6 h-6 text-blue-500" />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default VerificacaoMensalAnimation;
