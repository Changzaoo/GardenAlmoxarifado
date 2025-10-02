import React, { useEffect, useState } from 'react';
import { Wrench, Package, User, CheckCircle, Sparkles, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EmprestimoAnimation = ({ ferramentas, funcionarioNome, funcionarioFoto, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [currentFerramentaIndex, setCurrentFerramentaIndex] = useState(0);
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    // Gera partículas para o efeito
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      delay: Math.random() * 0.5,
      duration: Math.random() * 2 + 1
    }));
    setParticles(newParticles);

    // Sequência de animação
    const timeline = [
      { step: 0, duration: 800 },   // Preparação
      { step: 1, duration: 1500 },  // Ferramenta sai do almoxarifado
      { step: 2, duration: 1200 },  // Voa pelo meio
      { step: 3, duration: 1000 },  // Chega no funcionário
      { step: 4, duration: 800 }    // Confirmação
    ];

    let totalDuration = 0;
    timeline.forEach(({ step, duration }) => {
      setTimeout(() => {
        if (step === 3 && currentFerramentaIndex < ferramentas.length - 1) {
          // Próxima ferramenta
          setCurrentFerramentaIndex(prev => prev + 1);
          setCurrentStep(0);
        } else {
          setCurrentStep(step);
        }
      }, totalDuration);
      totalDuration += duration;
    });

    // Finaliza após todas as ferramentas
    const ferramentaDuration = timeline.reduce((acc, { duration }) => acc + duration, 0);
    setTimeout(() => {
      onComplete?.();
    }, ferramentaDuration * ferramentas.length + 500);
  }, [currentFerramentaIndex]);

  const currentFerramenta = ferramentas[currentFerramentaIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full h-full max-w-6xl max-h-screen flex items-center justify-center p-8">
        {/* Partículas de fundo */}
        <div className="absolute inset-0 overflow-hidden">
          {particles.map(particle => (
            <motion.div
              key={particle.id}
              className="absolute rounded-full bg-blue-400/30"
              style={{
                width: particle.size,
                height: particle.size,
                left: `${particle.x}%`,
                top: `${particle.y}%`
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
        <div className="relative w-full h-full flex items-center justify-between">
          {/* Almoxarifado (Esquerda) */}
          <motion.div
            className="relative flex flex-col items-center gap-4 z-10"
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className={`w-40 h-40 rounded-3xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-2xl flex items-center justify-center ${
                currentStep === 1 ? 'ring-8 ring-blue-300 ring-opacity-50' : ''
              }`}
              animate={currentStep === 1 ? {
                scale: [1, 1.1, 0.95, 1],
                rotate: [0, -5, 5, 0]
              } : {}}
              transition={{ duration: 0.6 }}
            >
              <Package className="w-20 h-20 text-white" />
            </motion.div>
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-1">Almoxarifado</h3>
              <p className="text-blue-200 text-sm">Estoque Principal</p>
            </div>
            
            {/* Efeito de ondas */}
            {currentStep === 1 && (
              <motion.div
                className="absolute inset-0 rounded-3xl border-4 border-blue-400"
                animate={{
                  scale: [1, 1.5, 2],
                  opacity: [0.8, 0.4, 0]
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeOut"
                }}
              />
            )}
          </motion.div>

          {/* Ferramenta Animada (Centro) */}
          <div className="flex-1 flex items-center justify-center relative h-full">
            <AnimatePresence mode="wait">
              {currentStep >= 1 && currentStep <= 3 && (
                <motion.div
                  key={`ferramenta-${currentFerramentaIndex}`}
                  className="absolute"
                  initial={{ x: -400, y: 0, scale: 0, rotate: -180, opacity: 0 }}
                  animate={{
                    x: currentStep === 1 ? -200 : currentStep === 2 ? 0 : 200,
                    y: currentStep === 2 ? [-20, -60, -20] : 0,
                    scale: currentStep === 2 ? [1, 1.3, 1] : 1,
                    rotate: currentStep === 2 ? [0, 360, 720] : 0,
                    opacity: 1
                  }}
                  exit={{ x: 400, scale: 0, opacity: 0, rotate: 180 }}
                  transition={{
                    duration: currentStep === 2 ? 1.2 : 0.8,
                    ease: "easeInOut"
                  }}
                >
                  {/* Card da Ferramenta */}
                  <motion.div
                    className="relative"
                    animate={{
                      y: [0, -10, 0]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 min-w-[250px] border-4 border-yellow-400">
                      {/* Brilho */}
                      <motion.div
                        className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white to-transparent opacity-30"
                        animate={{
                          x: [-250, 250]
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          repeatDelay: 0.5
                        }}
                      />
                      
                      <div className="relative z-10">
                        <div className="flex items-center justify-center mb-4">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                            <Wrench className="w-8 h-8 text-white" />
                          </div>
                        </div>
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white text-center mb-2">
                          {currentFerramenta?.nome}
                        </h4>
                        <div className="flex items-center justify-center gap-2">
                          <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-bold px-3 py-1 rounded-full">
                            {currentFerramenta?.quantidade}x
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Rastro de estrelas */}
                    {currentStep === 2 && (
                      <>
                        {[...Array(8)].map((_, i) => (
                          <motion.div
                            key={i}
                            className="absolute top-1/2 left-1/2"
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{
                              x: Math.cos((i * Math.PI * 2) / 8) * 60,
                              y: Math.sin((i * Math.PI * 2) / 8) * 60,
                              scale: [0, 1, 0],
                              opacity: [0, 1, 0]
                            }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              delay: i * 0.1
                            }}
                          >
                            <Sparkles className="w-4 h-4 text-yellow-400" />
                          </motion.div>
                        ))}
                      </>
                    )}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Linha de trajetória */}
            <motion.div
              className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-yellow-400 to-green-500 opacity-30"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: currentStep >= 1 ? 1 : 0 }}
              transition={{ duration: 0.8 }}
              style={{ transformOrigin: 'left' }}
            />

            {/* Raios de velocidade */}
            {currentStep === 2 && (
              <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-32 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent"
                    style={{
                      rotate: `${(i * 360) / 12}deg`,
                      originX: 0.5,
                      originY: 0.5
                    }}
                    animate={{
                      scaleX: [0, 2, 0],
                      opacity: [0, 1, 0]
                    }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      delay: i * 0.05
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Funcionário (Direita) */}
          <motion.div
            className="relative flex flex-col items-center gap-4 z-10"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <motion.div
              className={`w-40 h-40 rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center relative ${
                currentStep === 3 ? 'ring-8 ring-green-300 ring-opacity-50' : ''
              }`}
              animate={currentStep === 3 ? {
                scale: [1, 1.15, 1],
                rotate: [0, 5, -5, 0]
              } : {}}
              transition={{ duration: 0.8 }}
            >
              {funcionarioFoto ? (
                <img 
                  src={funcionarioFoto} 
                  alt={funcionarioNome}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center">
                  <User className="w-20 h-20 text-white" />
                </div>
              )}
              {/* Overlay verde no recebimento */}
              {currentStep === 3 && (
                <motion.div
                  className="absolute inset-0 bg-green-500/30"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.6, 0] }}
                  transition={{ duration: 1 }}
                />
              )}
            </motion.div>
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-1">{funcionarioNome}</h3>
              <p className="text-green-200 text-sm">Funcionário</p>
            </div>

            {/* Efeito de recebimento */}
            {currentStep === 3 && (
              <>
                <motion.div
                  className="absolute inset-0 rounded-3xl border-4 border-green-400"
                  animate={{
                    scale: [1, 1.5, 2],
                    opacity: [0.8, 0.4, 0]
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeOut"
                  }}
                />
                
                {/* Confete */}
                {[...Array(30)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][i % 5]
                    }}
                    initial={{ y: 0, x: 0, opacity: 1 }}
                    animate={{
                      y: Math.random() * 200 - 100,
                      x: Math.random() * 200 - 100,
                      opacity: 0,
                      rotate: Math.random() * 360
                    }}
                    transition={{
                      duration: 1.5,
                      delay: Math.random() * 0.3
                    }}
                  />
                ))}
              </>
            )}
          </motion.div>
        </div>

        {/* Informações de progresso */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl shadow-2xl px-8 py-4 border-2 border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Zap className="w-6 h-6 text-yellow-500" />
            </motion.div>
            <div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Transferindo ferramenta {currentFerramentaIndex + 1} de {ferramentas.length}
              </p>
              <div className="flex items-center gap-2 mt-1">
                {ferramentas.map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index < currentFerramentaIndex
                        ? 'w-8 bg-green-500'
                        : index === currentFerramentaIndex
                        ? 'w-12 bg-blue-500'
                        : 'w-6 bg-gray-300 dark:bg-gray-600'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Confirmação final */}
        <AnimatePresence>
          {currentStep === 4 && currentFerramentaIndex === ferramentas.length - 1 && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-12 text-center"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", duration: 0.8 }}
              >
                <motion.div
                  className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.5, repeat: 2 }}
                >
                  <CheckCircle className="w-12 h-12 text-white" />
                </motion.div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Empréstimo Concluído!
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
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
