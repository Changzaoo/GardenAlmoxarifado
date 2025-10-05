# 🗄️ Estrutura de Bancos de Dados - Sistema de Senhas

## 📊 Visão Geral

O sistema utiliza **2 bancos de dados Firebase**:

### 1. **garden-c0b50** (Principal) ✅
- **Projeto:** garden-c0b50  
- **Status:** PRINCIPAL E ATIVO
- **Uso:** Armazenamento de TODOS os dados do sistema
- **Collections:**
  - `usuarios` ← **SENHAS ARMAZENADAS AQUI**
  - `funcionarios`
  - `inventario`
  - `emprestimos`
  - `tarefas`
  - `empresas`
  - `setores`
  - `avaliacoes`
  - E outras...

### 2. **workflowbr1** (Secundário) 🔄
- **Projeto:** workflowbr1
- **Status:** SECUNDÁRIO (apenas para login)
- **Uso:** Tentativa de login alternativa
- **Collections:**
  - `usuarios` ← Apenas para consulta no login

---

## 🔐 Como Funciona a Autenticação

### **Fluxo de Login:**

```
┌─────────────────────────────────────┐
│  Usuário faz login                  │
│  (username + password)              │
└────────────┬────────────────────────┘
             │
             ▼
     ┌───────────────────┐
     │ 1º Tentativa:     │
     │ workflowbr1       │
     └───────┬───────────┘
             │
       Encontrou? ──── NÃO ────┐
             │                  │
            SIM                 │
             │                  ▼
             ▼          ┌───────────────────┐
    ┌─────────────┐    │ 2º Tentativa:     │
    │ Autentica   │    │ garden-c0b50      │
    │ e faz login │    │ (PRINCIPAL)       │
    └─────────────┘    └───────┬───────────┘
                               │
                         Encontrou?
                               │
                          SIM──┴──NÃO
                           │       │
                           ▼       ▼
                  ┌─────────────┐  ┌──────────┐
                  │ Autentica   │  │  Erro:   │
                  │ e faz login │  │ Usuário  │
                  └─────────────┘  │não existe│
                                   └──────────┘
```

---

## 📍 Onde as Senhas Estão Realmente Armazenadas

### **Banco PRINCIPAL: garden-c0b50**

```
garden-c0b50 (Firebase Project)
└── usuarios (Collection)
    └── {userId} (Document)
        ├── nome: "João Silva"
        ├── email: "joao@email.com"
        ├── senha: "hash_da_senha_aqui"      ← SENHA AQUI
        ├── senhaSalt: "salt_aleatorio"
        ├── senhaHash: "hash_sha512"
        ├── senhaVersion: 2
        ├── nivel: 1
        ├── ativo: true
        ├── empresaId: "empresa123"
        ├── setorId: "setor456"
        └── ultimoLogin: "2025-10-05T21:00:00Z"
```

### **Banco SECUNDÁRIO: workflowbr1**

```
workflowbr1 (Firebase Project)
└── usuarios (Collection)
    └── {userId} (Document)
        ├── nome: "Maria Santos"
        ├── email: "maria@email.com"
        ├── senha: "hash_da_senha_aqui"      ← SENHA AQUI (se existir)
        ├── nivel: 2
        └── ativo: true
```

⚠️ **IMPORTANTE:** workflowbr1 é usado APENAS para login, NÃO para criar novos usuários!

---

## 🎯 Criação de Novos Usuários

### **Onde são salvos:**

Por padrão, **TODOS os novos usuários** são salvos em:
- **garden-c0b50** → `usuarios` collection

### **Como configurar:**

Na página de **Usuários**, há um componente **"Configuração de Banco de Dados"** que permite escolher:

1. **garden-c0b50** (Principal) ✅ - Recomendado
2. **workflowbr1** (Secundário) - Apenas se necessário

A configuração é salva em `localStorage`:
```javascript
localStorage.getItem('preferred_users_database')
// Retorna: 'garden-c0b50' ou 'workflowbr1'
```

---

## 🔧 Configuração de Banco na Interface

### **Componente: DatabaseConfigSelector**

Localização: `src/components/usuarios/DatabaseConfigSelector.jsx`

**Recursos:**
- ✅ Visualizar banco atual
- ✅ Alternar entre bancos disponíveis
- ✅ Ver collections de cada banco
- ✅ Status e descrição de cada banco
- ✅ Avisos sobre impacto da mudança

**Como usar:**
1. Acesse: **Configurações** → **Usuários**
2. Encontre: **"Configuração de Banco de Dados"**
3. Clique no ícone de **engrenagem** (Settings)
4. Selecione o banco desejado
5. Configuração é salva automaticamente

---

## 📋 Informações Exibidas por Usuário

Na lista de usuários, cada card mostra:

```
┌─────────────────────────────────────┐
│  👤 Nome do Usuário         [Ativo] │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                     │
│  📧 usuario@email.com               │
│                                     │
│  🔒 ••••••••  👁️                   │  ← Senha (oculta)
│                                     │
│  📊 Banco:    garden-c0b50 [PRINCIPAL] │
│  📁 Coleção:  usuarios              │
│  🔑 Campo:    senha                 │
│  🔄 Login tenta: 1º workflowbr1,    │
│                  2º garden-c0b50    │
└─────────────────────────────────────┘
```

---

## 🔍 Como Verificar Onde um Usuário Está

### **Método 1: Interface do Sistema**

1. Acesse **Configurações** → **Usuários**
2. Localize o usuário no card
3. Veja a seção **"Informações do Banco de Dados"**
4. Campo **"📊 Banco:"** mostra onde ele está

### **Método 2: Firebase Console**

#### garden-c0b50:
```
https://console.firebase.google.com/u/0/project/garden-c0b50/firestore/data/usuarios
```

#### workflowbr1:
```
https://console.firebase.google.com/u/0/project/workflowbr1/firestore/data/usuarios
```

### **Método 3: Código**

```javascript
// Buscar em garden-c0b50
import { db } from './firebaseConfig';
import { collection, getDocs, query, where } from 'firebase/firestore';

const buscarUsuario = async (email) => {
  const q = query(collection(db, 'usuarios'), where('email', '==', email));
  const snapshot = await getDocs(q);
  
  if (!snapshot.empty) {
    console.log('Usuário encontrado em garden-c0b50');
    return snapshot.docs[0].data();
  }
  
  return null;
};
```

---

## ⚙️ Arquivos de Configuração

### **1. firebaseConfig.js** (Principal)
- **Projeto:** garden-c0b50
- **Exporta:** `db`, `auth`, `storage`
- **Usado em:** 95% do sistema

```javascript
export const db = getFirestore(app); // garden-c0b50
```

### **2. firebaseWorkflowBR1.js** (Secundário)
- **Projeto:** workflowbr1
- **Exporta:** `dbWorkflowBR1`, `storage`
- **Usado em:** Apenas para login alternativo

```javascript
export const dbWorkflowBR1 = getFirestore(appWorkflowBR1);
```

---

## 📊 Estatísticas dos Bancos

### **garden-c0b50:**
```
Collections:      ~15+
Usuários (aprox): 50-100
Uso:              Principal
Status:           ✅ Ativo
Backup:           Automático
```

### **workflowbr1:**
```
Collections:      ~3
Usuários (aprox): 5-10
Uso:              Secundário (login)
Status:           🔄 Leitura apenas
Backup:           Manual
```

---

## 🔐 Segurança

### **Senhas são:**
- ✅ Criptografadas com SHA-512
- ✅ Armazenadas com salt único
- ✅ Nunca exibidas em logs
- ✅ Versionadas (v2 atual)

### **Regras de Firestore:**
```javascript
// garden-c0b50 - usuarios
match /usuarios/{userId} {
  allow read: if request.auth != null && 
              (request.auth.uid == userId || isAdmin());
  allow write: if isAdmin();
}
```

---

## 🚀 Migração Entre Bancos

### **Se precisar migrar usuários:**

1. **Exportar do banco atual:**
```bash
firebase firestore:export gs://bucket/usuarios
```

2. **Importar para novo banco:**
```bash
firebase firestore:import gs://bucket/usuarios
```

3. **Verificar integridade:**
```javascript
// Script de verificação
const verificarMigracao = async () => {
  const origem = await getDocs(collection(dbOrigem, 'usuarios'));
  const destino = await getDocs(collection(dbDestino, 'usuarios'));
  
  console.log(`Origem: ${origem.size} usuários`);
  console.log(`Destino: ${destino.size} usuários`);
  
  return origem.size === destino.size;
};
```

---

## 📝 Recomendações

### ✅ **Fazer:**
1. Usar **garden-c0b50** para novos usuários
2. Manter backup regular de ambos os bancos
3. Documentar qualquer mudança de configuração
4. Testar login após mudanças

### ❌ **Evitar:**
1. Criar usuários manualmente no workflowbr1
2. Alterar configuração sem necessidade
3. Deletar usuários sem backup
4. Compartilhar credenciais do Firebase

---

## 🐛 Troubleshooting

### **Usuário não consegue fazer login:**

1. ✅ Verificar se existe em **garden-c0b50**
2. ✅ Verificar se existe em **workflowbr1**
3. ✅ Conferir se senha está correta
4. ✅ Verificar se usuário está **ativo: true**
5. ✅ Conferir empresaId e setorId (para não-admin)

### **Senha não aparece na interface:**

1. ✅ Verificar se campo `senha` existe no documento
2. ✅ Confirmar permissões de leitura no Firestore
3. ✅ Verificar console do navegador para erros
4. ✅ Confirmar que usuário logado é admin

### **Erro ao criar usuário:**

1. ✅ Verificar qual banco está configurado
2. ✅ Confirmar permissões de escrita
3. ✅ Verificar se email já existe
4. ✅ Validar campos obrigatórios

---

## 📚 Links Úteis

- [Firebase Console - garden-c0b50](https://console.firebase.google.com/u/0/project/garden-c0b50)
- [Firebase Console - workflowbr1](https://console.firebase.google.com/u/0/project/workflowbr1)
- [Documentação Firebase](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)

---

**Desenvolvido para Garden Almoxarifado** 🌱

**Status:** ✅ Documentado e Funcional  
**Versão:** 2.0.0  
**Data:** Outubro 2025
