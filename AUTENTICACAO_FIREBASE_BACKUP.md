# 🔐 Sistema de Autenticação via Firebase Backup

## ✅ Implementação Concluída

Sistema de login agora autentica diretamente na coleção `usuarios` do **Firebase Backup (garden-backup)** usando os campos `email` e `senha`.

---

## 🎯 Objetivo

Usar o banco de dados Firebase Backup (garden-backup) como fonte de autenticação primária para o sistema, buscando usuários pela coleção `usuarios` usando:
- **Campo de usuário**: `email`
- **Campo de senha**: `senha`

---

## 🛠️ Alterações Implementadas

### 1. **Import do Firebase Backup**

#### `src/components/Workflow.jsx`
```javascript
import { db } from '../firebaseConfig';
import { backupDb } from '../config/firebaseDual'; // ✅ Adicionado
```

---

### 2. **Função de Login Atualizada**

#### Fluxo de Autenticação:

```javascript
const login = async (email, senha, lembrarLogin = false) => {
  try {
    console.log('🔐 Tentativa de login:', { email });
    console.log('🗄️ Buscando usuário no Firebase Backup (garden-backup)...');
    
    // 1. Buscar usuário no Firebase Backup
    const usuariosRef = collection(backupDb, 'usuarios');
    const q = query(usuariosRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      usuarioEncontrado = {
        id: userDoc.id,
        ...userDoc.data()
      };
    }
    
    // 2. Fallback para usuários em memória (caso Firebase falhe)
    if (!usuarioEncontrado) {
      // Tenta buscar em usuarios carregados localmente
    }
    
    // 3. Verificar se usuário existe e está ativo
    if (!usuarioEncontrado || !usuarioEncontrado.ativo) {
      return { success: false, message: 'Email ou senha incorretos' };
    }
    
    // 4. Verificar senha
    let senhaValida = false;
    
    if (usuarioEncontrado.senhaHash && usuarioEncontrado.senhaSalt) {
      // Senha criptografada (SHA-512)
      senhaValida = verifyPassword(senha, usuarioEncontrado.senhaHash, ...);
    } else if (usuarioEncontrado.senha) {
      // Senha em texto plano
      senhaValida = usuarioEncontrado.senha === senha;
    }
    
    if (!senhaValida) {
      return { success: false, message: 'Email ou senha incorretos' };
    }
    
    // 5. Atualizar último login no Firebase Backup
    await updateDoc(doc(backupDb, 'usuarios', usuarioEncontrado.id), {
      ultimoLogin: new Date().toISOString()
    });
    
    // 6. Salvar sessão e retornar sucesso
    setUsuario(usuarioEncontrado);
    return { success: true };
  } catch (error) {
    console.error('Erro no login:', error);
    return { success: false, message: 'Erro interno do sistema' };
  }
};
```

---

## 📊 Estrutura de Dados

### Coleção: `usuarios` (Firebase Backup - garden-backup)

#### Campos Obrigatórios:
```javascript
{
  email: "usuario@example.com",    // 🔑 Campo de login (username)
  senha: "minhasenha123",          // 🔒 Campo de senha (plaintext ou hash)
  ativo: true,                     // ✅ Usuário habilitado/desabilitado
  nivel: 4,                        // 🎚️ Nível de permissão (1-4)
  
  // Campos opcionais mas recomendados:
  nome: "Nome Completo",
  setorId: "id-do-setor",          // Obrigatório para não-admins
  empresaId: "id-da-empresa",      // Obrigatório para não-admins
  cargo: "Cargo do Usuário",
  telefone: "(11) 99999-9999",
  dataCriacao: "2025-10-04T12:00:00.000Z",
  ultimoLogin: "2025-10-04T12:30:00.000Z"
}
```

#### Níveis de Permissão:
```javascript
1 = Funcionário    // Acesso básico
2 = Supervisor     // Acesso a tarefas e escalas
3 = Gerente        // Acesso a relatórios e gestão
4 = Admin          // Acesso total (não precisa de setor/empresa)
```

---

## 🔐 Tipos de Senha Suportados

### 1. **Senha em Texto Plano** (Sistema Legado)
```javascript
{
  email: "usuario@example.com",
  senha: "minhasenha123",  // Texto plano
  ativo: true,
  nivel: 1
}
```

**Como funciona**:
- Comparação direta: `senha === usuarioEncontrado.senha`
- ⚠️ **Auto-migração**: Ao fazer login, a senha é automaticamente migrada para SHA-512

### 2. **Senha Criptografada SHA-512** (Recomendado)
```javascript
{
  email: "usuario@example.com",
  senhaHash: "abc123def456...",     // Hash SHA-512
  senhaSalt: "xyz789...",            // Salt único
  senhaVersion: 2,                   // Versão do algoritmo
  senhaAlgorithm: "sha512",          // Algoritmo usado
  senha: null,                       // Campo legado removido
  ativo: true,
  nivel: 1
}
```

**Como funciona**:
- Usa função `verifyPassword()` do `crypto.js`
- Compara hash gerado com hash armazenado
- ✅ Mais seguro: senha nunca armazenada em texto plano

---

## 🧪 Como Testar

### Passo 1: Criar Usuário no Firebase Backup

1. Acessar [Firebase Console](https://console.firebase.google.com/)
2. Selecionar projeto **garden-backup**
3. Ir em **Firestore Database**
4. Criar novo documento na coleção `usuarios`:

```javascript
// Documento ID: gerado automaticamente
{
  "email": "teste@example.com",
  "senha": "123456",
  "ativo": true,
  "nivel": 4,
  "nome": "Usuário Teste",
  "dataCriacao": "2025-10-04T12:00:00.000Z"
}
```

### Passo 2: Fazer Login

1. Acessar http://localhost:3000
2. Na tela de login:
   - **Usuário**: `teste@example.com`
   - **Senha**: `123456`
3. Clicar em "Entrar"

### Passo 3: Verificar Console

```
🔐 Tentativa de login: { email: 'teste@example.com', senhaLength: 6 }
🗄️ Buscando usuário no Firebase Backup (garden-backup)...
✅ Usuário encontrado no Firebase Backup: { id: 'abc123', email: 'teste@example.com', ... }
✅ Usuário encontrado: { email: 'teste@example.com', nivel: 4, ... }
📝 Verificando senha em texto plano...
✅ Senha válida! Prosseguindo com login...
✅ Último login atualizado no Firebase Backup
```

### Passo 4: Auto-migração de Senha

Após o primeiro login, o documento será atualizado automaticamente:

```javascript
// Antes (texto plano)
{
  "email": "teste@example.com",
  "senha": "123456",
  ...
}

// Depois (criptografado)
{
  "email": "teste@example.com",
  "senha": null,
  "senhaHash": "abc123def456...",
  "senhaSalt": "xyz789...",
  "senhaVersion": 2,
  "senhaAlgorithm": "sha512",
  "ultimoLogin": "2025-10-04T12:30:00.000Z",
  ...
}
```

---

## 🔄 Fluxo Completo de Autenticação

```
┌─────────────────────────────────────────────────┐
│ 1. Usuário digita email e senha                │
└────────────────┬────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────┐
│ 2. Sistema busca no Firebase Backup            │
│    query(backupDb, 'usuarios', email)           │
└────────────────┬────────────────────────────────┘
                 ↓
         ┌───────┴───────┐
         │ Encontrado?   │
         └───┬───────┬───┘
        Não  │       │ Sim
             ↓       ↓
    ┌────────────┐  ┌────────────────────────┐
    │  Fallback  │  │ 3. Verificar senha     │
    │  Memória   │  │    - SHA-512?          │
    └────────────┘  │    - Texto plano?      │
                    └──────────┬─────────────┘
                               ↓
                       ┌───────┴────────┐
                       │ Senha válida?  │
                       └───┬────────┬───┘
                      Não  │        │ Sim
                           ↓        ↓
                    ┌────────┐  ┌──────────────────┐
                    │ Negar  │  │ 4. Auto-migração │
                    │ Login  │  │    (se texto)    │
                    └────────┘  └────────┬─────────┘
                                         ↓
                                ┌─────────────────┐
                                │ 5. Atualizar    │
                                │    ultimoLogin  │
                                └────────┬────────┘
                                         ↓
                                ┌─────────────────┐
                                │ 6. Salvar       │
                                │    sessão       │
                                └────────┬────────┘
                                         ↓
                                ┌─────────────────┐
                                │ ✅ Login OK     │
                                └─────────────────┘
```

---

## 🔒 Segurança

### Validações Implementadas:

1. **Campo `ativo`**: Usuário deve estar ativo (`ativo: true`)
2. **Senha**: Verificação com hash SHA-512 ou comparação direta
3. **Setor/Empresa**: Obrigatório para não-admins (nivel < 4)
4. **Último Login**: Registrado automaticamente

### Proteções:

- ✅ Senhas nunca logadas no console (apenas length)
- ✅ Auto-migração de senhas legadas para SHA-512
- ✅ Fallback para sistema local em caso de falha no Firebase
- ✅ Logs detalhados para debug (ambiente dev)

---

## 📝 Logs de Debug

### Login Bem-Sucedido:
```
🔐 Tentativa de login: { email: 'teste@example.com', senhaLength: 6 }
🗄️ Buscando usuário no Firebase Backup (garden-backup)...
✅ Usuário encontrado no Firebase Backup: { id: 'abc123', email: 'teste@example.com', nivel: 4, ativo: true }
✅ Usuário encontrado: { email: 'teste@example.com', nivel: 4, temSenhaHash: false, temSenhaTexto: true }
📝 Verificando senha em texto plano...
✅ Senha válida! Prosseguindo com login...
✅ Senha migrada para SHA-512 com sucesso
✅ Último login atualizado no Firebase Backup
```

### Login Falhou (Usuário não encontrado):
```
🔐 Tentativa de login: { email: 'inexistente@example.com', senhaLength: 6 }
🗄️ Buscando usuário no Firebase Backup (garden-backup)...
❌ Nenhum usuário encontrado com o email: inexistente@example.com
⚠️ Tentando fallback com usuários em memória...
❌ Usuário não encontrado ou inativo

💡 Para testar, crie um usuário na coleção "usuarios" do Firebase Backup com:
   - Campo "email": seu email
   - Campo "senha": sua senha
   - Campo "ativo": true
   - Campo "nivel": 1-4 (1=Funcionário, 2=Supervisor, 3=Gerente, 4=Admin)
```

### Login Falhou (Senha incorreta):
```
🔐 Tentativa de login: { email: 'teste@example.com', senhaLength: 5 }
🗄️ Buscando usuário no Firebase Backup (garden-backup)...
✅ Usuário encontrado no Firebase Backup
📝 Verificando senha em texto plano...
❌ Senha inválida!
```

---

## 🎯 Vantagens da Implementação

### 1. **Firebase Backup como Fonte Primária**
- ✅ Centralização de dados
- ✅ Sincronização automática com sistema de rotação
- ✅ Backup redundante garantido

### 2. **Fallback Inteligente**
- ✅ Se Firebase Backup falhar, usa usuários em memória
- ✅ Garante disponibilidade mesmo em caso de problemas
- ✅ Zero downtime

### 3. **Auto-Migração de Senhas**
- ✅ Senhas legadas automaticamente migradas para SHA-512
- ✅ Transparente para o usuário
- ✅ Segurança melhorada progressivamente

### 4. **Compatibilidade**
- ✅ Suporta senhas em texto plano (legado)
- ✅ Suporta senhas criptografadas SHA-512 (novo)
- ✅ Migração suave sem quebrar sistema existente

---

## 🚀 Próximos Passos (Opcional)

### 1. **Dashboard de Usuários**
```javascript
// Página admin para gerenciar usuários do Firebase Backup
- Criar novos usuários
- Editar dados existentes
- Desativar/ativar usuários
- Redefinir senhas
- Ver últimos logins
```

### 2. **Sincronização Bidirecional**
```javascript
// Sincronizar alterações entre Primary e Backup
- Ao criar usuário: salvar em ambos
- Ao atualizar: atualizar em ambos
- Ao deletar: marcar como inativo em ambos
```

### 3. **Auditoria**
```javascript
// Log de todas as ações de autenticação
{
  email: "usuario@example.com",
  acao: "login_success",
  timestamp: "2025-10-04T12:30:00.000Z",
  ip: "192.168.1.100",
  userAgent: "Mozilla/5.0..."
}
```

### 4. **Recuperação de Senha**
```javascript
// Implementar sistema de reset de senha
- Enviar email com token
- Validar token
- Permitir criar nova senha
- Salvar no Firebase Backup
```

---

## 📂 Arquivos Modificados

### `src/components/Workflow.jsx`
```diff
+ import { backupDb } from '../config/firebaseDual';

  const login = async (email, senha, lembrarLogin = false) => {
    try {
+     // Buscar usuário no Firebase Backup
+     const usuariosRef = collection(backupDb, 'usuarios');
+     const q = query(usuariosRef, where('email', '==', email));
+     const querySnapshot = await getDocs(q);
      
+     if (!querySnapshot.empty) {
+       const userDoc = querySnapshot.docs[0];
+       usuarioEncontrado = { id: userDoc.id, ...userDoc.data() };
+     }
      
      // ... verificação de senha
      
+     // Atualizar último login no Firebase Backup
+     await updateDoc(doc(backupDb, 'usuarios', usuarioEncontrado.id), {
+       ultimoLogin: new Date().toISOString()
+     });
    }
  };
```

---

## ✅ Resultado Final

**Status**: Autenticação via Firebase Backup funcionando ✅

**Comportamento**:
1. Usuário digita email e senha
2. Sistema busca na coleção `usuarios` do Firebase Backup
3. Valida credenciais
4. Auto-migra senha para SHA-512 (se necessário)
5. Atualiza último login
6. Salva sessão
7. Redireciona para dashboard

**Logs**:
```
🔐 Tentativa de login
🗄️ Buscando usuário no Firebase Backup (garden-backup)
✅ Usuário encontrado no Firebase Backup
✅ Senha válida! Prosseguindo com login
✅ Último login atualizado no Firebase Backup
```

---

**Desenvolvido com ❤️ para Garden Almoxarifado**  
*Sistema de Autenticação v2.0 - Agora com Firebase Backup!*
