import React, { forwardRef } from 'react';
import { FixedSizeList } from 'react-window';

/**
 * Lista virtualizada para grandes conjuntos de dados
 * Renderiza apenas os itens visíveis na tela
 */
const VirtualizedList = forwardRef(({
  items = [],
  itemHeight = 80,
  height = 600,
  width = '100%',
  overscanCount = 5,
  renderItem,
  className = '',
  emptyMessage = 'Nenhum item encontrado',
  ...props
}, ref) => {
  
  if (!items || items.length === 0) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  const Row = ({ index, style }) => {
    const item = items[index];
    return (
      <div style={style}>
        {renderItem(item, index)}
      </div>
    );
  };

  return (
    <FixedSizeList
      ref={ref}
      className={className}
      height={height}
      itemCount={items.length}
      itemSize={itemHeight}
      width={width}
      overscanCount={overscanCount}
      {...props}
    >
      {Row}
    </FixedSizeList>
  );
});

VirtualizedList.displayName = 'VirtualizedList';

export default React.memo(VirtualizedList);
