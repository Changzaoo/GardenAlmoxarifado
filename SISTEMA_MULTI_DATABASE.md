# 🗄️ Sistema Multi-Database Firebase

## 📋 Resumo Executivo

Sistema completo para gerenciar múltiplos bancos de dados Firebase com rotação automática, permitindo adicionar, remover e configurar novos bancos através de interface administrativa.

---

## 🎯 O que foi implementado

### 1️⃣ **firebaseMulti.js** - Gerenciador Multi-Database

Substitui o `firebaseDual.js` anterior com suporte para **ilimitados bancos de dados**.

#### Bancos Pré-configurados:
1. **Garden Principal** (`primary`) - garden-c0b50
2. **Garden Backup** (`backup`) - garden-backup  
3. **Workflow BR1** (`workflowbr1`) - workflowbr1 ✨ **NOVO**

#### Funcionalidades:
- ✅ Suporte para múltiplos bancos de dados
- ✅ Rotação automática entre todos os bancos
- ✅ Priorização configurável
- ✅ Habilitar/desabilitar bancos individualmente
- ✅ Persistência em localStorage
- ✅ Hot-reload de novos bancos

---

### 2️⃣ **DatabaseManagementPage.jsx** - Interface Administrativa

Interface completa para gerenciar todos os bancos de dados.

#### Funcionalidades:
- ✅ **Adicionar novos bancos** via formulário
- ✅ **Colar configuração** direto do Firebase Console
- ✅ **Alternar banco ativo** com um clique
- ✅ **Visualizar status** de cada banco
- ✅ **Gerenciar rotação** e prioridades
- ✅ **Dashboard visual** com métricas
- ✅ **Dark mode** completo

---

### 3️⃣ **Integração no Menu Principal**

Novo item no menu administrativo: **"Gerenciar Bancos de Dados"**
- Visível apenas para administradores (nível 4)
- Acesso via menu lateral
- Ícone: Settings (⚙️)

---

## 🚀 Como Usar

### 📱 Adicionar Novo Banco de Dados

#### Método 1: Interface Visual (Recomendado)

1. **Faça login como administrador** (nível 4)

2. **Acesse o menu**: "Gerenciar Bancos de Dados"

3. **Clique em "Adicionar Banco"**

4. **Opção A - Colar configuração**:
   - Copie o código de configuração do Firebase Console
   - Clique em "Colar Configuração do Firebase"
   - Sistema preenche automaticamente os campos!

5. **Opção B - Preencher manualmente**:
   ```
   Nome: Workflow BR1
   Descrição: Banco de dados adicional
   Project ID: workflowbr1
   API Key: AIzaSyC6IoQBbNZ1QCMNZAM79KRUJ-TRvWlnliY
   Auth Domain: workflowbr1.firebaseapp.com
   Storage Bucket: workflowbr1.firebasestorage.app
   Messaging Sender ID: 207274549565
   App ID: 1:207274549565:web:4d7755e8424b74c6712554
   Measurement ID: G-TYRLWERZMS (opcional)
   Prioridade: 10
   ✓ Habilitar banco de dados
   ```

6. **Clique em "Adicionar Banco"**

7. **Pronto!** O banco será:
   - Inicializado automaticamente
   - Adicionado à rotação
   - Salvo no localStorage

#### Método 2: Via Código

```javascript
import { addFirebaseDatabase } from '../config/firebaseMulti';

const newDb = {
  id: 'meu-novo-banco',
  name: 'Meu Novo Banco',
  description: 'Descrição do banco',
  config: {
    apiKey: "...",
    authDomain: "...",
    projectId: "...",
    storageBucket: "...",
    messagingSenderId: "...",
    appId: "...",
    measurementId: "..." // opcional
  },
  priority: 5,
  enabled: true
};

addFirebaseDatabase(newDb);
```

---

### 🔄 Alternar Entre Bancos

#### Via Interface:
1. Acesse "Gerenciar Bancos de Dados"
2. Encontre o banco desejado na lista
3. Clique no botão **"Ativar"**
4. Pronto! O sistema alterna automaticamente

#### Via Código:
```javascript
import { dbManager } from '../config/firebaseMulti';

// Alternar para banco específico
dbManager.switchToDatabase('workflowbr1');

// Alternar para próximo na rotação
dbManager.switchToNextDatabase();
```

---

### 📊 Visualizar Informações

```javascript
import { dbManager } from '../config/firebaseMulti';

// Obter informações completas
const info = dbManager.getInfo();

console.log('Banco ativo:', info.activeDatabase);
console.log('Total de bancos:', info.totalDatabases);
console.log('Bancos habilitados:', info.enabledDatabases);
console.log('Sequência de rotação:', info.rotationSequence);
console.log('Última rotação:', info.lastRotation);
console.log('Precisa rotacionar?', info.needsRotation);
```

---

## 🏗️ Arquitetura do Sistema

### Estrutura de Dados

```javascript
const database = {
  id: 'workflowbr1',           // ID único
  name: 'Workflow BR1',         // Nome amigável
  description: 'Banco adicional', // Descrição
  config: {                     // Configuração Firebase
    apiKey: "...",
    authDomain: "...",
    projectId: "...",
    storageBucket: "...",
    messagingSenderId: "...",
    appId: "...",
    measurementId: "..."
  },
  priority: 3,                  // Ordem na rotação (menor = maior prioridade)
  enabled: true                 // Se está habilitado
}
```

### Fluxo de Rotação

```
[Primary] → [Backup] → [Workflowbr1] → [Banco4] → ... → [Primary]
   ↑                                                          ↓
   └──────────────────────────────────────────────────────────┘
```

- Rotação automática a cada 24 horas
- Sequência configurável via localStorage
- Prioridade define a ordem

---

## 📦 Arquivos Criados/Modificados

### Novos Arquivos:
1. ✅ `src/config/firebaseMulti.js` - Sistema multi-database
2. ✅ `src/pages/DatabaseManagementPage.jsx` - Interface de gerenciamento

### Modificados:
1. ✅ `src/components/Workflow.jsx` - Adiciona menu e rota
2. ✅ `src/services/firebaseSync.js` - Já suporta múltiplos bancos

---

## 🎨 Interface Visual

### Dashboard Principal
```
┌─────────────────────────────────────────────────────┐
│ 🗄️ Gerenciamento de Bancos de Dados               │
│                                      [+ Adicionar]  │
├─────────────────────────────────────────────────────┤
│ 📊 Total: 3  │ ✅ Ativos: 3  │ 🔄 Última: Hoje    │
├─────────────────────────────────────────────────────┤
│ [🗄️] Garden Principal (PRIMARY) ✓ ATIVO            │
│     garden-c0b50 | Prioridade: 1 | ✓ Inicializado  │
├─────────────────────────────────────────────────────┤
│ [🗄️] Garden Backup (BACKUP) 🔄 NA ROTAÇÃO          │
│     garden-backup | Prioridade: 2 | ✓ Inicializado │
│                                           [Ativar]  │
├─────────────────────────────────────────────────────┤
│ [🗄️] Workflow BR1 (WORKFLOWBR1) 🔄 NA ROTAÇÃO    │
│     workflowbr1 | Prioridade: 3 | ✓ Inicializado   │
│                                           [Ativar]  │
└─────────────────────────────────────────────────────┘
```

### Modal Adicionar Banco
```
┌─────────────────────────────────────────────────────┐
│ ➕ Adicionar Novo Banco de Dados              [✕]  │
├─────────────────────────────────────────────────────┤
│                                                     │
│ [📋 Colar Configuração do Firebase]                │
│                                                     │
│ Nome do Banco:  [________________________]         │
│ Descrição:      [________________________]         │
│ Project ID:     [________________________] *       │
│ API Key:        [************************] 👁️     │
│ Auth Domain:    [________________________] *       │
│ Storage Bucket: [________________________] *       │
│ Messaging ID:   [________________________] *       │
│ App ID:         [________________________] *       │
│ Measurement ID: [________________________]         │
│ Prioridade:     [__10__]                          │
│ ☑ Habilitar banco de dados                        │
│                                                     │
│ [💾 Adicionar Banco]  [Cancelar]                   │
└─────────────────────────────────────────────────────┘
```

---

## 🔐 Permissões

### Quem pode acessar?
- ✅ **Administradores** (nível 4): Acesso total
- ❌ **Outros usuários**: Sem acesso

### O que administradores podem fazer?
- ✅ Adicionar novos bancos de dados
- ✅ Ativar/desativar bancos
- ✅ Alternar banco ativo
- ✅ Visualizar status e métricas
- ✅ Configurar rotação
- ✅ Gerenciar prioridades

---

## 🔄 Sistema de Rotação

### Rotação Automática (24h)
```javascript
// Verifica se precisa rotacionar
if (dbManager.needsRotation()) {
  dbManager.switchToNextDatabase();
}
```

### Rotação Manual
```javascript
// Via interface: botão "Ativar"
// Via código:
dbManager.switchToDatabase('workflowbr1');
```

### Sequência Customizada
```javascript
// Definir ordem específica
dbManager.saveRotationSequence([
  'primary',
  'workflowbr1',
  'backup'
]);
```

---

## 📝 Exemplo Completo: Adicionando Workflowbr1

### 1. Código de Configuração do Firebase Console

```javascript
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC6IoQBbNZ1QCMNZAM79KRUJ-TRvWlnliY",
  authDomain: "workflowbr1.firebaseapp.com",
  projectId: "workflowbr1",
  storageBucket: "workflowbr1.firebasestorage.app",
  messagingSenderId: "207274549565",
  appId: "1:207274549565:web:4d7755e8424b74c6712554",
  measurementId: "G-TYRLWERZMS"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
```

### 2. Adicionar via Interface

1. Copie o código acima (Ctrl+C)
2. Acesse "Gerenciar Bancos de Dados"
3. Clique "Adicionar Banco"
4. Clique "Colar Configuração do Firebase"
5. Sistema extrai automaticamente a configuração
6. Preencha Nome: "Workflow BR1"
7. Preencha Descrição: "Banco adicional"
8. Clique "Adicionar Banco"

### 3. Resultado

```javascript
// Banco adicionado automaticamente ao sistema
{
  id: 'workflowbr1',
  name: 'Workflow BR1',
  description: 'Banco adicional',
  config: { /* configuração extraída */ },
  priority: 3,
  enabled: true,
  isInitialized: true,
  inRotationSequence: true
}
```

---

## 🛠️ API do MultiDatabaseManager

### Métodos Principais

```javascript
import { dbManager } from '../config/firebaseMulti';

// 1. Obter database ativo
const db = dbManager.getActiveDb();

// 2. Obter todos databases inativos
const inactiveDbs = dbManager.getInactiveDbs();

// 3. Obter database por ID
const specificDb = dbManager.getDbById('workflowbr1');

// 4. Alternar para próximo
dbManager.switchToNextDatabase();

// 5. Alternar para específico
dbManager.switchToDatabase('workflowbr1');

// 6. Verificar se precisa rotacionar
const needs = dbManager.needsRotation(); // true/false

// 7. Obter todos os bancos
const allDbs = dbManager.getAllDatabases();

// 8. Obter informações completas
const info = dbManager.getInfo();

// 9. Adicionar listener
const unsubscribe = dbManager.addListener((activeDb) => {
  console.log('Banco alternado para:', activeDb);
});
```

---

## 🎯 Casos de Uso

### Caso 1: Adicionar Banco de Produção Adicional
```javascript
addFirebaseDatabase({
  id: 'production-br2',
  name: 'Produção BR2',
  description: 'Segundo servidor de produção',
  config: { /* ... */ },
  priority: 2,
  enabled: true
});
```

### Caso 2: Adicionar Banco de Desenvolvimento
```javascript
addFirebaseDatabase({
  id: 'dev-testing',
  name: 'Desenvolvimento',
  description: 'Ambiente de testes',
  config: { /* ... */ },
  priority: 99, // Baixa prioridade
  enabled: false // Desabilitado por padrão
});
```

### Caso 3: Rotação Entre 5 Bancos
```javascript
// Configurar sequência
dbManager.saveRotationSequence([
  'primary',
  'workflowbr1',
  'backup',
  'production-br2',
  'dev-testing'
]);

// Rotação automática circula entre todos
```

---

## 🔍 Debug e Monitoramento

### Console do Navegador

```javascript
// Abra o console (F12) e digite:

// Ver informações completas
dbManager.getInfo()

// Ver todos os bancos
dbManager.getAllDatabases()

// Ver banco ativo
dbManager.activeDatabase

// Ver sequência de rotação
dbManager.rotationSequence

// Forçar rotação
dbManager.switchToNextDatabase()
```

### Logs Automáticos

O sistema registra automaticamente:
- ✅ Inicialização de bancos
- ✅ Alternância de bancos
- ✅ Erros de conexão
- ✅ Operações de rotação

```
✅ Firebase "Garden Principal" inicializado
✅ Firebase "Garden Backup" inicializado
✅ Firebase "Workflow BR1" inicializado
🔄 Rotação: primary → workflowbr1
✅ Banco de dados "Workflow BR1" adicionado com sucesso!
```

---

## 📊 Compatibilidade

### Com Código Antigo ✅

O sistema mantém compatibilidade total com código que usa:

```javascript
// Imports antigos continuam funcionando
import { primaryDb, backupDb } from '../config/firebaseDual';

// Novos exports também disponíveis
import { workflowbr1Db } from '../config/firebaseMulti';

// Proxy dinâmico sempre aponta para banco ativo
import { db, auth, storage } from '../config/firebaseMulti';
```

### Migração Zero-Breaking

- ✅ Não precisa alterar código existente
- ✅ `firebaseDual.js` pode ser substituído por `firebaseMulti.js`
- ✅ Todas as funções antigas mantidas
- ✅ Novos recursos adicionados

---

## 🚀 Próximos Passos (Opcional)

### Melhorias Futuras

1. **Sincronização Multi-Database**
   - Sincronizar dados entre todos os bancos
   - Replicação em tempo real
   - Merge inteligente de conflitos

2. **Load Balancing**
   - Distribuição de carga entre bancos
   - Rotação baseada em uso
   - Fallback automático

3. **Monitoramento Avançado**
   - Métricas de cada banco
   - Alertas de falha
   - Dashboard de performance

4. **Backup Incremental**
   - Backup apenas de mudanças
   - Redução de uso de rede
   - Histórico de versões

---

## ✅ Checklist de Implementação

- [x] Sistema multi-database criado
- [x] Workflowbr1 adicionado e configurado
- [x] Interface de gerenciamento completa
- [x] Menu administrativo integrado
- [x] Sistema de rotação funcionando
- [x] Persistência em localStorage
- [x] Compatibilidade com código antigo
- [x] Dark mode implementado
- [x] Permissões configuradas (admin only)
- [x] Documentação completa
- [ ] Testes automatizados
- [ ] Sincronização multi-database
- [ ] Load balancing

---

## 📖 Recursos Relacionados

- `src/config/firebaseDual.js` - Sistema antigo (2 bancos)
- `src/config/firebaseMulti.js` - Sistema novo (N bancos)
- `src/pages/BackupMonitoringPage.jsx` - Monitoramento de backup
- `src/pages/DatabaseManagementPage.jsx` - Gerenciamento de bancos
- `src/services/firebaseSync.js` - Serviço de sincronização
- `src/contexts/DatabaseRotationContext.jsx` - Contexto de rotação

---

**Desenvolvido com ❤️ para Garden Almoxarifado**  
*Sistema Multi-Database v1.0 - Escalável e Flexível!*

🎉 **Workflowbr1 já está integrado e pronto para uso!**
