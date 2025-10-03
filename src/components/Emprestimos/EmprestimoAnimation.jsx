import React, { useEffect, useState } from 'react';
import { Wrench, Package, User, CheckCircle, Sparkles, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EmprestimoAnimation = ({ ferramentas, funcionarioNome, funcionarioFoto, onComplete }) => {
  const [currentFerramentaIndex, setCurrentFerramentaIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    // Gera menos partículas para melhor performance
    const newParticles = Array.from({ length: window.innerWidth < 640 ? 8 : 15 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 2,
      delay: Math.random() * 0.3,
      duration: Math.random() * 1.5 + 1
    }));
    setParticles(newParticles);
  }, []);

  useEffect(() => {
    if (!ferramentas || ferramentas.length === 0) return;

    // Duração total: 800ms por ferramenta
    const totalDuration = 800;
    const numFerramentas = ferramentas.length;
    const timePerTool = totalDuration / numFerramentas;

    // Animar cada ferramenta sendo transferida
    let currentIndex = 0;
    const animateTools = () => {
      if (currentIndex < numFerramentas) {
        setCurrentFerramentaIndex(currentIndex);
        currentIndex++;
        setTimeout(animateTools, timePerTool);
      } else {
        // Todas as ferramentas foram transferidas
        setIsComplete(true);
        setTimeout(() => {
          onComplete?.();
        }, 400);
      }
    };

    animateTools();
  }, [ferramentas, onComplete]);

  const currentFerramenta = ferramentas[currentFerramentaIndex];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      <div className="relative w-full h-full max-w-6xl max-h-screen flex items-center justify-center p-2 sm:p-8">
        {/* Partículas de fundo - hidden on mobile for performance */}
        <div className="absolute inset-0 overflow-hidden hidden sm:block">
          {particles.map(particle => (
            <motion.div
              key={particle.id}
              className="absolute rounded-full bg-blue-400/30"
              style={{
                width: particle.size,
                height: particle.size,
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                willChange: 'transform, opacity'
              }}
              animate={{
                scale: [0, 1, 0],
                opacity: [0, 1, 0],
                y: [0, -50, -100]
              }}
              transition={{
                duration: particle.duration,
                repeat: Infinity,
                delay: particle.delay,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>

        {/* Container principal */}
        <div className="relative w-full h-full flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0">
          {/* Almoxarifado (Esquerda/Top) */}
          <motion.div
            className="relative flex flex-col items-center gap-2 sm:gap-4 z-10"
            initial={{ opacity: 0, x: -50, y: 0 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{ 
              willChange: 'transform, opacity',
              backfaceVisibility: 'hidden'
            }}
          >
            <motion.div
              className={`w-20 h-20 sm:w-40 sm:h-40 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-2xl flex items-center justify-center ${
                !isComplete ? 'ring-4 sm:ring-8 ring-blue-300 ring-opacity-50' : ''
              }`}
              animate={!isComplete ? {
                scale: [1, 1.05, 1],
                rotate: [0, -3, 3, 0]
              } : {}}
              transition={{ duration: 0.4, repeat: !isComplete ? Infinity : 0 }}
            >
              <Package className="w-10 h-10 sm:w-20 sm:h-20 text-white" />
            </motion.div>
            <div className="text-center">
              <h3 className="text-base sm:text-2xl font-bold text-white mb-0.5 sm:mb-1">Almoxarifado</h3>
              <p className="text-blue-200 text-xs sm:text-sm">Estoque</p>
            </div>
            
            {/* Efeito de ondas - reduzido no mobile */}
            {!isComplete && (
              <>
                {[0, 1].map((i) => (
                  <motion.div
                    key={i}
                    className="absolute inset-0 rounded-2xl sm:rounded-3xl border-2 sm:border-4 border-blue-400"
                    animate={{
                      scale: [1, 1.5, 2],
                      opacity: [0.6, 0.3, 0]
                    }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      ease: "easeOut",
                      delay: i * 0.4
                    }}
                  />
                ))}
              </>
            )}
          </motion.div>

          {/* Ferramenta Animada (Centro) */}
          <div className="flex-1 flex items-center justify-center relative h-32 sm:h-full my-4 sm:my-0">
            <AnimatePresence mode="wait">
              {!isComplete && (
                <motion.div
                  key={`ferramenta-${currentFerramentaIndex}`}
                  className="absolute"
                  initial={{ x: -150, y: 0, scale: 0, rotate: -90, opacity: 0 }}
                  animate={{
                    x: [0, 80, 0],
                    y: [0, -20, 0],
                    scale: [0.8, 1.1, 0.8],
                    rotate: [0, 180, 360],
                    opacity: [0, 1, 0]
                  }}
                  exit={{ x: 150, scale: 0, opacity: 0, rotate: 90 }}
                  transition={{
                    duration: 0.8,
                    ease: "easeInOut"
                  }}
                  style={{ 
                    willChange: 'transform, opacity',
                    backfaceVisibility: 'hidden'
                  }}
                >
                  {/* Card da Ferramenta */}
                  <motion.div className="relative">
                    <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-2xl p-3 sm:p-6 min-w-[160px] sm:min-w-[250px] border-2 sm:border-4 border-yellow-400">
                      {/* Brilho */}
                      <motion.div
                        className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-r from-transparent via-white to-transparent opacity-30"
                        animate={{
                          x: [-200, 200]
                        }}
                        transition={{
                          duration: 0.8,
                          repeat: Infinity
                        }}
                      />
                      
                      <div className="relative z-10">
                        <div className="flex items-center justify-center mb-2 sm:mb-4">
                          <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                            <Wrench className="w-5 h-5 sm:w-8 sm:h-8 text-white" />
                          </div>
                        </div>
                        <h4 className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white text-center mb-1 sm:mb-2 truncate">
                          {currentFerramenta?.nome}
                        </h4>
                        <div className="flex items-center justify-center gap-2">
                          <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs sm:text-sm font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">
                            {currentFerramenta?.quantidade}x
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Rastro de estrelas - hidden on mobile */}
                    <div className="hidden sm:block">
                      {[...Array(6)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute top-1/2 left-1/2"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{
                            x: Math.cos((i * Math.PI * 2) / 6) * 50,
                            y: Math.sin((i * Math.PI * 2) / 6) * 50,
                            scale: [0, 1, 0],
                            opacity: [0, 1, 0]
                          }}
                          transition={{
                            duration: 0.8,
                            repeat: Infinity,
                            delay: i * 0.13
                          }}
                        >
                          <Sparkles className="w-3 h-3 text-yellow-400" />
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Linha de trajetória - hidden on mobile */}
            <motion.div
              className="hidden sm:block absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-yellow-400 to-green-500 opacity-30"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: !isComplete ? 1 : 0 }}
              transition={{ duration: 0.4 }}
              style={{ transformOrigin: 'left', willChange: 'transform' }}
            />

            {/* Raios de velocidade - hidden on mobile */}
            {!isComplete && (
              <div className="hidden sm:block absolute inset-0 flex items-center justify-center overflow-hidden">
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-24 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent"
                    style={{
                      rotate: `${(i * 360) / 8}deg`,
                      originX: 0.5,
                      originY: 0.5,
                      willChange: 'transform, opacity'
                    }}
                    animate={{
                      scaleX: [0, 2, 0],
                      opacity: [0, 1, 0]
                    }}
                    transition={{
                      duration: 0.6,
                      repeat: Infinity,
                      delay: i * 0.075
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Funcionário (Direita/Bottom) */}
          <motion.div
            className="relative flex flex-col items-center gap-2 sm:gap-4 z-10"
            initial={{ opacity: 0, x: 50, y: 0 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            style={{ 
              willChange: 'transform, opacity',
              backfaceVisibility: 'hidden'
            }}
          >
            <motion.div
              className={`w-20 h-20 sm:w-40 sm:h-40 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center relative ${
                !isComplete ? 'ring-4 sm:ring-8 ring-green-300 ring-opacity-50' : ''
              }`}
              animate={!isComplete ? {
                scale: [1, 1.08, 1],
                rotate: [0, 3, -3, 0]
              } : {}}
              transition={{ duration: 0.4, repeat: !isComplete ? Infinity : 0 }}
            >
              {funcionarioFoto ? (
                <img 
                  src={funcionarioFoto} 
                  alt={funcionarioNome}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center">
                  <User className="w-10 h-10 sm:w-20 sm:h-20 text-white" />
                </div>
              )}
              {/* Overlay verde no recebimento */}
              {!isComplete && (
                <motion.div
                  className="absolute inset-0 bg-green-500/30"
                  animate={{ opacity: [0, 0.5, 0] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                />
              )}
            </motion.div>
            <div className="text-center">
              <h3 className="text-base sm:text-2xl font-bold text-white mb-0.5 sm:mb-1 truncate max-w-[150px] sm:max-w-none">{funcionarioNome}</h3>
              <p className="text-green-200 text-xs sm:text-sm">Funcionário</p>
            </div>

            {/* Efeito de recebimento - reduzido no mobile */}
            {!isComplete && (
              <>
                {[0, 1].map((i) => (
                  <motion.div
                    key={i}
                    className="absolute inset-0 rounded-2xl sm:rounded-3xl border-2 sm:border-4 border-green-400"
                    animate={{
                      scale: [1, 1.5, 2],
                      opacity: [0.6, 0.3, 0]
                    }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      ease: "easeOut",
                      delay: i * 0.4
                    }}
                  />
                ))}
                
                {/* Confete - reduzido no mobile */}
                {[...Array(window.innerWidth < 640 ? 12 : 20)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full"
                    style={{
                      backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][i % 5]
                    }}
                    initial={{ y: 0, x: 0, opacity: 1 }}
                    animate={{
                      y: Math.random() * 150 - 75,
                      x: Math.random() * 150 - 75,
                      opacity: 0,
                      rotate: Math.random() * 360
                    }}
                    transition={{
                      duration: 0.8,
                      delay: (i / (window.innerWidth < 640 ? 12 : 20)) * 0.3,
                      repeat: Infinity,
                      repeatDelay: 0.5
                    }}
                  />
                ))}
              </>
            )}
          </motion.div>
        </div>

        {/* Informações de progresso */}
        <div className="absolute bottom-4 sm:bottom-8 left-1/2 transform -translate-x-1/2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-xl sm:rounded-2xl shadow-2xl px-3 py-2 sm:px-8 sm:py-4 border border-gray-200 dark:border-gray-700 max-w-[90vw]">
          <div className="flex items-center gap-2 sm:gap-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            >
              <Zap className="w-4 h-4 sm:w-6 sm:h-6 text-yellow-500" />
            </motion.div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 truncate">
                {isComplete 
                  ? `✅ ${ferramentas.length} transferidas` 
                  : `📦 ${currentFerramentaIndex + 1} de ${ferramentas.length}`
                }
              </p>
              <div className="flex items-center gap-1 sm:gap-2 mt-1 overflow-x-auto scrollbar-none">
                {ferramentas.map((_, index) => (
                  <motion.div
                    key={index}
                    className={`h-1.5 sm:h-2 rounded-full transition-all duration-200 flex-shrink-0 ${
                      index < currentFerramentaIndex
                        ? 'w-6 sm:w-8 bg-green-500'
                        : index === currentFerramentaIndex
                        ? 'w-8 sm:w-12 bg-blue-500'
                        : 'w-4 sm:w-6 bg-gray-300 dark:bg-gray-600'
                    }`}
                    animate={{
                      scale: index === currentFerramentaIndex ? [1, 1.2, 1] : 1
                    }}
                    transition={{ duration: 0.4, repeat: index === currentFerramentaIndex ? Infinity : 0 }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Confirmação final */}
        <AnimatePresence>
          {isComplete && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div
                className="bg-white dark:bg-gray-800 rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-12 text-center max-w-md"
                initial={{ scale: 0.8, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", duration: 0.5, bounce: 0.4 }}
                style={{ 
                  willChange: 'transform',
                  backfaceVisibility: 'hidden'
                }}
              >
                <motion.div
                  className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center"
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 0.4, repeat: 2 }}
                >
                  <CheckCircle className="w-8 h-8 sm:w-12 sm:h-12 text-white" />
                </motion.div>
                <h2 className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Empréstimo Concluído!
                </h2>
                <p className="text-sm sm:text-lg text-gray-600 dark:text-gray-400">
                  {ferramentas.length} {ferramentas.length === 1 ? 'ferramenta transferida' : 'ferramentas transferidas'} com sucesso
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default EmprestimoAnimation;
