// Objeto com classes Tailwind para temas escuros
export const darkModeClasses = {
  // Cards e containers principais
  card: 'bg-white dark:bg-gray-800 rounded-lg shadow',
  cardContent: 'p-6',
  
  // Texto
  text: 'text-gray-900 dark:text-white',
  textMuted: 'text-gray-600 dark:text-gray-300',
  
  // Inputs e formulários
  input: 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-green-500 dark:focus:ring-green-400',
  select: 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white',
  
  // Tabelas
  tableRow: 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700',
  tableCell: 'text-gray-900 dark:text-white',
  tableHeader: 'text-gray-500 dark:text-gray-400',
  
  // Modais
  modal: 'bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6',
  
  // Dropdowns e menus
  dropdown: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg',
  dropdownItem: 'hover:bg-gray-50 dark:hover:bg-gray-700',
  
  // Botões
  buttonPrimary: 'bg-green-600 dark:bg-green-500 text-white hover:bg-green-700 dark:hover:bg-green-600',
  buttonSecondary: 'bg-white dark:bg-gray-700 text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600',
  
  // Headers e títulos
  pageHeader: 'text-2xl font-bold text-gray-800 dark:text-white',
  sectionHeader: 'text-lg font-semibold text-gray-900 dark:text-white'
};
