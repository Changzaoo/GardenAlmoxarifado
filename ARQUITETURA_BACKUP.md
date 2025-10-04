# 🏗️ Arquitetura do Sistema de Backup Automático

```
┌─────────────────────────────────────────────────────────────────────┐
│                         🖥️ APLICAÇÃO REACT                          │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │                    📱 App.jsx                               │   │
│  │                                                              │   │
│  │  ┌────────────────────────────────────────────────────┐   │   │
│  │  │     <DatabaseRotationProvider>                     │   │   │
│  │  │                                                      │   │   │
│  │  │   ┌─────────────────────────────────────────────┐ │   │   │
│  │  │   │  🎯 useDatabaseRotation Hook                │ │   │   │
│  │  │   │                                               │ │   │   │
│  │  │   │  • activeDatabase: 'primary'/'backup'       │ │   │   │
│  │  │   │  • lastRotation: Date                        │ │   │   │
│  │  │   │  • nextRotation: Date                        │ │   │   │
│  │  │   │  • isRotating: boolean                       │ │   │   │
│  │  │   │  • isSyncing: boolean                        │ │   │   │
│  │  │   │  • syncProgress: {current, total, %}         │ │   │   │
│  │  │   │  • forceRotation()                           │ │   │   │
│  │  │   │  • forceSync()                               │ │   │   │
│  │  │   └─────────────────────────────────────────────┘ │   │   │
│  │  │                       ↓                            │   │   │
│  │  │   ⏰ Timer: Verifica a cada 1 minuto              │   │   │
│  │  │   🔄 Auto-rotação quando >= 24h                   │   │   │
│  │  └────────────────────────────────────────────────────┘   │   │
│  │                       ↓                                    │   │
│  │  ┌────────────────────────────────────────────────────┐   │   │
│  │  │         🎛️ DatabaseRotationPanel                  │   │   │
│  │  │                                                      │   │   │
│  │  │  [📊 Status]  [⏰ Countdown]  [🔄 Actions]         │   │   │
│  │  │  [📜 History] [ℹ️ Info]                            │   │   │
│  │  └────────────────────────────────────────────────────┘   │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                     │
│                              ↓                                      │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │              🔧 DatabaseManager (Singleton)                │   │
│  │                                                              │   │
│  │  • activeDatabase: string (localStorage)                   │   │
│  │  • lastRotation: Date (localStorage)                       │   │
│  │  • listeners: Array<callback>                              │   │
│  │                                                              │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │   │
│  │  │ getActiveDb │  │switchDatabase│  │needsRotation│       │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘       │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                     │
│                              ↓                                      │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │         🔄 FirebaseSyncService                             │   │
│  │                                                              │   │
│  │  • copyCollection(name, options)                           │   │
│  │  • syncCollection(name, timestampField)                    │   │
│  │  • copyAllCollections(collections, onProgress)             │   │
│  │  • syncAllCollections(collections, onProgress)             │   │
│  │                                                              │   │
│  │  Recursos:                                                  │   │
│  │  - Batching (500 docs/batch)                               │   │
│  │  - Comparação de timestamps                                │   │
│  │  - Sincronização bidirecional                              │   │
│  │  - Progress callbacks                                       │   │
│  │  - Error handling                                           │   │
│  │  - Logging detalhado                                        │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                     │
│                              ↓                                      │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │              🔥 Firebase Configuration                     │   │
│  │                                                              │   │
│  │  ┌─────────────────────┐      ┌─────────────────────┐     │   │
│  │  │   Primary Firebase  │      │   Backup Firebase   │     │   │
│  │  │   garden-c0b50      │      │   garden-backup     │     │   │
│  │  │                     │      │                     │     │   │
│  │  │  • primaryDb        │      │  • backupDb         │     │   │
│  │  │  • primaryAuth      │      │  • backupAuth       │     │   │
│  │  │  • primaryStorage   │      │  • backupStorage    │     │   │
│  │  └─────────────────────┘      └─────────────────────┘     │   │
│  │            ↑                            ↑                   │   │
│  │            └────────────────────────────┘                   │   │
│  │                         |                                    │   │
│  │  ┌──────────────────────┴───────────────────────────┐      │   │
│  │  │  🔀 Proxy Dinâmico                                │      │   │
│  │  │                                                    │      │   │
│  │  │  export const db = Proxy → activeDatabase        │      │   │
│  │  │  export const auth = Proxy → activeDatabase      │      │   │
│  │  │  export const storage = Proxy → activeDatabase   │      │   │
│  │  │                                                    │      │   │
│  │  │  (Sempre aponta para o database ativo)           │      │   │
│  │  └────────────────────────────────────────────────────┘      │   │
│  └────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      ☁️ FIREBASE CLOUD                              │
│                                                                      │
│  ┌──────────────────────────────┐    ┌──────────────────────────┐ │
│  │    🔵 Firebase Principal     │    │    🟣 Firebase Backup    │ │
│  │    Project: garden-c0b50     │    │  Project: garden-backup  │ │
│  │                               │    │                           │ │
│  │  📦 Coleções:                │    │  📦 Coleções:            │ │
│  │  • usuarios                  │◄──►│  • usuarios              │ │
│  │  • mensagens                 │    │  • mensagens             │ │
│  │  • notificacoes              │    │  • notificacoes          │ │
│  │  • tarefas                   │    │  • tarefas               │ │
│  │  • emprestimos               │    │  • emprestimos           │ │
│  │  • inventario                │    │  • inventario            │ │
│  │  • empresas                  │    │  • empresas              │ │
│  │  • setores                   │    │  • setores               │ │
│  │  • cargos                    │    │  • cargos                │ │
│  │  • presenca                  │    │  • presenca              │ │
│  │  • horarios                  │    │  • horarios              │ │
│  │  • folgas                    │    │  • folgas                │ │
│  │  • configuracoes             │    │  • configuracoes         │ │
│  │                               │    │                           │ │
│  │  🔒 Auth                     │    │  🔒 Auth                 │ │
│  │  📁 Storage                  │    │  📁 Storage              │ │
│  └──────────────────────────────┘    └──────────────────────────┘ │
│            ↑                                    ↑                  │
│            └───────── Sincronização ────────────┘                  │
│                    (Bidirecional, a cada 24h)                      │
└─────────────────────────────────────────────────────────────────────┘
```

## 🔄 Fluxo de Rotação

```
   Hora 0                    Hora 24                   Hora 48
     |                          |                          |
     |    Sistema usa           |    🔄 ROTAÇÃO           |    Sistema usa
     |    Primary               |                          |    Primary
     |         ↓                |         ↓                |         ↓
     |    ┌─────────┐          |    ┌─────────┐          |    ┌─────────┐
     |    │ Primary │ ✅       |    │ Backup  │ ✅       |    │ Primary │ ✅
     |    └─────────┘          |    └─────────┘          |    └─────────┘
     |    ┌─────────┐          |    ┌─────────┐          |    ┌─────────┐
     |    │ Backup  │ 💤       |    │ Primary │ 💤       |    │ Backup  │ 💤
     |    └─────────┘          |    └─────────┘          |    └─────────┘
     |                          |                          |
     |                          | 1. Sincronizar dados    |
     |                          | 2. Alternar database    |
     |                          | 3. Salvar histórico     |
     |                          |                          |
```

## 📊 Fluxo de Sincronização

```
1. ANTES DA ROTAÇÃO
   ┌─────────────┐         ┌─────────────┐
   │  Primary    │         │   Backup    │
   │             │         │             │
   │  Docs: 500  │         │  Docs: 480  │
   │  (novos)    │         │  (antigos)  │
   └─────────────┘         └─────────────┘

2. DURANTE SINCRONIZAÇÃO
   ┌─────────────┐         ┌─────────────┐
   │  Primary    │    🔄   │   Backup    │
   │             │ ──────► │             │
   │  Copiando   │ ◄────── │  Copiando   │
   │  20 docs    │    🔄   │  5 docs     │
   └─────────────┘         └─────────────┘
   
   Progresso: ████████░░░░ 65%

3. APÓS SINCRONIZAÇÃO
   ┌─────────────┐         ┌─────────────┐
   │  Primary    │    ✅   │   Backup    │
   │             │         │             │
   │  Docs: 500  │    ═    │  Docs: 500  │
   │  (idêntico) │         │  (idêntico) │
   └─────────────┘         └─────────────┘

4. ROTAÇÃO COMPLETA
   ┌─────────────┐         ┌─────────────┐
   │  Primary    │         │   Backup    │
   │     💤      │         │     ✅      │
   │  (inativo)  │         │   (ativo)   │
   └─────────────┘         └─────────────┘
```

## 🎯 Componentes e Responsabilidades

```
┌────────────────────────────────────────────────────────┐
│  firebaseDual.js                                       │
│  ─────────────────────────────────────────────────     │
│  • Inicializa ambos os Firebases                      │
│  • Cria DatabaseManager (singleton)                   │
│  • Gerencia database ativo                            │
│  • Persiste escolha no localStorage                   │
│  • Exporta proxies dinâmicos (db, auth, storage)      │
└────────────────────────────────────────────────────────┘
                        ↓
┌────────────────────────────────────────────────────────┐
│  firebaseSync.js                                       │
│  ─────────────────────────────────────────────────────     │
│  • copyCollection() - Copia coleção completa          │
│  • syncCollection() - Sincroniza bidirecionalmente    │
│  • copyAllCollections() - Copia todas                 │
│  • syncAllCollections() - Sincroniza todas            │
│  • Batching automático (500 docs)                     │
│  • Comparação de timestamps                           │
│  • Logging detalhado                                   │
└────────────────────────────────────────────────────────┘
                        ↓
┌────────────────────────────────────────────────────────┐
│  useDatabaseRotation.js                                │
│  ─────────────────────────────────────────────────────     │
│  • Timer de verificação (1 min)                       │
│  • Auto-rotação quando >= 24h                         │
│  • forceRotation() - Rotação manual                   │
│  • forceSync() - Sincronização manual                 │
│  • Callbacks (onRotationStart, onComplete, etc)       │
│  • Estado (isRotating, isSyncing, syncProgress)       │
│  • Histórico de rotações                              │
└────────────────────────────────────────────────────────┘
                        ↓
┌────────────────────────────────────────────────────────┐
│  DatabaseRotationContext.jsx                           │
│  ─────────────────────────────────────────────────────     │
│  • Provider do Context                                 │
│  • Integra useDatabaseRotation                        │
│  • Gerencia notificações visuais                      │
│  • Expõe API para componentes                         │
└────────────────────────────────────────────────────────┘
                        ↓
┌────────────────────────────────────────────────────────┐
│  DatabaseRotationPanel.jsx                             │
│  ─────────────────────────────────────────────────────     │
│  • UI visual do sistema                                │
│  • Cards de status                                     │
│  • Progress bar de sync                                │
│  • Botões de ação (rotação/sync manual)               │
│  • Histórico de rotações                               │
│  • Modal de informações                                │
│  • Animações (Framer Motion)                           │
└────────────────────────────────────────────────────────┘
```

## 🔐 Fluxo de Segurança

```
┌────────────────────────────────────────────────────────┐
│  CONFIGURAÇÃO                                          │
└────────────────────────────────────────────────────────┘
                        ↓
    ┌──────────────────────────────────────┐
    │  Firebase Principal (Criptografado)  │
    │                                       │
    │  encryptedConfig = {                │
    │    "_k": "base64...",               │
    │    "_d": "base64...",               │
    │    ...                               │
    │  }                                   │
    │                                       │
    │  decrypt() → config real            │
    └──────────────────────────────────────┘
                        ↓
┌────────────────────────────────────────────────────────┐
│  AUTENTICAÇÃO                                          │
└────────────────────────────────────────────────────────┘
                        ↓
    ┌──────────────────────────────────────┐
    │  Firebase Auth                       │
    │                                       │
    │  auth.onAuthStateChanged(user) {    │
    │    if (user) {                       │
    │      user.getIdToken(true);         │
    │    }                                 │
    │  }                                   │
    └──────────────────────────────────────┘
                        ↓
┌────────────────────────────────────────────────────────┐
│  FIRESTORE RULES (Ambos os projetos)                  │
└────────────────────────────────────────────────────────┘
                        ↓
    allow read, write: if request.auth != null;
```

---

**Legenda:**
- 🔵 Firebase Principal (garden-c0b50)
- 🟣 Firebase Backup (garden-backup)
- ✅ Database Ativo
- 💤 Database Inativo
- 🔄 Sincronizando
- ⏰ Timer Ativo
- 📦 Coleção
- 🔒 Autenticação
- 📁 Storage

**Data**: 04/10/2025  
**Versão**: 1.0.0
