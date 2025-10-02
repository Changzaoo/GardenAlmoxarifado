import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, XCircle, Package, HelpCircle, AlertCircle, Radar } from 'lucide-react';

const FerramentaPerdidaAnimation = ({ 
  ferramenta, // { nome, local_ultima_vez, responsavel }
  onComplete 
}) => {
  const [phase, setPhase] = useState('start'); // start -> searching -> notfound -> reporting -> complete

  useEffect(() => {
    const timeline = [
      { phase: 'start', duration: 500 },
      { phase: 'searching', duration: 2200 },
      { phase: 'notfound', duration: 1800 },
      { phase: 'reporting', duration: 1200 },
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

  // Ondas de radar
  const radarWaves = Array.from({ length: 4 }).map((_, i) => ({
    id: i,
    delay: i * 0.5,
  }));

  // Pontos de interrogação voando
  const questionMarks = Array.from({ length: 12 }).map((_, i) => ({
    id: i,
    angle: (i / 12) * Math.PI * 2,
    delay: i * 0.1,
  }));

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="relative w-full max-w-4xl">
        <motion.div
          className="bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl shadow-2xl p-8 relative overflow-hidden"
          initial={{ scale: 0.8, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: 'spring', duration: 0.6 }}
        >
          {/* Fundo animado */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-orange-500/15 to-yellow-500/15"
            animate={{
              opacity: [0.3, 0.5, 0.3],
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
              <motion.div
                className="inline-flex items-center gap-3 mb-3"
                animate={{
                  scale: phase === 'searching' ? [1, 1.05, 1] : 1,
                }}
                transition={{ duration: 1, repeat: phase === 'searching' ? Infinity : 0 }}
              >
                <HelpCircle className="w-10 h-10 text-orange-600" />
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Ferramenta Perdida
                </h2>
                <HelpCircle className="w-10 h-10 text-orange-600" />
              </motion.div>
              <p className="text-gray-600 dark:text-gray-400">
                {phase === 'start' && 'Iniciando busca...'}
                {phase === 'searching' && 'Procurando ferramenta...'}
                {phase === 'notfound' && 'Ferramenta não encontrada...'}
                {phase === 'reporting' && 'Registrando perda...'}
                {phase === 'complete' && 'Perda registrada com sucesso!'}
              </p>
            </motion.div>

            {/* Container Principal - Layout Horizontal */}
            <div className="flex items-center justify-between gap-8">
              {/* Radar de Busca (Esquerda) */}
              <div className="flex-1 flex flex-col items-center gap-6">
                <motion.div
                  className="relative w-56 h-56"
                  animate={{
                    scale: phase === 'searching' ? [1, 1.02, 1] : 1,
                  }}
                  transition={{ duration: 1.5, repeat: phase === 'searching' ? Infinity : 0 }}
                >
                  {/* Círculo do radar */}
                  <div className="w-full h-full bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center shadow-2xl relative overflow-hidden">
                    {/* Ondas de radar */}
                    {phase === 'searching' && (
                      <>
                        {radarWaves.map((wave) => (
                          <motion.div
                            key={wave.id}
                            className="absolute inset-0 border-4 border-yellow-300 rounded-full"
                            initial={{ scale: 0, opacity: 0.8 }}
                            animate={{ scale: 1.8, opacity: 0 }}
                            transition={{
                              duration: 2,
                              delay: wave.delay,
                              repeat: Infinity,
                            }}
                          />
                        ))}
                      </>
                    )}

                    {/* Linha rotativa do radar */}
                    {phase === 'searching' && (
                      <motion.div
                        className="absolute top-1/2 left-1/2 w-1 h-28 bg-gradient-to-t from-yellow-300 to-transparent origin-bottom"
                        style={{ transformOrigin: 'bottom center' }}
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: 'linear',
                        }}
                      />
                    )}

                    <AnimatePresence mode="wait">
                      {phase === 'searching' ? (
                        <motion.div
                          key="radar"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1, rotate: 360 }}
                          exit={{ scale: 0 }}
                          transition={{ rotate: { duration: 3, repeat: Infinity, ease: 'linear' } }}
                        >
                          <Radar className="w-24 h-24 text-white z-10" />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="search"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                        >
                          <Search className="w-24 h-24 text-white z-10" />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Pontos de varredura */}
                    {phase === 'searching' && (
                      <>
                        {Array.from({ length: 8 }).map((_, i) => (
                          <motion.div
                            key={i}
                            className="absolute w-3 h-3 bg-yellow-300 rounded-full"
                            style={{
                              left: '50%',
                              top: '50%',
                            }}
                            animate={{
                              x: Math.cos((i / 8) * Math.PI * 2) * 80,
                              y: Math.sin((i / 8) * Math.PI * 2) * 80,
                              scale: [0, 1, 0],
                              opacity: [0, 1, 0],
                            }}
                            transition={{
                              duration: 2,
                              delay: i * 0.25,
                              repeat: Infinity,
                            }}
                          />
                        ))}
                      </>
                    )}
                  </div>

                  {/* Pontos de interrogação ao redor durante busca */}
                  {phase === 'searching' && (
                    <div className="absolute inset-0">
                      {questionMarks.map((mark) => (
                        <motion.div
                          key={mark.id}
                          className="absolute left-1/2 top-1/2"
                          animate={{
                            x: Math.cos(mark.angle) * 140,
                            y: Math.sin(mark.angle) * 140,
                            scale: [0, 1, 0],
                            rotate: [0, 360],
                            opacity: [0, 1, 0],
                          }}
                          transition={{
                            duration: 2,
                            delay: mark.delay,
                            repeat: Infinity,
                          }}
                        >
                          <HelpCircle className="w-6 h-6 text-orange-500" />
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>

                <motion.div
                  className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="flex items-center gap-3">
                    <motion.div
                      className={`w-4 h-4 rounded-full ${
                        phase === 'searching'
                          ? 'bg-yellow-500'
                          : phase === 'complete'
                          ? 'bg-red-500'
                          : 'bg-orange-500'
                      }`}
                      animate={{
                        scale: phase === 'searching' ? [1, 1.5, 1] : 1,
                      }}
                      transition={{ duration: 1, repeat: phase === 'searching' ? Infinity : 0 }}
                    />
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {phase === 'searching'
                        ? 'Buscando...'
                        : phase === 'complete'
                        ? 'Não Encontrada'
                        : 'Aguardando'}
                    </span>
                  </div>
                </motion.div>
              </div>

              {/* Ferramenta Fantasma (Centro) */}
              <div className="flex-1 flex flex-col items-center gap-4">
                <motion.div
                  className="relative"
                  animate={{
                    opacity: phase === 'notfound' ? [1, 0.3, 1] : 1,
                    scale: phase === 'notfound' ? [1, 0.9, 1] : 1,
                  }}
                  transition={{ duration: 1.5, repeat: phase === 'notfound' ? Infinity : 0 }}
                >
                  <div className="w-40 h-40 bg-gradient-to-br from-gray-300 to-gray-500 rounded-3xl flex items-center justify-center shadow-2xl relative">
                    <Package className="w-20 h-20 text-white" />

                    {/* Efeito fantasma */}
                    {phase === 'notfound' && (
                      <>
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            className="absolute inset-0 bg-gray-300 rounded-3xl"
                            animate={{
                              scale: [1, 1.3],
                              opacity: [0.5, 0],
                            }}
                            transition={{
                              duration: 1.5,
                              delay: i * 0.5,
                              repeat: Infinity,
                            }}
                          />
                        ))}
                      </>
                    )}

                    {/* X vermelho quando não encontrada */}
                    {phase === 'notfound' || phase === 'reporting' || phase === 'complete' ? (
                      <motion.div
                        className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-3xl"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                      >
                        <XCircle className="w-24 h-24 text-red-500" />
                      </motion.div>
                    ) : null}
                  </div>
                </motion.div>

                <motion.div
                  className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-lg text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                    {ferramenta?.nome || 'Ferramenta'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Status: Desaparecida
                  </p>
                </motion.div>
              </div>

              {/* Último Local Conhecido (Direita) */}
              <div className="flex-1 flex flex-col items-center gap-6">
                <motion.div
                  className="relative"
                  animate={{
                    scale: phase === 'reporting' ? [1, 1.05, 1] : 1,
                  }}
                  transition={{ duration: 0.8, repeat: phase === 'reporting' ? Infinity : 0 }}
                >
                  <div className="w-48 h-48 bg-gradient-to-br from-red-400 to-red-600 rounded-3xl flex items-center justify-center shadow-2xl relative overflow-hidden">
                    <MapPin className="w-20 h-20 text-white z-10" />

                    {/* Ondas de localização */}
                    {(phase === 'searching' || phase === 'notfound') && (
                      <>
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            className="absolute inset-0 border-4 border-red-300 rounded-3xl"
                            initial={{ scale: 0.8, opacity: 0.6 }}
                            animate={{ scale: 1.4, opacity: 0 }}
                            transition={{
                              duration: 2,
                              delay: i * 0.7,
                              repeat: Infinity,
                            }}
                          />
                        ))}
                      </>
                    )}

                    {/* Pulso de alerta */}
                    {phase === 'notfound' && (
                      <motion.div
                        className="absolute inset-0 bg-red-500"
                        animate={{
                          opacity: [0, 0.5, 0],
                        }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                        }}
                      />
                    )}
                  </div>
                </motion.div>

                <motion.div
                  className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg min-w-[200px]"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold mb-2">
                    Último Local
                  </p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {ferramenta?.local_ultima_vez || 'Desconhecido'}
                  </p>
                  {ferramenta?.responsavel && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                      Resp.: {ferramenta.responsavel}
                    </p>
                  )}
                </motion.div>
              </div>
            </div>

            {/* Alerta de Perda */}
            <motion.div
              className="mt-8 bg-red-100 dark:bg-red-900/20 border-2 border-red-500 rounded-2xl p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div className="flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-red-900 dark:text-red-300 mb-2">
                    Ferramenta não localizada no inventário
                  </h4>
                  <p className="text-xs text-red-700 dark:text-red-400">
                    A ferramenta foi marcada como perdida. Recomendamos realizar uma busca física
                    no último local conhecido e notificar todos os setores envolvidos.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Detalhes */}
            <motion.div
              className="mt-6 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-inner"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Informações da perda:
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Item:</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {ferramenta?.nome || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
                  <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                    PERDIDA
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Último Local:</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {ferramenta?.local_ultima_vez || 'Desconhecido'}
                  </span>
                </div>
                {ferramenta?.responsavel && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Responsável:</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {ferramenta.responsavel}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Barra de Progresso */}
            <div className="mt-6 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-orange-500 to-red-600"
                initial={{ width: '0%' }}
                animate={{
                  width:
                    phase === 'start'
                      ? '15%'
                      : phase === 'searching'
                      ? '40%'
                      : phase === 'notfound'
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
              <div className="absolute inset-0 pointer-events-none">
                {Array.from({ length: 20 }).map((_, i) => (
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
                      x: (Math.random() - 0.5) * 500,
                      y: (Math.random() - 0.5) * 400,
                      opacity: [1, 1, 0],
                    }}
                    transition={{
                      duration: 1.5,
                      delay: i * 0.04,
                    }}
                  >
                    <XCircle className="w-5 h-5 text-red-600" />
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

export default FerramentaPerdidaAnimation;
