// 🧪 Script de Teste - Sistema de Gerenciamento de Admin
// Execute este código no Console do navegador (F12) na tela de login

console.log('%c🧪 TESTE DO SISTEMA DE GERENCIAMENTO DE ADMIN', 'background: #1d9bf0; color: white; padding: 10px; font-size: 16px; font-weight: bold;');
console.log('');

// Importar dependências do Firebase
const testFirebaseConnection = async () => {
  console.log('📡 Testando conexão com Firebase...');
  
  try {
    const { dbWorkflowBR1 } = await import('./src/config/firebaseWorkflowBR1.js');
    const { collection, getDocs, query, where } = await import('firebase/firestore');
    
    console.log('✅ Módulos importados com sucesso');
    
    // Teste 1: Listar todos os usuários
    console.log('\n📋 Teste 1: Listar todos os usuários');
    const usuariosRef = collection(dbWorkflowBR1, 'usuarios');
    const usuariosSnapshot = await getDocs(usuariosRef);
    
    if (usuariosSnapshot.empty) {
      console.log('⚠️ Nenhum usuário encontrado no banco');
      console.log('💡 Dica: Use o botão "Criar Novo Admin" na tela de login');
    } else {
      console.log(`✅ ${usuariosSnapshot.size} usuário(s) encontrado(s):`);
      usuariosSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`\n  📄 ID: ${doc.id}`);
        console.log(`  👤 Nome: ${data.nome}`);
        console.log(`  📧 Email: ${data.email}`);
        console.log(`  🔢 Nível: ${data.nivel} ${data.nivel === 0 ? '(Admin)' : ''}`);
        console.log(`  ✅ Ativo: ${data.ativo}`);
        console.log(`  📅 Criado: ${data.criadoEm || 'N/A'}`);
      });
    }
    
    // Teste 2: Verificar admin específico
    console.log('\n🛡️ Teste 2: Verificar admin (nível 0)');
    const adminQuery = query(
      usuariosRef, 
      where('nivel', '==', 0), 
      where('ativo', '==', true)
    );
    const adminSnapshot = await getDocs(adminQuery);
    
    if (adminSnapshot.empty) {
      console.log('⚠️ Nenhum admin encontrado');
      console.log('💡 Botão deve mostrar: "🔧 Criar Novo Admin"');
    } else {
      console.log(`✅ Admin encontrado:`);
      const adminDoc = adminSnapshot.docs[0];
      const adminData = adminDoc.data();
      console.log(`  📄 ID: ${adminDoc.id}`);
      console.log(`  👤 Nome: ${adminData.nome}`);
      console.log(`  📧 Login: ${adminData.email}`);
      console.log(`  🔐 Algoritmo: ${adminData.algorithm || 'SHA-512'}`);
      console.log('💡 Botão deve mostrar: "🔐 Gerenciar Admin Existente"');
    }
    
    // Teste 3: Verificar histórico de senhas
    console.log('\n📚 Teste 3: Verificar histórico de senhas');
    const historicoRef = collection(dbWorkflowBR1, 'historicoSenhas');
    const historicoSnapshot = await getDocs(historicoRef);
    
    if (historicoSnapshot.empty) {
      console.log('ℹ️ Nenhum histórico de alteração de senha');
      console.log('💡 Histórico é criado quando você altera a senha do admin');
    } else {
      console.log(`✅ ${historicoSnapshot.size} registro(s) de alteração:`);
      historicoSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`\n  📄 ID: ${doc.id}`);
        console.log(`  👤 Usuário: ${data.nome} (${data.email})`);
        console.log(`  📅 Alterado em: ${data.alteradoEm}`);
        console.log(`  👨‍💼 Por: ${data.alteradoPor}`);
      });
    }
    
    console.log('\n✅ Todos os testes concluídos!');
    console.log('');
    console.log('%c📖 PRÓXIMOS PASSOS:', 'background: #10b981; color: white; padding: 5px; font-weight: bold;');
    console.log('1️⃣ Olhe para a tela de login e verifique o botão vermelho');
    console.log('2️⃣ Se não há admin: clique em "Criar Novo Admin"');
    console.log('3️⃣ Se há admin: clique em "Gerenciar Admin Existente"');
    console.log('4️⃣ Teste a alteração de senha');
    console.log('5️⃣ Execute este script novamente para ver o histórico');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
    console.log('\n🔍 Possíveis causas:');
    console.log('• Módulos não importados corretamente');
    console.log('• Firebase não configurado');
    console.log('• Problema de permissões no Firestore');
  }
};

// Executar teste automaticamente
testFirebaseConnection();

// Exportar funções auxiliares
window.testarAdmin = testFirebaseConnection;

console.log('\n💡 Dica: Execute window.testarAdmin() para rodar o teste novamente');
