/**
 * Constantes do Sistema de Mensagens
 * Sistema completo de chat em tempo real similar ao WhatsApp
 */

// Status das mensagens
export const MESSAGE_STATUS = {
  ENVIANDO: 'enviando',
  ENVIADA: 'enviada',
  ENTREGUE: 'entregue',
  LIDA: 'lida',
  ERRO: 'erro'
};

// Tipos de mensagem
export const MESSAGE_TYPE = {
  TEXTO: 'texto',
  IMAGEM: 'imagem',
  ARQUIVO: 'arquivo',
  AUDIO: 'audio',
  VIDEO: 'video',
  LOCALIZACAO: 'localizacao',
  SISTEMA: 'sistema' // Mensagens automáticas do sistema
};

// Status do usuário
export const USER_STATUS = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  AUSENTE: 'ausente',
  NAO_PERTURBE: 'nao_perturbe'
};

// Tipos de conversa
export const CONVERSATION_TYPE = {
  PRIVADA: 'privada',
  GRUPO: 'grupo'
};

// Eventos de digitação
export const TYPING_EVENTS = {
  START: 'typing_start',
  STOP: 'typing_stop'
};

// Configurações de conversa
export const CONVERSATION_SETTINGS = {
  NOTIFICACOES: 'notificacoes',
  BLOQUEADO: 'bloqueado',
  ARQUIVADO: 'arquivado',
  FIXADO: 'fixado',
  SILENCIADO: 'silenciado'
};

// Limites
export const LIMITS = {
  MAX_MESSAGE_LENGTH: 5000,
  MAX_FILE_SIZE: 16 * 1024 * 1024, // 16MB
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_VIDEO_SIZE: 16 * 1024 * 1024, // 16MB
  MAX_AUDIO_DURATION: 300, // 5 minutos em segundos
  MESSAGES_PER_PAGE: 50,
  TYPING_TIMEOUT: 3000 // 3 segundos
};

// Códigos de erro
export const ERROR_CODES = {
  BLOCKED_USER: 'blocked_user',
  CONVERSATION_NOT_FOUND: 'conversation_not_found',
  PERMISSION_DENIED: 'permission_denied',
  FILE_TOO_LARGE: 'file_too_large',
  INVALID_FILE_TYPE: 'invalid_file_type',
  NETWORK_ERROR: 'network_error',
  UNKNOWN_ERROR: 'unknown_error'
};

// Mensagens de erro traduzidas
export const ERROR_MESSAGES = {
  [ERROR_CODES.BLOCKED_USER]: 'Você não pode enviar mensagens para este usuário',
  [ERROR_CODES.CONVERSATION_NOT_FOUND]: 'Conversa não encontrada',
  [ERROR_CODES.PERMISSION_DENIED]: 'Você não tem permissão para realizar esta ação',
  [ERROR_CODES.FILE_TOO_LARGE]: 'Arquivo muito grande',
  [ERROR_CODES.INVALID_FILE_TYPE]: 'Tipo de arquivo não suportado',
  [ERROR_CODES.NETWORK_ERROR]: 'Erro de conexão. Tente novamente',
  [ERROR_CODES.UNKNOWN_ERROR]: 'Ocorreu um erro. Tente novamente'
};

// Tipos de arquivo aceitos
export const ACCEPTED_FILE_TYPES = {
  imagem: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  arquivo: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv'
  ],
  audio: ['audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/webm'],
  video: ['video/mp4', 'video/webm', 'video/ogg']
};

// Ícones de status
export const STATUS_ICONS = {
  [USER_STATUS.ONLINE]: '🟢',
  [USER_STATUS.OFFLINE]: '⚫',
  [USER_STATUS.AUSENTE]: '🟡',
  [USER_STATUS.NAO_PERTURBE]: '🔴'
};

// Cores de status
export const STATUS_COLORS = {
  [USER_STATUS.ONLINE]: '#00BA7C',
  [USER_STATUS.OFFLINE]: '#8899A6',
  [USER_STATUS.AUSENTE]: '#FFD700',
  [USER_STATUS.NAO_PERTURBE]: '#F4212E'
};

// Sons de notificação
export const NOTIFICATION_SOUNDS = {
  NEW_MESSAGE: '/sounds/notification.mp3',
  SENT: '/sounds/sent.mp3',
  ERROR: '/sounds/error.mp3'
};

// Textos do sistema
export const SYSTEM_MESSAGES = {
  CONVERSATION_CREATED: '🔒 Conversa iniciada com criptografia de ponta a ponta',
  USER_BLOCKED: '🚫 Você bloqueou este contato',
  USER_UNBLOCKED: '✅ Você desbloqueou este contato',
  USER_JOINED_GROUP: '{user} entrou no grupo',
  USER_LEFT_GROUP: '{user} saiu do grupo',
  GROUP_CREATED: '🎉 Grupo criado',
  GROUP_NAME_CHANGED: 'Nome do grupo alterado para "{name}"'
};

// Permissões
export const PERMISSIONS = {
  SEND_MESSAGE: 'send_message',
  DELETE_MESSAGE: 'delete_message',
  EDIT_MESSAGE: 'edit_message',
  FORWARD_MESSAGE: 'forward_message',
  ADD_PARTICIPANT: 'add_participant',
  REMOVE_PARTICIPANT: 'remove_participant',
  CHANGE_GROUP_INFO: 'change_group_info',
  MAKE_ADMIN: 'make_admin'
};

// Cache e sincronização
export const SYNC_CONFIG = {
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 segundo
  OFFLINE_QUEUE_MAX: 100,
  CACHE_DURATION: 24 * 60 * 60 * 1000 // 24 horas
};

// Configurações de UI
export const UI_CONFIG = {
  SCROLL_THRESHOLD: 100, // pixels do topo para carregar mais
  DEBOUNCE_TYPING: 300, // ms para indicador de digitação
  AUTO_SCROLL_DELAY: 100, // ms para scroll automático
  MESSAGE_GROUP_TIMEOUT: 60000, // 1 minuto - agrupa mensagens do mesmo remetente
  TOAST_DURATION: 3000
};

// Validação
export const VALIDATION_RULES = {
  MIN_MESSAGE_LENGTH: 1,
  MAX_GROUP_NAME_LENGTH: 50,
  MAX_GROUP_DESCRIPTION_LENGTH: 500,
  MAX_PARTICIPANTS: 256
};

export default {
  MESSAGE_STATUS,
  MESSAGE_TYPE,
  USER_STATUS,
  CONVERSATION_TYPE,
  TYPING_EVENTS,
  CONVERSATION_SETTINGS,
  LIMITS,
  ERROR_CODES,
  ERROR_MESSAGES,
  ACCEPTED_FILE_TYPES,
  STATUS_ICONS,
  STATUS_COLORS,
  NOTIFICATION_SOUNDS,
  SYSTEM_MESSAGES,
  PERMISSIONS,
  SYNC_CONFIG,
  UI_CONFIG,
  VALIDATION_RULES
};
