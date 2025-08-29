import { useState, useEffect } from 'react';

export function useLocalStorage(key, initialValue) {
  // Função para obter o valor inicial
  const getInitialValue = () => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  };

  // Criar estado com o valor inicial do localStorage ou o valor padrão
  const [storedValue, setStoredValue] = useState(getInitialValue);

  // Atualizar localStorage quando o valor mudar
  useEffect(() => {
    try {
      if (storedValue === undefined) {
        window.localStorage.removeItem(key);
      } else {
        window.localStorage.setItem(key, JSON.stringify(storedValue));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}
