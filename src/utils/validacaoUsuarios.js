/**
 * 🛡️ Sistema de Validação de Usuários
 * 
 * Impede a criação de usuários com login "admin" ou variações
 * em todos os pontos do sistema: criação manual, sincronização e rotação
 */

// Lista de logins proibidos (bloqueados permanentemente)
const LOGINS_PROIBIDOS = [
  'admin',
  'administrator',
  'administrador',
  'root',
  'superuser',
  'super',
  'system',
  'sistema'
];

// Lista de nomes proibidos (bloqueados permanentemente)
const NOMES_PROIBIDOS = [
  'administrador',
  'administrator',
  'admin',
  'root',
  'system',
  'sistema'
];

/**
 * 🔍 Validar login de usuário
 * @param {string} login - Login a ser validado
 * @returns {Object} { valido: boolean, erro: string }
 */
export const validarLogin = (login) => {
  if (!login) {
    return {
      valido: false,
      erro: 'Login é obrigatório'
    };
  }

  const loginNormalizado = login.trim().toLowerCase();

  // Verificar se está na lista de proibidos
  if (LOGINS_PROIBIDOS.includes(loginNormalizado)) {
    return {
      valido: false,
      erro: `❌ Login "${login}" está bloqueado por segurança. Use um nome de usuário diferente.`
    };
  }

  // Verificar variações com números/caracteres
  const loginSemNumeros = loginNormalizado.replace(/[0-9]/g, '');
  if (LOGINS_PROIBIDOS.includes(loginSemNumeros)) {
    return {
      valido: false,
      erro: `❌ Login "${login}" contém termo bloqueado. Use um nome de usuário diferente.`
    };
  }

  // Verificar se contém "admin" em qualquer parte
  if (loginNormalizado.includes('admin')) {
    return {
      valido: false,
      erro: `❌ Login não pode conter "admin". Use um nome de usuário diferente.`
    };
  }

  // Validar formato básico
  if (loginNormalizado.length < 3) {
    return {
      valido: false,
      erro: 'Login deve ter pelo menos 3 caracteres'
    };
  }

  // Validar caracteres permitidos (letras, números, underscore, hífen)
  const regexValido = /^[a-z0-9_-]+$/;
  if (!regexValido.test(loginNormalizado)) {
    return {
      valido: false,
      erro: 'Login deve conter apenas letras, números, _ ou -'
    };
  }

  return {
    valido: true,
    erro: null
  };
};

/**
 * 🔍 Validar nome de usuário
 * @param {string} nome - Nome a ser validado
 * @returns {Object} { valido: boolean, erro: string }
 */
export const validarNome = (nome) => {
  if (!nome) {
    return {
      valido: false,
      erro: 'Nome é obrigatório'
    };
  }

  const nomeNormalizado = nome.trim().toLowerCase();

  // Verificar se está na lista de proibidos
  if (NOMES_PROIBIDOS.includes(nomeNormalizado)) {
    return {
      valido: false,
      erro: `❌ Nome "${nome}" está bloqueado por segurança. Use um nome diferente.`
    };
  }

  // Verificar se contém "admin" como palavra completa
  const palavras = nomeNormalizado.split(/\s+/);
  if (palavras.some(palavra => NOMES_PROIBIDOS.includes(palavra))) {
    return {
      valido: false,
      erro: `❌ Nome não pode conter termos bloqueados. Use um nome diferente.`
    };
  }

  return {
    valido: true,
    erro: null
  };
};

/**
 * 🔍 Validar dados completos do usuário
 * @param {Object} dadosUsuario - Dados do usuário
 * @returns {Object} { valido: boolean, erros: string[] }
 */
export const validarDadosUsuario = (dadosUsuario) => {
  const erros = [];

  // Validar login
  const validacaoLogin = validarLogin(dadosUsuario.usuario);
  if (!validacaoLogin.valido) {
    erros.push(validacaoLogin.erro);
  }

  // Validar nome
  const validacaoNome = validarNome(dadosUsuario.nome);
  if (!validacaoNome.valido) {
    erros.push(validacaoNome.erro);
  }

  return {
    valido: erros.length === 0,
    erros
  };
};

/**
 * 🚫 Verificar se usuário deve ser bloqueado na sincronização
 * @param {Object} usuarioData - Dados do usuário
 * @returns {boolean} true se deve ser bloqueado
 */
export const deveBloquearNaSincronizacao = (usuarioData) => {
  if (!usuarioData) return false;

  // Verificar login
  const login = usuarioData.usuario || usuarioData.login || '';
  const loginNormalizado = login.trim().toLowerCase();
  
  if (LOGINS_PROIBIDOS.includes(loginNormalizado)) {
    console.warn(`🚫 [Sincronização] Bloqueando usuário com login proibido: ${login}`);
    return true;
  }

  if (loginNormalizado.includes('admin')) {
    console.warn(`🚫 [Sincronização] Bloqueando usuário com "admin" no login: ${login}`);
    return true;
  }

  // Verificar nome
  const nome = usuarioData.nome || '';
  const nomeNormalizado = nome.trim().toLowerCase();
  
  if (NOMES_PROIBIDOS.includes(nomeNormalizado)) {
    console.warn(`🚫 [Sincronização] Bloqueando usuário com nome proibido: ${nome}`);
    return true;
  }

  return false;
};

/**
 * 📝 Log de tentativa de criação bloqueada
 * @param {string} contexto - Contexto onde foi bloqueado (ex: 'criação manual', 'sincronização')
 * @param {Object} dadosUsuario - Dados do usuário
 */
export const logBloqueio = (contexto, dadosUsuario) => {
  const timestamp = new Date().toISOString();
  const log = {
    timestamp,
    contexto,
    usuario: dadosUsuario.usuario || 'N/A',
    nome: dadosUsuario.nome || 'N/A',
    nivel: dadosUsuario.nivel,
    motivo: 'Login ou nome contém termo bloqueado'
  };

  console.warn('🚫 [BLOQUEIO DE USUÁRIO]', log);

  // Salvar no localStorage para auditoria
  try {
    const bloqueios = JSON.parse(localStorage.getItem('bloqueios_usuarios') || '[]');
    bloqueios.push(log);
    
    // Manter apenas últimos 100 registros
    if (bloqueios.length > 100) {
      bloqueios.shift();
    }
    
    localStorage.setItem('bloqueios_usuarios', JSON.stringify(bloqueios));
  } catch (error) {
    console.error('Erro ao salvar log de bloqueio:', error);
  }

  return log;
};

/**
 * 📊 Obter estatísticas de bloqueios
 * @returns {Object} Estatísticas de bloqueios
 */
export const getEstatisticasBloqueios = () => {
  try {
    const bloqueios = JSON.parse(localStorage.getItem('bloqueios_usuarios') || '[]');
    
    const estatisticas = {
      total: bloqueios.length,
      porContexto: {},
      ultimos10: bloqueios.slice(-10).reverse()
    };

    bloqueios.forEach(bloqueio => {
      const contexto = bloqueio.contexto || 'desconhecido';
      estatisticas.porContexto[contexto] = (estatisticas.porContexto[contexto] || 0) + 1;
    });

    return estatisticas;
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    return { total: 0, porContexto: {}, ultimos10: [] };
  }
};

/**
 * 🗑️ Limpar logs de bloqueio
 */
export const limparLogsBloqueios = () => {
  try {
    localStorage.removeItem('bloqueios_usuarios');
    console.log('✅ Logs de bloqueios limpos');
    return true;
  } catch (error) {
    console.error('Erro ao limpar logs:', error);
    return false;
  }
};

/**
 * 🎯 Exportar constantes para uso externo
 */
export const CONSTANTES_VALIDACAO = {
  LOGINS_PROIBIDOS,
  NOMES_PROIBIDOS
};

export default {
  validarLogin,
  validarNome,
  validarDadosUsuario,
  deveBloquearNaSincronizacao,
  logBloqueio,
  getEstatisticasBloqueios,
  limparLogsBloqueios,
  CONSTANTES_VALIDACAO
};
