import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useAuth } from '../../hooks/useAuth';

const MessageNotificationContext = createContext();

export const useMessageNotifications = () => {
  const context = useContext(MessageNotificationContext);
  if (!context) {
    throw new Error('useMessageNotifications deve ser usado dentro de MessageNotificationProvider');
  }
  return context;
};

export const MessageNotificationProvider = ({ children }) => {
  const { usuario } = useAuth();
  const [unreadCounts, setUnreadCounts] = useState({}); // { userId: count }
  const [totalUnread, setTotalUnread] = useState(0);
  const [lastMessages, setLastMessages] = useState({}); // Armazena última mensagem de cada conversa
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioRef = useRef(null);
  const previousMessagesRef = useRef({});

  // Log para debug
  useEffect(() => {
    console.log('MessageNotificationProvider: usuário atual:', usuario);
  }, [usuario]);

  // Inicializar áudio
  useEffect(() => {
    audioRef.current = new Audio('/sounds/notification.wav');
    audioRef.current.volume = 0.5;
  }, []);

  // Função para tocar som de notificação
  const playNotificationSound = useCallback(() => {
    if (audioRef.current && soundEnabled) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(err => {
        console.log('Erro ao tocar som de notificação:', err);
      });
    }
  }, [soundEnabled]);

  // Função para alternar som
  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => !prev);
  }, []);

  // Função para enviar notificação push (mobile)
  const sendPushNotification = useCallback(async (title, body) => {
    // Verificar se está em ambiente Capacitor (mobile)
    if (window.Capacitor && window.Capacitor.Plugins.LocalNotifications) {
      try {
        const { LocalNotifications } = window.Capacitor.Plugins;
        
        // Solicitar permissão se necessário
        const permission = await LocalNotifications.requestPermissions();
        
        if (permission.display === 'granted') {
          await LocalNotifications.schedule({
            notifications: [
              {
                title: title,
                body: body,
                id: Date.now(),
                sound: 'notification.mp3',
                schedule: { at: new Date(Date.now() + 100) },
                smallIcon: 'ic_stat_icon_config_sample',
                iconColor: '#EF4444'
              }
            ]
          });
        }
      } catch (error) {
        console.error('Erro ao enviar notificação push:', error);
      }
    } else {
      // Desktop: usar Web Notifications API
      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(title, {
            body: body,
            icon: '/logo.png',
            badge: '/logo.png',
            tag: 'workflow-message',
            requireInteraction: false
          });
        } catch (error) {
          console.error('Erro ao criar notificação desktop:', error);
        }
      }
    }
  }, []);

  // Função para enviar notificação (wrapper para as funções existentes)
  const sendNotification = useCallback(({ remetente, conteudo, chatId, id }) => {
    playNotificationSound();
    sendPushNotification(
      `Nova mensagem de ${remetente.nome}`,
      conteudo
    );
  }, [playNotificationSound, sendPushNotification]);

  // Função para limpar notificações (placeholder - já limpa automaticamente no listener)
  const clearNotifications = useCallback(() => {
    // Notificações já são limpas automaticamente quando marcadas como lidas
    console.log('Notificações limpas');
  }, []);

  // Solicitar permissão para notificações (desktop)
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Função para marcar mensagens como lidas
  const markMessagesAsRead = useCallback(async (chatIdOrUserId) => {
    if (!usuario?.id) return;

    try {
      console.log('MessageNotificationContext: Marcando mensagens como lidas para', chatIdOrUserId);
      
      // Buscar todos os chats do usuário
      const chatsRef = collection(db, 'chats');
      const q = query(
        chatsRef,
        where('participants', 'array-contains', usuario.id)
      );

      const chatsSnapshot = await getDocs(q);
      
      for (const chatDoc of chatsSnapshot.docs) {
        const chatData = chatDoc.data();
        const participants = chatData.participants || [];
        
        // Verificar se é o chat correto (por ID do chat ou por ID do outro usuário)
        const isCorrectChat = chatDoc.id === chatIdOrUserId || 
                             (chatData.type !== 'group' && participants.includes(chatIdOrUserId));
        
        if (isCorrectChat) {
          console.log('MessageNotificationContext: Chat encontrado:', chatDoc.id);
          
          // Buscar mensagens não lidas neste chat
          const messagesRef = collection(db, 'chats', chatDoc.id, 'messages');
          const messagesQuery = query(
            messagesRef,
            where('senderId', '!=', usuario.id),
            where('read', '==', false)
          );

          const messagesSnapshot = await getDocs(messagesQuery);
          
          console.log('MessageNotificationContext: Marcando', messagesSnapshot.size, 'mensagens como lidas');
          
          // Marcar todas como lidas
          const updatePromises = messagesSnapshot.docs.map(msgDoc => 
            updateDoc(doc(db, 'chats', chatDoc.id, 'messages', msgDoc.id), {
              read: true,
              readAt: serverTimestamp()
            })
          );

          await Promise.all(updatePromises);
          
          // Atualizar contador local
          const countKey = chatData.type === 'group' ? chatDoc.id : chatIdOrUserId;
          setUnreadCounts(prev => {
            const newCounts = { ...prev };
            delete newCounts[countKey];
            return newCounts;
          });
          
          break; // Encontrou e atualizou, pode sair do loop
        }
      }
    } catch (error) {
      console.error('Erro ao marcar mensagens como lidas:', error);
    }
  }, [usuario]);

  // Monitorar mensagens não lidas
  useEffect(() => {
    if (!usuario?.id) {
      console.log('MessageNotificationContext: usuário não disponível');
      return;
    }

    console.log('MessageNotificationContext: iniciando monitor para usuário', usuario.id);

    const unsubscribers = [];

    // Buscar todos os chats do usuário
    const chatsRef = collection(db, 'chats');
    const q = query(chatsRef, where('participants', 'array-contains', usuario.id));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Limpar listeners anteriores de mensagens
      unsubscribers.forEach(unsub => unsub());
      unsubscribers.length = 0;

      const counts = {};

      snapshot.docs.forEach(chatDoc => {
        const chatData = chatDoc.data();
        const participants = chatData.participants || [];
        
        // Para chat individual, encontrar o outro usuário
        const otherUserId = chatData.type === 'group' 
          ? null 
          : participants.find(id => id !== usuario.id);

        if (!otherUserId && chatData.type !== 'group') return;

        // Monitorar mensagens não lidas deste chat
        const messagesRef = collection(db, 'chats', chatDoc.id, 'messages');
        const messagesQuery = query(
          messagesRef,
          where('senderId', '!=', usuario.id),
          where('read', '==', false)
        );

        const messagesUnsub = onSnapshot(messagesQuery, async (messagesSnapshot) => {
          const unreadCount = messagesSnapshot.size;
          
          // Usar chatId como chave para grupos, ou otherUserId para chats individuais
          const countKey = chatData.type === 'group' ? chatDoc.id : otherUserId;
          
          // Atualizar contadores
          setUnreadCounts(prev => {
            const newCounts = { ...prev };
            if (unreadCount > 0) {
              newCounts[countKey] = unreadCount;
            } else {
              delete newCounts[countKey];
            }
            return newCounts;
          });

          // Detectar novas mensagens e disparar notificações
          const previousCount = previousMessagesRef.current[countKey] || 0;
          
          console.log('MessageNotificationContext: Verificando novas mensagens', {
            chatId: chatDoc.id,
            countKey,
            unreadCount,
            previousCount,
            hasNewMessages: unreadCount > previousCount
          });
          
          if (unreadCount > previousCount && unreadCount > 0) {
            // Nova mensagem recebida
            console.log('MessageNotificationContext: Nova mensagem detectada!');
            
            // Pegar a mensagem mais recente
            const lastMsg = messagesSnapshot.docs[messagesSnapshot.docs.length - 1];
            if (lastMsg) {
              const msgData = lastMsg.data();
              
              console.log('MessageNotificationContext: Dados da mensagem:', msgData);
              
              // Buscar informações do remetente
              const senderId = msgData.senderId;
              let senderName = msgData.senderName || 'Usuário';
              
              // Se não tiver senderName, buscar do Firestore
              if (!msgData.senderName && senderId) {
                try {
                  const senderDoc = await getDoc(doc(db, 'funcionarios', senderId));
                  if (senderDoc.exists()) {
                    senderName = senderDoc.data().nome || 'Usuário';
                  }
                } catch (error) {
                  console.error('Erro ao buscar dados do remetente:', error);
                }
              }
              
              console.log('MessageNotificationContext: Tocando som e enviando notificação...');
              
              // Tocar som
              playNotificationSound();
              
              // Enviar notificação
              const notificationTitle = chatData.type === 'group' 
                ? `${senderName} em ${chatData.name}`
                : `Nova mensagem de ${senderName}`;
              const notificationBody = msgData.text?.substring(0, 100) || msgData.type === 'audio' ? '🎤 Áudio' : 'Você recebeu uma nova mensagem';
              
              sendPushNotification(notificationTitle, notificationBody);
              
              // Armazenar última mensagem
              setLastMessages(prev => ({
                ...prev,
                [countKey]: {
                  conteudo: msgData.text,
                  remetente: senderName,
                  timestamp: msgData.timestamp
                }
              }));
            }
          }
          
          previousMessagesRef.current[countKey] = unreadCount;
        });

        unsubscribers.push(messagesUnsub);
      });
    }, (error) => {
      console.error('MessageNotificationContext: Erro no listener de conversas:', error);
    });

    return () => {
      unsubscribe();
      unsubscribers.forEach(unsub => unsub());
    };
  }, [usuario, playNotificationSound, sendPushNotification]);

  // Calcular total de mensagens não lidas
  useEffect(() => {
    const total = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);
    setTotalUnread(total);
  }, [unreadCounts]);

  const value = {
    unreadCounts,
    totalUnread,
    lastMessages,
    markMessagesAsRead,
    playNotificationSound,
    sendNotification,
    clearNotifications,
    soundEnabled,
    toggleSound
  };

  // Se houver erro de inicialização, ainda renderiza os children
  // para não quebrar a aplicação
  return (
    <MessageNotificationContext.Provider value={value}>
      {children}
    </MessageNotificationContext.Provider>
  );
};
