import React, { useState, useRef } from 'react';
import { Send, Image, Smile, Paperclip } from 'lucide-react';
import { uploadToDiscord } from '../../services/discordStorage';

const MessageInput = ({ onEnviar }) => {
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [uploadando, setUploadando] = useState(false);
  const fileInputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!texto.trim() || enviando) return;

    setEnviando(true);
    await onEnviar(texto, 'texto');
    setTexto('');
    setEnviando(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas imagens');
      return;
    }

    // Validar tamanho (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 10MB');
      return;
    }

    setUploadando(true);

    try {
      // Upload para Discord
      const resultado = await uploadToDiscord(file, 'posts', {
        tipo: 'mensagem',
        uploadPor: 'usuario'
      });

      // Enviar mensagem com imagem
      await onEnviar(resultado.url, 'imagem', {
        discordMessageId: resultado.messageId,
        discordChannelId: resultado.channelId,
        nomeArquivo: resultado.filename,
        tamanho: resultado.size
      });

    } catch (error) {
      console.error('Erro ao enviar imagem:', error);
      alert('Erro ao enviar imagem. Tente novamente.');
    } finally {
      setUploadando(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-2 sm:p-3 md:p-4 flex-shrink-0">
      <div className="flex items-end gap-1.5 sm:gap-2">
        {/* Botões de ações - Responsivo */}
        <div className="flex gap-0.5 sm:gap-1">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadando}
            className="p-1.5 sm:p-2 text-gray-500 hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            title="Enviar imagem"
            aria-label="Enviar imagem"
          >
            {uploadando ? (
              <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Image className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </button>

          <button
            type="button"
            className="p-1.5 sm:p-2 text-gray-500 hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors hidden sm:flex active:scale-95"
            title="Emoji (em breve)"
            aria-label="Emoji"
            disabled
          >
            <Smile className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Input de texto - Responsivo */}
        <div className="flex-1 relative">
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite uma mensagem..."
            disabled={enviando || uploadando}
            rows={1}
            className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              minHeight: '36px',
              maxHeight: '100px',
            }}
            onInput={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
            }}
          />
        </div>

        {/* Botão enviar - Responsivo */}
        <button
          type="submit"
          disabled={!texto.trim() || enviando || uploadando}
          className="p-2 sm:p-2.5 md:p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          title="Enviar mensagem"
          aria-label="Enviar mensagem"
        >
          {enviando ? (
            <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="w-4 h-4 sm:w-5 sm:h-5" />
          )}
        </button>
      </div>

      {/* Dica de atalho - Apenas desktop */}
      <p className="hidden sm:block text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
        Pressione Enter para enviar • Shift + Enter para nova linha
      </p>
    </form>
  );
};

export default MessageInput;
