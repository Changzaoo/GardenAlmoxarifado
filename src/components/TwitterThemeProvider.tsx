import React, { createContext, useContext } from 'react';
import { twitterThemeConfig } from '../styles/twitterThemeConfig';

const TwitterThemeContext = createContext({
  colors: twitterThemeConfig.colors,
  classes: twitterThemeConfig.classes,
});

export const TwitterThemeProvider = ({ children }) => {
  return (
    <TwitterThemeContext.Provider value={twitterThemeConfig}>
      {children}
    </TwitterThemeContext.Provider>
  );
};

export const useTwitterTheme = () => {
  const context = useContext(TwitterThemeContext);
  if (!context) {
    throw new Error('useTwitterTheme must be used within a TwitterThemeProvider');
  }
  return context;
};
