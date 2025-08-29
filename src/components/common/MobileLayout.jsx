import React from 'react';

export const MobileContainer = ({ children, className = '' }) => (
  <div className={`mobile-container ${className}`}>
    {children}
  </div>
);

export const MobileContent = ({ children, className = '' }) => (
  <div className={`mobile-content ${className}`}>
    {children}
  </div>
);

export const MobileHeader = ({ children, className = '' }) => (
  <header className={`sticky top-0 z-50 bg-white dark:bg-[#192734] shadow-md ${className}`}>
    {children}
  </header>
);

export const MobileFooter = ({ children, className = '' }) => (
  <footer className={`mobile-bottom-safe ${className}`}>
    {children}
  </footer>
);
