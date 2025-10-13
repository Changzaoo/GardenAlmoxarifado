// Firebase Cloud Function para enviar notificações push
// Instalar: npm install firebase-functions firebase-admin
// Deploy: firebase deploy --only functions

const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

/**
 * Cloud Function que dispara quando uma nova mensagem é criada
 * Envia notificação push para todos os participantes da conversa
 */
exports.sendMessageNotification = functions.firestore
  .document('conversas/{conversaId}/mensagens/{mensagemId}')
  .onCreate(async (snap, context) => {
    try {
      const mensagem = snap.data();
      const conversaId = context.params.conversaId;
      const mensagemId = context.params.mensagemId;

      console.log('📨 Nova mensagem criada:', { conversaId, mensagemId });

      // Ignorar mensagens de sistema
      if (mensagem.tipo === 'sistema') {
        console.log('⏭️ Ignorando mensagem de sistema');
        return null;
      }

      // Buscar informações da conversa
      const conversaDoc = await admin.firestore()
        .collection('conversas')
        .doc(conversaId)
        .get();

      if (!conversaDoc.exists) {
        console.error('❌ Conversa não encontrada:', conversaId);
        return null;
      }

      const conversa = conversaDoc.data();
      const participantes = conversa.participantes || [];
      const participantesInfo = conversa.participantesInfo || {};

      // Buscar nome do remetente
      const remetenteDoc = await admin.firestore()
        .collection('usuarios')
        .doc(mensagem.remetenteId)
        .get();

      const remetenteNome = remetenteDoc.exists 
        ? remetenteDoc.data().nome || 'Usuário'
        : 'Usuário';

      // Determinar título da notificação
      let notificationTitle = remetenteNome;
      if (conversa.tipo === 'grupo') {
        notificationTitle = `${remetenteNome} em ${conversa.nome || 'Grupo'}`;
      }

      // Determinar corpo da notificação
      let notificationBody = '';
      switch (mensagem.tipo) {
        case 'texto':
          notificationBody = mensagem.texto.substring(0, 100);
          break;
        case 'imagem':
          notificationBody = '📷 Enviou uma imagem';
          break;
        case 'arquivo':
          notificationBody = '📎 Enviou um arquivo';
          break;
        case 'audio':
          notificationBody = '🎤 Enviou um áudio';
          break;
        case 'video':
          notificationBody = '🎥 Enviou um vídeo';
          break;
        case 'localizacao':
          notificationBody = '📍 Compartilhou localização';
          break;
        default:
          notificationBody = 'Enviou uma mensagem';
      }

      // Enviar notificação para cada participante (exceto o remetente)
      const notificationPromises = [];

      for (const participanteId of participantes) {
        // Não enviar para o próprio remetente
        if (participanteId === mensagem.remetenteId) {
          continue;
        }

        // Verificar se o participante silenciou a conversa
        const participanteInfo = participantesInfo[participanteId] || {};
        if (participanteInfo.silenciado) {
          console.log(`🔕 Participante ${participanteId} silenciou a conversa`);
          continue;
        }

        // Buscar tokens FCM do participante
        const participanteDoc = await admin.firestore()
          .collection('usuarios')
          .doc(participanteId)
          .get();

        if (!participanteDoc.exists) {
          console.warn(`⚠️ Usuário ${participanteId} não encontrado`);
          continue;
        }

        const userData = participanteDoc.data();
        const fcmTokens = userData.fcmTokens || [];

        if (fcmTokens.length === 0) {
          console.log(`📵 Nenhum token FCM para usuário ${participanteId}`);
          continue;
        }

        // Enviar para cada token do usuário
        for (const tokenData of fcmTokens) {
          const notificationPayload = {
            token: tokenData.token,
            notification: {
              title: notificationTitle,
              body: notificationBody,
              sound: 'default',
              badge: '1'
            },
            data: {
              conversaId,
              mensagemId,
              senderId: mensagem.remetenteId,
              senderName: remetenteNome,
              type: 'new_message',
              timestamp: new Date().toISOString()
            },
            android: {
              priority: 'high',
              notification: {
                channelId: 'mensagens',
                sound: 'notification.mp3',
                color: '#3B82F6',
                icon: 'ic_notification'
              }
            },
            apns: {
              payload: {
                aps: {
                  sound: 'notification.mp3',
                  badge: 1
                }
              }
            }
          };

          const promise = admin.messaging()
            .send(notificationPayload)
            .then(() => {
              console.log(`✅ Notificação enviada para ${participanteId} (${tokenData.platform})`);
            })
            .catch(async (error) => {
              console.error(`❌ Erro ao enviar notificação para ${participanteId}:`, error);

              // Remover token inválido
              if (error.code === 'messaging/invalid-registration-token' ||
                  error.code === 'messaging/registration-token-not-registered') {
                console.log(`🗑️ Removendo token inválido: ${tokenData.token}`);
                
                const updatedTokens = fcmTokens.filter(t => t.token !== tokenData.token);
                await admin.firestore()
                  .collection('usuarios')
                  .doc(participanteId)
                  .update({
                    fcmTokens: updatedTokens
                  });
              }
            });

          notificationPromises.push(promise);
        }
      }

      // Aguardar todas as notificações serem enviadas
      await Promise.all(notificationPromises);
      console.log(`✅ ${notificationPromises.length} notificações processadas`);

      return null;

    } catch (error) {
      console.error('❌ Erro na Cloud Function:', error);
      return null;
    }
  });

/**
 * Atualiza contador de mensagens não lidas
 */
exports.updateUnreadCount = functions.firestore
  .document('conversas/{conversaId}/mensagens/{mensagemId}')
  .onCreate(async (snap, context) => {
    try {
      const mensagem = snap.data();
      const conversaId = context.params.conversaId;

      // Ignorar mensagens de sistema
      if (mensagem.tipo === 'sistema') {
        return null;
      }

      const conversaRef = admin.firestore()
        .collection('conversas')
        .doc(conversaId);

      const conversaDoc = await conversaRef.get();
      
      if (!conversaDoc.exists) {
        return null;
      }

      const conversa = conversaDoc.data();
      const participantes = conversa.participantes || [];
      const participantesInfo = conversa.participantesInfo || {};

      // Atualizar contador para cada participante (exceto remetente)
      const updates = {};
      
      for (const participanteId of participantes) {
        if (participanteId !== mensagem.remetenteId) {
          const participanteInfo = participantesInfo[participanteId] || {};
          const naoLidas = (participanteInfo.naoLidas || 0) + 1;
          
          updates[`participantesInfo.${participanteId}.naoLidas`] = naoLidas;
        }
      }

      // Atualizar última mensagem
      updates.ultimaMensagem = {
        texto: mensagem.texto || '',
        tipo: mensagem.tipo,
        remetenteId: mensagem.remetenteId,
        timestamp: mensagem.timestamp
      };
      updates.atualizadaEm = admin.firestore.FieldValue.serverTimestamp();

      await conversaRef.update(updates);
      console.log('✅ Contador de não lidas atualizado');

      return null;

    } catch (error) {
      console.error('❌ Erro ao atualizar contador:', error);
      return null;
    }
  });

/**
 * Limpa tokens FCM antigos (executado diariamente)
 */
exports.cleanupOldTokens = functions.pubsub
  .schedule('0 3 * * *') // Todo dia às 3:00 AM
  .timeZone('America/Sao_Paulo')
  .onRun(async (context) => {
    try {
      console.log('🧹 Iniciando limpeza de tokens antigos');

      const usuariosSnapshot = await admin.firestore()
        .collection('usuarios')
        .get();

      let tokensRemovidos = 0;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 90); // 90 dias atrás

      for (const userDoc of usuariosSnapshot.docs) {
        const userData = userDoc.data();
        const fcmTokens = userData.fcmTokens || [];

        // Filtrar tokens registrados há mais de 90 dias
        const tokensValidos = fcmTokens.filter(tokenData => {
          const registeredAt = new Date(tokenData.registeredAt);
          return registeredAt > cutoffDate;
        });

        if (tokensValidos.length < fcmTokens.length) {
          await userDoc.ref.update({
            fcmTokens: tokensValidos
          });
          
          const removed = fcmTokens.length - tokensValidos.length;
          tokensRemovidos += removed;
          console.log(`🗑️ Removidos ${removed} tokens do usuário ${userDoc.id}`);
        }
      }

      console.log(`✅ Limpeza concluída: ${tokensRemovidos} tokens removidos`);
      return null;

    } catch (error) {
      console.error('❌ Erro na limpeza de tokens:', error);
      return null;
    }
  });
