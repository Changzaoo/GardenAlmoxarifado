# 🔄 Sistema de Backup Automático e Rotação de Databases

## 🎯 Visão Geral

Sistema que **automaticamente**:
- 🔄 Alterna entre dois projetos Firebase a cada 24 horas
- 📦 Sincroniza todas as coleções ao alternar
- ✅ Garante que os dois databases estejam sempre atualizados
- 🛡️ Protege contra perda de dados

## 📊 Como Funciona

```
┌─────────────────┐         ┌─────────────────┐
│   Firebase      │         │   Firebase      │
│   Principal     │ ◄────► │    Backup       │
│  garden-c0b50   │         │ garden-backup   │
└─────────────────┘         └─────────────────┘
         │                           │
         │      Rotação a cada       │
         │         24 horas          │
         │                           │
         └───────────┬───────────────┘
                     │
              ┌──────▼──────┐
              │   Sistema   │
              │   usa DB    │
              │    ativo    │
              └─────────────┘
```

## 🔄 Fluxo de Rotação

### Dia 1 (0h - 24h)
```
✅ Sistema usa: Firebase Principal
📦 Dados gravados em: garden-c0b50
🔒 Backup aguardando: garden-backup
```

### Dia 2 (24h)
```
⏰ 24 horas atingidas
🔄 Iniciando rotação...
📊 Sincronizando coleções:
   └─ usuarios ✅
   └─ mensagens ✅
   └─ notificacoes ✅
   └─ tarefas ✅
   └─ ... (todas as coleções)
✅ Sistema usa: Firebase Backup
📦 Dados gravados em: garden-backup
🔄 Principal atualizado com dados novos
```

### Dia 3 (48h)
```
⏰ Mais 24 horas
🔄 Rotaciona de volta
✅ Sistema usa: Firebase Principal
📦 Backup atualizado com dados novos
```

## 📁 Estrutura de Arquivos

```
src/
├── config/
│   └── firebaseDual.js          # Configuração dual do Firebase
├── services/
│   └── firebaseSync.js          # Serviço de sincronização
├── hooks/
│   └── useDatabaseRotation.js   # Hook de rotação
├── contexts/
│   └── DatabaseRotationContext.jsx  # Context Provider
└── components/
    └── DatabaseRotationPanel.jsx    # Painel de controle
```

## 🚀 Instalação

### 1. Configuração Dual do Firebase

O arquivo `src/config/firebaseDual.js` já está configurado com:
- ✅ Firebase Principal (garden-c0b50)
- ✅ Firebase Backup (garden-backup)

### 2. Adicionar Provider no App

```javascript
// src/App.jsx ou main.jsx
import { DatabaseRotationProvider } from './contexts/DatabaseRotationContext';

function App() {
  return (
    <DatabaseRotationProvider>
      {/* Resto do app */}
    </DatabaseRotationProvider>
  );
}
```

### 3. Atualizar Imports do Firebase

**Antes:**
```javascript
import { db, auth, storage } from './firebaseConfig';
```

**Depois:**
```javascript
import { db, auth, storage } from './config/firebaseDual';
```

> **Importante**: Os exports `db`, `auth` e `storage` são **proxies dinâmicos** que sempre apontam para o database ativo. Você não precisa alterar nada no código!

## 🎛️ Usando o Sistema

### Hook useDatabaseRotation

```javascript
import { useDatabaseRotationContext } from './contexts/DatabaseRotationContext';

function MyComponent() {
  const {
    activeDatabase,        // 'primary' ou 'backup'
    lastRotation,          // Data da última rotação
    nextRotation,          // Data da próxima rotação
    isRotating,            // Se está rotacionando agora
    isSyncing,             // Se está sincronizando
    syncProgress,          // Progresso da sincronização
    hoursUntilRotation,    // Horas até próxima rotação
    forceRotation,         // Forçar rotação manual
    forceSync,             // Forçar sincronização manual
    getInfo                // Ver info completa
  } = useDatabaseRotationContext();

  return (
    <div>
      <p>Database ativo: {activeDatabase}</p>
      <p>Próxima rotação em: {hoursUntilRotation.toFixed(1)}h</p>
      
      {isRotating && <p>🔄 Rotacionando...</p>}
      
      <button onClick={forceRotation}>
        Forçar Rotação
      </button>
    </div>
  );
}
```

### Painel de Controle

```javascript
import { DatabaseRotationPanel } from './components/DatabaseRotationPanel';

function SettingsPage() {
  return (
    <div>
      <h1>Configurações de Backup</h1>
      <DatabaseRotationPanel />
    </div>
  );
}
```

## 📦 Coleções Sincronizadas

O sistema sincroniza automaticamente:

- ✅ `usuarios` - Usuários do sistema
- ✅ `mensagens` - Mensagens entre usuários
- ✅ `notificacoes` - Notificações
- ✅ `tarefas` - Tarefas semanais
- ✅ `emprestimos` - Empréstimos de ferramentas
- ✅ `inventario` - Inventário de itens
- ✅ `empresas` - Empresas cadastradas
- ✅ `setores` - Setores das empresas
- ✅ `cargos` - Cargos dos usuários
- ✅ `presenca` - Registros de presença
- ✅ `horarios` - Horários de trabalho
- ✅ `folgas` - Solicitações de folga
- ✅ `configuracoes` - Configurações do sistema

### Adicionar Nova Coleção

```javascript
<DatabaseRotationProvider
  collections={[
    'usuarios',
    'mensagens',
    'minhaNovaColecao'  // ← Adicionar aqui
  ]}
>
```

## 🔧 Configurações Avançadas

### Alterar Intervalo de Rotação

```javascript
<DatabaseRotationProvider
  rotationInterval={12 * 60 * 60 * 1000}  // 12 horas
>
```

### Desabilitar Sincronização ao Rotacionar

```javascript
<DatabaseRotationProvider
  syncOnRotation={false}  // Apenas alterna, não sincroniza
>
```

### Desabilitar Rotação Automática

```javascript
<DatabaseRotationProvider
  autoRotate={false}  // Apenas manual via forceRotation()
>
```

### Callbacks Customizados

```javascript
<DatabaseRotationProvider
  onRotationStart={(fromDb) => {
    console.log(`Rotação iniciada de: ${fromDb}`);
    // Mostrar loading, notificar usuários, etc
  }}
  
  onRotationComplete={(toDb, history) => {
    console.log(`Rotação concluída para: ${toDb}`);
    // Atualizar UI, enviar analytics, etc
  }}
  
  onSyncProgress={(current, total, collectionName) => {
    console.log(`Sincronizando ${collectionName}: ${current}/${total}`);
  }}
  
  onError={(error) => {
    console.error('Erro na rotação:', error);
    // Enviar para serviço de log, mostrar erro, etc
  }}
>
```

## 🔍 Monitoramento

### Ver Database Ativo

```javascript
console.log('Database ativo:', dbManager.activeDatabase);
```

### Ver Info Completa

```javascript
const info = dbManager.getInfo();
console.log(info);
/*
{
  activeDatabase: 'primary',
  lastRotation: Date,
  needsRotation: false,
  hoursUntilRotation: 18.5,
  primaryDb: {...},
  backupDb: {...},
  activeDb: {...},
  inactiveDb: {...}
}
*/
```

### Ver Histórico de Rotações

```javascript
const history = JSON.parse(localStorage.getItem('rotationHistory') || '[]');
console.table(history);
```

## 🎯 Casos de Uso

### 1. Rotação Manual Urgente

```javascript
const { forceRotation } = useDatabaseRotationContext();

// Em caso de problema no database ativo
await forceRotation();
// Sistema alterna imediatamente para o outro database
```

### 2. Sincronização Sob Demanda

```javascript
const { forceSync } = useDatabaseRotationContext();

// Antes de manutenção programada
await forceSync();
// Garante que ambos os databases estejam idênticos
```

### 3. Mostrar Status ao Usuário

```javascript
function StatusBar() {
  const { activeDatabase, hoursUntilRotation } = useDatabaseRotationContext();
  
  return (
    <div className="status-bar">
      <span>
        {activeDatabase === 'primary' ? '🔵' : '🟣'} 
        Database: {activeDatabase}
      </span>
      <span>
        ⏰ Próxima rotação: {hoursUntilRotation.toFixed(1)}h
      </span>
    </div>
  );
}
```

## 🔐 Segurança

### Configurações Ofuscadas

```javascript
// Firebase principal usa criptografia
const encryptedConfig = {
  "_k": "WlpoYVN5QW5MbXRsaE9VVUFidFJjT2c2NGRYZENMYmx0dl9pRTRF",
  "_d": "Z2FyZGVuLWMwYjUwLmZpcmViYXNlYXBwLmNvbQ==",
  // ...
};
```

### Firebase Rules

Certifique-se de que ambos os projetos têm as mesmas regras:

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 📊 Performance

### Otimizações Implementadas

- ✅ **Batching**: Copia até 500 documentos por lote
- ✅ **Sincronização Inteligente**: Compara timestamps e copia apenas dados novos
- ✅ **Cache Local**: Mantém info de rotação no localStorage
- ✅ **Verificação Periódica**: Checa a cada 1 minuto se precisa rotacionar
- ✅ **Debouncing**: Aguarda 1 segundo entre sincronizações de coleções

### Métricas Esperadas

| Operação | Tempo Estimado |
|----------|----------------|
| Rotação sem sync | ~100ms |
| Rotação com sync | ~30s - 2min |
| Sync 1000 docs | ~10s |
| Verificação de rotação | <10ms |

## 🆘 Troubleshooting

### Database não alterna

**Verificar:**
```javascript
console.log('Auto-rotate:', rotation.autoRotate);
console.log('Needs rotation:', rotation.needsRotation);
console.log('Last rotation:', rotation.lastRotation);
```

**Solução:**
- Verificar se `autoRotate={true}` no Provider
- Verificar se já passou 24 horas desde última rotação
- Forçar rotação manual se necessário

### Sincronização falha

**Verificar:**
```javascript
const { syncProgress } = useDatabaseRotationContext();
console.log('Sync progress:', syncProgress);
```

**Possíveis causas:**
- Permissões do Firebase
- Conexão de internet
- Tamanho dos documentos muito grande

**Solução:**
- Verificar Firebase Rules
- Aumentar `batchSize` se muitos documentos pequenos
- Diminuir `batchSize` se documentos muito grandes

### Dados duplicados

**Verificar:**
```javascript
// Logs do FirebaseSyncService
const service = createSyncService(sourceDb, targetDb);
console.log(service.getLog());
```

**Solução:**
- Sistema já previne duplicação por ID
- Se ocorrer, usar `overwrite: true` na próxima sync

## 🎨 Exemplo Completo

```javascript
// App.jsx
import React from 'react';
import { DatabaseRotationProvider } from './contexts/DatabaseRotationContext';
import { DatabaseRotationPanel } from './components/DatabaseRotationPanel';

function App() {
  return (
    <DatabaseRotationProvider
      autoRotate={true}
      rotationInterval={24 * 60 * 60 * 1000}
      syncOnRotation={true}
      collections={[
        'usuarios',
        'mensagens',
        'notificacoes',
        'tarefas'
      ]}
      onRotationComplete={(toDb) => {
        console.log(`✅ Rotação concluída para: ${toDb}`);
      }}
    >
      <div className="app">
        <header>
          <h1>Meu App</h1>
          <StatusIndicator />
        </header>
        
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/settings" element={
              <SettingsPage>
                <DatabaseRotationPanel />
              </SettingsPage>
            } />
          </Routes>
        </main>
      </div>
    </DatabaseRotationProvider>
  );
}

function StatusIndicator() {
  const { activeDatabase, hoursUntilRotation } = useDatabaseRotationContext();
  
  return (
    <div className="status">
      <span className={`badge ${activeDatabase}`}>
        {activeDatabase === 'primary' ? '🔵' : '🟣'} {activeDatabase}
      </span>
      <span className="time">
        ⏰ {hoursUntilRotation.toFixed(1)}h
      </span>
    </div>
  );
}
```

## 📝 Logs

O sistema gera logs detalhados:

```javascript
// No console do navegador
ℹ️ [FirebaseSync] Iniciando cópia da coleção: usuarios
ℹ️ [FirebaseSync] 150 documentos encontrados em usuarios
✅ [FirebaseSync] 150/150 documentos copiados
✅ [FirebaseSync] Coleção usuarios copiada: 150 documentos

🔄 Rotação iniciada de: primary
📊 Sincronizando usuarios: 1/12
📊 Sincronizando mensagens: 2/12
...
✅ Rotação concluída para: backup
```

## 🔮 Funcionalidades Futuras

- [ ] Compressão de dados antes de sincronizar
- [ ] Sincronização incremental (apenas campos alterados)
- [ ] Backup para Cloud Storage (além de Firestore)
- [ ] Dashboard de métricas e analytics
- [ ] Alertas por email em caso de falha
- [ ] Restore de versões anteriores
- [ ] Agendamento de backups customizado

---

**Última atualização: 04/10/2025**
