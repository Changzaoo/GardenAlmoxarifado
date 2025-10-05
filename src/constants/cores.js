// 🎨 Configuração de Cores do Sistema

export const CORES = {
  // Cor principal do sistema (Twitter Blue)
  primaria: '#1d9bf0',
  primariaHover: '#1a8cd8',
  primariaLight: '#e8f5fe',
  
  // Cores de status
  sucesso: '#10b981',
  erro: '#ef4444',
  aviso: '#f59e0b',
  info: '#3b82f6',
  
  // Cores neutras (dark mode)
  fundo: '#0f172a',
  fundoCard: '#1e293b',
  texto: '#f1f5f9',
  textoSecundario: '#94a3b8',
  borda: '#334155'
};

// Classes Tailwind correspondentes
export const CLASSES_TAILWIND = {
  // Botão primário
  botaoPrimario: 'bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white',
  
  // Botão secundário
  botaoSecundario: 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white',
  
  // Botão de perigo
  botaoPerigo: 'bg-red-500 hover:bg-red-600 text-white',
  
  // Botão de sucesso
  botaoSucesso: 'bg-green-500 hover:bg-green-600 text-white',
  
  // Input focus
  inputFocus: 'focus:ring-2 focus:ring-[#1d9bf0] focus:border-[#1d9bf0]',
  
  // Card
  card: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
  
  // Badge
  badge: 'bg-[#1d9bf0] text-white'
};
