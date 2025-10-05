// 🔍 FERRAMENTA DE DIAGNÓSTICO - Nível de Administrador
// Execute este script no console do navegador quando o problema ocorrer

console.log('🔍 DIAGNÓSTICO DE NÍVEL DE ADMINISTRADOR');
console.log('=====================================');

// Verificar dados nos cookies
const cookieUsuario = document.cookie
  .split('; ')
  .find(row => row.startsWith('workflow_usuario='));

if (cookieUsuario) {
  try {
    const userData = JSON.parse(decodeURIComponent(cookieUsuario.split('=')[1]));
    console.log('📄 Dados do Cookie:', userData);
    console.log('🎯 Nível no Cookie:', userData.nivel);
    console.log('🏷️ Tipo do Nível:', typeof userData.nivel);
  } catch (e) {
    console.log('❌ Erro ao ler cookie:', e);
  }
} else {
  console.log('❌ Cookie de usuário não encontrado');
}

// Verificar localStorage
const localUser = localStorage.getItem('workflow_usuario');
if (localUser) {
  try {
    const userData = JSON.parse(localUser);
    console.log('💾 Dados do LocalStorage:', userData);
    console.log('🎯 Nível no LocalStorage:', userData.nivel);
    console.log('🏷️ Tipo do Nível:', typeof userData.nivel);
  } catch (e) {
    console.log('❌ Erro ao ler localStorage:', e);
  }
} else {
  console.log('❌ LocalStorage de usuário não encontrado');
}

// Verificar contexto React (se disponível)
if (window.React && window.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED) {
  console.log('⚛️ React Context disponível para análise');
} else {
  console.log('⚛️ React Context não acessível');
}

// Verificar permissões aplicadas
console.log('=====================================');
console.log('🔐 VERIFICAÇÃO DE PERMISSÕES APLICADAS');
console.log('=====================================');

// Verificar se elemento "Acesso Negado" está presente
const acessoNegado = document.querySelector('[class*="Permission"]') || 
                     document.querySelector('div:contains("Acesso Negado")') ||
                     document.querySelector('div:contains("Você não tem permissão")');

if (acessoNegado) {
  console.log('❌ Elemento "Acesso Negado" encontrado:', acessoNegado);
  console.log('📄 Texto:', acessoNegado.textContent);
} else {
  console.log('✅ Nenhum elemento "Acesso Negado" encontrado');
}

// Verificar usuário atual na página
const userProfile = document.querySelector('[class*="profile"]') || 
                   document.querySelector('[class*="user"]') ||
                   document.querySelector('div:contains("Administrador")') ||
                   document.querySelector('div:contains("Funcionário")');

if (userProfile) {
  console.log('👤 Perfil de usuário encontrado:', userProfile.textContent);
}

console.log('=====================================');
console.log('✅ DIAGNÓSTICO CONCLUÍDO');
console.log('Cole este resultado no chat para análise');