import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { useIsMobile } from '../../hooks/useIsMobile';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useAuth } from '../../hooks/useAuth';

// Tempo máximo para considerar como clique em milissegundos
const CLICK_THRESHOLD = 200;
// Distância máxima para considerar como clique em pixels
const MOVE_THRESHOLD = 5;

const ChatButton = ({ isOpen, onClick, position: externalPosition, onPositionChange }) => {
  const { usuario } = useAuth();
  const buttonRef = useRef(null);
  const [internalPosition, setInternalPosition] = useState({ x: -1, y: -1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hasMoved, setHasMoved] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const mouseDownTimeRef = useRef(0);
  const isMobile = useIsMobile();

  // Monitor de mensagens não lidas
  useEffect(() => {
    if (!usuario?.id) return;

    console.log('Iniciando monitor de mensagens para usuário:', usuario.id);
    
    const mensagensRef = collection(db, 'mensagens');
    const q = query(
      mensagensRef,
      where('destinatario.id', '==', usuario.id), // Corrigido para usar o caminho correto
      where('lida', '==', false),
      where('deletada', '==', false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const count = snapshot.docs.length;
      console.log('Mensagens não lidas encontradas:', count);
      setUnreadCount(count);
      
      // Atualiza o badge do app em dispositivos móveis
      if (isMobile && 'setAppBadge' in navigator) {
        navigator.setAppBadge(count).catch(console.error);
      }

      // Em dispositivos móveis, registra para notificações push se ainda não registrado
      if (isMobile && 'Notification' in window && Notification.permission !== 'granted') {
        Notification.requestPermission().then(permission => {
          console.log('Permissão de notificação:', permission);
        });
      }

      // Se houver novas mensagens e o app estiver em segundo plano, mostra notificação
      if (count > 0 && document.visibilityState === 'hidden') {
        snapshot.docChanges().forEach(change => {
          if (change.type === 'added') {
            const msg = change.doc.data();
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Nova mensagem', {
                body: `${msg.remetente.nome}: ${msg.conteudo}`,
                icon: '/logo.png',
                badge: '/logo.png',
                vibrate: [200, 100, 200],
                tag: 'chat-message',
                requireInteraction: false
              });
            }
          }
        });
      }
    }, error => {
      console.error('Erro ao monitorar mensagens:', error);
    });

    return () => {
      console.log('Limpando monitor de mensagens');
      unsubscribe();
      if (isMobile && 'clearAppBadge' in navigator) {
        navigator.clearAppBadge().catch(console.error);
      }
    };
  }, [usuario?.id, isMobile]);

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
    <div className="relative">
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
        {!isOpen && unreadCount > 0 && (
          <div 
            className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full min-w-[24px] h-[24px] flex items-center justify-center px-2 pointer-events-none border-2 border-white"
            style={{
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              zIndex: 10000,
              animation: 'bounce-subtle 2s infinite'
            }}
          >
            <style jsx>{`
              @keyframes bounce-subtle {
                0%, 100% { transform: translateY(0) scale(1); }
                50% { transform: translateY(-3px) scale(1.1); }
              }
            `}</style>
            {unreadCount > 99 ? '99+' : unreadCount}
          </div>
        )}
      </button>
    </div>
  );
};

export default ChatButton;
