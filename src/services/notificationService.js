import { db } from '../firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Serviço de Notificações do Sistema
 * Gerencia criação de notificações no Firestore e notificações push do navegador
 */

/**
 * Cria uma notificação no Firestore e envia notificação push
 */
const criarNotificacao = async (usuarioId, tipo, titulo, mensagem, dados = {}) => {
  try {

    const notificacao = {
      usuarioId,
      tipo,
      titulo,
      mensagem,
      dados,
      lida: false,
      timestamp: serverTimestamp(),
      criadaEm: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, 'notificacoes'), notificacao);

    await enviarNotificacaoPush(titulo, mensagem, dados);

    return docRef.id;
  } catch (error) {
    console.error('❌ Erro ao criar notificação:', error);
    throw error;
  }
};

/**
 * Envia notificação push do navegador
 */
const enviarNotificacaoPush = async (titulo, mensagem, dados = {}) => {
  try {
    if (!('Notification' in window)) {

      return;
    }

    if (Notification.permission === 'granted') {

      const notification = new Notification(titulo, {
        body: mensagem,
        icon: '/logo.png',
        badge: '/logo.png',
        tag: dados.tarefaId || 'notification',
        requireInteraction: false,
        silent: false,
        data: dados
      });

      setTimeout(() => notification.close(), 5000);

      notification.onclick = function(event) {
        event.preventDefault();
        window.focus();
        
        if (dados.url) {
          window.location.href = dados.url;
        }
        
        notification.close();
      };

    }
  } catch (error) {
    console.error('❌ Erro ao enviar notificação push:', error);
  }
};

/**
 * Solicita permissão para notificações
 */
const solicitarPermissaoNotificacoes = async () => {
  try {
    if (!('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  } catch (error) {
    console.error('❌ Erro ao solicitar permissão:', error);
    return false;
  }
};

/**
 * Verifica se notificações estão disponíveis
 */
const notificacoesDisponiveis = () => {
  return 'Notification' in window && Notification.permission === 'granted';
};

/**
 * Notificação de nova tarefa
 */
const notificarNovaTarefa = async (usuarioId, tarefa) => {
  return await criarNotificacao(
    usuarioId,
    'tarefa',
    '📋 Nova Tarefa Atribuída',
    tarefa.titulo || 'Você tem uma nova tarefa pendente',
    {
      tarefaId: tarefa.id,
      prioridade: tarefa.prioridade,
      url: '/tarefas'
    }
  );
};

/**
 * Notificação de nova mensagem
 */
const notificarNovaMensagem = async (usuarioId, mensagem, remetente) => {
  return await criarNotificacao(
    usuarioId,
    'mensagem',
    `💬 Nova mensagem de ${remetente}`,
    mensagem.texto || 'Você recebeu uma nova mensagem',
    {
      mensagemId: mensagem.id,
      remetenteId: mensagem.remetenteId,
      url: '/conversas'
    }
  );
};

/**
 * Notificação de avaliação
 */
const notificarAvaliacao = async (usuarioId, avaliacao) => {
  return await criarNotificacao(
    usuarioId,
    'avaliacao',
    '⭐ Nova Avaliação Recebida',
    `Você recebeu ${avaliacao.pontos || 0} pontos`,
    {
      avaliacaoId: avaliacao.id,
      pontos: avaliacao.pontos,
      url: '/ranking'
    }
  );
};

/**
 * Notificação de sistema
 */
const notificarSistema = async (usuarioId, titulo, mensagem, dados = {}) => {
  return await criarNotificacao(
    usuarioId,
    'sistema',
    titulo,
    mensagem,
    dados
  );
};

/**
 * Notificação de inventário
 */
const notificarInventario = async (usuarioId, titulo, mensagem, dados = {}) => {
  return await criarNotificacao(
    usuarioId,
    'inventario',
    titulo,
    mensagem,
    {
      ...dados,
      url: '/inventario'
    }
  );
};

/**
 * Notificação de empréstimo
 */
const notificarEmprestimo = async (usuarioId, emprestimo, acao = 'novo') => {
  const titulos = {
    novo: '📦 Novo Empréstimo',
    devolucao: '✅ Devolução Confirmada',
    atraso: '⚠️ Empréstimo em Atraso',
    lembrete: '🔔 Lembrete de Devolução'
  };

  const mensagens = {
    novo: `Empréstimo de ${emprestimo.itemNome} registrado`,
    devolucao: `${emprestimo.itemNome} devolvido com sucesso`,
    atraso: `${emprestimo.itemNome} está em atraso`,
    lembrete: `Lembre-se de devolver ${emprestimo.itemNome}`
  };

  return await criarNotificacao(
    usuarioId,
    'inventario',
    titulos[acao] || titulos.novo,
    mensagens[acao] || mensagens.novo,
    {
      emprestimoId: emprestimo.id,
      itemNome: emprestimo.itemNome,
      url: '/emprestimos'
    }
  );
};

export {
  criarNotificacao,
  enviarNotificacaoPush,
  solicitarPermissaoNotificacoes,
  notificacoesDisponiveis,
  notificarNovaTarefa,
  notificarNovaMensagem,
  notificarAvaliacao,
  notificarSistema,
  notificarInventario,
  notificarEmprestimo
};

export default {
  criarNotificacao,
  enviarNotificacaoPush,
  solicitarPermissaoNotificacoes,
  notificacoesDisponiveis,
  notificarNovaTarefa,
  notificarNovaMensagem,
  notificarAvaliacao,
  notificarSistema,
  notificarInventario,
  notificarEmprestimo
};
