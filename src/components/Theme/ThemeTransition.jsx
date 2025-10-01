import React, { useState, useEffect } from 'react';
import './ThemeTransition.css';

const ThemeTransition = ({ 
  isActive, 
  fromTheme,
  toTheme,
  onTransitionComplete,
  buttonPosition = { x: 0, y: 0 } // Posição do botão de tema
}) => {
  const [phase, setPhase] = useState('');
  
  // Determina qual efeito usar baseado na transição
  // Dessaturação: claro → escuro (perda de cor)
  // Saturação: escuro → claro (ganho de cor)
  const effect = fromTheme === 'light' && toTheme === 'dark' ? 'desaturate' : 'saturate';

  useEffect(() => {
    if (!isActive) {
      setPhase('');
      return;
    }

    // Start transition
    setPhase('start');
    
    // Middle phase (main animation)
    const middleTimer = setTimeout(() => {
      setPhase('middle');
    }, 100);

    // End phase
    const endTimer = setTimeout(() => {
      setPhase('end');
    }, 600);

    // Complete and cleanup (1 segundo total)
    const completeTimer = setTimeout(() => {
      setPhase('fade-out');
      if (onTransitionComplete) {
        onTransitionComplete();
      }
    }, 1000);

    // Final cleanup
    const cleanupTimer = setTimeout(() => {
      setPhase('');
    }, 1200);

    return () => {
      clearTimeout(middleTimer);
      clearTimeout(endTimer);
      clearTimeout(completeTimer);
      clearTimeout(cleanupTimer);
    };
  }, [isActive, onTransitionComplete]);

  if (!isActive || !phase) return null;

  return (
    <div 
      className={`theme-transition-overlay ${effect} ${phase}`}
      style={{
        '--button-x': `${buttonPosition.x}px`,
        '--button-y': `${buttonPosition.y}px`
      }}
    >
      {/* Efeito de Dessaturação (claro → escuro) */}
      {effect === 'desaturate' && (
        <>
          <div className="desaturate-wave" />
          <div className="desaturate-ripple" />
          <div className="color-drain" />
        </>
      )}
      
      {/* Efeito de Saturação (escuro → claro) */}
      {effect === 'saturate' && (
        <>
          <div className="saturate-burst" />
          <div className="color-bloom" />
          <div className="color-waves">
            {[...Array(8)].map((_, i) => (
              <div key={i} className={`color-wave wave-${i + 1}`} />
            ))}
          </div>
        </>
      )}
      
      {/* Efeito de transição universal */}
      <div className="transition-overlay" />
    </div>
  );
};

export default ThemeTransition;
