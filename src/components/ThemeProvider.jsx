import React, { createContext, useContext, useEffect } from 'react';
import { themes } from '../styles/theme';

const ThemeContext = createContext({
  colors: themes.dark.colors,
  components: themes.dark.components,
});

export const themeColors = {
  colors: {
    // Backgrounds
    background: 'bg-white dark:bg-[#15202B]',
    card: 'bg-white dark:bg-gray-800',
    input: 'bg-white dark:bg-white dark:bg-gray-700',
    modal: 'bg-white dark:bg-gray-800',
    
    // Primary Colors
    primary: 'bg-blue-500 dark:bg-[#1D9BF0] hover:bg-blue-600 dark:hover:bg-[#1a8cd8]',
    secondary: 'bg-gray-200 dark:bg-white dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-[#2C3D4F]',
    danger: 'bg-red-500 dark:bg-[#F4212E] hover:bg-red-600 dark:hover:bg-[#dc1e29]',
    success: 'bg-green-500 dark:bg-[#1D9BF0] hover:bg-green-600 dark:hover:bg-[#1a8cd8]',
    warning: 'bg-yellow-500 dark:bg-[#FFD700] hover:bg-yellow-600 dark:hover:bg-[#E6C200]',
    info: 'bg-blue-100 dark:bg-[#1D9BF0] dark:bg-opacity-10 text-blue-500 dark:text-[#1D9BF0]',
    
    // Text Colors
    text: 'text-gray-900 dark:text-white',
    textSecondary: 'text-gray-600 dark:text-gray-500 dark:text-gray-400',
    textMuted: 'text-gray-500 dark:text-[#536471]',
    
    // Borders
    border: 'border-gray-200 dark:border-gray-300 dark:border-gray-600',
    
    // Form Elements
    inputBg: 'bg-white dark:bg-white dark:bg-gray-700',
    inputBorder: 'border-gray-300 dark:border-gray-300 dark:border-gray-600',
    inputFocus: 'focus:ring-blue-500 dark:focus:ring-[#1D9BF0] focus:border-blue-500 dark:focus:border-[#1D9BF0]',
    inputText: 'text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-500 dark:placeholder-gray-400',
    
    // Status Colors
    successLight: 'bg-green-100 dark:bg-[#1D9BF0] dark:bg-opacity-10 text-green-600 dark:text-[#1D9BF0]',
    warningLight: 'bg-yellow-100 dark:bg-[#FFD700] dark:bg-opacity-10 text-yellow-600 dark:text-[#FFD700]',
    dangerLight: 'bg-red-100 dark:bg-[#F4212E] dark:bg-opacity-10 text-red-600 dark:text-[#F4212E]',
    
    // Tables
    tableHeader: 'bg-gray-100 dark:bg-white dark:bg-gray-700',
    tableRow: 'border-gray-200 dark:border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-white dark:bg-gray-700',
    tableBorder: 'border-gray-200 dark:border-gray-300 dark:border-gray-600',
    
    // Shadows
    shadow: 'shadow-lg shadow-gray-200/50 dark:shadow-[#15202B]/50'
  },
  
  components: {
    // Buttons
    button: 'rounded-full font-medium transition-colors',
    buttonPrimary: 'bg-blue-500 dark:bg-[#1D9BF0] hover:bg-blue-600 dark:hover:bg-[#1a8cd8] text-white',
    buttonSecondary: 'bg-gray-200 dark:bg-white dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-[#2C3D4F] text-gray-900 dark:text-white',
    buttonDanger: 'bg-red-500 dark:bg-[#F4212E] hover:bg-red-600 dark:hover:bg-[#dc1e29] text-white',
    buttonOutline: 'border border-gray-300 dark:border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
    
    // Inputs
    input: 'w-full rounded-full bg-white dark:bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#1D9BF0]',
    
    // Cards
    card: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-300 dark:border-gray-600 rounded-xl shadow-sm',
    
    // Modal
    modal: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-300 dark:border-gray-600 rounded-xl shadow-xl',
    
    // Status Badges
    badge: 'rounded-full px-2 py-1 text-xs font-medium'
  }
};

// Componentes comuns estilizados
export const commonStyles = {
  button: (theme, variant = 'primary') => `
    px-4 py-2 rounded-lg font-medium transition-colors
    ${themeColors[theme][variant]} text-gray-900 dark:text-white
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
  // Força o tema escuro sempre
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light');
    root.classList.add('dark');
  }, []);

  const value = {
    colors: themes.dark.colors,
    components: themes.dark.components
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;


