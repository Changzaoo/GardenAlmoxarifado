import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Package, ArrowDown, Sparkles, Check } from 'lucide-react';

const DevolucaoAnimation = ({ 
  emprestimo, 
  ferramentasDevolvidas,
  devolvidoPorTerceiros,
  onComplete 
}) => {
  const [phase, setPhase] = useState('start'); // start -> returning -> storing -> complete
  const [currentTool, setCurrentTool] = useState(0);

  useEffect(() => {
    const timeline = [
      { phase: 'start', duration: 500 },
      { phase: 'returning', duration: 2000 },
      { phase: 'storing', duration: 1200 },
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

  // Atualiza ferramenta atual durante a fase returning
  useEffect(() => {
    if (phase === 'returning' && ferramentasDevolvidas) {
      const interval = setInterval(() => {
        setCurrentTool((prev) => (prev + 1) % ferramentasDevolvidas.length);
      }, 400);
      return () => clearInterval(interval);
    }
  }, [phase, ferramentasDevolvidas]);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="relative w-full max-w-3xl">
        <motion.div
          className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl shadow-2xl p-8 relative overflow-hidden"
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: 'spring', duration: 0.6 }}
        >
          {/* Fundo animado */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10"
            animate={{
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />

          <div className="relative z-10">
            {/* Título */}
            <motion.div
              className="text-center mb-8"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Devolução de Ferramentas
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {phase === 'start' && 'Iniciando processo de devolução...'}
                {phase === 'returning' && 'Recebendo ferramentas de volta...'}
                {phase === 'storing' && 'Registrando no almoxarifado...'}
                {phase === 'complete' && 'Devolução concluída com sucesso!'}
              </p>
            </motion.div>

            {/* Container Principal */}
            <div className="flex items-center justify-center gap-12 mb-8">
              {/* Funcionário (saindo ferramenta) */}
              <motion.div
                className="flex flex-col items-center"
                animate={{
                  scale: phase === 'returning' ? [1, 0.95, 1] : 1,
                }}
                transition={{ duration: 0.8, repeat: phase === 'returning' ? Infinity : 0 }}
              >
                <div className="relative mb-4">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-xl">
                    {emprestimo?.funcionarioFoto ? (
                      <img
                        src={emprestimo.funcionarioFoto}
                        alt={emprestimo.nomeFuncionario}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-4xl text-white font-bold">
                        {emprestimo?.nomeFuncionario?.charAt(0) || 'F'}
                      </span>
                    )}
                  </div>

                  {/* Ondas de saída */}
                  {phase === 'returning' && (
                    <>
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="absolute inset-0 border-4 border-green-400 rounded-full"
                          initial={{ scale: 1, opacity: 0.6 }}
                          animate={{ scale: 1.5, opacity: 0 }}
                          transition={{
                            duration: 1.5,
                            delay: i * 0.5,
                            repeat: Infinity,
                          }}
                        />
                      ))}
                    </>
                  )}
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white text-center">
                  {emprestimo?.nomeFuncionario || 'Funcionário'}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Devolvendo</p>
              </motion.div>

              {/* Animação Central - Ferramenta Descendo */}
              <div className="relative flex flex-col items-center gap-4">
                {/* Ferramenta Animada */}
                <motion.div
                  className="relative"
                  animate={{
                    y: phase === 'returning' ? [0, 100, 0] : 0,
                  }}
                  transition={{
                    duration: 2,
                    repeat: phase === 'returning' ? Infinity : 0,
                    ease: 'easeInOut',
                  }}
                >
                  <motion.div
                    className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center shadow-2xl"
                    animate={{
                      rotate: phase === 'returning' ? [0, 10, -10, 0] : 0,
                      scale: phase === 'storing' ? [1, 1.2, 1] : 1,
                    }}
                    transition={{
                      rotate: { duration: 1, repeat: phase === 'returning' ? Infinity : 0 },
                      scale: { duration: 0.6, repeat: phase === 'storing' ? Infinity : 0 },
                    }}
                  >
                    <AnimatePresence mode="wait">
                      {phase === 'complete' ? (
                        <motion.div
                          key="check"
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                        >
                          <Check className="w-12 h-12 text-white" />
                        </motion.div>
                      ) : (
                        <motion.div key="package">
                          <Package className="w-12 h-12 text-white" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* Trilha de partículas */}
                  {phase === 'returning' && (
                    <div className="absolute inset-0">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute left-1/2 top-0 w-2 h-2 bg-green-400 rounded-full"
                          animate={{
                            y: [0, 120],
                            opacity: [0, 1, 0],
                            scale: [0, 1, 0],
                          }}
                          transition={{
                            duration: 1.5,
                            delay: i * 0.2,
                            repeat: Infinity,
                          }}
                        />
                      ))}
                    </div>
                  )}
                </motion.div>

                {/* Seta para baixo */}
                <motion.div
                  animate={{
                    y: phase === 'returning' ? [0, 10, 0] : 0,
                    opacity: phase === 'returning' ? 1 : 0.3,
                  }}
                  transition={{ duration: 0.8, repeat: phase === 'returning' ? Infinity : 0 }}
                >
                  <ArrowDown className="w-8 h-8 text-green-500" />
                </motion.div>

                {/* Contador */}
                {ferramentasDevolvidas && (
                  <motion.div
                    className="bg-green-500 text-white px-4 py-2 rounded-full font-bold shadow-lg"
                    animate={{
                      scale: phase === 'returning' ? [1, 1.1, 1] : 1,
                    }}
                    transition={{ duration: 0.8, repeat: phase === 'returning' ? Infinity : 0 }}
                  >
                    {ferramentasDevolvidas.length} {ferramentasDevolvidas.length === 1 ? 'item' : 'itens'}
                  </motion.div>
                )}
              </div>

              {/* Almoxarifado (recebendo) */}
              <motion.div
                className="flex flex-col items-center"
                animate={{
                  scale: phase === 'storing' ? [1, 1.05, 1] : 1,
                }}
                transition={{ duration: 0.6, repeat: phase === 'storing' ? Infinity : 0 }}
              >
                <div className="relative mb-4">
                  <motion.div
                    className="w-32 h-32 bg-gradient-to-br from-gray-700 to-gray-900 dark:from-gray-600 dark:to-gray-800 rounded-2xl flex items-center justify-center shadow-xl"
                    animate={{
                      boxShadow: phase === 'storing' 
                        ? ['0 10px 30px rgba(34, 197, 94, 0.3)', '0 10px 50px rgba(34, 197, 94, 0.6)', '0 10px 30px rgba(34, 197, 94, 0.3)']
                        : '0 10px 30px rgba(0, 0, 0, 0.3)',
                    }}
                    transition={{ duration: 1, repeat: phase === 'storing' ? Infinity : 0 }}
                  >
                    <Package className="w-16 h-16 text-white" />
                  </motion.div>

                  {/* Ondas de recebimento */}
                  {phase === 'storing' && (
                    <>
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="absolute inset-0 border-4 border-green-400 rounded-2xl"
                          initial={{ scale: 1.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 0.6 }}
                          exit={{ scale: 1, opacity: 0 }}
                          transition={{
                            duration: 1.5,
                            delay: i * 0.5,
                            repeat: Infinity,
                          }}
                        />
                      ))}
                    </>
                  )}
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Almoxarifado</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Recebendo</p>
              </motion.div>
            </div>

            {/* Informações Adicionais */}
            <motion.div
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-inner mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {devolvidoPorTerceiros && (
                <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
                    ⚠️ Devolução realizada por terceiros
                  </p>
                </div>
              )}

              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                {phase === 'returning' ? 'Devolvendo:' : 'Ferramentas devolvidas:'}
              </h4>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                {ferramentasDevolvidas?.map((ferramenta, index) => (
                  <motion.div
                    key={index}
                    className={`flex items-center gap-2 p-2 rounded-lg text-sm transition-all ${
                      phase === 'returning' && index === currentTool
                        ? 'bg-green-100 dark:bg-green-900/30 border-2 border-green-500'
                        : 'bg-gray-50 dark:bg-gray-700/50'
                    }`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                  >
                    <motion.div
                      className="w-5 h-5 rounded-full border-2 border-green-500 flex items-center justify-center"
                      animate={{
                        backgroundColor: phase === 'complete' || (phase === 'storing' && index <= currentTool) 
                          ? '#22C55E' 
                          : 'transparent',
                      }}
                    >
                      {(phase === 'complete' || (phase === 'storing' && index <= currentTool)) && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </motion.div>
                    <span className="text-gray-700 dark:text-gray-300 truncate">
                      {typeof ferramenta === 'object' ? ferramenta.nome : ferramenta}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Barra de Progresso */}
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-green-400 to-green-600"
                initial={{ width: '0%' }}
                animate={{
                  width:
                    phase === 'start'
                      ? '25%'
                      : phase === 'returning'
                      ? '50%'
                      : phase === 'storing'
                      ? '75%'
                      : '100%',
                }}
                transition={{ duration: 0.5 }}
              />
            </div>

            {/* Sparkles de conclusão */}
            {phase === 'complete' && (
              <div className="absolute inset-0 pointer-events-none">
                {Array.from({ length: 25 }).map((_, i) => (
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
                      x: (Math.random() - 0.5) * 500,
                      y: (Math.random() - 0.5) * 400,
                      opacity: [1, 1, 0],
                    }}
                    transition={{
                      duration: 1.5,
                      delay: i * 0.04,
                    }}
                  >
                    <Sparkles className="w-4 h-4 text-green-500" />
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
