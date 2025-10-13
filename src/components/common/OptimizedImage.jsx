import React, { useState, useEffect, useRef } from 'react';

/**
 * Componente de imagem otimizado com lazy loading e placeholder
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

    const img = new Image();
    
    img.onload = () => {
      setImageSrc(src);
      setIsLoading(false);
      setHasError(false);
      if (onLoad) onLoad();
    };

    img.onerror = () => {
      setHasError(true);
      setIsLoading(false);
      if (onError) onError();
    };

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
