import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Package, Truck, XCircle, X, AlertTriangle, CreditCard, Ban } from 'lucide-react';

const CancelamentoCompraAnimation = ({ 
  compra, // { item, quantidade, valor, fornecedor }
  onComplete 
}) => {
  const [phase, setPhase] = useState('start'); // start -> rejecting -> returning -> canceling -> complete

  useEffect(() => {
    const timeline = [
      { phase: 'start', duration: 600 },
      { phase: 'rejecting', duration: 1800 },
      { phase: 'returning', duration: 2200 },
      { phase: 'canceling', duration: 1500 },
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

  // Partículas de X voando
  const xParticles = Array.from({ length: 20 }).map((_, i) => ({
    id: i,
    angle: (i / 20) * Math.PI * 2,
    delay: i * 0.08,
  }));

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="relative w-full max-w-5xl">
        <motion.div
          className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl shadow-2xl p-8 relative overflow-hidden"
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: 'spring', duration: 0.6 }}
        >
          {/* Fundo pulsante de alerta */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-red-500/15 to-orange-500/15"
            animate={{
              opacity: [0.3, 0.6, 0.3],
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
                  scale: phase === 'rejecting' ? [1, 1.05, 1] : 1,
                }}
                transition={{ duration: 0.8, repeat: phase === 'rejecting' ? Infinity : 0 }}
              >
                <AlertTriangle className="w-10 h-10 text-red-600" />
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Cancelando Compra
                </h2>
                <AlertTriangle className="w-10 h-10 text-red-600" />
              </motion.div>
              <p className="text-gray-600 dark:text-gray-400">
                {phase === 'start' && 'Iniciando cancelamento...'}
                {phase === 'rejecting' && 'Rejeitando pagamento...'}
                {phase === 'returning' && 'Devolvendo ao fornecedor...'}
                {phase === 'canceling' && 'Removendo registro...'}
                {phase === 'complete' && 'Compra cancelada com sucesso!'}
              </p>
            </motion.div>

            {/* Layout Horizontal - 3 colunas (INVERTIDO) */}
            <div className="grid grid-cols-3 gap-8 items-center">
              {/* Coluna 1: Almoxarifado Devolvendo */}
              <div className="flex flex-col items-center gap-6">
                <motion.div
                  className="relative"
                  animate={{
                    scale: phase === 'returning' ? [1, 1.05, 1] : 1,
                  }}
                  transition={{ duration: 0.8, repeat: phase === 'returning' ? Infinity : 0 }}
                >
                  <div className="w-48 h-48 bg-gradient-to-br from-gray-400 to-gray-600 rounded-3xl flex items-center justify-center shadow-2xl relative overflow-hidden">
                    <Package className="w-20 h-20 text-white z-10" />

                    {/* Pacotes subindo (devolvendo) */}
                    {phase === 'returning' && (
                      <>
                        {Array.from({ length: 8 }).map((_, i) => (
                          <motion.div
                            key={i}
                            className="absolute w-6 h-6 bg-white/30 rounded-md"
                            style={{
                              left: `${20 + i * 10}%`,
                              bottom: '10%',
                            }}
                            animate={{
                              y: [0, -180],
                              opacity: [0, 1, 0],
                              rotate: [0, -180],
                            }}
                            transition={{
                              duration: 1.5,
                              delay: i * 0.2,
                              repeat: Infinity,
                            }}
                          />
                        ))}
                      </>
                    )}

                    {/* Ondas vermelhas de devolução */}
                    {phase === 'returning' && (
                      <>
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            className="absolute inset-0 border-4 border-red-400 rounded-3xl"
                            initial={{ scale: 1.3, opacity: 0 }}
                            animate={{ scale: 0.8, opacity: 0.6 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{
                              duration: 1.5,
                              delay: i * 0.5,
                              repeat: Infinity,
                            }}
                          />
                        ))}
                      </>
                    )}

                    {/* X vermelho quando cancelado */}
                    {phase === 'complete' && (
                      <motion.div
                        className="absolute inset-0 bg-red-500/90 backdrop-blur-sm flex items-center justify-center rounded-3xl"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                      >
                        <XCircle className="w-28 h-28 text-white" />
                      </motion.div>
                    )}
                  </div>
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
                        phase === 'returning'
                          ? 'bg-orange-500'
                          : phase === 'complete'
                          ? 'bg-red-500'
                          : 'bg-gray-500'
                      }`}
                      animate={{
                        scale: phase === 'returning' ? [1, 1.5, 1] : 1,
                      }}
                      transition={{ duration: 1, repeat: phase === 'returning' ? Infinity : 0 }}
                    />
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {phase === 'returning'
                        ? 'Devolvendo...'
                        : phase === 'complete'
                        ? 'Cancelado'
                        : 'Aguardando'}
                    </span>
                  </div>
                </motion.div>

                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 text-center">
                  Almoxarifado
                </p>
              </div>

              {/* Coluna 2: Transporte Reverso */}
              <div className="flex flex-col items-center gap-4">
                {/* Caminhão voltando */}
                <motion.div
                  className="relative w-full h-32 flex items-center justify-center"
                  animate={{
                    x: phase === 'returning' ? [0, -20, 0] : 0,
                    scaleX: -1, // Espelhar horizontalmente
                  }}
                  transition={{ 
                    duration: 1.5, 
                    repeat: phase === 'returning' ? Infinity : 0,
                    ease: "easeInOut"
                  }}
                >
                  <div className="w-24 h-24 bg-gradient-to-br from-red-400 to-red-600 rounded-2xl flex items-center justify-center shadow-2xl">
                    <Truck className="w-12 h-12 text-white" style={{ transform: 'scaleX(-1)' }} />
                  </div>

                  {/* Fumaça vermelha */}
                  {phase === 'returning' && (
                    <>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute right-0 bottom-4 w-6 h-6 bg-red-400 rounded-full"
                          initial={{ scale: 0.2, opacity: 0.6, x: 0 }}
                          animate={{
                            scale: 1.5,
                            opacity: 0,
                            x: 50,
                          }}
                          transition={{
                            duration: 1,
                            delay: i * 0.3,
                            repeat: Infinity,
                          }}
                        />
                      ))}
                    </>
                  )}

                  {/* Linha da estrada */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-300 dark:bg-gray-600">
                    {phase === 'returning' && (
                      <motion.div
                        className="h-full w-1/4 bg-red-500"
                        animate={{
                          x: ['400%', '0%'],
                        }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: 'linear',
                        }}
                      />
                    )}
                  </div>
                </motion.div>

                {/* Contador de Pacotes Devolvidos */}
                <motion.div
                  className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-lg"
                  animate={{
                    scale: phase === 'returning' ? [1, 1.05, 1] : 1,
                  }}
                  transition={{ duration: 1, repeat: phase === 'returning' ? Infinity : 0 }}
                >
                  <div className="flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-500" />
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {compra?.quantidade || 0}x
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Em Devolução
                  </p>
                </motion.div>

                {/* Indicador de Progresso Reverso */}
                {phase === 'returning' && (
                  <div className="w-full">
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-red-600 to-red-500"
                        initial={{ width: '100%' }}
                        animate={{ width: '0%' }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    </div>
                  </div>
                )}

                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 text-center">
                  Devolução em Andamento
                </p>
              </div>

              {/* Coluna 3: Pedido Rejeitado */}
              <div className="flex flex-col items-center gap-6">
                {/* Carrinho com X */}
                <motion.div
                  className="relative"
                  animate={{
                    scale: phase === 'rejecting' ? [1, 1.1, 1] : 1,
                    rotate: phase === 'rejecting' ? [0, -5, 5, -5, 5, 0] : 0,
                  }}
                  transition={{ 
                    duration: 0.8, 
                    repeat: phase === 'rejecting' ? Infinity : 0 
                  }}
                >
                  <div className="w-32 h-32 bg-gradient-to-br from-red-400 to-red-600 rounded-3xl flex items-center justify-center shadow-2xl relative">
                    <AnimatePresence mode="wait">
                      {phase === 'start' || phase === 'rejecting' ? (
                        <motion.div
                          key="cart"
                          className="relative"
                          initial={{ scale: 1 }}
                          animate={{ scale: 1 }}
                        >
                          <ShoppingCart className="w-16 h-16 text-white" />
                          {/* X sobre o carrinho */}
                          <motion.div
                            className="absolute inset-0 flex items-center justify-center"
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ delay: 0.2 }}
                          >
                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
                              <X className="w-16 h-16 text-red-600" strokeWidth={3} />
                            </div>
                          </motion.div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="ban"
                          initial={{ scale: 0, rotate: 180 }}
                          animate={{ scale: 1, rotate: 0 }}
                        >
                          <Ban className="w-16 h-16 text-white" />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* X's vermelhos voando */}
                    {phase === 'rejecting' && (
                      <div className="absolute inset-0">
                        {xParticles.map((particle) => (
                          <motion.div
                            key={particle.id}
                            className="absolute"
                            style={{
                              left: '50%',
                              top: '50%',
                            }}
                            animate={{
                              x: Math.cos(particle.angle) * 100,
                              y: Math.sin(particle.angle) * 100,
                              scale: [0, 1, 0],
                              rotate: [0, 360],
                              opacity: [0, 1, 0],
                            }}
                            transition={{
                              duration: 1.5,
                              delay: particle.delay,
                              repeat: Infinity,
                            }}
                          >
                            <X className="w-4 h-4 text-red-600" strokeWidth={3} />
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Ondas vermelhas de rejeição */}
                  {phase === 'rejecting' && (
                    <>
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="absolute inset-0 border-4 border-red-500 rounded-3xl"
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

                {/* Cartão de Pagamento NEGADO */}
                <motion.div
                  className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-4 shadow-xl w-48 relative"
                  initial={{ rotateY: 0 }}
                  animate={{
                    rotateY: phase === 'rejecting' ? [0, 180, 360] : 0,
                    scale: phase === 'rejecting' ? [1, 1.05, 1] : 1,
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: phase === 'rejecting' ? Infinity : 0 
                  }}
                >
                  {/* X gigante sobre o cartão */}
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <X className="w-24 h-24 text-white" strokeWidth={4} />
                  </motion.div>

                  <CreditCard className="w-8 h-8 text-white/50 mb-2" />
                  <div className="text-white/50 text-xs font-mono line-through">
                    •••• •••• •••• ••••
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-white/50 text-xs line-through">Valor:</span>
                    <span className="text-white text-sm font-bold line-through">
                      R$ {compra?.valor?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-center gap-1">
                    <XCircle className="w-4 h-4 text-white" />
                    <span className="text-white text-xs font-bold uppercase">
                      NEGADO
                    </span>
                  </div>
                </motion.div>

                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 text-center">
                  Pagamento Rejeitado
                </p>
              </div>
            </div>

            {/* Banner de Cancelamento */}
            <motion.div
              className="mt-8 bg-red-100 dark:bg-red-900/20 border-2 border-red-500 rounded-2xl p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div className="flex items-start gap-4">
                <Ban className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-red-900 dark:text-red-300 mb-2">
                    Compra Cancelada
                  </h4>
                  <p className="text-xs text-red-700 dark:text-red-400">
                    A compra foi rejeitada e os itens estão sendo devolvidos ao fornecedor. 
                    O registro será removido do sistema.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Detalhes da Compra Cancelada */}
            <motion.div
              className="mt-6 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-inner opacity-50"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 0.5, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 line-through">
                Detalhes da compra cancelada:
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex flex-col">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Item:</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white line-through">
                    {compra?.item || 'N/A'}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Quantidade:</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white line-through">
                    {compra?.quantidade || 0}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Valor Total:</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white line-through">
                    R$ {compra?.valor?.toFixed(2) || '0.00'}
                  </span>
                </div>
                {compra?.fornecedor && (
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Fornecedor:</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white line-through">
                      {compra.fornecedor}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Barra de Progresso Global */}
            <div className="mt-6 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-red-600 to-red-500"
                initial={{ width: '0%' }}
                animate={{
                  width:
                    phase === 'start'
                      ? '15%'
                      : phase === 'rejecting'
                      ? '35%'
                      : phase === 'returning'
                      ? '70%'
                      : phase === 'canceling'
                      ? '90%'
                      : '100%',
                }}
                transition={{ duration: 0.5 }}
              />
            </div>

            {/* X's vermelhos explodindo na conclusão */}
            {phase === 'complete' && (
              <div className="absolute inset-0 pointer-events-none">
                {Array.from({ length: 50 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute"
                    style={{
                      left: '50%',
                      top: '20%',
                    }}
                    initial={{ scale: 0, x: 0, y: 0 }}
                    animate={{
                      scale: [0, 1, 0],
                      x: (Math.random() - 0.5) * 700,
                      y: (Math.random() - 0.5) * 500,
                      opacity: [1, 1, 0],
                      rotate: [0, Math.random() * 720],
                    }}
                    transition={{
                      duration: 1.8,
                      delay: i * 0.02,
                    }}
                  >
                    <X className="w-6 h-6 text-red-600" strokeWidth={3} />
                  </motion.div>
                ))}
              </div>
            )}

            {/* Símbolos de proibição finais */}
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
                      scale: [0, 1.5, 0],
                      x: (Math.random() - 0.5) * 500,
                      y: (Math.random() - 0.5) * 400,
                      opacity: [1, 1, 0],
                      rotate: [0, 360],
                    }}
                    transition={{
                      duration: 1.5,
                      delay: i * 0.04,
                    }}
                  >
                    <Ban className="w-8 h-8 text-red-600" />
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

export default CancelamentoCompraAnimation;
