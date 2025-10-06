import React, { useEffect, useState, useMemo } from 'react';
import { Package, CheckCircle, Sparkles, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * BoxLoanAnimation - Animação ultra fluida a 60fps para empréstimos/devoluções
 * ✨ Responsiva para mobile e desktop
 * ✨ Partículas e efeitos visuais sofisticados
 * ✨ Contagem precisa de ferramentas
 * ✨ Duração: 1000ms (1 segundo) total - 60fps
 */
const BoxLoanAnimation = ({ 
  ferramentas = [], 
  remetenteNome,
  remetenteFoto,
  destinatarioNome, 
  destinatarioFoto, 
  tipo = 'emprestimo', // 'emprestimo' ou 'devolucao'
  onComplete 
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [toolsInBox, setToolsInBox] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [particles, setParticles] = useState([]);

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
    const newParticles = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 250,
      y: (Math.random() - 0.5) * 250,
      scale: Math.random() * 1 + 0.5,
      rotation: Math.random() * 360,
      duration: Math.random() * 0.5 + 0.3,
      delay: Math.random() * 0.08
    }));
    setParticles(newParticles);
  };

  useEffect(() => {
    if (totalTools === 0) {
      console.warn('BoxLoanAnimation: Nenhuma ferramenta para animar');
      setTimeout(() => onComplete?.(), 200);
      return;
    }

    console.log(`🎬 Iniciando animação 60fps: ${totalTools} ferramentas do tipo ${tipo}`);

    // Timing otimizado para 1 segundo total a 60fps
    const toolAnimationTime = Math.min(60, 350 / totalTools); // Máximo 60ms por item
    const boxTravelTime = 400; // 400ms para viagem
    const successTime = 250; // 250ms para celebração

    // Passo 1: Ferramentas entram na caixa (rápido e fluido)
    setCurrentStep(1);

    normalizedFerramentas.forEach((ferramenta, index) => {
      setTimeout(() => {
        setToolsInBox(prev => {
          const updated = [...prev, ferramenta];
          console.log(`📦 Ferramenta ${index + 1}/${totalTools} na caixa:`, ferramenta);
          return updated;
        });
      }, index * toolAnimationTime);
    });

    // Passo 2: Caixa viaja (suave e rápido)
    setTimeout(() => {
      console.log('🚚 Caixa começou a viajar');
      setCurrentStep(2);
    }, totalTools * toolAnimationTime);

    // Passo 3: Sucesso (explosão de partículas)
    setTimeout(() => {
      console.log('✅ Entrega concluída!');
      setCurrentStep(3);
      setShowSuccess(true);
      generateParticles();
    }, totalTools * toolAnimationTime + boxTravelTime);

    // Finaliza (exatamente 1 segundo)
    setTimeout(() => {
      console.log('🏁 Animação finalizada em 1s');
      onComplete?.();
    }, 1000); // Total fixo de 1 segundo

    return () => {
      setToolsInBox([]);
      setParticles([]);
    };
  }, [normalizedFerramentas, onComplete, totalTools, tipo]);

  // Detecta mobile
  const isMobile = window.innerWidth < 768;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-black/80 to-black/60 backdrop-blur-md p-4">
      <div className="relative w-full max-w-5xl h-[400px] md:h-[500px]">
        
        {/* Linha conectando remetente e destinatário */}
        <motion.div 
          className="absolute top-1/2 left-[10%] right-[10%] h-1 bg-gradient-to-r from-blue-400/30 via-purple-400/30 to-green-400/30 rounded-full"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />

        {/* Remetente */}
        <motion.div
          className="absolute left-0 md:left-[5%] top-1/2 -translate-y-1/2 z-10"
          initial={{ scale: 0, x: -100, opacity: 0 }}
          animate={{ scale: 1, x: 0, opacity: 1 }}
          transition={{ duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
          style={{ willChange: 'transform, opacity' }}
        >
          <div className="flex flex-col items-center gap-2 md:gap-3">
            <motion.div 
              className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-2xl ring-4 ring-white/20 backdrop-blur-sm relative overflow-hidden"
              whileHover={{ scale: 1.05 }}
              animate={{ 
                boxShadow: currentStep >= 1 ? "0 0 40px rgba(59, 130, 246, 0.6)" : "0 20px 40px rgba(0,0,0,0.3)"
              }}
            >
              {remetenteFoto ? (
                <img src={remetenteFoto} alt={remetenteNome} className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="text-white text-xl md:text-3xl font-bold">{remetenteNome?.charAt(0) || 'R'}</span>
              )}
              {/* Pulse effect */}
              <motion.div
                className="absolute inset-0 rounded-full bg-white"
                initial={{ opacity: 0.5, scale: 1 }}
                animate={{ opacity: 0, scale: 1.5 }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </motion.div>
            <div className="text-center">
              <p className="font-bold text-white text-sm md:text-lg truncate max-w-[100px] md:max-w-[150px]">
                {remetenteNome || 'Remetente'}
              </p>
              <p className="text-xs md:text-sm text-gray-300">
                {tipo === 'emprestimo' ? '📤 Enviando' : '↩️ Devolvendo'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Destinatário */}
        <motion.div
          className="absolute right-0 md:right-[5%] top-1/2 -translate-y-1/2 z-10"
          initial={{ scale: 0, x: 100, opacity: 0 }}
          animate={{ scale: 1, x: 0, opacity: 1 }}
          transition={{ duration: 0.35, ease: [0.34, 1.56, 0.64, 1], delay: 0.08 }}
          style={{ willChange: 'transform, opacity' }}
        >
          <div className="flex flex-col items-center gap-2 md:gap-3">
            <motion.div 
              className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-2xl ring-4 ring-white/20 backdrop-blur-sm relative overflow-hidden"
              whileHover={{ scale: 1.05 }}
              animate={{ 
                boxShadow: currentStep === 3 ? "0 0 40px rgba(34, 197, 94, 0.6)" : "0 20px 40px rgba(0,0,0,0.3)"
              }}
            >
              {destinatarioFoto ? (
                <img src={destinatarioFoto} alt={destinatarioNome} className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="text-white text-xl md:text-3xl font-bold">{destinatarioNome?.charAt(0) || 'D'}</span>
              )}
              {/* Pulse effect on success */}
              {currentStep === 3 && (
                <motion.div
                  className="absolute inset-0 rounded-full bg-white"
                  initial={{ opacity: 0.5, scale: 1 }}
                  animate={{ opacity: 0, scale: 1.5 }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              )}
            </motion.div>
            <div className="text-center">
              <p className="font-bold text-white text-sm md:text-lg truncate max-w-[100px] md:max-w-[150px]">
                {destinatarioNome || 'Destinatário'}
              </p>
              <p className="text-xs md:text-sm text-gray-300">
                {tipo === 'emprestimo' ? '📥 Recebendo' : '✅ Almoxarifado'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Centro - Caixa e ferramentas */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          
          {/* Ferramentas flutuando antes de entrar */}
          <AnimatePresence>
            {currentStep === 1 && normalizedFerramentas.map((ferramenta, index) => {
              const isInBox = toolsInBox.includes(ferramenta);
              if (isInBox) return null;

              return (
                <motion.div
                  key={`tool-${index}-${ferramenta}`}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                  initial={{ x: -150, y: -30, scale: 0.3, opacity: 0, rotate: -45 }}
                  animate={{ x: 0, y: 0, scale: 1, opacity: 1, rotate: 0 }}
                  exit={{ scale: 0, y: 20, opacity: 0, rotate: 180 }}
                  transition={{ 
                    duration: 0.15,
                    ease: [0.25, 0.46, 0.45, 0.94] // Easing otimizado para 60fps
                  }}
                  style={{ zIndex: 20 + index, willChange: 'transform, opacity' }}
                >
                  <motion.div 
                    className="bg-gradient-to-br from-orange-500 to-red-600 text-white p-2 md:p-3 rounded-xl shadow-2xl relative"
                    animate={{ 
                      rotate: [0, 3, -3, 0],
                      y: [0, -3, 0]
                    }}
                    transition={{ 
                      duration: 0.8,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    style={{ willChange: 'transform' }}
                  >
                    <Package className="w-5 h-5 md:w-6 md:h-6" />
                    {/* Sparkle effect */}
                    <motion.div
                      className="absolute -top-1 -right-1"
                      animate={{ 
                        scale: [1, 1.2, 1],
                        opacity: [0.8, 1, 0.8]
                      }}
                      transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-yellow-300" />
                    </motion.div>
                  </motion.div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Caixa */}
          <motion.div
            className="relative"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{
              scale: currentStep >= 1 ? 1 : 0.8,
              opacity: currentStep >= 1 ? 1 : 0,
              x: currentStep === 2 ? (isMobile ? 150 : 250) : currentStep === 3 ? (isMobile ? 150 : 250) : 0,
              y: currentStep === 2 ? -10 : 0,
              rotate: currentStep === 2 ? 5 : 0
            }}
            transition={{
              scale: { duration: 0.2, ease: [0.34, 1.56, 0.64, 1] },
              opacity: { duration: 0.15 },
              x: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }, // Cubic-bezier otimizado
              y: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
              rotate: { duration: 0.4, ease: "easeOut" }
            }}
            style={{ willChange: 'transform, opacity' }}
          >
            {/* Sombra dinâmica */}
            <motion.div
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-24 md:w-32 h-3 md:h-4 bg-black rounded-full blur-lg"
              animate={{
                scale: currentStep === 2 ? 0.7 : 1,
                opacity: currentStep === 2 ? 0.1 : 0.25,
                x: currentStep === 2 ? 30 : 0
              }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              style={{ willChange: 'transform, opacity' }}
            />

            {/* Caixa 3D */}
            <div className="relative w-24 h-24 md:w-32 md:h-32">
              {/* Tampa */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 rounded-t-2xl border-2 md:border-4 border-amber-900 shadow-2xl"
                animate={{
                  rotateX: toolsInBox.length === totalTools ? 0 : -60,
                  y: toolsInBox.length === totalTools ? 0 : -25,
                  z: toolsInBox.length === totalTools ? 0 : 20
                }}
                transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                style={{
                  transformOrigin: 'bottom',
                  transformStyle: 'preserve-3d',
                  backfaceVisibility: 'hidden',
                  willChange: 'transform'
                }}
              >
                {/* Detalhe da tampa */}
                <div className="absolute inset-2 border-2 border-amber-400/30 rounded-t-xl" />
              </motion.div>

              {/* Corpo da caixa */}
              <div className="absolute inset-0 bg-gradient-to-br from-amber-600 via-amber-700 to-amber-800 rounded-2xl border-2 md:border-4 border-amber-900 shadow-2xl flex items-center justify-center overflow-hidden">
                {/* Textura */}
                <div className="absolute inset-0 opacity-10" style={{
                  backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,.1) 10px, rgba(255,255,255,.1) 20px)'
                }} />

                {/* Contador */}
                <motion.div
                  className="relative bg-white dark:bg-gray-900 rounded-full w-12 h-12 md:w-16 md:h-16 flex items-center justify-center shadow-xl z-10 ring-2 ring-amber-300"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.15, duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
                  style={{ willChange: 'transform' }}
                >
                  <motion.span
                    className="text-lg md:text-2xl font-bold bg-gradient-to-br from-amber-600 to-amber-800 bg-clip-text text-transparent"
                    key={`${toolsInBox.length}-${totalTools}`}
                    initial={{ scale: 1.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.12, ease: "easeOut" }}
                  >
                    {toolsInBox.length}/{totalTools}
                  </motion.span>
                </motion.div>

                {/* Etiqueta */}
                <motion.div 
                  className="absolute bottom-1 md:bottom-2 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-900 px-2 md:px-3 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs font-bold text-amber-700 shadow-lg ring-1 ring-amber-200"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.25, ease: "easeOut" }}
                  style={{ willChange: 'transform, opacity' }}
                >
                  {tipo === 'emprestimo' ? '📦 Empréstimo' : '↩️ Devolução'}
                </motion.div>

                {/* Brilho */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent"
                  animate={{
                    x: [-100, 100],
                  }}
                  transition={{
                    duration: 1.8,
                    repeat: Infinity,
                    repeatDelay: 0.8,
                    ease: "linear"
                  }}
                  style={{ willChange: 'transform' }}
                />
              </div>
            </div>

            {/* Seta de movimento */}
            {currentStep === 2 && (
              <motion.div
                className="absolute left-full ml-2 md:ml-4 top-1/2 -translate-y-1/2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: [0, 1, 0], x: [0, 20, 40] }}
                transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut" }}
                style={{ willChange: 'transform, opacity' }}
              >
                <ArrowRight className="w-6 h-6 md:w-8 md:h-8 text-purple-400" />
              </motion.div>
            )}
          </motion.div>

          {/* Sucesso com partículas */}
          <AnimatePresence>
            {showSuccess && (
              <>
                <motion.div
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30"
                  initial={{ scale: 0, rotate: -180, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
                  style={{ willChange: 'transform, opacity' }}
                >
                  <motion.div 
                    className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-full p-4 md:p-6 shadow-2xl ring-4 ring-white/30"
                    animate={{
                      boxShadow: [
                        "0 0 0 0 rgba(34, 197, 94, 0.7)",
                        "0 0 0 20px rgba(34, 197, 94, 0)",
                        "0 0 0 0 rgba(34, 197, 94, 0)"
                      ]
                    }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: "easeOut" }}
                  >
                    <CheckCircle className="w-8 h-8 md:w-12 md:h-12 text-white" />
                  </motion.div>
                </motion.div>

                {/* Partículas */}
                {particles.map((particle) => (
                  <motion.div
                    key={particle.id}
                    className="absolute left-1/2 top-1/2 w-2 h-2 md:w-3 md:h-3 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500"
                    initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                    animate={{
                      scale: [particle.scale, particle.scale * 0.5, 0],
                      x: particle.x,
                      y: particle.y,
                      opacity: [1, 0.8, 0],
                      rotate: particle.rotation
                    }}
                    transition={{
                      duration: particle.duration,
                      delay: particle.delay,
                      ease: [0.25, 0.46, 0.45, 0.94]
                    }}
                    style={{ willChange: 'transform, opacity' }}
                  />
                ))}
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Informação adicional */}
        <motion.div
          className="absolute bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3, ease: "easeOut" }}
          style={{ willChange: 'transform, opacity' }}
        >
          <div className="bg-white/10 backdrop-blur-md px-4 md:px-6 py-2 md:py-3 rounded-full shadow-xl border border-white/20">
            <p className="text-white text-xs md:text-sm font-medium">
              {currentStep === 1 && `Preparando ${totalTools} ${totalTools === 1 ? 'ferramenta' : 'ferramentas'}...`}
              {currentStep === 2 && 'Enviando...'}
              {currentStep === 3 && '✅ Concluído!'}
            </p>
          </div>
        </motion.div>

        {/* Progresso */}
        <motion.div
          className="absolute top-4 md:top-8 left-1/2 -translate-x-1/2 w-48 md:w-64"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.25, ease: "easeOut" }}
          style={{ willChange: 'transform, opacity' }}
        >
          <div className="bg-white/10 backdrop-blur-sm rounded-full h-2 md:h-3 overflow-hidden border border-white/20">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 rounded-full"
              initial={{ width: 0 }}
              animate={{
                width: currentStep === 1 
                  ? `${(toolsInBox.length / totalTools) * 100}%`
                  : currentStep === 2 
                    ? '100%'
                    : '100%'
              }}
              transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
              style={{ willChange: 'width' }}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default React.memo(BoxLoanAnimation);
