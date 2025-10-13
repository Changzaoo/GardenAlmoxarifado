import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Zap, ArrowRight, CheckCircle } from 'lucide-react';

/**
 * 🌊 Componente de Animação de Transferência de Dados
 * Mostra partículas de dados fluindo entre servidores
 */
const DataTransferAnimation = ({ 
  fromServer, 
  toServer, 
  isActive, 
  type = 'rotation', // 'rotation' | 'sync'
  onComplete 
}) => {
  const [particles, setParticles] = useState([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isActive) return;

    // Gerar partículas aleatórias
    const particleCount = type === 'rotation' ? 20 : 30;
    const newParticles = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      delay: (i * 0.1) + (Math.random() * 0.3),
      duration: 1.5 + (Math.random() * 0.5),
      offset: (Math.random() - 0.5) * 100,
      size: 4 + Math.random() * 8,
      icon: ['📊', '📈', '💾', '🔄', '⚡', '📁'][Math.floor(Math.random() * 6)]
    }));

    setParticles(newParticles);

    // Animar progresso
    let currentProgress = 0;
    const progressInterval = setInterval(() => {
      currentProgress += 2;
      setProgress(currentProgress);

      if (currentProgress >= 100) {
        clearInterval(progressInterval);
        setTimeout(() => {
          onComplete?.();
        }, 500);
      }
    }, 50);

    return () => clearInterval(progressInterval);
  }, [isActive, type, onComplete]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Overlay escurecido */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black"
      />

      {/* Linha de conexão animada */}
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0" />
            <stop offset="50%" stopColor="#3B82F6" stopOpacity="1" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
          </linearGradient>

          {/* Gradiente animado */}
          <linearGradient id="animatedGradient">
            <stop offset="0%" stopColor="#3B82F6">
              <animate 
                attributeName="stop-color" 
                values="#3B82F6; #8B5CF6; #10B981; #3B82F6" 
                dur="3s" 
                repeatCount="indefinite" 
              />
            </stop>
            <stop offset="100%" stopColor="#10B981">
              <animate 
                attributeName="stop-color" 
                values="#10B981; #3B82F6; #8B5CF6; #10B981" 
                dur="3s" 
                repeatCount="indefinite" 
              />
            </stop>
          </linearGradient>

          {/* Filtro de brilho */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Linha base */}
        <motion.line
          x1={fromServer?.x || "20%"}
          y1={fromServer?.y || "50%"}
          x2={toServer?.x || "80%"}
          y2={toServer?.y || "50%"}
          stroke="url(#lineGradient)"
          strokeWidth="3"
          strokeDasharray="10,5"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          filter="url(#glow)"
        />

        {/* Linha animada pulso */}
        <motion.line
          x1={fromServer?.x || "20%"}
          y1={fromServer?.y || "50%"}
          x2={toServer?.x || "80%"}
          y2={toServer?.y || "50%"}
          stroke="url(#animatedGradient)"
          strokeWidth="2"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ 
            duration: 1.5, 
            ease: "easeInOut",
            repeat: Infinity,
            repeatType: "loop"
          }}
          filter="url(#glow)"
        />
      </svg>

      {/* Partículas de dados */}
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute"
            initial={{
              x: fromServer?.x || "20%",
              y: `calc(${fromServer?.y || "50%"} + ${particle.offset}px)`,
              opacity: 0,
              scale: 0
            }}
            animate={{
              x: toServer?.x || "80%",
              y: `calc(${toServer?.y || "50%"} + ${particle.offset}px)`,
              opacity: [0, 1, 1, 0],
              scale: [0, 1.2, 1, 0.8]
            }}
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              ease: "easeInOut"
            }}
            style={{
              fontSize: `${particle.size}px`,
              filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.8))'
            }}
          >
            {particle.icon}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Card flutuante de status */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.9 }}
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
      >
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 min-w-[320px]">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center"
            >
              {type === 'rotation' ? (
                <ArrowRight className="w-6 h-6 text-white" />
              ) : (
                <Zap className="w-6 h-6 text-white" />
              )}
            </motion.div>
            <div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                {type === 'rotation' ? 'Rotação em Andamento' : 'Sincronizando Dados'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Transferindo dados entre servidores
              </p>
            </div>
          </div>

          {/* Barra de progresso */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Progresso</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {Math.round(progress)}%
              </span>
            </div>
            
            <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              {/* Fundo animado */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 bg-[length:200%_100%]"
                animate={{
                  backgroundPosition: ['0% 0%', '100% 0%']
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear"
                }}
                style={{
                  width: `${progress}%`,
                  transition: 'width 0.3s ease-out'
                }}
              />
              
              {/* Brilho */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30"
                animate={{
                  x: ['-100%', '200%']
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "linear"
                }}
                style={{
                  width: `${progress}%`
                }}
              />
            </div>
          </div>

          {/* Informações dos servidores */}
          <div className="mt-4 flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <Database className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="font-medium text-gray-800 dark:text-white">
                  {fromServer?.name || 'Origem'}
                </div>
                <div className="text-xs text-gray-500">
                  {fromServer?.location || ''}
                </div>
              </div>
            </div>

            <motion.div
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <ArrowRight className="w-5 h-5 text-blue-600" />
            </motion.div>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <Database className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="font-medium text-gray-800 dark:text-white">
                  {toServer?.name || 'Destino'}
                </div>
                <div className="text-xs text-gray-500">
                  {toServer?.location || ''}
                </div>
              </div>
            </div>
          </div>

          {/* Status de conclusão */}
          {progress >= 100 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 flex items-center gap-2 text-green-600 dark:text-green-400"
            >
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold">Transferência Concluída!</span>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Ondas de energia */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {[0, 1, 2].map((i) => (
          <motion.circle
            key={i}
            cx={fromServer?.x || "20%"}
            cy={fromServer?.y || "50%"}
            r="20"
            fill="none"
            stroke="#3B82F6"
            strokeWidth="2"
            initial={{ r: 20, opacity: 0.8 }}
            animate={{ r: 100, opacity: 0 }}
            transition={{
              duration: 2,
              delay: i * 0.6,
              repeat: Infinity,
              ease: "easeOut"
            }}
          />
        ))}
        
        {[0, 1, 2].map((i) => (
          <motion.circle
            key={`to-${i}`}
            cx={toServer?.x || "80%"}
            cy={toServer?.y || "50%"}
            r="20"
            fill="none"
            stroke="#10B981"
            strokeWidth="2"
            initial={{ r: 20, opacity: 0.8 }}
            animate={{ r: 100, opacity: 0 }}
            transition={{
              duration: 2,
              delay: i * 0.6 + 0.3,
              repeat: Infinity,
              ease: "easeOut"
            }}
          />
        ))}
      </svg>
    </div>
  );
};

export default DataTransferAnimation;
