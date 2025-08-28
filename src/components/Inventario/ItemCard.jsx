import React from 'react';
import { Trash2 } from 'lucide-react';

const ItemCard = ({ item, onRemover }) => {
  const percentualDisponivel = (item.disponivel / item.quantidade) * 100;
  
  const getStatusColor = () => {
    if (item.disponivel === 0) return 'bg-[#F4212E]';
    if (item.disponivel < item.quantidade * 0.3) return 'bg-[#FAA626]';
    return 'bg-[#1DA1F2]';
  };

  const getStatusText = () => {
    if (item.disponivel === 0) return 'text-[#F4212E]';
    if (item.disponivel < item.quantidade * 0.3) return 'text-[#FAA626]';
    return 'text-[#1DA1F2]';
  };

  return (
    <div className="bg-[#253341] border border-[#38444D] rounded-2xl p-4 hover:border-[#1DA1F2] transition-all shadow-sm">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 mr-2">
          <h3 className="font-semibold text-white text-sm leading-tight">{item.nome}</h3>
          <div className="text-xs text-[#8899A6] mt-1">{item.categoria}</div>
        </div>
        <button
          onClick={() => onRemover(item.id)}
          className="text-[#F4212E] hover:text-[#dc1e29] p-1 flex-shrink-0"
          title="Remover item"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      
      <div className="space-y-2 text-sm text-[#8899A6]">
        <div className="flex justify-between">
          <span>Total:</span>
          <span className="font-medium text-white">{item.quantidade}</span>
        </div>
        <div className="flex justify-between">
          <span>Disponível:</span>
          <span className={`font-medium ${getStatusText()}`}>
            {item.disponivel}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Em uso:</span>
          <span className="font-medium text-white">{item.quantidade - item.disponivel}</span>
        </div>
      </div>

      {/* Barra de progresso */}
      <div className="mt-3">
        <div className="bg-[#38444D] rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${getStatusColor()}`}
            style={{
              width: `${percentualDisponivel}%`
            }}
          ></div>
        </div>
        <div className="text-xs text-[#8899A6] mt-1 text-center">
          {Math.round(percentualDisponivel)}% disponível
        </div>
      </div>
    </div>
  );
};

export default ItemCard;