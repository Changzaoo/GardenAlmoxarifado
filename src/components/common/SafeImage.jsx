import React, { useState, useEffect } from 'react';
import { Users } from 'lucide-react';

/**
 * 🖼️ SafeImage - Componente seguro para carregamento de imagens
 * 
 * Resolve problemas de:
 * - Imagens corrompidas
 * - URLs expiradas do Firebase
 * - CORS issues
 * - Cache de navegador
 * - Fallback automático para avatar padrão
 * 
 * @param {string} src - URL da imagem
 * @param {string} alt - Texto alternativo
 * @param {string} className - Classes CSS
 * @param {React.Component} fallback - Componente de fallback (opcional)
 * @param {function} onError - Callback de erro (opcional)
 * @param {function} onLoad - Callback de sucesso (opcional)
 * @param {boolean} forceReload - Forçar reload com timestamp (default: false)
 */
const SafeImage = ({ 
  src, 
  alt = 'Imagem', 
  className = '', 
  fallback = null,
  onError = null,
  onLoad = null,
  forceReload = false,
  style = {}
}) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!src) {
      setHasError(true);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setHasError(false);

    // Detectar se é URL do Firebase Storage
    const isFirebaseStorage = src.includes('firebasestorage.googleapis.com') || 
                              src.includes('storage.googleapis.com');
    
    // Adicionar timestamp para forçar reload APENAS se solicitado explicitamente
    let processedUrl = src;
    
    try {
      // Só adicionar timestamp se:
      // 1. forceReload estiver ativo
      // 2. Não for data: URI
      // 3. Não for URL do Firebase (que já tem tokens de acesso)
      if (forceReload && !src.startsWith('data:') && !isFirebaseStorage) {
        const separator = src.includes('?') ? '&' : '?';
        processedUrl = `${src}${separator}_t=${Date.now()}`;
      }

      // Pré-carregar a imagem para detectar erros
      const img = new Image();
      
      img.onload = () => {
        setImageUrl(processedUrl);
        setIsLoading(false);
        setHasError(false);
        if (onLoad) onLoad();
      };

      img.onerror = (error) => {
        console.error('❌ Erro ao carregar imagem:', {
          url: src,
          error: error
        });
        setHasError(true);
        setIsLoading(false);
        if (onError) onError(error);
      };

      // NÃO configurar CORS para URLs do Firebase Storage (causa conflito com tokens)
      // Apenas para URLs externas que realmente precisam
      if (!isFirebaseStorage && !src.startsWith('data:')) {
        img.crossOrigin = 'anonymous';
      }
      
      img.src = processedUrl;

    } catch (error) {
      console.error('❌ Erro ao processar URL da imagem:', error);
      setHasError(true);
      setIsLoading(false);
      if (onError) onError(error);
    }

    // Cleanup
    return () => {
      setImageUrl(null);
    };
  }, [src, forceReload, onLoad, onError]);

  // Fallback padrão
  const defaultFallback = (
    <div className={`flex items-center justify-center bg-gray-200 dark:bg-gray-700 ${className}`}>
      <Users className="w-1/2 h-1/2 text-gray-400 dark:text-gray-500" />
    </div>
  );

  // Loading state
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center bg-gray-200 dark:bg-gray-700 animate-pulse ${className}`}>
        <Users className="w-1/2 h-1/2 text-gray-300 dark:text-gray-600" />
      </div>
    );
  }

  // Error state - mostrar fallback
  if (hasError || !imageUrl) {
    return fallback || defaultFallback;
  }

  // Success state - mostrar imagem
  return (
    <img
      src={imageUrl}
      alt={alt}
      className={className}
      style={style}
      loading="lazy"
      onError={(e) => {
        console.error('❌ Erro ao renderizar imagem:', {
          url: imageUrl,
          originalSrc: src
        });
        setHasError(true);
        if (onError) onError(e);
      }}
    />
  );
};

export default SafeImage;
