// ==============================================================================
// 🔑 NOVO SISTEMA DE LOGIN COM CAMPO SENHA1533
// ==============================================================================
// 
// Este arquivo contém o código atualizado para a função login() que deve
// substituir o código atual no arquivo src/components/Workflow.jsx
//
// INSTRUÇÕES:
// 1. Abra o arquivo src/components/Workflow.jsx
// 2. Localize a função login (por volta da linha 760-900)
// 3. Substitua APENAS o bloco de verificação de senha pelo código abaixo
// 
// ==============================================================================

const login = async (email, senha, lembrarLogin = false) => {
    try {
        console.log('🔐 Tentativa de login:', { email, senhaLength: senha.length });
        console.log('🔍 Buscando usuário no Firebase Backup (garden-backup)...');
        
        // Buscar usuário diretamente do Firebase Backup usando o campo email
        let usuarioEncontrado = null;
        
        try {
            const usuariosRef = collection(backupDb, 'usuarios');
            const q = query(usuariosRef, where('email', '==', email));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
                const userDoc = querySnapshot.docs[0];
                usuarioEncontrado = {
                    id: userDoc.id,
                    ...userDoc.data()
                };
                console.log('✅ Usuário encontrado no Firebase Backup:', {
                    id: usuarioEncontrado.id,
                    email: usuarioEncontrado.email,
                    nivel: usuarioEncontrado.nivel,
                    ativo: usuarioEncontrado.ativo,
                    temSenha1533: !!usuarioEncontrado.senha1533
                });
            } else {
                console.log('❌ Nenhum usuário encontrado com o email:', email);
            }
        } catch (firebaseError) {
            console.error('❌ Erro ao buscar usuário no Firebase Backup:', firebaseError);
            // Fallback: tentar buscar nos usuários carregados em memória
            console.log('⚠️ Tentando fallback com usuários em memória...');
            if (usuarios.length === 0) {
                console.log('⚠️ Nenhum usuário carregado, inicializando usuários locais...');
                await initUsuariosLocais();
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            usuarioEncontrado = usuarios.find(u => u.email === email && u.ativo);
        }
        
        // Verificar se o usuário foi encontrado e está ativo
        if (!usuarioEncontrado || !usuarioEncontrado.ativo) {
            console.log('❌ Usuário não encontrado ou inativo');
            if (usuarios.length > 0) {
                console.log('Usuários disponíveis:', usuarios.map(u => ({ email: u.email, ativo: u.ativo })));
            }
            console.log('');
            console.log('💡 Para testar, crie um usuário na coleção "usuarios" do Firebase Backup com:');
            console.log('   - Campo "email": seu email');
            console.log('   - Campo "senha1533": "1533"');
            console.log('   - Campo "ativo": true');
            console.log('   - Campo "nivel": 1-4 (1=Funcionário, 2=Supervisor, 3=Gerente, 4=Admin)');
            return { success: false, message: 'Email ou senha incorretos' };
        }

        console.log('✅ Usuário encontrado:', {
            email: usuarioEncontrado.email,
            nivel: usuarioEncontrado.nivel,
            temSenha1533: !!usuarioEncontrado.senha1533,
            temSenhaHash: !!usuarioEncontrado.senhaHash,
            temSenhaSalt: !!usuarioEncontrado.senhaSalt,
            temSenhaTexto: !!usuarioEncontrado.senha
        });

        // ==============================================================================
        // 🔑 VERIFICAÇÃO DE SENHA COM NOVO CAMPO SENHA1533
        // ==============================================================================
        
        let senhaValida = false;

        console.log('🔑 Verificando senha com campo senha1533...');
        console.log('Senha recebida:', senha);
        console.log('Campo senha1533 do usuário:', usuarioEncontrado.senha1533);

        // Verificar se o usuário tem o campo senha1533 (NOVO SISTEMA)
        if (usuarioEncontrado.senha1533) {
            // Usar o novo sistema com campo senha1533
            senhaValida = usuarioEncontrado.senha1533 === senha;
            console.log('✅ Verificação usando campo senha1533:', senhaValida);
            
            if (senhaValida) {
                console.log('🎉 Login aprovado com novo sistema senha1533!');
            }
        } else {
            // Fallback: usuário ainda não migrado - usar sistema antigo
            console.log('⚠️ Usuário sem campo senha1533, verificando senha antiga...');
            console.log('📋 Status de migração: Este usuário ainda não foi migrado para o novo sistema');
            
            // Verificar senha SHA-512 (se existir)
            if (usuarioEncontrado.senhaHash && usuarioEncontrado.senhaSalt) {
                console.log('🔒 Verificando senha criptografada SHA-512...');
                senhaValida = verifyPassword(
                    senha, 
                    usuarioEncontrado.senhaHash, 
                    usuarioEncontrado.senhaSalt,
                    usuarioEncontrado.senhaVersion || 2
                );
                console.log('Resultado da verificação SHA-512:', senhaValida);
            } 
            // Verificar senha em texto plano (se existir)
            else if (usuarioEncontrado.senha) {
                console.log('📝 Verificando senha em texto plano...');
                senhaValida = usuarioEncontrado.senha === senha;
                console.log('Resultado da comparação:', senhaValida);
                
                // Se válida, NÃO migrar automaticamente - deixar para ferramenta de migração
                if (senhaValida) {
                    console.log('⚠️ ATENÇÃO: Usuário logou com senha antiga. Execute a migração!');
                }
            }
            
            console.log('Resultado da verificação de fallback:', senhaValida);
        }

        // Verificar se a senha é válida
        if (!senhaValida) {
            console.log('❌ Senha inválida!');
            console.log('💡 Dica: A senha padrão para todos os usuários é "1533"');
            console.log('🔧 Se o usuário não foi migrado, use a senha antiga ou execute a migração');
            return { success: false, message: 'Email ou senha incorretos' };
        }

        console.log('✅ Senha válida! Prosseguindo com login...');

        // ==============================================================================
        // RESTO DA FUNÇÃO LOGIN (NÃO ALTERAR)
        // ==============================================================================

        // Verificar se o usuário tem setor e empresa definidos
        // EXCEÇÃO: Administradores (nivel 4) não precisam ter setor, empresa ou cargo
        const isAdmin = usuarioEncontrado.nivel === NIVEIS_PERMISSAO.ADMIN;
        
        if (!isAdmin) {
            if (!usuarioEncontrado.setorId || !usuarioEncontrado.setorId.trim()) {
                return { 
                    success: false, 
                    message: 'Usuário sem setor atribuído. Entre em contato com o administrador.' 
                };
            }

            if (!usuarioEncontrado.empresaId || !usuarioEncontrado.empresaId.trim()) {
                return { 
                    success: false, 
                    message: 'Usuário sem empresa atribuída. Entre em contato com o administrador.' 
                };
            }
        }

        const usuarioAtualizado = {
            ...usuarioEncontrado,
            ultimoLogin: new Date().toISOString()
        };
        
        // Atualizar no Firebase Backup
        try {
            await updateDoc(doc(backupDb, 'usuarios', usuarioEncontrado.id), {
                ultimoLogin: usuarioAtualizado.ultimoLogin
            });
        } catch (error) {
            console.warn('⚠️ Erro ao atualizar último login no Firebase Backup:', error);
        }

        // Atualizar no Firebase Principal
        try {
            await updateDoc(doc(primaryDb, 'usuarios', usuarioEncontrado.id), {
                ultimoLogin: usuarioAtualizado.ultimoLogin
            });
        } catch (error) {
            console.warn('⚠️ Erro ao atualizar último login no Firebase Principal:', error);
        }

        // Atualizar usuário no estado local
        setUsuario(usuarioAtualizado);

        // Salvar dados de login se lembrar estiver marcado
        if (lembrarLogin) {
            salvarDadosLogin(usuarioAtualizado, true);
        }

        console.log('✅ Login realizado com sucesso!', {
            usuario: usuarioAtualizado.email,
            nivel: usuarioAtualizado.nivel,
            ultimoLogin: usuarioAtualizado.ultimoLogin,
            sistemaUsado: usuarioEncontrado.senha1533 ? 'NOVO (senha1533)' : 'ANTIGO (fallback)'
        });

        return { success: true, usuario: usuarioAtualizado };

    } catch (error) {
        console.error('❌ Erro no login:', error);
        return { success: false, message: 'Erro interno do sistema' };
    }
};

// ==============================================================================
// 📋 INSTRUÇÕES PARA IMPLEMENTAÇÃO:
// ==============================================================================
//
// 1. COPIE todo o código acima
// 2. ABRA o arquivo src/components/Workflow.jsx  
// 3. LOCALIZE a função login atual (linha ~760-900)
// 4. SUBSTITUA toda a função login pela versão acima
// 5. SALVE o arquivo
// 6. TESTE o login com senha "1533"
//
// ⚠️ IMPORTANTE:
// - Execute a migração ANTES de implementar este código
// - Todos os usuários migrados usarão senha "1533"  
// - Usuários não migrados ainda usarão senhas antigas (fallback)
// - Verifique os logs do console para acompanhar o processo
//
// ==============================================================================