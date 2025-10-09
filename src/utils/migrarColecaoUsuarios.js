import { db } from '../firebaseConfig';
import { collection, getDocs, doc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';

/**
 * Script de Migração: usuarios (plural) → usuario (singular)
 * 
 * Este script migra todos os documentos da coleção 'usuarios' 
 * para a nova coleção 'usuario' mantendo os mesmos IDs de documento.
 */

/**
 * Verifica o status da migração
 * @returns {Object} Status com contagem de documentos em cada coleção
 */
export async function verificarStatusMigracao() {
  try {

    const usuariosAntigos = await getDocs(collection(db, 'usuarios'));
    const usuariosNovos = await getDocs(collection(db, 'usuario'));
    
    const status = {
      colecaoAntiga: {
        nome: 'usuarios',
        total: usuariosAntigos.size,
        documentos: usuariosAntigos.docs.map(doc => ({
          id: doc.id,
          nome: doc.data().nome,
          email: doc.data().email,
          nivel: doc.data().nivel
        }))
      },
      colecaoNova: {
        nome: 'usuario',
        total: usuariosNovos.size,
        documentos: usuariosNovos.docs.map(doc => ({
          id: doc.id,
          nome: doc.data().nome,
          email: doc.data().email,
          nivel: doc.data().nivel
        }))
      }
    };

    return status;
  } catch (error) {
    console.error('❌ Erro ao verificar status:', error);
    throw error;
  }
}

/**
 * Migra todos os documentos de 'usuarios' para 'usuario'
 * Mantém os mesmos IDs de documento para preservar referências
 * @param {boolean} deleteOldCollection - Se true, apaga a coleção antiga após migração
 * @returns {Object} Resultado da migração
 */
export async function migrarUsuariosParaUsuario(deleteOldCollection = false) {
  try {

    // 1. Verificar status antes da migração
    const statusAntes = await verificarStatusMigracao();
    
    if (statusAntes.colecaoAntiga.total === 0) {

      return {
        sucesso: false,
        mensagem: 'Nenhum documento para migrar',
        migrados: 0,
        erros: 0
      };
    }
    
    // 2. Buscar todos os documentos da coleção antiga
    const usuariosAntigos = await getDocs(collection(db, 'usuarios'));
    
    let migrados = 0;
    let erros = 0;
    const detalhes = [];

    // 3. Migrar documento por documento
    for (const docSnapshot of usuariosAntigos.docs) {
      try {
        const docId = docSnapshot.id;
        const docData = docSnapshot.data();

        // Copiar para nova coleção mantendo o mesmo ID
        await setDoc(doc(db, 'usuario', docId), docData);
        
        migrados++;
        detalhes.push({
          id: docId,
          nome: docData.nome,
          email: docData.email,
          status: 'sucesso'
        });

      } catch (error) {
        erros++;
        console.error(`❌ Erro ao migrar documento ${docSnapshot.id}:`, error);
        detalhes.push({
          id: docSnapshot.id,
          status: 'erro',
          erro: error.message
        });
      }
    }
    
    // 4. Verificar status após migração
    const statusDepois = await verificarStatusMigracao();

    // 5. Opcionalmente, apagar coleção antiga
    if (deleteOldCollection && migrados > 0 && erros === 0) {

      await apagarColecaoAntiga();
    }
    
    return {
      sucesso: erros === 0,
      mensagem: erros === 0 
        ? `✅ Migração concluída com sucesso! ${migrados} usuários migrados.`
        : `⚠️ Migração concluída com erros. ${migrados} migrados, ${erros} erros.`,
      migrados,
      erros,
      detalhes,
      statusAntes,
      statusDepois
    };
  } catch (error) {
    console.error('❌ Erro fatal na migração:', error);
    return {
      sucesso: false,
      mensagem: `❌ Erro na migração: ${error.message}`,
      migrados: 0,
      erros: 1,
      erro: error.message
    };
  }
}

/**
 * Apaga todos os documentos da coleção antiga 'usuarios'
 * CUIDADO: Esta operação é irreversível!
 */
async function apagarColecaoAntiga() {
  try {

    const usuariosAntigos = await getDocs(collection(db, 'usuarios'));
    
    // Usar batch para operações mais eficientes
    const batches = [];
    let currentBatch = writeBatch(db);
    let operationCount = 0;
    
    for (const docSnapshot of usuariosAntigos.docs) {
      currentBatch.delete(doc(db, 'usuarios', docSnapshot.id));
      operationCount++;
      
      // Firestore batch limit é 500 operações
      if (operationCount >= 500) {
        batches.push(currentBatch);
        currentBatch = writeBatch(db);
        operationCount = 0;
      }
    }
    
    // Adicionar último batch se tiver operações
    if (operationCount > 0) {
      batches.push(currentBatch);
    }
    
    // Executar todos os batches
    for (const batch of batches) {
      await batch.commit();
    }

  } catch (error) {
    console.error('❌ Erro ao apagar coleção antiga:', error);
    throw error;
  }
}

/**
 * Sincroniza coleções: copia novos usuários de 'usuarios' para 'usuario'
 * e mantém ambas as coleções sincronizadas
 */
export async function sincronizarColecoes() {
  try {

    const [usuariosAntigos, usuariosNovos] = await Promise.all([
      getDocs(collection(db, 'usuarios')),
      getDocs(collection(db, 'usuario'))
    ]);
    
    // Criar mapa de IDs na nova coleção
    const idsNovos = new Set(usuariosNovos.docs.map(doc => doc.id));
    
    let sincronizados = 0;
    
    // Copiar apenas os que não existem na nova coleção
    for (const docSnapshot of usuariosAntigos.docs) {
      if (!idsNovos.has(docSnapshot.id)) {
        const docData = docSnapshot.data();
        await setDoc(doc(db, 'usuario', docSnapshot.id), docData);
        sincronizados++;

      }
    }

    return {
      sucesso: true,
      mensagem: sincronizados > 0 
        ? `✅ ${sincronizados} novos usuários sincronizados`
        : '✅ Coleções já estão sincronizadas',
      sincronizados
    };
  } catch (error) {
    console.error('❌ Erro ao sincronizar:', error);
    return {
      sucesso: false,
      mensagem: `❌ Erro: ${error.message}`,
      sincronizados: 0
    };
  }
}

/**
 * Verifica se há diferenças entre as coleções
 */
export async function compararColecoes() {
  try {
    const status = await verificarStatusMigracao();
    
    const diferencas = {
      apenasEmUsuarios: [],
      apenasEmUsuario: [],
      comDiferencas: []
    };
    
    // IDs presentes em cada coleção
    const idsAntigos = new Set(status.colecaoAntiga.documentos.map(d => d.id));
    const idsNovos = new Set(status.colecaoNova.documentos.map(d => d.id));
    
    // Encontrar documentos apenas em usuarios (antiga)
    for (const id of idsAntigos) {
      if (!idsNovos.has(id)) {
        const doc = status.colecaoAntiga.documentos.find(d => d.id === id);
        diferencas.apenasEmUsuarios.push(doc);
      }
    }
    
    // Encontrar documentos apenas em usuario (nova)
    for (const id of idsNovos) {
      if (!idsAntigos.has(id)) {
        const doc = status.colecaoNova.documentos.find(d => d.id === id);
        diferencas.apenasEmUsuario.push(doc);
      }
    }
    
    return {
      totalAntiga: status.colecaoAntiga.total,
      totalNova: status.colecaoNova.total,
      diferencas,
      sincronizado: diferencas.apenasEmUsuarios.length === 0 && diferencas.apenasEmUsuario.length === 0
    };
  } catch (error) {
    console.error('❌ Erro ao comparar coleções:', error);
    throw error;
  }
}

export default {
  verificarStatusMigracao,
  migrarUsuariosParaUsuario,
  sincronizarColecoes,
  compararColecoes
};
