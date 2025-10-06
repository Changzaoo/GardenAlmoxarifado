import React from 'react';
import { X } from 'lucide-react';
import ComprovanteVisual from './ComprovanteVisual';
import { gerarComprovantePDF, compartilharComprovantePDF } from '../../utils/comprovanteUtils';

/**
 * Modal para exibir comprovante em tela cheia
 */
const ComprovanteModal = ({ isOpen, onClose, tipo, dados }) => {
  if (!isOpen) return null;

  const handleDownload = () => {
    gerarComprovantePDF(tipo, dados);
  };

  const handleShare = async () => {
    await compartilharComprovantePDF(tipo, dados);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl my-8">
        {/* Botão Fechar */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-sm"
        >
          <X className="w-6 h-6 text-white" />
        </button>

        {/* Comprovante */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
          <ComprovanteVisual
            tipo={tipo}
            dados={dados}
            onDownload={handleDownload}
            onShare={handleShare}
          />
        </div>
      </div>
    </div>
  );
};

export default React.memo(ComprovanteModal);
