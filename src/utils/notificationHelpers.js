import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';

/**
 * Cria uma notificação no Firestore
 * @param {string} usuarioId - ID do usuário que receberá a notificação
 * @param {string} tipo - Tipo da notificação: 'tarefa' | 'emprestimo' | 'ferramenta'
 * @param {string} titulo - Título da notificação
 * @param {string} mensagem - Mensagem da notificação
 * @param {object} dados - Dados adicionais específicos do tipo
 */
export const createNotification = async (usuarioId, tipo, titulo, mensagem, dados = {}) => {
  try {

    await addDoc(collection(db, 'notificacoes'), {
      usuarioId,
      tipo,
      titulo,
      mensagem,
      lida: false,
      timestamp: serverTimestamp(),
      dados
    });

  } catch (error) {
    console.error('Erro ao criar notificação:', error);
    throw error;
  }
};

/**
 * Cria notificação quando uma nova tarefa é atribuída
 * @param {string} usuarioId - ID do usuário atribuído
 * @param {string} nomeTarefa - Nome/título da tarefa
 * @param {string} prioridade - Prioridade da tarefa
 * @param {object} tarefaData - Dados completos da tarefa
 */
export const notifyNewTask = async (usuarioId, nomeTarefa, prioridade = 'normal', tarefaData = {}) => {
  const titulo = '📋 Nova tarefa atribuída';
  const mensagem = `Você foi designado para a tarefa "${nomeTarefa}"${prioridade === 'alta' ? ' (Prioridade Alta)' : ''}`;
  
  await createNotification(usuarioId, 'tarefa', titulo, mensagem, {
    nomeTarefa,
    prioridade,
    ...tarefaData
  });
};

/**
 * Cria notificação quando um empréstimo é feito no nome do usuário
 * @param {string} usuarioId - ID do funcionário que pegou emprestado
 * @param {array} ferramentas - Lista de ferramentas emprestadas
 * @param {string} responsavel - Nome do responsável pelo empréstimo
 * @param {object} emprestimoData - Dados completos do empréstimo
 */
export const notifyNewLoan = async (usuarioId, ferramentas, responsavel, emprestimoData = {}) => {
  const ferramentasText = Array.isArray(ferramentas) 
    ? ferramentas.map(f => typeof f === 'string' ? f : f.nome).slice(0, 3).join(', ')
    : ferramentas;
  
  const maisFerramentas = Array.isArray(ferramentas) && ferramentas.length > 3 
    ? ` e mais ${ferramentas.length - 3}` 
    : '';
  
  const titulo = '🔧 Ferramentas emprestadas';
  const mensagem = `${ferramentasText}${maisFerramentas} foram emprestadas em seu nome${responsavel ? ` por ${responsavel}` : ''}`;
  
  await createNotification(usuarioId, 'emprestimo', titulo, mensagem, {
    ferramentas: Array.isArray(ferramentas) ? ferramentas : [ferramentas],
    responsavel,
    ...emprestimoData
  });
};

/**
 * Cria notificação quando uma ferramenta específica é atribuída
 * @param {string} usuarioId - ID do usuário
 * @param {string} nomeFerramenta - Nome da ferramenta
 * @param {string} acao - Ação realizada: 'atribuida' | 'devolvida' | 'danificada'
 * @param {object} ferramentaData - Dados da ferramenta
 */
export const notifyToolAction = async (usuarioId, nomeFerramenta, acao, ferramentaData = {}) => {
  let titulo = '';
  let mensagem = '';
  
  switch (acao) {
    case 'atribuida':
      titulo = '🛠️ Ferramenta atribuída';
      mensagem = `A ferramenta "${nomeFerramenta}" foi atribuída a você`;
      break;
    case 'devolvida':
      titulo = '✅ Devolução registrada';
      mensagem = `A ferramenta "${nomeFerramenta}" foi devolvida`;
      break;
    case 'danificada':
      titulo = '⚠️ Ferramenta danificada';
      mensagem = `A ferramenta "${nomeFerramenta}" foi reportada como danificada`;
      break;
    default:
      titulo = '🔔 Atualização de ferramenta';
      mensagem = `Atualização sobre a ferramenta "${nomeFerramenta}"`;
  }
  
  await createNotification(usuarioId, 'ferramenta', titulo, mensagem, {
    nomeFerramenta,
    acao,
    ...ferramentaData
  });
};

/**
 * Cria notificação quando uma tarefa está próxima do prazo
 * @param {string} usuarioId - ID do usuário
 * @param {string} nomeTarefa - Nome da tarefa
 * @param {Date} prazo - Data do prazo
 */
export const notifyTaskDeadline = async (usuarioId, nomeTarefa, prazo) => {
  const titulo = '⏰ Prazo próximo';
  const mensagem = `A tarefa "${nomeTarefa}" está próxima do prazo`;
  
  await createNotification(usuarioId, 'tarefa', titulo, mensagem, {
    nomeTarefa,
    prazo
  });
};

export default {
  createNotification,
  notifyNewTask,
  notifyNewLoan,
  notifyToolAction,
  notifyTaskDeadline
};
