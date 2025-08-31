import React, { useState, useEffect, useRef } from 'react';
import { Send, Users, Plus, ArrowLeft } from 'lucide-react';
import { twitterThemeConfig } from '../../styles/twitterThemeConfig';

const ChatWindow = ({ isOpen, onClose, currentUser, buttonPosition }) => {
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chats, setChats] = useState([]);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const { colors, classes } = twitterThemeConfig;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (messages.length) {
      scrollToBottom();
    }
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const message = {
      id: Date.now(),
      text: newMessage,
      sender: currentUser,
      timestamp: new Date(),
    };

    setMessages([...messages, message]);
    setNewMessage('');
  };

  const createNewGroup = () => {
    if (!newGroupName.trim() || selectedUsers.length === 0) return;

    const newGroup = {
      id: Date.now(),
      name: newGroupName,
      type: 'group',
      members: [...selectedUsers, currentUser],
      lastMessage: 'Grupo criado',
      timestamp: new Date(),
    };

    setChats([...chats, newGroup]);
    setNewGroupName('');
    setSelectedUsers([]);
    setShowNewGroup(false);
  };

  const ChatHeader = () => (
    <div className={`p-4 border-b ${colors.borderColor} flex items-center`}>
      {activeChat ? (
        <>
          <button onClick={() => setActiveChat(null)} className={`mr-2 ${colors.textSecondary} hover:${colors.text}`}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h3 className={`font-medium ${colors.text}`}>{activeChat.name || activeChat.displayName}</h3>
            {activeChat.type === 'group' && (
              <p className={`text-xs ${colors.textSecondary}`}>{activeChat.members.length} membros</p>
            )}
          </div>
        </>
      ) : (
        <>
          <h3 className={`font-medium ${colors.text}`}>Chat</h3>
          <button
            onClick={() => setShowNewGroup(true)}
            className={`ml-auto ${colors.primary} hover:${colors.primaryHover} p-2 rounded-full`}
            title="Novo Grupo"
          >
            <Users className="w-5 h-5" />
          </button>
        </>
      )}
    </div>
  );

  return isOpen ? (
    <div 
      className={`fixed w-80 rounded-lg shadow-xl overflow-hidden z-[9998] ${classes.card}`}
      style={{
        left: buttonPosition?.x < window.innerWidth / 2 ? buttonPosition?.x : undefined,
        right: buttonPosition?.x >= window.innerWidth / 2 ? window.innerWidth - buttonPosition?.x - 70 : undefined,
        top: buttonPosition?.y < window.innerHeight / 2 ? buttonPosition?.y + 80 : undefined,
        bottom: buttonPosition?.y >= window.innerHeight / 2 ? window.innerHeight - buttonPosition?.y : undefined,
      }}>
      <ChatHeader />
      
      {showNewGroup ? (
        <div className="p-4">
          <div className="mb-4">
            <input
              type="text"
              placeholder="Nome do grupo"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              className={classes.input}
            />
          </div>
          {/* Aqui virá a lista de usuários para selecionar */}
          <button
            onClick={createNewGroup}
            className={`w-full py-2 px-4 rounded ${colors.buttonPrimary}`}
          >
            Criar Grupo
          </button>
        </div>
      ) : activeChat ? (
        <>
          <div className="h-96 overflow-y-auto p-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`mb-4 ${message.sender.uid === currentUser.uid ? 'text-right' : 'text-left'}`}
              >
                <div
                  className={`inline-block p-3 rounded-lg max-w-[80%] ${
                    message.sender.uid === currentUser.uid
                      ? 'bg-[#1D9BF0] text-white'
                      : `${colors.backgroundSecondary}`
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                  <span className={`text-xs ${colors.textSecondary}`}>
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={handleSendMessage} className="p-4 border-t flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Digite sua mensagem..."
              className={`flex-1 ${classes.input}`}
            />
            <button
              type="submit"
              className={`p-2 rounded-full ${colors.buttonPrimary}`}
              disabled={!newMessage.trim()}
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </>
      ) : (
        <div className="h-96 overflow-y-auto">
          {chats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => setActiveChat(chat)}
              className={`p-4 border-b ${colors.borderColor} cursor-pointer hover:${colors.backgroundSecondary}`}
            >
              <div className="flex justify-between items-start">
                <h4 className={`font-medium ${colors.text}`}>{chat.name || chat.displayName}</h4>
                <span className={`text-xs ${colors.textSecondary}`}>
                  {chat.timestamp.toLocaleTimeString()}
                </span>
              </div>
              <p className={`text-sm ${colors.textSecondary} truncate`}>{chat.lastMessage}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  ) : null;
};

export default ChatWindow;
