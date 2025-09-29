import React, { useState, useEffect, useCallback } from 'react';
import ChatButton from './ChatButton';
import ChatWindow from './ChatWindow';
import useAuth from '../../hooks/useAuth';
import { db } from '../../firebaseConfig';
import { useMessageNotification } from '../../hooks/useMessageNotification';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  orderBy,
  serverTimestamp,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  Timestamp,
  writeBatch
} from 'firebase/firestore';

const Chat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const { sendNotification, clearNotifications } = useMessageNotification();

  useEffect(() => {
    if (!user) return;

    // Buscar chats individuais e grupos do usuário
    const chatsQuery = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid)
    );

    // Monitor para os chats
    const unsubscribeChats = onSnapshot(chatsQuery, (snapshot) => {
      // Monitor para mensagens em todos os chats
      const unsubscribeMessages = onSnapshot(
        query(
          collection(db, 'mensagens'),
          where('status.deletada', '==', false),
          orderBy('timestamp', 'desc')
        ),
        async (messagesSnapshot) => {
          // Verificar novas mensagens para notificações
          messagesSnapshot.docChanges().forEach(change => {
            if (change.type === 'added') {
              const messageData = change.doc.data();
              if (messageData.remetente.id !== user.uid && 
                  !messageData.status.lida[user.uid] &&
                  (!activeChat || activeChat.id !== messageData.chatId)) {
                sendNotification(messageData);
              }
            }
          });

          const chatList = await Promise.all(snapshot.docs.map(async chatDoc => {
            const chatData = chatDoc.data();
            
            // Filtrar mensagens não lidas para este chat
            const unreadMessages = messagesSnapshot.docs.filter(msgDoc => {
              const msgData = msgDoc.data();
              return msgData.chatId === chatDoc.id && 
                     !msgData.status.lida[user.uid] && 
                     msgData.remetente.id !== user.uid;
            });

            // Obter a última mensagem do chat
            const lastMessage = messagesSnapshot.docs.find(msgDoc => {
              const msgData = msgDoc.data();
              return msgData.chatId === chatDoc.id;
            });

            const lastMessageData = lastMessage ? lastMessage.data() : null;

            // Encontrar a mensagem mais recente não lida
            const lastUnreadMessage = unreadMessages[0];
            const hasNewMessage = !!lastUnreadMessage;

            return {
              id: chatDoc.id,
              ...chatData,
              lastMessage: lastMessageData?.conteudo || '',
              timestamp: lastMessageData?.timestamp || chatData.createdAt,
              unreadCount: unreadMessages.length,
              hasNewMessage,
              isActive: activeChat?.id === chatDoc.id
            };
          }));

          // Ordenar chats por timestamp da última mensagem
          const sortedChats = chatList.sort((a, b) => {
            const timeA = a.timestamp instanceof Timestamp ? a.timestamp.toMillis() : 0;
            const timeB = b.timestamp instanceof Timestamp ? b.timestamp.toMillis() : 0;
            return timeB - timeA;
          });
          
          setChats(sortedChats);
        }
      );

      return () => {
        unsubscribeMessages();
      };
    });

    return () => {
      unsubscribeChats();
    };
  }, [user]);

  // Efeito para marcar mensagens como lidas quando o chat estiver ativo
  useEffect(() => {
    if (!activeChat || !user) return;

    // Limpar notificações quando abrir o chat
    clearNotifications();

    const markMessagesAsRead = async () => {
      // Buscar mensagens não lidas do chat atual
      const messagesQuery = query(
        collection(db, 'mensagens'),
        where('chatId', '==', activeChat.id),
        where('remetente.id', '!=', user.uid),
        where('status.deletada', '==', false)
      );

      const unreadMessages = await getDocs(messagesQuery);
      
      // Marcar cada mensagem como lida
      const batch = writeBatch(db);
      
      unreadMessages.docs.forEach((doc) => {
        const messageData = doc.data();
        if (!messageData.status.lida[user.uid]) {
          const messageRef = doc.ref;
          batch.update(messageRef, {
            [`status.lida.${user.uid}`]: true,
            'status.entregue': true
          });
        }
      });

      if (!unreadMessages.empty) {
        await batch.commit();
      }
    };

    markMessagesAsRead();
  }, [activeChat, user]);

  useEffect(() => {
    if (!activeChat) {
      setMessages([]);
      return;
    }

    // Buscar mensagens do chat ativo
    const q = query(
      collection(db, 'chats', activeChat.id, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messageList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(messageList);
    });

    return () => unsubscribe();
  }, [activeChat]);

  const createIndividualChat = async (otherUser) => {
    // Verificar se já existe um chat individual
    const existingChat = chats.find(chat => 
      chat.type === 'individual' &&
      chat.participants.includes(user.uid) &&
      chat.participants.includes(otherUser.uid)
    );

    if (existingChat) {
      return existingChat;
    }

    // Criar novo chat individual
    const chatRef = await addDoc(collection(db, 'chats'), {
      type: 'individual',
      participants: [user.uid, otherUser.uid],
      createdAt: serverTimestamp(),
      lastMessage: '',
      lastMessageTimestamp: serverTimestamp()
    });

    return {
      id: chatRef.id,
      type: 'individual',
      participants: [user.uid, otherUser.uid]
    };
  };

  const createGroupChat = async (name, participants) => {
    // Criar novo grupo
    const chatRef = await addDoc(collection(db, 'chats'), {
      type: 'group',
      name,
      participants: [...participants, user.uid],
      createdBy: user.uid,
      createdAt: serverTimestamp(),
      lastMessage: '',
      lastMessageTimestamp: serverTimestamp()
    });

    return {
      id: chatRef.id,
      type: 'group',
      name,
      participants: [...participants, user.uid]
    };
  };

  const sendMessage = async (chatId, text) => {
    try {
      // Obter os participantes do chat
      const chatDoc = await getDoc(doc(db, 'chats', chatId));
      const chatData = chatDoc.data();
      
      if (!chatData) {
        console.error('Chat não encontrado');
        return;
      }
      
      // Criar a mensagem com estrutura melhorada
      const messageData = {
        chatId,
        conteudo: text,
        tipo: 'texto',
        remetente: {
          id: user.uid,
          nome: user.displayName || 'Usuário'
        },
        timestamp: serverTimestamp(),
        status: {
          deletada: false,
          entregue: false,
          lida: {}
        }
      };

      // Inicializar o status de leitura para cada participante
      chatData.participants
        .filter(id => id !== user.uid)
        .forEach(id => {
          messageData.status.lida[id] = false;
        });

      // Enviar a mensagem
      const messageRef = await addDoc(collection(db, 'mensagens'), messageData);

      // Atualizar lastMessage do chat
      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: text,
        lastMessageTimestamp: serverTimestamp(),
        lastMessageSender: user.uid
      });
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
  };

  // Estado para armazenar a posição do botão de chat
  const [chatButtonPosition, setChatButtonPosition] = useState({ x: -1, y: -1 });

  return (
    <>
      <ChatButton 
        isOpen={isOpen} 
        onClick={() => setIsOpen(!isOpen)}
      />
      <ChatWindow
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        currentUser={user}
        chats={chats}
        activeChat={activeChat}
        setActiveChat={setActiveChat}
        messages={messages}
        onSendMessage={sendMessage}
        onCreateGroup={createGroupChat}
        onCreateIndividualChat={createIndividualChat}
      />
    </>
  );
};

export default Chat;
