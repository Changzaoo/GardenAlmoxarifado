import React, { useEffect, useState } from 'react';
import { Package, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * BoxLoanAnimation - Animação de caixa para empréstimos/devoluções
 * Mostra ferramentas entrando na caixa uma por uma e indo para o destinatário
 * Duração máxima: 800ms total
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
  const [currentStep, setCurrentStep] = useState(0); // 0: preparação, 1: ferramentas entram, 2: caixa vai, 3: chegou
  const [toolsInBox, setToolsInBox] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    // Calcula duração por ferramenta (deixa tempo para caixa ir)
    const totalTools = ferramentas.length;
    const toolAnimationTime = Math.min(100, 400 / totalTools); // Máx 100ms por ferramenta, até 400ms total
    const boxTravelTime = 300; // Tempo da caixa indo
    const successTime = 100; // Tempo da confirmação

    // Passo 0: Preparação (0ms - imediato)
    setCurrentStep(1);

    // Passo 1: Ferramentas entram na caixa uma por uma
    ferramentas.forEach((ferramenta, index) => {
      setTimeout(() => {
        setToolsInBox(prev => [...prev, ferramenta]);
      }, index * toolAnimationTime);
    });

    // Passo 2: Caixa vai para destinatário
    setTimeout(() => {
      setCurrentStep(2);
    }, totalTools * toolAnimationTime);

    // Passo 3: Chegou + confirmação
    setTimeout(() => {
      setCurrentStep(3);
      setShowSuccess(true);
    }, totalTools * toolAnimationTime + boxTravelTime);

    // Finaliza
    setTimeout(() => {
      onComplete?.();
    }, totalTools * toolAnimationTime + boxTravelTime + successTime);

  }, [ferramentas, onComplete]);

  const totalTools = ferramentas.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl h-96 px-8">
        {/* Remetente (esquerda) */}
        <motion.div
          className="absolute left-0 top-1/2 -translate-y-1/2"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex flex-col items-center gap-3">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-2xl ring-4 ring-white dark:ring-gray-800">
              {remetenteFoto ? (
                <img src={remetenteFoto} alt={remetenteNome} className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="text-white text-3xl font-bold">{remetenteNome?.charAt(0)}</span>
              )}
            </div>
            <div className="text-center">
              <p className="font-bold text-white text-lg">{remetenteNome}</p>
              <p className="text-sm text-gray-300">{tipo === 'emprestimo' ? 'Almoxarifado' : 'Devolvendo'}</p>
            </div>
          </div>
        </motion.div>

        {/* Destinatário (direita) */}
        <motion.div
          className="absolute right-0 top-1/2 -translate-y-1/2"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.1 }}
        >
          <div className="flex flex-col items-center gap-3">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-2xl ring-4 ring-white dark:ring-gray-800">
              {destinatarioFoto ? (
                <img src={destinatarioFoto} alt={destinatarioNome} className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="text-white text-3xl font-bold">{destinatarioNome?.charAt(0)}</span>
              )}
            </div>
            <div className="text-center">
              <p className="font-bold text-white text-lg">{destinatarioNome}</p>
              <p className="text-sm text-gray-300">{tipo === 'emprestimo' ? 'Recebendo' : 'Almoxarifado'}</p>
            </div>
          </div>
        </motion.div>

        {/* Centro - Caixa e ferramentas */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          
          {/* Ferramentas flutuando antes de entrar na caixa */}
          <AnimatePresence>
            {currentStep === 1 && ferramentas.map((ferramenta, index) => {
              const isInBox = toolsInBox.includes(ferramenta);
              if (isInBox) return null;

              return (
                <motion.div
                  key={index}
                  className="absolute left-1/2 top-1/2"
                  initial={{ x: -200, y: -50, scale: 0.5, opacity: 0 }}
                  animate={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                  exit={{ scale: 0, y: 20, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  style={{ zIndex: 10 + index }}
                >
                  <div className="bg-gradient-to-br from-orange-500 to-red-600 text-white p-3 rounded-xl shadow-2xl">
                    <Package className="w-6 h-6" />
                  </div>
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
              x: currentStep === 2 ? 400 : currentStep === 3 ? 400 : 0,
              y: currentStep === 2 ? -20 : 0,
            }}
            transition={{
              scale: { duration: 0.2 },
              opacity: { duration: 0.2 },
              x: { duration: 0.3, ease: "easeInOut" },
              y: { duration: 0.15 }
            }}
          >
            {/* Sombra da caixa */}
            <motion.div
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-4 bg-black opacity-20 rounded-full blur-md"
              animate={{
                scale: currentStep === 2 ? 0.8 : 1,
                opacity: currentStep === 2 ? 0.1 : 0.2
              }}
            />

            {/* Caixa 3D */}
            <div className="relative w-32 h-32">
              {/* Tampa da caixa */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-amber-600 to-amber-700 rounded-t-2xl border-4 border-amber-800 shadow-2xl"
                animate={{
                  rotateX: toolsInBox.length === totalTools ? 0 : -45,
                  y: toolsInBox.length === totalTools ? 0 : -20
                }}
                transition={{ duration: 0.2 }}
                style={{
                  transformOrigin: 'bottom',
                  transformStyle: 'preserve-3d'
                }}
              />

              {/* Corpo da caixa */}
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl border-4 border-amber-800 shadow-2xl flex items-center justify-center">
                {/* Contador de ferramentas */}
                <motion.div
                  className="bg-white dark:bg-gray-800 rounded-full w-16 h-16 flex items-center justify-center shadow-lg"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <motion.span
                    className="text-2xl font-bold text-amber-600"
                    key={toolsInBox.length}
                    initial={{ scale: 1.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.15 }}
                  >
                    {toolsInBox.length}/{totalTools}
                  </motion.span>
                </motion.div>

                {/* Etiqueta */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-900 px-3 py-1 rounded-full text-xs font-bold text-amber-600 shadow-md">
                  {tipo === 'emprestimo' ? '📦 Empréstimo' : '↩️ Devolução'}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Sucesso */}
          <AnimatePresence>
            {showSuccess && (
              <motion.div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1.5, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-full p-6 shadow-2xl">
                  <CheckCircle className="w-12 h-12 text-white" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Barra de progresso */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-64">
          <div className="bg-gray-700 rounded-full h-2 overflow-hidden shadow-inner">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-green-500"
              initial={{ width: '0%' }}
              animate={{ width: currentStep === 3 ? '100%' : `${(toolsInBox.length / totalTools) * 70}%` }}
              transition={{ duration: 0.2 }}
            />
          </div>
          <p className="text-center text-white text-sm mt-2 font-medium">
            {currentStep === 1 && `Preparando ${toolsInBox.length}/${totalTools}...`}
            {currentStep === 2 && 'Enviando...'}
            {currentStep === 3 && '✓ Concluído!'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default BoxLoanAnimation;
