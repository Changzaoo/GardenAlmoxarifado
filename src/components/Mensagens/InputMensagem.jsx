import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Image, Smile, X, File } from 'lucide-react';
import { MESSAGE_TYPE, LIMITS } from '../../constants/mensagensConstants';
import { toast } from 'react-toastify';

const InputMensagem = ({ 
  onEnviar, 
  onEnviarArquivo,
  onDigitando,
  disabled = false,
  bloqueado = false 
}) => {
  const [texto, setTexto] = useState('');
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [arquivoSelecionado, setArquivoSelecionado] = useState(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const digitandoTimeoutRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [texto]);

  const handleTextChange = (e) => {
    const newText = e.target.value;
    if (newText.length <= LIMITS.MAX_MESSAGE_LENGTH) {
      setTexto(newText);
      
      // Indicador de digitação
      if (onDigitando) {
        onDigitando(true);
        
        if (digitandoTimeoutRef.current) {
          clearTimeout(digitandoTimeoutRef.current);
        }
        
        digitandoTimeoutRef.current = setTimeout(() => {
          onDigitando(false);
        }, LIMITS.TYPING_TIMEOUT);
      }
    }
  };

  const handleEnviar = () => {
    if (!texto.trim() || disabled) return;
    
    onEnviar(texto);
    setTexto('');
    
    if (onDigitando) {
      onDigitando(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEnviar();
    }
  };

  const handleFileSelect = (tipo) => {
    setShowAttachMenu(false);
    if (fileInputRef.current) {
      fileInputRef.current.accept = tipo === MESSAGE_TYPE.IMAGEM 
        ? 'image/*' 
        : '*/*';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar tamanho
    if (file.size > LIMITS.MAX_FILE_SIZE) {
      toast.error(`Arquivo muito grande. Máximo: ${LIMITS.MAX_FILE_SIZE / (1024 * 1024)}MB`);
      return;
    }

    setArquivoSelecionado(file);
  };

  const handleEnviarArquivo = () => {
    if (!arquivoSelecionado) return;

    const tipo = arquivoSelecionado.type.startsWith('image/') 
      ? MESSAGE_TYPE.IMAGEM 
      : MESSAGE_TYPE.ARQUIVO;

    onEnviarArquivo(arquivoSelecionado, tipo);
    setArquivoSelecionado(null);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const cancelarArquivo = () => {
    setArquivoSelecionado(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (bloqueado) {
    return (
      <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50">
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          🚫 Você não pode enviar mensagens para este contato
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 sm:p-4 w-full">
      {/* Preview de arquivo selecionado */}
      {arquivoSelecionado && (
        <div className="mb-3 flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg max-w-full">
          <div className="w-10 h-10 flex-shrink-0 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
            {arquivoSelecionado.type.startsWith('image/') ? (
              <Image className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            ) : (
              <File className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {arquivoSelecionado.name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {(arquivoSelecionado.size / 1024).toFixed(1)} KB
            </p>
          </div>
          <button
            onClick={handleEnviarArquivo}
            disabled={disabled}
            className="flex-shrink-0 px-3 sm:px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 text-sm"
          >
            Enviar
          </button>
          <button
            onClick={cancelarArquivo}
            className="flex-shrink-0 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      )}

      {/* Input principal */}
      <div className="flex items-end gap-2 max-w-full">
        {/* Botão de anexos */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setShowAttachMenu(!showAttachMenu)}
            disabled={disabled}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full active:scale-95 transition-all disabled:opacity-50"
          >
            <Paperclip className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 dark:text-gray-400" />
          </button>

          {/* Menu de anexos */}
          {showAttachMenu && (
            <div className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2 min-w-[140px] sm:min-w-[150px] z-50">
              <button
                onClick={() => handleFileSelect(MESSAGE_TYPE.IMAGEM)}
                className="w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-left"
              >
                <Image className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 flex-shrink-0" />
                <span className="text-xs sm:text-sm">Imagem</span>
              </button>
              <button
                onClick={() => handleFileSelect(MESSAGE_TYPE.ARQUIVO)}
                className="w-full flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-left"
              >
                <File className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 flex-shrink-0" />
                <span className="text-xs sm:text-sm">Documento</span>
              </button>
            </div>
          )}
        </div>

        {/* Textarea */}
        <div className="flex-1 min-w-0 bg-gray-100 dark:bg-gray-700 rounded-2xl px-3 sm:px-4 py-2">
          <textarea
            ref={textareaRef}
            value={texto}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder="Digite uma mensagem..."
            disabled={disabled}
            className="w-full bg-transparent border-none outline-none resize-none max-h-32 text-sm sm:text-base text-gray-900 dark:text-gray-100 placeholder-gray-500 disabled:opacity-50"
            rows={1}
          />
          <div className="text-[10px] sm:text-xs text-gray-400 text-right mt-1">
            {texto.length}/{LIMITS.MAX_MESSAGE_LENGTH}
          </div>
        </div>

        {/* Botão enviar */}
        <button
          onClick={handleEnviar}
          disabled={disabled || !texto.trim()}
          className="flex-shrink-0 p-2.5 sm:p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>

      {/* Input file oculto */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};

export default InputMensagem;
