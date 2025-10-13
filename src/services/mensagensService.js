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
  increment,
  runTransaction
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
    this.usuariosRef = collection(db, 'usuarios');
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
   * Busca conversas de um usuário (limitado para otimização de memória)
   */
  listenToConversations(userId, callback) {

    const q = query(
      this.conversasRef,
      where('participantes', 'array-contains', userId),
      orderBy('atualizadaEm', 'desc'),
      limit(30) // Limitar a 30 conversas mais recentes
    );

    return onSnapshot(q, 
      async (snapshot) => {

        if (snapshot.empty) {

          callback([]);
          return;
        }
        
        // Processar conversas e buscar nomes e fotos dos participantes
        const conversasPromises = snapshot.docs.map(async (doc) => {
          const data = doc.data();
          let nome = data.nome; // Para grupos já tem nome
          let photoURL = data.imagemUrl || null; // Para grupos
          
          // Se for conversa privada, buscar nome e foto do outro participante
          if (data.tipo === CONVERSATION_TYPE.PRIVADA) {
            const outroParticipanteId = data.participantes.find(id => id !== userId);
            if (outroParticipanteId) {
              const outroUsuario = await this.getUserInfo(outroParticipanteId);
              
              // Tentar pegar nome de várias fontes
              nome = outroUsuario?.nome || 
                     outroUsuario?.displayName || 
                     outroUsuario?.email?.split('@')[0] || 
                     `Usuário ${outroParticipanteId.substring(0, 8)}`;
              
              photoURL = outroUsuario?.photoURL || outroUsuario?.avatar || null;

              if (!photoURL) {

              }
            }
          }
          
          // Adicionar userId do usuário atual para facilitar acesso a participantesInfo
          return {
            id: doc.id,
            ...data,
            nome, // ← Nome resolvido
            photoURL, // ← Foto de perfil resolvida
            userId: userId, // ← Adiciona o ID do usuário atual
            // Adicionar info do usuário atual
            naoLidas: data.participantesInfo?.[userId]?.naoLidas || 0,
            arquivado: data.participantesInfo?.[userId]?.arquivado || false,
            silenciado: data.participantesInfo?.[userId]?.silenciado || false,
            fixado: data.participantesInfo?.[userId]?.fixado || false
          };
        });
        
        const conversas = await Promise.all(conversasPromises);

        callback(conversas);
      },
      (error) => {
        console.error('❌ Erro ao escutar conversas:', error);
        console.error('Detalhes do erro:', error.message, error.code);
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

      // Buscar informações da conversa
      const conversaRef = doc(this.conversasRef, conversaId);
      const conversaDoc = await getDoc(conversaRef);
      
      if (!conversaDoc.exists()) {
        throw new Error('Conversa não encontrada');
      }

      const conversaData = conversaDoc.data();
      const participantes = conversaData.participantes || [];

      // Mensagem sem criptografia
      const textoOriginal = texto || '';
      const timestamp = Date.now();

      const mensagensRef = collection(db, `conversas/${conversaId}/mensagens`);
      
      const novaMensagem = {
        texto: textoOriginal,
        remetenteId,
        tipo,
        anexoUrl,
        status: MESSAGE_STATUS.ENVIADA,
        timestamp: serverTimestamp(),
        timestampCliente: timestamp,
        encrypted: false, // Sem criptografia
        editada: false,
        deletada: false,
        leitaPor: [remetenteId],
        entregueA: [remetenteId],
        conversaId // Adiciona referência à conversa
      };

      // Adicionar mensagem
      const docRef = await addDoc(mensagensRef, novaMensagem);

      // Atualizar última mensagem na conversa (não bloquear envio)
      const previewText = tipo === MESSAGE_TYPE.TEXTO 
        ? texto.substring(0, 50) 
        : `📎 ${tipo}`;

      await updateDoc(conversaRef, {
        ultimaMensagem: {
          id: docRef.id,
          texto: previewText,
          remetenteId,
          timestamp: new Date()
        },
        atualizadaEm: serverTimestamp()
      });

      // Incrementar contador para outros participantes
      for (const participanteId of participantes) {
        if (participanteId !== remetenteId) {
          await updateDoc(conversaRef, {
            [`participantesInfo.${participanteId}.naoLidas`]: increment(1)
          });
        }
      }

      // ENVIAR NOTIFICAÇÕES PUSH para outros participantes
      await this.sendPushNotifications(
        conversaId,
        remetenteId,
        participantes,
        textoOriginal,
        tipo,
        conversaData
      );

      return {
        id: docRef.id,
        ...novaMensagem,
        texto: textoOriginal // Retorna texto descriptografado localmente
      };
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
      console.error('Stack:', error.stack);
      throw error;
    }
  }

  /**
   * Envia notificações push para outros participantes
   */
  async sendPushNotifications(conversaId, remetenteId, participantes, texto, tipo, conversaData) {
    try {

      // Buscar informações do remetente
      const remetenteRef = doc(this.usuariosRef, remetenteId);
      const remetenteDoc = await getDoc(remetenteRef);
      const remetenteNome = remetenteDoc.exists() 
        ? (remetenteDoc.data().nome || 'Usuário')
        : 'Usuário';

      // Nome da conversa (para grupos) ou nome do remetente (para privadas)
      const conversaNome = conversaData.tipo === CONVERSATION_TYPE.GRUPO
        ? (conversaData.nome || 'Grupo')
        : remetenteNome;

      // Preview da mensagem
      let mensagemPreview = '';
      switch (tipo) {
        case MESSAGE_TYPE.TEXTO:
          mensagemPreview = texto.length > 50 ? texto.substring(0, 50) + '...' : texto;
          break;
        case MESSAGE_TYPE.IMAGEM:
          mensagemPreview = '📷 Imagem';
          break;
        case MESSAGE_TYPE.VIDEO:
          mensagemPreview = '🎥 Vídeo';
          break;
        case MESSAGE_TYPE.AUDIO:
          mensagemPreview = '🎤 Áudio';
          break;
        case MESSAGE_TYPE.ARQUIVO:
          mensagemPreview = '📎 Arquivo';
          break;
        default:
          mensagemPreview = 'Nova mensagem';
      }

      // Enviar notificação para cada participante (exceto remetente)
      const notificationPromises = participantes
        .filter(participanteId => participanteId !== remetenteId)
        .map(async (participanteId) => {
          try {
            // Criar notificação no Firestore
            await addDoc(collection(db, 'notificacoes'), {
              usuarioId: participanteId,
              tipo: 'mensagem',
              titulo: conversaNome,
              mensagem: mensagemPreview,
              remetente: remetenteNome,
              lida: false,
              timestamp: serverTimestamp(),
              dados: {
                conversaId,
                mensagemTipo: tipo,
                remetenteId
              }
            });

          } catch (error) {
            console.error(`❌ Erro ao enviar notificação para ${participanteId}:`, error);
          }
        });

      await Promise.all(notificationPromises);

    } catch (error) {
      console.error('❌ Erro ao enviar notificações:', error);
      // Não lançar erro - notificações são secundárias
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
  /**
   * Escuta mensagens em tempo real e descriptografa
   */
  listenToMessages(conversaId, currentUserId, limiteMensagens = LIMITS.MESSAGES_PER_PAGE, callback) {

    const mensagensRef = collection(db, `conversas/${conversaId}/mensagens`);
    const q = query(
      mensagensRef,
      orderBy('timestamp', 'desc'),
      limit(limiteMensagens)
    );

    return onSnapshot(q, 
      async (snapshot) => {

        if (snapshot.empty) {

          callback([]);
          return;
        }

        try {

          // Processar mensagens e buscar informações dos remetentes
          const mensagensPromises = snapshot.docs.map(async (doc) => {
            const data = doc.data();
            
            // Buscar informações do remetente
            let remetenteInfo = null;
            if (data.remetenteId) {
              try {
                remetenteInfo = await this.getUserInfo(data.remetenteId);
              } catch (error) {
                console.error('Erro ao buscar info do remetente:', error);
              }
            }

            return {
              id: doc.id,
              ...data,
              remetente: remetenteInfo // Adicionar informações do remetente (nome, photoURL, etc)
            };
          });

          const mensagens = (await Promise.all(mensagensPromises)).reverse(); // Inverter para mostrar mais antigas primeiro

          callback(mensagens);
        } catch (error) {
          console.error('❌ Erro ao processar mensagens:', error);
          console.error('Stack trace:', error.stack);
          // Em caso de erro, retornar mensagens sem processar
          const mensagens = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })).reverse();
          callback(mensagens);
        }
      },
      (error) => {
        console.error('❌ Erro ao escutar mensagens:', error);
        console.error('Detalhes:', error.message);
        callback([]);
      }
    );
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
   * Alias para markMessagesAsRead (compatibilidade)
   */
  async markAsRead(conversaId, userId, mensagensIds) {
    return this.markMessagesAsRead(conversaId, userId, mensagensIds);
  }

  /**
   * Zera o contador de não lidas imediatamente sem precisar das mensagens
   */
  async clearUnreadCount(conversaId, userId) {
    try {
      const conversaRef = doc(this.conversasRef, conversaId);
      await updateDoc(conversaRef, {
        [`participantesInfo.${userId}.naoLidas`]: 0
      });

    } catch (error) {
      console.error('Erro ao zerar contador de não lidas:', error);
      throw error;
    }
  }

  /**
   * Deleta uma mensagem (método legado)
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
   * Apaga mensagem apenas para o usuário atual
   * Mantém a mensagem visível para outros participantes
   */
  async deleteMessageForMe(conversaId, mensagemId, userId) {
    try {
      const mensagemRef = doc(db, `conversas/${conversaId}/mensagens`, mensagemId);
      const mensagemDoc = await getDoc(mensagemRef);
      
      if (!mensagemDoc.exists()) {
        throw new Error('Mensagem não encontrada');
      }

      const data = mensagemDoc.data();
      const deletadaPara = data.deletadaPara || [];
      
      // Adiciona o userId ao array de usuários que deletaram
      if (!deletadaPara.includes(userId)) {
        await updateDoc(mensagemRef, {
          deletadaPara: [...deletadaPara, userId]
        });
      }

    } catch (error) {
      console.error('Erro ao apagar mensagem para mim:', error);
      throw error;
    }
  }

  /**
   * Apaga mensagem para todos os participantes da conversa
   * Marca como deletada globalmente
   */
  async deleteMessageForEveryone(conversaId, mensagemId, userId) {
    try {
      const mensagemRef = doc(db, `conversas/${conversaId}/mensagens`, mensagemId);
      const mensagemDoc = await getDoc(mensagemRef);
      
      if (!mensagemDoc.exists()) {
        throw new Error('Mensagem não encontrada');
      }

      const data = mensagemDoc.data();
      
      // Verificar se o usuário é o remetente
      if (data.remetenteId !== userId) {
        throw new Error('Apenas o remetente pode apagar para todos');
      }

      // Marcar como deletada para todos
      await updateDoc(mensagemRef, {
        deletada: true,
        deletadaParaTodos: true,
        texto: 'Esta mensagem foi apagada',
        deletadaEm: serverTimestamp()
      });

    } catch (error) {
      console.error('Erro ao apagar mensagem para todos:', error);
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

  /**
   * Busca informações de um usuário com unificação inteligente
   * Busca em múltiplas coleções e mescla dados duplicados
   */
  async getUserInfo(userId) {
    try {

      let dadosUnificados = null;
      const fontesEncontradas = [];
      
      // 1️⃣ Buscar na coleção "usuarios" (PLURAL) pelo ID do documento
      try {
        const userRef = doc(this.usuariosRef, userId);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          dadosUnificados = {
            id: userDoc.id,
            ...userDoc.data()
          };
          fontesEncontradas.push('usuarios');

        }
      } catch (error) {
        console.error('⚠️ Erro ao buscar em "usuarios":', error);
      }
      
      // 2️⃣ Buscar na coleção "funcionarios" pelo campo userId
      try {
        const funcionariosRef = collection(db, 'funcionarios');
        const qFunc = query(funcionariosRef, where('userId', '==', userId));
        const funcionariosSnap = await getDocs(qFunc);
        
        if (!funcionariosSnap.empty) {
          const funcionarioData = {
            id: funcionariosSnap.docs[0].id,
            userId: userId,
            ...funcionariosSnap.docs[0].data()
          };
          
          if (dadosUnificados) {
            // Mesclar dados, priorizando valores não vazios
            dadosUnificados = {
              ...dadosUnificados,
              nome: funcionarioData.nome || dadosUnificados.nome,
              email: funcionarioData.email || dadosUnificados.email,
              cargo: funcionarioData.cargo || funcionarioData.nivel || dadosUnificados.cargo,
              photoURL: funcionarioData.photoURL || funcionarioData.avatar || dadosUnificados.photoURL,
              displayName: funcionarioData.displayName || dadosUnificados.displayName,
              // Manter ambos os IDs
              funcionarioId: funcionarioData.id,
              ...funcionarioData
            };
          } else {
            dadosUnificados = funcionarioData;
          }
          
          fontesEncontradas.push('funcionarios(userId)');

        }
      } catch (error) {
        console.error('⚠️ Erro ao buscar em "funcionarios" por userId:', error);
      }
      
      // 3️⃣ Buscar funcionário diretamente pelo ID do documento
      try {
        const funcionariosRef = collection(db, 'funcionarios');
        const funcDocRef = doc(funcionariosRef, userId);
        const funcDoc = await getDoc(funcDocRef);
        
        if (funcDoc.exists()) {
          const funcionarioData = {
            id: funcDoc.id,
            userId: userId,
            ...funcDoc.data()
          };
          
          if (dadosUnificados) {
            // Mesclar dados
            dadosUnificados = {
              ...dadosUnificados,
              nome: funcionarioData.nome || dadosUnificados.nome,
              email: funcionarioData.email || dadosUnificados.email,
              cargo: funcionarioData.cargo || funcionarioData.nivel || dadosUnificados.cargo,
              photoURL: funcionarioData.photoURL || funcionarioData.avatar || dadosUnificados.photoURL,
              displayName: funcionarioData.displayName || dadosUnificados.displayName,
              ...funcionarioData
            };
          } else {
            dadosUnificados = funcionarioData;
          }
          
          fontesEncontradas.push('funcionarios(id)');

        }
      } catch (error) {
        console.error('⚠️ Erro ao buscar em "funcionarios" por ID:', error);
      }
      
      // 4️⃣ Buscar na coleção "usuario" (SINGULAR - legado)
      try {
        const usuarioSingularRef = doc(db, 'usuario', userId);
        const usuarioSingularDoc = await getDoc(usuarioSingularRef);
        
        if (usuarioSingularDoc.exists()) {
          const usuarioData = {
            id: usuarioSingularDoc.id,
            ...usuarioSingularDoc.data()
          };
          
          if (dadosUnificados) {
            // Mesclar dados
            dadosUnificados = {
              ...dadosUnificados,
              nome: usuarioData.nome || dadosUnificados.nome,
              email: usuarioData.email || dadosUnificados.email,
              cargo: usuarioData.cargo || usuarioData.nivel || dadosUnificados.cargo,
              photoURL: usuarioData.photoURL || usuarioData.avatar || dadosUnificados.photoURL,
              displayName: usuarioData.displayName || dadosUnificados.displayName,
              ...usuarioData
            };
          } else {
            dadosUnificados = usuarioData;
          }
          
          fontesEncontradas.push('usuario');

        }
      } catch (error) {
        console.error('⚠️ Erro ao buscar em "usuario":', error);
      }
      
      if (dadosUnificados) {

        return dadosUnificados;
      }

      return null;
    } catch (error) {
      console.error('❌ Erro ao buscar informações do usuário:', error);
      return null;
    }
  }
}

// Exportar instância singleton
const mensagensService = new MensagensService();
export default mensagensService;
