import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { useIsMobile } from '../../hooks/useIsMobile';

// Tempo máximo para considerar como clique em milissegundos
const CLICK_THRESHOLD = 200;
// Distância máxima para considerar como clique em pixels
const MOVE_THRESHOLD = 5;

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

  // Inicializa a posição do botão e ajusta para orientação da tela
  useEffect(() => {
    if (position.x === -1 && position.y === -1) {
      const margin = 16; // Margem de segurança
      setPosition({
        x: window.innerWidth - 70 - margin, // 70px é aproximadamente o tamanho do botão
        y: window.innerHeight - 70 - margin
      });
    }
  }, [position]);

  // Ajusta posição quando a orientação da tela muda
  useEffect(() => {
    const handleResize = () => {
      if (buttonRef.current) {
        const margin = 16;
        const buttonRect = buttonRef.current.getBoundingClientRect();
        const newX = Math.min(position.x, window.innerWidth - buttonRect.width - margin);
        const newY = Math.min(position.y, window.innerHeight - buttonRect.height - margin);
        
        if (newX !== position.x || newY !== position.y) {
          setPosition({ x: newX, y: newY });
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [position]);

  // Manipuladores para desktop (mouse events)
  const handleMouseDown = (e) => {
    // Só previne o comportamento padrão se for botão esquerdo do mouse
    if (e.button === 0) {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
      setHasMoved(false);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });

      // Registra o momento do clique
      mouseDownTimeRef.current = Date.now();
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    
    const newX = Math.min(Math.max(0, e.clientX - dragStart.x), window.innerWidth - 70);
    const newY = Math.min(Math.max(0, e.clientY - dragStart.y), window.innerHeight - 70);
    
    // Se moveu mais que 5 pixels, considera como arrasto
    if (!hasMoved && (
      Math.abs(e.clientX - (dragStart.x + position.x)) > 5 ||
      Math.abs(e.clientY - (dragStart.y + position.y)) > 5
    )) {
      setHasMoved(true);
      // Já moveu o suficiente, não será mais considerado um clique
    }
    
    setPosition({ x: newX, y: newY });
  };

  const handleMouseUp = (e) => {
    // Se foi um clique simples (sem movimento), deixa o evento de clique lidar com isso
    if (isDragging) {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      setHasMoved(false);
      
      // Se não houve movimento, permite que o evento de clique seja processado
      if (!hasMoved) {
        e.target.click();
      }
    }
  };

  // Manipuladores para mobile (touch events)
  const handleTouchStart = (e) => {
    if (e.touches.length !== 1) return;
    
    const touch = e.touches[0];
    const rect = buttonRef.current.getBoundingClientRect();
    setDragStart({
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    });
    mouseDownTimeRef.current = Date.now();
    setHasMoved(false);
    
    const handleTouchMove = (e) => {
      if (e.touches.length !== 1) return;
      e.preventDefault(); // Prevent scrolling
      
      const touch = e.touches[0];
      if (!isDragging) {
        const deltaX = Math.abs(touch.clientX - dragStart.x);
        const deltaY = Math.abs(touch.clientY - dragStart.y);
        
        // Only start dragging if movement is significant
        if (deltaX > MOVE_THRESHOLD || deltaY > MOVE_THRESHOLD) {
          setIsDragging(true);
          setHasMoved(true);
        }
      }
      
      if (isDragging) {
        const newX = Math.max(0, Math.min(touch.clientX - dragStart.x, window.innerWidth - rect.width));
        const newY = Math.max(0, Math.min(touch.clientY - dragStart.y, window.innerHeight - rect.height));
        setPosition({ x: newX, y: newY });
      }
    };
    
    const handleTouchEnd = () => {
      setIsDragging(false);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      
      const clickDuration = Date.now() - mouseDownTimeRef.current;
      if (clickDuration < CLICK_THRESHOLD && !hasMoved) {
        onClick();
      }
    };
    
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
  };  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    
    const newX = Math.min(Math.max(0, touch.clientX - dragStart.x), window.innerWidth - 70);
    const newY = Math.min(Math.max(0, touch.clientY - dragStart.y), window.innerHeight - 70);
    
    setPosition({ x: newX, y: newY });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
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
      // Reseta o timer do clique
      mouseDownTimeRef.current = 0;
      
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

  const handleClick = (e) => {
    // Só executa o onClick se não houver movimento e não estiver arrastando
    if (!hasMoved && !isDragging) {
      onClick(e);
    }
  };

  return (
    <button
      ref={buttonRef}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        touchAction: 'none', // Previne comportamentos padrão de toque
        cursor: 'grab',
        transform: isDragging ? 'scale(1.1)' : 'scale(1)',
        zIndex: 9999,
        userSelect: 'none', // Previne seleção de texto ao arrastar
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none'
      }}
      className={`p-4 rounded-full shadow-lg transition-transform duration-200 
        ${isOpen ? 'bg-red-500 hover:bg-red-600' : 'bg-[#1D9BF0] hover:bg-[#1a8cd8]'}
        ${isDragging ? 'cursor-grabbing shadow-xl' : ''}`}
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
