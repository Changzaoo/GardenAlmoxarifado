import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { dbWorkflowBR1 } from '../config/firebaseWorkflowBR1';
import { NIVEIS_PERMISSAO } from '../constants/permissoes';

/**
 * Diagnóstico e Correção de Níveis de Usuários Admin
 * 
 * Este script identifica e corrige usuários admin que possam ter
 * níveis incorretos devido ao sistema antigo de numeração
 */

/**
 * Diagnosticar usuários admin com níveis incorretos
 */
export async function diagnosticarAdmins() {
  console.log('🔍 Iniciando diagnóstico de usuários admin...');
  
  const problemas = [];
  const databases = [
    { nome: 'Principal (db)', db: db },
    { nome: 'WorkflowBR1', db: dbWorkflowBR1 }
  ];
  
  for (const database of databases) {
    try {
      console.log(`📊 Verificando base: ${database.nome}`);
      
      const usuariosRef = collection(database.db, 'usuarios');
      const snapshot = await getDocs(usuariosRef);
      
      snapshot.forEach((docSnap) => {
        const usuario = { id: docSnap.id, ...docSnap.data() };
        
        // Verificar se é admin pelo email
        if (usuario.email === 'admin') {
          console.log(`👤 Admin encontrado em ${database.nome}:`, {
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email,
            nivel: usuario.nivel,
            nivelTipo: typeof usuario.nivel,
            isCorreto: usuario.nivel === NIVEIS_PERMISSAO.ADMIN
          });
          
          if (usuario.nivel !== NIVEIS_PERMISSAO.ADMIN) {
            problemas.push({
              database: database.nome,
              db: database.db,
              usuario: usuario,
              problemaDetectado: `Nível incorreto: ${usuario.nivel} (deveria ser ${NIVEIS_PERMISSAO.ADMIN})`
            });
          }
        }
        
        // Verificar se há usuários com nível 4 (sistema antigo de admin)
        if (usuario.nivel === 4 && usuario.email !== 'admin') {
          console.log(`⚠️ Usuário com nível 4 (admin antigo) em ${database.nome}:`, {
            id: usuario.id,
            nome: usuario.nome,
            email: usuario.email,
            nivel: usuario.nivel
          });
          
          problemas.push({
            database: database.nome,
            db: database.db,
            usuario: usuario,
            problemaDetectado: `Possível admin do sistema antigo (nível 4)`
          });
        }
      });
      
    } catch (error) {
      console.error(`❌ Erro ao verificar ${database.nome}:`, error);
    }
  }
  
  return {
    totalProblemas: problemas.length,
    problemas: problemas
  };
}

/**
 * Corrigir usuários admin com níveis incorretos
 */
export async function corrigirAdmins(problemas) {
  console.log('🔧 Iniciando correção de usuários admin...');
  
  const correcoesRealizadas = [];
  
  for (const problema of problemas) {
    try {
      console.log(`🔄 Corrigindo ${problema.usuario.nome} em ${problema.database}...`);
      
      const usuarioRef = doc(problema.db, 'usuarios', problema.usuario.id);
      
      // Se é o admin principal, corrigir para nível 0
      if (problema.usuario.email === 'admin') {
        await updateDoc(usuarioRef, { 
          nivel: NIVEIS_PERMISSAO.ADMIN,
          nivelCorrigidoEm: new Date().toISOString(),
          observacao: 'Nível corrigido automaticamente para sistema reversivo'
        });
        
        console.log(`✅ Admin corrigido: ${problema.usuario.nivel} → ${NIVEIS_PERMISSAO.ADMIN}`);
        
        correcoesRealizadas.push({
          usuario: problema.usuario.nome,
          database: problema.database,
          nivelAnterior: problema.usuario.nivel,
          nivelNovo: NIVEIS_PERMISSAO.ADMIN,
          status: 'sucesso'
        });
      }
      // Se é um usuário com nível 4 (admin antigo), converter para o novo sistema
      else if (problema.usuario.nivel === 4) {
        // Converter nível 4 (admin antigo) para nível 0 (admin novo)
        await updateDoc(usuarioRef, { 
          nivel: NIVEIS_PERMISSAO.ADMIN,
          nivelCorrigidoEm: new Date().toISOString(),
          observacao: 'Migrado do sistema antigo (4) para novo sistema (0)'
        });
        
        console.log(`✅ Admin migrado: ${problema.usuario.nivel} → ${NIVEIS_PERMISSAO.ADMIN}`);
        
        correcoesRealizadas.push({
          usuario: problema.usuario.nome,
          database: problema.database,
          nivelAnterior: problema.usuario.nivel,
          nivelNovo: NIVEIS_PERMISSAO.ADMIN,
          status: 'migrado'
        });
      }
      
    } catch (error) {
      console.error(`❌ Erro ao corrigir ${problema.usuario.nome}:`, error);
      
      correcoesRealizadas.push({
        usuario: problema.usuario.nome,
        database: problema.database,
        nivelAnterior: problema.usuario.nivel,
        nivelNovo: null,
        status: 'erro',
        erro: error.message
      });
    }
  }
  
  return correcoesRealizadas;
}

/**
 * Executar diagnóstico completo e correção automática
 */
export async function diagnosticarECorrigirAdmins() {
  console.log('🚀 Iniciando diagnóstico e correção automática de admins...');
  
  try {
    // 1. Diagnosticar problemas
    const { totalProblemas, problemas } = await diagnosticarAdmins();
    
    console.log(`📊 Diagnóstico concluído: ${totalProblemas} problemas encontrados`);
    
    if (totalProblemas === 0) {
      console.log('✅ Nenhum problema encontrado com usuários admin');
      return { 
        success: true, 
        problemas: 0, 
        correcoes: [] 
      };
    }
    
    // 2. Corrigir problemas encontrados
    const correcoes = await corrigirAdmins(problemas);
    
    console.log('📋 Resumo das correções:');
    correcoes.forEach(correcao => {
      if (correcao.status === 'sucesso' || correcao.status === 'migrado') {
        console.log(`✅ ${correcao.usuario}: ${correcao.nivelAnterior} → ${correcao.nivelNovo}`);
      } else {
        console.log(`❌ ${correcao.usuario}: Erro - ${correcao.erro}`);
      }
    });
    
    return {
      success: true,
      problemas: totalProblemas,
      correcoes: correcoes
    };
    
  } catch (error) {
    console.error('❌ Erro durante diagnóstico e correção:', error);
    return {
      success: false,
      erro: error.message
    };
  }
}

/**
 * Verificar consistência do sistema de níveis
 */
export async function verificarConsistenciaNiveis() {
  console.log('🔍 Verificando consistência do sistema de níveis...');
  
  const estatisticas = {
    [NIVEIS_PERMISSAO.ADMIN]: 0,           // 0
    [NIVEIS_PERMISSAO.GERENTE_GERAL]: 0,   // 1  
    [NIVEIS_PERMISSAO.GERENTE_SETOR]: 0,   // 2
    [NIVEIS_PERMISSAO.SUPERVISOR]: 0,      // 3
    [NIVEIS_PERMISSAO.FUNCIONARIO]: 0,     // 4
    [NIVEIS_PERMISSAO.TERCEIRIZADO]: 0,    // 5
    [NIVEIS_PERMISSAO.TEMPORARIO]: 0,      // 6
    niveisInvalidos: []
  };
  
  try {
    const usuariosRef = collection(db, 'usuarios');
    const snapshot = await getDocs(usuariosRef);
    
    snapshot.forEach((docSnap) => {
      const usuario = { id: docSnap.id, ...docSnap.data() };
      
      if (estatisticas.hasOwnProperty(usuario.nivel)) {
        estatisticas[usuario.nivel]++;
      } else {
        estatisticas.niveisInvalidos.push({
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
          nivel: usuario.nivel
        });
      }
    });
    
    console.log('📊 Estatísticas de níveis:');
    console.log(`Admin (0): ${estatisticas[0]} usuários`);
    console.log(`Gerente Geral (1): ${estatisticas[1]} usuários`);
    console.log(`Gerente Setor (2): ${estatisticas[2]} usuários`);
    console.log(`Supervisor (3): ${estatisticas[3]} usuários`);
    console.log(`Funcionário (4): ${estatisticas[4]} usuários`);
    console.log(`Terceirizado (5): ${estatisticas[5]} usuários`);
    console.log(`Temporário (6): ${estatisticas[6]} usuários`);
    
    if (estatisticas.niveisInvalidos.length > 0) {
      console.log(`⚠️ Níveis inválidos encontrados: ${estatisticas.niveisInvalidos.length}`);
      estatisticas.niveisInvalidos.forEach(user => {
        console.log(`  - ${user.nome} (${user.email}): nível ${user.nivel}`);
      });
    }
    
    return estatisticas;
    
  } catch (error) {
    console.error('❌ Erro ao verificar consistência:', error);
    throw error;
  }
}