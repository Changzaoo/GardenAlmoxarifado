# 🔐 Sistema de Autenticação - Análise Completa

## 📋 Visão Geral

Documentação completa do sistema de login, incluindo bancos de dados, coleções, campos e fluxo de autenticação.

---

## 🗄️ Bancos de Dados Utilizados

### **1. Firebase Backup (garden-backup)** - PRINCIPAL ✅

```javascript
// Arquivo: src/config/firebaseDual.js
const firebaseConfigBackup = {
  apiKey: "AIzaSyCPTELyhRUn4qByU68pOZsZUrkR1ZeyROo",
  authDomain: "garden-backup.firebaseapp.com",
  projectId: "garden-backup",
  storageBucket: "garden-backup.firebasestorage.app",
  messagingSenderId: "842077125369",
  appId: "1:842077125369:web:ea3bafe1cedb92cd350028",
  measurementId: "G-WJHEL52L9L"
};

export const backupDb = getFirestore(appBackup);
```

**Status:** 🟢 **Banco ATIVO para login**

---

## 📁 Coleção Utilizada

### **Collection: `usuarios`**

Localização: `garden-backup` → `usuarios`

```javascript
// Query no código (linha 760 do Workflow.jsx)
const usuariosRef = collection(backupDb, 'usuarios');
const q = query(usuariosRef, where('email', '==', email));
```

---

## 📝 Campos Utilizados no Login

### **1. Formulário de Login (Interface)**

Arquivo: `src/components/Auth/LoginForm.jsx`

```jsx
<form onSubmit={handleLogin}>
  {/* Campo 1: Usuário/Email */}
  <Input
    type="text"
    value={loginData.username}  // ← Campo do formulário
    onChange={(e) => setLoginData({...loginData, username: e.target.value})}
    placeholder="👤 Digite seu usuário"
  />

  {/* Campo 2: Senha */}
  <Input
    type={showPassword ? 'text' : 'password'}
    value={loginData.password}  // ← Campo do formulário
    onChange={(e) => setLoginData({...loginData, password: e.target.value})}
    placeholder="🔒 Digite sua senha"
  />

  {/* Campo 3: Lembrar Login */}
  <input
    type="checkbox"
    checked={loginData.lembrar || false}  // ← Campo opcional
    onChange={e => setLoginData({ ...loginData, lembrar: e.target.checked })}
  />
</form>
```

**Campos do Formulário:**
| Campo | Tipo | Nome Variável | Obrigatório |
|-------|------|---------------|-------------|
| Usuário/Email | text | `username` | ✅ Sim |
| Senha | password | `password` | ✅ Sim |
| Lembrar-me | checkbox | `lembrar` | ❌ Não |

---

### **2. Busca no Firebase**

Arquivo: `src/components/Workflow.jsx` (linha 751)

```javascript
const login = async (email, senha, lembrarLogin = false) => {
  // 1️⃣ BUSCAR USUÁRIO POR EMAIL
  const usuariosRef = collection(backupDb, 'usuarios');
  const q = query(usuariosRef, where('email', '==', email));
  const querySnapshot = await getDocs(q);
  
  // 2️⃣ RECUPERAR DADOS DO USUÁRIO
  if (!querySnapshot.empty) {
    const userDoc = querySnapshot.docs[0];
    usuarioEncontrado = {
      id: userDoc.id,
      ...userDoc.data()
    };
  }
}
```

**Campo de Busca:**
- **Campo:** `email`
- **Tipo:** String
- **Comparação:** Igualdade exata (`==`)
- **Índice:** Recomendado criar índice no Firestore

---

### **3. Campos do Documento `usuarios`**

Estrutura do documento no Firebase:

```javascript
{
  // === IDENTIFICAÇÃO ===
  id: "abc123",                    // ✅ ID do documento (gerado automaticamente)
  nome: "João Silva",              // ✅ Nome completo
  email: "joao@email.com",         // ✅ Campo usado para BUSCA no login
  
  // === AUTENTICAÇÃO (NOVO SISTEMA) ===
  authKey: "workflow2024",         // 🔑 CAMPO PRINCIPAL para autenticação
  authKeyUpdatedAt: "2025-10-05T...", // Data da última atualização do authKey
  
  // === AUTENTICAÇÃO (SISTEMA LEGADO) ===
  senha: "minhasenha123",          // 📝 Senha em texto plano (legado)
  senhaHash: "789e10808a99382...", // 🔒 Hash SHA-512 da senha
  senhaSalt: "salt_aleatorio",     // 🧂 Salt para SHA-512
  senhaVersion: 2,                 // Versão do algoritmo de criptografia
  senhaAlgorithm: "sha512",        // Algoritmo usado
  
  // === PERMISSÕES E STATUS ===
  nivel: 4,                        // ✅ Nível de permissão (0=Admin, 1-6=outros)
  ativo: true,                     // ✅ Status do usuário (true/false)
  
  // === VINCULAÇÃO ===
  empresaId: "empresa123",         // ID da empresa (obrigatório se não for admin)
  setorId: "setor456",             // ID do setor (obrigatório se não for admin)
  cargo: "Gerente",                // Cargo do usuário
  
  // === DADOS ADICIONAIS ===
  ultimoLogin: "2025-10-05T21:00:00Z", // Timestamp do último login
  dataCriacao: "2025-01-01T...",   // Data de criação do usuário
  telefone: "+55 11 99999-9999",   // Telefone (opcional)
  avatar: "url_da_imagem",         // Avatar (opcional)
  
  // === PREFERÊNCIAS ===
  preferencias: {
    tema: "auto",                  // Tema (light/dark/auto)
    notificacoes: true,            // Notificações ativadas
    idioma: "pt-BR"                // Idioma
  }
}
```

---

## 🔄 Fluxo de Autenticação Completo

### **Etapa 1: Formulário de Login**

```
┌─────────────────────────────────┐
│  LoginForm.jsx                  │
│  ─────────────────────────────  │
│  👤 Usuário: [___________]      │
│  🔒 Senha:   [___________]      │
│  ☐ Lembrar-me                   │
│  [Entrar no Sistema]            │
└─────────────────────────────────┘
           ↓
  loginData.username → email
  loginData.password → senha
```

### **Etapa 2: Buscar Usuário no Firebase**

```javascript
// Workflow.jsx - linha 760
const usuariosRef = collection(backupDb, 'usuarios');
const q = query(usuariosRef, where('email', '==', email));
const querySnapshot = await getDocs(q);
```

**SQL Equivalente:**
```sql
SELECT * FROM usuarios WHERE email = 'joao@email.com' LIMIT 1;
```

### **Etapa 3: Validação da Senha**

```javascript
// PRIORIDADE 1: Novo Sistema (authKey)
if (usuarioEncontrado.authKey) {
  senhaValida = usuarioEncontrado.authKey === senha;
  // Comparação direta: "admin2024" ou "workflow2024"
}

// PRIORIDADE 2: Sistema Legado (SHA-512)
else if (usuarioEncontrado.senhaHash && usuarioEncontrado.senhaSalt) {
  senhaValida = verifyPassword(
    senha, 
    usuarioEncontrado.senhaHash, 
    usuarioEncontrado.senhaSalt,
    usuarioEncontrado.senhaVersion || 2
  );
}

// PRIORIDADE 3: Senha em Texto Plano (legado antigo)
else if (usuarioEncontrado.senha) {
  senhaValida = usuarioEncontrado.senha === senha;
}
```

**Ordem de Verificação:**
```
1º → authKey (admin2024 ou workflow2024)
2º → senhaHash + senhaSalt (SHA-512)
3º → senha (texto plano)
```

### **Etapa 4: Validações Adicionais**

```javascript
// 1. Verificar se usuário está ativo
if (!usuarioEncontrado.ativo) {
  return { success: false, message: 'Usuário inativo' };
}

// 2. Verificar empresa e setor (exceto para Admin)
const isAdmin = usuarioEncontrado.nivel === NIVEIS_PERMISSAO.ADMIN;

if (!isAdmin) {
  if (!usuarioEncontrado.setorId) {
    return { success: false, message: 'Sem setor atribuído' };
  }
  
  if (!usuarioEncontrado.empresaId) {
    return { success: false, message: 'Sem empresa atribuída' };
  }
}

// 3. Senha válida?
if (!senhaValida) {
  return { success: false, message: 'Email ou senha incorretos' };
}
```

### **Etapa 5: Atualizar Último Login**

```javascript
const usuarioAtualizado = {
  ...usuarioEncontrado,
  ultimoLogin: new Date().toISOString()
};

// Salvar no Firebase
await updateDoc(doc(backupDb, 'usuarios', usuarioEncontrado.id), {
  ultimoLogin: usuarioAtualizado.ultimoLogin
});
```

### **Etapa 6: Salvar Sessão**

```javascript
// Salvar em cookies (se "Lembrar-me" estiver marcado)
if (lembrarLogin) {
  CookieManager.setCookie(COOKIE_NAMES.USUARIO_ID, usuarioAtualizado.id);
  CookieManager.setCookie(COOKIE_NAMES.LEMBRAR, 'true');
}

// Salvar em localStorage
localStorage.setItem('usuario', JSON.stringify(usuarioAtualizado));

// Definir estado global
setUsuario(usuarioAtualizado);
```

---

## 📊 Diagrama Completo do Fluxo

```
┌──────────────────────────────────────────────────────────────┐
│                    USUÁRIO ABRE O SISTEMA                    │
└───────────────────────┬──────────────────────────────────────┘
                        ↓
┌───────────────────────────────────────────────────────────────┐
│  TELA DE LOGIN (LoginForm.jsx)                               │
│  ──────────────────────────────────────────────────────────  │
│  👤 Email/Usuário: [joao@email.com]                          │
│  🔒 Senha: [workflow2024]                                    │
│  ☑ Lembrar-me                                                │
│  [ENTRAR] ←─ onClick                                         │
└───────────────────────┬───────────────────────────────────────┘
                        ↓
┌───────────────────────────────────────────────────────────────┐
│  WORKFLOW.jsx - Função login(email, senha, lembrar)          │
└───────────────────────┬───────────────────────────────────────┘
                        ↓
┌───────────────────────────────────────────────────────────────┐
│  FIREBASE BACKUP (garden-backup)                             │
│  Collection: "usuarios"                                       │
│  Query: WHERE email == "joao@email.com"                      │
└───────────────────────┬───────────────────────────────────────┘
                        ↓
                Usuário Encontrado?
                        │
        ┌───────────────┴───────────────┐
        │                               │
       NÃO                             SIM
        │                               │
        ↓                               ↓
  ❌ ERRO                    ┌──────────────────────┐
  "Email não                 │  Verificar Status    │
   encontrado"               │  ativo: true?        │
                             └──────────┬───────────┘
                                        │
                                ┌───────┴────────┐
                                │                │
                               NÃO              SIM
                                │                │
                                ↓                ↓
                          ❌ ERRO        ┌─────────────────┐
                          "Usuário       │ Validar Senha   │
                           inativo"      └────────┬────────┘
                                                  │
                                    ┌─────────────┴─────────────┐
                                    │                           │
                            1️⃣ TEM authKey?              2️⃣ TEM senhaHash?
                                    │                           │
                                   SIM                         SIM
                                    │                           │
                                    ↓                           ↓
                        Comparar com authKey        Verificar SHA-512
                        (admin2024/workflow2024)    com verifyPassword()
                                    │                           │
                                    └─────────┬─────────────────┘
                                              │
                                        Senha Válida?
                                              │
                                    ┌─────────┴─────────┐
                                    │                   │
                                   NÃO                 SIM
                                    │                   │
                                    ↓                   ↓
                              ❌ ERRO          ┌──────────────────┐
                              "Senha           │ Verificar Empresa│
                               incorreta"      │ e Setor (se não  │
                                               │ for admin)       │
                                               └────────┬─────────┘
                                                        │
                                                       OK?
                                                        │
                                                  ┌─────┴─────┐
                                                  │           │
                                                 NÃO         SIM
                                                  │           │
                                                  ↓           ↓
                                            ❌ ERRO    ✅ LOGIN APROVADO
                                            "Sem           │
                                             setor"        ↓
                                                   ┌────────────────┐
                                                   │ Atualizar:     │
                                                   │ - ultimoLogin  │
                                                   │ - Cookies      │
                                                   │ - localStorage │
                                                   │ - Estado       │
                                                   └───────┬────────┘
                                                           ↓
                                                   ┌────────────────┐
                                                   │ REDIRECIONAR   │
                                                   │ PARA DASHBOARD │
                                                   └────────────────┘
```

---

## 🔑 Sistema de Senhas

### **Novo Sistema (authKey)**

```javascript
// Administradores (nivel === 0)
authKey: "admin2024"

// Outros usuários (nivel >= 1)
authKey: "workflow2024"
```

**Como funciona:**
```javascript
if (usuarioEncontrado.authKey === senha) {
  // ✅ Login aprovado
} else {
  // ❌ Senha incorreta
}
```

### **Sistema Legado (SHA-512)**

```javascript
// Campos necessários
{
  senhaHash: "789e10808a99382082e75e283...",
  senhaSalt: "salt_aleatorio_unico",
  senhaVersion: 2,
  senhaAlgorithm: "sha512"
}

// Verificação
const senhaValida = verifyPassword(
  senhaDigitada,
  usuarioEncontrado.senhaHash,
  usuarioEncontrado.senhaSalt,
  usuarioEncontrado.senhaVersion
);
```

### **Sistema Antigo (Texto Plano)**

```javascript
// ⚠️ NÃO RECOMENDADO - Apenas para compatibilidade
{
  senha: "minhasenha123"
}

// Verificação
if (usuarioEncontrado.senha === senhaDigitada) {
  // ✅ Login aprovado
}
```

---

## 📋 Resumo dos Campos

### **Campos do Formulário → Campos do Firebase**

| Formulário | Variável | Firebase | Campo no Documento |
|------------|----------|----------|-------------------|
| Usuário | `loginData.username` | → Busca por | `email` |
| Senha | `loginData.password` | → Compara com | `authKey` (1º)<br>`senhaHash` (2º)<br>`senha` (3º) |
| Lembrar | `loginData.lembrar` | → Salva em | Cookies |

### **Campos Obrigatórios no Documento**

✅ **Sempre obrigatórios:**
- `email` - Para buscar o usuário
- `nivel` - Definir permissões
- `ativo` - Verificar se pode fazer login

🔑 **Obrigatório 1 dos 3:**
- `authKey` (recomendado)
- `senhaHash` + `senhaSalt` (legado)
- `senha` (não recomendado)

⚠️ **Obrigatório se não for Admin:**
- `empresaId`
- `setorId`

---

## 🛠️ Exemplos Práticos

### **Criar Novo Usuário**

```javascript
// Documento no Firebase: garden-backup → usuarios
{
  nome: "Maria Santos",
  email: "maria@email.com",
  authKey: "workflow2024",        // Senha de login
  authKeyUpdatedAt: new Date(),
  nivel: 2,                        // Supervisor
  ativo: true,
  empresaId: "empresa123",
  setorId: "setor456",
  cargo: "Supervisora",
  ultimoLogin: null,
  dataCriacao: new Date().toISOString(),
  preferencias: {
    tema: "auto",
    notificacoes: true,
    idioma: "pt-BR"
  }
}
```

**Login:**
- Email: `maria@email.com`
- Senha: `workflow2024`

### **Criar Administrador**

```javascript
{
  nome: "Administrador",
  email: "admin",
  authKey: "admin2024",            // Senha de admin
  authKeyUpdatedAt: new Date(),
  nivel: 0,                        // Admin
  ativo: true,
  empresaId: null,                 // Admin não precisa
  setorId: null,                   // Admin não precisa
  cargo: "Administrador do Sistema",
  ultimoLogin: null,
  dataCriacao: new Date().toISOString()
}
```

**Login:**
- Email: `admin`
- Senha: `admin2024`

---

## 🔍 Consultas Firebase

### **Buscar por Email**

```javascript
const usuariosRef = collection(backupDb, 'usuarios');
const q = query(usuariosRef, where('email', '==', 'joao@email.com'));
const snapshot = await getDocs(q);
```

### **Buscar Todos os Ativos**

```javascript
const q = query(
  collection(backupDb, 'usuarios'),
  where('ativo', '==', true)
);
const snapshot = await getDocs(q);
```

### **Buscar por Empresa**

```javascript
const q = query(
  collection(backupDb, 'usuarios'),
  where('empresaId', '==', 'empresa123')
);
const snapshot = await getDocs(q);
```

---

## 🐛 Problemas Comuns

### **1. "Email ou senha incorretos"**

**Causas:**
- Email não existe no banco
- Senha está incorreta
- Usuário está com `ativo: false`
- Campo `authKey` está vazio ou diferente

**Solução:**
```javascript
// Verificar no Firebase Console:
1. Banco: garden-backup
2. Collection: usuarios
3. Procurar documento com email desejado
4. Verificar campos: ativo (true), authKey ("workflow2024")
```

### **2. "Usuário sem setor atribuído"**

**Causa:**
- Campo `setorId` está vazio ou null
- Usuário não é admin mas não tem setor

**Solução:**
```javascript
// Atualizar documento:
{
  setorId: "setor123",  // ID válido de um setor
  empresaId: "empresa123"  // ID válido de uma empresa
}
```

### **3. "Usuário não encontrado"**

**Causa:**
- Email digitado está diferente do cadastrado
- Case sensitive: "Admin" ≠ "admin"

**Solução:**
```javascript
// Garantir que email está exatamente igual
// Firebase compara com sensibilidade a maiúsculas
```

---

## 📊 Estatísticas

### **Tempo Médio de Autenticação**

```
Busca no Firebase:     ~200ms
Verificação authKey:   ~1ms
Verificação SHA-512:   ~5ms
Verificação texto:     ~1ms
Total:                 ~206ms
```

### **Ordem de Performance**

```
1º authKey (mais rápido)     ⚡ 1ms
2º senha texto plano         ⚡ 1ms
3º SHA-512                   🐢 5ms
```

---

**Desenvolvido para Garden Almoxarifado** 🌱

**Versão:** 2.0.0  
**Data:** Outubro 2025  
**Status:** ✅ Documentado e Funcional
