// 🔐 Serviço de Autenticação via QR Code
// Sistema de criação de conta e redefinição de senha via QR Code único

import { collection, addDoc, getDocs, query, where, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';

/**
 * Gera um token único baseado em timestamp + aleatoriedade
 * @returns {string} Token único de 32 caracteres
 */
const gerarTokenUnico = () => {
  const agora = new Date();
  
  // Componentes únicos do timestamp
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const dia = String(agora.getDate()).padStart(2, '0');
  const hora = String(agora.getHours()).padStart(2, '0');
  const minuto = String(agora.getMinutes()).padStart(2, '0');
  const segundo = String(agora.getSeconds()).padStart(2, '0');
  const milissegundo = String(agora.getMilliseconds()).padStart(3, '0');
  
  // Componente aleatório adicional
  const random = Math.random().toString(36).substring(2, 10);
  
  // Combinar tudo em um token único
  const token = `${ano}${mes}${dia}${hora}${minuto}${segundo}${milissegundo}${random}`;
  
  // Retornar hash do token para segurança
  return btoa(token).substring(0, 32).replace(/[^a-zA-Z0-9]/g, '');
};

/**
 * Cria um QR Code para criação de conta
 * @param {Object} dados - Dados da conta
 * @param {string} dados.nivelUsuario - Nível de permissão (0-6)
 * @param {string} dados.empresaId - ID da empresa (opcional)
 * @param {string} dados.empresaNome - Nome da empresa (opcional)
 * @param {string} dados.setorId - ID do setor (opcional)
 * @param {string} dados.setorNome - Nome do setor (opcional)
 * @param {number} dados.validadeHoras - Validade em horas (padrão 24h)
 * @param {string} dados.criadoPor - Email do criador
 * @returns {Promise<Object>} Resultado com sucesso/erro e dados do QR Code
 */
export const criarQRCodeCriacaoConta = async (dados) => {
  try {
    const token = gerarTokenUnico();
    const agora = new Date();
    const expiraEm = new Date(agora.getTime() + (dados.validadeHoras || 24) * 60 * 60 * 1000);
    
    // Dados do QR Code
    const qrCodeData = {
      token,
      tipo: 'criacao_conta',
      nivelUsuario: dados.nivelUsuario,
      empresaId: dados.empresaId || null,
      empresaNome: dados.empresaNome || null,
      setorId: dados.setorId || null,
      setorNome: dados.setorNome || null,
      usado: false,
      criadoEm: serverTimestamp(),
      expiraEm: expiraEm.toISOString(),
      validadeHoras: dados.validadeHoras || 24,
      criadoPor: dados.criadoPor,
      usadoEm: null,
      usadoPor: null
    };
    
    // Salvar no Firestore
    const docRef = await addDoc(collection(db, 'qr_codes_auth'), qrCodeData);
    
    // URL completa para o QR Code
    const urlBase = window.location.origin;
    const qrCodeURL = `${urlBase}/qr-auth?token=${token}&id=${docRef.id}`;
    
    return {
      success: true,
      qrCode: {
        id: docRef.id,
        url: qrCodeURL,
        token,
        ...qrCodeData
      }
    };
  } catch (error) {
    console.error('❌ Erro ao criar QR Code de criação de conta:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Cria um QR Code para redefinição de senha
 * @param {Object} dados - Dados da redefinição
 * @param {string} dados.usuarioId - ID do usuário
 * @param {string} dados.usuarioEmail - Email do usuário
 * @param {string} dados.usuarioNome - Nome do usuário
 * @param {number} dados.validadeHoras - Validade em horas (padrão 24h)
 * @param {string} dados.criadoPor - Email do criador
 * @returns {Promise<Object>} Resultado com sucesso/erro e dados do QR Code
 */
export const criarQRCodeRedefinicaoSenha = async (dados) => {
  try {
    const token = gerarTokenUnico();
    const agora = new Date();
    const expiraEm = new Date(agora.getTime() + (dados.validadeHoras || 24) * 60 * 60 * 1000);
    
    // Dados do QR Code
    const qrCodeData = {
      token,
      tipo: 'redefinicao_senha',
      usuarioId: dados.usuarioId,
      usuarioEmail: dados.usuarioEmail,
      usuarioNome: dados.usuarioNome,
      usado: false,
      criadoEm: serverTimestamp(),
      expiraEm: expiraEm.toISOString(),
      validadeHoras: dados.validadeHoras || 24,
      criadoPor: dados.criadoPor,
      usadoEm: null,
      usadoPor: null
    };
    
    // Salvar no Firestore
    const docRef = await addDoc(collection(db, 'qr_codes_auth'), qrCodeData);
    
    // URL completa para o QR Code
    const urlBase = window.location.origin;
    const qrCodeURL = `${urlBase}/qr-auth?token=${token}&id=${docRef.id}`;
    
    return {
      success: true,
      qrCode: {
        id: docRef.id,
        url: qrCodeURL,
        token,
        ...qrCodeData
      }
    };
  } catch (error) {
    console.error('❌ Erro ao criar QR Code de redefinição de senha:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Valida um token de QR Code
 * @param {string} token - Token do QR Code
 * @param {string} id - ID do documento
 * @returns {Promise<Object>} Resultado com sucesso/erro e dados do QR Code
 */
export const validarQRCode = async (token, id) => {
  try {
    // Buscar QR Code
    const qrCodesRef = collection(db, 'qr_codes_auth');
    const q = query(qrCodesRef, where('token', '==', token));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return {
        success: false,
        error: 'QR Code inválido'
      };
    }
    
    const qrCodeDoc = snapshot.docs[0];
    const qrCodeData = qrCodeDoc.data();
    
    // Verificar se o ID corresponde
    if (qrCodeDoc.id !== id) {
      return {
        success: false,
        error: 'QR Code inválido'
      };
    }
    
    // Verificar se já foi usado
    if (qrCodeData.usado) {
      return {
        success: false,
        error: 'QR Code já foi utilizado',
        usado: true,
        usadoEm: qrCodeData.usadoEm
      };
    }
    
    // Verificar se está expirado
    const agora = new Date();
    const expiraEm = new Date(qrCodeData.expiraEm);
    
    if (agora > expiraEm) {
      return {
        success: false,
        error: 'QR Code expirado',
        expirado: true
      };
    }
    
    return {
      success: true,
      qrCode: {
        id: qrCodeDoc.id,
        ...qrCodeData
      }
    };
  } catch (error) {
    console.error('❌ Erro ao validar QR Code:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Marca um QR Code como usado
 * @param {string} id - ID do documento
 * @param {string} usadoPor - Email de quem usou
 * @returns {Promise<Object>} Resultado com sucesso/erro
 */
export const marcarQRCodeComoUsado = async (id, usadoPor) => {
  try {
    const qrCodeRef = doc(db, 'qr_codes_auth', id);
    await updateDoc(qrCodeRef, {
      usado: true,
      usadoEm: serverTimestamp(),
      usadoPor
    });
    
    return {
      success: true
    };
  } catch (error) {
    console.error('❌ Erro ao marcar QR Code como usado:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Lista todos os QR Codes ativos (não usados e não expirados)
 * @returns {Promise<Object>} Resultado com sucesso/erro e lista de QR Codes
 */
export const listarQRCodesAtivos = async () => {
  try {
    const qrCodesRef = collection(db, 'qr_codes_auth');
    const snapshot = await getDocs(qrCodesRef);
    
    const agora = new Date();
    const qrCodes = snapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .filter(qr => {
        const expiraEm = new Date(qr.expiraEm);
        return !qr.usado && agora <= expiraEm;
      })
      .sort((a, b) => {
        const dataA = a.criadoEm?.toDate?.() || new Date(0);
        const dataB = b.criadoEm?.toDate?.() || new Date(0);
        return dataB - dataA;
      });
    
    return {
      success: true,
      qrCodes
    };
  } catch (error) {
    console.error('❌ Erro ao listar QR Codes ativos:', error);
    return {
      success: false,
      error: error.message,
      qrCodes: []
    };
  }
};

/**
 * Revoga (marca como usado) um QR Code específico
 * @param {string} id - ID do QR Code
 * @returns {Promise<Object>} Resultado com sucesso/erro
 */
export const revogarQRCode = async (id) => {
  try {
    const qrCodeRef = doc(db, 'qr_codes_auth', id);
    await updateDoc(qrCodeRef, {
      usado: true,
      usadoEm: serverTimestamp(),
      usadoPor: 'Revogado manualmente'
    });
    
    return {
      success: true
    };
  } catch (error) {
    console.error('❌ Erro ao revogar QR Code:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
