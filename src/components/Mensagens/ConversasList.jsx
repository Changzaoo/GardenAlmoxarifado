import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Users, User, Check, CheckCheck } from 'lucide-react';

const ConversasList = ({ conversas, conversaSelecionada, onSelectConversa, usuarioId }) => {
  
  const formatarTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
    } catch (error) {
      return '';
    }
  };

  const getStatusIcon = (mensagem, usuarioId) => {
    if (!mensagem || mensagem.remetenteId !== usuarioId) return null;

    const status = mensagem.status || {};
    
    if (status.lida && Object.values(status.lida).some(v => v === true)) {
      return <CheckCheck className="w-4 h-4 text-blue-500" />;
    } else if (status.entregue) {
      return <CheckCheck className="w-4 h-4 text-gray-400" />;
    } else {
      return <Check className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      {conversas.map((conversa) => {
        const isSelected = conversaSelecionada?.id === conversa.id;
        const hasUnread = conversa.naoLidas > 0;
        
        // Nome da conversa
        let nomeConversa = '';
        if (conversa.tipo === 'grupo') {
          nomeConversa = conversa.nome;
        } else if (conversa.participantesInfo && conversa.participantesInfo.length > 0) {
          nomeConversa = conversa.participantesInfo[0].nome;
        }

        // Preview da última mensagem
        const ultimaMensagem = conversa.ultimaMensagem;
        let previewMensagem = '';
        if (ultimaMensagem) {
          if (ultimaMensagem.tipo === 'texto') {
            previewMensagem = ultimaMensagem.conteudo;
          } else if (ultimaMensagem.tipo === 'imagem') {
            previewMensagem = '📷 Foto';
          }
        }

        return (
          <button
            key={conversa.id}
            onClick={() => onSelectConversa(conversa)}
            className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
              isSelected ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500' : ''
            }`}
          >
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                conversa.tipo === 'grupo' 
                  ? 'bg-purple-500' 
                  : 'bg-gradient-to-br from-blue-500 to-blue-600'
              } text-white font-semibold text-lg`}>
                {conversa.tipo === 'grupo' ? (
                  <Users className="w-6 h-6" />
                ) : conversa.participantesInfo && conversa.participantesInfo[0]?.avatar ? (
                  <img 
                    src={conversa.participantesInfo[0].avatar} 
                    alt={nomeConversa}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  nomeConversa.charAt(0).toUpperCase()
                )}
              </div>
              
              {/* Indicador de mensagens não lidas */}
              {hasUnread && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {conversa.naoLidas > 9 ? '9+' : conversa.naoLidas}
                </div>
              )}
            </div>

            {/* Informações da conversa */}
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center justify-between mb-1">
                <h3 className={`font-semibold text-gray-900 dark:text-white truncate ${
                  hasUnread ? 'font-bold' : ''
                }`}>
                  {nomeConversa || 'Conversa'}
                </h3>
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 flex-shrink-0">
                  {formatarTimestamp(conversa.ultimaAtualizacao)}
                </span>
              </div>
              
              <div className="flex items-center gap-1">
                {getStatusIcon(ultimaMensagem, usuarioId)}
                <p className={`text-sm truncate ${
                  hasUnread 
                    ? 'text-gray-900 dark:text-white font-semibold' 
                    : 'text-gray-600 dark:text-gray-400'
                }`}>
                  {ultimaMensagem?.remetenteId === usuarioId && 'Você: '}
                  {previewMensagem || 'Inicie uma conversa'}
                </p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default ConversasList;
