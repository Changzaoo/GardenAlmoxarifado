import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Check, CheckCheck } from 'lucide-react';

const MessageBubble = ({ mensagem, isOwn, showAvatar }) => {
  
  const formatarHora = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return format(date, 'HH:mm', { locale: ptBR });
    } catch (error) {
      return '';
    }
  };

  const getStatusIcon = () => {
    if (!isOwn) return null;

    const status = mensagem.status || {};
    
    // Verificar se foi lida por alguém
    const foiLida = status.lida && Object.values(status.lida).some(v => v === true && v !== mensagem.remetenteId);
    
    if (foiLida) {
      return <CheckCheck className="w-4 h-4 text-blue-500" />;
    } else if (status.entregue) {
      return <CheckCheck className="w-4 h-4 text-gray-400" />;
    } else {
      return <Check className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} items-end gap-2 px-2`}>
      {/* Avatar para mensagens de grupo */}
      {!isOwn && showAvatar && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
          {mensagem.remetenteNome?.charAt(0).toUpperCase() || 'U'}
        </div>
      )}

      {/* Balão de mensagem */}
      <div className={`max-w-xs md:max-w-md lg:max-w-lg`}>
        {/* Nome do remetente (apenas em grupos e se não for própria) */}
        {!isOwn && showAvatar && (
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 ml-2">
            {mensagem.remetenteNome}
          </p>
        )}

        <div
          className={`rounded-2xl px-4 py-2 shadow-sm ${
            isOwn
              ? 'bg-blue-500 text-white rounded-br-none'
              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-none'
          }`}
        >
          {/* Conteúdo da mensagem */}
          {mensagem.tipo === 'texto' && (
            <p className="break-words whitespace-pre-wrap text-sm md:text-base">
              {mensagem.conteudo}
            </p>
          )}

          {mensagem.tipo === 'imagem' && (
            <div className="space-y-2">
              <img
                src={mensagem.conteudo}
                alt="Imagem enviada"
                className="rounded-lg max-w-full h-auto"
              />
              {mensagem.metadata?.legenda && (
                <p className="break-words whitespace-pre-wrap text-sm">
                  {mensagem.metadata.legenda}
                </p>
              )}
            </div>
          )}

          {/* Hora e status */}
          <div className={`flex items-center justify-end gap-1 mt-1 ${
            isOwn ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'
          }`}>
            <span className="text-xs">
              {formatarHora(mensagem.timestamp)}
            </span>
            {getStatusIcon()}
          </div>
        </div>
      </div>

      {/* Espaçador para alinhar mensagens próprias */}
      {isOwn && showAvatar && <div className="w-8" />}
    </div>
  );
};

export default MessageBubble;
