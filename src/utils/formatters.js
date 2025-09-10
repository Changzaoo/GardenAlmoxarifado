export const formatarData = (data) => {
  if (!data) return '-';
  const date = new Date(data);
  return date.toLocaleDateString('pt-BR');
};

export const formatarDataHora = (data) => {
  if (!data) return '-';
  const date = new Date(data);
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
