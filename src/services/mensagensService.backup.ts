import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  writeBatch,
  increment
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebaseConfig';
import {
  MESSAGE_STATUS,
  MESSAGE_TYPE,
  USER_STATUS,
  CONVERSATION_TYPE,
  LIMITS,
  ERROR_CODES
} from '../constants/mensagensConstants';

/**
 * Serviço de Mensagens
 * Gerencia todas as operações de chat no Firestore
 */
class MensagensService {
  constructor() {
    this.conversasRef = collection(db, 'conversas');
    this.usuariosRef = collection(db, 'usuario');
  }

  // ==================== CONVERSAS ====================

  /**
   * Cria ou obtém uma conversa entre dois usuários
   */
  async getOrCreateConversation(userId1, userId2) {
    try {
      // Buscar conversa existente
      const q = query(
        this.conversasRef,
        where('tipo', '==', CONVERSATION_TYPE.PRIVADA),
        where('participantes', 'array-contains', userId1)
      );

      const snapshot = await getDocs(q);
      const existingConversation = snapshot.docs.find(doc => {
        const data = doc.data();
        return data.participantes.includes(userId2);
      });

      if (existingConversation) {
        return {
          id: existingConversation.id,
          ...existingConversation.data()
        };
      }

      // Criar nova conversa
      const novaConversa = {
        tipo: CONVERSATION_TYPE.PRIVADA,
        participantes: [userId1, userId2],
        participantesInfo: {
          [userId1]: {
            naoLidas: 0,
            ultimaVez: serverTimestamp(),
            silenciado: false,
            arquivado: false,
            fixado: false
          },
          [userId2]: {
            naoLidas: 0,
            ultimaVez: serverTimestamp(),
            silenciado: false,
            arquivado: false,
            fixado: false
          }
        },
        ultimaMensagem: null,
        criadaEm: serverTimestamp(),
        atualizadaEm: serverTimestamp(),
        bloqueios: {}
      };

      const docRef = await addDoc(this.conversasRef, novaConversa);
      return {
        id: docRef.id,
        ...novaConversa
      };
    } catch (error) {
      console.error('Erro ao criar/buscar conversa:', error);
      throw error;
    }
  }

  /**
   * Cria um grupo
   */
  async createGroup(adminId, nome, descricao, participantes, imagemUrl = null) {
    try {
      const participantesInfo = {};
      [adminId, ...participantes].forEach(userId => {
        participantesInfo[userId] = {
          naoLidas: 0,
          ultimaVez: serverTimestamp(),
          silenciado: false,
          arquivado: false,
          fixado: false,
          admin: userId === adminId
        };
      });

      const novoGrupo = {
        tipo: CONVERSATION_TYPE.GRUPO,
        nome,
        descricao: descricao || '',
        imagemUrl,
        adminId,
        participantes: [adminId, ...participantes],
        participantesInfo,
        ultimaMensagem: null,
        criadaEm: serverTimestamp(),
        atualizadaEm: serverTimestamp(),
        bloqueios: {}
      };

      const docRef = await addDoc(this.conversasRef, novoGrupo);
      
      // Adicionar mensagem de sistema
      await this.sendSystemMessage(docRef.id, 'Grupo criado');

      return {
        id: docRef.id,
        ...novoGrupo
      };
    } catch (error) {
      console.error('Erro ao criar grupo:', error);
      throw error;
    }
  }

  /**
   * Busca conversas de um usuário
   */
  listenToConversations(userId, callback) {

    const q = query(
      this.conversasRef,
      where('participantes', 'array-contains', userId),
      orderBy('atualizadaEm', 'desc')
    );

    return onSnapshot(q, 
      (snapshot) => {

        const conversas = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        callback(conversas);
      },
      (error) => {
        console.error('❌ Erro ao escutar conversas:', error);
        callback([]);
      }
    );
  }

  /**
   * Atualiza configurações da conversa para um usuário
   */
  async updateConversationSettings(conversaId, userId, settings) {
    try {
      const conversaRef = doc(this.conversasRef, conversaId);
      const updates = {};

      Object.keys(settings).forEach(key => {
        updates[`participantesInfo.${userId}.${key}`] = settings[key];
      });

      await updateDoc(conversaRef, updates);
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error);
      throw error;
    }
  }

  // ==================== MENSAGENS ====================

  /**
   * Envia uma mensagem de texto
   */
  async sendMessage(conversaId, remetenteId, texto, tipo = MESSAGE_TYPE.TEXTO, anexoUrl = null) {
    try {

      // Verificar bloqueio
      const bloqueado = await this.isBlocked(conversaId, remetenteId);
      if (bloqueado) {
        console.error('🚫 Usuário bloqueado');
        throw new Error(ERROR_CODES.BLOCKED_USER);
      }

      const mensagensRef = collection(db, `conversas/${conversaId}/mensagens`);

      const novaMensagem = {
        texto: texto || '',
        remetenteId,
        tipo,
        anexoUrl,
        status: MESSAGE_STATUS.ENVIADA,
        timestamp: serverTimestamp(),
        editada: false,
        deletada: false,
        leitaPor: [remetenteId],
        entregueA: [remetenteId]
      };

      const docRef = await addDoc(mensagensRef, novaMensagem);

      // Atualizar última mensagem na conversa

      await this.updateLastMessage(conversaId, {
        id: docRef.id,
        texto: tipo === MESSAGE_TYPE.TEXTO ? texto : `📎 ${tipo}`,
        remetenteId,
        timestamp: new Date()
      });

      // Incrementar contador de não lidas para outros participantes

      await this.incrementUnreadCount(conversaId, remetenteId);

      return {
        id: docRef.id,
        ...novaMensagem
      };
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
      console.error('Stack trace:', error.stack);
      throw error;
    }
  }

  /**
   * Envia mensagem do sistema
   */
  async sendSystemMessage(conversaId, texto) {
    try {
      const mensagensRef = collection(db, `conversas/${conversaId}/mensagens`);
      
      const mensagemSistema = {
        texto,
        remetenteId: 'system',
        tipo: MESSAGE_TYPE.SISTEMA,
        status: MESSAGE_STATUS.ENVIADA,
        timestamp: serverTimestamp(),
        editada: false,
        deletada: false
      };

      await addDoc(mensagensRef, mensagemSistema);
    } catch (error) {
      console.error('Erro ao enviar mensagem do sistema:', error);
    }
  }

  /**
   * Escuta mensagens em tempo real
   */
  listenToMessages(conversaId, limiteMensagens = LIMITS.MESSAGES_PER_PAGE, callback) {
    const mensagensRef = collection(db, `conversas/${conversaId}/mensagens`);
    const q = query(
      mensagensRef,
      orderBy('timestamp', 'desc'),
      limit(limiteMensagens)
    );

    return onSnapshot(q, (snapshot) => {
      const mensagens = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).reverse(); // Inverter para mostrar mais antigas primeiro
      
      callback(mensagens);
    });
  }

  /**
   * Carrega mensagens antigas (paginação)
   */
  async loadOlderMessages(conversaId, ultimaMensagemTimestamp, limiteMensagens = LIMITS.MESSAGES_PER_PAGE) {
    try {
      const mensagensRef = collection(db, `conversas/${conversaId}/mensagens`);
      const q = query(
        mensagensRef,
        orderBy('timestamp', 'desc'),
        startAfter(ultimaMensagemTimestamp),
        limit(limiteMensagens)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).reverse();
    } catch (error) {
      console.error('Erro ao carregar mensagens antigas:', error);
      throw error;
    }
  }

  /**
   * Marca mensagens como lidas
   */
  async markMessagesAsRead(conversaId, userId, mensagensIds) {
    try {
      const batch = writeBatch(db);
      const mensagensRef = collection(db, `conversas/${conversaId}/mensagens`);

      mensagensIds.forEach(msgId => {
        const msgRef = doc(mensagensRef, msgId);
        batch.update(msgRef, {
          status: MESSAGE_STATUS.LIDA,
          [`leitaPor`]: [userId] // Usar arrayUnion em produção
        });
      });

      // Zerar contador de não lidas
      const conversaRef = doc(this.conversasRef, conversaId);
      batch.update(conversaRef, {
        [`participantesInfo.${userId}.naoLidas`]: 0
      });

      await batch.commit();
    } catch (error) {
      console.error('Erro ao marcar mensagens como lidas:', error);
      throw error;
    }
  }

  /**
   * Deleta uma mensagem
   */
  async deleteMessage(conversaId, mensagemId, paraOusuário = true) {
    try {
      const mensagemRef = doc(db, `conversas/${conversaId}/mensagens`, mensagemId);

      if (paraOusuário) {
        // Soft delete - apenas marca como deletada
        await updateDoc(mensagemRef, {
          deletada: true,
          texto: 'Mensagem deletada'
        });
      } else {
        // Hard delete - remove completamente
        await deleteDoc(mensagemRef);
      }
    } catch (error) {
      console.error('Erro ao deletar mensagem:', error);
      throw error;
    }
  }

  /**
   * Edita uma mensagem
   */
  async editMessage(conversaId, mensagemId, novoTexto) {
    try {
      const mensagemRef = doc(db, `conversas/${conversaId}/mensagens`, mensagemId);
      await updateDoc(mensagemRef, {
        texto: novoTexto,
        editada: true,
        editadaEm: serverTimestamp()
      });
    } catch (error) {
      console.error('Erro ao editar mensagem:', error);
      throw error;
    }
  }

  // ==================== ARQUIVOS ====================

  /**
   * Faz upload de arquivo
   */
  async uploadFile(file, conversaId, userId) {
    try {
      const fileExtension = file.name.split('.').pop();
      const fileName = `${conversaId}/${userId}/${Date.now()}.${fileExtension}`;
      const storageRef = ref(storage, `mensagens/${fileName}`);

      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      return downloadURL;
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      throw error;
    }
  }

  /**
   * Delete arquivo do storage
   */
  async deleteFile(fileUrl) {
    try {
      const fileRef = ref(storage, fileUrl);
      await deleteObject(fileRef);
    } catch (error) {
      console.error('Erro ao deletar arquivo:', error);
      // Não lançar erro - arquivo pode não existir
    }
  }

  // ==================== STATUS DO USUÁRIO ====================

  /**
   * Atualiza status online/offline
   */
  async updateUserStatus(userId, status) {
    try {
      const userRef = doc(this.usuariosRef, userId);
      await updateDoc(userRef, {
        status,
        ultimaVez: serverTimestamp()
      });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      throw error;
    }
  }

  /**
   * Escuta status de um usuário
   */
  listenToUserStatus(userId, callback) {
    const userRef = doc(this.usuariosRef, userId);
    
    return onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        callback(doc.data());
      }
    });
  }

  /**
   * Atualiza indicador de digitação
   */
  async updateTypingStatus(conversaId, userId, isTyping) {
    try {
      const conversaRef = doc(this.conversasRef, conversaId);
      
      if (isTyping) {
        await updateDoc(conversaRef, {
          [`digitando.${userId}`]: serverTimestamp()
        });
      } else {
        await updateDoc(conversaRef, {
          [`digitando.${userId}`]: null
        });
      }
    } catch (error) {
      console.error('Erro ao atualizar digitação:', error);
      // Não lançar erro - não é crítico
    }
  }

  // ==================== BLOQUEIO ====================

  /**
   * Bloqueia um usuário
   */
  async blockUser(conversaId, userId, blockedUserId) {
    try {
      const conversaRef = doc(this.conversasRef, conversaId);
      await updateDoc(conversaRef, {
        [`bloqueios.${userId}`]: blockedUserId
      });

      // Enviar mensagem de sistema
      await this.sendSystemMessage(conversaId, `Usuário bloqueado`);
    } catch (error) {
      console.error('Erro ao bloquear usuário:', error);
      throw error;
    }
  }

  /**
   * Desbloqueia um usuário
   */
  async unblockUser(conversaId, userId) {
    try {
      const conversaRef = doc(this.conversasRef, conversaId);
      await updateDoc(conversaRef, {
        [`bloqueios.${userId}`]: null
      });

      // Enviar mensagem de sistema
      await this.sendSystemMessage(conversaId, `Usuário desbloqueado`);
    } catch (error) {
      console.error('Erro ao desbloquear usuário:', error);
      throw error;
    }
  }

  /**
   * Verifica se usuário está bloqueado
   */
  async isBlocked(conversaId, userId) {
    try {
      const conversaRef = doc(this.conversasRef, conversaId);
      const conversaDoc = await getDoc(conversaRef);
      
      if (!conversaDoc.exists()) return false;
      
      const bloqueios = conversaDoc.data().bloqueios || {};
      
      // Verificar se userId foi bloqueado por qualquer participante
      return Object.values(bloqueios).includes(userId);
    } catch (error) {
      console.error('Erro ao verificar bloqueio:', error);
      return false;
    }
  }

  // ==================== UTILITÁRIOS ====================

  /**
   * Atualiza última mensagem da conversa
   */
  async updateLastMessage(conversaId, mensagemInfo) {
    try {
      const conversaRef = doc(this.conversasRef, conversaId);
      await updateDoc(conversaRef, {
        ultimaMensagem: mensagemInfo,
        atualizadaEm: serverTimestamp()
      });
    } catch (error) {
      console.error('Erro ao atualizar última mensagem:', error);
    }
  }

  /**
   * Incrementa contador de mensagens não lidas
   */
  async incrementUnreadCount(conversaId, excludeUserId) {
    try {
      const conversaRef = doc(this.conversasRef, conversaId);
      const conversaDoc = await getDoc(conversaRef);
      
      if (!conversaDoc.exists()) return;
      
      const participantes = conversaDoc.data().participantes;
      const batch = writeBatch(db);

      participantes.forEach(participanteId => {
        if (participanteId !== excludeUserId) {
          batch.update(conversaRef, {
            [`participantesInfo.${participanteId}.naoLidas`]: increment(1)
          });
        }
      });

      await batch.commit();
    } catch (error) {
      console.error('Erro ao incrementar não lidas:', error);
    }
  }

  /**
   * Busca mensagens por texto
   */
  async searchMessages(conversaId, searchTerm) {
    try {
      const mensagensRef = collection(db, `conversas/${conversaId}/mensagens`);
      const snapshot = await getDocs(mensagensRef);
      
      const mensagens = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(msg => 
          msg.texto.toLowerCase().includes(searchTerm.toLowerCase())
        );
      
      return mensagens;
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
      throw error;
    }
  }

  /**
   * Conta total de mensagens não lidas
   */
  async getTotalUnreadCount(userId) {
    try {
      const q = query(
        this.conversasRef,
        where('participantes', 'array-contains', userId)
      );

      const snapshot = await getDocs(q);
      let total = 0;

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const userInfo = data.participantesInfo?.[userId];
        if (userInfo && !userInfo.silenciado) {
          total += userInfo.naoLidas || 0;
        }
      });

      return total;
    } catch (error) {
      console.error('Erro ao contar não lidas:', error);
      return 0;
    }
  }
}

// Exportar instância singleton
const mensagensService = new MensagensService();
export default mensagensService;
