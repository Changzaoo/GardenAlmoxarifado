import React, { useState, useEffect } from 'react';
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
  Mic,
  UserX
} from 'lucide-react';
import { MESSAGE_STATUS, MESSAGE_TYPE } from '../../constants/mensagensConstants';
import DeleteMessageModal from './DeleteMessageModal';
import ContextMenu, { useLongPress } from '../common/ContextMenu';

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
  const [longPressTimer, setLongPressTimer] = useState(null);
  const [isLongPressing, setIsLongPressing] = useState(false);
  const [showMobileDeleteModal, setShowMobileDeleteModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);

  // Detectar se é mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Verifica se mensagem pode ser apagada para todos (menos de 30 minutos)
  const canDeleteForEveryone = () => {
    if (!isPropriaMsg || !mensagem.timestamp) return false;
    
    const now = Date.now();
    const messageTime = mensagem.timestamp.toDate ? 
      mensagem.timestamp.toDate().getTime() : 
      new Date(mensagem.timestamp).getTime();
    
    const thirtyMinutes = 30 * 60 * 1000; // 30 minutos em ms
    return (now - messageTime) < thirtyMinutes;
  };

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
          <div className="space-y-1.5 sm:space-y-2">
            <div className="relative rounded-lg overflow-hidden max-w-[250px] sm:max-w-xs md:max-w-sm">
              {!imageLoaded && (
                <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
              )}
              <img
                src={mensagem.anexoUrl}
                alt={mensagem.texto}
                className="w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity active:opacity-75"
                onClick={() => window.open(mensagem.anexoUrl, '_blank')}
                onLoad={() => setImageLoaded(true)}
                loading="lazy"
              />
            </div>
            {mensagem.texto && (
              <p className="text-xs sm:text-sm">{mensagem.texto}</p>
            )}
          </div>
        );

      case MESSAGE_TYPE.ARQUIVO:
        return (
          <div 
            className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-gray-100 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 active:bg-gray-300 dark:active:bg-gray-500 transition-colors"
            onClick={() => onDownload?.(mensagem.anexoUrl, mensagem.texto)}
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <File className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium truncate">{mensagem.texto}</p>
              <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Clique para baixar</p>
            </div>
            <Download className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
          </div>
        );

      case MESSAGE_TYPE.VIDEO:
        return (
          <div className="space-y-1.5 sm:space-y-2">
            <div className="relative rounded-lg overflow-hidden max-w-[250px] sm:max-w-xs md:max-w-sm">
              <video
                src={mensagem.anexoUrl}
                controls
                className="w-full h-auto rounded-lg"
                preload="metadata"
              />
            </div>
            {mensagem.texto && (
              <p className="text-xs sm:text-sm">{mensagem.texto}</p>
            )}
          </div>
        );

      case MESSAGE_TYPE.AUDIO:
        return (
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0">
              <Mic className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600 dark:text-green-400" />
            </div>
            <audio 
              src={mensagem.anexoUrl} 
              controls 
              className="flex-1 h-8 sm:h-10"
              preload="metadata"
            />
          </div>
        );

      case MESSAGE_TYPE.SISTEMA:
        return (
          <div className="text-center text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 py-1.5 sm:py-2 px-2">
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

  // Handlers para long press (mobile) - usando hook
  const longPressHandlers = useLongPress((event) => {
    if (mensagem.deletada) return;
    
    event.preventDefault();
    event.stopPropagation();
    
    const rect = event.currentTarget.getBoundingClientRect();
    setContextMenu({
      position: {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      }
    });

    // Vibração háptica se disponível
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  }, 500);

  // Extrair prévia do texto para o modal
  const getMessagePreview = () => {
    if (mensagem.tipo === MESSAGE_TYPE.TEXTO) {
      return mensagem.texto?.substring(0, 50) + (mensagem.texto?.length > 50 ? '...' : '');
    }
    if (mensagem.tipo === MESSAGE_TYPE.IMAGEM) return '📷 Imagem';
    if (mensagem.tipo === MESSAGE_TYPE.VIDEO) return '🎥 Vídeo';
    if (mensagem.tipo === MESSAGE_TYPE.AUDIO) return '🎵 Áudio';
    if (mensagem.tipo === MESSAGE_TYPE.ARQUIVO) return '📎 Arquivo';
    return '';
  };

  // Mensagem de sistema (centralizada) - Responsivo
  if (mensagem.tipo === MESSAGE_TYPE.SISTEMA) {
    return (
      <div className="flex justify-center py-1.5 sm:py-2 px-2">
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 max-w-[90%] sm:max-w-md">
          {renderConteudo()}
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`flex gap-1.5 sm:gap-2 ${isPropriaMsg ? 'flex-row-reverse' : 'flex-row'} ${groupWithPrevious ? 'mt-0.5 sm:mt-1' : 'mt-2 sm:mt-3 md:mt-4'} ${isLongPressing ? 'scale-95 transition-transform' : ''}`}
      onMouseEnter={() => setShowOptions(true)}
      onMouseLeave={() => setShowOptions(false)}
    >
      {/* Avatar - Responsivo */}
      {showAvatar && !groupWithPrevious && (
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs sm:text-sm font-bold flex-shrink-0 overflow-hidden">
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
      {!showAvatar && !groupWithPrevious && <div className="w-7 sm:w-8" />}

      {/* Bolha da mensagem - Responsivo */}
      <div className={`relative max-w-[85%] sm:max-w-[75%] md:max-w-[70%] lg:max-w-[65%] ${isPropriaMsg ? 'items-end' : 'items-start'}`}>
        {/* Opções (aparecem no hover/touch) - Responsivo */}
        {showOptions && !mensagem.deletada && (
          <div 
            className={`absolute top-0 ${isPropriaMsg ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'} flex gap-0.5 sm:gap-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-0.5 sm:p-1 z-10`}
          >
            {isPropriaMsg && onEdit && mensagem.tipo === MESSAGE_TYPE.TEXTO && (
              <button
                onClick={() => onEdit(mensagem)}
                className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors active:scale-95"
                title="Editar"
                aria-label="Editar mensagem"
              >
                <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600 dark:text-gray-400" />
              </button>
            )}
            {(onDeleteForMe || onDeleteForEveryone || onDelete) && (
              <div className="relative">
                <button
                  onClick={() => setShowDeleteMenu(!showDeleteMenu)}
                  className="p-1.5 sm:p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors active:scale-95"
                  title="Apagar"
                  aria-label="Apagar mensagem"
                >
                  <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-600 dark:text-red-400" />
                </button>
                
                {/* Menu dropdown de deleção - Responsivo */}
                {showDeleteMenu && (
                  <div 
                    className="absolute top-full mt-1 right-0 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 min-w-[160px] sm:min-w-[180px] z-20"
                    onMouseLeave={() => setShowDeleteMenu(false)}
                    onTouchEnd={(e) => e.stopPropagation()}
                  >
                    {onDeleteForMe && (
                      <button
                        onClick={() => {
                          onDeleteForMe(mensagem);
                          setShowDeleteMenu(false);
                        }}
                        className="w-full px-3 sm:px-4 py-2 text-left text-xs sm:text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 text-gray-700 dark:text-gray-300 active:scale-95"
                      >
                        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span>Apagar para mim</span>
                      </button>
                    )}
                    {isPropriaMsg && onDeleteForEveryone && canDeleteForEveryone() && (
                      <button
                        onClick={() => {
                          onDeleteForEveryone(mensagem);
                          setShowDeleteMenu(false);
                        }}
                        className="w-full px-3 sm:px-4 py-2 text-left text-xs sm:text-sm hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors flex items-center gap-2 text-red-600 dark:text-red-400 active:scale-95"
                      >
                        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span>Apagar para todos</span>
                      </button>
                    )}
                    {isPropriaMsg && onDeleteForEveryone && !canDeleteForEveryone() && (
                      <div className="px-3 sm:px-4 py-2 text-xs text-gray-500 dark:text-gray-400 italic border-t border-gray-200 dark:border-gray-700">
                        Mensagens só podem ser apagadas para todos em até 30 minutos
                      </div>
                    )}
                    {!onDeleteForMe && !onDeleteForEveryone && onDelete && (
                      <button
                        onClick={() => {
                          onDelete(mensagem);
                          setShowDeleteMenu(false);
                        }}
                        className="w-full px-3 sm:px-4 py-2 text-left text-xs sm:text-sm hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors flex items-center gap-2 text-red-600 dark:text-red-400 active:scale-95"
                      >
                        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span>Deletar</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Conteúdo - Responsivo */}
        <div
          {...longPressHandlers}
          className={`rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2 shadow-sm text-sm sm:text-base ${
            isPropriaMsg
              ? 'bg-blue-500 text-white rounded-br-none'
              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 rounded-bl-none'
          } ${groupWithPrevious ? 'rounded-tl-xl sm:rounded-tl-2xl rounded-tr-xl sm:rounded-tr-2xl' : ''}`}
        >
          {/* Nome do remetente - SEMPRE mostrar se disponível */}
          {mensagem.remetente?.nome && !groupWithPrevious && (
            <p className={`text-xs font-semibold mb-1 truncate ${
              isPropriaMsg 
                ? 'text-blue-100' 
                : 'text-blue-600 dark:text-blue-400'
            }`}>
              {mensagem.remetente.nome}
            </p>
          )}

          {/* Conteúdo principal */}
          {renderConteudo()}

          {/* Footer: timestamp + status - Responsivo */}
          <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] sm:text-xs ${
            isPropriaMsg ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'
          }`}>
            {mensagem.editada && (
              <span className="italic">editada</span>
            )}
            <span className="whitespace-nowrap">{formatTime()}</span>
            {renderStatusIcon()}
          </div>
        </div>
      </div>

      {/* Modal de Deleção (Mobile) */}
      <DeleteMessageModal
        isOpen={showMobileDeleteModal}
        onClose={() => setShowMobileDeleteModal(false)}
        onDeleteForMe={() => onDeleteForMe?.(mensagem)}
        onDeleteForEveryone={() => onDeleteForEveryone?.(mensagem)}
        canDeleteForEveryone={canDeleteForEveryone()}
        isOwnMessage={isPropriaMsg}
        messagePreview={getMessagePreview()}
      />

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          title="Opções da Mensagem"
          position={contextMenu.position}
          onClose={() => setContextMenu(null)}
          options={[
            ...(isPropriaMsg && mensagem.tipo === MESSAGE_TYPE.TEXTO ? [{
              icon: Edit2,
              label: 'Editar mensagem',
              onClick: () => onEdit?.(mensagem)
            }] : []),
            {
              icon: Trash2,
              label: 'Apagar para mim',
              description: 'A mensagem será removida apenas para você',
              onClick: () => onDeleteForMe?.(mensagem)
            },
            ...(isPropriaMsg && canDeleteForEveryone() ? [{
              icon: UserX,
              label: 'Apagar para todos',
              description: 'Remove a mensagem para todos (até 30min)',
              danger: true,
              badge: '30min',
              onClick: () => onDeleteForEveryone?.(mensagem)
            }] : []),
            ...(isPropriaMsg && !canDeleteForEveryone() ? [{
              icon: Clock,
              label: 'Prazo esgotado',
              description: 'Só é possível apagar para todos em até 30 minutos',
              disabled: true,
              onClick: () => {}
            }] : [])
          ]}
        />
      )}
    </div>
  );
};

export default BolhaMensagem;
