import React, { useState, useEffect, useRef, memo } from 'react';
import { motion } from 'framer-motion';
import { createIntersectionObserver } from '../../utils/performanceUtils';

/**
 * Componente de imagem otimizada com lazy loading
 * Reduz uso de memória carregando imagens apenas quando visíveis
 */
const LazyImage = memo(({
  src,
  alt,
  className = '',
  width,
  height,
  placeholder = null,
  blurAmount = 10,
  fadeIn = true,
  onLoad,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [imageSrc, setImageSrc] = useState(placeholder);
  const imgRef = useRef(null);
  const observerRef = useRef(null);

  useEffect(() => {
    // Criar Intersection Observer
    if (imgRef.current) {
      observerRef.current = createIntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setIsInView(true);
              // Parar de observar após carregar
              if (observerRef.current) {
                observerRef.current.disconnect();
              }
            }
          });
        },
        {
          rootMargin: '50px', // Carregar 50px antes de aparecer
          threshold: 0.01,
        }
      );

      observerRef.current.observe(imgRef.current);
    }

    // Cleanup
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    if (isInView && src) {
      const img = new Image();
      
      img.onload = () => {
        setImageSrc(src);
        setIsLoaded(true);
        if (onLoad) onLoad();
      };

      img.onerror = () => {
        console.warn(`Falha ao carregar imagem: ${src}`);
        setIsLoaded(true); // Marca como carregada mesmo com erro
      };

      img.src = src;
    }
  }, [isInView, src, onLoad]);

  return (
    <div 
      ref={imgRef} 
      className={`relative overflow-hidden ${className}`}
      style={{ width, height }}
    >
      {fadeIn ? (
        <motion.img
          src={imageSrc || placeholder || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg"%3E%3C/svg%3E'}
          alt={alt}
          initial={{ opacity: 0, filter: `blur(${blurAmount}px)` }}
          animate={{ 
            opacity: isLoaded ? 1 : 0.5, 
            filter: isLoaded ? 'blur(0px)' : `blur(${blurAmount}px)` 
          }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={className}
          loading="lazy"
          decoding="async"
          {...props}
        />
      ) : (
        <img
          src={imageSrc || placeholder || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg"%3E%3C/svg%3E'}
          alt={alt}
          className={className}
          loading="lazy"
          decoding="async"
          style={{
            opacity: isLoaded ? 1 : 0.5,
            filter: isLoaded ? 'none' : `blur(${blurAmount}px)`,
            transition: 'opacity 0.5s ease-out, filter 0.5s ease-out',
          }}
          {...props}
        />
      )}
      
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
          <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
});

LazyImage.displayName = 'LazyImage';

export default LazyImage;
