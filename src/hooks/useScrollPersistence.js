import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function useScrollPersistence() {
  const location = useLocation();

  useEffect(() => {
    // Restore scroll position when component mounts
    const savedScrollPosition = localStorage.getItem(`scroll_${location.pathname}`);
    if (savedScrollPosition) {
      const [x, y] = JSON.parse(savedScrollPosition);
      window.scrollTo(x, y);
    }

    // Save scroll position when user scrolls
    const handleScroll = () => {
      const position = [window.scrollX, window.scrollY];
      localStorage.setItem(`scroll_${location.pathname}`, JSON.stringify(position));
    };

    // Use requestAnimationFrame to throttle scroll events
    let ticking = false;
    const scrollListener = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', scrollListener);

    // Save scroll position before unmounting
    return () => {
      handleScroll();
      window.removeEventListener('scroll', scrollListener);
    };
  }, [location.pathname]);
}

// Component to wrap around your app
export function ScrollPersistence() {
  useScrollPersistence();
  return null;
}
