import React from 'react';

/**
 * MessagesBadge - Badge de mensagens não lidas
 * Sem animação pulsante, design limpo e moderno
 * Usado nos menus mobile e desktop
 */
const MessagesBadge = ({ 
  count = 0, 
  max = 99,
  size = 'md', // 'sm', 'md', 'lg'
  position = 'top-right', // 'top-right', 'top-left', 'bottom-right', 'bottom-left'
  className = ''
}) => {
  if (count <= 0) return null;

  // Tamanhos
  const sizeClasses = {
    sm: 'min-w-[14px] h-3.5 px-1 text-[9px]',
    md: 'min-w-[18px] h-4.5 px-1 text-[10px]',
    lg: 'min-w-[22px] h-5 px-1.5 text-xs'
  };

  // Posições
  const positionClasses = {
    'top-right': '-top-1 -right-1',
    'top-left': '-top-1 -left-1',
    'bottom-right': '-bottom-1 -right-1',
    'bottom-left': '-bottom-1 -left-1'
  };

  const displayCount = count > max ? `${max}+` : count;

  return (
    <span 
      className={`
        absolute ${positionClasses[position]} 
        ${sizeClasses[size]} 
        bg-red-500 text-white
        font-bold rounded-full 
        flex items-center justify-center 
        shadow-lg
        transition-all duration-200
        z-10
        ${className}
      `}
      role="status"
      aria-label={`${count} mensagens não lidas`}
    >
      {displayCount}
    </span>
  );
};

export default MessagesBadge;
