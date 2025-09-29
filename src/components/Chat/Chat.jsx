import React, { useState, useEffect } from 'react';
import ChatButton from './ChatButton';
import ChatWindow from './ChatWindow';
import useAuth from '../../hooks/useAuth';
import { db } from '../../firebaseConfig';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  orderBy,
  serverTimestamp,
  getDocs
} from 'firebase/firestore';

const Chat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (!user) return;

    // Buscar chats individuais e grupos do usuário
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setChats(chatList);
    });

    return () => unsubscribe();
  }, [user]);

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
    await addDoc(collection(db, 'chats', chatId, 'messages'), {
      text,
      senderId: user.uid,
      timestamp: serverTimestamp()
    });

    // Atualizar lastMessage do chat
    await updateDoc(doc(db, 'chats', chatId), {
      lastMessage: text,
      lastMessageTimestamp: serverTimestamp()
    });
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
