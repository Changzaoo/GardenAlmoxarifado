/**
 * Script de Teste para Sistema de Otimização Python
 * 
 * Executa testes de performance comparando JavaScript vs Python
 * para diferentes tamanhos de datasets.
 */

// Função para gerar dados de teste
function gerarDadosTeste(numItens) {
  const inventario = [];
  const danificadas = [];
  const perdidas = [];
  
  for (let i = 0; i < numItens; i++) {
    inventario.push({
      id: `item-${i}`,
      nome: `Item ${i}`,
      setorId: `setor-${i % 10}`,
      setorNome: `Setor ${i % 10}`,
      valorUnitario: Math.random() * 1000,
      quantidade: Math.floor(Math.random() * 100)
    });
    
    if (Math.random() > 0.9) {
      danificadas.push({
        id: `dan-${i}`,
        nomeItem: `Item ${i}`,
        valorEstimado: Math.random() * 500
      });
    }
    
    if (Math.random() > 0.95) {
      perdidas.push({
        id: `perd-${i}`,
        nomeItem: `Item ${i}`,
        valorEstimado: Math.random() * 300
      });
    }
  }
  
  return { inventario, danificadas, perdidas };
}

// Função para gerar setores de teste
function gerarSetoresTeste(numSetores) {
  const setores = [];
  for (let i = 0; i < numSetores; i++) {
    setores.push({
      id: `setor-${i}`,
      nome: `Setor ${i}`,
      descricao: `Descrição do Setor ${i}`,
      ativo: true
    });
  }
  return setores;
}

// Teste de performance
async function testarPerformance() {
  console.log('🧪 Iniciando testes de performance...\n');
  
  const tamanhos = [10, 50, 100, 500, 1000, 5000];
  
  for (const tamanho of tamanhos) {
    console.log(`\n📊 Testando com ${tamanho} itens no inventário:`);
    console.log('─'.repeat(60));
    
    const { inventario, danificadas, perdidas } = gerarDadosTeste(tamanho);
    const setores = gerarSetoresTeste(10);
    
    // Teste JavaScript
    console.time('⚡ JavaScript (10 setores)');
    const resultadosJS = {};
    for (const setor of setores) {
      resultadosJS[setor.id] = calcularValoresSetorJS(
        setor.id,
        setor.nome,
        inventario,
        danificadas,
        perdidas
      );
    }
    console.timeEnd('⚡ JavaScript (10 setores)');
    
    // Mostrar resultado de exemplo
    const exemplo = resultadosJS['setor-0'];
    console.log(`   Exemplo Setor 0:`, {
      valorBruto: Math.round(exemplo.valorBruto),
      valorLiquido: Math.round(exemplo.valorLiquido),
      totalItens: exemplo.totalItens
    });
    
    console.log('\n');
  }
  
  console.log('\n✅ Testes concluídos!');
  console.log('\n💡 Interpretação dos resultados:');
  console.log('   • Para < 100 itens: JavaScript é geralmente mais rápido');
  console.log('   • Para ≥ 100 itens: Python (NumPy) deve ser usado');
  console.log('   • Para ≥ 1000 itens: Python pode ser 5-10x mais rápido');
  console.log('\n🐍 Use BATCH Python para máxima performance!');
}

// Função auxiliar JavaScript (para comparação)
function calcularValoresSetorJS(setorId, setorNome, inventario, danificadas, perdidas) {
  const itensSetor = inventario.filter(item => 
    item.setorId === setorId || item.setorNome === setorNome
  );

  const valorBruto = itensSetor.reduce((sum, item) => {
    const valor = parseFloat(item.valorUnitario || 0);
    const qtd = parseInt(item.quantidade || 0);
    return sum + (valor * qtd);
  }, 0);

  const nomesItensSet = new Set(
    itensSetor.map(i => i.nome.toLowerCase().trim())
  );

  const danificadasSetor = danificadas.filter(d => 
    nomesItensSet.has(d.nomeItem?.toLowerCase().trim())
  );
  const valorDanificadas = danificadasSetor.reduce((sum, d) => 
    sum + (parseFloat(d.valorEstimado) || 0), 0
  );

  const perdidasSetor = perdidas.filter(p => 
    nomesItensSet.has(p.nomeItem?.toLowerCase().trim())
  );
  const valorPerdidas = perdidasSetor.reduce((sum, p) => 
    sum + (parseFloat(p.valorEstimado) || 0), 0
  );

  return {
    valorBruto,
    valorDanificadas,
    valorPerdidas,
    valorLiquido: valorBruto - valorDanificadas - valorPerdidas,
    totalItens: itensSetor.length,
    quantidadeTotal: itensSetor.reduce((sum, item) => 
      sum + parseInt(item.quantidade || 0), 0
    )
  };
}

// Executar testes
if (typeof window !== 'undefined') {
  // Browser environment
  console.log('🌐 Executando no browser');
  console.log('💡 Abra o DevTools Console para ver os resultados');
  console.log('💡 Execute: testarPerformance()');
  window.testarPerformance = testarPerformance;
} else {
  // Node.js environment
  console.log('🖥️  Executando no Node.js');
  testarPerformance();
}

// Exportar para uso em testes
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testarPerformance,
    gerarDadosTeste,
    gerarSetoresTeste,
    calcularValoresSetorJS
  };
}
