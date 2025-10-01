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
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">Avaliar Funcionário</h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 dark:text-gray-400 hover:bg-[#283340] rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Estrelas de Avaliação */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-gray-500 dark:text-gray-400 text-sm">
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
            <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2">
              Deixe um feedback sobre o funcionário
            </label>
            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              className="w-full h-32 px-4 py-2 bg-white dark:bg-gray-800 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 dark:border-gray-600 rounded-lg resize-none focus:border-blue-500 dark:focus:border-[#1D9BF0] focus:ring-1 focus:ring-blue-500 dark:focus:ring-[#1D9BF0] outline-none transition-colors"
              placeholder="Descreva o desempenho, pontos fortes e áreas para melhoria..."
            />
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-500 dark:text-gray-400 hover:bg-[#283340] rounded-full transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 dark:bg-[#1D9BF0] text-gray-900 dark:text-white rounded-full hover:bg-blue-600 dark:hover:bg-[#1a8cd8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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



