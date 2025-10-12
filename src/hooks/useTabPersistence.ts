import { usePersistentState } from './usePersistentState';
import { useLocation } from 'react-router-dom';

export function useTabPersistence(tabId, defaultTab = '') {
  const location = useLocation();
  const [activeTab, setActiveTab] = usePersistentState(`tab_${tabId}_${location.pathname}`, defaultTab);

  const changeTab = (newTab) => {
    setActiveTab(newTab);
  };

  return [activeTab, changeTab];
}
