// Classes Tailwind comuns para modais
export const modalStyles = {
  overlay: 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4',
  container: {
    light: 'bg-white rounded-lg shadow-xl',
    dark: 'bg-gray-800 rounded-lg shadow-xl'
  },
  header: {
    base: 'flex justify-between items-center mb-4',
    title: {
      light: 'text-gray-900',
      dark: 'text-white'
    }
  },
  closeButton: {
    light: 'text-gray-400 hover:text-gray-600',
    dark: 'text-gray-500 hover:text-gray-300'
  },
  content: {
    light: 'text-gray-600',
    dark: 'text-gray-300'
  },
  input: {
    light: 'bg-white border-gray-300 text-gray-900 focus:ring-green-500 focus:border-green-500',
    dark: 'bg-gray-700 border-gray-600 text-white focus:ring-green-500 focus:border-green-500'
  },
  label: {
    light: 'text-gray-700',
    dark: 'text-gray-300'
  },
  button: {
    primary: {
      light: 'bg-green-600 hover:bg-green-700 text-white',
      dark: 'bg-green-600 hover:bg-green-700 text-white'
    },
    secondary: {
      light: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
      dark: 'bg-gray-700 hover:bg-gray-600 text-gray-300'
    },
    danger: {
      light: 'bg-red-600 hover:bg-red-700 text-white',
      dark: 'bg-red-600 hover:bg-red-700 text-white'
    }
  },
  // Classes utilitárias comuns
  utils: {
    divider: {
      light: 'border-gray-200',
      dark: 'border-gray-700'
    },
    scrollable: 'max-h-[80vh] overflow-y-auto',
    transition: 'transition-all duration-200'
  }
};
