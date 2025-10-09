import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wrench, Sparkles } from 'lucide-react';

/**
 * FerramentaFlyingAnimation - Animação de ferramenta voando do seletor para a lista
 * ✨ Efeito de partículas e trilha brilhante
 * ✨ Movimento suave e fluido
 * ✨ Duração: 800ms
 */
const FerramentaFlyingAnimation = ({ ferramenta, onComplete }) => {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    // Gera partículas ao longo da trajetória
    const particleInterval = setInterval(() => {
      const newParticles = Array.from({ length: 3 }, (_, i) => ({
        id: Date.now() + i,
        x: (Math.random() - 0.5) * 40,
        y: (Math.random() - 0.5) * 40,
        scale: Math.random() * 0.5 + 0.3,
        rotation: Math.random() * 360,
        duration: Math.random() * 0.3 + 0.2
      }));
      setParticles(prev => [...prev, ...newParticles]);
    }, 100);

    // ⚡ Timer FORÇADO para finalizar animação em 800ms
    const completeTimer = setTimeout(() => {
      clearInterval(particleInterval);
      if (onComplete) {
        onComplete();
      }
    }, 800);

    return () => {
      clearInterval(particleInterval);
      clearTimeout(completeTimer);
    };
  }, []); // ⚡ Sem dependências - executa apenas uma vez

  return (
    <div className="fixed inset-0 z-40 pointer-events-none">
      <AnimatePresence mode="wait">
        {/* Ícone da ferramenta voando */}
        <motion.div
          key="flying-tool"
          initial={{ 
            x: 'calc(50vw - 100px)', 
            y: 'calc(30vh)', 
            scale: 0.8,
            opacity: 0,
            rotate: -20
          }}
          animate={{ 
            x: 'calc(50vw + 100px)', 
            y: 'calc(60vh)', 
            scale: 1.2,
            opacity: [0, 1, 1, 0],
            rotate: [0, 5, -5, 0]
          }}
          exit={{ 
            scale: 0.5, 
            opacity: 0 
          }}
          transition={{
            duration: 0.8,
            ease: [0.34, 1.56, 0.64, 1],
            opacity: {
              times: [0, 0.2, 0.8, 1],
              duration: 0.8
            },
            rotate: {
              duration: 0.8,
              repeat: 0,
              ease: "easeInOut"
            }
          }}
          className="absolute"
        >
              {/* Glow effect */}
              <div className="absolute inset-0 blur-xl bg-blue-400/30 rounded-full scale-150" />
              
              {/* Ícone principal */}
              <div className="relative bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl shadow-2xl border-4 border-blue-300">
                <Wrench className="w-12 h-12 text-white" />
              </div>

          {/* Brilho ao redor */}
          <motion.div
            className="absolute -inset-2 bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 rounded-2xl blur-md"
            animate={{
              opacity: [0.3, 0.6, 0.3],
              scale: [1, 1.1, 1]
            }}
            transition={{
              duration: 0.4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </motion.div>

        {/* Trilha de brilho */}
        <motion.div
          key="trail"
              initial={{ 
                pathLength: 0,
                opacity: 0 
              }}
              animate={{ 
                pathLength: 1,
                opacity: [0, 0.6, 0] 
              }}
              transition={{
                duration: 0.8,
                ease: "easeInOut",
                opacity: {
                  times: [0, 0.3, 1],
                  duration: 0.8
                }
              }}
              className="absolute"
              style={{
                left: 'calc(50vw - 100px)',
                top: 'calc(30vh)',
                width: '200px',
                height: 'calc(30vh)'
              }}
            >
              <svg 
                width="200" 
                height="100%" 
                className="absolute"
                style={{ overflow: 'visible' }}
              >
                <defs>
                  <linearGradient id="trailGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.8" />
                    <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <motion.path
                  d="M 100 0 Q 120 150, 200 300"
                  stroke="url(#trailGradient)"
                  strokeWidth="4"
                  fill="none"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.8, ease: "easeInOut" }}
                />
            </svg>
        </motion.div>

        {/* Partículas ao longo do caminho */}
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            initial={{ 
              x: 'calc(50vw - 50px + ' + particle.x + 'px)', 
              y: 'calc(45vh + ' + particle.y + 'px)',
              scale: particle.scale,
              opacity: 1,
              rotate: particle.rotation
            }}
            animate={{ 
              y: 'calc(45vh + ' + (particle.y + 60) + 'px)',
              opacity: 0,
              scale: 0
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: particle.duration,
              ease: "easeOut"
            }}
            className="absolute"
          >
            <Sparkles className="w-4 h-4 text-blue-400" />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default FerramentaFlyingAnimation;
