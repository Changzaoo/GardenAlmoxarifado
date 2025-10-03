import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Package, ArrowDown, Sparkles, Check } from 'lucide-react';

const DevolucaoAnimation = ({ 
  emprestimo, 
  ferramentasDevolvidas,
  devolvidoPorTerceiros,
  onComplete 
}) => {
  const [currentTool, setCurrentTool] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!ferramentasDevolvidas || ferramentasDevolvidas.length === 0) return;

    // Duração total: 800ms
    const totalDuration = 800;
    const numFerramentas = ferramentasDevolvidas.length;
    const timePerTool = totalDuration / numFerramentas;

    // Animar cada ferramenta sendo devolvida
    let currentIndex = 0;
    const animateTools = () => {
      if (currentIndex < numFerramentas) {
        setCurrentTool(currentIndex);
        currentIndex++;
        setTimeout(animateTools, timePerTool);
      } else {
        // Todas as ferramentas foram processadas
        setIsComplete(true);
        setTimeout(() => {
          onComplete?.();
        }, 400);
      }
    };

    animateTools();
  }, [ferramentasDevolvidas, onComplete]);

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4"
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      <div className="relative w-full max-w-3xl">
        <motion.div
          className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-8 relative overflow-hidden"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: 'spring', duration: 0.4, bounce: 0.3 }}
          style={{ 
            willChange: 'transform, opacity',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'translateZ(0)',
            WebkitTransform: 'translateZ(0)'
          }}
        >
          {/* Fundo animado */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10"
            animate={{
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{ willChange: 'opacity' }}
          />

          <div className="relative z-10">
            {/* Título */}
            <motion.div
              className="text-center mb-4 sm:mb-8"
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
                Devolução de Ferramentas
              </h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                {isComplete 
                  ? '✅ Concluída com sucesso!' 
                  : `📦 ${currentTool + 1} de ${ferramentasDevolvidas?.length || 0}...`
                }
              </p>
            </motion.div>

            {/* Container Principal */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-12 mb-4 sm:mb-8">
              {/* Funcionário (saindo ferramenta) */}
              <motion.div
                className="flex flex-col items-center"
                animate={{
                  scale: !isComplete ? [1, 0.95, 1] : 1,
                }}
                transition={{ duration: 0.3, repeat: !isComplete ? Infinity : 0 }}
              >
                <div className="relative mb-2 sm:mb-4">
                  <div className="w-20 h-20 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-xl">
                    {emprestimo?.funcionarioFoto ? (
                      <img
                        src={emprestimo.funcionarioFoto}
                        alt={emprestimo.nomeFuncionario}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl sm:text-4xl text-white font-bold">
                        {emprestimo?.nomeFuncionario?.charAt(0) || 'F'}
                      </span>
                    )}
                  </div>

                  {/* Ondas de saída - animação mais rápida e responsiva */}
                  {!isComplete && (
                    <>
                      {[0, 1].map((i) => (
                        <motion.div
                          key={i}
                          className="absolute inset-0 border-2 sm:border-4 border-green-400 rounded-full"
                          initial={{ scale: 1, opacity: 0.6 }}
                          animate={{ scale: 1.5, opacity: 0 }}
                          transition={{
                            duration: 0.8,
                            delay: i * 0.4,
                            repeat: Infinity,
                          }}
                        />
                      ))}
                    </>
                  )}
                </div>
                <h3 className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white text-center">
                  {emprestimo?.nomeFuncionario || 'Funcionário'}
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Devolvendo</p>
              </motion.div>

              {/* Animação Central - Ferramenta Descendo */}
              <div className="relative flex flex-col items-center gap-2 sm:gap-4">
                {/* Ferramenta Animada */}
                <motion.div
                  className="relative"
                  animate={{
                    y: !isComplete ? [0, 40, 0] : 0,
                  }}
                  transition={{
                    duration: 0.8,
                    repeat: !isComplete ? Infinity : 0,
                    ease: 'easeInOut',
                  }}
                >
                  <motion.div
                    className="w-16 h-16 sm:w-24 sm:h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-2xl"
                    animate={{
                      rotate: !isComplete ? [0, 10, -10, 0] : 0,
                      scale: isComplete ? [1, 1.15, 1] : 1,
                    }}
                    transition={{
                      rotate: { duration: 0.4, repeat: !isComplete ? Infinity : 0 },
                      scale: { duration: 0.4 },
                    }}
                  >
                    <AnimatePresence mode="wait">
                      {isComplete ? (
                        <motion.div
                          key="check"
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Check className="w-8 h-8 sm:w-12 sm:h-12 text-white" />
                        </motion.div>
                      ) : (
                        <motion.div key="package">
                          <Package className="w-8 h-8 sm:w-12 sm:h-12 text-white" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* Trilha de partículas - otimizada para mobile */}
                  {!isComplete && (
                    <div className="absolute inset-0 hidden sm:block">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute left-1/2 top-0 w-2 h-2 bg-green-400 rounded-full"
                          animate={{
                            y: [0, 80],
                            opacity: [0, 1, 0],
                            scale: [0, 1, 0],
                          }}
                          transition={{
                            duration: 0.8,
                            delay: i * 0.13,
                            repeat: Infinity,
                          }}
                        />
                      ))}
                    </div>
                  )}
                </motion.div>

                {/* Seta para baixo - hidden on mobile in column layout */}
                <motion.div
                  className="hidden sm:block"
                  animate={{
                    y: !isComplete ? [0, 10, 0] : 0,
                    opacity: !isComplete ? 1 : 0.3,
                  }}
                  transition={{ duration: 0.4, repeat: !isComplete ? Infinity : 0 }}
                >
                  <ArrowDown className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />
                </motion.div>

                {/* Contador */}
                {ferramentasDevolvidas && (
                  <motion.div
                    className="bg-green-500 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-full font-bold shadow-lg text-sm sm:text-base"
                    animate={{
                      scale: !isComplete ? [1, 1.08, 1] : 1,
                    }}
                    transition={{ duration: 0.4, repeat: !isComplete ? Infinity : 0 }}
                  >
                    {isComplete ? ferramentasDevolvidas.length : currentTool + 1} de {ferramentasDevolvidas.length}
                  </motion.div>
                )}
              </div>

              {/* Almoxarifado (recebendo) */}
              <motion.div
                className="flex flex-col items-center"
                animate={{
                  scale: !isComplete ? [1, 1.05, 1] : 1,
                }}
                transition={{ duration: 0.3, repeat: !isComplete ? Infinity : 0 }}
              >
                <div className="relative mb-2 sm:mb-4">
                  <motion.div
                    className="w-20 h-20 sm:w-32 sm:h-32 bg-gradient-to-br from-gray-700 to-gray-900 dark:from-gray-600 dark:to-gray-800 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-xl"
                    animate={{
                      boxShadow: !isComplete 
                        ? ['0 5px 20px rgba(34, 197, 94, 0.3)', '0 10px 40px rgba(34, 197, 94, 0.6)', '0 5px 20px rgba(34, 197, 94, 0.3)']
                        : '0 5px 20px rgba(0, 0, 0, 0.3)',
                    }}
                    transition={{ duration: 0.4, repeat: !isComplete ? Infinity : 0 }}
                  >
                    <Package className="w-10 h-10 sm:w-16 sm:h-16 text-white" />
                  </motion.div>

                  {/* Ondas de recebimento - otimizadas para mobile */}
                  {!isComplete && (
                    <>
                      {[0, 1].map((i) => (
                        <motion.div
                          key={i}
                          className="absolute inset-0 border-2 sm:border-4 border-green-400 rounded-xl sm:rounded-2xl"
                          initial={{ scale: 1.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 0.6 }}
                          exit={{ scale: 1, opacity: 0 }}
                          transition={{
                            duration: 0.8,
                            delay: i * 0.4,
                            repeat: Infinity,
                          }}
                        />
                      ))}
                    </>
                  )}
                </div>
                <h3 className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white">Almoxarifado</h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Recebendo</p>
              </motion.div>
            </div>

            {/* Informações Adicionais */}
            <motion.div
              className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl p-3 sm:p-6 shadow-inner mb-3 sm:mb-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              {devolvidoPorTerceiros && (
                <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <p className="text-xs sm:text-sm text-yellow-800 dark:text-yellow-200 font-medium">
                    ⚠️ Devolução realizada por terceiros
                  </p>
                </div>
              )}

              <h4 className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">
                {isComplete ? '✅ Ferramentas devolvidas:' : '📦 Devolvendo:'}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 max-h-32 sm:max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                {ferramentasDevolvidas?.map((ferramenta, index) => (
                  <motion.div
                    key={index}
                    className={`flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-md sm:rounded-lg text-xs sm:text-sm transition-all duration-200 ${
                      index === currentTool && !isComplete
                        ? 'bg-green-100 dark:bg-green-900/30 border-2 border-green-500 sm:scale-105'
                        : index < currentTool || isComplete
                        ? 'bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700'
                        : 'bg-gray-50 dark:bg-gray-700/50 opacity-50'
                    }`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ 
                      opacity: 1, 
                      x: 0,
                      scale: index === currentTool && !isComplete ? 1.03 : 1
                    }}
                    transition={{ 
                      delay: index * 0.03,
                      scale: { duration: 0.2 },
                      opacity: { duration: 0.3 }
                    }}
                  >
                    <motion.div
                      className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                      animate={{
                        backgroundColor: index < currentTool || isComplete ? '#22C55E' : 'transparent',
                        borderColor: index < currentTool || isComplete ? '#22C55E' : '#9CA3AF',
                      }}
                      transition={{ duration: 0.2 }}
                    >
                      {(index < currentTool || isComplete) && (
                        <motion.div
                          initial={{ scale: 0, rotate: -90 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                        </motion.div>
                      )}
                    </motion.div>
                    <span className="text-gray-700 dark:text-gray-300 truncate font-medium flex-1 min-w-0">
                      {typeof ferramenta === 'object' ? ferramenta.nome : ferramenta}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Barra de Progresso */}
            <div className="h-1.5 sm:h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
              <motion.div
                className="h-full bg-gradient-to-r from-green-400 via-green-500 to-green-600 relative"
                initial={{ width: '0%' }}
                animate={{
                  width: isComplete 
                    ? '100%' 
                    : `${((currentTool + 1) / (ferramentasDevolvidas?.length || 1)) * 100}%`,
                }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
              >
                {/* Brilho na barra */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                  animate={{
                    x: ['-100%', '200%']
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'linear'
                  }}
                />
              </motion.div>
            </div>

            {/* Sparkles de conclusão - otimizado para mobile */}
            {isComplete && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {Array.from({ length: window.innerWidth < 640 ? 12 : 20 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute"
                    style={{
                      left: '50%',
                      top: '50%',
                    }}
                    initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                    animate={{
                      scale: [0, 1, 0],
                      x: (Math.random() - 0.5) * (window.innerWidth < 640 ? 250 : 400),
                      y: (Math.random() - 0.5) * (window.innerWidth < 640 ? 200 : 300),
                      opacity: [1, 1, 0],
                    }}
                    transition={{
                      duration: 0.7,
                      delay: i * 0.015,
                      ease: 'easeOut'
                    }}
                  >
                    <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
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

export default DevolucaoAnimation;
