import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, AlertTriangle, CheckCircle, Flame, Zap } from 'lucide-react';

const DeleteAnimation = ({ emprestimo, onComplete }) => {
  const [phase, setPhase] = useState('warning'); // warning -> shredding -> deleting -> complete

  useEffect(() => {
    const timeline = [
      { phase: 'warning', duration: 1000 },
      { phase: 'shredding', duration: 1500 },
      { phase: 'deleting', duration: 1000 },
      { phase: 'complete', duration: 600 }
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
        }, 400);
      }
    };

    runTimeline();
  }, [onComplete]);

  // Partículas de destruição
  const shredParticles = Array.from({ length: 30 }).map((_, i) => ({
    id: i,
    x: (Math.random() - 0.5) * 300,
    y: Math.random() * 400 - 200,
    rotation: Math.random() * 360,
    delay: i * 0.03,
  }));

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="relative">
        <motion.div
          className="bg-gradient-to-br from-gray-50 to-red-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl shadow-2xl p-8 w-[550px] relative overflow-hidden"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', duration: 0.5 }}
        >
          {/* Fundo pulsante de aviso */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-orange-500/10"
            animate={{
              opacity: phase === 'warning' ? [0.3, 0.6, 0.3] : 0.2,
            }}
            transition={{ duration: 1, repeat: phase === 'warning' ? Infinity : 0 }}
          />

          <div className="relative z-10">
            {/* Ícone Central */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <motion.div
                  className={`w-28 h-28 rounded-2xl flex items-center justify-center shadow-2xl ${
                    phase === 'complete'
                      ? 'bg-gradient-to-br from-gray-400 to-gray-600'
                      : 'bg-gradient-to-br from-red-500 to-red-700'
                  }`}
                  animate={{
                    scale: phase === 'warning' ? [1, 1.05, 1] : phase === 'shredding' ? [1, 0.95, 1.05, 0.9] : 1,
                    rotate: phase === 'shredding' ? [0, -5, 5, -5, 5, 0] : 0,
                  }}
                  transition={{
                    scale: {
                      duration: phase === 'warning' ? 0.8 : 0.3,
                      repeat: phase === 'warning' || phase === 'shredding' ? Infinity : 0,
                    },
                    rotate: { duration: 0.5, repeat: phase === 'shredding' ? Infinity : 0 },
                  }}
                >
                  <AnimatePresence mode="wait">
                    {phase === 'complete' ? (
                      <motion.div
                        key="check"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                      >
                        <CheckCircle className="w-14 h-14 text-white" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="trash"
                        animate={{
                          y: phase === 'shredding' ? [0, -5, 5, 0] : 0,
                        }}
                        transition={{ duration: 0.3, repeat: phase === 'shredding' ? Infinity : 0 }}
                      >
                        <Trash2 className="w-14 h-14 text-white" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Círculos de alerta */}
                {phase === 'warning' && (
                  <>
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="absolute inset-0 border-4 border-red-500 rounded-2xl"
                        initial={{ scale: 1, opacity: 0.6 }}
                        animate={{ scale: 1.8, opacity: 0 }}
                        transition={{
                          duration: 1.5,
                          delay: i * 0.5,
                          repeat: Infinity,
                        }}
                      />
                    ))}
                  </>
                )}

                {/* Chamas durante shredding */}
                {phase === 'shredding' && (
                  <>
                    {[0, 1, 2, 3].map((i) => (
                      <motion.div
                        key={`flame-${i}`}
                        className="absolute"
                        style={{
                          left: `${25 + i * 20}%`,
                          bottom: '-10px',
                        }}
                        animate={{
                          y: [0, -30, 0],
                          opacity: [0, 1, 0],
                          scale: [0.5, 1.2, 0.5],
                        }}
                        transition={{
                          duration: 0.8,
                          delay: i * 0.2,
                          repeat: Infinity,
                        }}
                      >
                        <Flame className="w-6 h-6 text-orange-500" />
                      </motion.div>
                    ))}
                  </>
                )}
              </div>
            </div>

            {/* Título e Mensagem */}
            <AnimatePresence mode="wait">
              <motion.div
                key={phase}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center mb-6"
              >
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {phase === 'warning' && 'Atenção!'}
                  {phase === 'shredding' && 'Destruindo Registro'}
                  {phase === 'deleting' && 'Removendo do Sistema'}
                  {phase === 'complete' && 'Registro Excluído'}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {phase === 'warning' && 'Esta ação não poderá ser desfeita'}
                  {phase === 'shredding' && 'Fragmentando dados permanentemente'}
                  {phase === 'deleting' && 'Limpando banco de dados'}
                  {phase === 'complete' && 'Operação concluída com sucesso'}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Card de Informações */}
            <motion.div
              className="bg-white dark:bg-gray-800 rounded-xl p-5 mb-6 shadow-inner border-2 border-gray-200 dark:border-gray-700"
              animate={{
                borderColor: phase === 'warning' ? ['#E5E7EB', '#EF4444', '#E5E7EB'] : '#E5E7EB',
                scale: phase === 'shredding' ? [1, 0.98, 1] : 1,
              }}
              transition={{
                borderColor: { duration: 1, repeat: phase === 'warning' ? Infinity : 0 },
                scale: { duration: 0.3, repeat: phase === 'shredding' ? Infinity : 0 },
              }}
            >
              {/* Alerta */}
              {phase === 'warning' && (
                <motion.div
                  className="flex items-center gap-3 mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg"
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                >
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                    Você está prestes a excluir permanentemente este empréstimo
                  </p>
                </motion.div>
              )}

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Funcionário:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {emprestimo?.nomeFuncionario || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Ferramentas:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {emprestimo?.ferramentas?.length || 0} item(s)
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      emprestimo?.status === 'emprestado'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                        : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    }`}
                  >
                    {emprestimo?.status === 'emprestado' ? 'Em andamento' : 'Concluído'}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Partículas de destruição */}
            {phase === 'shredding' && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {shredParticles.map((particle) => (
                  <motion.div
                    key={particle.id}
                    className="absolute w-3 h-3 bg-red-500 rounded"
                    style={{ left: '50%', top: '40%' }}
                    initial={{ scale: 0, x: 0, y: 0, rotate: 0, opacity: 1 }}
                    animate={{
                      scale: [0, 1, 0.5],
                      x: particle.x,
                      y: particle.y,
                      rotate: particle.rotation,
                      opacity: [1, 1, 0],
                    }}
                    transition={{
                      duration: 1.2,
                      delay: particle.delay,
                    }}
                  />
                ))}
              </div>
            )}

            {/* Raios durante deleção */}
            {phase === 'deleting' && (
              <div className="absolute inset-0 pointer-events-none">
                {Array.from({ length: 8 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute left-1/2 top-1/2 w-1 h-20 bg-gradient-to-b from-red-500 to-transparent origin-top"
                    style={{
                      rotate: `${i * 45}deg`,
                    }}
                    initial={{ scaleY: 0, opacity: 0 }}
                    animate={{ scaleY: [0, 1, 0], opacity: [0, 1, 0] }}
                    transition={{
                      duration: 0.8,
                      delay: i * 0.1,
                      repeat: Infinity,
                    }}
                  />
                ))}
              </div>
            )}

            {/* Barra de Progresso */}
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className={`h-full ${
                  phase === 'complete'
                    ? 'bg-gradient-to-r from-gray-400 to-gray-600'
                    : 'bg-gradient-to-r from-red-500 to-red-700'
                }`}
                initial={{ width: '0%' }}
                animate={{
                  width:
                    phase === 'warning'
                      ? '25%'
                      : phase === 'shredding'
                      ? '60%'
                      : phase === 'deleting'
                      ? '85%'
                      : '100%',
                }}
                transition={{ duration: 0.5 }}
              />
            </div>

            {/* Mensagem final */}
            {phase === 'complete' && (
              <motion.p
                className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                O registro foi removido permanentemente do sistema
              </motion.p>
            )}

            {/* Efeito de explosão final */}
            {phase === 'complete' && (
              <div className="absolute inset-0 pointer-events-none">
                {Array.from({ length: 20 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 bg-gray-400 rounded-full"
                    style={{ left: '50%', top: '30%' }}
                    initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                    animate={{
                      scale: [0, 1, 0],
                      x: (Math.random() - 0.5) * 400,
                      y: (Math.random() - 0.5) * 300,
                      opacity: [1, 1, 0],
                    }}
                    transition={{
                      duration: 1,
                      delay: i * 0.05,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DeleteAnimation;
