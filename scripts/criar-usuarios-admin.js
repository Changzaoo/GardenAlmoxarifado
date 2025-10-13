/**
 * Script para criar usuários administradores permanentes no sistema
 * 
 * Usuários criados:
 * 1. admin / senha: 1533
 * 2. Angelo / senha: voce
 * 
 * Ambos com nível de permissão ADMIN (4)
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, query, where, getDocs, Timestamp } = require('firebase/firestore');
const crypto = require('crypto');

// Configuração do Firebase (mesma do projeto)
const firebaseConfig = {
  apiKey: "AIzaSyDGq-q0DwdVCX9RAAxF4sq5OU-2hD41qPE",
  authDomain: "workflow-cfe2e.firebaseapp.com",
  projectId: "workflow-cfe2e",
  storageBucket: "workflow-cfe2e.firebasestorage.app",
  messagingSenderId: "710977345168",
  appId: "1:710977345168:web:eeb2dd2ad05cf6ae89fde0",
  measurementId: "G-52ZFJP2KTW"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Gera hash de senha usando SHA-512 (mesmo algoritmo do sistema)
 */
function gerarHashSenha(senha) {
  // Gerar salt aleatório
  const salt = crypto.randomBytes(16).toString('hex');
  
  // Criar hash SHA-512
  const hash = crypto.createHash('sha512');
  hash.update(senha + salt);
  const senhaHash = hash.digest('hex');
  
  return {
    senhaHash,
    senhaSalt: salt,
    senhaVersion: 2,
    senhaAlgorithm: 'SHA-512'
  };
}

/**
 * Configuração de menu padrão para administradores
 */
const menuConfigAdmin = [
  { id: 'notificacoes', ordem: 0, visivel: true },
  { id: 'relatorios-erro', ordem: 1, visivel: true },
  { id: 'mensagens', ordem: 2, visivel: true },
  { id: 'tarefas', ordem: 3, visivel: true },
  { id: 'escala', ordem: 4, visivel: true },
  { id: 'inventario', ordem: 5, visivel: true },
  { id: 'emprestimos', ordem: 6, visivel: true },
  { id: 'funcionarios', ordem: 7, visivel: true },
  { id: 'empresas-setores', ordem: 8, visivel: true },
  { id: 'ponto', ordem: 9, visivel: true },
  { id: 'ranking', ordem: 10, visivel: true },
  { id: 'feed', ordem: 11, visivel: true },
  { id: 'usuarios', ordem: 12, visivel: true },
  { id: 'sistema-resumo', ordem: 13, visivel: true }
];

/**
 * Verifica se usuário já existe
 */
async function usuarioExiste(email) {
  const q = query(collection(db, 'usuario'), where('email', '==', email));
  const snapshot = await getDocs(q);
  return !snapshot.empty;
}

/**
 * Cria um usuário administrador
 */
async function criarUsuarioAdmin(dadosUsuario) {
  try {
    // Verificar se já existe
    const existe = await usuarioExiste(dadosUsuario.email);
    if (existe) {
      console.log(`⚠️  Usuário "${dadosUsuario.email}" já existe. Pulando...`);
      return null;
    }

    // Gerar hash da senha
    const { senhaHash, senhaSalt, senhaVersion, senhaAlgorithm } = gerarHashSenha(dadosUsuario.senha);

    // Criar objeto do usuário com modelo completo
    const novoUsuario = {
      // Dados Básicos
      nome: dadosUsuario.nome,
      email: dadosUsuario.email,
      nivel: 4, // ADMIN
      ativo: true,
      
      // Segurança (SHA-512)
      senha: null,
      senhaHash,
      senhaSalt,
      senhaVersion,
      senhaAlgorithm,
      
      // Informações Profissionais
      cargo: 'Administrador',
      empresaId: '',
      empresaNome: '',
      setorId: '',
      setorNome: '',
      
      // Contato
      telefone: '',
      whatsapp: '',
      
      // Visual
      photoURL: '',
      
      // Novos Campos do Modelo
      status: 'offline',
      ultimaVez: Timestamp.now(),
      itemFavorito: 'sistema-resumo',
      menuConfig: menuConfigAdmin,
      
      // Datas
      dataCriacao: new Date().toISOString(),
      ultimoLogin: null
    };

    // Adicionar ao Firestore
    const docRef = await addDoc(collection(db, 'usuario'), novoUsuario);
    
    console.log(`✅ Usuário "${dadosUsuario.nome}" criado com sucesso!`);
    console.log(`   ID: ${docRef.id}`);
    console.log(`   Email: ${dadosUsuario.email}`);
    console.log(`   Nível: Administrador (4)`);
    console.log('');
    
    return docRef.id;
  } catch (error) {
    console.error(`❌ Erro ao criar usuário "${dadosUsuario.nome}":`, error.message);
    return null;
  }
}

/**
 * Função principal
 */
async function main() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('🔐 CRIAÇÃO DE USUÁRIOS ADMINISTRADORES PERMANENTES');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');

  // Usuários a serem criados
  const usuarios = [
    {
      nome: 'admin',
      email: 'admin',
      senha: '1533'
    },
    {
      nome: 'Angelo',
      email: 'Angelo',
      senha: 'voce'
    }
  ];

  console.log('📝 Criando usuários administradores...\n');

  let criados = 0;
  let existentes = 0;

  for (const usuario of usuarios) {
    const id = await criarUsuarioAdmin(usuario);
    if (id) {
      criados++;
    } else {
      existentes++;
    }
  }

  console.log('═══════════════════════════════════════════════════════');
  console.log('📊 RESUMO DA CRIAÇÃO');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`✅ Usuários criados: ${criados}`);
  console.log(`⚠️  Usuários já existentes: ${existentes}`);
  console.log(`📦 Total processados: ${usuarios.length}`);
  console.log('');
  
  if (criados > 0) {
    console.log('═══════════════════════════════════════════════════════');
    console.log('🎉 CREDENCIAIS DE ACESSO');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');
    console.log('👤 Usuário 1:');
    console.log('   Email/Login: admin');
    console.log('   Senha: 1533');
    console.log('   Nível: Administrador');
    console.log('');
    console.log('👤 Usuário 2:');
    console.log('   Email/Login: Angelo');
    console.log('   Senha: voce');
    console.log('   Nível: Administrador');
    console.log('');
    console.log('✅ Os usuários foram criados com sucesso!');
    console.log('🔐 Use essas credenciais para fazer login no sistema.');
    console.log('');
  }
  
  console.log('═══════════════════════════════════════════════════════');
  console.log('✨ Script concluído com sucesso!');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');

  process.exit(0);
}

// Executar
main().catch((error) => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
