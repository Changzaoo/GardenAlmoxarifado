# 🔄 Sistema de Sincronização e Backup de Bancos de Dados

## 📋 Visão Geral

Sistema completo para gerenciar, sincronizar e fazer backup de usuários entre os **3 bancos de dados Firebase** do sistema:

1. **garden-c0b50** (Principal) 🌱
2. **workflowbr1** (Secundário) 🔄
3. **garden-backup** (Backup) ☁️

---

## 🎯 Funcionalidades Principais

### 1. **Visualização em Tempo Real**
- ✅ Contagem de usuários em cada banco
- ✅ Status de cada banco (Principal/Secundário/Backup)
- ✅ Indicadores visuais com ícones e cores

### 2. **Sincronização Manual**
- ✅ Copiar usuários de qualquer banco para outro
- ✅ Escolher origem e destino
- ✅ Backup completo automático (garden → workflow + backup)
- ✅ Progress tracking em tempo real

### 3. **Gerenciamento de Campo de Senha**
- ✅ Criar campo de senha em usuários que não possuem
- ✅ Alterar nome do campo de senha (ex: senha → password)
- ✅ Migrar campo de senha entre diferentes nomes
- ✅ Garantir que todos os usuários tenham o campo

### 4. **Histórico de Sincronizações**
- ✅ Registro de todas as sincronizações realizadas
- ✅ Contagem de sucessos e erros
- ✅ Timestamp de cada operação
- ✅ Últimas 10 operações exibidas

---

## 🗄️ Estrutura dos Bancos de Dados

### **garden-c0b50** (Principal)
```
📊 Status: PRINCIPAL E ATIVO
📍 Project ID: garden-c0b50
🎯 Uso: Armazenamento principal de todos os dados
📁 Collections:
   ├── usuarios (senhas armazenadas aqui)
   ├── funcionarios
   ├── inventario
   ├── emprestimos
   ├── tarefas
   ├── empresas
   ├── setores
   └── ... (todas as outras)
```

### **workflowbr1** (Secundário)
```
📊 Status: SECUNDÁRIO
📍 Project ID: workflowbr1
🎯 Uso: Login alternativo
📁 Collections:
   └── usuarios (apenas para consulta no login)
```

### **garden-backup** (Backup)
```
📊 Status: BACKUP
📍 Project ID: garden-backup
🎯 Uso: Cópia de segurança
📁 Collections:
   └── usuarios (backup completo)
```

---

## 🚀 Como Usar

### **Acessar a Interface**

1. Faça login como **Administrador**
2. No menu lateral, clique em **"Sync DB"** (ícone de RefreshCw)
3. A interface de sincronização será aberta

### **Sincronização Manual**

```
┌─────────────────────────────────────────┐
│  [Origem: garden-c0b50]  →  [Destino]  │
│                                         │
│  [Sincronizar Usuários]  [Backup]  [↻] │
└─────────────────────────────────────────┘
```

**Passos:**
1. Selecione o **banco de origem** (de onde copiar)
2. Selecione o **banco de destino** (para onde copiar)
3. Clique em **"Sincronizar Usuários"**
4. Aguarde a conclusão
5. Veja o resultado no status e histórico

### **Backup Completo Automático**

```
┌─────────────────────────────────┐
│  garden-c0b50                   │
│       ↓                         │
│  ┌─────────┬─────────┐         │
│  workflowbr1  garden-backup    │
└─────────────────────────────────┘
```

**Passos:**
1. Clique em **"Backup Completo"**
2. Confirme a operação
3. Sistema copiará automaticamente de **garden-c0b50** para os outros 2 bancos
4. Aguarde a conclusão

---

## 🔐 Gerenciamento de Senhas

### **Criar Campo de Senha**

Se um usuário não possui o campo de senha:

```javascript
Usuário SEM campo:
{
  id: "abc123",
  nome: "João",
  email: "joao@email.com"
  // ❌ Sem campo "senha"
}

Usuário COM campo (após criação):
{
  id: "abc123",
  nome: "João",
  email: "joao@email.com",
  senha: "123456",           // ✅ Campo criado
  senhaVersion: 1
}
```

**Como usar:**
1. Escolha um banco de dados (ex: garden-c0b50)
2. Clique em **"Criar Campo Senha"**
3. Sistema criará o campo em todos os usuários que não possuem
4. Valor padrão: `userData.senha || userData.password || '123456'`

### **Alterar Nome do Campo**

Migrar de um nome de campo para outro:

```javascript
ANTES:
{
  id: "abc123",
  senha: "minhasenha123"      // ✅ Campo antigo
}

DEPOIS:
{
  id: "abc123",
  password: "minhasenha123",  // ✅ Novo campo
  senha: null                  // ❌ Removido
}
```

**Como usar:**
1. Escolha um banco de dados
2. Clique em **"Alterar Campo Senha"**
3. Digite o novo nome do campo (ex: `password`, `pwd`, `key`)
4. Sistema migrará todos os usuários

### **Configurar Nome Padrão**

Define qual campo será usado nas operações:

```
┌──────────────────────────────────────┐
│  Configuração do Campo de Senha     │
│  ───────────────────────────────── │
│  Nome do Campo: [senha         ]    │
│  [Editar]  [Salvar]                 │
└──────────────────────────────────────┘
```

**Uso:**
1. Clique em **"Editar"**
2. Digite o nome desejado
3. Clique em **"Salvar"**
4. Preferência salva em `localStorage`

---

## 📊 Interface Visual

### **Cards dos Bancos**

```
┌───────────────────────────┐  ┌───────────────────────────┐  ┌───────────────────────────┐
│ 🌱 Garden C0B50           │  │ 🔄 WorkflowBR1            │  │ ☁️ Garden Backup          │
│ Banco principal       [●] │  │ Banco secundário          │  │ Banco de backup           │
│ ────────────────────────  │  │ ────────────────────────  │  │ ────────────────────────  │
│ 👥 125 usuários           │  │ 👥 50 usuários            │  │ 👥 100 usuários           │
│                           │  │                           │  │                           │
│ [🔒 Criar Campo Senha]    │  │ [🔒 Criar Campo Senha]    │  │ [🔒 Criar Campo Senha]    │
│ [✏️ Alterar Campo Senha]  │  │ [✏️ Alterar Campo Senha]  │  │ [✏️ Alterar Campo Senha]  │
└───────────────────────────┘  └───────────────────────────┘  └───────────────────────────┘
```

### **Status de Sincronização**

```
✅ SUCESSO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ 125 usuários sincronizados com sucesso!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❌ ERRO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ Erro: Permission denied
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔄 SINCRONIZANDO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔄 Sincronizando de garden-c0b50 para workflowbr1...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### **Histórico**

```
📝 Histórico de Sincronizações
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ garden-c0b50 → workflowbr1        05/10/2025 21:45:30
   125/125 usuários sincronizados

✅ garden-c0b50 → garden-backup      05/10/2025 21:40:15
   120/120 usuários sincronizados

❌ workflowbr1 → garden-backup       05/10/2025 21:35:00
   45/50 usuários sincronizados · 5 erros
```

---

## 🔧 Código e Implementação

### **Arquivos Principais**

```
src/
├── components/
│   └── Admin/
│       └── DatabaseSyncManager.jsx   ← Componente principal
├── config/
│   ├── firebaseConfig.js             ← garden-c0b50
│   ├── firebaseWorkflowBR1.js        ← workflowbr1
│   └── firebaseDual.js               ← garden-backup
└── utils/
    └── databaseSync.js               ← Utilitários (se necessário)
```

### **Importações Necessárias**

```javascript
// Firebase
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  updateDoc,
  writeBatch 
} from 'firebase/firestore';

// Bancos de dados
import { db } from '../../firebaseConfig';                    // garden-c0b50
import { dbWorkflowBR1 } from '../../config/firebaseWorkflowBR1'; // workflowbr1
import { primaryDb as dbBackup } from '../../config/firebaseDual'; // garden-backup

// Icons
import { 
  Database, 
  RefreshCw, 
  Copy, 
  Users,
  Lock,
  Edit3,
  Save
} from 'lucide-react';
```

### **Função de Sincronização**

```javascript
const syncUsers = async (sourceKey, targetKey) => {
  const source = databases[sourceKey];
  const target = databases[targetKey];

  try {
    // 1. Buscar usuários do banco de origem
    const sourceRef = collection(source.db, 'usuarios');
    const sourceSnapshot = await getDocs(sourceRef);
    
    // 2. Copiar cada usuário para o banco de destino
    for (const userDoc of sourceSnapshot.docs) {
      const userData = userDoc.data();
      const targetRef = doc(target.db, 'usuarios', userDoc.id);
      
      // Garantir que campo de senha existe
      if (!userData[passwordFieldName]) {
        userData[passwordFieldName] = userData.senha || '';
      }

      await setDoc(targetRef, userData, { merge: true });
    }
    
    // 3. Registrar no histórico
    setSyncHistory(prev => [historyEntry, ...prev]);
    
  } catch (error) {
    console.error('Erro na sincronização:', error);
  }
};
```

### **Criar Campo de Senha**

```javascript
const ensurePasswordField = async (dbKey) => {
  const dbConfig = databases[dbKey];
  const usersRef = collection(dbConfig.db, 'usuarios');
  const snapshot = await getDocs(usersRef);
  
  const batch = writeBatch(dbConfig.db);
  
  for (const userDoc of snapshot.docs) {
    const userData = userDoc.data();
    
    // Se não tem campo de senha, criar
    if (!userData[passwordFieldName]) {
      const userRef = doc(dbConfig.db, 'usuarios', userDoc.id);
      batch.update(userRef, {
        [passwordFieldName]: userData.senha || '123456',
        senhaVersion: 1
      });
    }
  }
  
  await batch.commit();
};
```

### **Alterar Nome do Campo**

```javascript
const updatePasswordFieldName = async (dbKey, newFieldName) => {
  const dbConfig = databases[dbKey];
  const usersRef = collection(dbConfig.db, 'usuarios');
  const snapshot = await getDocs(usersRef);
  
  const batch = writeBatch(dbConfig.db);
  
  for (const userDoc of snapshot.docs) {
    const userData = userDoc.data();
    const oldPassword = userData[passwordFieldName] || '';
    
    const userRef = doc(dbConfig.db, 'usuarios', userDoc.id);
    batch.update(userRef, {
      [newFieldName]: oldPassword,     // Novo campo
      [passwordFieldName]: null        // Remover antigo
    });
  }
  
  await batch.commit();
  setPasswordFieldName(newFieldName);
};
```

---

## 🛡️ Segurança e Permissões

### **Acesso Restrito**

```javascript
// Apenas ADMIN pode acessar
{abaAtiva === 'sync-database' && (
  temPermissao(NIVEIS_PERMISSAO.ADMIN) ? (
    <DatabaseSyncManager />
  ) : (
    <PermissionDenied message="Apenas administradores podem sincronizar bancos de dados." />
  )
)}
```

### **Regras do Firestore**

Cada banco deve ter as seguintes regras:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /usuarios/{userId} {
      // Leitura: Usuário logado ou admin
      allow read: if request.auth != null && 
                  (request.auth.uid == userId || isAdmin());
      
      // Escrita: Apenas admin
      allow write: if isAdmin();
    }
    
    function isAdmin() {
      return get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.nivel >= 4;
    }
  }
}
```

---

## ⚠️ Avisos Importantes

### 🔴 **Atenção ao Sincronizar**

1. **Sobrescrever Dados:**
   - A sincronização usa `merge: true`
   - Dados existentes são **preservados**
   - Novos campos são **adicionados**
   - Conflitos são **resolvidos** pelo destino

2. **Performance:**
   - Sincronizar muitos usuários (1000+) pode demorar
   - Use "Backup Completo" fora do horário de pico
   - Cada usuário = 1 operação de escrita

3. **Custos Firebase:**
   - Cada sincronização consome quota de leituras e escritas
   - 125 usuários = 125 leituras + 125 escritas
   - Monitore o uso no Firebase Console

### 🟡 **Boas Práticas**

✅ **Fazer:**
- Testar sincronização com poucos usuários primeiro
- Fazer backup completo 1x por dia
- Verificar histórico após cada operação
- Manter logs de sincronização

❌ **Evitar:**
- Sincronizar durante horários de pico
- Fazer múltiplas sincronizações simultâneas
- Alterar campo de senha sem backup
- Deletar usuários sem verificar outros bancos

---

## 📈 Monitoramento

### **Verificar Status dos Bancos**

```javascript
// No componente
const [userCounts, setUserCounts] = useState({});

useEffect(() => {
  loadUserCounts();
}, []);

// garden-c0b50: 125 usuários
// workflowbr1: 50 usuários
// garden-backup: 100 usuários
```

### **Histórico de Sincronizações**

Armazenado em estado local (não persiste entre reloads):

```javascript
const [syncHistory, setSyncHistory] = useState([]);

// Formato:
{
  timestamp: "2025-10-05T21:45:30Z",
  source: "garden-c0b50",
  target: "workflowbr1",
  totalUsers: 125,
  syncedCount: 125,
  errorCount: 0,
  success: true
}
```

---

## 🐛 Troubleshooting

### **Problema: Sincronização não funciona**

**Sintomas:**
- Clica em "Sincronizar" mas nada acontece
- Erro: "Permission denied"

**Soluções:**
1. ✅ Verificar se está logado como Admin
2. ✅ Conferir regras do Firestore
3. ✅ Verificar console do navegador para erros
4. ✅ Testar conexão com Firebase

### **Problema: Usuários com campos diferentes**

**Sintomas:**
- Alguns usuários têm `senha`, outros `password`
- Campos inconsistentes entre bancos

**Soluções:**
1. Use **"Alterar Campo Senha"** para padronizar
2. Execute em todos os bancos
3. Verifique com consulta manual

### **Problema: Backup demora muito**

**Sintomas:**
- "Backup Completo" demora mais de 5 minutos
- Browser congela

**Soluções:**
1. Reduza número de usuários por lote
2. Adicione delays entre batches
3. Execute fora do horário de pico

---

## 📚 Exemplos de Uso

### **Cenário 1: Novo Banco de Dados**

```
Situação: Criou garden-backup e precisa popular

Passos:
1. Acesse "Sync DB"
2. Origem: garden-c0b50
3. Destino: garden-backup
4. Clique "Sincronizar Usuários"
5. Aguarde conclusão
6. Verifique contagem de usuários
```

### **Cenário 2: Migrar Campo de Senha**

```
Situação: Sistema usa "senha", precisa mudar para "password"

Passos:
1. Escolha garden-c0b50
2. Clique "Alterar Campo Senha"
3. Digite: "password"
4. Confirme operação
5. Repita para workflowbr1
6. Repita para garden-backup
7. Atualize código para usar "password"
```

### **Cenário 3: Backup Diário Automático**

```
Situação: Precisa fazer backup todos os dias

Solução Manual:
1. Acesse "Sync DB" às 23:00
2. Clique "Backup Completo"
3. Aguarde conclusão
4. Verifique histórico

Solução Automática (futuro):
- Agendar Cloud Function
- Executar diariamente
- Enviar notificação ao admin
```

---

## 🎯 Roadmap Futuro

### **Planejado:**

- [ ] Backup automático agendado
- [ ] Notificação por email após backup
- [ ] Comparação de diferenças entre bancos
- [ ] Rollback de sincronização
- [ ] Export/Import JSON
- [ ] Logs persistentes no Firebase
- [ ] Dashboard de métricas de sync
- [ ] Filtros de sincronização (por empresa, setor, etc.)

---

## 📞 Suporte

**Em caso de problemas:**

1. Verifique a documentação acima
2. Consulte o histórico de sincronizações
3. Verifique logs do console do navegador
4. Entre em contato com o administrador do sistema

---

**Desenvolvido para Garden Almoxarifado** 🌱

**Versão:** 2.0.0  
**Data:** Outubro 2025  
**Status:** ✅ Funcional e Testado

