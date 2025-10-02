import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wrench, AlertTriangle, XCircle, Package, Zap, Flame } from 'lucide-react';

const FerramentaDanificadaAnimation = ({ 
  ferramenta, // { nome, motivo, gravidade }
  onComplete 
}) => {
  const [phase, setPhase] = useState('start'); // start -> detecting -> breaking -> reporting -> complete

  useEffect(() => {
    const timeline = [
      { phase: 'start', duration: 500 },
      { phase: 'detecting', duration: 1500 },
      { phase: 'breaking', duration: 2000 },
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

  // Partículas de quebra
  const breakParticles = Array.from({ length: 25 }).map((_, i) => ({
    id: i,
    angle: (i / 25) * Math.PI * 2,
    distance: 80 + Math.random() * 60,
    delay: i * 0.05,
  }));

  // Raios de alerta
  const alertRays = Array.from({ length: 8 }).map((_, i) => ({
    id: i,
    angle: (i / 8) * Math.PI * 2,
  }));

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="relative w-full max-w-4xl">
        <motion.div
          className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl shadow-2xl p-8 relative overflow-hidden"
          initial={{ scale: 0.9, opacity: 0, rotate: -5 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: 'spring', duration: 0.6 }}
        >
          {/* Fundo pulsante de alerta */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-orange-500/20"
            animate={{
              opacity: phase === 'detecting' || phase === 'breaking' ? [0.2, 0.5, 0.2] : 0.2,
            }}
            transition={{ duration: 1, repeat: Infinity }}
          />

          <div className="relative z-10">
            {/* Título com Alerta */}
            <motion.div
              className="text-center mb-8"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              <motion.div
                className="inline-flex items-center gap-3 mb-3"
                animate={{
                  scale: phase === 'detecting' ? [1, 1.1, 1] : 1,
                }}
                transition={{ duration: 0.8, repeat: phase === 'detecting' ? Infinity : 0 }}
              >
                <AlertTriangle className="w-10 h-10 text-red-600" />
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Ferramenta Danificada
                </h2>
                <AlertTriangle className="w-10 h-10 text-red-600" />
              </motion.div>
              <p className="text-gray-600 dark:text-gray-400">
                {phase === 'start' && 'Iniciando registro...'}
                {phase === 'detecting' && 'Detectando problema...'}
                {phase === 'breaking' && 'Registrando dano...'}
                {phase === 'reporting' && 'Gerando relatório...'}
                {phase === 'complete' && 'Dano registrado com sucesso!'}
              </p>
            </motion.div>

            {/* Container Principal */}
            <div className="flex flex-col items-center gap-8">
              {/* Ferramenta com efeito de quebra */}
              <div className="relative">
                <motion.div
                  className="w-48 h-48 bg-gradient-to-br from-gray-400 to-gray-600 rounded-3xl flex items-center justify-center shadow-2xl relative overflow-hidden"
                  animate={{
                    rotate: phase === 'breaking' ? [0, -5, 5, -5, 5, 0] : 0,
                    scale: phase === 'breaking' ? [1, 0.95, 1.05, 0.95, 1] : 1,
                  }}
                  transition={{ 
                    duration: 0.5, 
                    repeat: phase === 'breaking' ? Infinity : 0 
                  }}
                >
                  {/* Rachaduras */}
                  {phase === 'breaking' && (
                    <>
                      <motion.div
                        className="absolute top-1/4 left-0 right-0 h-1 bg-red-600"
                        initial={{ scaleX: 0, opacity: 0 }}
                        animate={{ scaleX: 1, opacity: 1 }}
                        transition={{ duration: 0.5 }}
                      />
                      <motion.div
                        className="absolute top-0 bottom-0 left-1/3 w-1 bg-red-600"
                        initial={{ scaleY: 0, opacity: 0 }}
                        animate={{ scaleY: 1, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                      />
                      <motion.div
                        className="absolute top-2/3 left-0 right-0 h-1 bg-red-600"
                        initial={{ scaleX: 0, opacity: 0 }}
                        animate={{ scaleX: 1, opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                      />
                    </>
                  )}

                  <Wrench className="w-24 h-24 text-white z-10" />

                  {/* Partículas de quebra voando */}
                  {phase === 'breaking' && (
                    <div className="absolute inset-0">
                      {breakParticles.map((particle) => (
                        <motion.div
                          key={particle.id}
                          className="absolute w-2 h-2 bg-red-600 rounded-sm"
                          style={{
                            left: '50%',
                            top: '50%',
                          }}
                          animate={{
                            x: Math.cos(particle.angle) * particle.distance,
                            y: Math.sin(particle.angle) * particle.distance,
                            scale: [1, 0.5, 0],
                            rotate: [0, Math.random() * 360],
                            opacity: [1, 0.7, 0],
                          }}
                          transition={{
                            duration: 1.5,
                            delay: particle.delay,
                            repeat: Infinity,
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {/* Efeito de impacto */}
                  {phase === 'breaking' && (
                    <>
                      {[0, 1, 2, 3].map((i) => (
                        <motion.div
                          key={i}
                          className="absolute inset-0 border-4 border-red-500 rounded-3xl"
                          initial={{ scale: 1, opacity: 0.8 }}
                          animate={{ scale: 1.5, opacity: 0 }}
                          transition={{
                            duration: 1,
                            delay: i * 0.25,
                            repeat: Infinity,
                          }}
                        />
                      ))}
                    </>
                  )}

                  {/* Chamas de dano */}
                  {phase === 'breaking' && (
                    <>
                      {Array.from({ length: 6 }).map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute"
                          style={{
                            left: `${15 + i * 15}%`,
                            bottom: '-10%',
                          }}
                          animate={{
                            y: [0, -100],
                            opacity: [0, 1, 0],
                            scale: [0.5, 1, 0.5],
                          }}
                          transition={{
                            duration: 1.5,
                            delay: i * 0.2,
                            repeat: Infinity,
                          }}
                        >
                          <Flame className="w-6 h-6 text-orange-500" />
                        </motion.div>
                      ))}
                    </>
                  )}
                </motion.div>

                {/* Raios de alerta ao redor */}
                {phase === 'detecting' && (
                  <div className="absolute inset-0">
                    {alertRays.map((ray) => (
                      <motion.div
                        key={ray.id}
                        className="absolute left-1/2 top-1/2 w-1 h-24 bg-gradient-to-t from-red-500 to-transparent origin-bottom"
                        style={{
                          transform: `rotate(${(ray.angle * 180) / Math.PI}deg) translateY(-50%)`,
                        }}
                        animate={{
                          opacity: [0, 1, 0],
                          scaleY: [0.5, 1, 0.5],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          delay: ray.id * 0.1,
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* X vermelho na conclusão */}
                {phase === 'complete' && (
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                  >
                    <div className="w-32 h-32 bg-red-600/90 rounded-full flex items-center justify-center">
                      <XCircle className="w-20 h-20 text-white" />
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Indicador de Gravidade */}
              <motion.div
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl min-w-[400px]"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Nível de Gravidade:
                  </span>
                  <motion.div
                    className={`px-4 py-2 rounded-full font-bold text-sm ${
                      ferramenta?.gravidade === 'alta'
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        : ferramenta?.gravidade === 'média'
                        ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                        : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                    }`}
                    animate={{
                      scale: phase === 'detecting' || phase === 'breaking' ? [1, 1.1, 1] : 1,
                    }}
                    transition={{ duration: 0.8, repeat: (phase === 'detecting' || phase === 'breaking') ? Infinity : 0 }}
                  >
                    {ferramenta?.gravidade?.toUpperCase() || 'INDEFINIDA'}
                  </motion.div>
                </div>

                {/* Barras de nível de gravidade */}
                <div className="space-y-2">
                  {['Baixa', 'Média', 'Alta'].map((nivel, index) => (
                    <div key={nivel} className="flex items-center gap-3">
                      <span className="text-xs text-gray-600 dark:text-gray-400 w-12">
                        {nivel}
                      </span>
                      <div className="flex-1 h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full ${
                            index === 0
                              ? 'bg-yellow-500'
                              : index === 1
                              ? 'bg-orange-500'
                              : 'bg-red-500'
                          }`}
                          initial={{ width: '0%' }}
                          animate={{
                            width:
                              (ferramenta?.gravidade === 'alta' && index === 2) ||
                              (ferramenta?.gravidade === 'média' && index === 1) ||
                              (ferramenta?.gravidade === 'baixa' && index === 0)
                                ? '100%'
                                : '0%',
                          }}
                          transition={{ duration: 0.8, delay: 0.5 + index * 0.2 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Detalhes do Dano */}
              <motion.div
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl w-full"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                  Informações do Dano:
                </h4>
                <div className="grid grid-cols-2 gap-6">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                      Ferramenta:
                    </span>
                    <span className="text-base font-semibold text-gray-900 dark:text-white">
                      {ferramenta?.nome || 'N/A'}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                      Status:
                    </span>
                    <span className="text-base font-semibold text-red-600 dark:text-red-400">
                      DANIFICADA
                    </span>
                  </div>
                  {ferramenta?.motivo && (
                    <div className="flex flex-col col-span-2">
                      <span className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                        Motivo do Dano:
                      </span>
                      <span className="text-sm text-gray-900 dark:text-white">
                        {ferramenta.motivo}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Barra de Progresso */}
            <div className="mt-8 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-red-500 to-orange-600"
                initial={{ width: '0%' }}
                animate={{
                  width:
                    phase === 'start'
                      ? '20%'
                      : phase === 'detecting'
                      ? '40%'
                      : phase === 'breaking'
                      ? '70%'
                      : phase === 'reporting'
                      ? '90%'
                      : '100%',
                }}
                transition={{ duration: 0.5 }}
              />
            </div>

            {/* Efeitos de conclusão */}
            {phase === 'complete' && (
              <>
                {/* Raios vermelhos */}
                <div className="absolute inset-0 pointer-events-none">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute left-1/2 top-1/2 w-2 h-40 bg-gradient-to-t from-red-500 to-transparent origin-bottom"
                      style={{
                        transform: `rotate(${i * 30}deg)`,
                      }}
                      initial={{ opacity: 0, scaleY: 0 }}
                      animate={{ opacity: [0, 1, 0], scaleY: [0, 1, 0] }}
                      transition={{
                        duration: 1,
                        delay: i * 0.05,
                      }}
                    />
                  ))}
                </div>

                {/* Partículas de alerta */}
                <div className="absolute inset-0 pointer-events-none">
                  {Array.from({ length: 25 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute"
                      style={{
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
                        duration: 1.2,
                        delay: i * 0.03,
                      }}
                    >
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default FerramentaDanificadaAnimation;
