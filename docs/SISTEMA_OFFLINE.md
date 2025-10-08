# 📴 Sistema de Modo Offline - WorkFlow

## 📋 Visão Geral

Sistema completo de funcionamento offline que permite aos usuários continuar trabalhando sem conexão à internet, com sincronização automática quando a conexão for restaurada.

---

## 🎯 Funcionalidades Principais

### ✅ O que funciona offline:

1. **Visualização de dados** - Todos os dados carregados previamente ficam disponíveis
2. **Criar registros** - Pontos, avaliações, funcionários, empréstimos, tarefas
3. **Editar registros** - Modificar qualquer dado localmente
4. **Deletar registros** - Remover dados (sincroniza depois)
5. **Interface completa** - Todo o app funciona normalmente

### 🔄 Sincronização Automática:

- **Detecção automática** quando a conexão retorna
- **Fila inteligente** processa operações na ordem cronológica
- **Retry automático** até 3 tentativas em caso de erro
- **Notificações visuais** mostrando progresso da sincronização

### 🚨 Indicadores Visuais:

- **Badge vermelho** no canto superior direito quando offline
- **Contador de operações pendentes** em tempo real
- **Logo vermelho** em todos os lugares quando sem conexão
- **Tooltip informativo** explicando o modo offline

---

## 🏗️ Arquitetura do Sistema

```
┌─────────────────────────────────────────┐
│           Aplicação React               │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────────────────────────┐  │
│  │   useOnlineStatus Hook           │  │
│  │   (Detecção Online/Offline)      │  │
│  └────────────┬─────────────────────┘  │
│               │                         │
│  ┌────────────▼─────────────────────┐  │
│  │   FirestoreAdapter               │  │
│  │   (Roteamento Online/Offline)    │  │
│  └────────┬───────────┬──────────────┘  │
│           │           │                 │
│    Online │           │ Offline         │
│           │           │                 │
│  ┌────────▼──────┐   ┌▼──────────────┐ │
│  │   Firestore   │   │ IndexedDB     │ │
│  │   (Cloud)     │   │ (Local Cache) │ │
│  └───────────────┘   └───────┬───────┘ │
│                              │          │
│                     ┌────────▼───────┐  │
│                     │  Sync Queue    │  │
│                     │  (Operações    │  │
│                     │   Pendentes)   │  │
│                     └────────────────┘  │
└─────────────────────────────────────────┘
```

---

## 📂 Estrutura de Arquivos

```
src/
├── hooks/
│   └── useOnlineStatus.js          # Detecção de conexão
│
├── utils/
│   ├── offlineStorage.js           # IndexedDB wrapper
│   ├── syncManager.js              # Gerenciador de sincronização
│   └── firestoreAdapter.js         # Adapter Firestore offline
│
└── components/
    ├── OfflineIndicator.jsx        # Indicador visual
    └── LogoWithOfflineIndicator.jsx # Logo com status
```

---

## 🔧 Como Funciona

### 1. **Detecção de Conexão** (`useOnlineStatus.js`)

```javascript
const { isOnline, wasOffline } = useOnlineStatus();

// isOnline: true/false
// wasOffline: true quando acabou de reconectar (por 3s)
```

**Funcionalidades:**
- Escuta eventos `online` e `offline` do navegador
- Verifica `navigator.onLine` periodicamente (backup)
- Detecta reconexão para disparar sincronização

---

### 2. **Cache Local** (`offlineStorage.js`)

**Stores do IndexedDB:**
- `funcionarios` - Dados dos funcionários
- `pontos` - Registros de ponto
- `avaliacoes` - Avaliações
- `emprestimos` - Empréstimos de ferramentas
- `tarefas` - Tarefas atribuídas
- `escalas` - Escalas de trabalho
- `syncQueue` - Fila de sincronização

**Métodos principais:**
```javascript
// Salvar dados
await offlineStorage.saveToCache(STORES.FUNCIONARIOS, funcionario);

// Buscar dados
const funcionarios = await offlineStorage.getFromCache(STORES.FUNCIONARIOS);
const func = await offlineStorage.getFromCache(STORES.FUNCIONARIOS, 'id123');

// Buscar por índice
const pontos = await offlineStorage.getByIndex(
  STORES.PONTOS, 
  'funcionarioId', 
  'func123'
);

// Deletar
await offlineStorage.deleteFromCache(STORES.FUNCIONARIOS, 'id123');

// Limpar tudo
await offlineStorage.clearCache(STORES.FUNCIONARIOS);
```

---

### 3. **Gerenciador de Sincronização** (`syncManager.js`)

**Fila de Operações:**
Cada operação offline é adicionada à fila com:
```javascript
{
  id: "1234567890_abc123",
  operation: "add" | "update" | "delete",
  collection: "funcionarios",
  data: { ... },
  timestamp: 1234567890,
  synced: false,
  retries: 0
}
```

**Processo de Sincronização:**
1. Busca operações pendentes (synced: false)
2. Ordena por timestamp (ordem cronológica)
3. Processa cada operação no Firestore
4. Marca como sincronizada (synced: true)
5. Remove operações antigas (>7 dias)
6. Notifica listeners sobre progresso

**Listeners de Eventos:**
```javascript
syncManager.addSyncListener((event) => {
  switch(event.type) {
    case 'sync_start':
      console.log('Sincronização iniciada');
      break;
    case 'sync_progress':
      console.log(`${event.current}/${event.total}`);
      break;
    case 'sync_complete':
      console.log(`${event.operations} sincronizadas`);
      break;
    case 'sync_error':
      console.error(event.error);
      break;
  }
});
```

---

### 4. **Adapter Firestore** (`firestoreAdapter.js`)

**Roteamento Inteligente:**
- **Online**: Firestore → Cache (dupla gravação)
- **Offline**: Cache → Sync Queue

**Métodos Disponíveis:**

#### Adicionar Documento
```javascript
const docId = await firestoreAdapter.addDocument('funcionarios', {
  nome: 'João Silva',
  cargo: 'Operador',
  setor: 'Produção'
});
// Online: Firestore + Cache
// Offline: Cache + Sync Queue (ID temporário)
```

#### Atualizar Documento
```javascript
await firestoreAdapter.updateDocument('funcionarios', 'id123', {
  cargo: 'Supervisor'
});
// Online: Firestore + Cache
// Offline: Cache + Sync Queue
```

#### Deletar Documento
```javascript
await firestoreAdapter.deleteDocument('funcionarios', 'id123');
// Online: Firestore + Cache
// Offline: Cache + Sync Queue
```

#### Buscar Documentos
```javascript
// Sem filtro
const funcionarios = await firestoreAdapter.getDocuments('funcionarios');

// Com filtro
const funcionarios = await firestoreAdapter.getDocuments('funcionarios', {
  field: 'setor',
  operator: '==',
  value: 'Produção'
});
// Online: Firestore → Cache
// Offline: Cache (filtro manual)
```

#### Listener em Tempo Real
```javascript
const unsubscribe = firestoreAdapter.onSnapshotHybrid(
  'funcionarios',
  { field: 'setor', operator: '==', value: 'Produção' },
  (funcionarios) => {
    console.log('Dados atualizados:', funcionarios);
  }
);

// Limpar listener
unsubscribe();
```

---

## 💻 Como Usar no Código

### Exemplo 1: Registrar Ponto Offline

```javascript
import { firestoreAdapter } from '../utils/firestoreAdapter';
import { toast } from 'react-toastify';

const registrarPonto = async (funcionarioId, tipo) => {
  try {
    const pontoId = await firestoreAdapter.addDocument('pontos', {
      funcionarioId,
      tipo, // 'entrada', 'saida_almoco', 'retorno_almoco', 'saida'
      data: new Date().toISOString(),
      timestamp: Date.now()
    });

    toast.success('Ponto registrado com sucesso!');
    return pontoId;
  } catch (error) {
    toast.error('Erro ao registrar ponto');
    console.error(error);
  }
};
```

### Exemplo 2: Editar Funcionário Offline

```javascript
const editarFuncionario = async (funcId, dadosAtualizados) => {
  try {
    await firestoreAdapter.updateDocument('funcionarios', funcId, dadosAtualizados);
    toast.success('Funcionário atualizado!');
  } catch (error) {
    toast.error('Erro ao atualizar funcionário');
  }
};
```

### Exemplo 3: Listar Funcionários com Listener

```javascript
import { useEffect, useState } from 'react';
import { firestoreAdapter } from '../utils/firestoreAdapter';

const FuncionariosList = () => {
  const [funcionarios, setFuncionarios] = useState([]);

  useEffect(() => {
    const unsubscribe = firestoreAdapter.onSnapshotHybrid(
      'funcionarios',
      null, // sem filtro
      (data) => {
        setFuncionarios(data);
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <div>
      {funcionarios.map(func => (
        <div key={func.id}>{func.nome}</div>
      ))}
    </div>
  );
};
```

---

## 🎨 Componentes Visuais

### OfflineIndicator

**Localização:** Canto superior direito

**Estados:**
1. **Offline (Vermelho)**: CloudOff icon + "Modo Offline"
2. **Sincronizando (Laranja)**: RefreshCw icon (girando) + "Sincronizando..."
3. **Pendente (Laranja)**: Cloud icon + "X operações pendentes"
4. **Oculto**: Quando online sem operações pendentes

**Tooltip:**
Quando offline, mostra explicação sobre o funcionamento

### LogoWithOfflineIndicator

**Uso:**
```javascript
import LogoWithOfflineIndicator from './components/LogoWithOfflineIndicator';

<LogoWithOfflineIndicator 
  src="/logo.png"
  alt="WorkFlow"
  className="w-10 h-10"
/>
```

**Comportamento:**
- **Online**: Logo normal
- **Offline**: Logo com filtro vermelho + badge vermelho pulsante

---

## 🔧 Configuração e Integração

### 1. Já integrado no App.jsx

```javascript
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { syncManager } from './utils/syncManager';
import OfflineIndicator from './components/OfflineIndicator';

function AppContent() {
  const { isOnline, wasOffline } = useOnlineStatus();

  useEffect(() => {
    if (isOnline && wasOffline) {
      syncManager.startSync();
    }
  }, [isOnline, wasOffline]);

  return (
    <div className="App">
      <OfflineIndicator />
      {/* resto do app */}
    </div>
  );
}
```

### 2. Migrar código existente para usar o adapter

**ANTES:**
```javascript
import { addDoc, collection } from 'firebase/firestore';
import { db } from './firebase/firebase';

const docRef = await addDoc(collection(db, 'funcionarios'), data);
```

**DEPOIS:**
```javascript
import { firestoreAdapter } from './utils/firestoreAdapter';

const docId = await firestoreAdapter.addDocument('funcionarios', data);
```

---

## 🐛 Solução de Problemas

### Problema: Operações não sincronizam

**Solução:**
1. Verificar console: `syncManager.getPendingCount()`
2. Forçar sincronização: `syncManager.startSync()`
3. Verificar erros no console

### Problema: Dados duplicados

**Causa:** ID temporário offline + ID real do Firestore

**Solução:** O sistema já atualiza IDs automaticamente. Se persistir:
```javascript
await offlineStorage.clearCache(STORES.FUNCIONARIOS);
// Recarregar página para buscar do Firestore
```

### Problema: Cache muito grande

**Solução:** Implementar limpeza periódica:
```javascript
// Limpar dados antigos (exemplo: >30 dias)
const cleanOldData = async () => {
  const pontos = await offlineStorage.getFromCache(STORES.PONTOS);
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  
  for (const ponto of pontos) {
    if (ponto.timestamp < thirtyDaysAgo) {
      await offlineStorage.deleteFromCache(STORES.PONTOS, ponto.id);
    }
  }
};
```

---

## 📊 Métricas e Monitoramento

### Verificar Status

```javascript
// No console do navegador:

// Status da conexão
navigator.onLine

// Operações pendentes
await syncManager.getPendingCount()

// Ver fila de sincronização
await offlineStorage.getPendingSync()

// Ver todos os funcionários no cache
await offlineStorage.getFromCache('funcionarios')

// Forçar sincronização
await syncManager.startSync()
```

### Logs Importantes

O sistema emite logs coloridos no console:

- 🟢 `Conexão restaurada`
- 🔴 `Conexão perdida - Modo offline ativado`
- 💾 `X item(s) salvo(s) em STORE`
- 📤 `Operação adicionada à fila de sincronização`
- 🔄 `Iniciando sincronização de X operação(ões)...`
- ✅ `Sincronização concluída`

---

## 🚀 Melhorias Futuras

### Planejadas:
- [ ] Compressão de dados no cache
- [ ] Upload de fotos offline (base64 no cache)
- [ ] Resolução de conflitos manual (UI)
- [ ] Configuração de limite de cache
- [ ] Estatísticas de uso offline

### Possíveis:
- [ ] Service Worker para cache de assets
- [ ] PWA completo com instalação
- [ ] Notificações de sincronização concluída
- [ ] Dashboard de operações offline

---

## 📝 Notas Técnicas

### IndexedDB vs LocalStorage

**Por que IndexedDB?**
- Armazena objetos complexos (não apenas strings)
- Capacidade muito maior (gigabytes vs ~5MB)
- Operações assíncronas (não bloqueia UI)
- Suporte a índices e queries
- Transações ACID

### IDs Temporários Offline

Quando offline, IDs são gerados no formato:
```
offline_1234567890_abc123
```

Ao sincronizar:
1. Firestore cria documento com ID real
2. Sistema atualiza ID local automaticamente
3. Próximas operações usam ID real

### Ordem de Sincronização

Operações são processadas por timestamp ascendente, garantindo que:
- Criar → Editar → Deletar aconteça na ordem correta
- Não haja conflitos de dependência
- Dados mantenham consistência

---

## ✅ Checklist de Implementação

- [x] Hook de detecção online/offline
- [x] Sistema de cache com IndexedDB
- [x] Fila de sincronização
- [x] Gerenciador de sincronização
- [x] Adapter Firestore offline
- [x] Indicador visual
- [x] Logo vermelho quando offline
- [x] Integração no App.jsx
- [x] Sincronização automática na reconexão
- [x] Notificações toast
- [x] Documentação completa
- [ ] Migrar componentes para usar adapter
- [ ] Testes em diferentes cenários
- [ ] Otimização de performance

---

## 🎓 Próximos Passos

1. **Testar funcionalidade offline:**
   - Abrir DevTools → Network tab
   - Selecionar "Offline"
   - Criar/Editar/Deletar dados
   - Voltar para "Online"
   - Verificar sincronização

2. **Migrar componentes existentes:**
   - Buscar por `addDoc(`, `updateDoc(`, `deleteDoc(`
   - Substituir por `firestoreAdapter.addDocument()`, etc.

3. **Adicionar LogoWithOfflineIndicator:**
   - Encontrar `<img src="logo.png"` ou similar
   - Substituir por `<LogoWithOfflineIndicator src="logo.png"`

---

**Desenvolvido para WorkFlow v2.0**  
*Sistema de gerenciamento empresarial com suporte offline completo*
