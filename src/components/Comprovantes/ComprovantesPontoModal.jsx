import React, { useEffect } from 'react';
import { X, Download, Share2 } from 'lucide-react';
import ComprovantesPontoVisual from './ComprovantesPontoVisual';
import { gerarPDFComprovantePonto } from '../../utils/comprovanteUtils';

const ComprovantesPontoModal = ({ isOpen, onClose, dados }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDownload = async () => {
    try {
      await gerarPDFComprovantePonto(dados);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF. Tente novamente.');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Comprovante de Ponto - WorkFlow',
          text: `Comprovante de Ponto - ${dados.funcionarioNome} - ${dados.data}`,
          url: window.location.href
        });
      } catch (error) {
        console.log('Compartilhamento cancelado');
      }
    } else {
      alert('Compartilhamento não suportado neste navegador');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Cabeçalho do Modal */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 flex items-center justify-between flex-shrink-0">
          <h2 className="text-2xl font-bold text-white">Comprovante de Ponto</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors backdrop-blur-sm"
              title="Baixar PDF"
            >
              <Download className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={handleShare}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors backdrop-blur-sm"
              title="Compartilhar"
            >
              <Share2 className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors backdrop-blur-sm"
              title="Fechar"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Conteúdo Rolável */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <ComprovantesPontoVisual dados={dados} />
        </div>

        {/* Rodapé com Botões */}
        <div className="bg-white border-t border-gray-200 p-4 flex items-center justify-end gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-semibold transition-colors"
          >
            Fechar
          </button>
          <button
            onClick={handleDownload}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Baixar PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComprovantesPontoModal;
