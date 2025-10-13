/**
 * Serviço de Ajustes de Ponto
 * Gerencia o sistema de 4 ajustes por mês por funcionário
 */

import { collection, query, where, getDocs, addDoc, updateDoc, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';

const AJUSTES_POR_MES = 4;

/**
 * Obtém o mês de referência atual no formato YYYY-MM
 */
export function getMesReferencia() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  return `${ano}-${mes}`;
}

/**
 * Obtém ou cria o registro de ajustes do mês para um funcionário
 */
export async function getAjustesMes(funcionarioId, mesReferencia = null) {
  const mes = mesReferencia || getMesReferencia();
  
  try {
    const q = query(
      collection(db, 'ajustes_ponto_mensais'),
      where('funcionarioId', '==', String(funcionarioId)),
      where('mesReferencia', '==', mes)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      // Criar novo registro para este mês
      const novoRegistro = {
        funcionarioId: String(funcionarioId),
        mesReferencia: mes,
        ajustesUsados: 0,
        ajustesRestantes: AJUSTES_POR_MES,
        historico: [],
        criadoEm: new Date().toISOString()
      };
      
      const docRef = await addDoc(collection(db, 'ajustes_ponto_mensais'), novoRegistro);
      
      return {
        id: docRef.id,
        ...novoRegistro
      };
    }
    
    const dados = snapshot.docs[0];
    return {
      id: dados.id,
      ...dados.data()
    };
  } catch (error) {
    console.error('Erro ao buscar ajustes do mês:', error);
    throw error;
  }
}

/**
 * Verifica se o funcionário pode fazer um ajuste
 */
export async function podeAjustar(funcionarioId) {
  try {
    const ajustes = await getAjustesMes(funcionarioId);
    return ajustes.ajustesRestantes > 0;
  } catch (error) {
    console.error('Erro ao verificar permissão de ajuste:', error);
    return false;
  }
}

/**
 * Registra um ajuste de ponto (decrementa ajustesRestantes)
 */
export async function registrarAjuste(funcionarioId, tipoAjuste, detalhes, pontosOriginais = null) {
  try {
    const ajustes = await getAjustesMes(funcionarioId);
    
    if (ajustes.ajustesRestantes <= 0) {
      throw new Error('Você já usou todos os 4 ajustes permitidos neste mês.');
    }
    
    // Atualizar registro
    const novoHistorico = [
      ...ajustes.historico,
      {
        tipo: tipoAjuste,
        detalhes: detalhes,
        pontosOriginais: pontosOriginais, // Salvar pontos antes da edição
        data: new Date().toISOString(),
        timestamp: Date.now()
      }
    ];
    
    await updateDoc(doc(db, 'ajustes_ponto_mensais', ajustes.id), {
      ajustesUsados: ajustes.ajustesUsados + 1,
      ajustesRestantes: ajustes.ajustesRestantes - 1,
      historico: novoHistorico,
      ultimoAjuste: new Date().toISOString()
    });
    
    return {
      sucesso: true,
      ajustesRestantes: ajustes.ajustesRestantes - 1
    };
  } catch (error) {
    console.error('Erro ao registrar ajuste:', error);
    throw error;
  }
}

/**
 * Listener em tempo real para ajustes do mês
 */
export function onAjustesMesChange(funcionarioId, callback) {
  const mes = getMesReferencia();
  
  const q = query(
    collection(db, 'ajustes_ponto_mensais'),
    where('funcionarioId', '==', String(funcionarioId)),
    where('mesReferencia', '==', mes)
  );
  
  return onSnapshot(q, async (snapshot) => {
    if (snapshot.empty) {
      // Criar registro se não existir
      const ajustes = await getAjustesMes(funcionarioId);
      callback(ajustes);
    } else {
      const dados = snapshot.docs[0];
      callback({
        id: dados.id,
        ...dados.data()
      });
    }
  });
}

/**
 * Obtém histórico de ajustes de um funcionário
 */
export async function getHistoricoAjustes(funcionarioId, mesReferencia = null) {
  try {
    const ajustes = await getAjustesMes(funcionarioId, mesReferencia);
    return ajustes.historico || [];
  } catch (error) {
    console.error('Erro ao buscar histórico de ajustes:', error);
    return [];
  }
}
