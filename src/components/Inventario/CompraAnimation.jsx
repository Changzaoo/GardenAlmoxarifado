import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Package, Truck, CheckCircle, DollarSign, CreditCard, Sparkles } from 'lucide-react';

const CompraAnimation = ({ 
  compra, // { item, quantidade, valor, fornecedor }
  onComplete 
}) => {
  const [phase, setPhase] = useState('start'); // start -> ordering -> shipping -> receiving -> complete

  useEffect(() => {
    const timeline = [
      { phase: 'start', duration: 600 },
      { phase: 'ordering', duration: 1800 },
      { phase: 'shipping', duration: 2200 },
      { phase: 'receiving', duration: 1500 },
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

  // Partículas de moedas
  const coinParticles = Array.from({ length: 15 }).map((_, i) => ({
    id: i,
    angle: (i / 15) * Math.PI * 2,
    delay: i * 0.1,
  }));

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="relative w-full max-w-5xl">
        <motion.div
          className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl shadow-2xl p-8 relative overflow-hidden"
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: 'spring', duration: 0.6 }}
        >
          {/* Fundo animado com gradiente */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10"
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
                Processando Compra
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {phase === 'start' && 'Iniciando pedido de compra...'}
                {phase === 'ordering' && 'Processando pagamento...'}
                {phase === 'shipping' && 'Aguardando entrega...'}
                {phase === 'receiving' && 'Recebendo itens...'}
                {phase === 'complete' && 'Compra finalizada com sucesso!'}
              </p>
            </motion.div>

            {/* Layout Horizontal - 3 colunas */}
            <div className="grid grid-cols-3 gap-8 items-center">
              {/* Coluna 1: Pedido e Pagamento */}
              <div className="flex flex-col items-center gap-6">
                {/* Carrinho de Compras */}
                <motion.div
                  className="relative"
                  animate={{
                    scale: phase === 'ordering' ? [1, 1.1, 1] : 1,
                  }}
                  transition={{ duration: 0.8, repeat: phase === 'ordering' ? Infinity : 0 }}
                >
                  <div className="w-32 h-32 bg-gradient-to-br from-green-400 to-emerald-600 rounded-3xl flex items-center justify-center shadow-2xl">
                    <AnimatePresence mode="wait">
                      {phase === 'start' || phase === 'ordering' ? (
                        <motion.div
                          key="cart"
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          exit={{ scale: 0, rotate: 180 }}
                        >
                          <ShoppingCart className="w-16 h-16 text-white" />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="check"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                        >
                          <CheckCircle className="w-16 h-16 text-white" />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Moedas voando durante pagamento */}
                    {phase === 'ordering' && (
                      <div className="absolute inset-0">
                        {coinParticles.map((coin) => (
                          <motion.div
                            key={coin.id}
                            className="absolute"
                            style={{
                              left: '50%',
                              top: '50%',
                            }}
                            animate={{
                              x: Math.cos(coin.angle) * 100,
                              y: Math.sin(coin.angle) * 100,
                              scale: [0, 1, 0],
                              rotate: [0, 360],
                              opacity: [0, 1, 0],
                            }}
                            transition={{
                              duration: 1.5,
                              delay: coin.delay,
                              repeat: Infinity,
                            }}
                          >
                            <DollarSign className="w-4 h-4 text-yellow-400" />
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Ondas de pagamento */}
                  {phase === 'ordering' && (
                    <>
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="absolute inset-0 border-4 border-green-400 rounded-3xl"
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

                {/* Cartão de Pagamento */}
                <motion.div
                  className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-4 shadow-xl w-48"
                  initial={{ rotateY: 0 }}
                  animate={{
                    rotateY: phase === 'ordering' ? [0, 180, 360] : 0,
                  }}
                  transition={{ duration: 2, repeat: phase === 'ordering' ? Infinity : 0 }}
                >
                  <CreditCard className="w-8 h-8 text-white mb-2" />
                  <div className="text-white text-xs font-mono">
                    •••• •••• •••• ••••
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-white text-xs">Valor:</span>
                    <span className="text-white text-sm font-bold">
                      R$ {compra?.valor?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                </motion.div>

                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 text-center">
                  Processando Pagamento
                </p>
              </div>

              {/* Coluna 2: Transporte */}
              <div className="flex flex-col items-center gap-4">
                {/* Caminhão */}
                <motion.div
                  className="relative w-full h-32 flex items-center justify-center"
                  animate={{
                    x: phase === 'shipping' ? [0, 20, 0] : 0,
                  }}
                  transition={{ 
                    duration: 1.5, 
                    repeat: phase === 'shipping' ? Infinity : 0,
                    ease: "easeInOut"
                  }}
                >
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-2xl">
                    <Truck className="w-12 h-12 text-white" />
                  </div>

                  {/* Fumaça do caminhão */}
                  {phase === 'shipping' && (
                    <>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute left-0 bottom-4 w-6 h-6 bg-gray-400 rounded-full"
                          initial={{ scale: 0.2, opacity: 0.6, x: 0 }}
                          animate={{
                            scale: 1.5,
                            opacity: 0,
                            x: -50,
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
                    {phase === 'shipping' && (
                      <motion.div
                        className="h-full w-1/4 bg-white"
                        animate={{
                          x: ['0%', '400%'],
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

                {/* Contador de Pacotes */}
                <motion.div
                  className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-lg"
                  animate={{
                    scale: phase === 'shipping' ? [1, 1.05, 1] : 1,
                  }}
                  transition={{ duration: 1, repeat: phase === 'shipping' ? Infinity : 0 }}
                >
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-blue-500" />
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {compra?.quantidade || 0}x
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Em Transporte
                  </p>
                </motion.div>

                {/* Indicador de Progresso do Transporte */}
                {phase === 'shipping' && (
                  <div className="w-full">
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
                        initial={{ width: '0%' }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    </div>
                  </div>
                )}

                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 text-center">
                  Transporte em Andamento
                </p>
              </div>

              {/* Coluna 3: Recebimento */}
              <div className="flex flex-col items-center gap-6">
                {/* Almoxarifado/Depósito */}
                <motion.div
                  className="relative"
                  animate={{
                    scale: phase === 'receiving' ? [1, 1.05, 1] : 1,
                  }}
                  transition={{ duration: 0.8, repeat: phase === 'receiving' ? Infinity : 0 }}
                >
                  <div className="w-40 h-40 bg-gradient-to-br from-emerald-400 to-green-600 rounded-3xl flex items-center justify-center shadow-2xl relative overflow-hidden">
                    <Package className="w-20 h-20 text-white z-10" />

                    {/* Pacotes caindo */}
                    {phase === 'receiving' && (
                      <>
                        {Array.from({ length: 8 }).map((_, i) => (
                          <motion.div
                            key={i}
                            className="absolute w-6 h-6 bg-white/30 rounded-md"
                            style={{
                              left: `${20 + i * 10}%`,
                              top: '-10%',
                            }}
                            animate={{
                              y: [0, 180],
                              opacity: [0, 1, 0],
                              rotate: [0, 180],
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

                    {/* Ondas de recebimento */}
                    {phase === 'receiving' && (
                      <>
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            className="absolute inset-0 border-4 border-white rounded-3xl"
                            initial={{ scale: 0.8, opacity: 0.6 }}
                            animate={{ scale: 1.3, opacity: 0 }}
                            transition={{
                              duration: 1.5,
                              delay: i * 0.5,
                              repeat: Infinity,
                            }}
                          />
                        ))}
                      </>
                    )}

                    {/* Checkmark final */}
                    {phase === 'complete' && (
                      <motion.div
                        className="absolute inset-0 bg-white/20 backdrop-blur-sm flex items-center justify-center"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                      >
                        <CheckCircle className="w-24 h-24 text-white" />
                      </motion.div>
                    )}
                  </div>
                </motion.div>

                {/* Status do Recebimento */}
                <motion.div
                  className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-xl min-w-[200px]"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">
                      Status
                    </span>
                    <motion.div
                      className={`w-3 h-3 rounded-full ${
                        phase === 'complete' ? 'bg-green-500' : 'bg-yellow-500'
                      }`}
                      animate={{
                        scale: phase !== 'complete' ? [1, 1.5, 1] : 1,
                      }}
                      transition={{ duration: 1, repeat: phase !== 'complete' ? Infinity : 0 }}
                    />
                  </div>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {phase === 'complete' ? 'Recebido' : 'Processando'}
                  </p>
                </motion.div>

                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 text-center">
                  Recebimento
                </p>
              </div>
            </div>

            {/* Detalhes da Compra */}
            <motion.div
              className="mt-8 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-inner"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Detalhes da compra:
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex flex-col">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Item:</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {compra?.item || 'N/A'}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Quantidade:</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {compra?.quantidade || 0}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Valor Total:</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    R$ {compra?.valor?.toFixed(2) || '0.00'}
                  </span>
                </div>
                {compra?.fornecedor && (
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Fornecedor:</span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {compra.fornecedor}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Barra de Progresso Global */}
            <div className="mt-6 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-600"
                initial={{ width: '0%' }}
                animate={{
                  width:
                    phase === 'start'
                      ? '15%'
                      : phase === 'ordering'
                      ? '35%'
                      : phase === 'shipping'
                      ? '70%'
                      : phase === 'receiving'
                      ? '90%'
                      : '100%',
                }}
                transition={{ duration: 0.5 }}
              />
            </div>

            {/* Confetti de conclusão */}
            {phase === 'complete' && (
              <div className="absolute inset-0 pointer-events-none">
                {Array.from({ length: 40 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: ['#10B981', '#34D399', '#6EE7B7', '#F59E0B'][i % 4],
                      left: '50%',
                      top: '20%',
                    }}
                    initial={{ scale: 0, x: 0, y: 0 }}
                    animate={{
                      scale: [0, 1, 0],
                      x: (Math.random() - 0.5) * 700,
                      y: (Math.random() - 0.5) * 500,
                      opacity: [1, 1, 0],
                    }}
                    transition={{
                      duration: 1.8,
                      delay: i * 0.02,
                    }}
                  />
                ))}
              </div>
            )}

            {/* Sparkles finais */}
            {phase === 'complete' && (
              <div className="absolute inset-0 pointer-events-none">
                {Array.from({ length: 20 }).map((_, i) => (
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
                    }}
                    transition={{
                      duration: 1.5,
                      delay: i * 0.04,
                    }}
                  >
                    <Sparkles className="w-5 h-5 text-green-500" />
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

export default CompraAnimation;
