/**
 * 🧪 TESTE RÁPIDO DO STATEMANAGER
 * 
 * Execute no console do navegador para testar:
 */

// 1. Importar o StateManager
import { getStateManager } from './services/stateManager';

// 2. Obter instância
const manager = getStateManager();

// 3. Testar salvamento
async function testSave() {
  console.log('🧪 Testando salvamento...');
  
  const testState = {
    version: '2.0',
    timestamp: Date.now(),
    url: window.location.href,
    forms: {
      testForm: {
        name: 'João',
        email: 'joao@email.com'
      }
    },
    checkboxes: {
      terms: true
    }
  };
  
  try {
    await manager.saveToIndexedDB({
      state: JSON.stringify(testState),
      compressed: false,
      timestamp: Date.now()
    });
    
    console.log('✅ Salvamento bem-sucedido!');
    return true;
  } catch (error) {
    console.error('❌ Erro no salvamento:', error);
    return false;
  }
}

// 4. Testar leitura
async function testLoad() {
  console.log('🧪 Testando leitura...');
  
  try {
    const state = await manager.loadFromIndexedDB();
    
    if (state) {
      console.log('✅ Leitura bem-sucedida!');
      console.log('Estado carregado:', state);
      return true;
    } else {
      console.log('ℹ️ Nenhum estado encontrado');
      return false;
    }
  } catch (error) {
    console.error('❌ Erro na leitura:', error);
    return false;
  }
}

// 5. Executar testes
async function runTests() {
  console.log('🚀 Iniciando testes do StateManager...');
  console.log('');
  
  // Teste 1: Salvar
  const saveOk = await testSave();
  console.log('');
  
  // Teste 2: Carregar
  const loadOk = await testLoad();
  console.log('');
  
  // Resultado
  console.log('📊 RESULTADO DOS TESTES:');
  console.log(`  Salvamento: ${saveOk ? '✅ OK' : '❌ FALHOU'}`);
  console.log(`  Leitura: ${loadOk ? '✅ OK' : '❌ FALHOU'}`);
  console.log('');
  
  if (saveOk && loadOk) {
    console.log('🎉 Todos os testes passaram!');
  } else {
    console.log('⚠️ Alguns testes falharam - verifique os erros acima');
  }
}

// Executar
runTests();

/**
 * TESTE MANUAL NO CONSOLE:
 * 
 * 1. Abra o DevTools (F12)
 * 2. Vá para a aba Console
 * 3. Cole e execute:
 * 
 *    const manager = window.getStateManager?.();
 *    if (manager) {
 *      manager.saveToIndexedDB({
 *        state: '{"test": true}',
 *        compressed: false,
 *        timestamp: Date.now()
 *      }).then(() => {
 *        console.log('✅ Save OK');
 *        return manager.loadFromIndexedDB();
 *      }).then(state => {
 *        console.log('✅ Load OK:', state);
 *      }).catch(err => {
 *        console.error('❌ Erro:', err);
 *      });
 *    }
 * 
 * 4. Verifique no Application → IndexedDB → AppStateDB
 */
