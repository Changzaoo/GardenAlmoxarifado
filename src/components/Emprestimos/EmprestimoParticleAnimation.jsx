import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package } from 'lucide-react';

/**
 * 🎨 Animação Minimalista de Empréstimo com Partículas
 * Duração fixa: 700ms
 * Efeito: Partículas se formam e voam para o card de empréstimo
 */
const EmprestimoParticleAnimation = ({ 
  ferramentas = [], 
  funcionarioNome = '',
  funcionarioFoto = null,
  onComplete 
}) => {
  const [particles, setParticles] = useState([]);
  const [showCard, setShowCard] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    // Gera 30 partículas aleatórias
    const generatedParticles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      startX: Math.random() * 100,
      startY: Math.random() * 100,
      size: Math.random() * 4 + 2,
      delay: Math.random() * 200,
      opacity: Math.random() * 0.5 + 0.5
    }));
    
    setParticles(generatedParticles);

    // Timeline de 700ms
    const timeline = setTimeout(() => {
      setShowCard(true);
    }, 400);

    // Completa em exatamente 700ms
    const completeTimeout = setTimeout(() => {
      if (onComplete) onComplete();
    }, 700);

    return () => {
      clearTimeout(timeline);
      clearTimeout(completeTimeout);
    };
  }, [onComplete]);

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-[100] pointer-events-none"
      style={{ 
        perspective: '1000px',
        transformStyle: 'preserve-3d'
      }}
    >
      {/* Partículas voando */}
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full bg-blue-500"
            style={{
              width: particle.size,
              height: particle.size,
              left: `${particle.startX}%`,
              top: `${particle.startY}%`,
              boxShadow: '0 0 8px rgba(59, 130, 246, 0.8)',
              opacity: particle.opacity
            }}
            initial={{
              scale: 0,
              opacity: 0
            }}
            animate={{
              x: [0, (50 - particle.startX) * 10, (50 - particle.startX) * 20],
              y: [0, (50 - particle.startY) * 8, (50 - particle.startY) * 15],
              scale: [0, 1, 0.3],
              opacity: [0, particle.opacity, 0]
            }}
            transition={{
              duration: 0.7,
              delay: particle.delay / 1000,
              ease: [0.4, 0, 0.2, 1]
            }}
          />
        ))}
      </AnimatePresence>

      {/* Card surgindo no centro */}
      <AnimatePresence>
        {showCard && (
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            initial={{
              scale: 0,
              opacity: 0,
              rotateY: -180
            }}
            animate={{
              scale: 1,
              opacity: 1,
              rotateY: 0
            }}
            transition={{
              duration: 0.3,
              ease: [0.4, 0, 0.2, 1]
            }}
          >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 min-w-[300px] border-2 border-blue-500">
              {/* Avatar do funcionário */}
              <div className="flex items-center gap-4 mb-4">
                <div className="relative">
                  {funcionarioFoto ? (
                    <img 
                      src={funcionarioFoto} 
                      alt={funcionarioNome}
                      className="w-16 h-16 rounded-full object-cover border-2 border-blue-500"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xl font-bold">
                      {funcionarioNome.charAt(0)}
                    </div>
                  )}
                  <motion.div
                    className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Package className="w-4 h-4 text-white" />
                  </motion.div>
                </div>
                
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                    Empréstimo Criado
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {funcionarioNome}
                  </p>
                </div>
              </div>

              {/* Ferramentas */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  {ferramentas.length} {ferramentas.length === 1 ? 'Ferramenta' : 'Ferramentas'}
                </p>
                <div className="flex flex-wrap gap-2">
                  {ferramentas.slice(0, 3).map((ferramenta, index) => (
                    <motion.div
                      key={index}
                      className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium"
                      initial={{ scale: 0, x: -20 }}
                      animate={{ scale: 1, x: 0 }}
                      transition={{ delay: 0.1 + index * 0.05 }}
                    >
                      {ferramenta.nome} ({ferramenta.quantidade})
                    </motion.div>
                  ))}
                  {ferramentas.length > 3 && (
                    <motion.div
                      className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs font-medium"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.25 }}
                    >
                      +{ferramentas.length - 3} mais
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Brilho no fundo */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-blue-500/20 blur-3xl"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 2, opacity: 0.3 }}
        transition={{ duration: 0.7 }}
      />
    </div>
  );
};

export default EmprestimoParticleAnimation;
