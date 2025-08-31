import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { useIsMobile } from '../../hooks/useIsMobile';

const ChatButton = ({ isOpen, onClick, position: externalPosition, onPositionChange }) => {
  const buttonRef = useRef(null);
  const [internalPosition, setInternalPosition] = useState({ x: -1, y: -1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hasMoved, setHasMoved] = useState(false);
  const mouseDownTimeRef = useRef(0);
  const isMobile = useIsMobile();

  const position = externalPosition || internalPosition;
  const setPosition = (newPosition) => {
    onPositionChange?.(newPosition);
    setInternalPosition(newPosition);
  };

  // Inicializa a posição do botão
  useEffect(() => {
    if (position.x === -1 && position.y === -1) {
      setPosition({
        x: window.innerWidth - 100,
        y: window.innerHeight - 100
      });
    }
  }, [position]);

  // Manipuladores para desktop (mouse events)
  const handleMouseDown = (e) => {
    if (e.button === 0) { // Apenas botão esquerdo
      e.preventDefault();
      mouseDownTimeRef.current = Date.now();
      setIsDragging(true);
      setHasMoved(false);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const newX = Math.min(Math.max(0, e.clientX - dragStart.x), window.innerWidth - 70);
    const newY = Math.min(Math.max(0, e.clientY - dragStart.y), window.innerHeight - 70);
    
    // Marca como movimento se mover mais que 5 pixels
    if (!hasMoved && (
      Math.abs(e.clientX - (dragStart.x + position.x)) > 5 ||
      Math.abs(e.clientY - (dragStart.y + position.y)) > 5
    )) {
      setHasMoved(true);
    }
    
    setPosition({ x: newX, y: newY });
  };

  const handleMouseUp = (e) => {
    const timeElapsed = Date.now() - mouseDownTimeRef.current;
    
    // Se foi um clique rápido (menos de 200ms) e não houve movimento significativo
    if (isDragging && !hasMoved && timeElapsed < 200) {
      onClick(e);
    }
    
    setIsDragging(false);
    setHasMoved(false);
  };

  // Manipuladores para mobile (touch events)
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    mouseDownTimeRef.current = Date.now();
    setIsDragging(true);
    setHasMoved(false);
    setDragStart({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y
    });
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    
    const newX = Math.min(Math.max(0, touch.clientX - dragStart.x), window.innerWidth - 70);
    const newY = Math.min(Math.max(0, touch.clientY - dragStart.y), window.innerHeight - 70);
    
    // Marca como movimento se mover mais que 5 pixels
    if (!hasMoved && (
      Math.abs(touch.clientX - (dragStart.x + position.x)) > 5 ||
      Math.abs(touch.clientY - (dragStart.y + position.y)) > 5
    )) {
      setHasMoved(true);
    }
    
    setPosition({ x: newX, y: newY });
  };

  const handleTouchEnd = (e) => {
    const timeElapsed = Date.now() - mouseDownTimeRef.current;
    
    // Se foi um toque rápido (menos de 200ms) e não houve movimento significativo
    if (isDragging && !hasMoved && timeElapsed < 200) {
      onClick(e);
    }
    
    setIsDragging(false);
    setHasMoved(false);
  };

  // Adiciona/remove event listeners
  useEffect(() => {
    if (isDragging) {
      if (isMobile) {
        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('touchend', handleTouchEnd);
      } else {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
      }
    }

    return () => {
      if (isMobile) {
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      } else {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      }
    };
  }, [isDragging, isMobile]);

  // Previne que o botão saia da tela ao redimensionar
  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => ({
        x: Math.min(prev.x, window.innerWidth - 70),
        y: Math.min(prev.y, window.innerHeight - 70)
      }));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <button
      ref={buttonRef}
      onMouseDown={!isMobile ? handleMouseDown : undefined}
      onTouchStart={isMobile ? handleTouchStart : undefined}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        touchAction: 'none',
        cursor: isDragging ? 'grabbing' : 'grab',
        transform: isDragging ? 'scale(1.1)' : 'scale(1)',
        zIndex: 9999,
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none'
      }}
      className={`p-4 rounded-full shadow-lg transition-transform duration-200 
        ${isOpen ? 'bg-red-500 hover:bg-red-600' : 'bg-[#1D9BF0] hover:bg-[#1a8cd8]'}
        ${isDragging ? 'shadow-xl' : ''}`}
    >
      {isOpen ? (
        <X className="w-6 h-6 text-white pointer-events-none" />
      ) : (
        <MessageCircle className="w-6 h-6 text-white pointer-events-none" />
      )}
    </button>
  );
};

export default ChatButton;
