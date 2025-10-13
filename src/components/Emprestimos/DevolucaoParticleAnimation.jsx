import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

/**
 * 🎨 Animação Minimalista de Devolução com Partículas
 * Duração fixa: 700ms
 * Efeito: Card evapora em partículas subindo
 */
const DevolucaoParticleAnimation = ({ 
  emprestimo,
  ferramentasDevolvidas = [],
  cardElement = null,
  onComplete 
}) => {
  const [particles, setParticles] = useState([]);
  const [cardData, setCardData] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    // Captura posição do card original se fornecido
    if (cardElement) {
      const rect = cardElement.getBoundingClientRect();
      setCardData({
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height
      });
    }

    // Gera 40 partículas para o efeito de evaporação
    const generatedParticles = Array.from({ length: 40 }, (_, i) => {
      // Distribui partículas em forma de grid para cobrir todo o card
      const gridX = (i % 8) * 12.5; // 8 colunas
      const gridY = Math.floor(i / 8) * 20; // 5 linhas
      
      return {
        id: i,
        startX: gridX + (Math.random() * 10 - 5),
        startY: gridY + (Math.random() * 10 - 5),
        endX: gridX + (Math.random() * 200 - 100),
        endY: gridY - (Math.random() * 400 + 200), // Sempre para cima
        size: Math.random() * 6 + 3,
        delay: Math.random() * 150,
        opacity: Math.random() * 0.4 + 0.6,
        rotation: Math.random() * 360
      };
    });
    
    setParticles(generatedParticles);

    // Completa em exatamente 700ms
    const completeTimeout = setTimeout(() => {
      if (onComplete) onComplete();
    }, 700);

    return () => {
      clearTimeout(completeTimeout);
    };
  }, [cardElement, onComplete]);

  // Pega os dados do empréstimo
  const funcionarioNome = emprestimo?.funcionarioNome || emprestimo?.funcionario?.nome || 'Funcionário';
  const funcionarioFoto = emprestimo?.funcionarioFoto || emprestimo?.funcionario?.foto || null;
  const totalFerramentas = ferramentasDevolvidas.length || emprestimo?.ferramentas?.length || 0;

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-[100] pointer-events-none"
      style={{ 
        perspective: '1000px',
        transformStyle: 'preserve-3d'
      }}
    >
      {/* Card sendo desintegrado */}
      <AnimatePresence>
        <motion.div
          className="absolute"
          style={{
            left: cardData?.x || '50%',
            top: cardData?.y || '50%',
            width: cardData?.width || 350,
            height: cardData?.height || 200,
            transformOrigin: 'center center'
          }}
          initial={{
            opacity: 1,
            scale: 1
          }}
          animate={{
            opacity: 0,
            scale: 0.95
          }}
          transition={{
            duration: 0.3,
            ease: [0.4, 0, 0.6, 1]
          }}
        >
          <div className="w-full h-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 border-2 border-green-500">
            {/* Avatar do funcionário */}
            <div className="flex items-center gap-4 mb-4">
              <div className="relative">
                {funcionarioFoto ? (
                  <img 
                    src={funcionarioFoto} 
                    alt={funcionarioNome}
                    className="w-16 h-16 rounded-full object-cover border-2 border-green-500"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-white text-xl font-bold">
                    {funcionarioNome.charAt(0)}
                  </div>
                )}
                <motion.div
                  className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.4, repeat: 1 }}
                >
                  <CheckCircle className="w-4 h-4 text-white" />
                </motion.div>
              </div>
              
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                  Devolução Confirmada
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {funcionarioNome}
                </p>
              </div>
            </div>

            {/* Info */}
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {totalFerramentas} {totalFerramentas === 1 ? 'ferramenta devolvida' : 'ferramentas devolvidas'}
              </p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Partículas evaporando para cima */}
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full bg-green-500"
            style={{
              width: particle.size,
              height: particle.size,
              left: cardData ? cardData.x + (cardData.width * particle.startX / 100) : `${particle.startX}%`,
              top: cardData ? cardData.y + (cardData.height * particle.startY / 100) : `${particle.startY}%`,
              boxShadow: '0 0 10px rgba(34, 197, 94, 0.8)',
              opacity: particle.opacity
            }}
            initial={{
              scale: 1,
              opacity: particle.opacity,
              rotate: 0
            }}
            animate={{
              x: particle.endX,
              y: particle.endY,
              scale: [1, 1.2, 0],
              opacity: [particle.opacity, particle.opacity * 0.7, 0],
              rotate: particle.rotation
            }}
            transition={{
              duration: 0.7,
              delay: particle.delay / 1000,
              ease: [0.4, 0, 0.2, 1]
            }}
          />
        ))}
      </AnimatePresence>

      {/* Rastros de luz verde */}
      {particles.slice(0, 8).map((particle) => (
        <motion.div
          key={`trail-${particle.id}`}
          className="absolute w-1 rounded-full bg-gradient-to-t from-green-500 to-transparent"
          style={{
            left: cardData ? cardData.x + (cardData.width * particle.startX / 100) : `${particle.startX}%`,
            top: cardData ? cardData.y + (cardData.height * particle.startY / 100) : `${particle.startY}%`,
            height: 60,
            opacity: 0.4
          }}
          initial={{
            scaleY: 0,
            opacity: 0
          }}
          animate={{
            scaleY: [0, 1, 0],
            opacity: [0, 0.6, 0],
            y: particle.endY / 2
          }}
          transition={{
            duration: 0.7,
            delay: particle.delay / 1000,
            ease: "easeOut"
          }}
        />
      ))}

      {/* Ícone de confirmação no centro */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        initial={{ scale: 0, opacity: 0, rotate: -180 }}
        animate={{ scale: [0, 1.5, 1], opacity: [0, 1, 1], rotate: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className="w-20 h-20 rounded-full bg-green-500 shadow-2xl flex items-center justify-center">
          <CheckCircle className="w-12 h-12 text-white" strokeWidth={2.5} />
        </div>
      </motion.div>

      {/* Ondas de confirmação */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={`wave-${i}`}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-green-500"
          initial={{ width: 80, height: 80, opacity: 0.8 }}
          animate={{ 
            width: 200 + i * 50, 
            height: 200 + i * 50, 
            opacity: 0 
          }}
          transition={{ 
            duration: 0.7, 
            delay: i * 0.1,
            ease: "easeOut"
          }}
        />
      ))}

      {/* Brilho verde no fundo */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-green-500/20 blur-3xl"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 2, opacity: 0.4 }}
        transition={{ duration: 0.7 }}
      />
    </div>
  );
};

export default DevolucaoParticleAnimation;
