import React, { useState, useEffect, useRef } from 'react';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useMessageNotification } from '../../hooks/useMessageNotification';
import ChatBadge from './ChatBadge';
import { 
  MessageCircle, X, Search, Users, Send, 
  ArrowLeft, Check, CheckCheck, MoreVertical,
  Smile, Paperclip, Mic, Trash2, Image,
  FileText, Video, Headphones, File,
  Volume2, VolumeX
} from 'lucide-react';
import ChatButton from './ChatButton';
import './WorkflowChat.css';
import EmojiPicker from 'emoji-picker-react';
import { db, storage } from '../../firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  orderBy,
  serverTimestamp,
  getDocs,
  deleteDoc
} from 'firebase/firestore';

const formatLastMessageTime = (timestamp) => {
  if (!timestamp) return '';
  
  const now = new Date();
  const messageDate = new Date(timestamp);
  
  // Se for hoje
  if (messageDate.toDateString() === now.toDateString()) {
    return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  // Se for ontem
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (messageDate.toDateString() === yesterday.toDateString()) {
    return 'Ontem';
  }
  
  // Se for esta semana
  const oneWeekAgo = new Date(now);
  oneWeekAgo.setDate(now.getDate() - 7);
  if (messageDate > oneWeekAgo) {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return days[messageDate.getDay()];
  }
  
  // Se for este ano
  if (messageDate.getFullYear() === now.getFullYear()) {
    return messageDate.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
  }
  
  // Se for ano anterior
  return messageDate.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: '2-digit' });
};

const WorkflowChat = ({ currentUser, buttonPosition = { x: window.innerWidth - 86, y: window.innerHeight - 86 } }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeChat, setActiveChat] = useState(null);
  const isMobile = useIsMobile();
  const { sendNotification, clearNotifications, soundEnabled, toggleSound } = useMessageNotification();
  const [messages, setMessages] = useState([]);
  const [chats, setChats] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, chatId: null });
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const fileInputRef = useRef(null);
  const audioInputRef = useRef(null);

  // Scroll para a última mensagem
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (messages?.length) {
      scrollToBottom();

      // Marcar mensagens como lidas quando o chat estiver aberto
      if (isOpen && activeChat) {
        const unreadMessages = messages.filter(msg => 
          msg.senderId !== currentUser.id && !msg.read
        );

        unreadMessages.forEach(async (msg) => {
          await updateDoc(doc(db, 'chats', activeChat.id, 'messages', msg.id), {
            read: true
          });
        });

        // Limpar notificações quando o chat estiver aberto
        clearNotifications();
      }
    }
  }, [messages, isOpen, activeChat, currentUser.id]);

  // Fechar menu de contexto ao clicar fora
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.visible) {
        setContextMenu({ visible: false, x: 0, y: 0, chatId: null });
      }
      if (showOptionsMenu) {
        setShowOptionsMenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [contextMenu, showOptionsMenu]);

  // Carregar usuários disponíveis
  useEffect(() => {
    const q = query(collection(db, 'usuarios'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(user => user.id !== currentUser?.id);
      setAvailableUsers(users);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Carregar chats do usuário
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', currentUser.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        lastMessage: doc.data().lastMessage || '',
        lastMessageTimestamp: doc.data().lastMessageTimestamp?.toDate() || new Date(),
      }));
      // Ordenar chats pelo timestamp da última mensagem
      chatsList.sort((a, b) => b.lastMessageTimestamp - a.lastMessageTimestamp);
      setChats(chatsList);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Carregar mensagens do chat ativo
  useEffect(() => {
    if (!activeChat) {
      setMessages([]);
      return;
    }

    const q = query(
      collection(db, 'chats', activeChat.id, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Processar alterações em tempo real
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added') {
          const messageData = change.doc.data();
          // Verificar se é uma mensagem nova (não histórica) e se não é do usuário atual
          const isNewMessage = (Date.now() - messageData.timestamp?.toDate?.()?.getTime() || 0) < 1000;
          if (isNewMessage && messageData.senderId !== currentUser.id && !messageData.read) {
            sendNotification({
              remetente: {
                nome: messageData.senderName,
                id: messageData.senderId
              },
              conteudo: messageData.text || 'Nova mensagem',
              chatId: activeChat.id,
              id: change.doc.id
            });
          }
        }
      });

      const messagesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      }));
      setMessages(messagesList);
    });

    return () => unsubscribe();
  }, [activeChat]);

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if ((!newMessage.trim() && !audioBlob) || !activeChat) return;

    try {
      let messageData = {
        senderId: currentUser.id,
        senderName: currentUser.nome,
        timestamp: serverTimestamp(),
        read: false
      };

      // Se houver um áudio para enviar
      if (audioBlob) {
        const audioRef = ref(storage, `audios/${activeChat.id}/${Date.now()}.wav`);
        await uploadBytes(audioRef, audioBlob);
        const audioUrl = await getDownloadURL(audioRef);
        
        messageData = {
          ...messageData,
          type: 'audio',
          audioUrl,
          duration: audioBlob.duration || 0
        };
        setAudioBlob(null);
      } else {
        messageData = {
          ...messageData,
          type: 'text',
          text: newMessage
        };
      }

      await addDoc(collection(db, 'chats', activeChat.id, 'messages'), messageData);

      await updateDoc(doc(db, 'chats', activeChat.id), {
        lastMessage: audioBlob ? '🎤 Áudio' : newMessage,
        lastMessageTimestamp: serverTimestamp()
      });

      setNewMessage('');
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
  };

  const handleEmojiClick = (emojiData) => {
    setNewMessage(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const handleAttachFile = async (file, type) => {
    if (!file || !activeChat) return;

    try {
      const fileRef = ref(storage, `files/${activeChat.id}/${Date.now()}_${file.name}`);
      await uploadBytes(fileRef, file);
      const fileUrl = await getDownloadURL(fileRef);

      const messageData = {
        senderId: currentUser.id,
        senderName: currentUser.nome,
        timestamp: serverTimestamp(),
        read: false,
        type: type,
        fileUrl,
        fileName: file.name,
        fileSize: file.size
      };

      await addDoc(collection(db, 'chats', activeChat.id, 'messages'), messageData);

      const typeEmoji = {
        image: '📷',
        video: '🎥',
        document: '📄',
        audio: '🎵'
      };

      await updateDoc(doc(db, 'chats', activeChat.id), {
        lastMessage: `${typeEmoji[type] || '📎'} ${file.name}`,
        lastMessageTimestamp: serverTimestamp()
      });

      setShowAttachMenu(false);
    } catch (error) {
      console.error('Erro ao enviar arquivo:', error);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
        handleSendMessage();
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const handleDeleteChat = async (chatId) => {
    try {
      // Primeiro deletar todas as mensagens do chat
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      const messagesSnapshot = await getDocs(messagesRef);
      const deletePromises = messagesSnapshot.docs.map(doc => 
        deleteDoc(doc.ref)
      );
      await Promise.all(deletePromises);

      // Depois deletar o chat
      await deleteDoc(doc(db, 'chats', chatId));

      if (activeChat?.id === chatId) {
        setActiveChat(null);
      }
      
      setContextMenu({ visible: false, x: 0, y: 0, chatId: null });
      setShowOptionsMenu(false);
    } catch (error) {
      console.error('Erro ao deletar chat:', error);
    }
  };

  const handleContextMenu = (e, chatId) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      chatId
    });
  };

  const handleLongPress = (chatId) => {
    setContextMenu({
      visible: true,
      x: window.innerWidth / 2, // Centralizar no celular
      y: window.innerHeight / 2,
      chatId
    });
  };

  const createNewGroup = async () => {
    if (!newGroupName.trim() || selectedUsers.length === 0) return;

    try {
      const chatRef = await addDoc(collection(db, 'chats'), {
        type: 'group',
        name: newGroupName,
        participants: [...selectedUsers.map(u => u.id), currentUser.id],
        createdBy: currentUser.id,
        createdAt: serverTimestamp(),
        lastMessage: 'Grupo criado',
        lastMessageTimestamp: serverTimestamp()
      });

      setNewGroupName('');
      setSelectedUsers([]);
      setShowNewGroup(false);
      setActiveChat({ id: chatRef.id, type: 'group', name: newGroupName });
    } catch (error) {
      console.error('Erro ao criar grupo:', error);
    }
  };

  const [searchResults, setSearchResults] = useState({ chats: [], users: [] });

  useEffect(() => {
    if (!searchTerm) {
      setSearchResults({ chats: chats, users: [] });
      return;
    }

    const term = searchTerm.toLowerCase();
    
    // Filtrar chats existentes
    const filteredChats = chats.filter(chat => {
      if (chat.type === 'group') {
        return chat.name.toLowerCase().includes(term);
      }
      const otherParticipant = availableUsers.find(
        u => chat.participants.includes(u.id) && u.id !== currentUser.id
      );
      return otherParticipant?.nome.toLowerCase().includes(term);
    });

    // Filtrar usuários disponíveis que ainda não têm chat
    const filteredUsers = availableUsers.filter(user => {
      // Verificar se já existe um chat individual com este usuário
      const hasChat = chats.some(chat => 
        chat.type !== 'group' && 
        chat.participants.includes(user.id)
      );
      
      return !hasChat && 
             user.id !== currentUser?.id && 
             user.nome.toLowerCase().includes(term);
    });

    setSearchResults({ chats: filteredChats, users: filteredUsers });
  }, [searchTerm, chats, availableUsers, currentUser]);

  const startNewChat = async (user) => {
    try {
      // Verificar se já existe um chat
      const chatExists = chats.find(chat => 
        chat.type !== 'group' && 
        chat.participants.includes(user.id)
      );

      if (chatExists) {
        setActiveChat(chatExists);
        return;
      }

      // Criar novo chat
      const chatRef = await addDoc(collection(db, 'chats'), {
        type: 'individual',
        participants: [currentUser.id, user.id],
        createdBy: currentUser.id,
        createdAt: serverTimestamp(),
        lastMessage: '',
        lastMessageTimestamp: serverTimestamp()
      });

      setActiveChat({ 
        id: chatRef.id, 
        type: 'individual',
        participants: [currentUser.id, user.id]
      });
      setSearchTerm('');
    } catch (error) {
      console.error('Erro ao criar novo chat:', error);
    }
  };

  const [buttonPos, setButtonPos] = useState(buttonPosition);
  const [unreadMessages, setUnreadMessages] = useState({});
  const [totalUnread, setTotalUnread] = useState(0);

  // Monitorar mensagens não lidas
  useEffect(() => {
    if (!currentUser?.id) return;

    const unreadQuery = query(
      collection(db, 'messages'),
      where('destinatario.id', '==', currentUser.id),
      where('lida', '==', false)
    );

    const unsubscribe = onSnapshot(unreadQuery, (snapshot) => {
      const unreadCounts = {};
      let total = 0;

      snapshot.docs.forEach((doc) => {
        const message = doc.data();
        const chatId = message.chatId;
        unreadCounts[chatId] = (unreadCounts[chatId] || 0) + 1;
        total++;
      });

      setUnreadMessages(unreadCounts);
      setTotalUnread(total);
    });

    return () => unsubscribe();
  }, [currentUser?.id]);

  // Marcar mensagens como lidas ao abrir o chat
  useEffect(() => {
    if (isOpen && activeChat) {
      const unreadMessagesQuery = query(
        collection(db, 'messages'),
        where('chatId', '==', activeChat.id),
        where('destinatario.id', '==', currentUser?.id),
        where('lida', '==', false)
      );

      getDocs(unreadMessagesQuery).then((snapshot) => {
        snapshot.docs.forEach((doc) => {
          updateDoc(doc.ref, { lida: true });
        });
      });
    }
  }, [isOpen, activeChat, currentUser?.id]);

  return (
    <>
      <div className="relative">
        <ChatButton
          isOpen={isOpen}
          onClick={() => setIsOpen(!isOpen)}
          position={buttonPos}
          onPositionChange={setButtonPos}
        />
        <ChatBadge count={totalUnread} />
      </div>

      {isOpen && (
        <div 
          className="fixed w-[420px] rounded-lg shadow-xl overflow-hidden z-[9998] workflow-chat-container h-[80vh] flex flex-col bg-[#36393f]"
          data-mobile-chat="true"
          style={isMobile ? {} : {
            // Posicionamento horizontal
            ...(buttonPos.x < window.innerWidth / 2
              ? { left: `${buttonPos.x + 70}px` } // Se o botão estiver na metade esquerda, abre à direita
              : { right: `${window.innerWidth - buttonPos.x + 20}px` }), // Se estiver na direita, abre à esquerda
            
            // Posicionamento vertical
            ...(buttonPos.y < window.innerHeight / 2
              ? { top: `${buttonPos.y + 70}px` } // Se estiver na metade superior, abre abaixo
              : { bottom: `${window.innerHeight - buttonPos.y + 20}px` }) // Se estiver na metade inferior, abre acima
          }}>
          {showProfile && activeChat ? (
            <>
              <div className="p-3 bg-[#1d9bf0] border-b flex items-center gap-3">
                <button 
                  onClick={() => setShowProfile(false)}
                  className="text-white hover:text-white/80 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h3 className="font-medium text-white">Perfil</h3>
              </div>
              <div className="flex-1 overflow-y-auto bg-[#36393f]">
                <div className="p-8 flex flex-col items-center border-b border-white/10">
                  <div className="workflow-chat-user-avatar w-32 h-32 text-4xl flex items-center justify-center mb-4">
                    {activeChat.type === 'group' 
                      ? activeChat.name.charAt(0).toUpperCase()
                      : availableUsers.find(u => activeChat.participants.includes(u.id))?.nome.charAt(0).toUpperCase()}
                  </div>
                  <h2 className="text-[#dcddde] text-xl font-medium mb-2">
                    {activeChat.type === 'group' 
                      ? activeChat.name 
                      : availableUsers.find(u => activeChat.participants.includes(u.id))?.nome}
                  </h2>
                  {activeChat.type === 'group' ? (
                    <p className="text-[#72767d]">{activeChat.participants.length} participantes</p>
                  ) : (
                    <p className="text-[#72767d]">Online</p>
                  )}
                </div>
                
                {activeChat.type === 'group' ? (
                  <div className="p-4">
                    <h3 className="text-[#dcddde] font-medium mb-3 px-4">Participantes</h3>
                    <div className="space-y-2">
                      {availableUsers
                        .filter(user => activeChat.participants.includes(user.id))
                        .map(user => (
                          <div key={user.id} className="flex items-center gap-3 p-4 hover:bg-white/5">
                            <div className="workflow-chat-user-avatar flex-shrink-0">
                              {user.nome.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h4 className="text-[#dcddde]">{user.nome}</h4>
                              <p className="text-[#72767d] text-sm">Online</p>
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                ) : (
                  <div className="p-4 space-y-4">
                    <div className="p-4 hover:bg-white/5">
                      <h3 className="text-[#72767d] text-sm mb-1">Email</h3>
                      <p className="text-[#dcddde]">
                        {availableUsers.find(u => activeChat.participants.includes(u.id))?.email || 'Não disponível'}
                      </p>
                    </div>
                    <div className="p-4 hover:bg-white/5">
                      <h3 className="text-[#72767d] text-sm mb-1">Status</h3>
                      <p className="text-[#dcddde]">Online</p>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Header */}
              <div className="p-3 bg-[#1d9bf0] border-b flex items-center justify-between">
                {activeChat ? (
                  <>
                    <div className="flex items-center flex-1 gap-3">
                      <button 
                        onClick={() => setActiveChat(null)}
                        className="text-white hover:text-white/80 transition-colors"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                      <div 
                        className="workflow-chat-user-avatar bg-white/10 text-white"
                        onClick={() => setShowProfile(true)}
                        style={{ cursor: 'pointer' }}
                      >
                        {activeChat.type === 'group' 
                          ? activeChat.name.charAt(0).toUpperCase()
                          : availableUsers.find(u => activeChat.participants.includes(u.id))?.nome.charAt(0).toUpperCase()}
                      </div>
                      <div onClick={() => setShowProfile(true)} style={{ cursor: 'pointer' }}>
                        <h3 className="font-medium text-white">
                          {activeChat.type === 'group' 
                            ? activeChat.name 
                            : availableUsers.find(u => activeChat.participants.includes(u.id))?.nome}
                        </h3>
                        {activeChat.type === 'group' && (
                          <p className="text-xs text-white/80">
                            {activeChat.participants.length} participantes
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="relative">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowOptionsMenu(!showOptionsMenu);
                        }}
                        className="text-white hover:text-white/80 transition-colors p-2"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>

                      {showOptionsMenu && (
                        <div 
                          className="absolute right-0 mt-2 w-48 bg-[#1f2936] rounded shadow-lg py-1 z-[10001] border border-white/10"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => {
                              setShowOptionsMenu(false);
                              setShowProfile(true);
                            }}
                            className="w-full px-4 py-2 text-left text-[#dcddde] hover:bg-white/5 flex items-center gap-2"
                          >
                            <div className="workflow-chat-user-avatar w-8 h-8 flex-shrink-0 flex items-center justify-center bg-white/10 text-white text-sm">
                              {activeChat.type === 'group' 
                                ? activeChat.name.charAt(0).toUpperCase()
                                : availableUsers.find(u => activeChat.participants.includes(u.id))?.nome.charAt(0).toUpperCase()}
                            </div>
                            <span>Ver perfil</span>
                          </button>
                          <button
                            onClick={toggleSound}
                            className="w-full px-4 py-2 text-left text-[#dcddde] hover:bg-white/5 flex items-center gap-2"
                          >
                            {soundEnabled ? (
                              <Volume2 className="w-4 h-4 text-[#1d9bf0]" />
                            ) : (
                              <VolumeX className="w-4 h-4 text-[#72767d]" />
                            )}
                            <span>{soundEnabled ? 'Desativar som' : 'Ativar som'}</span>
                          </button>
                          <button
                            onClick={() => handleDeleteChat(activeChat.id)}
                            className="w-full px-4 py-2 text-left text-[#dcddde] hover:bg-white/5 flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                            <span>Apagar conversa</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="font-medium text-white">Conversas</h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowNewGroup(true)}
                        className="text-white hover:text-white/80 transition-colors p-2"
                        title="Novo Grupo"
                      >
                        <Users className="w-5 h-5" />
                      </button>
                    </div>
                  </>
                )}
              </div>

              {showNewGroup ? (
                <div className="flex-1 overflow-auto p-4 bg-[#1f2936]">
                  <div className="mb-4">
                    <input
                      type="text"
                      placeholder="Nome do grupo"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      className="workflow-chat-input w-full"
                    />
                  </div>
                  <div className="bg-[#1f2936] rounded p-2 max-h-[400px] overflow-y-auto">
                    {availableUsers.map(user => (
                      <div
                        key={user.id}
                        onClick={() => {
                          if (selectedUsers.find(u => u.id === user.id)) {
                            setSelectedUsers(selectedUsers.filter(u => u.id !== user.id));
                          } else {
                            setSelectedUsers([...selectedUsers, user]);
                          }
                        }}
                        className={`p-2 rounded cursor-pointer flex items-center space-x-2 ${
                          selectedUsers.find(u => u.id === user.id)
                            ? 'bg-[#1D9BF0] bg-opacity-10'
                            : 'hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={selectedUsers.find(u => u.id === user.id)}
                            onChange={() => {}}
                            className="rounded text-[#1D9BF0] bg-[#2f3136] border border-white/10 focus:ring-[#1D9BF0] focus:ring-offset-0"
                          />
                          <span className="text-[#dcddde]">{user.nome}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={createNewGroup}
                    disabled={!newGroupName.trim() || selectedUsers.length === 0}
                    className="mt-4 w-full py-2 px-4 rounded bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white transition-colors disabled:opacity-50"
                  >
                    Criar Grupo
                  </button>
                </div>
              ) : activeChat ? (
                <>
                  <div className="flex-1 overflow-y-auto p-4 workflow-chat-messages bg-[#1f2936]">
                    {messages?.map((message) => (
                      <div
                        key={message.id}
                        className={`${message.senderId === currentUser.id ? 'text-right' : 'text-left'}`}
                      >
                        <div
                          className={`workflow-chat-message border border-white/10 ${
                            message.senderId === currentUser.id
                              ? 'workflow-chat-message-sent bg-[#1d9bf0] text-white'
                              : 'workflow-chat-message-received bg-[#40444b] text-[#dcddde]'
                          }`}
                        >
                          <p className={`text-xs font-medium mb-1 ${
                            message.senderId === currentUser.id
                              ? 'text-white/90'
                              : 'text-[#1d9bf0]'
                          }`}>
                            {message.senderId === currentUser.id ? 'Você' : message.senderName}
                          </p>
                          {message.type === 'text' && (
                            <p className="text-sm break-words">{message.text}</p>
                          )}

                          {message.type === 'image' && (
                            <div className="relative group cursor-pointer">
                              <img 
                                src={message.fileUrl} 
                                alt="Imagem" 
                                className="max-w-[300px] rounded-lg"
                                onClick={() => window.open(message.fileUrl, '_blank')}
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span className="text-white text-sm">Clique para ampliar</span>
                              </div>
                            </div>
                          )}

                          {message.type === 'video' && (
                            <video 
                              src={message.fileUrl} 
                              controls 
                              className="max-w-[300px] rounded-lg"
                            />
                          )}

                          {message.type === 'audio' && (
                            <div className="flex items-center gap-2">
                              {message.audioUrl ? (
                                <audio src={message.audioUrl} controls className="max-w-[200px]" />
                              ) : (
                                <div className="flex items-center gap-2 p-2 bg-[#40444b] rounded-lg">
                                  <Headphones className="w-4 h-4" />
                                  <span className="text-sm">Áudio indisponível</span>
                                </div>
                              )}
                            </div>
                          )}

                          {message.type === 'document' && (
                            <a 
                              href={message.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 p-2 bg-[#40444b] rounded-lg hover:bg-[#36393f] transition-colors"
                            >
                              <FileText className="w-5 h-5 text-[#1d9bf0]" />
                              <div className="overflow-hidden">
                                <p className="text-sm font-medium truncate">{message.fileName}</p>
                                <p className="text-xs text-[#72767d]">
                                  {(message.fileSize / (1024 * 1024)).toFixed(2)} MB
                                </p>
                              </div>
                            </a>
                          )}

                          <div className="flex items-center justify-end gap-1 mt-1">
                            <span className={`text-xs ${
                              message.senderId === currentUser.id
                                ? 'text-white/80'
                                : 'text-gray-400'
                            }`}>
                              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {message.senderId === currentUser.id && (
                              <span className="text-white">
                                {message.read ? (
                                  <CheckCheck className="w-3 h-3" />
                                ) : (
                                  <Check className="w-3 h-3" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                  <div className="p-3 border-t border-white/10 bg-[#1f2936] flex items-center gap-2 relative">
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="p-2 text-[#1d9bf0] hover:text-[#1a8cd8] hover:bg-white/5 rounded-full transition-colors"
                        title="Emoji"
                      >
                        <Smile className="w-5 h-5" />
                      </button>
                      {showEmojiPicker && (
                        <div className="absolute bottom-full left-0 mb-2">
                          <EmojiPicker
                            onEmojiClick={handleEmojiClick}
                            theme="dark"
                            emojiStyle="native"
                            searchPlaceholder="Pesquisar"
                          />
                        </div>
                      )}
                    </div>

                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowAttachMenu(!showAttachMenu)}
                        className="p-2 text-[#1d9bf0] hover:text-[#1a8cd8] hover:bg-white/5 rounded-full transition-colors"
                        title="Anexar arquivo"
                      >
                        <Paperclip className="w-5 h-5" />
                      </button>

                      {showAttachMenu && (
                        <div className="absolute bottom-full left-0 mb-2 bg-[#2f3136] rounded-lg shadow-lg border border-white/10">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={(e) => handleAttachFile(e.target.files[0], 'image')}
                          />
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-3 w-full px-4 py-3 text-[#dcddde] hover:bg-white/5"
                          >
                            <Image className="w-5 h-5 text-[#1d9bf0]" />
                            <span>Foto</span>
                          </button>

                          <button
                            onClick={() => {
                              fileInputRef.current.accept = '.pdf,.doc,.docx,.txt';
                              fileInputRef.current?.click();
                            }}
                            className="flex items-center gap-3 w-full px-4 py-3 text-[#dcddde] hover:bg-white/5"
                          >
                            <FileText className="w-5 h-5 text-[#1d9bf0]" />
                            <span>Documento</span>
                          </button>

                          <button
                            onClick={() => {
                              fileInputRef.current.accept = 'video/*';
                              fileInputRef.current?.click();
                            }}
                            className="flex items-center gap-3 w-full px-4 py-3 text-[#dcddde] hover:bg-white/5"
                          >
                            <Video className="w-5 h-5 text-[#1d9bf0]" />
                            <span>Vídeo</span>
                          </button>

                          <input
                            type="file"
                            accept="audio/*"
                            className="hidden"
                            ref={audioInputRef}
                            onChange={(e) => handleAttachFile(e.target.files[0], 'audio')}
                          />
                          <button
                            onClick={() => audioInputRef.current?.click()}
                            className="flex items-center gap-3 w-full px-4 py-3 text-[#dcddde] hover:bg-white/5"
                          >
                            <Headphones className="w-5 h-5 text-[#1d9bf0]" />
                            <span>Áudio</span>
                          </button>
                        </div>
                      )}
                    </div>

                    <form onSubmit={handleSendMessage} className="flex-1 flex gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Digite uma mensagem"
                        className="flex-1 workflow-chat-input bg-[#40444b] text-[#dcddde] border border-white/10 py-2 px-4 focus:outline-none focus:border-[#1d9bf0] text-sm"
                      />
                      {newMessage.trim() && (
                        <button
                          type="submit"
                          className="workflow-chat-send-button bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white p-2 rounded-full transition-colors"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      )}
                    </form>

                    {!newMessage.trim() && (
                      <button
                        type="button"
                        onMouseDown={startRecording}
                        onMouseUp={stopRecording}
                        onTouchStart={startRecording}
                        onTouchEnd={stopRecording}
                        className={`workflow-chat-send-button rounded-full p-2 transition-colors ${
                          isRecording 
                            ? 'bg-red-500 text-white hover:bg-red-600' 
                            : 'text-[#1d9bf0] hover:text-[#1a8cd8] hover:bg-white/5'
                        }`}
                        title="Pressione e segure para gravar"
                      >
                        <Mic className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="p-3 bg-[#1f2936] border-b border-white/10">
                    <div className="relative">
                      <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-[#72767d]" />
                      <input
                        type="text"
                        placeholder="Pesquisar conversas ou usuários"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-14 pr-4 py-2 workflow-chat-search border-none focus:outline-none text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto bg-[#1f2936]">
                    {searchResults.chats.map((chat) => {
                      const otherUser = chat.type !== 'group' 
                        ? availableUsers.find(u => chat.participants.includes(u.id) && u.id !== currentUser.id)
                        : null;
                      const chatName = chat.type === 'group' ? chat.name : otherUser?.nome;
                      const initial = chatName?.charAt(0).toUpperCase();
                      
                      return (
                        <div
                          key={chat.id}
                          onClick={() => setActiveChat(chat)}
                          onContextMenu={(e) => handleContextMenu(e, chat.id)}
                          onTouchStart={() => {
                            const timer = setTimeout(() => handleLongPress(chat.id), 500);
                            return () => clearTimeout(timer);
                          }}
                          className="workflow-chat-list-item p-3 border-b border-white/10 cursor-pointer flex items-center gap-3 relative"
                        >
                          {unreadMessages[chat.id] > 0 && (
                            <ChatBadge count={unreadMessages[chat.id]} />
                          )}
                          <div className="workflow-chat-user-avatar flex-shrink-0">
                            {initial}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline">
                              <h4 className="font-medium text-[#dcddde] truncate">
                                {chatName}
                              </h4>
                              <span className="text-xs text-[#72767d] ml-2 flex-shrink-0">
                                {formatLastMessageTime(chat.lastMessageTimestamp)}
                              </span>
                            </div>
                            <p className="text-sm text-[#72767d] truncate">
                              {chat.lastMessage}
                            </p>
                          </div>
                        </div>
                      );
                    })}

                    {/* Seção de usuários encontrados */}
                    {searchTerm && searchResults.users.length > 0 && (
                      <div className="mt-2 border-t border-white/10">
                        <div className="p-2 bg-[#2f3136]">
                          <span className="text-xs font-medium text-[#72767d]">
                            Usuários encontrados
                          </span>
                        </div>
                        {searchResults.users.map((user) => (
                          <div
                            key={user.id}
                            onClick={() => startNewChat(user)}
                            className="workflow-chat-list-item p-3 border-b border-white/10 cursor-pointer flex items-center gap-3"
                          >
                            <div className="workflow-chat-user-avatar flex-shrink-0">
                              {user.nome.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-[#dcddde] truncate">
                                {user.nome}
                              </h4>
                              <p className="text-sm text-[#1d9bf0]">
                                Iniciar conversa
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          )}

          {/* Menu de contexto */}
          {contextMenu.visible && (
            <div
              className="fixed bg-[#1f2936] border border-white/10 rounded shadow-lg py-1 z-[10000]"
              style={{
                top: contextMenu.y,
                left: contextMenu.x,
                transform: 'translate(-50%, -50%)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => handleDeleteChat(contextMenu.chatId)}
                className="w-full px-4 py-2 text-left text-[#dcddde] hover:bg-white/5 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
                <span>Apagar conversa</span>
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default WorkflowChat;
