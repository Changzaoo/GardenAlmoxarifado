import React from 'react';
import { Trash2 } from 'lucide-react';

const ItemCard = ({ item, onRemover }) => {
  const percentualDisponivel = (item.disponivel / item.quantidade) * 100;
  
  const getStatusColor = () => {
    if (item.disponivel === 0) return 'bg-red-500';
    if (item.disponivel < item.quantidade * 0.3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusText = () => {
    if (item.disponivel === 0) return 'text-red-600';
    if (item.disponivel < item.quantidade * 0.3) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 mr-2">
          <h3 className="font-semibold text-gray-800 text-sm leading-tight">{item.nome}</h3>
          <div className="text-xs text-gray-500 mt-1">{item.categoria}</div>
        </div>
        <button
          onClick={() => onRemover(item.id)}
          className="text-red-500 hover:text-red-700 p-1 flex-shrink-0"
          title="Remover item"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      
      <div className="space-y-2 text-sm text-gray-600">
        <div className="flex justify-between">
          <span>Total:</span>
          <span className="font-medium">{item.quantidade}</span>
        </div>
        <div className="flex justify-between">
          <span>Disponível:</span>
          <span className={`font-medium ${getStatusText()}`}>
            {item.disponivel}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Em uso:</span>
          <span className="font-medium">{item.quantidade - item.disponivel}</span>
        </div>
      </div>

      {/* Barra de progresso */}
      <div className="mt-3">
        <div className="bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${getStatusColor()}`}
            style={{
              width: `${percentualDisponivel}%`
            }}
          ></div>
        </div>
        <div className="text-xs text-gray-500 mt-1 text-center">
          {Math.round(percentualDisponivel)}% disponível
        </div>
      </div>
    </div>
  );
};

export default ItemCard;