/**
 * 🧪 SCRIPT DE TESTE PARA DEBUG DE PONTOS
 * 
 * Cole este script no console do navegador (F12) para testar
 * a validação de horários ANTES de tentar salvar no sistema real.
 */

console.log('🧪 Iniciando testes de validação de horários...\n');

// Função de limpeza (igual ao código)
function limparHorario(hora) {
  return hora && hora.trim() !== '' && hora !== '--:--' ? hora : '';
}

// Função de validação (igual ao código)
function validarHorario(hora, tipo) {
  console.log(`\n🔍 Validando ${tipo}: "${hora}"`);
  
  // Pular se vazio
  if (!hora || hora.trim() === '' || hora === '--:--') {
    console.log(`⏭️ Pulando ${tipo} - sem horário definido`);
    return false;
  }
  
  // Validar formato
  const horaMatch = hora.match(/^(\d{2}):(\d{2})$/);
  if (!horaMatch) {
    console.error(`❌ Formato inválido: ${hora}. Use HH:MM`);
    return false;
  }
  
  const [h, m] = hora.split(':').map(Number);
  
  // Validar NaN
  if (isNaN(h) || isNaN(m)) {
    console.error(`❌ Valores inválidos: hora=${h}, minuto=${m}`);
    return false;
  }
  
  // Validar ranges
  if (h < 0 || h > 23) {
    console.error(`❌ Hora inválida: ${h}. Deve estar entre 0 e 23`);
    return false;
  }
  
  if (m < 0 || m > 59) {
    console.error(`❌ Minuto inválido: ${m}. Deve estar entre 0 e 59`);
    return false;
  }
  
  // Testar criação de Date
  const data = new Date(2025, 9, 9, h, m, 0, 0);
  if (isNaN(data.getTime())) {
    console.error(`❌ Data inválida criada: ${data}`);
    return false;
  }
  
  console.log(`✅ ${tipo} válido: ${hora} → Data: ${data.toISOString()}`);
  return true;
}

// CASOS DE TESTE
console.log('\n' + '='.repeat(60));
console.log('📋 CASOS DE TESTE');
console.log('='.repeat(60));

const casosDeTeste = [
  { entrada: '', saidaAlmoco: '', voltaAlmoco: '', saida: '', descricao: 'Todos vazios' },
  { entrada: '--:--', saidaAlmoco: '--:--', voltaAlmoco: '--:--', saida: '--:--', descricao: 'Todos --:--' },
  { entrada: '07:20', saidaAlmoco: '11:28', voltaAlmoco: '12:13', saida: '', descricao: 'Parcial (3 pontos)' },
  { entrada: '07:20', saidaAlmoco: '11:28', voltaAlmoco: '12:13', saida: '17:30', descricao: 'Completo (4 pontos)' },
  { entrada: '25:00', saidaAlmoco: '', voltaAlmoco: '', saida: '', descricao: 'Hora inválida (25)' },
  { entrada: '12:70', saidaAlmoco: '', voltaAlmoco: '', saida: '', descricao: 'Minuto inválido (70)' },
  { entrada: 'AB:CD', saidaAlmoco: '', voltaAlmoco: '', saida: '', descricao: 'Formato inválido' },
  { entrada: '12:3', saidaAlmoco: '', voltaAlmoco: '', saida: '', descricao: 'Formato curto' },
];

casosDeTeste.forEach((caso, index) => {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`📝 TESTE ${index + 1}: ${caso.descricao}`);
  console.log(`${'─'.repeat(60)}`);
  console.log('Valores originais:', caso);
  
  // Limpar valores
  const limpos = {
    entrada: limparHorario(caso.entrada),
    saidaAlmoco: limparHorario(caso.saidaAlmoco),
    voltaAlmoco: limparHorario(caso.voltaAlmoco),
    saida: limparHorario(caso.saida)
  };
  
  console.log('Valores limpos:', limpos);
  
  // Validar cada campo
  const resultados = {
    entrada: validarHorario(limpos.entrada, 'Entrada'),
    saidaAlmoco: validarHorario(limpos.saidaAlmoco, 'Saída Almoço'),
    voltaAlmoco: validarHorario(limpos.voltaAlmoco, 'Volta Almoço'),
    saida: validarHorario(limpos.saida, 'Saída')
  };
  
  const validos = Object.values(resultados).filter(v => v === true).length;
  const pulados = Object.values(resultados).filter(v => v === false).length;
  
  if (validos === 0) {
    console.log(`\n⚠️ RESULTADO: Nenhum ponto válido - ${pulados} pulados`);
  } else {
    console.log(`\n✅ RESULTADO: ${validos} pontos válidos, ${pulados} pulados`);
  }
});

console.log('\n' + '='.repeat(60));
console.log('✅ TESTES CONCLUÍDOS');
console.log('='.repeat(60));

// Função auxiliar para testar valores do seu modal
console.log('\n💡 COMO TESTAR SEUS VALORES:');
console.log('Digite no console:');
console.log('  validarHorario("11:28", "Teste")');
console.log('  validarHorario("--:--", "Teste")');
console.log('  validarHorario("", "Teste")');

// Expor funções globalmente para teste
window.testarHorario = validarHorario;
window.limparHorario = limparHorario;

console.log('\n🎯 Funções disponíveis:');
console.log('  - window.testarHorario(hora, tipo)');
console.log('  - window.limparHorario(hora)');
console.log('\nExemplo: testarHorario("11:28", "Meu Teste")');
