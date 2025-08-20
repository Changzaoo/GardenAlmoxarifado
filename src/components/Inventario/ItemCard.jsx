import React from 'react';
import { Trash2 } from 'lucide-react';
import { useTheme } from '../AlmoxarifadoJardim';

const ItemCard = ({ item, onRemover }) => {
  const { classes } = useTheme();
  const percentualDisponivel = (item.disponivel / item.quantidade) * 100;
  
  const getStatusColor = () => {
    if (item.disponivel === 0) return 'bg-red-500';
    if (item.disponivel < item.quantidade * 0.3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusText = () => {
    if (item.disponivel === 0) return 'text-red-600 dark:text-red-400';
    if (item.disponivel < item.quantidade * 0.3) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  return (
    <div className={`${classes.cardHover} p-4 transition-all duration-200`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 mr-2">
          <h3 className={`font-semibold text-sm leading-tight ${classes.textPrimary}`}>
            {item.nome}
          </h3>
          <div className={`text-xs mt-1 ${classes.textMuted}`}>
            {item.categoria}
          </div>
        </div>
        <button
          onClick={() => onRemover(item.id)}
          className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1 flex-shrink-0 transition-colors duration-200"
          title="Remover item"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      
      <div className={`space-y-2 text-sm ${classes.textSecondary}`}>
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
        <div className={`${classes.containerSecondary} rounded-full h-2`}>
          <div
            className={`h-2 rounded-full transition-all ${getStatusColor()}`}
            style={{
              width: `${percentualDisponivel}%`
            }}
          ></div>
        </div>
        <div className={`text-xs mt-1 text-center ${classes.textMuted}`}>
          {Math.round(percentualDisponivel)}% disponível
        </div>
      </div>
    </div>
  );
};

export default ItemCard;