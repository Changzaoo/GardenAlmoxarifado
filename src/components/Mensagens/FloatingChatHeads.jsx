import React, { useState, useEffect } from 'react';
import { X, MessageCircle, Minimize2, Maximize2, Send } from 'lucide-react';
import SafeImage from '../common/SafeImage';
import { useMensagens } from '../../hooks/useMensagens';

/**
 * 💬 FloatingChatHeads - Conversas flutuantes estilo Messenger
 * 
 * Permite manter conversas abertas enquanto navega no app
 * Funciona como chat heads do Facebook Messenger
 */
const FloatingChatHeads = () => {
  const [chatHeads, setChatHeads] = useState([]);
  const [minimizedChats, setMinimizedChats] = useState([]);
  const { 
    conversas, 
    mensagens, 
    enviarMensagem, 
    marcarComoLida,
    selecionarConversa,
    conversaAtiva 
  } = useMensagens();

  // Estado para mensagens de cada chat head
  const [chatMessages, setChatMessages] = useState({});
  const [newMessage, setNewMessage] = useState({});

  /**
   * Adicionar nova conversa flutuante
   */
  const addChatHead = (conversa) => {
    if (!conversa) return;
    
    // Verificar se já está aberta
    const exists = chatHeads.find(ch => ch.id === conversa.id);
    if (exists) {
      // Se existir mas está minimizada, maximizar
      if (minimizedChats.includes(conversa.id)) {
        setMinimizedChats(prev => prev.filter(id => id !== conversa.id));
      }
      return;
    }
    
    // Selecionar conversa para carregar mensagens
    selecionarConversa(conversa.id);
    
    // Limitar a 3 chat heads abertos
    if (chatHeads.length >= 3) {
      setChatHeads(prev => [...prev.slice(1), conversa]);
    } else {
      setChatHeads(prev => [...prev, conversa]);
    }
  };

  /**
   * Atualizar mensagens dos chat heads quando mensagens mudarem
   */
  useEffect(() => {
    chatHeads.forEach(chatHead => {
      if (conversaAtiva?.id === chatHead.id && mensagens.length > 0) {
        setChatMessages(prev => ({
          ...prev,
          [chatHead.id]: mensagens
        }));
      }
    });
  }, [mensagens, conversaAtiva, chatHeads]);

  /**
   * Remover chat head
   */
  const removeChatHead = (conversaId) => {
    setChatHeads(prev => prev.filter(ch => ch.id !== conversaId));
    setMinimizedChats(prev => prev.filter(id => id !== conversaId));
    // Limpar mensagens do cache
    setChatMessages(prev => {
      const newMessages = { ...prev };
      delete newMessages[conversaId];
      return newMessages;
    });
  };

  /**
   * Minimizar/Maximizar chat head
   */
  const toggleMinimize = (conversaId) => {
    setMinimizedChats(prev => {
      if (prev.includes(conversaId)) {
        return prev.filter(id => id !== conversaId);
      } else {
        return [...prev, conversaId];
      }
    });
  };

  /**
   * Enviar mensagem
   */
  const handleSendMessage = async (conversaId) => {
    const message = newMessage[conversaId]?.trim();
    if (!message) return;

    try {
      await enviarMensagem(conversaId, message);
      setNewMessage(prev => ({ ...prev, [conversaId]: '' }));
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
  };

  /**
   * Escutar evento para abrir chat head (do service worker)
   */
  useEffect(() => {
    const handleNotificationClick = (event) => {
      if (event.data?.type === 'NOTIFICATION_CLICKED' && event.data?.conversaId) {
        const conversa = conversas.find(c => c.id === event.data.conversaId);
        if (conversa) {
          addChatHead(conversa);
        }
      }
    };

    navigator.serviceWorker?.addEventListener('message', handleNotificationClick);
    
    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleNotificationClick);
    };
  }, [conversas]);

  /**
   * Expor função global para abrir chat heads
   */
  useEffect(() => {
    window.openFloatingChat = (conversaId) => {
      const conversa = conversas.find(c => c.id === conversaId);
      if (conversa) {
        addChatHead(conversa);
      }
    };

    return () => {
      delete window.openFloatingChat;
    };
  }, [conversas, chatHeads, addChatHead]);

  if (chatHeads.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col-reverse gap-3">
      {chatHeads.map((chatHead, index) => {
        const isMinimized = minimizedChats.includes(chatHead.id);
        const outroParticipante = chatHead.participantes?.find(p => p.id !== chatHead.currentUserId);
        const messages = chatMessages[chatHead.id] || [];

        return (
          <div
            key={chatHead.id}
            className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 transition-all duration-300 ${
              isMinimized ? 'w-14 h-14' : 'w-80 sm:w-96'
            }`}
            style={{
              maxHeight: isMinimized ? '56px' : '500px',
              transform: `translateY(${index * (isMinimized ? -60 : -10)}px)`
            }}
          >
            {/* Header */}
            <div 
              className={`bg-gradient-to-r from-blue-500 to-cyan-500 p-3 rounded-t-2xl cursor-pointer ${
                isMinimized ? 'rounded-2xl' : ''
              }`}
              onClick={() => toggleMinimize(chatHead.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {/* Avatar */}
                  <SafeImage
                    src={outroParticipante?.fotoPerfil}
                    alt={outroParticipante?.nome}
                    className="w-8 h-8 rounded-full object-cover border-2 border-white flex-shrink-0"
                    fallback={
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center border-2 border-white">
                        <MessageCircle className="w-4 h-4 text-white" />
                      </div>
                    }
                  />
                  
                  {/* Nome */}
                  {!isMinimized && (
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-white truncate">
                        {outroParticipante?.nome || 'Conversa'}
                      </h4>
                    </div>
                  )}
                </div>

                {/* Botões */}
                {!isMinimized && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleMinimize(chatHead.id);
                      }}
                      className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                      title="Minimizar"
                    >
                      <Minimize2 className="w-4 h-4 text-white" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeChatHead(chatHead.id);
                      }}
                      className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                      title="Fechar"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Body - Mensagens */}
            {!isMinimized && (
              <>
                <div className="h-80 overflow-y-auto p-3 space-y-2 bg-gray-50 dark:bg-gray-900">
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      <MessageCircle className="w-8 h-8" />
                    </div>
                  ) : (
                    messages.map((msg, idx) => {
                      const isSent = msg.remetenteId === chatHead.currentUserId;
                      return (
                        <div
                          key={idx}
                          className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] px-3 py-2 rounded-2xl ${
                              isSent
                                ? 'bg-blue-500 text-white rounded-br-sm'
                                : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-sm'
                            }`}
                          >
                            <p className="text-sm break-words">{msg.texto}</p>
                            <p className={`text-xs mt-1 ${
                              isSent ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              {new Date(msg.timestamp).toLocaleTimeString('pt-BR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Input */}
                <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-b-2xl">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newMessage[chatHead.id] || ''}
                      onChange={(e) => setNewMessage(prev => ({
                        ...prev,
                        [chatHead.id]: e.target.value
                      }))}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(chatHead.id);
                        }
                      }}
                      placeholder="Digite uma mensagem..."
                      className="flex-1 px-3 py-2 rounded-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                    <button
                      onClick={() => handleSendMessage(chatHead.id)}
                      disabled={!newMessage[chatHead.id]?.trim()}
                      className="p-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-full transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default FloatingChatHeads;
