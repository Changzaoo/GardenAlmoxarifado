/**
 * 🧹 Script para Limpar Usuários Admin Duplicados
 * 
 * Remove todos os usuários com login "admin" que foram criados
 * incorretamente com nível "funcionario" durante rotação de servidores
 */

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  deleteDoc, 
  doc, 
  query, 
  where 
} from 'firebase/firestore';

// Configurações dos bancos de dados
const primaryConfig = {
  apiKey: "AIzaSyAnLmtkehOUUAbtRcOg64ddvCLblmv_iE4E",
  authDomain: "garden-c0b50.firebaseapp.com",
  projectId: "garden-c0b50",
  storageBucket: "garden-c0b50.firebasestorage.app",
  messagingSenderId: "467344354997",
  appId: "1:467344354997:web:3c3397e017606bb0c98fc",
  measurementId: "G-7LML93QDTF"
};

const backupConfig = {
  apiKey: "AIzaSyCPTELyhRUn4qByU68pOZsZUrkR1ZeyROo",
  authDomain: "garden-backup.firebaseapp.com",
  projectId: "garden-backup",
  storageBucket: "garden-backup.firebasestorage.app",
  messagingSenderId: "842077125369",
  appId: "1:842077125369:web:ea3bafe1cedb92cd350028",
  measurementId: "G-WJHEL52L9L"
};

const workflowConfig = {
  apiKey: "AIzaSyCPTELyhRUn4qByU68pOZsZUrkR1ZeyROo",
  authDomain: "workflowbr1.firebaseapp.com",
  projectId: "workflowbr1",
  storageBucket: "workflowbr1.firebasestorage.app",
  messagingSenderId: "842077125369",
  appId: "1:842077125369:web:ea3bafe1cedb92cd350028"
};

// Inicializar apps
const primaryApp = initializeApp(primaryConfig, 'primary');
const backupApp = initializeApp(backupConfig, 'backup');
const workflowApp = initializeApp(workflowConfig, 'workflow');

const primaryDb = getFirestore(primaryApp);
const backupDb = getFirestore(backupApp);
const workflowDb = getFirestore(workflowApp);

/**
 * 🔍 Buscar usuários admin duplicados
 */
async function buscarAdminsDuplicados(db, dbName) {
  console.log(`\n🔍 Verificando ${dbName}...`);
  
  try {
    const usuariosRef = collection(db, 'usuarios');
    
    // Buscar todos os usuários com login "admin"
    const q = query(usuariosRef, where('usuario', '==', 'admin'));
    const snapshot = await getDocs(q);
    
    const admins = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      admins.push({
        id: doc.id,
        usuario: data.usuario,
        nome: data.nome,
        nivel: data.nivel,
        nivelTexto: getNivelTexto(data.nivel),
        ativo: data.ativo,
        dataCriacao: data.dataCriacao
      });
    });
    
    console.log(`   Encontrados ${admins.length} usuário(s) com login "admin"`);
    
    if (admins.length > 0) {
      console.log('\n   📋 Detalhes:');
      admins.forEach((admin, index) => {
        console.log(`   ${index + 1}. ID: ${admin.id}`);
        console.log(`      Nome: ${admin.nome}`);
        console.log(`      Nível: ${admin.nivel} (${admin.nivelTexto})`);
        console.log(`      Ativo: ${admin.ativo ? 'Sim' : 'Não'}`);
        console.log(`      Criação: ${admin.dataCriacao}`);
        console.log('');
      });
    }
    
    return admins;
    
  } catch (error) {
    console.error(`   ❌ Erro ao buscar em ${dbName}:`, error.message);
    return [];
  }
}

/**
 * 🗑️ Remover admins duplicados (apenas os com nível funcionario)
 */
async function removerAdminsDuplicados(db, dbName, admins, modoTeste = true) {
  console.log(`\n🗑️ ${modoTeste ? '[TESTE]' : '[EXECUTANDO]'} Removendo duplicados em ${dbName}...`);
  
  // Filtrar apenas admins que são funcionários (nível 4)
  const adminsParaRemover = admins.filter(admin => {
    // Nível 4 = funcionario (incorreto)
    // Nível 0 = admin (correto - não remover)
    return admin.nivel === 4 || admin.nivel === 'funcionario';
  });
  
  // Verificar se há pelo menos um admin válido (nível 0)
  const adminsValidos = admins.filter(admin => admin.nivel === 0 || admin.nivel === 'admin');
  
  if (adminsValidos.length === 0 && adminsParaRemover.length > 0) {
    console.log('   ⚠️ AVISO: Não há nenhum admin com nível 0 (correto)!');
    console.log('   ⚠️ Mantendo pelo menos 1 usuário admin para não bloquear o sistema.');
    
    // Manter o mais antigo
    adminsParaRemover.sort((a, b) => {
      const dataA = new Date(a.dataCriacao);
      const dataB = new Date(b.dataCriacao);
      return dataA - dataB;
    });
    
    const manter = adminsParaRemover.shift();
    console.log(`   ℹ️ Mantendo: ${manter.nome} (ID: ${manter.id})`);
  }
  
  if (adminsParaRemover.length === 0) {
    console.log('   ✅ Nenhum admin duplicado com nível funcionario encontrado.');
    return { removidos: 0, mantidos: admins.length };
  }
  
  console.log(`   📋 ${adminsParaRemover.length} admin(s) duplicado(s) será(ão) removido(s):`);
  
  let removidos = 0;
  let erros = 0;
  
  for (const admin of adminsParaRemover) {
    try {
      console.log(`   ${modoTeste ? '🔍' : '🗑️'} ${admin.nome} (ID: ${admin.id}, Nível: ${admin.nivelTexto})`);
      
      if (!modoTeste) {
        await deleteDoc(doc(db, 'usuarios', admin.id));
        console.log('      ✅ Removido');
        removidos++;
      } else {
        console.log('      ℹ️ Seria removido (modo teste)');
      }
      
    } catch (error) {
      console.error(`      ❌ Erro ao remover:`, error.message);
      erros++;
    }
  }
  
  const mantidos = admins.length - removidos;
  
  console.log(`\n   📊 Resumo ${dbName}:`);
  console.log(`      Total encontrados: ${admins.length}`);
  console.log(`      Removidos: ${removidos}`);
  console.log(`      Mantidos: ${mantidos}`);
  console.log(`      Erros: ${erros}`);
  
  return { removidos, mantidos, erros };
}

/**
 * 📝 Converter nível numérico para texto
 */
function getNivelTexto(nivel) {
  const niveis = {
    0: 'admin',
    1: 'gerente_geral',
    2: 'gerente_setor',
    3: 'supervisor',
    4: 'funcionario'
  };
  return niveis[nivel] || nivel;
}

/**
 * 🚀 Executar limpeza
 */
async function executarLimpeza(modoTeste = true) {
  console.log('🧹 ========================================');
  console.log('   LIMPEZA DE ADMINS DUPLICADOS');
  console.log('========================================');
  console.log(`Modo: ${modoTeste ? '🔍 TESTE (sem remover)' : '🗑️ EXECUTAR (vai remover)'}`);
  console.log('========================================\n');
  
  const databases = [
    { db: primaryDb, name: 'Firebase Principal (garden-c0b50)' },
    { db: backupDb, name: 'Firebase Backup (garden-backup)' },
    { db: workflowDb, name: 'Workflow BR1 (workflowbr1)' }
  ];
  
  const resultadoGeral = {
    totalEncontrados: 0,
    totalRemovidos: 0,
    totalMantidos: 0,
    totalErros: 0
  };
  
  for (const { db, name } of databases) {
    const admins = await buscarAdminsDuplicados(db, name);
    resultadoGeral.totalEncontrados += admins.length;
    
    if (admins.length > 0) {
      const resultado = await removerAdminsDuplicados(db, name, admins, modoTeste);
      resultadoGeral.totalRemovidos += resultado.removidos;
      resultadoGeral.totalMantidos += resultado.mantidos;
      resultadoGeral.totalErros += resultado.erros || 0;
    }
  }
  
  console.log('\n========================================');
  console.log('📊 RESUMO GERAL');
  console.log('========================================');
  console.log(`Total de admins encontrados: ${resultadoGeral.totalEncontrados}`);
  console.log(`Removidos: ${resultadoGeral.totalRemovidos}`);
  console.log(`Mantidos: ${resultadoGeral.totalMantidos}`);
  console.log(`Erros: ${resultadoGeral.totalErros}`);
  console.log('========================================\n');
  
  if (modoTeste) {
    console.log('ℹ️ Este foi um teste. Nenhum usuário foi removido.');
    console.log('ℹ️ Para executar a remoção, execute: node limpar-admins-duplicados.js --executar\n');
  } else {
    console.log('✅ Limpeza concluída!\n');
  }
}

// Verificar argumentos da linha de comando
const args = process.argv.slice(2);
const modoTeste = !args.includes('--executar');

// Executar
executarLimpeza(modoTeste)
  .then(() => {
    console.log('✅ Script finalizado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  });
