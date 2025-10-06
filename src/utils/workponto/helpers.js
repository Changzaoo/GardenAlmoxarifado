export const getStatusDia = (pontoHoje) => {
  if (!pontoHoje) {
    return { 
      status: 'pending', 
      text: 'Não bateu ponto hoje', 
      color: 'gray' 
    };
  }
  
  if (pontoHoje.tipo === 'entrada' && !pontoHoje.horasTrabalhadas) {
    return { 
      status: 'working', 
      text: 'Trabalhando agora', 
      color: 'blue' 
    };
  }
  
  if (pontoHoje.tipo === 'saida') {
    return { 
      status: 'completed', 
      text: 'Jornada concluída', 
      color: 'green' 
    };
  }

  return { 
    status: 'pending', 
    text: 'Pendente', 
    color: 'yellow' 
  };
};

export const getLocation = () => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      () => resolve(null)
    );
  });
};
