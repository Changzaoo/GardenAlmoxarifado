import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, getDoc, getDocs } from 'firebase/firestore';
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
  const markMessagesAsRead = useCallback(async (otherUserId) => {
    if (!usuario?.id) return;

    try {
      // Buscar conversas entre os dois usuários
      const conversasRef = collection(db, 'conversas');
      const q = query(
        conversasRef,
        where('participantes', 'array-contains', usuario.id)
      );

      const unsubscribe = onSnapshot(q, async (snapshot) => {
        for (const conversaDoc of snapshot.docs) {
          const conversaData = conversaDoc.data();
          const participantes = conversaData.participantes || [];
          
          // Verificar se é a conversa correta
          if (participantes.includes(otherUserId)) {
            // Atualizar mensagens não lidas
            const mensagensRef = collection(db, 'conversas', conversaDoc.id, 'mensagens');
            const mensagensQuery = query(
              mensagensRef,
              where('remetenteId', '==', otherUserId),
              where('lida', '==', false)
            );

            const mensagensSnapshot = await getDocs(mensagensQuery);
            
            // Marcar todas como lidas
            const updatePromises = mensagensSnapshot.docs.map(msgDoc => 
              updateDoc(doc(db, 'conversas', conversaDoc.id, 'mensagens', msgDoc.id), {
                lida: true,
                lidaEm: new Date().toISOString()
              })
            );

            await Promise.all(updatePromises);
            
            // Atualizar contador local
            setUnreadCounts(prev => {
              const newCounts = { ...prev };
              delete newCounts[otherUserId];
              return newCounts;
            });
          }
        }
      });

      return unsubscribe;
    } catch (error) {
      console.error('Erro ao marcar mensagens como lidas:', error);
    }
  }, [usuario]);

  // Monitorar mensagens não lidas
  useEffect(() => {
    if (!usuario?.id) return;

    const unsubscribers = [];

    // Buscar todas as conversas do usuário
    const conversasRef = collection(db, 'conversas');
    const q = query(conversasRef, where('participantes', 'array-contains', usuario.id));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Limpar listeners anteriores de mensagens
      unsubscribers.forEach(unsub => unsub());
      unsubscribers.length = 0;

      const counts = {};

      snapshot.docs.forEach(conversaDoc => {
        const conversaData = conversaDoc.data();
        const participantes = conversaData.participantes || [];
        const otherUserId = participantes.find(id => id !== usuario.id);

        if (!otherUserId) return;

        // Monitorar mensagens não lidas desta conversa
        const mensagensRef = collection(db, 'conversas', conversaDoc.id, 'mensagens');
        const mensagensQuery = query(
          mensagensRef,
          where('remetenteId', '==', otherUserId),
          where('lida', '==', false)
        );

        const mensagensUnsub = onSnapshot(mensagensQuery, async (mensagensSnapshot) => {
          const unreadCount = mensagensSnapshot.size;
          
          // Atualizar contadores
          setUnreadCounts(prev => {
            const newCounts = { ...prev };
            if (unreadCount > 0) {
              newCounts[otherUserId] = unreadCount;
            } else {
              delete newCounts[otherUserId];
            }
            return newCounts;
          });

          // Detectar novas mensagens e disparar notificações
          const previousCount = previousMessagesRef.current[otherUserId] || 0;
          
          if (unreadCount > previousCount && unreadCount > 0) {
            // Nova mensagem recebida
            const lastMsg = mensagensSnapshot.docs[mensagensSnapshot.docs.length - 1];
            if (lastMsg) {
              const msgData = lastMsg.data();
              
              // Buscar informações do remetente
              const remetenteDoc = await getDoc(doc(db, 'funcionarios', otherUserId));
              const remetente = remetenteDoc.exists() ? remetenteDoc.data() : { nome: 'Usuário' };
              
              // Tocar som
              playNotificationSound();
              
              // Enviar notificação
              const notificationTitle = `Nova mensagem de ${remetente.nome}`;
              const notificationBody = msgData.conteudo?.substring(0, 100) || 'Você recebeu uma nova mensagem';
              
              sendPushNotification(notificationTitle, notificationBody);
              
              // Armazenar última mensagem
              setLastMessages(prev => ({
                ...prev,
                [otherUserId]: {
                  conteudo: msgData.conteudo,
                  remetente: remetente.nome,
                  timestamp: msgData.timestamp
                }
              }));
            }
          }
          
          previousMessagesRef.current[otherUserId] = unreadCount;
        });

        unsubscribers.push(mensagensUnsub);
      });
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

  return (
    <MessageNotificationContext.Provider value={value}>
      {children}
    </MessageNotificationContext.Provider>
  );
};
