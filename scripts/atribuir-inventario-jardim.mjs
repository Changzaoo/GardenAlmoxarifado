/**
 * 🌿 Script para Atribuir Inventário ao Setor Jardim da Empresa Zendaya
 * 
 * Este script:
 * 1. Verifica se a empresa Zendaya existe
 * 2. Verifica/cria o setor Jardim
 * 3. Atualiza todos os itens do inventário com setorId do Jardim
 * 4. Atualiza ferramentas danificadas e perdidas
 * 
 * Uso: node scripts/atribuir-inventario-jardim.mjs
 */

import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  query, 
  where, 
  doc, 
  updateDoc, 
  addDoc 
} from 'firebase/firestore';

// Configuração Firebase (usa os valores criptografados do sistema)
const encryptedConfig = {
  "_k": "WlpoYVN5QW5MbXRsaE9VVUFidFJjT2c2NGRYZENMYmx0dl9pRTRF", // apiKey
  "_d": "Z2FyZGVuLWMwYjUwLmZpcmViYXNlYXBwLmNvbQ==", // authDomain
  "_p": "Z2FyZGVuLWMwYjUw", // projectId
  "_s": "Z2FyZGVuLWMwYjUwLmZpcmViYXNlc3RvcmFnZS5hcHA=", // storageBucket
  "_m": "NDY3MzQ0MzU0OTk3", // messagingSenderId
  "_a": "MTo0NjczNDQzNTQ5OTc6d2ViOjNjMzM5N2UwMTc2MDYwYmIwYzk4ZmM=" // appId
};

// Função simples de descriptografia (base64)
const decrypt = (encoded) => {
  return Buffer.from(encoded, 'base64').toString('utf-8');
};

// Configuração Firebase
const firebaseConfig = {
  apiKey: decrypt(encryptedConfig._k),
  authDomain: decrypt(encryptedConfig._d),
  projectId: decrypt(encryptedConfig._p),
  storageBucket: decrypt(encryptedConfig._s),
  messagingSenderId: decrypt(encryptedConfig._m),
  appId: decrypt(encryptedConfig._a)
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log('🔥 Firebase inicializado com sucesso!');
console.log('📦 Projeto:', firebaseConfig.projectId);
console.log('');

/**
 * Função principal para atribuir inventário ao Jardim
 */
async function atribuirInventarioJardim() {
  try {
    console.log('='.repeat(60));
    console.log('🌿 ATRIBUINDO INVENTÁRIO AO SETOR JARDIM');
    console.log('='.repeat(60));
    console.log('');

    // ========================================
    // 1. BUSCAR EMPRESA ZENDAYA
    // ========================================
    console.log('🔍 [1/6] Buscando empresa Zendaya...');
    
    const empresasSnap = await getDocs(
      query(collection(db, 'empresas'), where('nome', '==', 'Zendaya'))
    );
    
    if (empresasSnap.empty) {
      console.error('❌ ERRO: Empresa Zendaya não encontrada!');
      console.log('💡 Dica: Certifique-se de que existe uma empresa chamada "Zendaya" no Firestore.');
      return;
    }
    
    const empresaZendaya = empresasSnap.docs[0];
    const empresaId = empresaZendaya.id;
    const empresaData = empresaZendaya.data();
    const empresaNome = empresaData.nome;
    
    console.log(`✅ Empresa encontrada!`);
    console.log(`   ID: ${empresaId}`);
    console.log(`   Nome: ${empresaNome}`);
    console.log('');

    // ========================================
    // 2. BUSCAR/CRIAR SETOR JARDIM
    // ========================================
    console.log('🔍 [2/6] Buscando setor Jardim...');
    
    const setoresSnap = await getDocs(
      query(
        collection(db, 'setores'),
        where('nome', '==', 'Jardim'),
        where('empresaId', '==', empresaId)
      )
    );
    
    let setorId;
    let setorNome = 'Jardim';
    
    if (setoresSnap.empty) {
      // Criar setor Jardim
      console.log('⚠️  Setor Jardim não existe. Criando...');
      
      const novoSetor = {
        nome: 'Jardim',
        empresaId: empresaId,
        empresaNome: empresaNome,
        ativo: true,
        criadoEm: new Date().toISOString(),
        atualizadoEm: new Date().toISOString()
      };
      
      const setorRef = await addDoc(collection(db, 'setores'), novoSetor);
      setorId = setorRef.id;
      
      console.log(`✅ Setor Jardim criado com sucesso!`);
      console.log(`   ID: ${setorId}`);
    } else {
      setorId = setoresSnap.docs[0].id;
      const setorData = setoresSnap.docs[0].data();
      
      console.log(`✅ Setor Jardim já existe!`);
      console.log(`   ID: ${setorId}`);
      console.log(`   Nome: ${setorData.nome}`);
    }
    console.log('');

    // ========================================
    // 3. ATUALIZAR INVENTÁRIO
    // ========================================
    console.log('📦 [3/6] Atualizando inventário...');
    
    const inventarioSnap = await getDocs(collection(db, 'inventario'));
    const totalInventario = inventarioSnap.size;
    
    console.log(`   Total de itens encontrados: ${totalInventario}`);
    
    if (totalInventario === 0) {
      console.log('⚠️  Nenhum item no inventário para atualizar.');
    } else {
      let atualizados = 0;
      let erros = 0;
      
      for (const docSnap of inventarioSnap.docs) {
        try {
          const itemData = docSnap.data();
          
          await updateDoc(doc(db, 'inventario', docSnap.id), {
            setorId: setorId,
            setorNome: setorNome,
            empresaId: empresaId,
            empresaNome: empresaNome,
            atualizadoEm: new Date().toISOString()
          });
          
          atualizados++;
          
          // Mostrar progresso a cada 5 itens
          if (atualizados % 5 === 0 || atualizados === totalInventario) {
            process.stdout.write(`\r   Progresso: ${atualizados}/${totalInventario} itens atualizados`);
          }
        } catch (error) {
          erros++;
          console.error(`\n   ❌ Erro ao atualizar item ${docSnap.id}:`, error.message);
        }
      }
      
      console.log(''); // Nova linha após progresso
      console.log(`✅ Inventário atualizado: ${atualizados}/${totalInventario} itens`);
      if (erros > 0) {
        console.log(`⚠️  Erros encontrados: ${erros}`);
      }
    }
    console.log('');

    // ========================================
    // 4. ATUALIZAR FERRAMENTAS DANIFICADAS
    // ========================================
    console.log('🔧 [4/6] Atualizando ferramentas danificadas...');
    
    const danificadasSnap = await getDocs(collection(db, 'ferramentas_danificadas'));
    const totalDanificadas = danificadasSnap.size;
    
    console.log(`   Total de itens encontrados: ${totalDanificadas}`);
    
    if (totalDanificadas === 0) {
      console.log('   Nenhum item danificado para atualizar.');
    } else {
      let danificadasAtualizadas = 0;
      
      for (const docSnap of danificadasSnap.docs) {
        try {
          await updateDoc(doc(db, 'ferramentas_danificadas', docSnap.id), {
            setorId: setorId,
            setorNome: setorNome,
            empresaId: empresaId,
            empresaNome: empresaNome,
            atualizadoEm: new Date().toISOString()
          });
          
          danificadasAtualizadas++;
        } catch (error) {
          console.error(`   ❌ Erro ao atualizar ${docSnap.id}:`, error.message);
        }
      }
      
      console.log(`✅ Danificadas atualizadas: ${danificadasAtualizadas}/${totalDanificadas} itens`);
    }
    console.log('');

    // ========================================
    // 5. ATUALIZAR FERRAMENTAS PERDIDAS
    // ========================================
    console.log('❌ [5/6] Atualizando ferramentas perdidas...');
    
    const perdidasSnap = await getDocs(collection(db, 'ferramentas_perdidas'));
    const totalPerdidas = perdidasSnap.size;
    
    console.log(`   Total de itens encontrados: ${totalPerdidas}`);
    
    if (totalPerdidas === 0) {
      console.log('   Nenhum item perdido para atualizar.');
    } else {
      let perdidasAtualizadas = 0;
      
      for (const docSnap of perdidasSnap.docs) {
        try {
          await updateDoc(doc(db, 'ferramentas_perdidas', docSnap.id), {
            setorId: setorId,
            setorNome: setorNome,
            empresaId: empresaId,
            empresaNome: empresaNome,
            atualizadoEm: new Date().toISOString()
          });
          
          perdidasAtualizadas++;
        } catch (error) {
          console.error(`   ❌ Erro ao atualizar ${docSnap.id}:`, error.message);
        }
      }
      
      console.log(`✅ Perdidas atualizadas: ${perdidasAtualizadas}/${totalPerdidas} itens`);
    }
    console.log('');

    // ========================================
    // 6. ATUALIZAR COMPRAS (OPCIONAL)
    // ========================================
    console.log('🛒 [6/6] Atualizando compras...');
    
    const comprasSnap = await getDocs(collection(db, 'compras'));
    const totalCompras = comprasSnap.size;
    
    console.log(`   Total de compras encontradas: ${totalCompras}`);
    
    if (totalCompras === 0) {
      console.log('   Nenhuma compra para atualizar.');
    } else {
      let comprasAtualizadas = 0;
      
      for (const docSnap of comprasSnap.docs) {
        try {
          await updateDoc(doc(db, 'compras', docSnap.id), {
            setorId: setorId,
            setorNome: setorNome,
            empresaId: empresaId,
            empresaNome: empresaNome,
            atualizadoEm: new Date().toISOString()
          });
          
          comprasAtualizadas++;
        } catch (error) {
          console.error(`   ❌ Erro ao atualizar ${docSnap.id}:`, error.message);
        }
      }
      
      console.log(`✅ Compras atualizadas: ${comprasAtualizadas}/${totalCompras} itens`);
    }
    console.log('');

    // ========================================
    // RESUMO FINAL
    // ========================================
    console.log('='.repeat(60));
    console.log('📊 RESUMO DA ATUALIZAÇÃO');
    console.log('='.repeat(60));
    console.log('');
    console.log('🏢 Empresa:');
    console.log(`   Nome: ${empresaNome}`);
    console.log(`   ID: ${empresaId}`);
    console.log('');
    console.log('🌿 Setor:');
    console.log(`   Nome: ${setorNome}`);
    console.log(`   ID: ${setorId}`);
    console.log('');
    console.log('📦 Itens Atualizados:');
    console.log(`   Inventário: ${totalInventario} itens`);
    console.log(`   Danificadas: ${totalDanificadas} itens`);
    console.log(`   Perdidas: ${totalPerdidas} itens`);
    console.log(`   Compras: ${totalCompras} itens`);
    console.log('');
    console.log('='.repeat(60));
    console.log('');
    console.log('✅ ATUALIZAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('');
    console.log('📝 Próximos passos:');
    console.log('   1. Faça login no sistema com diferentes usuários');
    console.log('   2. Teste as permissões por setor');
    console.log('   3. Verifique as estatísticas do Jardim');
    console.log('');
    
  } catch (error) {
    console.error('');
    console.error('='.repeat(60));
    console.error('❌ ERRO FATAL');
    console.error('='.repeat(60));
    console.error('');
    console.error('Mensagem:', error.message);
    console.error('Stack:', error.stack);
    console.error('');
    process.exit(1);
  }
}

// Executar script
console.log('');
console.log('🚀 Iniciando script de atualização...');
console.log('');

atribuirInventarioJardim()
  .then(() => {
    console.log('🎉 Script concluído!');
    console.log('');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Falha na execução:', error);
    process.exit(1);
  });
