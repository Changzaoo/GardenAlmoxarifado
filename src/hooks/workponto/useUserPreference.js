import { useState, useEffect } from 'react';

export const useUserPreference = (usuarioId) => {
  const [userPreference, setUserPreference] = useState(null);

  useEffect(() => {
    if (!usuarioId) return;
    
    const savedPreference = localStorage.getItem(`workponto_preference_${usuarioId}`);
    if (savedPreference) {
      setUserPreference(savedPreference);
    }
  }, [usuarioId]);

  const savePreference = (preference) => {
    if (usuarioId) {
      localStorage.setItem(`workponto_preference_${usuarioId}`, preference);
      setUserPreference(preference);
    }
  };

  return {
    userPreference,
    savePreference
  };
};
