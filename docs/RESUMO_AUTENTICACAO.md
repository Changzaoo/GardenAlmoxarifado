# 🔐 RESUMO RÁPIDO - Sistema de Autenticação

## 📊 INFORMAÇÕES PRINCIPAIS

### **Banco de Dados Usado no Login:**
```
🗄️ garden-backup
   └── 📁 Collection: usuarios
```

### **Campo de Busca:**
```
🔍 Campo: email
   Exemplo: "joao@email.com" ou "admin"
```

### **Campos de Senha (em ordem de prioridade):**
```
1️⃣ authKey → "admin2024" ou "workflow2024" (NOVO)
2️⃣ senhaHash + senhaSalt → SHA-512 (LEGADO)
3️⃣ senha → Texto plano (ANTIGO)
```

---

## 🎯 FLUXO SIMPLIFICADO

```
USUÁRIO DIGITA:
├── Email: "joao@email.com"
└── Senha: "workflow2024"
        ↓
SISTEMA BUSCA NO FIREBASE:
├── Banco: garden-backup
├── Collection: usuarios
└── WHERE email == "joao@email.com"
        ↓
ENCONTROU USUÁRIO?
├── ✅ SIM → Validar senha
└── ❌ NÃO → Erro "Email não encontrado"
        ↓
VALIDAR SENHA:
├── Tem authKey? → Comparar direto
├── Tem senhaHash? → Verificar SHA-512
└── Tem senha? → Comparar texto
        ↓
SENHA VÁLIDA?
├── ✅ SIM → Verificar empresa/setor
└── ❌ NÃO → Erro "Senha incorreta"
        ↓
TEM EMPRESA E SETOR? (se não for admin)
├── ✅ SIM → LOGIN APROVADO
└── ❌ NÃO → Erro "Sem setor"
        ↓
✅ LOGIN REALIZADO
```

---

## 📝 ESTRUTURA DO DOCUMENTO

```javascript
{
  // BUSCA
  email: "joao@email.com",        // ← Campo usado para buscar
  
  // AUTENTICAÇÃO
  authKey: "workflow2024",        // ← Senha de login (PRINCIPAL)
  senhaHash: "789e10808...",      // ← Fallback SHA-512
  senhaSalt: "salt_xxx",          // ← Salt para SHA-512
  senha: "texto_plano",           // ← Fallback antigo
  
  // CONTROLE
  ativo: true,                    // ← Deve ser true
  nivel: 2,                       // ← 0=Admin, 1-6=outros
  
  // VINCULAÇÃO (obrigatório se não for admin)
  empresaId: "empresa123",
  setorId: "setor456"
}
```

---

## 🔑 SENHAS PADRÃO

```
👑 ADMINISTRADOR (nivel: 0)
   Email: admin
   Senha: admin2024
   authKey: "admin2024"

👤 OUTROS USUÁRIOS (nivel: 1-6)
   Email: usuario@email.com
   Senha: workflow2024
   authKey: "workflow2024"
```

---

## ⚡ RESUMO TÉCNICO

| Item | Valor |
|------|-------|
| **Banco** | `garden-backup` |
| **Collection** | `usuarios` |
| **Campo de busca** | `email` |
| **Campo de senha** | `authKey` (1º), `senhaHash` (2º), `senha` (3º) |
| **Tipo de query** | `where('email', '==', valorDigitado)` |
| **Validação extra** | `ativo === true` |
| **Obrigatório (não-admin)** | `empresaId` e `setorId` |

---

## 🛠️ EXEMPLO DE LOGIN

### **Usuário Normal:**
```
Formulário:
  Email: maria@empresa.com
  Senha: workflow2024

Firebase Query:
  Collection: usuarios
  WHERE: email == "maria@empresa.com"
  
Validação:
  authKey == "workflow2024" → ✅ APROVADO
  ativo == true → ✅ OK
  empresaId != null → ✅ OK
  setorId != null → ✅ OK
  
Resultado: ✅ LOGIN REALIZADO
```

### **Administrador:**
```
Formulário:
  Email: admin
  Senha: admin2024

Firebase Query:
  Collection: usuarios
  WHERE: email == "admin"
  
Validação:
  authKey == "admin2024" → ✅ APROVADO
  ativo == true → ✅ OK
  nivel == 0 (admin) → ✅ OK
  empresaId/setorId → Não necessário para admin
  
Resultado: ✅ LOGIN REALIZADO
```

---

## 🚫 ERROS COMUNS

```
❌ "Email ou senha incorretos"
   → Email não existe no banco
   → authKey está diferente
   → ativo: false

❌ "Usuário sem setor atribuído"
   → setorId está null/vazio
   → Usuário não é admin

❌ "Usuário sem empresa atribuída"
   → empresaId está null/vazio
   → Usuário não é admin
```

---

## 📍 LOCALIZAÇÃO NO CÓDIGO

```
Login UI:
  src/components/Auth/LoginForm.jsx
  → Campos: username, password, lembrar

Lógica de Login:
  src/components/Workflow.jsx (linha 751)
  → Função: login(email, senha, lembrarLogin)

Banco de Dados:
  src/config/firebaseDual.js
  → export const backupDb
  → projectId: "garden-backup"
```

---

**🌱 Garden Almoxarifado - Sistema de Autenticação**  
**Versão:** 2.0.0 | **Status:** ✅ Ativo
