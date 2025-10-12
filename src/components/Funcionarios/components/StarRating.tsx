import React from 'react';
import { Star } from 'lucide-react';

const StarRating = ({ rating }) => {
  // Calcula a porcentagem de preenchimento (rating vai de 0 a 5)
  const fillPercentage = Math.min(Math.max((rating / 5) * 100, 0), 100);
  
  return (
    <div className="flex items-center">
      <div className="relative w-3.5 h-3.5">
        {/* Estrela de fundo (contorno) */}
        <Star 
          className="w-3.5 h-3.5 absolute text-yellow-400" 
          strokeWidth={1.5}
        />
        
        {/* Estrela preenchida com clip-path */}
        <div 
          className="absolute w-full h-full overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - fillPercentage}% 0 0)` }}
        >
          <Star 
            className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" 
            strokeWidth={1.5}
          />
        </div>
      </div>
    </div>
  );
};

export default StarRating;
