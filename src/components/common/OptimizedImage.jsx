import React, { useState, useEffect, useRef } from 'react';

/**
 * Componente de imagem otimizado com lazy loading e placeholder
 * 
 * Suporte para:
 * - Firebase Storage (firebasestorage.googleapis.com)
 * - Discord CDN (cdn.discordapp.com, media.discordapp.net)
 * - Data URIs (data:image/...)
 * - URLs externas genéricas
 * 
 * CORS automático apenas para URLs que necessitam
 */
const OptimizedImage = ({
  src,
  alt = '',
  className = '',
  placeholder = null,
  width,
  height,
  onLoad,
  onError,
  ...props
}) => {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);
  const observerRef = useRef(null);

  useEffect(() => {
    // Intersection Observer para lazy loading
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            loadImage();
            if (observerRef.current && imgRef.current) {
              observerRef.current.unobserve(imgRef.current);
            }
          }
        });
      },
      {
        rootMargin: '50px', // Começa a carregar 50px antes de aparecer
      }
    );

    if (imgRef.current) {
      observerRef.current.observe(imgRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [src]);

  const loadImage = () => {
    if (!src) {
      setHasError(true);
      setIsLoading(false);
      return;
    }

    // Detectar tipo de URL
    const isFirebaseStorage = src.includes('firebasestorage.googleapis.com') || 
                              src.includes('storage.googleapis.com');
    
    const isDiscordCDN = src.includes('cdn.discordapp.com') || 
                         src.includes('cdn.discord.com') ||
                         src.includes('media.discordapp.net') ||
                         src.includes('images-ext-1.discordapp.net') ||
                         src.includes('images-ext-2.discordapp.net');
    
    const isDataURI = src.startsWith('data:');

    const img = new Image();
    
    img.onload = () => {
      console.log('✅ OptimizedImage carregada:', {
        url: src,
        tipo: isDiscordCDN ? 'Discord CDN' : isFirebaseStorage ? 'Firebase Storage' : isDataURI ? 'Data URI' : 'URL Externa'
      });
      setImageSrc(src);
      setIsLoading(false);
      setHasError(false);
      if (onLoad) onLoad();
    };

    img.onerror = (error) => {
      console.error('❌ Erro OptimizedImage:', {
        url: src,
        tipo: isDiscordCDN ? 'Discord CDN' : isFirebaseStorage ? 'Firebase Storage' : isDataURI ? 'Data URI' : 'URL Externa',
        error
      });
      setHasError(true);
      setIsLoading(false);
      if (onError) onError();
    };

    // CORS config:
    // NÃO usar crossOrigin para Discord, Firebase e Data URIs
    if (!isFirebaseStorage && !isDiscordCDN && !isDataURI) {
      img.crossOrigin = 'anonymous';
    }

    img.src = src;
  };

  const placeholderStyle = {
    backgroundColor: '#f3f4f6',
    backgroundImage: 'linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%)',
    backgroundSize: '200% 100%',
    animation: isLoading ? 'shimmer 1.5s infinite' : 'none',
  };

  return (
    <>
      <style>
        {`
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
        `}
      </style>
      <img
        ref={imgRef}
        src={imageSrc || placeholder}
        alt={alt}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        style={!imageSrc || isLoading ? placeholderStyle : undefined}
        width={width}
        height={height}
        loading="lazy"
        {...props}
      />
    </>
  );
};

export default React.memo(OptimizedImage);
