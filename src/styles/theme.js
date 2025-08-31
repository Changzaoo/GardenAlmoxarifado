// Configuração do tema do Twitter
export const themes = {
  dark: {
    colors: {
      // Backgrounds
      background: '#15202B',
      backgroundSecondary: '#192734',
      card: '#192734',
      input: '#253341',
      hover: '#20304A',
      modal: '#192734',
      
      // Primary Colors
      primary: '#1DA1F2',
      primaryHover: '#1a91da',
      secondary: '#253341',
      secondaryHover: '#2C3D4F',
      danger: '#F4212E',
      dangerHover: '#dc1e29',
      success: '#00BA7C',
      successHover: '#00A36C',
      warning: '#FFD700',
      warningHover: '#E6C200',
      
      // Text Colors
      text: '#FFFFFF',
      textSecondary: '#8899A6',
      textMuted: '#536471',
      textAccent: '#1DA1F2',
      textAccent: '#1DA1F2',
      
      // Borders
      border: '#38444D',
      borderFocus: '#1DA1F2',
      
      // Status
      info: '#1D9BF0',
      error: '#F4212E',
      neutral: '#8899A6',
    },
    
    components: {
      // Common
      page: 'min-h-screen bg-[#15202B] text-white p-4',
      card: 'bg-[#192734] border border-[#38444D] rounded-2xl shadow-sm',
      modal: 'bg-[#192734] border border-[#38444D] rounded-xl shadow-xl',
      
      // Typography
      text: 'text-white',
      textSecondary: 'text-[#8899A6]',
      textMuted: 'text-[#536471]',
      
      // Inputs
      input: {
        base: 'w-full rounded-full bg-[#253341] border border-[#38444D] text-white placeholder-[#8899A6] transition-all',
        focus: 'focus:outline-none focus:ring-2 focus:ring-[#1DA1F2] focus:border-[#1DA1F2]',
        error: 'border-[#F4212E] focus:ring-[#F4212E]',
      },
      
      // Tables
      table: {
        wrapper: 'border border-[#38444D] rounded-xl overflow-hidden',
        header: 'bg-[#253341] text-[#8899A6]',
        row: 'border-t border-[#38444D] hover:bg-[#253341]',
        cell: 'px-4 py-3 text-white'
      },
      
      // Forms
      form: {
        group: 'space-y-2',
        label: 'block text-sm font-medium text-[#8899A6]',
        error: 'mt-1 text-sm text-[#F4212E]',
        hint: 'mt-1 text-sm text-[#8899A6]'
      }
    }
  }
};

// Hook para usar o tema
export const useTheme = () => {
  return themes.dark;
};

// Função para obter cores específicas do tema
export const getThemeColors = () => {
  return themes.dark.colors;
};

// Função para obter estilos de componentes do tema
export const getThemeComponents = () => {
  return themes.dark.components;
};
