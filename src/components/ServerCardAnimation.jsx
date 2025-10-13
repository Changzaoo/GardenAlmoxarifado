import React from 'react';
import { motion } from 'framer-motion';

/**
 * 💫 Animação de Card de Servidor durante transferência
 */
export const ServerCardPulse = ({ isActive, type = 'sending' }) => {
  if (!isActive) return null;

  const isSending = type === 'sending';
  const color = isSending ? 'blue' : 'green';

  return (
    <>
      {/* Brilho pulsante ao redor do card */}
      <motion.div
        className={`absolute inset-0 rounded-xl bg-gradient-to-r ${
          isSending 
            ? 'from-blue-500/30 to-purple-500/30' 
            : 'from-green-500/30 to-blue-500/30'
        }`}
        animate={{
          opacity: [0.3, 0.6, 0.3],
          scale: [1, 1.02, 1]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{
          filter: 'blur(20px)',
          zIndex: -1
        }}
      />

      {/* Partículas saindo/entrando do card */}
      <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={i}
            className={`absolute w-2 h-2 rounded-full bg-${color}-400`}
            initial={{
              x: isSending ? '50%' : '150%',
              y: `${(i * 12) + 10}%`,
              opacity: 0,
              scale: 0
            }}
            animate={{
              x: isSending ? '150%' : '50%',
              y: `${(i * 12) + 10 + (Math.random() * 10 - 5)}%`,
              opacity: [0, 1, 1, 0],
              scale: [0, 1, 1, 0]
            }}
            transition={{
              duration: 2,
              delay: i * 0.2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            style={{
              boxShadow: `0 0 10px ${isSending ? '#3B82F6' : '#10B981'}`
            }}
          />
        ))}
      </div>

      {/* Ondas de energia no header */}
      <svg className="absolute top-0 left-0 w-full h-24 overflow-visible pointer-events-none">
        <defs>
          <linearGradient id={`wave-gradient-${type}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={isSending ? "#3B82F6" : "#10B981"} stopOpacity="0.3" />
            <stop offset="50%" stopColor={isSending ? "#8B5CF6" : "#3B82F6"} stopOpacity="0.5" />
            <stop offset="100%" stopColor={isSending ? "#3B82F6" : "#10B981"} stopOpacity="0.3" />
          </linearGradient>
        </defs>

        {[0, 1, 2].map((i) => (
          <motion.path
            key={i}
            d="M0,40 Q50,20 100,40 T200,40 T300,40 T400,40"
            fill="none"
            stroke={`url(#wave-gradient-${type})`}
            strokeWidth="3"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ 
              pathLength: 1, 
              opacity: [0, 0.8, 0],
              x: [0, 100]
            }}
            transition={{
              duration: 2,
              delay: i * 0.4,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        ))}
      </svg>

      {/* Badge de status animado */}
      <motion.div
        className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold ${
          isSending 
            ? 'bg-blue-500 text-white' 
            : 'bg-green-500 text-white'
        }`}
        animate={{
          scale: [1, 1.1, 1],
          boxShadow: [
            '0 0 0px rgba(59, 130, 246, 0)',
            `0 0 20px ${isSending ? 'rgba(59, 130, 246, 0.6)' : 'rgba(16, 185, 129, 0.6)'}`,
            '0 0 0px rgba(59, 130, 246, 0)'
          ]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{ zIndex: 10 }}
      >
        {isSending ? '📤 Enviando' : '📥 Recebendo'}
      </motion.div>

      {/* Linha de dados fluindo */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent"
        animate={{
          x: ['-100%', '100%']
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "linear"
        }}
      />
    </>
  );
};

/**
 * 🎯 Indicador de sincronização no card
 */
export const SyncIndicator = ({ isActive, progress = 0 }) => {
  if (!isActive) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="absolute bottom-4 left-4 right-4 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-lg p-3 shadow-lg"
      style={{ zIndex: 20 }}
    >
      <div className="flex items-center gap-2 mb-2">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"
        />
        <span className="text-xs font-semibold text-gray-800 dark:text-white">
          Sincronizando...
        </span>
        <span className="ml-auto text-xs font-bold text-blue-600">
          {Math.round(progress)}%
        </span>
      </div>
      
      {/* Mini barra de progresso */}
      <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 bg-[length:200%_100%]"
          animate={{
            backgroundPosition: ['0% 0%', '100% 0%']
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "linear"
          }}
          style={{
            width: `${progress}%`,
            transition: 'width 0.3s ease-out'
          }}
        />
      </div>
    </motion.div>
  );
};

/**
 * ⚡ Efeito de ativação do servidor
 */
export const ActivationEffect = ({ isActive }) => {
  if (!isActive) return null;

  return (
    <motion.div
      className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Flash de luz */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent"
        initial={{ x: '-100%', opacity: 0.5 }}
        animate={{ x: '100%', opacity: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />

      {/* Círculos expansivos */}
      {[0, 1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-2 border-green-500 rounded-full"
          initial={{ width: 0, height: 0, opacity: 0.8 }}
          animate={{ 
            width: 300, 
            height: 300, 
            opacity: 0 
          }}
          transition={{
            duration: 1.5,
            delay: i * 0.15,
            ease: "easeOut"
          }}
        />
      ))}

      {/* Partículas de energia */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i * 30) * (Math.PI / 180);
        const distance = 150;
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;

        return (
          <motion.div
            key={i}
            className="absolute top-1/2 left-1/2 w-2 h-2 bg-green-400 rounded-full"
            initial={{ 
              x: 0, 
              y: 0, 
              opacity: 0, 
              scale: 0 
            }}
            animate={{ 
              x, 
              y, 
              opacity: [0, 1, 0], 
              scale: [0, 1.5, 0] 
            }}
            transition={{
              duration: 1,
              delay: i * 0.05,
              ease: "easeOut"
            }}
            style={{
              boxShadow: '0 0 10px #10B981'
            }}
          />
        );
      })}
    </motion.div>
  );
};

export default {
  ServerCardPulse,
  SyncIndicator,
  ActivationEffect
};
