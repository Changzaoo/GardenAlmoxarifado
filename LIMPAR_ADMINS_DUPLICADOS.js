// 🧹 Script para Limpar Admins Duplicados
// Execute no console do navegador (F12) na página do sistema

(async function limparAdminsDuplicados() {
  console.log('%c🧹 LIMPEZA DE ADMINS DUPLICADOS', 'color: #ff6600; font-size: 20px; font-weight: bold;');
  console.log('%c⚠️ Este script vai deletar admins duplicados, mantendo apenas o mais antigo', 'color: #ff0000; font-size: 14px;');
  console.log('');
  
  try {
    // Verificar se Firebase está disponível
    if (typeof window.firebase === 'undefined') {
      console.error('❌ Firebase não encontrado. Certifique-se de estar na página do sistema.');
      return;
    }
    
    // Importar módulos necessários
    const { collection, query, where, getDocs, deleteDoc, doc } = window.firebase.firestore;
    const { db, backupDb } = window.firebase;
    
    // Função para limpar em um banco específico
    async function limparBanco(database, nomeBanco) {
      console.log(`\n📊 Verificando banco: ${nomeBanco}`);
      console.log('─'.repeat(50));
      
      const usuariosRef = collection(database, 'usuarios');
      const adminQuery = query(
        usuariosRef,
        where('usuario', '==', 'admin')
      );
      
      const snapshot = await getDocs(adminQuery);
      console.log(`📌 Encontrados ${snapshot.size} usuário(s) admin`);
      
      if (snapshot.size === 0) {
        console.log('⚠️ Nenhum admin encontrado');
        return { total: 0, deletados: 0 };
      }
      
      if (snapshot.size === 1) {
        console.log('✅ Apenas 1 admin encontrado, nada a fazer');
        const admin = snapshot.docs[0];
        console.log(`   ID: ${admin.id}`);
        console.log(`   Nome: ${admin.data().nome}`);
        console.log(`   Criado: ${admin.data().dataCriacao || admin.data().criadoEm || 'N/A'}`);
        return { total: 1, deletados: 0 };
      }
      
      // Coletar todos os admins
      const admins = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        admins.push({
          id: docSnap.id,
          ref: docSnap.ref,
          nome: data.nome,
          criadoEm: data.dataCriacao || data.criadoEm || new Date(0).toISOString(),
          email: data.email || 'admin'
        });
      });
      
      // Ordenar por data de criação (mais antigo primeiro)
      admins.sort((a, b) => {
        const dateA = new Date(a.criadoEm);
        const dateB = new Date(b.criadoEm);
        return dateA - dateB;
      });
      
      console.log(`\n🛡️ Admin a ser mantido (mais antigo):`);
      console.log(`   ID: ${admins[0].id}`);
      console.log(`   Nome: ${admins[0].nome}`);
      console.log(`   Criado em: ${admins[0].criadoEm}`);
      
      console.log(`\n🗑️ Admins a serem deletados (${admins.length - 1}):`);
      
      // Deletar duplicados (do 2º em diante)
      let deletados = 0;
      for (let i = 1; i < admins.length; i++) {
        console.log(`   ${i}. ID: ${admins[i].id}, Criado: ${admins[i].criadoEm}`);
        try {
          await deleteDoc(doc(database, 'usuarios', admins[i].id));
          console.log(`      ✅ Deletado`);
          deletados++;
        } catch (error) {
          console.log(`      ❌ Erro ao deletar: ${error.message}`);
        }
      }
      
      return { total: admins.length, deletados };
    }
    
    // Limpar banco principal
    const resultadoPrimary = await limparBanco(db, 'Firebase Principal');
    
    // Limpar banco backup
    const resultadoBackup = await limparBanco(backupDb, 'Firebase Backup');
    
    // Resumo final
    console.log('\n' + '═'.repeat(50));
    console.log('%c✅ LIMPEZA CONCLUÍDA', 'color: #00ff00; font-size: 18px; font-weight: bold;');
    console.log('═'.repeat(50));
    console.log(`\n📊 Firebase Principal:`);
    console.log(`   Total de admins: ${resultadoPrimary.total}`);
    console.log(`   Admins deletados: ${resultadoPrimary.deletados}`);
    console.log(`\n📊 Firebase Backup:`);
    console.log(`   Total de admins: ${resultadoBackup.total}`);
    console.log(`   Admins deletados: ${resultadoBackup.deletados}`);
    console.log(`\n🎉 Total geral deletado: ${resultadoPrimary.deletados + resultadoBackup.deletados}`);
    
    if ((resultadoPrimary.deletados + resultadoBackup.deletados) > 0) {
      console.log('\n%c🔄 Recomendado: Recarregue a página para atualizar os dados', 'color: #ffaa00; font-size: 14px;');
    }
    
  } catch (error) {
    console.error('\n❌ ERRO DURANTE A LIMPEZA:', error);
    console.error('Stack trace:', error.stack);
  }
})();
