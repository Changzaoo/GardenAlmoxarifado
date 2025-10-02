import React from 'react';
import { X, Shield, Archive, Bell, BellOff, Trash2, UserX, UserCheck } from 'lucide-react';
import { USER_STATUS, STATUS_COLORS } from '../../constants/mensagensConstants';

const PerfilUsuario = ({ 
  usuario, 
  conversa,
  onClose, 
  onBloquear,
  onDesbloquear,
  onArquivar,
  onSilenciar,
  onDeletar,
  bloqueado = false
}) => {
  if (!usuario) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative p-6 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center">
            {/* Avatar grande */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
              {usuario.nome?.charAt(0).toUpperCase() || '?'}
            </div>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
              {usuario.nome || 'Usuário'}
            </h2>

            {/* Status */}
            <div className="flex items-center justify-center gap-2 text-sm">
              <div 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: STATUS_COLORS[usuario.status || USER_STATUS.OFFLINE] }}
              />
              <span className="text-gray-500 dark:text-gray-400">
                {usuario.status === USER_STATUS.ONLINE ? 'Online' : `Visto por último às ${new Date().toLocaleTimeString()}`}
              </span>
            </div>
          </div>
        </div>

        {/* Informações */}
        <div className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Email
            </label>
            <p className="text-gray-900 dark:text-gray-100">
              {usuario.email || 'Não informado'}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Setor
            </label>
            <p className="text-gray-900 dark:text-gray-100">
              {usuario.setor || 'Não informado'}
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Cargo
            </label>
            <p className="text-gray-900 dark:text-gray-100">
              {usuario.cargo || 'Não informado'}
            </p>
          </div>
        </div>

        {/* Ações */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 space-y-2">
          <button
            onClick={() => onSilenciar?.(!conversa.silenciado)}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-left"
          >
            {conversa?.silenciado ? (
              <>
                <Bell className="w-5 h-5 text-blue-500" />
                <span className="text-gray-900 dark:text-gray-100">Ativar notificações</span>
              </>
            ) : (
              <>
                <BellOff className="w-5 h-5 text-gray-500" />
                <span className="text-gray-900 dark:text-gray-100">Silenciar notificações</span>
              </>
            )}
          </button>

          <button
            onClick={() => onArquivar?.(!conversa.arquivado)}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-left"
          >
            <Archive className="w-5 h-5 text-gray-500" />
            <span className="text-gray-900 dark:text-gray-100">
              {conversa?.arquivado ? 'Desarquivar conversa' : 'Arquivar conversa'}
            </span>
          </button>

          {bloqueado ? (
            <button
              onClick={() => onDesbloquear?.()}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors text-left"
            >
              <UserCheck className="w-5 h-5 text-green-600" />
              <span className="text-green-600">Desbloquear usuário</span>
            </button>
          ) : (
            <button
              onClick={() => onBloquear?.()}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-left"
            >
              <UserX className="w-5 h-5 text-red-600" />
              <span className="text-red-600">Bloquear usuário</span>
            </button>
          )}

          <button
            onClick={() => {
              if (confirm('Tem certeza que deseja deletar esta conversa? Esta ação não pode ser desfeita.')) {
                onDeletar?.();
              }
            }}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-left"
          >
            <Trash2 className="w-5 h-5 text-red-600" />
            <span className="text-red-600">Deletar conversa</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PerfilUsuario;
