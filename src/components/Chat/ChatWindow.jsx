import React, { useState, useEffect, useRef } from 'react';
import { Send, Users, Plus, ArrowLeft } from 'lucide-react';
import { twitterThemeConfig } from '../../styles/twitterThemeConfig';

const ChatWindow = ({ isOpen, onClose, currentUser }) => {
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
    setShowNewGroup(false);
    setNewGroupName('');
    setSelectedUsers([]);
  };

  return isOpen ? (
    <div
      className={`fixed right-4 bottom-[73px] bg-[#192734] border border-[#38444D] rounded-lg shadow-xl w-80 mb-2 max-h-[calc(100vh-100px)] flex flex-col`}
      style={{
        zIndex: 1000,
      }}
    >
      {/* Cabeçalho do Chat */}
      <div className={`p-4 border-b ${colors.borderColor} flex items-center justify-between`}>
        {activeChat ? (
          <>
            <button
              onClick={() => setActiveChat(null)}
              className={`p-2 rounded-full hover:${colors.backgroundSecondary}`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h3 className={`font-medium ${colors.text}`}>
              {activeChat.name || activeChat.displayName}
            </h3>
            <div className="w-8" /> {/* Espaçador para manter o título centralizado */}
          </>
        ) : (
          <>
            <h3 className={`font-medium ${colors.text}`}>Mensagens</h3>
            <button
              onClick={() => setShowNewGroup(true)}
              className={`p-2 rounded-full hover:${colors.backgroundSecondary}`}
            >
              <Plus className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Área principal */}
      {showNewGroup ? (
        <div className="p-4">
          <input
            type="text"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="Nome do grupo"
            className={`w-full p-2 rounded ${colors.input}`}
          />
          <div className="mt-4">
            <h4 className={`font-medium ${colors.text} mb-2`}>Adicionar participantes:</h4>
            {/* Aqui você pode adicionar uma lista de usuários para selecionar */}
          </div>
          <button
            onClick={createNewGroup}
            className={`mt-4 w-full p-2 rounded ${colors.buttonPrimary}`}
          >
            Criar Grupo
          </button>
        </div>
      ) : activeChat ? (
        <>
          <div className="flex-1 overflow-y-auto p-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`mb-4 flex ${
                  message.sender.id === currentUser.id ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[70%] p-3 rounded-lg ${
                    message.sender.id === currentUser.id
                      ? 'bg-[#1DA1F2] text-white'
                      : `${colors.backgroundSecondary} ${colors.text}`
                  }`}
                >
                  {message.text}
                  <div
                    className={`text-xs mt-1 ${
                      message.sender.id === currentUser.id
                        ? 'text-white text-opacity-75'
                        : colors.textSecondary
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="p-4 flex gap-2 border-t border-[#38444D]">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Digite sua mensagem..."
              className={`flex-1 p-2 rounded-full ${colors.input}`}
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
        <div className="flex-1 overflow-y-auto">
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