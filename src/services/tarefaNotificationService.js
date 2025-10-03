import { db } from '../firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const criarNotif = async (userId, type, title, message, data = {}) => {
  try {
    const notif = {
      usuarioId: userId,
      tipo: type,
      titulo: title,
      mensagem: message,
      dados: data,
      lida: false,
      timestamp: serverTimestamp(),
      criadaEm: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, 'notificacoes'), notif);
    
    if (('Notification' in window) && Notification.permission === 'granted') {
      new Notification(title, {
        body: message,
        icon: '/logo192.png',
        tag: data.tarefaId || 'notif'
      });
    }

    return docRef.id;
  } catch (error) {
    console.error('Erro criar notificação:', error);
    throw error;
  }
};

export const notificarNovaTarefa = async (funcionarioId, tituloTarefa, prioridade, tarefa) => {
  const emoji = { alta: '🔴', media: '🟡', baixa: '🟢' }[prioridade] || '📋';
  const titulo = `${emoji} Nova Tarefa Atribuída`;
  const mensagem = `Você recebeu uma nova tarefa: "${tituloTarefa}"`;

  await criarNotif(funcionarioId, 'tarefa', titulo, mensagem, {
    tarefaId: tarefa.id,
    tituloTarefa,
    prioridade,
    acao: 'nova_tarefa'
  });
};

export const notificarCronogramaSemanal = async (funcionarioId, totalTarefas, dataInicio, cronograma) => {
  const titulo = '📅 Novo Cronograma Semanal';
  const dataFormatada = new Date(dataInicio + 'T00:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  const mensagem = `Um novo cronograma com ${totalTarefas} tarefas foi criado para você. Início: ${dataFormatada}`;

  await criarNotif(funcionarioId, 'cronograma_semanal', titulo, mensagem, {
    cronogramaId: cronograma.id,
    totalTarefas,
    dataInicio,
    acao: 'cronograma_atribuido'
  });
};

export default { notificarNovaTarefa, notificarCronogramaSemanal };
