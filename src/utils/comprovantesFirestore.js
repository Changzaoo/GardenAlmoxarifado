import { collection, addDoc, query, where, orderBy, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';

/**
 * Salva um comprovante no Firestore para consulta posterior
 * @param {Object} dados - Dados do comprovante
 * @returns {Promise<string>} ID do documento criado
 */
export const salvarComprovante = async (tipo, dados) => {
  try {
    const comprovanteData = {
      tipo, // 'emprestimo', 'devolucao', 'tarefa', 'avaliacao'
      transacaoId: dados.transacaoId || dados.id,
      emprestimoId: dados.id,
      funcionarioId: dados.funcionarioId,
      funcionarioNome: dados.para || dados.funcionario,
      empresa: dados.empresa,
      setor: dados.setor,
      cargo: dados.cargo,
      status: dados.status,
      quantidade: dados.quantidade,
      ferramentas: dados.ferramentas || [],
      data: dados.data,
      dataCriacao: serverTimestamp(),
      codigoAssinatura: dados.codigoAssinatura,
      observacoes: dados.descricao || dados.observacoes
    };

    const docRef = await addDoc(collection(db, 'comprovantes'), comprovanteData);
    console.log('✅ Comprovante salvo com ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Erro ao salvar comprovante:', error);
    throw error;
  }
};

/**
 * Busca comprovantes por funcionário
 * @param {string} funcionarioId - ID do funcionário
 * @returns {Promise<Array>} Lista de comprovantes
 */
export const buscarComprovantesPorFuncionario = async (funcionarioId) => {
  try {
    const q = query(
      collection(db, 'comprovantes'),
      where('funcionarioId', '==', funcionarioId),
      orderBy('dataCriacao', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('❌ Erro ao buscar comprovantes:', error);
    return [];
  }
};

/**
 * Busca comprovante por código de assinatura
 * @param {string} codigoAssinatura - Código único do comprovante
 * @returns {Promise<Object|null>} Dados do comprovante ou null
 */
export const buscarComprovantePorCodigo = async (codigoAssinatura) => {
  try {
    const q = query(
      collection(db, 'comprovantes'),
      where('codigoAssinatura', '==', codigoAssinatura)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    };
  } catch (error) {
    console.error('❌ Erro ao buscar comprovante por código:', error);
    return null;
  }
};

/**
 * Busca todos os comprovantes (com paginação opcional)
 * @param {number} limite - Número máximo de resultados
 * @returns {Promise<Array>} Lista de comprovantes
 */
export const buscarTodosComprovantes = async (limite = 50) => {
  try {
    const q = query(
      collection(db, 'comprovantes'),
      orderBy('dataCriacao', 'desc')
    );

    const snapshot = await getDocs(q);
    const comprovantes = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return comprovantes.slice(0, limite);
  } catch (error) {
    console.error('❌ Erro ao buscar comprovantes:', error);
    return [];
  }
};

/**
 * Busca comprovantes por tipo
 * @param {string} tipo - Tipo do comprovante
 * @returns {Promise<Array>} Lista de comprovantes
 */
export const buscarComprovantesPorTipo = async (tipo) => {
  try {
    const q = query(
      collection(db, 'comprovantes'),
      where('tipo', '==', tipo),
      orderBy('dataCriacao', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('❌ Erro ao buscar comprovantes por tipo:', error);
    return [];
  }
};

/**
 * Busca comprovantes por período
 * @param {Date} dataInicio - Data inicial
 * @param {Date} dataFim - Data final
 * @returns {Promise<Array>} Lista de comprovantes
 */
export const buscarComprovantesPorPeriodo = async (dataInicio, dataFim) => {
  try {
    const q = query(
      collection(db, 'comprovantes'),
      where('data', '>=', dataInicio.toISOString()),
      where('data', '<=', dataFim.toISOString()),
      orderBy('data', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('❌ Erro ao buscar comprovantes por período:', error);
    return [];
  }
};
