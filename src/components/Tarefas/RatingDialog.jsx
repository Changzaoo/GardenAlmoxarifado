import React, { useState } from 'react';
import { Star, X } from 'lucide-react';

const RatingDialog = ({ isOpen, onClose, onSubmit, title }) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comentario, setComentario] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rating === 0) {
      return;
    }
    onSubmit(rating, comentario);
    setRating(0);
    setComentario('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#192734] rounded-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 text-[#8899A6] hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Rating Stars */}
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-1 hover:scale-110 transition-transform"
              >
                <Star
                  className={`w-8 h-8 ${
                    star <= (hoverRating || rating)
                      ? 'text-yellow-500 fill-yellow-500'
                      : 'text-[#38444D]'
                  }`}
                />
              </button>
            ))}
          </div>

          {/* Rating Text */}
          <div className="text-center text-[#8899A6]">
            {rating === 1 && "Ruim"}
            {rating === 2 && "Regular"}
            {rating === 3 && "Bom"}
            {rating === 4 && "Muito Bom"}
            {rating === 5 && "Excelente"}
          </div>

          {/* Comment */}
          <div>
            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="Deixe um comentário..."
              className="w-full bg-[#273340] text-white rounded-lg p-3 placeholder-[#8899A6] border border-[#38444D] focus:border-[#1DA1F2] focus:outline-none resize-none h-24"
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={rating === 0 || !comentario}
            className={`w-full py-2 px-4 rounded-full font-medium ${
              rating === 0 || !comentario
                ? 'bg-[#1DA1F2]/50 text-white/50 cursor-not-allowed'
                : 'bg-[#1DA1F2] text-white hover:bg-[#1a91da] transition-colors'
            }`}
          >
            Enviar Avaliação
          </button>
        </form>
      </div>
    </div>
  );
};

export default RatingDialog;
