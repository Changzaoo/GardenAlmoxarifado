/**
 * Serviço de Autenticação
 * 
 * Centraliza toda a lógica de autenticação do sistema:
 * - Login com verificação de senha (authKey → senhaHash → senha)
 * - Validações de usuário (ativo, empresaId, setorId)
 * - Gestão de sessão
 * - Recuperação de senha
 * 
 * DATABASE: garden-backup (backupDb)
 * COLLECTION: usuarios
 * SEARCH FIELD: usuario
 * AUTH FIELDS: authKey (1º), senhaHash+senhaSalt (2º), senha (3º)
 */

import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { backupDb } from '../config/firebaseDual';
import { verifyPassword } from '../utils/crypto';

/**
 * Autentica usuário no sistema
 * 
 * @param {string} usuario - Nome de usuário (campo de busca)
 * @param {string} senha - Senha fornecida pelo usuário
 * @returns {Object} { success: boolean, user?: Object, error?: string }
 */
export const authenticateUser = async (usuario, senha) => {
  try {
    // 1. BUSCA: Query por usuario na coleção usuarios
    const usuariosRef = collection(backupDb, 'usuarios');
    const q = query(usuariosRef, where('usuario', '==', usuario));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return {
        success: false,
        error: 'Usuário não encontrado'
      };
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();
    const userId = userDoc.id;

    // 2. VALIDAÇÃO: Usuário deve estar ativo
    if (!userData.ativo) {
      return {
        success: false,
        error: 'Usuário inativo. Entre em contato com o administrador.'
      };
    }

    // 3. AUTENTICAÇÃO: Verifica senha em ordem de prioridade
    const senhaValida = await verificarSenha(senha, userData);

    if (!senhaValida) {
      return {
        success: false,
        error: 'Senha incorreta'
      };
    }

    // 4. VALIDAÇÃO: Empresa e setor (obrigatórios para não-admin)
    const nivel = userData.nivel ?? 1;
    
    if (nivel !== 0) { // Não é admin
      if (!userData.empresaId || !userData.setorId) {
        return {
          success: false,
          error: 'Usuário sem empresa/setor definido. Entre em contato com o administrador.'
        };
      }
    }

    // 5. ATUALIZAÇÃO: Registra último login
    try {
      const userDocRef = doc(backupDb, 'usuarios', userId);
      await updateDoc(userDocRef, {
        ultimoLogin: serverTimestamp()
      });
    } catch (error) {
      console.warn('Não foi possível atualizar ultimoLogin:', error);
      // Não bloqueia o login se falhar
    }

    // 6. SUCESSO: Retorna dados do usuário
    return {
      success: true,
      user: {
        id: userId,
        ...userData,
        nivel
      }
    };

  } catch (error) {
    console.error('Erro na autenticação:', error);
    return {
      success: false,
      error: 'Erro ao processar login. Tente novamente.'
    };
  }
};

/**
 * Verifica senha do usuário seguindo ordem de prioridade
 * 
 * PRIORIDADE:
 * 1. authKey - Senha em texto plano (mais recente)
 * 2. senhaHash + senhaSalt - Hash SHA-512
 * 3. senha - Texto plano (legado)
 * 
 * @param {string} senhaFornecida - Senha digitada pelo usuário
 * @param {Object} userData - Dados do usuário do Firebase
 * @returns {boolean} true se senha válida
 */
const verificarSenha = async (senhaFornecida, userData) => {
  // PRIORIDADE 1: authKey (senha atual do sistema)
  if (userData.authKey) {
    return senhaFornecida === userData.authKey;
  }

  // PRIORIDADE 2: senhaHash + senhaSalt (SHA-512)
  if (userData.senhaHash && userData.senhaSalt) {
    try {
      const hashValido = await verifyPassword(
        senhaFornecida,
        userData.senhaHash,
        userData.senhaSalt
      );
      return hashValido;
    } catch (error) {
      console.error('Erro ao verificar senhaHash:', error);
      // Continua para próximo método
    }
  }

  // PRIORIDADE 3: senha (texto plano legado)
  if (userData.senha) {
    return senhaFornecida === userData.senha;
  }

  // Nenhum campo de senha encontrado
  console.warn('Usuário sem campo de senha válido:', userData.usuario);
  return false;
};

/**
 * Salva dados do usuário na sessão
 * 
 * @param {Object} user - Dados do usuário
 * @param {boolean} lembrar - Se deve salvar em cookies
 */
export const saveUserSession = (user, lembrar = false) => {
  // Salva no localStorage
  localStorage.setItem('usuario', JSON.stringify(user));
  localStorage.setItem('nivel', user.nivel?.toString() || '1');

  // Salva em cookies se solicitado
  if (lembrar) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30); // 30 dias
    
    document.cookie = `usuario=${user.usuario}; expires=${expiryDate.toUTCString()}; path=/`;
    document.cookie = `lembrar=true; expires=${expiryDate.toUTCString()}; path=/`;
  }
};

/**
 * Remove sessão do usuário
 */
export const clearUserSession = () => {
  // Remove do localStorage
  localStorage.removeItem('usuario');
  localStorage.removeItem('nivel');

  // Remove cookies
  document.cookie = 'usuario=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  document.cookie = 'lembrar=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
};

/**
 * Recupera sessão salva
 * 
 * @returns {Object|null} Dados do usuário ou null
 */
export const getStoredSession = () => {
  try {
    const usuarioStr = localStorage.getItem('usuario');
    if (usuarioStr) {
      return JSON.parse(usuarioStr);
    }
  } catch (error) {
    console.error('Erro ao recuperar sessão:', error);
  }
  return null;
};

/**
 * Recupera usuario salvo nos cookies
 * 
 * @returns {string|null} Usuario ou null
 */
export const getStoredUsuario = () => {
  const cookies = document.cookie.split(';');
  const usuarioCookie = cookies.find(c => c.trim().startsWith('usuario='));
  
  if (usuarioCookie) {
    return usuarioCookie.split('=')[1];
  }
  
  return null;
};

/**
 * Verifica se "lembrar" está ativo
 * 
 * @returns {boolean}
 */
export const isRememberMeActive = () => {
  const cookies = document.cookie.split(';');
  return cookies.some(c => c.trim().startsWith('lembrar=true'));
};

/**
 * Valida formato de usuario (pode ser alfanumérico)
 * 
 * @param {string} usuario
 * @returns {boolean}
 */
export const isValidUsuario = (usuario) => {
  return usuario && usuario.length >= 3;
};

/**
 * Valida força da senha
 * 
 * @param {string} senha
 * @returns {Object} { valid: boolean, message?: string, strength: number }
 */
export const validatePasswordStrength = (senha) => {
  if (!senha || senha.length < 6) {
    return {
      valid: false,
      message: 'Senha deve ter no mínimo 6 caracteres',
      strength: 0
    };
  }

  let strength = 0;

  // Critérios de força
  if (senha.length >= 8) strength++;
  if (/[a-z]/.test(senha)) strength++; // Minúsculas
  if (/[A-Z]/.test(senha)) strength++; // Maiúsculas
  if (/[0-9]/.test(senha)) strength++; // Números
  if (/[^a-zA-Z0-9]/.test(senha)) strength++; // Caracteres especiais

  return {
    valid: true,
    strength, // 0-5
    message: strength >= 3 ? 'Senha forte' : strength >= 2 ? 'Senha média' : 'Senha fraca'
  };
};

export default {
  authenticateUser,
  saveUserSession,
  clearUserSession,
  getStoredSession,
  getStoredUsuario,
  isRememberMeActive,
  isValidUsuario,
  validatePasswordStrength
};
