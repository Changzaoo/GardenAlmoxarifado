/**
 * Modelo Padrão de Usuário do Sistema
 * Define a estrutura completa de um usuário com todos os campos necessários
 */

import { NIVEIS_PERMISSAO } from './permissoes';

/**
 * Configuração padrão do menu do usuário
 * Cada item define visibilidade e ordem de exibição
 */
export const MENU_CONFIG_PADRAO = [
  { id: 'notificacoes', ordem: 0, visivel: true },
  { id: 'relatorios-erro', ordem: 1, visivel: true },
  { id: 'mensagens', ordem: 2, visivel: true },
  { id: 'tarefas', ordem: 3, visivel: true },
  { id: 'escala', ordem: 4, visivel: false },
  { id: 'inventario', ordem: 5, visivel: false },
  { id: 'emprestimos', ordem: 6, visivel: false },
  { id: 'funcionarios', ordem: 7, visivel: false },
  { id: 'empresas-setores', ordem: 8, visivel: false },
  { id: 'usuarios', ordem: 9, visivel: false },
  { id: 'ponto', ordem: 10, visivel: false },
  { id: 'ranking', ordem: 11, visivel: false },
  { id: 'bluetooth', ordem: 12, visivel: false },
  { id: 'admin', ordem: 13, visivel: false },
];

/**
 * Status possíveis de um usuário
 */
export const STATUS_USUARIO = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  AUSENTE: 'ausente',
  OCUPADO: 'ocupado'
};

/**
 * Cria um modelo padrão de usuário com todos os campos necessários
 * @param {Object} dadosBasicos - Dados básicos do usuário (nome, usuario, senha, etc)
 * @returns {Object} Usuário completo com todos os campos do modelo
 */
export const criarModeloUsuarioPadrao = (dadosBasicos = {}) => {
  const agora = new Date().toISOString();
  
  return {
    // Dados básicos obrigatórios
    nome: dadosBasicos.nome || '',
    usuario: dadosBasicos.usuario || '',
    nivel: dadosBasicos.nivel || NIVEIS_PERMISSAO.FUNCIONARIO,
    ativo: dadosBasicos.ativo !== undefined ? dadosBasicos.ativo : true,
    
    // Segurança (senha já deve vir criptografada)
    senha: null, // Nunca armazenar senha em texto plano
    senhaHash: dadosBasicos.senhaHash || null,
    senhaSalt: dadosBasicos.senhaSalt || null,
    senhaVersion: dadosBasicos.senhaVersion || 2,
    senhaAlgorithm: dadosBasicos.senhaAlgorithm || 'SHA-512',
    
    // Informações profissionais
    cargo: dadosBasicos.cargo || '',
    empresaId: dadosBasicos.empresaId || '',
    empresaNome: dadosBasicos.empresaNome || '',
    setorId: dadosBasicos.setorId || '',
    setorNome: dadosBasicos.setorNome || '',
    
    // Contato
    telefone: dadosBasicos.telefone || '',
    whatsapp: dadosBasicos.whatsapp || '',
    
    // Visual
    photoURL: dadosBasicos.photoURL || '',
    
    // Status e presença
    status: dadosBasicos.status || STATUS_USUARIO.OFFLINE,
    ultimaVez: dadosBasicos.ultimaVez || null,
    
    // Datas
    dataCriacao: dadosBasicos.dataCriacao || agora,
    ultimoLogin: dadosBasicos.ultimoLogin || null,
    
    // Preferências
    itemFavorito: dadosBasicos.itemFavorito || '',
    menuConfig: dadosBasicos.menuConfig || JSON.parse(JSON.stringify(MENU_CONFIG_PADRAO)),
    
    // Campos extras (se houver)
    ...dadosBasicos.extras
  };
};

/**
 * Valida se um usuário tem todos os campos obrigatórios do novo modelo
 * @param {Object} usuario - Usuário a ser validado
 * @returns {Object} { valido: boolean, camposFaltando: string[] }
 */
export const validarModeloUsuario = (usuario) => {
  const camposObrigatorios = [
    'nome',
    'usuario',
    'nivel',
    'ativo',
    'senhaHash',
    'senhaSalt',
    'senhaVersion',
    'senhaAlgorithm',
    'status',
    'dataCriacao',
    'menuConfig'
  ];
  
  const camposFaltando = camposObrigatorios.filter(campo => {
    if (campo === 'menuConfig') {
      return !usuario[campo] || !Array.isArray(usuario[campo]) || usuario[campo].length === 0;
    }
    return usuario[campo] === undefined || usuario[campo] === null;
  });
  
  return {
    valido: camposFaltando.length === 0,
    camposFaltando
  };
};

/**
 * Atualiza o menuConfig de um usuário baseado no seu nível de permissão
 * @param {number} nivel - Nível de permissão do usuário
 * @param {Array} menuAtual - Menu atual do usuário (opcional)
 * @returns {Array} Menu configurado
 */
export const atualizarMenuPorNivel = (nivel, menuAtual = null) => {
  // Se já tem menu configurado, preserva as customizações
  const menu = menuAtual && Array.isArray(menuAtual) && menuAtual.length > 0
    ? [...menuAtual]
    : JSON.parse(JSON.stringify(MENU_CONFIG_PADRAO));
  
  // Define visibilidade baseada no nível
  const menuVisibilidadePorNivel = {
    [NIVEIS_PERMISSAO.FUNCIONARIO]: ['notificacoes', 'mensagens', 'tarefas'],
    [NIVEIS_PERMISSAO.SUPERVISOR]: ['notificacoes', 'mensagens', 'tarefas', 'escala', 'ponto', 'ranking'],
    [NIVEIS_PERMISSAO.GERENTE_SETOR]: ['notificacoes', 'mensagens', 'tarefas', 'escala', 'inventario', 'emprestimos', 'funcionarios', 'ponto', 'ranking'],
    [NIVEIS_PERMISSAO.GERENTE_GERAL]: ['notificacoes', 'mensagens', 'tarefas', 'escala', 'inventario', 'emprestimos', 'funcionarios', 'ponto', 'ranking', 'compras', 'analytics'],
    [NIVEIS_PERMISSAO.ADMIN]: 'todos' // Admin vê tudo
  };
  
  const itensVisiveis = menuVisibilidadePorNivel[nivel] || menuVisibilidadePorNivel[NIVEIS_PERMISSAO.FUNCIONARIO];
  
  return menu.map(item => ({
    ...item,
    visivel: itensVisiveis === 'todos' || itensVisiveis.includes(item.id)
  }));
};

/**
 * Compara dois usuários e retorna os campos que mudaram
 * @param {Object} usuarioAntigo 
 * @param {Object} usuarioNovo 
 * @returns {Object} Campos alterados
 */
export const compararUsuarios = (usuarioAntigo, usuarioNovo) => {
  const mudancas = {};
  
  const camposParaComparar = [
    'nome', 'usuario', 'nivel', 'ativo', 'cargo',
    'empresaId', 'empresaNome', 'setorId', 'setorNome',
    'telefone', 'whatsapp', 'photoURL', 'status', 'itemFavorito'
  ];
  
  camposParaComparar.forEach(campo => {
    if (usuarioAntigo[campo] !== usuarioNovo[campo]) {
      mudancas[campo] = {
        antes: usuarioAntigo[campo],
        depois: usuarioNovo[campo]
      };
    }
  });
  
  // Comparação especial para menuConfig
  if (JSON.stringify(usuarioAntigo.menuConfig) !== JSON.stringify(usuarioNovo.menuConfig)) {
    mudancas.menuConfig = {
      antes: usuarioAntigo.menuConfig,
      depois: usuarioNovo.menuConfig
    };
  }
  
  return mudancas;
};

export default {
  criarModeloUsuarioPadrao,
  validarModeloUsuario,
  atualizarMenuPorNivel,
  compararUsuarios,
  MENU_CONFIG_PADRAO,
  STATUS_USUARIO
};
