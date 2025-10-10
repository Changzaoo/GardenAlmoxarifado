/**
 * Serviço de Gerenciamento de Senhas
 * 
 * Padroniza todas as operações com senhas:
 * - Criação de senha (novo usuário)
 * - Atualização de senha (admin ou próprio usuário)
 * - Geração de salt
 * - Hash SHA-512
 * - Recuperação de senha
 * 
 * FORMATO NO FIREBASE:
 * {
 *   authKey: "senha_texto_plano",      // ← Usado no login (1º prioridade)
 *   senhaHash: "hash_sha512",          // ← Backup seguro (2º prioridade)
 *   senhaSalt: "salt_aleatorio",       // ← Salt para o hash
 *   senha: "senha_texto_plano"         // ← Legado (3º prioridade)
 * }
 */

import { doc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { backupDb } from '../config/firebaseDual';
import { encryptPassword } from '../utils/crypto';

/**
 * Gera salt aleatório para hash
 * 
 * @returns {string} Salt hexadecimal
 */
const generateSalt = () => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Cria objeto de senha completo
 * 
 * @param {string} senhaPlainText - Senha em texto plano
 * @returns {Promise<Object>} { authKey, senhaHash, senhaSalt, senha }
 */
export const createPasswordObject = async (senhaPlainText) => {
  if (!senhaPlainText) {
    throw new Error('Senha não pode ser vazia');
  }

  // Gera salt
  const salt = generateSalt();

  // Gera hash SHA-512
  const hash = await encryptPassword(senhaPlainText, salt);

  return {
    authKey: senhaPlainText,        // ← Usado no login (texto plano)
    senhaHash: hash,                // ← Backup seguro (SHA-512)
    senhaSalt: salt,                // ← Salt para o hash
    senha: senhaPlainText           // ← Legado (compatibilidade)
  };
};

/**
 * Atualiza senha de um usuário no Firebase
 * 
 * @param {string} userId - ID do documento do usuário
 * @param {string} novaSenha - Nova senha em texto plano
 * @returns {Promise<Object>} Objeto de senha criado
 */
export const updateUserPassword = async (userId, novaSenha) => {
  if (!userId) {
    throw new Error('ID do usuário é obrigatório');
  }

  if (!novaSenha || novaSenha.length < 6) {
    throw new Error('Senha deve ter no mínimo 6 caracteres');
  }

  // Cria objeto de senha
  const passwordObj = await createPasswordObject(novaSenha);

  // Atualiza no Firebase
  const userRef = doc(backupDb, 'usuarios', userId);
  await updateDoc(userRef, {
    ...passwordObj,
    dataAlteracaoSenha: serverTimestamp()
  });
  return passwordObj;
};

/**
 * Cria novo usuário com senha no Firebase
 * 
 * @param {Object} userData - Dados do usuário
 * @param {string} senha - Senha inicial
 * @returns {Promise<string>} ID do documento criado
 */
export const createUserWithPassword = async (userData, senha) => {
  // Validar nome ou nomePublico
  if (!userData.nome && !userData.nomePublico) {
    throw new Error('Nome ou Nome Público é obrigatório');
  }

  if (!senha || senha.length < 6) {
    throw new Error('Senha deve ter no mínimo 6 caracteres');
  }

  // Cria objeto de senha
  const passwordObj = await createPasswordObject(senha);

  // Dados completos do usuário
  const novoUsuario = {
    ...userData,
    ...passwordObj,
    ativo: userData.ativo ?? true,
    nivel: userData.nivel ?? 1,
    dataCriacao: serverTimestamp(),
    dataAlteracaoSenha: serverTimestamp()
  };

  // Cria no Firebase
  const usuariosRef = collection(backupDb, 'usuarios');
  const docRef = await addDoc(usuariosRef, novoUsuario);
  return docRef.id;
};

/**
 * Gera código de recuperação de senha
 * 
 * @returns {string} Código de 6 dígitos
 */
export const generateRecoveryCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Salva código de recuperação no usuário
 * 
 * @param {string} userId - ID do usuário
 * @param {string} codigo - Código de recuperação
 * @returns {Promise<void>}
 */
export const saveRecoveryCode = async (userId, codigo) => {
  const userRef = doc(backupDb, 'usuarios', userId);
  
  const expiracao = new Date();
  expiracao.setMinutes(expiracao.getMinutes() + 30); // 30 minutos

  await updateDoc(userRef, {
    codigoRecuperacao: codigo,
    codigoRecuperacaoExpiracao: expiracao.toISOString(),
    codigoRecuperacaoUsado: false
  });
};

/**
 * Valida código de recuperação
 * 
 * @param {Object} userData - Dados do usuário
 * @param {string} codigo - Código fornecido
 * @returns {boolean}
 */
export const validateRecoveryCode = (userData, codigo) => {
  // Verifica se código existe
  if (!userData.codigoRecuperacao) {
    return false;
  }

  // Verifica se já foi usado
  if (userData.codigoRecuperacaoUsado) {
    return false;
  }

  // Verifica se expirou
  if (userData.codigoRecuperacaoExpiracao) {
    const expiracao = new Date(userData.codigoRecuperacaoExpiracao);
    if (expiracao < new Date()) {
      return false;
    }
  }

  // Verifica se código coincide
  return userData.codigoRecuperacao === codigo;
};

/**
 * Marca código de recuperação como usado
 * 
 * @param {string} userId - ID do usuário
 * @returns {Promise<void>}
 */
export const markRecoveryCodeAsUsed = async (userId) => {
  const userRef = doc(backupDb, 'usuarios', userId);
  await updateDoc(userRef, {
    codigoRecuperacaoUsado: true
  });
};

/**
 * Reseta senha usando código de recuperação
 * 
 * @param {string} userId - ID do usuário
 * @param {string} novaSenha - Nova senha
 * @returns {Promise<Object>} Objeto de senha criado
 */
export const resetPasswordWithCode = async (userId, novaSenha) => {
  // Atualiza senha
  const passwordObj = await updateUserPassword(userId, novaSenha);

  // Marca código como usado
  await markRecoveryCodeAsUsed(userId);
  return passwordObj;
};

/**
 * Gera senha padrão baseada no nível do usuário
 * 
 * @param {number} nivel - Nível do usuário (0-6)
 * @returns {string} Senha padrão
 */
export const getDefaultPassword = (nivel) => {
  return nivel === 0 ? 'admin2024' : 'workflow2024';
};

/**
 * Atualiza múltiplos campos de senha (para migração)
 * 
 * @param {string} userId - ID do usuário
 * @param {Object} passwordFields - Campos de senha
 * @returns {Promise<void>}
 */
export const updatePasswordFields = async (userId, passwordFields) => {
  const userRef = doc(backupDb, 'usuarios', userId);
  await updateDoc(userRef, {
    ...passwordFields,
    dataAlteracaoSenha: serverTimestamp()
  });
};

export default {
  createPasswordObject,
  updateUserPassword,
  createUserWithPassword,
  generateRecoveryCode,
  saveRecoveryCode,
  validateRecoveryCode,
  markRecoveryCodeAsUsed,
  resetPasswordWithCode,
  getDefaultPassword,
  updatePasswordFields
};
