import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext({
  theme: 'light',
  toggleTheme: () => {},
});

// Tema padrão do sistema
export const themeColors = {
  light: {
    primary: 'bg-green-600 hover:bg-green-700',
    secondary: 'bg-blue-600 hover:bg-blue-700',
    danger: 'bg-red-600 hover:bg-red-700',
    warning: 'bg-yellow-500 hover:bg-yellow-600',
    success: 'bg-green-600 hover:bg-green-700',
    info: 'bg-blue-500 hover:bg-blue-600',
    
    // Backgrounds
    background: 'bg-gray-50 dark:bg-gray-900',
    card: 'bg-white dark:bg-gray-800',
    navbar: 'bg-white dark:bg-gray-800',
    modal: 'bg-white dark:bg-gray-800',
    
    // Text
    text: 'text-gray-900 dark:text-white',
    textSecondary: 'text-gray-600 dark:text-gray-300',
    textMuted: 'text-gray-500 dark:text-gray-400',
    
    // Borders
    border: 'border-gray-200',
    
    // Form elements
    input: 'bg-white border-gray-300 focus:ring-green-500 focus:border-green-500',
    
    // Table
    tableHeader: 'bg-gray-50',
    tableRow: 'hover:bg-gray-50',
    tableBorder: 'border-gray-200',
    
    // Status
    activeStatus: 'bg-green-100 text-green-800',
    pendingStatus: 'bg-yellow-100 text-yellow-800',
    inactiveStatus: 'bg-gray-100 text-gray-800',
    
    // Shadows
    shadow: 'shadow-md',
  },
  dark: {
    primary: 'bg-green-600 hover:bg-green-700',
    secondary: 'bg-blue-600 hover:bg-blue-700',
    danger: 'bg-red-600 hover:bg-red-700',
    warning: 'bg-yellow-500 hover:bg-yellow-600',
    success: 'bg-green-600 hover:bg-green-700',
    info: 'bg-blue-500 hover:bg-blue-600',
    
    // Backgrounds
    background: 'bg-gray-900',
    card: 'bg-gray-800',
    navbar: 'bg-gray-800',
    modal: 'bg-gray-800',
    
    // Text
    text: 'text-white',
    textSecondary: 'text-gray-300',
    textMuted: 'text-gray-400',
    
    // Borders
    border: 'border-gray-700',
    
    // Form elements
    input: 'bg-gray-700 border-gray-600 focus:ring-green-500 focus:border-green-500 text-white',
    
    // Table
    tableHeader: 'bg-gray-900',
    tableRow: 'hover:bg-gray-700',
    tableBorder: 'border-gray-700',
    
    // Status
    activeStatus: 'bg-green-900 text-green-300',
    pendingStatus: 'bg-yellow-900 text-yellow-300',
    inactiveStatus: 'bg-gray-900 text-gray-300',
    
    // Shadows
    shadow: 'shadow-lg shadow-gray-900/50',
  },
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
