import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Package, TrendingUp, Sparkles, CheckCheck } from 'lucide-react';

/**
 * Animação de Devolução em Massa
 * Mostra uma celebração visual quando todos os empréstimos são devolvidos
 */
const DevolucaoMassaAnimation = ({ 
  isOpen, 
  onClose, 
  funcionario,
  totalDevolvido,
  totalFerramentas,
  duracao = 3000 
}) => {
  const [fase, setFase] = useState('inicial'); // inicial, processando, sucesso, finalizando
  const [contador, setContador] = useState(0);
  const [particulas, setParticulas] = useState([]);

  useEffect(() => {
    if (!isOpen) return;

    // Fase 1: Inicial (0-500ms)
    setFase('inicial');
    
    // Fase 2: Processando (500-1500ms)
    const timer1 = setTimeout(() => {
      setFase('processando');
      
      // Contador animado
      let count = 0;
      const interval = setInterval(() => {
        count++;
        setContador(count);
        if (count >= totalDevolvido) {
          clearInterval(interval);
        }
      }, 800 / totalDevolvido);

      return () => clearInterval(interval);
    }, 500);

    // Fase 3: Sucesso (1500-2500ms)
    const timer2 = setTimeout(() => {
      setFase('sucesso');
      // Gerar partículas
      gerarParticulas();
    }, 1500);

    // Fase 4: Finalizando (2500-3000ms)
    const timer3 = setTimeout(() => {
      setFase('finalizando');
    }, 2500);

    // Fechar automaticamente
    const timer4 = setTimeout(() => {
      onClose();
    }, duracao);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [isOpen, totalDevolvido, duracao, onClose]);

  const gerarParticulas = () => {
    const novasParticulas = [];
    for (let i = 0; i < 30; i++) {
      novasParticulas.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 0.5,
        duration: 1 + Math.random() * 0.5,
        size: 4 + Math.random() * 8
      });
    }
    setParticulas(novasParticulas);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
        {/* Overlay com blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto"
        />

        {/* Container Principal */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: -50 }}
          transition={{ 
            type: "spring", 
            stiffness: 200, 
            damping: 20 
          }}
          className="relative pointer-events-auto"
        >
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border-4 border-emerald-500 dark:border-emerald-400 p-8 min-w-[400px] max-w-[500px]">
            
            {/* Partículas de Celebração */}
            {fase === 'sucesso' && (
              <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
                {particulas.map((particula) => (
                  <motion.div
                    key={particula.id}
                    initial={{ 
                      x: '50%', 
                      y: '50%',
                      scale: 0,
                      opacity: 1
                    }}
                    animate={{ 
                      x: `${particula.x}%`,
                      y: `${particula.y}%`,
                      scale: 1,
                      opacity: 0
                    }}
                    transition={{ 
                      delay: particula.delay,
                      duration: particula.duration,
                      ease: "easeOut"
                    }}
                    className="absolute"
                    style={{
                      width: particula.size,
                      height: particula.size,
                    }}
                  >
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-emerald-400 to-green-500" />
                  </motion.div>
                ))}
              </div>
            )}

            {/* Ícone Central Animado */}
            <div className="flex justify-center mb-6">
              <motion.div
                animate={{
                  scale: fase === 'sucesso' ? [1, 1.2, 1] : 1,
                  rotate: fase === 'sucesso' ? [0, 10, -10, 0] : 0,
                }}
                transition={{
                  duration: 0.6,
                  repeat: fase === 'sucesso' ? 2 : 0,
                }}
                className="relative"
              >
                {/* Círculo de fundo pulsante */}
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.6, 0.3],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute inset-0 bg-emerald-500 rounded-full blur-xl"
                />
                
                {/* Ícone principal */}
                <div className="relative w-24 h-24 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center shadow-xl">
                  <AnimatePresence mode="wait">
                    {fase === 'inicial' && (
                      <motion.div
                        key="package"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 180 }}
                      >
                        <Package className="w-12 h-12 text-white" />
                      </motion.div>
                    )}
                    
                    {fase === 'processando' && (
                      <motion.div
                        key="loading"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1, rotate: 360 }}
                        exit={{ scale: 0 }}
                        transition={{ 
                          rotate: { 
                            duration: 1, 
                            repeat: Infinity, 
                            ease: "linear" 
                          } 
                        }}
                      >
                        <TrendingUp className="w-12 h-12 text-white" />
                      </motion.div>
                    )}
                    
                    {(fase === 'sucesso' || fase === 'finalizando') && (
                      <motion.div
                        key="success"
                        initial={{ scale: 0 }}
                        animate={{ scale: [0, 1.2, 1] }}
                        transition={{ duration: 0.5 }}
                      >
                        <CheckCircle className="w-12 h-12 text-white" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </div>

            {/* Título com Animação */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center mb-4"
            >
              <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-2">
                {fase === 'inicial' && "Processando..."}
                {fase === 'processando' && "Devolvendo..."}
                {(fase === 'sucesso' || fase === 'finalizando') && "Sucesso!"}
              </h2>
              
              {/* Nome do Funcionário */}
              {funcionario && (
                <p className="text-lg text-gray-600 dark:text-gray-300 font-medium">
                  {funcionario}
                </p>
              )}
            </motion.div>

            {/* Contador de Empréstimos */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring" }}
              className="bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-900/30 dark:to-green-900/30 rounded-2xl p-6 mb-4 border-2 border-emerald-300 dark:border-emerald-600"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center">
                    <CheckCheck className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                      Empréstimos Devolvidos
                    </p>
                    <motion.p 
                      key={contador}
                      initial={{ scale: 1.5, color: '#10b981' }}
                      animate={{ scale: 1, color: '#059669' }}
                      className="text-4xl font-black text-emerald-600 dark:text-emerald-400"
                    >
                      {contador}
                    </motion.p>
                  </div>
                </div>
                
                {/* Barra de Progresso */}
                <div className="flex-1 max-w-[120px] ml-4">
                  <div className="w-full h-3 bg-emerald-200 dark:bg-emerald-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(contador / totalDevolvido) * 100}%` }}
                      transition={{ duration: 0.5 }}
                      className="h-full bg-gradient-to-r from-emerald-500 to-green-500 rounded-full"
                    />
                  </div>
                  <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-1">
                    {Math.round((contador / totalDevolvido) * 100)}%
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Ferramentas */}
            {totalFerramentas && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                      Total de Ferramentas
                    </span>
                  </div>
                  <span className="text-xl font-bold text-gray-900 dark:text-white">
                    {totalFerramentas}
                  </span>
                </div>
              </motion.div>
            )}

            {/* Mensagem de Sucesso Final */}
            {(fase === 'sucesso' || fase === 'finalizando') && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-6 text-center"
              >
                <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400">
                  <Sparkles className="w-5 h-5" />
                  <p className="text-lg font-bold">
                    Todos os empréstimos foram devolvidos!
                  </p>
                  <Sparkles className="w-5 h-5" />
                </div>
              </motion.div>
            )}

            {/* Indicador de Auto-fechamento */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              className="mt-4 text-center"
            >
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Fechando automaticamente...
              </p>
              <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mt-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: duracao / 1000, ease: "linear" }}
                  className="h-full bg-gradient-to-r from-emerald-500 to-green-500"
                />
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Efeito de Confete nas Bordas */}
        {fase === 'sucesso' && (
          <>
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={`confete-${i}`}
                initial={{ 
                  x: window.innerWidth / 2,
                  y: window.innerHeight / 2,
                  scale: 0,
                  rotate: 0
                }}
                animate={{ 
                  x: Math.random() * window.innerWidth,
                  y: Math.random() * window.innerHeight,
                  scale: [0, 1, 0.8, 0],
                  rotate: Math.random() * 720
                }}
                transition={{ 
                  delay: Math.random() * 0.3,
                  duration: 1.5,
                  ease: "easeOut"
                }}
                className="absolute pointer-events-none"
                style={{
                  width: 8 + Math.random() * 12,
                  height: 8 + Math.random() * 12,
                }}
              >
                <div 
                  className="w-full h-full rounded-sm"
                  style={{
                    background: [
                      'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
                    ][i % 4]
                  }}
                />
              </motion.div>
            ))}
          </>
        )}
      </div>
    </AnimatePresence>
  );
};

export default DevolucaoMassaAnimation;
