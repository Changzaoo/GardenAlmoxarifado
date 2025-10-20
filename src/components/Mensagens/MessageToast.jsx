import React from 'react';
import { X, FileText } from 'lucide-react';

/**
 * Componente de Toast Customizado para Mensagens
 * Exibe botões "Abrir" e "Fechar" quando uma nova mensagem é recebida
 */
export const MessageToast = ({ 
  remetente, 
  mensagem, 
  conversaId, 
  onAbrir, 
  onFechar 
}) => {
  return (
    <div className="flex flex-col gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg min-w-[300px] max-w-[400px]">
      {/* Cabeçalho */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-lg">
            {remetente?.charAt(0).toUpperCase() || '?'}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
            Nova Mensagem
          </h4>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
            {remetente}
          </p>
        </div>
      </div>

      {/* Conteúdo da Mensagem */}
      <div className="pl-13">
        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
          {mensagem}
        </p>
      </div>

      {/* Botões de Ação */}
      <div className="flex gap-2 justify-end">
        <button
          onClick={onFechar}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
          Fechar
        </button>
        <button
          onClick={onAbrir}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm"
        >
          <FileText className="w-4 h-4" />
          Abrir
        </button>
      </div>
    </div>
  );
};

export default MessageToast;
