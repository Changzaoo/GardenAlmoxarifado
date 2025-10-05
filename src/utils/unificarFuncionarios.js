import { db } from '../firebaseConfig';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';

/**
 * Utilitário para Unificar Funcionários Duplicados
 * 
 * Detecta e mescla funcionários duplicados (mesmo nome ou email),
 * preservando as fotos dos que têm photoURL.
 */

/**
 * Normaliza nome para comparação
 */
const normalizarNome = (nome) => {
  if (!nome) return '';
  return nome
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Remove acentos
};

/**
 * Detecta funcionários duplicados
 * @param {Array} funcionarios - Lista de funcionários
 * @returns {Object} Grupos de duplicados
 */
export const detectarDuplicados = (funcionarios) => {
  const gruposPorNome = new Map();
  const gruposPorEmail = new Map();
  const duplicados = [];

  funcionarios.forEach(func => {
    const nomeKey = normalizarNome(func.nome);
    const emailKey = func.email?.toLowerCase();

    // Agrupar por nome
    if (nomeKey) {
      if (!gruposPorNome.has(nomeKey)) {
        gruposPorNome.set(nomeKey, []);
      }
      gruposPorNome.get(nomeKey).push(func);
    }

    // Agrupar por email
    if (emailKey) {
      if (!gruposPorEmail.has(emailKey)) {
        gruposPorEmail.set(emailKey, []);
      }
      gruposPorEmail.get(emailKey).push(func);
    }
  });

  // Encontrar duplicados por nome
  gruposPorNome.forEach((grupo, nome) => {
    if (grupo.length > 1) {
      duplicados.push({
        tipo: 'nome',
        chave: nome,
        funcionarios: grupo,
        principal: escolherFuncionarioPrincipal(grupo)
      });
    }
  });

  // Encontrar duplicados por email (que não foram pegos por nome)
  gruposPorEmail.forEach((grupo, email) => {
    if (grupo.length > 1) {
      // Verificar se já não está nos duplicados por nome
      const jaExiste = duplicados.some(dup => 
        dup.funcionarios.some(f => grupo.some(g => g.id === f.id))
      );
      
      if (!jaExiste) {
        duplicados.push({
          tipo: 'email',
          chave: email,
          funcionarios: grupo,
          principal: escolherFuncionarioPrincipal(grupo)
        });
      }
    }
  });

  return {
    total: duplicados.length,
    grupos: duplicados,
    totalFuncionariosDuplicados: duplicados.reduce((acc, dup) => acc + dup.funcionarios.length, 0),
    podeUnificar: duplicados.reduce((acc, dup) => acc + (dup.funcionarios.length - 1), 0)
  };
};

/**
 * Escolhe o funcionário principal do grupo (prioriza quem tem foto)
 * @param {Array} grupo - Grupo de funcionários duplicados
 * @returns {Object} Funcionário principal
 */
const escolherFuncionarioPrincipal = (grupo) => {
  // 1ª prioridade: funcionário com foto
  const comFoto = grupo.find(f => f.photoURL);
  if (comFoto) return comFoto;

  // 2ª prioridade: funcionário com mais dados completos
  const pontuacao = (func) => {
    let pontos = 0;
    if (func.cargo) pontos += 2;
    if (func.telefone) pontos += 2;
    if (func.email) pontos += 1;
    if (func.empresaId) pontos += 1;
    if (func.setorId) pontos += 1;
    return pontos;
  };

  return grupo.reduce((melhor, atual) => 
    pontuacao(atual) > pontuacao(melhor) ? atual : melhor
  , grupo[0]);
};

/**
 * Mescla dados de funcionários duplicados
 * @param {Array} funcionarios - Grupo de funcionários duplicados
 * @returns {Object} Dados mesclados
 */
const mesclarDadosFuncionarios = (funcionarios) => {
  const principal = escolherFuncionarioPrincipal(funcionarios);
  const dadosMesclados = { ...principal };

  // Mesclar campos de todos os funcionários
  funcionarios.forEach(func => {
    // Manter photoURL se algum tiver
    if (!dadosMesclados.photoURL && func.photoURL) {
      dadosMesclados.photoURL = func.photoURL;
    }
    
    // Manter cargo se algum tiver
    if (!dadosMesclados.cargo && func.cargo) {
      dadosMesclados.cargo = func.cargo;
    }
    
    // Manter telefone se algum tiver
    if (!dadosMesclados.telefone && func.telefone) {
      dadosMesclados.telefone = func.telefone;
    }
    
    // Manter email se algum tiver
    if (!dadosMesclados.email && func.email) {
      dadosMesclados.email = func.email;
    }
    
    // Manter empresa se algum tiver
    if (!dadosMesclados.empresaId && func.empresaId) {
      dadosMesclados.empresaId = func.empresaId;
      dadosMesclados.empresaNome = func.empresaNome;
    }
    
    // Manter setor se algum tiver
    if (!dadosMesclados.setorId && func.setorId) {
      dadosMesclados.setorId = func.setorId;
      dadosMesclados.setorNome = func.setorNome;
    }
  });

  return dadosMesclados;
};

/**
 * Unifica funcionários duplicados no Firebase
 * @param {Object} grupoDuplicado - Grupo de funcionários duplicados
 * @returns {Object} Resultado da unificação
 */
export const unificarGrupoDuplicados = async (grupoDuplicado) => {
  try {
    const { funcionarios, principal } = grupoDuplicado;
    
    // Mesclar dados de todos os funcionários
    const dadosMesclados = mesclarDadosFuncionarios(funcionarios);
    
    // Atualizar o funcionário principal com os dados mesclados
    const principalRef = doc(db, 'funcionarios', principal.id);
    await updateDoc(principalRef, {
      ...dadosMesclados,
      dataAtualizacao: new Date().toISOString(),
      unificadoEm: new Date().toISOString(),
      idsUnificados: funcionarios.filter(f => f.id !== principal.id).map(f => f.id)
    });

    // Remover os funcionários duplicados
    const paraRemover = funcionarios.filter(f => f.id !== principal.id);
    for (const func of paraRemover) {
      const funcRef = doc(db, 'funcionarios', func.id);
      await deleteDoc(funcRef);
    }

    return {
      sucesso: true,
      principalId: principal.id,
      removidos: paraRemover.length,
      dadosMesclados
    };
  } catch (error) {
    console.error('Erro ao unificar funcionários:', error);
    return {
      sucesso: false,
      erro: error.message
    };
  }
};

/**
 * Unifica todos os duplicados detectados
 * @param {Array} funcionarios - Lista completa de funcionários
 * @returns {Object} Resultado da unificação em lote
 */
export const unificarTodosDuplicados = async (funcionarios) => {
  const deteccao = detectarDuplicados(funcionarios);
  const resultados = {
    total: 0,
    sucessos: 0,
    erros: 0,
    detalhes: []
  };

  for (const grupo of deteccao.grupos) {
    const resultado = await unificarGrupoDuplicados(grupo);
    resultados.total++;
    
    if (resultado.sucesso) {
      resultados.sucessos++;
      resultados.detalhes.push({
        tipo: grupo.tipo,
        chave: grupo.chave,
        principalId: resultado.principalId,
        removidos: resultado.removidos
      });
    } else {
      resultados.erros++;
      resultados.detalhes.push({
        tipo: grupo.tipo,
        chave: grupo.chave,
        erro: resultado.erro
      });
    }
  }

  return resultados;
};

/**
 * Busca todos os funcionários e detecta duplicados
 * @returns {Object} Funcionários e duplicados detectados
 */
export const buscarEDetectarDuplicados = async () => {
  try {
    // Buscar funcionários de ambas as coleções
    const funcionariosSnap = await getDocs(collection(db, 'funcionarios'));
    const usuariosSnap = await getDocs(collection(db, 'usuario'));

    const funcionarios = funcionariosSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      origem: 'funcionarios'
    }));

    const usuarios = usuariosSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      origem: 'usuarios'
    }));

    // Combinar e remover duplicados exatos por ID
    const todosMap = new Map();
    [...funcionarios, ...usuarios].forEach(func => {
      if (!todosMap.has(func.id)) {
        todosMap.set(func.id, func);
      }
    });

    const todosFuncionarios = Array.from(todosMap.values());
    const duplicados = detectarDuplicados(todosFuncionarios);

    return {
      funcionarios: todosFuncionarios,
      duplicados,
      totalFuncionarios: todosFuncionarios.length
    };
  } catch (error) {
    console.error('Erro ao buscar e detectar duplicados:', error);
    throw error;
  }
};
