import { useState, useEffect } from 'react';

export function usePersistentState(key, defaultValue) {
  // Get stored value from localStorage or use default
  const [value, setValue] = useState(() => {
    const storedValue = localStorage.getItem(key);
    if (storedValue !== null) {
      try {
        return JSON.parse(storedValue);
      } catch {
        return defaultValue;
      }
    }
    return defaultValue;
  });

  // Update localStorage whenever value changes
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}
