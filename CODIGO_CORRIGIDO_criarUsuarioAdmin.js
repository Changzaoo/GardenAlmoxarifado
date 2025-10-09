// 🔧 Função Corrigida: criarUsuarioAdmin (Workflow.jsx)
// Substitua a função existente por esta versão corrigida

const criarUsuarioAdmin = async () => {
  try {
    // ✅ CORREÇÃO: Verificar se já existe admin antes de criar
    console.log('🔍 Verificando se já existe usuário admin...');
    
    const usuariosRef = collection(backupDb, 'usuarios');
    const adminQuery = query(
      usuariosRef,
      where('usuario', '==', 'admin')
    );
    
    const adminSnapshot = await getDocs(adminQuery);
    
    if (!adminSnapshot.empty) {
      console.log('⚠️ Usuário admin já existe, não será criado novamente');
      console.log(`📊 Encontrados ${adminSnapshot.size} usuário(s) admin existente(s)`);
      
      // Retornar usuários existentes
      adminSnapshot.forEach((doc) => {
        console.log(`   - ID: ${doc.id}, Nome: ${doc.data().nome}, Email: ${doc.data().email || 'admin'}`);
      });
      
      return; // ✅ Sai sem criar duplicado
    }

    console.log('✅ Nenhum admin encontrado, criando novo...');

    // Criptografar a senha antes de salvar
    const { hash, salt, version, algorithm } = encryptPassword('admin@362*');
    
    const adminPadrao = {
      nome: 'Administrador',
      usuario: 'admin',
      senhaHash: hash,
      senhaSalt: salt,
      senhaVersion: version,
      senhaAlgorithm: algorithm,
      nivel: NIVEIS_PERMISSAO.ADMIN,
      ativo: true,
      dataCriacao: new Date().toISOString(),
      ultimoLogin: null,
      // Preferências padrão
      preferencias: {
        tema: 'auto',
        notificacoes: true,
        idioma: 'pt-BR',
        sons: true,
        emailNotificacoes: false
      },
      // Menu padrão para admin (todos visíveis)
      menuConfig: null, // null = usa configuração padrão
      menuPersonalizado: false,
      // Dados opcionais
      empresaId: null,
      setorId: null,
      cargoId: null,
      telefone: null,
      avatar: null,
      bio: 'Administrador do sistema'
    };

    const docRef = await addDoc(collection(db, 'usuarios'), adminPadrao);
    console.log('✅ Usuário admin criado no Firebase com ID:', docRef.id);
    console.log('👤 Usuário: admin');
    console.log('🔑 Senha: admin@362*');
    
    // Recarregar usuários após criar admin
    await carregarUsuarios();
  } catch (error) {
    console.error('❌ Erro ao criar usuário admin:', error);
  }
};
