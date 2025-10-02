import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRightLeft, Users, CheckCircle, Zap } from 'lucide-react';

const TransferenciaAnimation = ({ 
  emprestimoOrigem, 
  funcionarioDestino, 
  ferramentas,
  onComplete 
}) => {
  const [phase, setPhase] = useState('start'); // start -> moving -> transferring -> complete

  useEffect(() => {
    const timeline = [
      { phase: 'start', duration: 600 },
      { phase: 'moving', duration: 2000 },
      { phase: 'transferring', duration: 1200 },
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

  // Partículas de energia
  const energyParticles = Array.from({ length: 15 }).map((_, i) => ({
    id: i,
    delay: i * 0.08,
  }));

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="relative w-full max-w-4xl">
        {/* Card Principal */}
        <motion.div
          className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-3xl shadow-2xl p-8 relative overflow-hidden"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', duration: 0.6 }}
        >
          {/* Título */}
          <motion.div
            className="text-center mb-8"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Transferência de Ferramentas
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {phase === 'start' && 'Preparando transferência...'}
              {phase === 'moving' && 'Movendo ferramentas...'}
              {phase === 'transferring' && 'Atualizando registros...'}
              {phase === 'complete' && 'Transferência concluída!'}
            </p>
          </motion.div>

          {/* Container dos Funcionários */}
          <div className="flex items-center justify-between gap-8 mb-8">
            {/* Funcionário Origem */}
            <motion.div
              className="flex-1 relative"
              animate={{
                scale: phase === 'moving' ? [1, 0.95, 1] : 1,
              }}
              transition={{ duration: 0.5, repeat: phase === 'moving' ? Infinity : 0 }}
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border-2 border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center">
                    {emprestimoOrigem?.funcionarioFoto ? (
                      <img
                        src={emprestimoOrigem.funcionarioFoto}
                        alt="Origem"
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <Users className="w-8 h-8 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">
                      De
                    </p>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      {emprestimoOrigem?.nomeFuncionario || 'Funcionário'}
                    </h3>
                  </div>
                </div>
                
                {/* Badge de saída */}
                <motion.div
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-xs font-semibold"
                  animate={{
                    scale: phase === 'moving' ? [1, 1.1, 1] : 1,
                  }}
                  transition={{ duration: 0.5, repeat: phase === 'moving' ? Infinity : 0 }}
                >
                  <ArrowRightLeft className="w-3 h-3" />
                  Enviando
                </motion.div>
              </div>

              {/* Ondas de saída */}
              {phase === 'moving' && (
                <>
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="absolute inset-0 border-4 border-yellow-400 rounded-2xl pointer-events-none"
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
            </motion.div>

            {/* Seta Animada com Ferramentas */}
            <div className="relative flex flex-col items-center gap-4">
              {/* Partículas de energia */}
              <div className="relative w-32 h-32">
                {energyParticles.map((particle) => (
                  <motion.div
                    key={particle.id}
                    className="absolute w-3 h-3 bg-yellow-400 rounded-full"
                    style={{ left: '50%', top: '50%' }}
                    animate={{
                      x: phase === 'moving' ? [0, 120, 0] : 0,
                      y: phase === 'moving' ? [0, (Math.random() - 0.5) * 40, 0] : 0,
                      scale: phase === 'moving' ? [0, 1, 0] : 0,
                      opacity: phase === 'moving' ? [0, 1, 0] : 0,
                    }}
                    transition={{
                      duration: 1.5,
                      delay: particle.delay,
                      repeat: phase === 'moving' ? Infinity : 0,
                      ease: 'easeInOut',
                    }}
                  />
                ))}
              </div>

              {/* Ícone Central */}
              <motion.div
                className="relative w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-xl z-10"
                animate={{
                  rotate: phase === 'moving' ? 360 : 0,
                  scale: phase === 'transferring' ? [1, 1.2, 1] : 1,
                }}
                transition={{
                  rotate: { duration: 2, repeat: phase === 'moving' ? Infinity : 0, ease: 'linear' },
                  scale: { duration: 0.5, repeat: phase === 'transferring' ? Infinity : 0 },
                }}
              >
                <AnimatePresence mode="wait">
                  {phase === 'complete' ? (
                    <motion.div
                      key="check"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                    >
                      <CheckCircle className="w-10 h-10 text-white" />
                    </motion.div>
                  ) : (
                    <motion.div key="arrow">
                      <ArrowRightLeft className="w-10 h-10 text-white" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Contador de ferramentas */}
              <motion.div
                className="bg-yellow-500 text-white px-4 py-2 rounded-full font-bold shadow-lg"
                animate={{
                  scale: phase === 'moving' ? [1, 1.1, 1] : 1,
                }}
                transition={{ duration: 0.8, repeat: phase === 'moving' ? Infinity : 0 }}
              >
                {ferramentas?.length || 0} {ferramentas?.length === 1 ? 'ferramenta' : 'ferramentas'}
              </motion.div>
            </div>

            {/* Funcionário Destino */}
            <motion.div
              className="flex-1 relative"
              animate={{
                scale: phase === 'transferring' ? [1, 1.05, 1] : 1,
              }}
              transition={{ duration: 0.5, repeat: phase === 'transferring' ? Infinity : 0 }}
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border-2 border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                    {funcionarioDestino?.photoURL ? (
                      <img
                        src={funcionarioDestino.photoURL}
                        alt="Destino"
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <Users className="w-8 h-8 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">
                      Para
                    </p>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      {funcionarioDestino?.nome || 'Novo Funcionário'}
                    </h3>
                  </div>
                </div>
                
                {/* Badge de recebimento */}
                <motion.div
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-semibold"
                  animate={{
                    scale: phase === 'transferring' ? [1, 1.1, 1] : 1,
                  }}
                  transition={{ duration: 0.5, repeat: phase === 'transferring' ? Infinity : 0 }}
                >
                  <Zap className="w-3 h-3" />
                  Recebendo
                </motion.div>
              </div>

              {/* Ondas de chegada */}
              {phase === 'transferring' && (
                <>
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="absolute inset-0 border-4 border-green-400 rounded-2xl pointer-events-none"
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
            </motion.div>
          </div>

          {/* Lista de Ferramentas */}
          <motion.div
            className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-inner"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Ferramentas em transferência:
            </h4>
            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
              {ferramentas?.map((ferramenta, index) => (
                <motion.div
                  key={index}
                  className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                >
                  <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                  <span className="text-gray-700 dark:text-gray-300 truncate">
                    {typeof ferramenta === 'object' ? ferramenta.nome : ferramenta}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Barra de Progresso */}
          <div className="mt-6 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600"
              initial={{ width: '0%' }}
              animate={{
                width:
                  phase === 'start'
                    ? '25%'
                    : phase === 'moving'
                    ? '50%'
                    : phase === 'transferring'
                    ? '75%'
                    : '100%',
              }}
              transition={{ duration: 0.5 }}
            />
          </div>

          {/* Confetti de conclusão */}
          {phase === 'complete' && (
            <div className="absolute inset-0 pointer-events-none">
              {Array.from({ length: 30 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: ['#FCD34D', '#10B981', '#3B82F6', '#EF4444'][i % 4],
                    left: '50%',
                    top: '50%',
                  }}
                  initial={{ scale: 0, x: 0, y: 0 }}
                  animate={{
                    scale: [0, 1, 0],
                    x: (Math.random() - 0.5) * 600,
                    y: (Math.random() - 0.5) * 400,
                    opacity: [1, 1, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    delay: i * 0.03,
                  }}
                />
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default TransferenciaAnimation;
