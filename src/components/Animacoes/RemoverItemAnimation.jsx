import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Warehouse, XCircle, Trash2, AlertTriangle, Flame, X } from 'lucide-react';

const RemoverItemAnimation = ({ 
  item, // { nome, quantidade, categoria }
  onComplete 
}) => {
  const [phase, setPhase] = useState('start'); // start -> selecting -> removing -> disposing -> complete

  useEffect(() => {
    const timeline = [
      { phase: 'start', duration: 500 },
      { phase: 'selecting', duration: 1500 },
      { phase: 'removing', duration: 2200 },
      { phase: 'disposing', duration: 1800 },
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

  // Partículas de seleção
  const selectParticles = Array.from({ length: 8 }).map((_, i) => ({
    id: i,
    angle: (i / 8) * Math.PI * 2,
  }));

  // Partículas de remoção (saindo)
  const removeParticles = Array.from({ length: 30 }).map((_, i) => ({
    id: i,
    angle: (i / 30) * Math.PI * 2,
    distance: 100 + Math.random() * 80,
    delay: i * 0.04,
  }));

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="relative w-full max-w-5xl">
        <motion.div
          className="bg-gradient-to-br from-gray-50 to-red-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl shadow-2xl p-8 relative overflow-hidden"
          initial={{ scale: 0.85, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: 'spring', duration: 0.6 }}
        >
          {/* Fundo animado com alerta */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-orange-500/10"
            animate={{
              opacity: phase === 'selecting' || phase === 'removing' ? [0.2, 0.4, 0.2] : 0.2,
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
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
                  scale: phase === 'selecting' ? [1, 1.05, 1] : 1,
                }}
                transition={{ duration: 0.8, repeat: phase === 'selecting' ? Infinity : 0 }}
              >
                <AlertTriangle className="w-10 h-10 text-red-600" />
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Removendo Item do Inventário
                </h2>
                <Trash2 className="w-10 h-10 text-red-600" />
              </motion.div>
              <p className="text-gray-600 dark:text-gray-400">
                {phase === 'start' && 'Preparando remoção...'}
                {phase === 'selecting' && 'Selecionando item para remoção...'}
                {phase === 'removing' && 'Removendo do almoxarifado...'}
                {phase === 'disposing' && 'Descartando do sistema...'}
                {phase === 'complete' && 'Item removido com sucesso!'}
              </p>
            </motion.div>

            {/* Layout Horizontal - 3 Colunas */}
            <div className="grid grid-cols-3 gap-8 items-center mb-8">
              {/* Coluna 1: Almoxarifado */}
              <div className="flex flex-col items-center gap-6">
                <motion.div
                  className="relative w-48 h-48"
                  animate={{
                    scale: phase === 'removing' ? [1, 0.95, 1] : 1,
                  }}
                  transition={{ duration: 0.8, repeat: phase === 'removing' ? Infinity : 0 }}
                >
                  <div className="w-full h-full bg-gradient-to-br from-gray-400 to-gray-600 rounded-3xl flex items-center justify-center shadow-2xl relative overflow-hidden">
                    <Warehouse className="w-24 h-24 text-white z-10" />

                    {/* Efeito de seleção */}
                    {phase === 'selecting' && (
                      <>
                        {selectParticles.map((particle) => (
                          <motion.div
                            key={particle.id}
                            className="absolute w-4 h-4 border-2 border-yellow-400 rounded-full"
                            style={{
                              left: '50%',
                              top: '50%',
                            }}
                            animate={{
                              x: Math.cos(particle.angle) * 80,
                              y: Math.sin(particle.angle) * 80,
                              scale: [0, 1, 0],
                              opacity: [0, 1, 0],
                            }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                            }}
                          />
                        ))}
                      </>
                    )}

                    {/* Ondas de remoção */}
                    {phase === 'removing' && (
                      <>
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            className="absolute inset-0 border-4 border-red-400 rounded-3xl"
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

                    {/* X vermelho quando vazio */}
                    {(phase === 'disposing' || phase === 'complete') && (
                      <motion.div
                        className="absolute inset-0 bg-red-500/30 backdrop-blur-sm flex items-center justify-center rounded-3xl"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                      >
                        <XCircle className="w-32 h-32 text-red-600" strokeWidth={3} />
                      </motion.div>
                    )}
                  </div>
                </motion.div>

                <motion.div
                  className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg min-w-[200px]"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold mb-2">
                    Almoxarifado
                  </p>
                  <p className={`text-sm font-bold ${
                    phase === 'complete' ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'
                  }`}>
                    {phase === 'complete' ? 'Item Removido' : 'Em Estoque'}
                  </p>
                </motion.div>
              </div>

              {/* Coluna 2: Item sendo removido */}
              <div className="flex flex-col items-center gap-4">
                <AnimatePresence mode="wait">
                  {phase !== 'disposing' && phase !== 'complete' ? (
                    <motion.div
                      key="item"
                      className="relative"
                      animate={{
                        x: phase === 'removing' ? [0, 150, 300] : 0,
                        y: phase === 'removing' ? [0, -40, -80] : 0,
                        rotate: phase === 'removing' ? [0, 15, 30] : 0,
                        scale: phase === 'removing' ? [1, 0.8, 0.5] : 1,
                        opacity: phase === 'removing' ? [1, 0.6, 0] : 1,
                      }}
                      transition={{ duration: 2 }}
                    >
                      {/* Card do Item */}
                      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 min-w-[280px] border-2 border-gray-200 dark:border-gray-700 relative overflow-hidden">
                        {/* Efeito de seleção no card */}
                        {phase === 'selecting' && (
                          <motion.div
                            className="absolute inset-0 bg-yellow-400/20"
                            animate={{
                              opacity: [0.2, 0.5, 0.2],
                            }}
                            transition={{ duration: 1, repeat: Infinity }}
                          />
                        )}

                        {/* X vermelho piscando durante remoção */}
                        {phase === 'removing' && (
                          <motion.div
                            className="absolute inset-0 bg-red-500/20 backdrop-blur-[2px] flex items-center justify-center"
                            animate={{
                              opacity: [0.3, 0.7, 0.3],
                            }}
                            transition={{ duration: 0.5, repeat: Infinity }}
                          >
                            <X className="w-32 h-32 text-red-600" strokeWidth={4} />
                          </motion.div>
                        )}

                        <div className="relative z-10">
                          <div className="flex items-center justify-center mb-4">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
                              <Package className="w-8 h-8 text-white" />
                            </div>
                          </div>
                          <h4 className="text-lg font-bold text-gray-900 dark:text-white text-center mb-2">
                            {item?.nome}
                          </h4>
                          <div className="flex items-center justify-center gap-2 mb-3">
                            <span className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm font-bold px-3 py-1 rounded-full">
                              {item?.quantidade}x
                            </span>
                          </div>
                          {item?.categoria && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                              {item.categoria}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Partículas de remoção voando */}
                      {phase === 'removing' && (
                        <div className="absolute inset-0">
                          {removeParticles.map((particle) => (
                            <motion.div
                              key={particle.id}
                              className="absolute w-2 h-2 bg-red-500 rounded-sm"
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
                                duration: 1.8,
                                delay: particle.delay,
                              }}
                            />
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-center"
                    >
                      <div className="w-32 h-32 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Trash2 className="w-16 h-16 text-red-600" />
                      </div>
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Item Descartado
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Coluna 3: Lixeira */}
              <div className="flex flex-col items-center gap-6">
                <motion.div
                  className="relative w-48 h-48"
                  animate={{
                    scale: phase === 'disposing' ? [1, 1.1, 1] : 1,
                  }}
                  transition={{ duration: 0.6, repeat: phase === 'disposing' ? Infinity : 0 }}
                >
                  <div className="w-full h-full bg-gradient-to-br from-red-400 to-red-600 rounded-3xl flex items-center justify-center shadow-2xl relative overflow-hidden">
                    <Trash2 className="w-24 h-24 text-white z-10" />

                    {/* Chamas na lixeira */}
                    {phase === 'disposing' && (
                      <>
                        {Array.from({ length: 8 }).map((_, i) => (
                          <motion.div
                            key={i}
                            className="absolute"
                            style={{
                              left: `${20 + i * 12}%`,
                              bottom: '10%',
                            }}
                            animate={{
                              y: [0, -100],
                              opacity: [0, 1, 0],
                              scale: [0.5, 1.2, 0.5],
                            }}
                            transition={{
                              duration: 1.5,
                              delay: i * 0.15,
                              repeat: Infinity,
                            }}
                          >
                            <Flame className="w-8 h-8 text-orange-500" />
                          </motion.div>
                        ))}
                      </>
                    )}

                    {/* Ondas de descarte */}
                    {phase === 'disposing' && (
                      <>
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            className="absolute inset-0 border-4 border-orange-400 rounded-3xl"
                            initial={{ scale: 0.8, opacity: 0.6 }}
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

                    {/* Checkmark quando completo */}
                    {phase === 'complete' && (
                      <motion.div
                        className="absolute inset-0 bg-red-700/90 backdrop-blur-sm flex items-center justify-center rounded-3xl"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                      >
                        <XCircle className="w-28 h-28 text-white" strokeWidth={3} />
                      </motion.div>
                    )}
                  </div>
                </motion.div>

                <motion.div
                  className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg min-w-[200px]"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold mb-2">
                    Destino
                  </p>
                  <p className="text-sm font-bold text-red-600 dark:text-red-400">
                    {phase === 'complete' ? 'Removido' : 'Lixeira'}
                  </p>
                </motion.div>
              </div>
            </div>

            {/* Banner de Alerta */}
            <motion.div
              className="bg-red-100 dark:bg-red-900/20 border-2 border-red-500 rounded-2xl p-6 mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-start gap-4">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-red-900 dark:text-red-300 mb-2">
                    Atenção: Item Sendo Removido Permanentemente
                  </h4>
                  <p className="text-xs text-red-700 dark:text-red-400">
                    O item será excluído do sistema e não poderá ser recuperado. 
                    Esta ação é irreversível.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Detalhes do Item */}
            <motion.div
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-inner opacity-70"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 0.7, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 line-through">
                Detalhes do item removido:
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Nome:</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white line-through">
                    {item?.nome || 'N/A'}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Quantidade:</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white line-through">
                    {item?.quantidade || 0}
                  </span>
                </div>
                {item?.categoria && (
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Categoria:</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white line-through">
                      {item.categoria}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Barra de Progresso */}
            <div className="mt-6 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-red-500 to-orange-600"
                initial={{ width: '0%' }}
                animate={{
                  width:
                    phase === 'start'
                      ? '15%'
                      : phase === 'selecting'
                      ? '35%'
                      : phase === 'removing'
                      ? '65%'
                      : phase === 'disposing'
                      ? '90%'
                      : '100%',
                }}
                transition={{ duration: 0.5 }}
              />
            </div>

            {/* Efeitos de conclusão */}
            {phase === 'complete' && (
              <>
                {/* X's vermelhos explodindo */}
                <div className="absolute inset-0 pointer-events-none">
                  {Array.from({ length: 40 }).map((_, i) => (
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
                        x: (Math.random() - 0.5) * 700,
                        y: (Math.random() - 0.5) * 500,
                        opacity: [1, 1, 0],
                        rotate: [0, Math.random() * 360],
                      }}
                      transition={{
                        duration: 1.5,
                        delay: i * 0.02,
                      }}
                    >
                      <X className="w-5 h-5 text-red-600" strokeWidth={3} />
                    </motion.div>
                  ))}
                </div>

                {/* Alertas voando */}
                <div className="absolute inset-0 pointer-events-none">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute"
                      style={{
                        left: '50%',
                        top: '40%',
                      }}
                      initial={{ scale: 0, x: 0, y: 0 }}
                      animate={{
                        scale: [0, 1.5, 0],
                        x: (Math.random() - 0.5) * 600,
                        y: (Math.random() - 0.5) * 400,
                        opacity: [1, 1, 0],
                        rotate: [0, Math.random() * 360],
                      }}
                      transition={{
                        duration: 1.5,
                        delay: i * 0.04,
                      }}
                    >
                      <AlertTriangle className="w-6 h-6 text-red-600" />
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

export default RemoverItemAnimation;
