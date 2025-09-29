// Configuração dos tipos de avaliação
export const tiposAvaliacao = [
  { 
    valor: 'positiva', 
    label: 'Positiva', 
    cor: 'text-green-500 bg-green-500/20' 
  },
  { 
    valor: 'negativa', 
    label: 'Negativa', 
    cor: 'text-red-500 bg-red-500/20' 
  },
  { 
    valor: 'neutro', 
    label: 'Neutro', 
    cor: 'text-gray-500 bg-gray-500/20' 
  },
  { 
    valor: 'melhoria', 
    label: 'Melhoria Necessária', 
    cor: 'text-yellow-500 bg-yellow-500/20' 
  },
  { 
    valor: 'destaque', 
    label: 'Destaque', 
    cor: 'text-purple-500 bg-purple-500/20' 
  }
];

// Funções auxiliares
export const getTipoAvaliacaoConfig = (tipo) => {
  return tiposAvaliacao.find(t => t.valor === tipo) || {
    valor: 'outro',
    label: 'Avaliação',
    cor: 'text-gray-500 bg-gray-500/20'
  };
};