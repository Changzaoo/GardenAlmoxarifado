/**
 * 🧪 Script de Teste - Sistema de Bloqueio de Usuários Admin
 * 
 * Execute este script para validar que o sistema está funcionando
 */

import { 
  validarLogin,
  validarNome,
  validarDadosUsuario,
  deveBloquearNaSincronizacao,
  logBloqueio,
  getEstatisticasBloqueios,
  limparLogsBloqueios
} from '../src/utils/validacaoUsuarios.js';

console.log('🧪 ========================================');
console.log('   TESTE DO SISTEMA DE BLOQUEIO');
console.log('========================================\n');

let testesPassaram = 0;
let testesFalharam = 0;

// Função auxiliar para testes
const testar = (nome, callback) => {
  try {
    const resultado = callback();
    if (resultado) {
      console.log(`✅ ${nome}`);
      testesPassaram++;
    } else {
      console.log(`❌ ${nome}`);
      testesFalharam++;
    }
  } catch (error) {
    console.log(`❌ ${nome} - ERRO: ${error.message}`);
    testesFalharam++;
  }
};

console.log('📋 TESTE 1: Validação de Login\n');

testar('Deve bloquear "admin"', () => {
  const resultado = validarLogin('admin');
  return !resultado.valido && resultado.erro.includes('bloqueado');
});

testar('Deve bloquear "ADMIN" (case-insensitive)', () => {
  const resultado = validarLogin('ADMIN');
  return !resultado.valido;
});

testar('Deve bloquear "admin123" (contém admin)', () => {
  const resultado = validarLogin('admin123');
  return !resultado.valido;
});

testar('Deve bloquear "administrator"', () => {
  const resultado = validarLogin('administrator');
  return !resultado.valido;
});

testar('Deve bloquear "root"', () => {
  const resultado = validarLogin('root');
  return !resultado.valido;
});

testar('Deve permitir "joao"', () => {
  const resultado = validarLogin('joao');
  return resultado.valido && !resultado.erro;
});

testar('Deve permitir "maria_silva"', () => {
  const resultado = validarLogin('maria_silva');
  return resultado.valido;
});

console.log('\n📋 TESTE 2: Validação de Nome\n');

testar('Deve bloquear "Administrador"', () => {
  const resultado = validarNome('Administrador');
  return !resultado.valido;
});

testar('Deve bloquear "Administrator"', () => {
  const resultado = validarNome('Administrator');
  return !resultado.valido;
});

testar('Deve permitir "João Silva"', () => {
  const resultado = validarNome('João Silva');
  return resultado.valido;
});

testar('Deve permitir "Maria Santos"', () => {
  const resultado = validarNome('Maria Santos');
  return resultado.valido;
});

console.log('\n📋 TESTE 3: Validação Completa\n');

testar('Deve bloquear usuário com login proibido', () => {
  const resultado = validarDadosUsuario({
    usuario: 'admin',
    nome: 'João Silva'
  });
  return !resultado.valido && resultado.erros.length > 0;
});

testar('Deve bloquear usuário com nome proibido', () => {
  const resultado = validarDadosUsuario({
    usuario: 'joao',
    nome: 'Administrador'
  });
  return !resultado.valido && resultado.erros.length > 0;
});

testar('Deve bloquear usuário com ambos proibidos', () => {
  const resultado = validarDadosUsuario({
    usuario: 'admin',
    nome: 'Administrador'
  });
  return !resultado.valido && resultado.erros.length >= 2;
});

testar('Deve permitir usuário válido', () => {
  const resultado = validarDadosUsuario({
    usuario: 'joao',
    nome: 'João Silva'
  });
  return resultado.valido && resultado.erros.length === 0;
});

console.log('\n📋 TESTE 4: Bloqueio na Sincronização\n');

testar('Deve bloquear na sincronização (login)', () => {
  const bloqueado = deveBloquearNaSincronizacao({
    usuario: 'admin',
    nome: 'João Silva',
    nivel: 0
  });
  return bloqueado === true;
});

testar('Deve bloquear na sincronização (nome)', () => {
  const bloqueado = deveBloquearNaSincronizacao({
    usuario: 'joao',
    nome: 'Administrador',
    nivel: 0
  });
  return bloqueado === true;
});

testar('Não deve bloquear usuário válido', () => {
  const bloqueado = deveBloquearNaSincronizacao({
    usuario: 'joao',
    nome: 'João Silva',
    nivel: 4
  });
  return bloqueado === false;
});

console.log('\n📋 TESTE 5: Sistema de Logs\n');

// Limpar logs primeiro
limparLogsBloqueios();

testar('Deve criar log de bloqueio', () => {
  const log = logBloqueio('teste', {
    usuario: 'admin',
    nome: 'Teste',
    nivel: 0
  });
  return log && log.contexto === 'teste';
});

testar('Deve recuperar estatísticas', () => {
  const stats = getEstatisticasBloqueios();
  return stats && stats.total === 1;
});

testar('Deve limpar logs', () => {
  const sucesso = limparLogsBloqueios();
  const stats = getEstatisticasBloqueios();
  return sucesso && stats.total === 0;
});

console.log('\n📋 TESTE 6: Casos Extremos\n');

testar('Deve rejeitar login vazio', () => {
  const resultado = validarLogin('');
  return !resultado.valido;
});

testar('Deve rejeitar login com espaços', () => {
  const resultado = validarLogin('   ');
  return !resultado.valido;
});

testar('Deve rejeitar login muito curto', () => {
  const resultado = validarLogin('ab');
  return !resultado.valido;
});

testar('Deve rejeitar caracteres especiais', () => {
  const resultado = validarLogin('user@#$');
  return !resultado.valido;
});

testar('Deve permitir underscore e hífen', () => {
  const resultado = validarLogin('user_name-123');
  return resultado.valido;
});

console.log('\n========================================');
console.log('📊 RESULTADOS DOS TESTES');
console.log('========================================');
console.log(`✅ Testes passaram: ${testesPassaram}`);
console.log(`❌ Testes falharam: ${testesFalharam}`);
console.log(`📈 Taxa de sucesso: ${((testesPassaram / (testesPassaram + testesFalharam)) * 100).toFixed(1)}%`);
console.log('========================================\n');

if (testesFalharam === 0) {
  console.log('🎉 TODOS OS TESTES PASSARAM! Sistema funcionando perfeitamente.\n');
  process.exit(0);
} else {
  console.log('⚠️ ALGUNS TESTES FALHARAM. Verifique os erros acima.\n');
  process.exit(1);
}
