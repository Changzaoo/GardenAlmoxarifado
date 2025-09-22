import React, { useState } from 'react';
import { Star, X } from 'lucide-react';

const AvaliacaoPerfilModal = ({ isOpen, onClose, onConfirm }) => {
  const [avaliacao, setAvaliacao] = useState(0);
  const [hoverAvaliacao, setHoverAvaliacao] = useState(0);
  const [comentario, setComentario] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (avaliacao === 0) {
      alert('Por favor, selecione uma avaliação');
      return;
    }
    if (!comentario.trim()) {
      alert('Por favor, adicione um comentário');
      return;
    }
    onConfirm(avaliacao, comentario);
    setAvaliacao(0);
    setComentario('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#192734] rounded-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">Avaliar Funcionário</h3>
          <button
            onClick={onClose}
            className="p-2 text-[#8899A6] hover:bg-[#283340] rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Estrelas de Avaliação */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-[#8899A6] text-sm">
              Como você avalia o desempenho deste funcionário?
            </span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((estrela) => (
                <button
                  key={estrela}
                  type="button"
                  onClick={() => setAvaliacao(estrela)}
                  onMouseEnter={() => setHoverAvaliacao(estrela)}
                  onMouseLeave={() => setHoverAvaliacao(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${
                      (hoverAvaliacao ? estrela <= hoverAvaliacao : estrela <= avaliacao)
                        ? 'text-yellow-500 fill-yellow-500'
                        : 'text-[#38444D]'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Campo de Comentário */}
          <div>
            <label className="block text-sm text-[#8899A6] mb-2">
              Deixe um feedback sobre o funcionário
            </label>
            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              className="w-full h-32 px-4 py-2 bg-[#253341] text-white border border-[#38444D] rounded-lg resize-none focus:border-[#1DA1F2] focus:ring-1 focus:ring-[#1DA1F2] outline-none transition-colors"
              placeholder="Descreva o desempenho, pontos fortes e áreas para melhoria..."
            />
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[#8899A6] hover:bg-[#283340] rounded-full transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#1DA1F2] text-white rounded-full hover:bg-[#1a91da] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={avaliacao === 0 || !comentario.trim()}
            >
              Avaliar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AvaliacaoPerfilModal;