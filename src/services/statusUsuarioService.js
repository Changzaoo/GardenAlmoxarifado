/**
 * Serviço de Gerenciamento de Status Online/Offline de Usuários
 * 
 * Gerencia:
 * - Status de presença (online/offline/ausente/ocupado)
 * - Timestamp de última atividade
 * - Atualização automática de status
 */

import { doc, updateDoc, onSnapshot, Timestamp, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { STATUS_USUARIO } from '../constants/usuarioModel';

class StatusUsuarioService {
  constructor() {
    this.usuarioId = null;
    this.intervalId = null;
    this.listenerUnsubscribe = null;
    this.ultimaAtividade = Date.now();
    this.TEMPO_AUSENTE = 5 * 60 * 1000; // 5 minutos
    this.INTERVALO_ATUALIZACAO = 30 * 1000; // 30 segundos
  }

  /**
   * Inicia o monitoramento de status para um usuário
   * @param {string} usuarioId - ID do usuário
   */
  async iniciar(usuarioId) {
    if (!usuarioId) {
      console.error('❌ StatusService: ID de usuário não fornecido');
      return;
    }

    this.usuarioId = usuarioId;

    // Definir como online ao iniciar
    await this.atualizarStatus(STATUS_USUARIO.ONLINE);

    // Monitorar atividade do usuário
    this.monitorarAtividade();

    // Atualizar status periodicamente
    this.iniciarAtualizacaoAutomatica();

    // Atualizar status ao sair
    this.configurarEventosSaida();
  }

  /**
   * Para o monitoramento de status
   */
  async parar() {

    // Limpar intervalo
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    // Remover listeners
    if (this.listenerUnsubscribe) {
      this.listenerUnsubscribe();
      this.listenerUnsubscribe = null;
    }

    // Definir como offline
    if (this.usuarioId) {
      await this.atualizarStatus(STATUS_USUARIO.OFFLINE);
    }

    this.usuarioId = null;
  }

  /**
   * Atualiza o status do usuário no Firestore
   * @param {string} novoStatus - Novo status (online/offline/ausente/ocupado)
   */
  async atualizarStatus(novoStatus) {
    if (!this.usuarioId) return;

    try {
      const usuarioRef = doc(db, 'usuario', this.usuarioId);
      await updateDoc(usuarioRef, {
        status: novoStatus,
        ultimaVez: serverTimestamp()
      });

    } catch (error) {
      console.error('❌ Erro ao atualizar status:', error);
    }
  }

  /**
   * Monitora atividade do usuário (mouse, teclado, scroll)
   */
  monitorarAtividade() {
    const eventos = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    
    const registrarAtividade = () => {
      this.ultimaAtividade = Date.now();
      
      // Se estava ausente, voltar para online
      if (this.statusAtual === STATUS_USUARIO.AUSENTE) {
        this.atualizarStatus(STATUS_USUARIO.ONLINE);
      }
    };

    eventos.forEach(evento => {
      window.addEventListener(evento, registrarAtividade, { passive: true });
    });

  }

  /**
   * Inicia atualização automática periódica do status
   */
  iniciarAtualizacaoAutomatica() {
    this.intervalId = setInterval(() => {
      this.verificarEAtualizarStatus();
    }, this.INTERVALO_ATUALIZACAO);

  }

  /**
   * Verifica tempo de inatividade e atualiza status se necessário
   */
  async verificarEAtualizarStatus() {
    const tempoInativo = Date.now() - this.ultimaAtividade;

    if (tempoInativo > this.TEMPO_AUSENTE) {
      // Usuário ausente (sem atividade por 5+ minutos)
      if (this.statusAtual !== STATUS_USUARIO.AUSENTE) {
        await this.atualizarStatus(STATUS_USUARIO.AUSENTE);
        this.statusAtual = STATUS_USUARIO.AUSENTE;
      }
    } else {
      // Usuário ativo
      if (this.statusAtual !== STATUS_USUARIO.ONLINE) {
        await this.atualizarStatus(STATUS_USUARIO.ONLINE);
        this.statusAtual = STATUS_USUARIO.ONLINE;
      }
    }
  }

  /**
   * Configura eventos para atualizar status ao sair
   */
  configurarEventosSaida() {
    // Atualizar para offline ao fechar/recarregar página
    const marcarOffline = async () => {
      if (this.usuarioId) {
        // Usar fetch com keepalive para garantir envio
        try {
          const usuarioRef = doc(db, 'usuario', this.usuarioId);
          await updateDoc(usuarioRef, {
            status: STATUS_USUARIO.OFFLINE,
            ultimaVez: serverTimestamp()
          });
        } catch (error) {
          console.error('Erro ao marcar offline:', error);
        }
      }
    };

    window.addEventListener('beforeunload', marcarOffline);
    window.addEventListener('unload', marcarOffline);

    // Detectar quando a aba fica inativa
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Aba oculta - pode marcar como ausente após um tempo

      } else {
        // Aba visível novamente - marcar como online

        this.ultimaAtividade = Date.now();
        this.atualizarStatus(STATUS_USUARIO.ONLINE);
      }
    });

  }

  /**
   * Define manualmente o status do usuário
   * @param {string} status - Status desejado
   */
  async definirStatus(status) {
    if (!Object.values(STATUS_USUARIO).includes(status)) {
      console.error('❌ Status inválido:', status);
      return;
    }

    this.statusAtual = status;
    await this.atualizarStatus(status);
  }

  /**
   * Ouve mudanças no status de um usuário específico
   * @param {string} usuarioId - ID do usuário a monitorar
   * @param {Function} callback - Função chamada quando status mudar
   * @returns {Function} Função para cancelar o listener
   */
  ouvirStatus(usuarioId, callback) {
    const usuarioRef = doc(db, 'usuario', usuarioId);
    
    return onSnapshot(usuarioRef, (snapshot) => {
      if (snapshot.exists()) {
        const dados = snapshot.data();
        callback({
          status: dados.status,
          ultimaVez: dados.ultimaVez
        });
      }
    });
  }

  /**
   * Calcula tempo desde última atividade
   * @param {Timestamp} ultimaVez - Timestamp da última atividade
   * @returns {string} Tempo formatado (ex: "5 minutos atrás")
   */
  calcularTempoDesdeUltimaVez(ultimaVez) {
    if (!ultimaVez) return 'Nunca online';

    const agora = Date.now();
    const timestamp = ultimaVez.toDate ? ultimaVez.toDate().getTime() : ultimaVez;
    const diferenca = agora - timestamp;

    const minutos = Math.floor(diferenca / 60000);
    const horas = Math.floor(diferenca / 3600000);
    const dias = Math.floor(diferenca / 86400000);

    if (minutos < 1) return 'Agora mesmo';
    if (minutos < 60) return `${minutos} minuto${minutos > 1 ? 's' : ''} atrás`;
    if (horas < 24) return `${horas} hora${horas > 1 ? 's' : ''} atrás`;
    return `${dias} dia${dias > 1 ? 's' : ''} atrás`;
  }
}

// Exportar instância singleton
export const statusUsuarioService = new StatusUsuarioService();

export default statusUsuarioService;
