import { useEffect } from 'react';
import { usePersistentState } from './usePersistentState';

export function useStatePersistence(componentId, defaultStates = {}) {
  const [persistedStates, setPersistedStates] = usePersistentState(`state_${componentId}`, defaultStates);

  const updateState = (stateKey, value) => {
    setPersistedStates(prev => ({
      ...prev,
      [stateKey]: value
    }));
  };

  const getState = (stateKey) => {
    return persistedStates[stateKey];
  };

  const clearStates = () => {
    setPersistedStates(defaultStates);
  };

  return {
    states: persistedStates,
    updateState,
    getState,
    clearStates
  };
}
