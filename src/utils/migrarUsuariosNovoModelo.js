/**
 * Script de Migração de Usuários para o Novo Modelo
 * 
 * Atualiza todos os usuários existentes para incluir os novos campos:
 * - status (online/offline)
 * - ultimaVez (timestamp)
 * - itemFavorito
 * - menuConfig (array de configurações)
 */

import { collection, getDocs, doc, updateDoc, writeBatch, Timestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { 
  criarModeloUsuarioPadrao, 
  validarModeloUsuario,
  atualizarMenuPorNivel,
  STATUS_USUARIO
} from '../constants/usuarioModel';

/**
 * Verifica quais usuários precisam ser migrados
 * @returns {Promise<Object>} Status da migração necessária
 */
export const verificarStatusMigracaoUsuarios = async () => {
  try {
    console.log('🔍 Verificando status de migração de usuários...');
    
    const usuariosSnapshot = await getDocs(collection(db, 'usuario'));
    const usuarios = usuariosSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    const estatisticas = {
      total: usuarios.length,
      comModeloCompleto: 0,
      precisamMigracao: 0,
      camposFaltando: {}
    };
    
    const usuariosParaMigrar = [];
    
    usuarios.forEach(usuario => {
      const validacao = validarModeloUsuario(usuario);
      
      if (validacao.valido) {
        estatisticas.comModeloCompleto++;
      } else {
        estatisticas.precisamMigracao++;
        usuariosParaMigrar.push({
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          camposFaltando: validacao.camposFaltando
        });
        
        // Contar quais campos estão faltando
        validacao.camposFaltando.forEach(campo => {
          estatisticas.camposFaltando[campo] = (estatisticas.camposFaltando[campo] || 0) + 1;
        });
      }
    });
    
    console.log('📊 Estatísticas de Migração:', estatisticas);
    console.log('👥 Usuários que precisam migração:', usuariosParaMigrar);
    
    return {
      sucesso: true,
      estatisticas,
      usuariosParaMigrar,
      precisaMigrar: estatisticas.precisamMigracao > 0
    };
    
  } catch (error) {
    console.error('❌ Erro ao verificar status de migração:', error);
    return {
      sucesso: false,
      erro: error.message
    };
  }
};

/**
 * Migra um usuário individual para o novo modelo
 * @param {Object} usuario - Usuário a ser migrado
 * @returns {Object} Dados atualizados do usuário
 */
export const migrarUsuarioIndividual = (usuario) => {
  console.log(`🔄 Migrando usuário: ${usuario.nome} (${usuario.email})`);
  
  // Criar modelo base preservando dados existentes
  const dadosBase = {
    ...usuario,
    extras: {} // Campos adicionais que não fazem parte do modelo padrão
  };
  
  // Criar usuário com modelo completo
  const usuarioCompleto = criarModeloUsuarioPadrao(dadosBase);
  
  // Atualizar menuConfig baseado no nível se não existir
  if (!usuario.menuConfig || !Array.isArray(usuario.menuConfig) || usuario.menuConfig.length === 0) {
    usuarioCompleto.menuConfig = atualizarMenuPorNivel(usuario.nivel);
    console.log(`  ✅ MenuConfig criado para nível ${usuario.nivel}`);
  }
  
  // Definir status padrão se não existir
  if (!usuario.status) {
    usuarioCompleto.status = STATUS_USUARIO.OFFLINE;
    console.log(`  ✅ Status definido como OFFLINE`);
  }
  
  // Preservar ultimaVez se existir
  if (usuario.ultimaVez) {
    usuarioCompleto.ultimaVez = usuario.ultimaVez;
  }
  
  // Log dos campos adicionados
  const camposAdicionados = [];
  if (!usuario.status) camposAdicionados.push('status');
  if (!usuario.menuConfig) camposAdicionados.push('menuConfig');
  if (!usuario.itemFavorito) camposAdicionados.push('itemFavorito');
  
  if (camposAdicionados.length > 0) {
    console.log(`  ➕ Campos adicionados: ${camposAdicionados.join(', ')}`);
  }
  
  return usuarioCompleto;
};

/**
 * Executa a migração de todos os usuários
 * @param {Object} opcoes - Opções de migração
 * @returns {Promise<Object>} Resultado da migração
 */
export const executarMigracaoUsuarios = async (opcoes = {}) => {
  const {
    apenasSimular = false,
    usuariosEspecificos = null
  } = opcoes;
  
  try {
    console.log('🚀 Iniciando migração de usuários para o novo modelo...');
    if (apenasSimular) {
      console.log('⚠️ MODO SIMULAÇÃO - Nenhuma alteração será salva no banco');
    }
    
    // Buscar usuários
    const usuariosSnapshot = await getDocs(collection(db, 'usuario'));
    let usuarios = usuariosSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Filtrar usuários específicos se fornecido
    if (usuariosEspecificos && Array.isArray(usuariosEspecificos)) {
      usuarios = usuarios.filter(u => usuariosEspecificos.includes(u.id));
      console.log(`🎯 Migrando apenas ${usuarios.length} usuários específicos`);
    }
    
    const resultados = {
      total: usuarios.length,
      sucesso: 0,
      erros: 0,
      pulos: 0,
      detalhes: []
    };
    
    // Usar batch para melhor performance
    const batch = writeBatch(db);
    const BATCH_SIZE = 500; // Firestore permite até 500 operações por batch
    let operacoesNoBatch = 0;
    
    for (const usuario of usuarios) {
      try {
        // Verificar se precisa migração
        const validacao = validarModeloUsuario(usuario);
        
        if (validacao.valido) {
          console.log(`⏭️ Usuário ${usuario.nome} já está no modelo correto`);
          resultados.pulos++;
          resultados.detalhes.push({
            id: usuario.id,
            nome: usuario.nome,
            status: 'pulado',
            motivo: 'Já possui modelo completo'
          });
          continue;
        }
        
        // Migrar usuário
        const usuarioMigrado = migrarUsuarioIndividual(usuario);
        
        // Remover o ID antes de salvar
        const { id, ...dadosParaSalvar } = usuarioMigrado;
        
        if (!apenasSimular) {
          const usuarioRef = doc(db, 'usuario', usuario.id);
          batch.update(usuarioRef, dadosParaSalvar);
          operacoesNoBatch++;
          
          // Commit do batch se atingir o limite
          if (operacoesNoBatch >= BATCH_SIZE) {
            await batch.commit();
            console.log(`📦 Batch de ${operacoesNoBatch} operações commitado`);
            operacoesNoBatch = 0;
          }
        }
        
        resultados.sucesso++;
        resultados.detalhes.push({
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          status: 'sucesso',
          camposAdicionados: validacao.camposFaltando
        });
        
        console.log(`✅ Usuário ${usuario.nome} migrado com sucesso`);
        
      } catch (error) {
        console.error(`❌ Erro ao migrar usuário ${usuario.nome}:`, error);
        resultados.erros++;
        resultados.detalhes.push({
          id: usuario.id,
          nome: usuario.nome,
          status: 'erro',
          erro: error.message
        });
      }
    }
    
    // Commit do batch restante
    if (!apenasSimular && operacoesNoBatch > 0) {
      await batch.commit();
      console.log(`📦 Batch final de ${operacoesNoBatch} operações commitado`);
    }
    
    console.log('🎉 Migração concluída!');
    console.log('📊 Resultados:', {
      total: resultados.total,
      sucesso: resultados.sucesso,
      pulos: resultados.pulos,
      erros: resultados.erros
    });
    
    return {
      sucesso: true,
      resultados,
      simulacao: apenasSimular
    };
    
  } catch (error) {
    console.error('❌ Erro fatal na migração:', error);
    return {
      sucesso: false,
      erro: error.message
    };
  }
};

/**
 * Reverte a migração removendo os novos campos
 * @param {Array} usuariosIds - IDs dos usuários a reverter (opcional)
 * @returns {Promise<Object>} Resultado da reversão
 */
export const reverterMigracao = async (usuariosIds = null) => {
  try {
    console.log('⏪ Revertendo migração de usuários...');
    
    const usuariosSnapshot = await getDocs(collection(db, 'usuario'));
    let usuarios = usuariosSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    if (usuariosIds && Array.isArray(usuariosIds)) {
      usuarios = usuarios.filter(u => usuariosIds.includes(u.id));
    }
    
    const batch = writeBatch(db);
    
    for (const usuario of usuarios) {
      const usuarioRef = doc(db, 'usuario', usuario.id);
      
      // Remover campos do novo modelo
      batch.update(usuarioRef, {
        status: null,
        ultimaVez: null,
        itemFavorito: null,
        menuConfig: null
      });
    }
    
    await batch.commit();
    
    console.log(`✅ Migração revertida para ${usuarios.length} usuários`);
    
    return {
      sucesso: true,
      usuariosRevertidos: usuarios.length
    };
    
  } catch (error) {
    console.error('❌ Erro ao reverter migração:', error);
    return {
      sucesso: false,
      erro: error.message
    };
  }
};

export default {
  verificarStatusMigracaoUsuarios,
  migrarUsuarioIndividual,
  executarMigracaoUsuarios,
  reverterMigracao
};
