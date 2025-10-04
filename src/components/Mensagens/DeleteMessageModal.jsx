import React from 'react';
import { Trash2, X, Clock } from 'lucide-react';

/**
 * Modal de Deleção de Mensagem (Mobile)
 * Aparece ao fazer long press na mensagem
 */
const DeleteMessageModal = ({ 
  isOpen, 
  onClose, 
  onDeleteForMe, 
  onDeleteForEveryone,
  canDeleteForEveryone = false,
  isOwnMessage = false,
  messagePreview = ''
}) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 animate-fadeIn"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed bottom-0 left-0 right-0 z-50 animate-slideUp">
        <div className="bg-white dark:bg-gray-800 rounded-t-3xl shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                Apagar mensagem
              </h3>
              {messagePreview && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                  "{messagePreview}"
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              aria-label="Fechar"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Opções */}
          <div className="p-2">
            {/* Apagar para mim */}
            <button
              onClick={() => {
                onDeleteForMe();
                onClose();
              }}
              className="w-full flex items-center gap-3 p-4 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors text-left"
            >
              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  Apagar para mim
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Você não verá mais esta mensagem
                </p>
              </div>
            </button>

            {/* Apagar para todos */}
            {isOwnMessage && (
              <>
                {canDeleteForEveryone ? (
                  <button
                    onClick={() => {
                      onDeleteForEveryone();
                      onClose();
                    }}
                    className="w-full flex items-center gap-3 p-4 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors text-left"
                  >
                    <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                      <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-red-600 dark:text-red-400">
                        Apagar para todos
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Todos os participantes não verão esta mensagem
                      </p>
                    </div>
                  </button>
                ) : (
                  <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-600 dark:text-gray-400 text-sm">
                        Tempo limite excedido
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Mensagens só podem ser apagadas para todos em até 30 minutos após o envio
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Botão Cancelar */}
          <div className="p-4 pt-2">
            <button
              onClick={onClose}
              className="w-full py-3 text-center font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        
        .animate-slideUp {
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </>
  );
};

export default DeleteMessageModal;
