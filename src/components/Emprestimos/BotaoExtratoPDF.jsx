import React, { useState } from 'react';
import { FileText, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { gerarExtratoPDF } from '../../utils/gerarExtratoPDF';

const BotaoExtratoPDF = ({ emprestimo, variant = 'button', className = '', size = 'md' }) => {
  const [gerandoPDF, setGerandoPDF] = useState(false);

  const handleGerarExtrato = async (e) => {
    e?.stopPropagation(); // Evitar propagação de eventos
    setGerandoPDF(true);
    try {
      await gerarExtratoPDF(emprestimo);
    } catch (error) {
      console.error('Erro ao gerar extrato:', error);
    } finally {
      setGerandoPDF(false);
    }
  };

  // Tamanhos
  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  // Variante: botão completo
  if (variant === 'button') {
    return (
      <motion.button
        onClick={handleGerarExtrato}
        disabled={gerandoPDF}
        className={`flex items-center gap-2 bg-[#1D9BF0] hover:bg-[#1A8CD8] disabled:bg-gray-400 text-white font-semibold rounded-lg shadow-md transition-all duration-200 hover:scale-105 disabled:cursor-not-allowed ${sizes[size]} ${className}`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title="Gerar extrato em PDF"
      >
        {gerandoPDF ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Download className={iconSizes[size]} />
            </motion.div>
            <span>Gerando...</span>
          </>
        ) : (
          <>
            <FileText className={iconSizes[size]} />
            <span>Extrato PDF</span>
          </>
        )}
      </motion.button>
    );
  }

  // Variante: apenas ícone
  if (variant === 'icon') {
    return (
      <motion.button
        onClick={handleGerarExtrato}
        disabled={gerandoPDF}
        className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#1D9BF0] hover:bg-[#1A8CD8] disabled:bg-gray-400 text-white shadow-lg transition-all duration-200 disabled:cursor-not-allowed ${className}`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        title="Gerar extrato em PDF"
      >
        {gerandoPDF ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <Download className="w-4 h-4 sm:w-5 sm:h-5" />
          </motion.div>
        ) : (
          <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
        )}
      </motion.button>
    );
  }

  // Variante: link/texto
  if (variant === 'link') {
    return (
      <button
        onClick={handleGerarExtrato}
        disabled={gerandoPDF}
        className={`flex items-center gap-1.5 text-[#1D9BF0] hover:text-[#1A8CD8] disabled:text-gray-400 font-medium transition-colors duration-200 disabled:cursor-not-allowed ${className}`}
        title="Gerar extrato em PDF"
      >
        {gerandoPDF ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Download className={iconSizes[size]} />
            </motion.div>
            <span>Gerando PDF...</span>
          </>
        ) : (
          <>
            <FileText className={iconSizes[size]} />
            <span>Extrato</span>
          </>
        )}
      </button>
    );
  }

  return null;
};

export default BotaoExtratoPDF;
