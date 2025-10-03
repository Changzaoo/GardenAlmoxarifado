import React, { useEffect, useRef, useState } from 'react';
import { ArrowDown, Loader } from 'lucide-react';
import BolhaMensagem from './BolhaMensagem';
import InputMensagem from './InputMensagem';

const JanelaChat = ({ 
  conversa, 
  onBack,
  mensagens = [], // Default para evitar undefined
  enviando,
  enviarMensagem,
  enviarArquivo,
  deletarMensagem,
  apagarParaMim,
  apagarParaTodos,
  editarMensagem,
  carregarMensagensAntigas,
  atualizarDigitacao,
  verificarBloqueio,
  getOutroParticipante,
  buscarInfoParticipante
}) => {

  const [showScrollButton, setShowScrollButton] = useState(false);
  const [bloqueado, setBloqueado] = useState(false);
  const [carregandoAntigas, setCarregandoAntigas] = useState(false);
  const [mensagensLocal, setMensagensLocal] = useState([]); // Estado local para garantir persistência
  const [nomeParticipante, setNomeParticipante] = useState('');
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);
  const mensagensRef = useRef([]); // Ref para manter mensagens mesmo se props mudarem

  // Atualizar mensagens locais quando props mudarem
  useEffect(() => {
    console.log('🪟 JanelaChat - Mensagens recebidas via props:', mensagens?.length || 0);
    console.log('🆔 IDs das mensagens:', mensagens?.map(m => m.id) || []);
    console.log('📦 Array completo de mensagens:', mensagens);
    
    if (mensagens && mensagens.length > 0) {
      console.log('✅ Atualizando mensagensLocal com', mensagens.length, 'mensagens');
      setMensagensLocal(mensagens);
      mensagensRef.current = mensagens; // Backup no ref
    } else if (mensagens && mensagens.length === 0 && mensagensRef.current.length > 0) {
      console.log('⚠️ Props com array vazio mas ref tem mensagens! Mantendo as do ref');
      // NÃO limpar se já temos mensagens
    } else {
      console.log('📭 Sem mensagens ainda');
    }
    
    scrollToBottom();
  }, [mensagens]);

  useEffect(() => {
    checkBloqueio();
    carregarNomeParticipante();
  }, [conversa]);

  const checkBloqueio = async () => {
    if (conversa) {
      const blocked = await verificarBloqueio(conversa.id);
      setBloqueado(blocked);
    }
  };

  const carregarNomeParticipante = async () => {
    if (conversa && conversa.tipo !== 'grupo') {
      const outroId = getOutroParticipante(conversa);
      if (outroId && buscarInfoParticipante) {
        const info = await buscarInfoParticipante(outroId);
        if (info) {
          setNomeParticipante(info.nome || info.email || 'Usuario');
        }
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShowScrollButton(!isAtBottom);

    // Carregar mensagens antigas ao chegar no topo
    if (scrollTop === 0 && !carregandoAntigas) {
      handleLoadOlder();
    }
  };

  const handleLoadOlder = async () => {
    setCarregandoAntigas(true);
    try {
      await carregarMensagensAntigas();
    } finally {
      setCarregandoAntigas(false);
    }
  };

  const handleDownload = (url, filename) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || 'arquivo';
    link.click();
  };

  const outroParticipante = getOutroParticipante(conversa);

  return (
    <div className="flex flex-col h-full w-full bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-2.5 sm:p-4 flex items-center gap-2 sm:gap-3 flex-shrink-0 w-full">
        <button
          onClick={onBack}
          className="lg:hidden p-1.5 sm:p-2 active:bg-gray-100 dark:active:bg-gray-700 sm:hover:bg-gray-100 dark:sm:hover:bg-gray-700 rounded-full transition-colors"
          aria-label="Voltar"
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm sm:text-base overflow-hidden flex-shrink-0">
          {conversa.photoURL ? (
            <img 
              src={conversa.photoURL} 
              alt={conversa.nome || nomeParticipante || 'Usuário'} 
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.textContent = (conversa.nome || nomeParticipante)?.charAt(0).toUpperCase() || '?';
              }}
            />
          ) : (
            (conversa.nome || nomeParticipante)?.charAt(0).toUpperCase() || '?'
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
            {conversa.nome || nomeParticipante || 'Conversa'}
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
            {bloqueado ? '🚫 Bloqueado' : 'Online'}
          </p>
        </div>
      </div>

      {/* Mensagens */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 space-y-1 w-full"
        style={{ 
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {carregandoAntigas && (
          <div className="flex justify-center py-2">
            <Loader className="w-5 h-5 animate-spin text-gray-400" />
          </div>
        )}

        {/* Debug: Mostrar quantidade de mensagens */}
        {mensagensLocal.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <p>Nenhuma mensagem ainda</p>
            <p className="text-xs mt-2">Props tem {mensagens?.length || 0} mensagens</p>
            <p className="text-xs">Local tem {mensagensLocal.length} mensagens</p>
            <p className="text-xs">Ref tem {mensagensRef.current.length} mensagens</p>
          </div>
        )}

        {mensagensLocal
          .filter(msg => {
            // Filtrar mensagens apagadas para o usuário atual
            if (msg.deletadaPara?.includes(conversa.userId)) {
              return false;
            }
            return true;
          })
          .map((msg, index) => {
            const prevMsg = mensagensLocal[index - 1];
            const groupWithPrevious = 
              prevMsg && 
              prevMsg.remetenteId === msg.remetenteId &&
              (msg.timestamp?.seconds - prevMsg.timestamp?.seconds) < 60;

            return (
              <BolhaMensagem
                key={msg.id}
                mensagem={msg}
                isPropriaMsg={msg.remetenteId === conversa.userId}
                groupWithPrevious={groupWithPrevious}
                onEdit={(msg) => {
                  const newText = prompt('Editar mensagem:', msg.texto);
                  if (newText) editarMensagem(conversa.id, msg.id, newText);
                }}
                onDeleteForMe={(msg) => {
                  if (confirm('Apagar esta mensagem para você? Ela continuará visível para outros participantes.')) {
                    apagarParaMim(conversa.id, msg.id);
                  }
                }}
                onDeleteForEveryone={(msg) => {
                  if (confirm('Apagar esta mensagem para todos? Ela será removida para todos os participantes.')) {
                    apagarParaTodos(conversa.id, msg.id);
                  }
                }}
                onDownload={handleDownload}
              />
            );
          })
        }
        <div ref={messagesEndRef} />
      </div>

      {/* Botão scroll para baixo */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-20 sm:bottom-24 right-4 sm:right-8 p-2.5 sm:p-3 bg-blue-500 text-white rounded-full shadow-lg active:scale-95 sm:hover:bg-blue-600 transition-all z-10"
          aria-label="Rolar para baixo"
        >
          <ArrowDown className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      )}

      {/* Input */}
      <div className="flex-shrink-0">
        <InputMensagem
          onEnviar={(texto) => enviarMensagem(conversa.id, texto)}
          onEnviarArquivo={(file, tipo) => enviarArquivo(conversa.id, file, tipo)}
          onDigitando={(isTyping) => atualizarDigitacao(conversa.id, isTyping)}
          disabled={enviando}
          bloqueado={bloqueado}
        />
      </div>
    </div>
  );
};

export default JanelaChat;
