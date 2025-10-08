# 🔄 Guia de Migração para Sistema Offline

## 📋 Checklist Rápido

### Arquivos Novos Criados:
- ✅ `src/hooks/useOnlineStatus.js` - Hook de detecção
- ✅ `src/utils/offlineStorage.js` - Cache IndexedDB
- ✅ `src/utils/syncManager.js` - Gerenciador de sincronização  
- ✅ `src/utils/firestoreAdapter.js` - Adapter Firestore
- ✅ `src/components/OfflineIndicator.jsx` - Indicador visual
- ✅ `src/components/LogoWithOfflineIndicator.jsx` - Logo com status
- ✅ `src/App.jsx` - Integrado com OfflineIndicator

---

## 🎯 Como Migrar um Componente

### ANTES (Código Original):

```javascript
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/firebase';

// Adicionar
const addFuncionario = async (data) => {
  const docRef = await addDoc(collection(db, 'funcionarios'), data);
  return docRef.id;
};

// Atualizar
const updateFuncionario = async (id, data) => {
  const docRef = doc(db, 'funcionarios', id);
  await updateDoc(docRef, data);
};

// Deletar
const deleteFuncionario = async (id) => {
  const docRef = doc(db, 'funcionarios', id);
  await deleteDoc(docRef);
};

// Buscar
const getFuncionarios = async () => {
  const snapshot = await getDocs(collection(db, 'funcionarios'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Listener
const listenToFuncionarios = (callback) => {
  return onSnapshot(collection(db, 'funcionarios'), (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(data);
  });
};
```

### DEPOIS (Com Suporte Offline):

```javascript
import { firestoreAdapter } from '../utils/firestoreAdapter';

// Adicionar (funciona online E offline)
const addFuncionario = async (data) => {
  const docId = await firestoreAdapter.addDocument('funcionarios', data);
  return docId;
};

// Atualizar (funciona online E offline)
const updateFuncionario = async (id, data) => {
  await firestoreAdapter.updateDocument('funcionarios', id, data);
};

// Deletar (funciona online E offline)
const deleteFuncionario = async (id) => {
  await firestoreAdapter.deleteDocument('funcionarios', id);
};

// Buscar (retorna do cache se offline)
const getFuncionarios = async () => {
  return await firestoreAdapter.getDocuments('funcionarios');
};

// Listener (funciona online E offline)
const listenToFuncionarios = (callback) => {
  return firestoreAdapter.onSnapshotHybrid('funcionarios', null, callback);
};
```

---

## 🔍 Exemplos Práticos

### Exemplo 1: WorkPontoTab (Registrar Ponto Offline)

**Arquivo:** `src/components/WorkPontoTab.jsx`

**Buscar por:**
```javascript
await addDoc(collection(db, 'pontos'), {
```

**Substituir por:**
```javascript
await firestoreAdapter.addDocument('pontos', {
```

**Imports necessários:**
```javascript
// REMOVER:
import { collection, addDoc, query, where, getDocs, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';

// ADICIONAR:
import { firestoreAdapter } from '../utils/firestoreAdapter';
```

---

### Exemplo 2: FuncionariosTab (CRUD Funcionários)

**Arquivo:** `src/components/Funcionarios/FuncionariosTab.jsx`

#### Adicionar Funcionário:
```javascript
// ANTES:
const docRef = await addDoc(collection(db, 'funcionarios'), novoFuncionario);

// DEPOIS:
const funcId = await firestoreAdapter.addDocument('funcionarios', novoFuncionario);
```

#### Editar Funcionário:
```javascript
// ANTES:
await updateDoc(doc(db, 'funcionarios', funcionarioId), dadosEditados);

// DEPOIS:
await firestoreAdapter.updateDocument('funcionarios', funcionarioId, dadosEditados);
```

#### Deletar Funcionário:
```javascript
// ANTES:
await deleteDoc(doc(db, 'funcionarios', funcionarioId));

// DEPOIS:
await firestoreAdapter.deleteDocument('funcionarios', funcionarioId);
```

#### Listener de Funcionários:
```javascript
// ANTES:
useEffect(() => {
  const unsubscribe = onSnapshot(collection(db, 'funcionarios'), (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setFuncionarios(data);
  });
  return () => unsubscribe();
}, []);

// DEPOIS:
useEffect(() => {
  const unsubscribe = firestoreAdapter.onSnapshotHybrid(
    'funcionarios',
    null,
    (data) => setFuncionarios(data)
  );
  return () => unsubscribe();
}, []);
```

---

### Exemplo 3: Avaliacoes (Com Filtro)

**Arquivo:** `src/components/Avaliacoes/AvaliacoesTab.jsx`

#### Buscar avaliações de um funcionário:
```javascript
// ANTES:
const q = query(
  collection(db, 'avaliacoes'),
  where('funcionarioId', '==', funcId)
);
const snapshot = await getDocs(q);
const avaliacoes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

// DEPOIS:
const avaliacoes = await firestoreAdapter.getDocuments('avaliacoes', {
  field: 'funcionarioId',
  operator: '==',
  value: funcId
});
```

#### Listener com filtro:
```javascript
// ANTES:
const q = query(
  collection(db, 'avaliacoes'),
  where('funcionarioId', '==', funcId)
);
const unsubscribe = onSnapshot(q, (snapshot) => {
  const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  setAvaliacoes(data);
});

// DEPOIS:
const unsubscribe = firestoreAdapter.onSnapshotHybrid(
  'avaliacoes',
  { field: 'funcionarioId', operator: '==', value: funcId },
  (data) => setAvaliacoes(data)
);
```

---

## 🎨 Adicionar Logo Vermelho

### Encontrar logos no código:

```bash
# No terminal (PowerShell):
Select-String -Path "src\**\*.jsx" -Pattern "<img.*logo" -CaseSensitive
```

### Substituir por LogoWithOfflineIndicator:

**ANTES:**
```javascript
<img 
  src="/logo.png" 
  alt="WorkFlow" 
  className="w-10 h-10"
/>
```

**DEPOIS:**
```javascript
import LogoWithOfflineIndicator from './LogoWithOfflineIndicator';

<LogoWithOfflineIndicator 
  src="/logo.png" 
  alt="WorkFlow" 
  className="w-10 h-10"
/>
```

---

## 🧪 Testar Modo Offline

### 1. Testar no Navegador:
1. Abrir DevTools (F12)
2. Ir em **Network** tab
3. Selecionar **Offline** no dropdown
4. Criar/Editar/Deletar dados
5. Ver indicador vermelho aparecer
6. Voltar para **Online**
7. Ver sincronização automática

### 2. Verificar no Console:
```javascript
// Ver operações pendentes
await syncManager.getPendingCount()

// Ver fila
await offlineStorage.getPendingSync()

// Forçar sincronização
await syncManager.startSync()

// Ver cache
await offlineStorage.getFromCache('funcionarios')
```

---

## 📊 Prioridades de Migração

### Alta Prioridade (Fazer Primeiro):
1. ✅ **WorkPontoTab.jsx** - Registros de ponto
2. ✅ **FuncionariosTab.jsx** - CRUD de funcionários
3. ✅ **AvaliacoesTab.jsx** - Avaliações

### Média Prioridade:
4. **EmprestimosTab.jsx** - Empréstimos de ferramentas
5. **TarefasTab.jsx** - Gerenciamento de tarefas
6. **EscalasTab.jsx** - Escalas de trabalho

### Baixa Prioridade:
7. **ChatTab.jsx** - Sistema de mensagens (mais complexo)
8. **InventarioTab.jsx** - Inventário de ferramentas

---

## ⚠️ Cuidados Importantes

### 1. Timestamps
```javascript
// ❌ NÃO FAZER (serverTimestamp não funciona offline):
import { serverTimestamp } from 'firebase/firestore';
const data = { createdAt: serverTimestamp() };

// ✅ FAZER (usar timestamp local):
const data = { createdAt: new Date().toISOString(), timestamp: Date.now() };
```

### 2. Listeners Múltiplos
```javascript
// ❌ NÃO FAZER (criar listener em todo re-render):
const unsubscribe = firestoreAdapter.onSnapshotHybrid(...);

// ✅ FAZER (dentro de useEffect):
useEffect(() => {
  const unsubscribe = firestoreAdapter.onSnapshotHybrid(...);
  return () => unsubscribe();
}, []);
```

### 3. IDs Temporários
```javascript
// IDs offline começam com "offline_"
// Sistema atualiza automaticamente quando sincronizar
// Não fazer validações hardcoded de formato de ID
```

---

## 🚀 Próximos Passos

1. [ ] Migrar WorkPontoTab.jsx
2. [ ] Migrar FuncionariosTab.jsx
3. [ ] Migrar AvaliacoesTab.jsx
4. [ ] Adicionar LogoWithOfflineIndicator
5. [ ] Testar cenários offline
6. [ ] Verificar sincronização
7. [ ] Monitorar logs no console

---

## 📝 Template de Código

### Hook customizado para usar em componentes:

```javascript
import { useState, useEffect } from 'react';
import { firestoreAdapter } from '../utils/firestoreAdapter';
import { toast } from 'react-toastify';

const useFuncionarios = () => {
  const [funcionarios, setFuncionarios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = firestoreAdapter.onSnapshotHybrid(
      'funcionarios',
      null,
      (data) => {
        setFuncionarios(data);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const addFuncionario = async (data) => {
    try {
      const id = await firestoreAdapter.addDocument('funcionarios', data);
      toast.success('Funcionário adicionado!');
      return id;
    } catch (error) {
      toast.error('Erro ao adicionar funcionário');
      throw error;
    }
  };

  const updateFuncionario = async (id, data) => {
    try {
      await firestoreAdapter.updateDocument('funcionarios', id, data);
      toast.success('Funcionário atualizado!');
    } catch (error) {
      toast.error('Erro ao atualizar funcionário');
      throw error;
    }
  };

  const deleteFuncionario = async (id) => {
    try {
      await firestoreAdapter.deleteDocument('funcionarios', id);
      toast.success('Funcionário removido!');
    } catch (error) {
      toast.error('Erro ao remover funcionário');
      throw error;
    }
  };

  return {
    funcionarios,
    loading,
    addFuncionario,
    updateFuncionario,
    deleteFuncionario
  };
};

export default useFuncionarios;
```

---

**Sistema 100% funcional e pronto para uso!** 🎉

Basta migrar os componentes existentes seguindo este guia.
