import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Package, CheckCircle, Sparkles, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * BoxLoanAnimation - Animação fluida e sofisticada para empréstimos/devoluções
 * ✨ Movimento direto e suave de cima para baixo
 * ✨ Responsiva para mobile e desktop
 * ✨ Sem erros ou travamentos
 * ✨ Duração: 1400ms (empréstimo) | 800ms (devolução)
 * ✨ Garantia de conclusão em 800ms independente de rede/quantidade
 */
const BoxLoanAnimation = ({ 
  ferramentas = [], 
  remetenteNome,
  remetenteFoto,
  destinatarioNome, 
  destinatarioFoto, 
  tipo = 'emprestimo',
  onComplete 
}) => {
  const [showSuccess, setShowSuccess] = useState(false);
  const [particles, setParticles] = useState([]);
  const hasCompletedRef = useRef(false);
  const forceCompleteTimerRef = useRef(null);

  // Normaliza ferramentas para sempre trabalhar com array de strings
  const normalizedFerramentas = useMemo(() => {
    if (!ferramentas || !Array.isArray(ferramentas)) return [];
    
    return ferramentas.map(f => {
      if (typeof f === 'string') return f;
      if (typeof f === 'object' && f !== null) {
        return f.nome || f.descricao || f.ferramenta || 'Ferramenta';
      }
      return 'Ferramenta';
    });
  }, [ferramentas]);

  const totalTools = normalizedFerramentas.length;

  // Gera partículas ao completar
  const generateParticles = () => {
    const newParticles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 200,
      y: (Math.random() - 0.5) * 200,
      scale: Math.random() * 1 + 0.5,
      rotation: Math.random() * 360,
      duration: Math.random() * 0.6 + 0.4,
      delay: Math.random() * 0.1
    }));
    setParticles(newParticles);
  };

  useEffect(() => {
    // Reset flag de conclusão
    hasCompletedRef.current = false;
    
    if (totalTools === 0) {
      if (onComplete && !hasCompletedRef.current) {
        hasCompletedRef.current = true;
        const timer = setTimeout(() => onComplete(), 200);
        return () => clearTimeout(timer);
      }
      return;
    }

    // Durações fixas - INDEPENDENTE da quantidade de ferramentas
    const successDelay = tipo === 'devolucao' ? 500 : 1000;
    const completeDelay = tipo === 'devolucao' ? 800 : 1400;
    // Timer para mostrar sucesso
    const successTimer = setTimeout(() => {
      setShowSuccess(true);
      generateParticles();
    }, successDelay);

    // ⚡ TIMER FORÇADO - Garante conclusão SEMPRE em 800ms (devolução) ou 1400ms (empréstimo)
    // Mesmo com internet instável ou problemas no backend
    forceCompleteTimerRef.current = setTimeout(() => {
      if (!hasCompletedRef.current) {
        hasCompletedRef.current = true;
        
        if (onComplete) {
          try {
            onComplete();
          } catch (error) {
            console.error('❌ Erro em onComplete (ignorado - animação fecha mesmo assim):', error);
            // Animação fecha independentemente de erros no callback
          }
        }
      }
    }, completeDelay);

    return () => {
      clearTimeout(successTimer);
      if (forceCompleteTimerRef.current) {
        clearTimeout(forceCompleteTimerRef.current);
      }
      setShowSuccess(false);
      setParticles([]);
    };
  }, [tipo]); // ⚡ Removido normalizedFerramentas e totalTools das dependências

  // Detecta mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-black/85 to-black/70 backdrop-blur-lg p-4">
      <div className="relative w-full max-w-4xl h-[500px] md:h-[600px]">
        
        {/* Linha vertical conectando origem e destino */}
        <motion.div 
          className="absolute left-1/2 -translate-x-1/2 top-[15%] bottom-[15%] w-1 bg-gradient-to-b from-blue-400/40 via-purple-400/40 to-green-400/40 rounded-full"
          initial={{ scaleY: 0, opacity: 0 }}
          animate={{ scaleY: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />

        {/* Remetente (Topo) */}
        <motion.div
          className="absolute left-1/2 -translate-x-1/2 top-[5%] z-10"
          initial={{ scale: 0, y: -50, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
        >
          <div className="flex flex-col items-center gap-2 md:gap-3">
            <motion.div 
              className="w-20 h-20 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-2xl ring-4 ring-white/20 relative overflow-hidden"
              animate={{ 
                boxShadow: "0 0 30px rgba(59, 130, 246, 0.5)"
              }}
            >
              {remetenteFoto ? (
                <img 
                  src={remetenteFoto} 
                  alt={remetenteNome} 
                  className="w-full h-full rounded-full object-cover"
                  loading="eager"
                  onError={(e) => {
                    e.target.onerror = null;
                    const span = document.createElement('span');
                    span.className = "text-white text-2xl md:text-3xl font-bold";
                    span.textContent = remetenteNome?.charAt(0) || 'R';
                    e.target.parentElement.replaceChild(span, e.target);
                  }}
                />
              ) : (
                <span className="text-white text-2xl md:text-3xl font-bold">{remetenteNome?.charAt(0) || 'R'}</span>
              )}
              {/* Pulse effect */}
              <motion.div
                className="absolute inset-0 rounded-full bg-white/20"
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0, 0.3]
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.div>
            <div className="text-center">
              <p className="font-bold text-white text-base md:text-xl truncate max-w-[120px] md:max-w-[180px]">
                {remetenteNome || 'Remetente'}
              </p>
              <p className="text-xs md:text-sm text-blue-200 font-medium">
                {tipo === 'emprestimo' ? '📤 Enviando' : '↩️ Devolvendo'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Destinatário (Fundo) */}
        <motion.div
          className="absolute left-1/2 -translate-x-1/2 bottom-[5%] z-10"
          initial={{ scale: 0, y: 50, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1], delay: 0.1 }}
        >
          <div className="flex flex-col items-center gap-2 md:gap-3">
            <motion.div 
              className="w-20 h-20 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-2xl ring-4 ring-white/20 relative overflow-hidden"
              animate={{ 
                boxShadow: showSuccess ? "0 0 40px rgba(34, 197, 94, 0.7)" : "0 0 20px rgba(34, 197, 94, 0.3)"
              }}
            >
              {destinatarioFoto ? (
                <img 
                  src={destinatarioFoto} 
                  alt={destinatarioNome} 
                  className="w-full h-full rounded-full object-cover"
                  loading="eager"
                  onError={(e) => {
                    e.target.onerror = null;
                    const span = document.createElement('span');
                    span.className = "text-white text-2xl md:text-3xl font-bold";
                    span.textContent = destinatarioNome?.charAt(0) || 'D';
                    e.target.parentElement.replaceChild(span, e.target);
                  }}
                />
              ) : (
                <span className="text-white text-2xl md:text-3xl font-bold">{destinatarioNome?.charAt(0) || 'D'}</span>
              )}
              {/* Pulse effect on success */}
              {showSuccess && (
                <motion.div
                  className="absolute inset-0 rounded-full bg-white/30"
                  animate={{ 
                    scale: [1, 1.3, 1],
                    opacity: [0.5, 0, 0.5]
                  }}
                  transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                />
              )}
            </motion.div>
            <div className="text-center">
              <p className="font-bold text-white text-base md:text-xl truncate max-w-[120px] md:max-w-[180px]">
                {destinatarioNome || 'Destinatário'}
              </p>
              <p className="text-xs md:text-sm text-green-200 font-medium">
                {tipo === 'emprestimo' ? '📥 Recebendo' : '🏭 Almoxarifado'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Centro - Caixa viajando de cima para baixo */}
        <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 flex items-center justify-center">
          
          {/* Caixa com animação única e fluida */}
          <motion.div
            className="relative"
            initial={{ y: "-200%", scale: 0.8, opacity: 0, rotate: -10 }}
            animate={{
              y: showSuccess ? "200%" : "0%",
              scale: showSuccess ? 0.9 : 1,
              opacity: showSuccess ? 0 : 1,
              rotate: showSuccess ? 10 : 0
            }}
            transition={{
              duration: tipo === 'devolucao' ? 0.6 : 1,
              ease: [0.22, 1, 0.36, 1], // Easing suave e natural
              y: { type: "spring", stiffness: tipo === 'devolucao' ? 80 : 50, damping: tipo === 'devolucao' ? 15 : 20 }
            }}
          >
            {/* Caixa 3D Simplificada */}
            <div className="relative w-28 h-28 md:w-36 md:h-36">
              {/* Tampa (sempre fechada para simplificar) */}
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 rounded-t-2xl border-3 md:border-4 border-amber-900 shadow-2xl">
                {/* Detalhe da tampa */}
                <div className="absolute inset-3 border-2 border-amber-400/30 rounded-t-xl" />
              </div>

              {/* Corpo da caixa */}
              <div className="absolute inset-0 bg-gradient-to-br from-amber-600 via-amber-700 to-amber-800 rounded-2xl border-3 md:border-4 border-amber-900 shadow-2xl flex items-center justify-center overflow-hidden">
                {/* Textura */}
                <div className="absolute inset-0 opacity-10" style={{
                  backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,.1) 10px, rgba(255,255,255,.1) 20px)'
                }} />

                {/* Contador de ferramentas */}
                <div className="relative bg-white dark:bg-gray-900 rounded-full w-14 h-14 md:w-20 md:h-20 flex items-center justify-center shadow-xl z-10 ring-3 ring-amber-300">
                  <span className="text-xl md:text-3xl font-bold bg-gradient-to-br from-amber-600 to-amber-800 bg-clip-text text-transparent">
                    {totalTools}
                  </span>
                </div>

                {/* Etiqueta */}
                <div className="absolute bottom-2 md:bottom-3 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-900 px-3 md:px-4 py-1 md:py-1.5 rounded-full text-xs md:text-sm font-bold text-amber-700 shadow-lg ring-2 ring-amber-200">
                  {tipo === 'emprestimo' ? '📦 Empréstimo' : '↩️ Devolução'}
                </div>

                {/* Brilho animado */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/25 to-transparent"
                  animate={{
                    x: [-150, 150],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                />
              </div>
            </div>
          </motion.div>

          {/* Ícone de sucesso quando a caixa chega */}
          <AnimatePresence>
            {showSuccess && (
              <motion.div
                className="absolute left-1/2 top-[85%] -translate-x-1/2 -translate-y-1/2 z-30"
                initial={{ scale: 0, rotate: -180, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
              >
                <motion.div 
                  className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-full p-5 md:p-7 shadow-2xl ring-4 ring-white/40"
                  animate={{
                    boxShadow: [
                      "0 0 0 0 rgba(34, 197, 94, 0.7)",
                      "0 0 0 25px rgba(34, 197, 94, 0)",
                      "0 0 0 0 rgba(34, 197, 94, 0)"
                    ]
                  }}
                  transition={{ duration: 1, repeat: Infinity, ease: "easeOut" }}
                >
                  <CheckCircle className="w-10 h-10 md:w-14 md:h-14 text-white" />
                </motion.div>

                {/* Partículas de celebração */}
                {particles.map((particle) => (
                  <motion.div
                    key={particle.id}
                    className="absolute left-1/2 top-1/2 w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-gradient-to-br from-yellow-400 via-orange-500 to-pink-500"
                    initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                    animate={{
                      scale: [particle.scale, particle.scale * 0.3, 0],
                      x: particle.x,
                      y: particle.y,
                      opacity: [1, 0.7, 0],
                      rotate: particle.rotation
                    }}
                    transition={{
                      duration: particle.duration,
                      delay: particle.delay,
                      ease: [0.25, 0.46, 0.45, 0.94]
                    }}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Informação de quantidade */}
        <motion.div
          className="absolute bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4, ease: "easeOut" }}
        >
          <div className="bg-white/15 backdrop-blur-md px-5 md:px-7 py-2.5 md:py-3.5 rounded-2xl shadow-2xl border border-white/30">
            <p className="text-white text-sm md:text-base font-bold">
              {showSuccess ? '✅ Entrega concluída!' : `📦 ${totalTools} ${totalTools === 1 ? 'ferramenta' : 'ferramentas'}`}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default React.memo(BoxLoanAnimation);
