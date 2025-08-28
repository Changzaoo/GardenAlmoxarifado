// Twitter theme configuration
export const twitterThemeConfig = {
  colors: {
    // Backgrounds
    background: '#15202B',
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
    success: '#1DA1F2',
    successHover: '#1a91da',
    warning: '#FFD700',
    warningHover: '#E6C200',
    
    // Text Colors
    text: '#FFFFFF',
    textSecondary: '#8899A6',
    textMuted: '#536471',
    
    // Borders
    border: '#38444D',
  },
  
  // Tailwind Classes
  classes: {
    // Common
    background: 'bg-[#15202B]',
    card: 'bg-[#192734] border border-[#38444D] rounded-xl shadow-sm',
    modal: 'bg-[#192734] border border-[#38444D] rounded-xl shadow-xl',
    
    // Typography
    text: 'text-white',
    textSecondary: 'text-[#8899A6]',
    textMuted: 'text-[#536471]',
    
    // Buttons
    button: {
      base: 'rounded-full font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#1DA1F2] focus:ring-offset-2 focus:ring-offset-[#15202B] disabled:opacity-50',
      primary: 'bg-[#1DA1F2] hover:bg-[#1a91da] text-white',
      secondary: 'bg-[#253341] hover:bg-[#2C3D4F] text-white',
      danger: 'bg-[#F4212E] hover:bg-[#dc1e29] text-white',
      outline: 'border border-[#38444D] hover:bg-[#253341] text-white',
      sizes: {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2',
        lg: 'px-6 py-3 text-lg'
      }
    },
    
    // Inputs
    input: {
      base: 'w-full rounded-full bg-[#253341] border border-[#38444D] text-white placeholder-[#8899A6] transition-all',
      focus: 'focus:outline-none focus:ring-2 focus:ring-[#1DA1F2] focus:border-[#1DA1F2]',
      error: 'border-[#F4212E] focus:ring-[#F4212E]',
      sizes: {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2',
        lg: 'px-5 py-3 text-lg'
      }
    },
    
    // Tables
    table: {
      wrapper: 'border border-[#38444D] rounded-xl overflow-hidden',
      header: 'bg-[#253341] text-[#8899A6]',
      row: 'border-t border-[#38444D] hover:bg-[#253341]',
      cell: 'px-4 py-3'
    },
    
    // Status Badges
    badge: {
      base: 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
      info: 'bg-[#1DA1F2] bg-opacity-10 text-[#1DA1F2]',
      success: 'bg-[#1DA1F2] bg-opacity-10 text-[#1DA1F2]',
      warning: 'bg-[#FFD700] bg-opacity-10 text-[#FFD700]',
      danger: 'bg-[#F4212E] bg-opacity-10 text-[#F4212E]'
    },
    
    // Dropdowns
    dropdown: {
      button: 'inline-flex items-center justify-center gap-2 rounded-full bg-[#253341] px-4 py-2 text-sm text-white hover:bg-[#2C3D4F] focus:outline-none focus:ring-2 focus:ring-[#1DA1F2]',
      items: 'absolute right-0 mt-2 w-56 origin-top-right rounded-xl bg-[#192734] border border-[#38444D] shadow-lg focus:outline-none',
      item: 'block px-4 py-2 text-sm text-white hover:bg-[#253341]'
    },
    
    // Forms
    form: {
      group: 'space-y-2',
      label: 'block text-sm font-medium text-[#8899A6]',
      error: 'mt-1 text-sm text-[#F4212E]',
      hint: 'mt-1 text-sm text-[#8899A6]'
    }
  }
};
