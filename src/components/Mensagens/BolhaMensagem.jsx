import React, { useState } from 'react';
import { 
  Check, 
  CheckCheck, 
  Clock, 
  AlertCircle, 
  Edit2, 
  Trash2, 
  Download,
  File,
  Image as ImageIcon,
  Film,
  Mic
} from 'lucide-react';
import { MESSAGE_STATUS, MESSAGE_TYPE } from '../../constants/mensagensConstants';

/**
 * BolhaMensagem - Componente individual de mensagem
 * Exibe mensagem com status, timestamp, anexos e opções
 */
const BolhaMensagem = ({
  mensagem,
  isPropriaMsg,
  showAvatar = true,
  groupWithPrevious = false,
  onEdit,
  onDelete,
  onDeleteForMe,
  onDeleteForEveryone,
  onDownload
}) => {
  const [showOptions, setShowOptions] = useState(false);
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Renderizar ícone de status
  const renderStatusIcon = () => {
    if (!isPropriaMsg) return null;

    switch (mensagem.status) {
      case MESSAGE_STATUS.ENVIANDO:
        return <Clock className="w-4 h-4 text-gray-400 animate-spin" />;
      case MESSAGE_STATUS.ENVIADA:
        return <Check className="w-4 h-4 text-gray-400" />;
      case MESSAGE_STATUS.ENTREGUE:
        return <CheckCheck className="w-4 h-4 text-gray-400" />;
      case MESSAGE_STATUS.LIDA:
        return <CheckCheck className="w-4 h-4 text-blue-500" />;
      case MESSAGE_STATUS.ERRO:
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  // Renderizar conteúdo baseado no tipo
  const renderConteudo = () => {
    if (mensagem.deletada) {
      return (
        <div className="italic text-gray-500 dark:text-gray-400 flex items-center gap-2">
          <Trash2 className="w-4 h-4" />
          <span>Mensagem deletada</span>
        </div>
      );
    }

    switch (mensagem.tipo) {
      case MESSAGE_TYPE.IMAGEM:
        return (
          <div className="space-y-2">
            <div className="relative rounded-lg overflow-hidden max-w-xs">
              {!imageLoaded && (
                <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
              )}
              <img
                src={mensagem.anexoUrl}
                alt={mensagem.texto}
                className="w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => window.open(mensagem.anexoUrl, '_blank')}
                onLoad={() => setImageLoaded(true)}
              />
            </div>
            {mensagem.texto && (
              <p className="text-sm">{mensagem.texto}</p>
            )}
          </div>
        );

      case MESSAGE_TYPE.ARQUIVO:
        return (
          <div 
            className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            onClick={() => onDownload?.(mensagem.anexoUrl, mensagem.texto)}
          >
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <File className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{mensagem.texto}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Clique para baixar</p>
            </div>
            <Download className="w-5 h-5 text-gray-400" />
          </div>
        );

      case MESSAGE_TYPE.VIDEO:
        return (
          <div className="space-y-2">
            <div className="relative rounded-lg overflow-hidden max-w-xs">
              <video
                src={mensagem.anexoUrl}
                controls
                className="w-full h-auto rounded-lg"
              />
            </div>
            {mensagem.texto && (
              <p className="text-sm">{mensagem.texto}</p>
            )}
          </div>
        );

      case MESSAGE_TYPE.AUDIO:
        return (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <Mic className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <audio src={mensagem.anexoUrl} controls className="flex-1" />
          </div>
        );

      case MESSAGE_TYPE.SISTEMA:
        return (
          <div className="text-center text-xs text-gray-500 dark:text-gray-400 py-2">
            {mensagem.texto}
          </div>
        );

      default:
        return (
          <div className="whitespace-pre-wrap break-words">
            {mensagem.texto}
          </div>
        );
    }
  };

  // Formatação de timestamp
  const formatTime = () => {
    if (!mensagem.timestamp) return '';
    const date = mensagem.timestamp.toDate ? mensagem.timestamp.toDate() : new Date(mensagem.timestamp);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  // Mensagem de sistema (centralizada)
  if (mensagem.tipo === MESSAGE_TYPE.SISTEMA) {
    return (
      <div className="flex justify-center py-2">
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2 max-w-md">
          {renderConteudo()}
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`flex gap-2 ${isPropriaMsg ? 'flex-row-reverse' : 'flex-row'} ${groupWithPrevious ? 'mt-1' : 'mt-4'}`}
      onMouseEnter={() => setShowOptions(true)}
      onMouseLeave={() => setShowOptions(false)}
    >
      {/* Avatar */}
      {showAvatar && !groupWithPrevious && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 overflow-hidden">
          {mensagem.remetente?.photoURL ? (
            <img 
              src={mensagem.remetente.photoURL} 
              alt={mensagem.remetente?.nome || 'Usuário'} 
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.textContent = mensagem.remetente?.nome?.charAt(0).toUpperCase() || '?';
              }}
            />
          ) : (
            mensagem.remetente?.nome?.charAt(0).toUpperCase() || '?'
          )}
        </div>
      )}
      {!showAvatar && !groupWithPrevious && <div className="w-8" />}

      {/* Bolha da mensagem */}
      <div className={`relative max-w-[70%] ${isPropriaMsg ? 'items-end' : 'items-start'}`}>
        {/* Opções (aparecem no hover) */}
        {showOptions && !mensagem.deletada && (
          <div 
            className={`absolute top-0 ${isPropriaMsg ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'} flex gap-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-1 z-10`}
          >
            {isPropriaMsg && onEdit && mensagem.tipo === MESSAGE_TYPE.TEXTO && (
              <button
                onClick={() => onEdit(mensagem)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                title="Editar"
              >
                <Edit2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
            )}
            {(onDeleteForMe || onDeleteForEveryone || onDelete) && (
              <div className="relative">
                <button
                  onClick={() => setShowDeleteMenu(!showDeleteMenu)}
                  className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                  title="Apagar"
                >
                  <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                </button>
                
                {/* Menu dropdown de deleção */}
                {showDeleteMenu && (
                  <div 
                    className="absolute top-full mt-1 right-0 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 min-w-[180px] z-20"
                    onMouseLeave={() => setShowDeleteMenu(false)}
                  >
                    {onDeleteForMe && (
                      <button
                        onClick={() => {
                          onDeleteForMe(mensagem);
                          setShowDeleteMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 text-gray-700 dark:text-gray-300"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Apagar para mim</span>
                      </button>
                    )}
                    {isPropriaMsg && onDeleteForEveryone && (
                      <button
                        onClick={() => {
                          onDeleteForEveryone(mensagem);
                          setShowDeleteMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors flex items-center gap-2 text-red-600 dark:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Apagar para todos</span>
                      </button>
                    )}
                    {!onDeleteForMe && !onDeleteForEveryone && onDelete && (
                      <button
                        onClick={() => {
                          onDelete(mensagem);
                          setShowDeleteMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors flex items-center gap-2 text-red-600 dark:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Deletar</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Conteúdo */}
        <div
          className={`rounded-2xl px-4 py-2 shadow-sm ${
            isPropriaMsg
              ? 'bg-blue-500 text-white rounded-br-none'
              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-bl-none'
          } ${groupWithPrevious ? 'rounded-tl-2xl rounded-tr-2xl' : ''}`}
        >
          {/* Nome do remetente (apenas em grupos e não própria msg) */}
          {!isPropriaMsg && mensagem.remetente?.nome && !groupWithPrevious && (
            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
              {mensagem.remetente.nome}
            </p>
          )}

          {/* Conteúdo principal */}
          {renderConteudo()}

          {/* Footer: timestamp + status */}
          <div className={`flex items-center justify-end gap-1 mt-1 text-xs ${
            isPropriaMsg ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'
          }`}>
            {mensagem.editada && (
              <span className="italic">editada</span>
            )}
            <span>{formatTime()}</span>
            {renderStatusIcon()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BolhaMensagem;
