import React from 'react';

/**
 * HOC para memoizar componentes automaticamente
 * Compara props superficialmente para prevenir re-renders desnecessários
 */
export const withMemo = (Component, propsAreEqual) => {
  return React.memo(Component, propsAreEqual);
};

/**
 * HOC para lazy loading de componentes
 */
export const withLazy = (importFunc) => {
  return React.lazy(importFunc);
};

/**
 * Comparador de props padrão que ignora funções
 * Útil quando callbacks são recriados mas fazem a mesma coisa
 */
export const arePropsEqualIgnoreFunctions = (prevProps, nextProps) => {
  const prevKeys = Object.keys(prevProps);
  const nextKeys = Object.keys(nextProps);

  if (prevKeys.length !== nextKeys.length) {
    return false;
  }

  return prevKeys.every(key => {
    const prevValue = prevProps[key];
    const nextValue = nextProps[key];

    // Ignorar funções na comparação
    if (typeof prevValue === 'function' && typeof nextValue === 'function') {
      return true;
    }

    // Comparação shallow para outros tipos
    return prevValue === nextValue;
  });
};

/**
 * Comparador específico para listas
 * Compara apenas length e alguns IDs para performance
 */
export const areListPropsEqual = (prevProps, nextProps) => {
  // Se as listas têm tamanhos diferentes, são diferentes
  if (prevProps.items?.length !== nextProps.items?.length) {
    return false;
  }

  // Se ambas vazias, são iguais
  if (!prevProps.items?.length && !nextProps.items?.length) {
    return true;
  }

  // Comparar apenas os primeiros e últimos IDs (otimização)
  const prevItems = prevProps.items || [];
  const nextItems = nextProps.items || [];
  
  if (prevItems.length === 0 && nextItems.length === 0) return true;
  if (prevItems.length !== nextItems.length) return false;
  
  // Comparar primeiro e último item
  const firstEqual = prevItems[0]?.id === nextItems[0]?.id;
  const lastEqual = prevItems[prevItems.length - 1]?.id === nextItems[prevItems.length - 1]?.id;
  
  return firstEqual && lastEqual;
};

export default {
  withMemo,
  withLazy,
  arePropsEqualIgnoreFunctions,
  areListPropsEqual
};
