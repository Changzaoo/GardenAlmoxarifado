import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit, CheckCircle, Sparkles, FileEdit } from 'lucide-react';

const EdicaoEmprestimoAnimation = ({ emprestimo, onComplete }) => {
  const [phase, setPhase] = useState('start'); // start -> editing -> saving -> complete

  useEffect(() => {
    const timeline = [
      { phase: 'start', duration: 500 },
      { phase: 'editing', duration: 1500 },
      { phase: 'saving', duration: 1000 },
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

  // Partículas de edição
  const editParticles = Array.from({ length: 12 }).map((_, i) => ({
    id: i,
    delay: i * 0.1,
    x: Math.cos((i / 12) * Math.PI * 2) * 80,
    y: Math.sin((i / 12) * Math.PI * 2) * 80,
  }));

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="relative">
        {/* Partículas de fundo */}
        <div className="absolute inset-0 flex items-center justify-center">
          {editParticles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute w-2 h-2 bg-blue-400 rounded-full"
              initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
              animate={{
                opacity: phase === 'editing' ? [0, 1, 0] : 0,
                scale: phase === 'editing' ? [0, 1, 0] : 0,
                x: phase === 'editing' ? particle.x : 0,
                y: phase === 'editing' ? particle.y : 0,
              }}
              transition={{
                duration: 1.5,
                delay: particle.delay,
                repeat: phase === 'editing' ? Infinity : 0,
                repeatDelay: 0.5,
              }}
            />
          ))}
        </div>

        {/* Card Principal */}
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-[500px] relative overflow-hidden"
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', duration: 0.5 }}
        >
          {/* Brilho de fundo */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20"
            animate={{
              opacity: phase === 'editing' ? [0.3, 0.6, 0.3] : 0.3,
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />

          <div className="relative z-10">
            {/* Ícone Central Animado */}
            <div className="flex justify-center mb-6">
              <motion.div
                className="relative"
                animate={{
                  rotate: phase === 'editing' ? [0, 5, -5, 0] : 0,
                }}
                transition={{ duration: 0.5, repeat: phase === 'editing' ? Infinity : 0 }}
              >
                <motion.div
                  className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg"
                  animate={{
                    scale: phase === 'saving' ? [1, 1.1, 1] : 1,
                  }}
                  transition={{ duration: 0.5, repeat: phase === 'saving' ? Infinity : 0 }}
                >
                  <AnimatePresence mode="wait">
                    {phase === 'complete' ? (
                      <motion.div
                        key="check"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 180 }}
                      >
                        <CheckCircle className="w-12 h-12 text-white" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="edit"
                        initial={{ scale: 1 }}
                        animate={{ scale: phase === 'editing' ? [1, 1.2, 1] : 1 }}
                        transition={{ duration: 0.8, repeat: phase === 'editing' ? Infinity : 0 }}
                      >
                        <Edit className="w-12 h-12 text-white" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Círculos pulsantes */}
                {phase === 'editing' && (
                  <>
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="absolute inset-0 border-4 border-blue-400 rounded-2xl"
                        initial={{ scale: 1, opacity: 0.6 }}
                        animate={{ scale: 2, opacity: 0 }}
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

            {/* Texto de Status */}
            <AnimatePresence mode="wait">
              <motion.div
                key={phase}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center"
              >
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {phase === 'start' && 'Preparando edição...'}
                  {phase === 'editing' && 'Editando empréstimo'}
                  {phase === 'saving' && 'Salvando alterações...'}
                  {phase === 'complete' && 'Empréstimo atualizado!'}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {phase === 'start' && 'Carregando dados do empréstimo'}
                  {phase === 'editing' && 'Modificando informações'}
                  {phase === 'saving' && 'Sincronizando com o servidor'}
                  {phase === 'complete' && 'Alterações salvas com sucesso'}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Informações do Empréstimo */}
            <motion.div
              className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: phase !== 'start' ? 1 : 0 }}
            >
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Funcionário:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {emprestimo?.nomeFuncionario || 'Carregando...'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-gray-600 dark:text-gray-400">Ferramentas:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {emprestimo?.ferramentas?.length || 0} item(s)
                </span>
              </div>
            </motion.div>

            {/* Barra de Progresso */}
            <div className="mt-6 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
                initial={{ width: '0%' }}
                animate={{
                  width:
                    phase === 'start'
                      ? '25%'
                      : phase === 'editing'
                      ? '50%'
                      : phase === 'saving'
                      ? '75%'
                      : '100%',
                }}
                transition={{ duration: 0.5 }}
              />
            </div>

            {/* Sparkles de conclusão */}
            {phase === 'complete' && (
              <div className="absolute inset-0 pointer-events-none">
                {Array.from({ length: 20 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute"
                    initial={{
                      x: '50%',
                      y: '50%',
                      scale: 0,
                      opacity: 1,
                    }}
                    animate={{
                      x: `${50 + (Math.random() - 0.5) * 100}%`,
                      y: `${50 + (Math.random() - 0.5) * 100}%`,
                      scale: [0, 1, 0],
                      opacity: [1, 1, 0],
                    }}
                    transition={{
                      duration: 1,
                      delay: i * 0.05,
                    }}
                  >
                    <Sparkles className="w-4 h-4 text-blue-500" />
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

export default EdicaoEmprestimoAnimation;
