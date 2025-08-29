import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function RouteStateManager() {
  const location = useLocation();

  useEffect(() => {
    // Save current route to localStorage
    localStorage.setItem('lastRoute', location.pathname);
    // Save any search params or state
    localStorage.setItem('lastRouteState', JSON.stringify({
      search: location.search,
      state: location.state
    }));
  }, [location]);

  return null; // This is a utility component that doesn't render anything
}
