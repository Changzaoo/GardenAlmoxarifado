import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAndroidTheme } from '../../hooks/useAndroidTheme';

// Definição completa dos temas
export const THEMES = {
  light: {
    name: 'light',
    colors: {
      // Backgrounds principais
      background: '#FFFFFF',
      backgroundSecondary: '#F8FAFC',
      backgroundTertiary: '#F1F5F9',
      card: '#FFFFFF',
      header: '#FFFFFF',
      sidebar: '#FFFFFF',
      modal: '#FFFFFF',
      dropdown: '#FFFFFF',
      
      // Superfícies interativas
      surface: '#FFFFFF',
      surfaceHover: '#F8FAFC',
      surfaceActive: '#F1F5F9',
      surfaceDisabled: '#F1F5F9',
      
      // Cores primárias
      primary: '#1D9BF0',
      primaryHover: '#1A8CD8',
      primaryActive: '#1B7DC0',
      primaryLight: '#E1F5FE',
      primaryDark: '#0D47A1',
      
      // Cores secundárias
      secondary: '#64748B',
      secondaryHover: '#475569',
      secondaryActive: '#334155',
      secondaryLight: '#F1F5F9',
      
      // Estados e feedback
      success: '#10B981',
      successHover: '#059669',
      successLight: '#D1FAE5',
      warning: '#F59E0B',
      warningHover: '#D97706',
      warningLight: '#FEF3C7',
      danger: '#EF4444',
      dangerHover: '#DC2626',
      dangerLight: '#FEE2E2',
      info: '#3B82F6',
      infoHover: '#2563EB',
      infoLight: '#DBEAFE',
      
      // Textos
      text: '#111827',
      textSecondary: '#6B7280',
      textMuted: '#9CA3AF',
      textLight: '#D1D5DB',
      textInverted: '#FFFFFF',
      
      // Bordas
      border: '#E5E7EB',
      borderSecondary: '#D1D5DB',
      borderMuted: '#F3F4F6',
      borderFocus: '#1D9BF0',
      
      // Shadows
      shadow: 'rgba(0, 0, 0, 0.1)',
      shadowMedium: 'rgba(0, 0, 0, 0.15)',
      shadowLarge: 'rgba(0, 0, 0, 0.2)',
      
      // Navigation
      navActive: '#1D9BF0',
      navHover: '#F1F5F9',
      navText: '#374151',
      navIcon: '#6B7280',
    }
  },
  
  dark: {
    name: 'dark',
    colors: {
      // Backgrounds principais
      background: '#000000',
      backgroundSecondary: '#16181C',
      backgroundTertiary: '#1D1F23',
      card: '#16181C',
      header: '#000000',
      sidebar: '#000000',
      modal: '#16181C',
      dropdown: '#16181C',
      
      // Superfícies interativas
      surface: '#16181C',
      surfaceHover: '#1D1F23',
      surfaceActive: '#22252A',
      surfaceDisabled: '#1D1F23',
      
      // Cores primárias
      primary: '#1D9BF0',
      primaryHover: '#1A8CD8',
      primaryActive: '#1B7DC0',
      primaryLight: '#1D9BF01A', // 10% opacity
      primaryDark: '#0D84C4',
      
      // Cores secundárias
      secondary: '#8B949E',
      secondaryHover: '#B1BAC4',
      secondaryActive: '#C9D1D9',
      secondaryLight: '#21262D',
      
      // Estados e feedback
      success: '#238636',
      successHover: '#2EA043',
      successLight: '#23863610', // 10% opacity
      warning: '#D29922',
      warningHover: '#E2B72B',
      warningLight: '#D2992210', // 10% opacity
      danger: '#DA3633',
      dangerHover: '#E5484D',
      dangerLight: '#DA363310', // 10% opacity
      info: '#1D9BF0',
      infoHover: '#1A8CD8',
      infoLight: '#1D9BF010', // 10% opacity
      
      // Textos
      text: '#E7E9EA',
      textSecondary: '#71767B',
      textMuted: '#536471',
      textLight: '#8B949E',
      textInverted: '#000000',
      
      // Bordas
      border: '#2F3336',
      borderSecondary: '#3E4347',
      borderMuted: '#22252A',
      borderFocus: '#1D9BF0',
      
      // Shadows
      shadow: 'rgba(255, 255, 255, 0.05)',
      shadowMedium: 'rgba(255, 255, 255, 0.1)',
      shadowLarge: 'rgba(255, 255, 255, 0.15)',
      
      // Navigation
      navActive: '#1D9BF0',
      navHover: '#1D1F23',
      navText: '#E7E9EA',
      navIcon: '#71767B',
    }
  }
};

// Context do tema
const ThemeContext = createContext();

// Hook para usar o tema
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider');
  }
  return context;
};

// Provider do tema
export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState('dark');
  
  // Sincroniza o tema com o Android (barra de status e splash screen)
  useAndroidTheme(currentTheme);
  
  // Carrega o tema salvo no localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('workflow-theme');
    if (savedTheme && THEMES[savedTheme]) {
      setCurrentTheme(savedTheme);
    } else {
      // Detecta preferência do sistema
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setCurrentTheme(prefersDark ? 'dark' : 'light');
    }
  }, []);
  
  // Aplica o tema no HTML
  useEffect(() => {
    const root = document.documentElement;
    const theme = THEMES[currentTheme];
    
    // Remove classes de tema anteriores
    root.classList.remove('light', 'dark');
    root.classList.add(currentTheme);
    
    // Define variáveis CSS customizadas
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });
    
    // Atualiza a cor de fundo do body e html para transição suave
    document.body.style.backgroundColor = theme.colors.background;
    document.documentElement.style.backgroundColor = theme.colors.background;
    
    // Salva no localStorage
    localStorage.setItem('workflow-theme', currentTheme);
  }, [currentTheme]);
  
  const toggleTheme = () => {
    setCurrentTheme(prev => prev === 'light' ? 'dark' : 'light');
  };
  
  const setTheme = (themeName) => {
    if (THEMES[themeName]) {
      setCurrentTheme(themeName);
    }
  };
  
  const value = {
    currentTheme,
    theme: THEMES[currentTheme],
    themes: THEMES,
    toggleTheme,
    setTheme,
    isLight: currentTheme === 'light',
    isDark: currentTheme === 'dark',
  };
  
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Utilities para gerar classes CSS
export const getThemeClasses = (theme) => {
  const isDark = theme.name === 'dark';
  
  return {
    // Backgrounds
    background: isDark ? 'bg-black' : 'bg-white',
    backgroundSecondary: isDark ? 'bg-[#16181C]' : 'bg-gray-50',
    backgroundTertiary: isDark ? 'bg-[#1D1F23]' : 'bg-gray-100',
    card: isDark ? 'bg-[#16181C]' : 'bg-white',
    
    // Text
    text: isDark ? 'text-white' : 'text-gray-900',
    textSecondary: isDark ? 'text-[#71767B]' : 'text-gray-600',
    textMuted: isDark ? 'text-[#536471]' : 'text-gray-400',
    
    // Borders
    border: isDark ? 'border-[#2F3336]' : 'border-gray-200',
    
    // Primary
    primary: 'bg-[#1D9BF0] hover:bg-[#1A8CD8] text-white',
    primaryOutline: isDark 
      ? 'border-[#1D9BF0] text-[#1D9BF0] hover:bg-[#1D9BF0] hover:text-white'
      : 'border-[#1D9BF0] text-[#1D9BF0] hover:bg-[#1D9BF0] hover:text-white',
    
    // Secondary
    secondary: isDark 
      ? 'bg-[#16181C] hover:bg-[#1D1F23] text-gray-900 dark:text-white border border-[#2F3336]'
      : 'bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300',
    
    // Success, Warning, Danger
    success: isDark ? 'bg-[#238636] hover:bg-[#2EA043]' : 'bg-green-500 hover:bg-green-600',
    warning: isDark ? 'bg-[#D29922] hover:bg-[#E2B72B]' : 'bg-yellow-500 hover:bg-yellow-600',
    danger: isDark ? 'bg-[#DA3633] hover:bg-[#E5484D]' : 'bg-red-500 hover:bg-red-600',
    
    // Forms
    input: isDark 
      ? 'bg-[#16181C] border-[#2F3336] text-gray-900 dark:text-white placeholder-[#536471] focus:border-[#1D9BF0] focus:ring-[#1D9BF0]'
      : 'bg-white border-gray-200 dark:border-gray-600 text-gray-900 placeholder-gray-400 focus:border-[#1D9BF0] focus:ring-[#1D9BF0]',
    
    // Navigation
    navItem: isDark
      ? 'text-white hover:bg-[#1D1F23] border-[#2F3336]'
      : 'text-gray-700 hover:bg-gray-100 border-gray-200',
    navActive: 'text-[#1D9BF0] bg-[#1D9BF0]/10',
    
    // Shadows
    shadow: isDark ? 'shadow-xl shadow-black/20' : 'shadow-lg shadow-gray-200/50',
  };
};

export default ThemeProvider;


