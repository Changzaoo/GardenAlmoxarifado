import React, { createContext, useContext, useState, useEffect } from 'react';
import { twitterThemeConfig } from '../styles/twitterThemeConfig';

const ThemeContext = createContext({
  theme: 'dark',
  toggleTheme: () => {},
  colors: twitterThemeConfig.colors,
  classes: twitterThemeConfig.classes,
});

export const themeColors = {
  colors: {
    // Backgrounds
    background: 'bg-[#15202B]',
    card: 'bg-[#192734]',
    input: 'bg-[#253341]',
    modal: 'bg-[#192734]',
    
    // Primary Colors
    primary: 'bg-[#1DA1F2] hover:bg-[#1a91da]',
    secondary: 'bg-[#253341] hover:bg-[#2C3D4F]',
    danger: 'bg-[#F4212E] hover:bg-[#dc1e29]',
    success: 'bg-[#1DA1F2] hover:bg-[#1a91da]',
    warning: 'bg-[#FFD700] hover:bg-[#E6C200]',
    info: 'bg-[#1D9BF0] bg-opacity-10 text-[#1D9BF0]',
    
    // Text Colors
    text: 'text-white',
    textSecondary: 'text-[#8899A6]',
    textMuted: 'text-[#536471]',
    
    // Borders
    border: 'border-[#38444D]',
    
    // Form Elements
    inputBg: 'bg-[#253341]',
    inputBorder: 'border-[#38444D]',
    inputFocus: 'focus:ring-[#1DA1F2] focus:border-[#1DA1F2]',
    inputText: 'text-white placeholder-[#8899A6]',
    
    // Status Colors
    successLight: 'bg-[#1DA1F2] bg-opacity-10 text-[#1DA1F2]',
    warningLight: 'bg-[#FFD700] bg-opacity-10 text-[#FFD700]',
    dangerLight: 'bg-[#F4212E] bg-opacity-10 text-[#F4212E]',
    
    // Tables
    tableHeader: 'bg-[#253341]',
    tableRow: 'border-[#38444D] hover:bg-[#253341]',
    tableBorder: 'border-[#38444D]',
    
    // Shadows
    shadow: 'shadow-lg shadow-[#15202B]/50'
  },
  
  components: {
    // Buttons
    button: 'rounded-full font-medium transition-colors',
    buttonPrimary: 'bg-[#1DA1F2] hover:bg-[#1a91da] text-white',
    buttonSecondary: 'bg-[#253341] hover:bg-[#2C3D4F] text-white',
    buttonDanger: 'bg-[#F4212E] hover:bg-[#dc1e29] text-white',
    buttonOutline: 'border border-[#38444D] hover:bg-[#253341] text-white',
    
    // Inputs
    input: 'w-full rounded-full bg-[#253341] border border-[#38444D] text-white placeholder-[#8899A6] focus:outline-none focus:ring-2 focus:ring-[#1DA1F2]',
    
    // Cards
    card: 'bg-[#192734] border border-[#38444D] rounded-xl shadow-sm',
    
    // Modal
    modal: 'bg-[#192734] border border-[#38444D] rounded-xl shadow-xl',
    
    // Status Badges
    badge: 'rounded-full px-2 py-1 text-xs font-medium'
  }
};

// Componentes comuns estilizados
export const commonStyles = {
  button: (theme, variant = 'primary') => `
    px-4 py-2 rounded-lg font-medium transition-colors
    ${themeColors[theme][variant]} text-white
  `,
  input: (theme) => `
    block w-full px-3 py-2 rounded-md shadow-sm 
    ${themeColors[theme].input}
  `,
  card: (theme) => `
    ${themeColors[theme].card} 
    ${themeColors[theme].border} 
    ${themeColors[theme].shadow}
    rounded-lg border
  `,
  modal: (theme) => `
    ${themeColors[theme].modal} 
    ${themeColors[theme].border}
    ${themeColors[theme].shadow}
    rounded-lg border
  `,
  table: (theme) => ({
    container: `${themeColors[theme].card} ${themeColors[theme].shadow} rounded-lg overflow-hidden`,
    header: `${themeColors[theme].tableHeader}`,
    row: `${themeColors[theme].tableRow}`,
    border: `${themeColors[theme].tableBorder}`,
  })
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider');
  }
  return context;
};

const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
  };

  const value = {
    theme,
    toggleTheme,
    colors: themeColors[theme],
    styles: {
      button: (variant) => commonStyles.button(theme, variant),
      input: () => commonStyles.input(theme),
      card: () => commonStyles.card(theme),
      modal: () => commonStyles.modal(theme),
      table: () => commonStyles.table(theme),
    }
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
