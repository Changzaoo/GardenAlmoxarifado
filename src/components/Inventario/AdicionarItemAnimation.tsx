import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Building2, Warehouse, CheckCircle, Sparkles, Plus, ArrowDown } from 'lucide-react';

const AdicionarItemAnimation = ({ 
  item, 
  empresa, 
  setor, 
  destino, // 'empresa' ou 'almoxarifado'
  onComplete 
}) => {
  const [phase, setPhase] = useState('start'); // start -> creating -> moving -> storing -> complete

  useEffect(() => {
    const timeline = [
      { phase: 'start', duration: 600 },
      { phase: 'creating', duration: 1800 },
      { phase: 'moving', duration: 2000 },
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

  // Partículas de criação
  const creationParticles = Array.from({ length: 20 }).map((_, i) => ({
    id: i,
    angle: (i / 20) * Math.PI * 2,
    delay: i * 0.05,
  }));

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="relative w-full max-w-4xl">
        <motion.div
          className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl shadow-2xl p-8 relative overflow-hidden"
          initial={{ scale: 0.8, opacity: 0, rotateX: -20 }}
          animate={{ scale: 1, opacity: 1, rotateX: 0 }}
          transition={{ type: 'spring', duration: 0.6 }}
        >
          {/* Fundo animado */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10"
            animate={{
              opacity: [0.3, 0.6, 0.3],
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
                Adicionando Novo Item
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {phase === 'start' && 'Preparando cadastro...'}
                {phase === 'creating' && 'Criando registro do item...'}
                {phase === 'moving' && `Adicionando ao ${destino === 'empresa' ? 'inventário da empresa' : 'almoxarifado do setor'}...`}
                {phase === 'storing' && 'Finalizando cadastro...'}
                {phase === 'complete' && 'Item adicionado com sucesso!'}
              </p>
            </motion.div>

            {/* Container Principal - Layout Vertical */}
            <div className="flex flex-col items-center gap-8">
              {/* Fase 1: Criação do Item (topo) */}
              <motion.div
                className="relative"
                animate={{
                  scale: phase === 'creating' ? [1, 1.05, 1] : 1,
                }}
                transition={{ duration: 0.8, repeat: phase === 'creating' ? Infinity : 0 }}
              >
                <div className="w-32 h-32 bg-gradient-to-br from-blue-400 to-blue-600 rounded-3xl flex items-center justify-center shadow-2xl relative">
                  <AnimatePresence mode="wait">
                    {phase === 'creating' ? (
                      <motion.div
                        key="plus"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 180 }}
                      >
                        <Plus className="w-16 h-16 text-white" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="package"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
                        transition={{ 
                          rotate: { duration: 0.5, repeat: phase === 'moving' ? Infinity : 0 } 
                        }}
                      >
                        <Package className="w-16 h-16 text-white" />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Partículas de criação */}
                  {phase === 'creating' && (
                    <div className="absolute inset-0">
                      {creationParticles.map((particle) => (
                        <motion.div
                          key={particle.id}
                          className="absolute w-3 h-3 bg-blue-400 rounded-full"
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
                            delay: particle.delay,
                            repeat: Infinity,
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {/* Ondas de criação */}
                  {phase === 'creating' && (
                    <>
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="absolute inset-0 border-4 border-blue-400 rounded-3xl"
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
                </div>

                {/* Label do item */}
                <motion.div
                  className="mt-4 text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {item?.nome || 'Novo Item'}
                  </p>
                  {item?.quantidade && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Quantidade: {item.quantidade}
                    </p>
                  )}
                </motion.div>
              </motion.div>

              {/* Seta animada para baixo */}
              <motion.div
                className="relative"
                animate={{
                  y: phase === 'moving' ? [0, 15, 0] : 0,
                  opacity: phase === 'moving' ? 1 : 0.3,
                }}
                transition={{ 
                  duration: 1, 
                  repeat: phase === 'moving' ? Infinity : 0 
                }}
              >
                <ArrowDown className="w-12 h-12 text-blue-500" />
                
                {/* Partículas seguindo a seta */}
                {phase === 'moving' && (
                  <>
                    {Array.from({ length: 8 }).map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute left-1/2 top-0 w-2 h-2 bg-blue-400 rounded-full"
                        animate={{
                          y: [0, 80],
                          opacity: [0, 1, 0],
                          scale: [0, 1, 0],
                        }}
                        transition={{
                          duration: 1.2,
                          delay: i * 0.15,
                          repeat: Infinity,
                        }}
                      />
                    ))}
                  </>
                )}
              </motion.div>

              {/* Fase 2: Destino (empresa ou almoxarifado) */}
              <motion.div
                className="relative"
                animate={{
                  scale: phase === 'storing' ? [1, 1.05, 1] : 1,
                }}
                transition={{ duration: 0.6, repeat: phase === 'storing' ? Infinity : 0 }}
              >
                <div className="flex items-center gap-6">
                  {/* Card da Empresa/Setor */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border-2 border-gray-200 dark:border-gray-700 min-w-[300px]">
                    <div className="flex items-center gap-4 mb-4">
                      <motion.div
                        className={`w-16 h-16 rounded-xl flex items-center justify-center ${
                          destino === 'empresa'
                            ? 'bg-gradient-to-br from-purple-400 to-purple-600'
                            : 'bg-gradient-to-br from-green-400 to-green-600'
                        }`}
                        animate={{
                          boxShadow: phase === 'storing'
                            ? destino === 'empresa'
                              ? ['0 10px 30px rgba(168, 85, 247, 0.3)', '0 10px 50px rgba(168, 85, 247, 0.6)', '0 10px 30px rgba(168, 85, 247, 0.3)']
                              : ['0 10px 30px rgba(34, 197, 94, 0.3)', '0 10px 50px rgba(34, 197, 94, 0.6)', '0 10px 30px rgba(34, 197, 94, 0.3)']
                            : '0 10px 30px rgba(0, 0, 0, 0.3)',
                        }}
                        transition={{ duration: 1, repeat: phase === 'storing' ? Infinity : 0 }}
                      >
                        {destino === 'empresa' ? (
                          <Building2 className="w-8 h-8 text-white" />
                        ) : (
                          <Warehouse className="w-8 h-8 text-white" />
                        )}
                      </motion.div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">
                          {destino === 'empresa' ? 'Empresa' : 'Almoxarifado'}
                        </p>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          {destino === 'empresa' ? empresa : setor}
                        </h3>
                      </div>
                    </div>

                    {/* Badge de status */}
                    <motion.div
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${
                        destino === 'empresa'
                          ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                          : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      }`}
                      animate={{
                        scale: phase === 'storing' ? [1, 1.1, 1] : 1,
                      }}
                      transition={{ duration: 0.6, repeat: phase === 'storing' ? Infinity : 0 }}
                    >
                      {phase === 'complete' ? (
                        <>
                          <CheckCircle className="w-3 h-3" />
                          Adicionado
                        </>
                      ) : (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          >
                            <Package className="w-3 h-3" />
                          </motion.div>
                          Processando
                        </>
                      )}
                    </motion.div>
                  </div>
                </div>

                {/* Ondas de recebimento */}
                {phase === 'storing' && (
                  <>
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className={`absolute inset-0 border-4 rounded-2xl ${
                          destino === 'empresa' ? 'border-purple-400' : 'border-green-400'
                        }`}
                        initial={{ scale: 1.2, opacity: 0 }}
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

            {/* Informações do Item */}
            <motion.div
              className="mt-8 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-inner"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Detalhes do item:
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Nome:</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {item?.nome || 'N/A'}
                  </span>
                </div>
                {item?.quantidade && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Quantidade:</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {item.quantidade}
                    </span>
                  </div>
                )}
                {item?.categoria && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Categoria:</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {item.categoria}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Destino:</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {destino === 'empresa' ? 'Inventário da Empresa' : 'Almoxarifado do Setor'}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Barra de Progresso */}
            <div className="mt-6 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-600"
                initial={{ width: '0%' }}
                animate={{
                  width:
                    phase === 'start'
                      ? '20%'
                      : phase === 'creating'
                      ? '40%'
                      : phase === 'moving'
                      ? '70%'
                      : phase === 'storing'
                      ? '90%'
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
                      backgroundColor: ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B'][i % 4],
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

            {/* Sparkles finais */}
            {phase === 'complete' && (
              <div className="absolute inset-0 pointer-events-none">
                {Array.from({ length: 15 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute"
                    style={{
                      left: '50%',
                      top: '30%',
                    }}
                    initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                    animate={{
                      scale: [0, 1, 0],
                      x: (Math.random() - 0.5) * 400,
                      y: (Math.random() - 0.5) * 300,
                      opacity: [1, 1, 0],
                    }}
                    transition={{
                      duration: 1.2,
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

export default AdicionarItemAnimation;
