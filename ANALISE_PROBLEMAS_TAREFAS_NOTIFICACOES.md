# 🔍 Análise: Problemas de Tarefas e Notificações

## 📋 Problemas Identificados

### ❌ Problema 1: Tarefas não aparecem para funcionários
**Localização:** `TarefasTab.jsx` linha 220-257

**Causa Raiz:**
O filtro `isUserAssigned` está usando lógica de comparação **case-sensitive** e depende de múltiplas condições que podem falhar:

```javascript
const checkName = (name1, name2) => {
  if (!name1 || !name2) return false;
  return name1.toLowerCase() === name2.toLowerCase();  // ✅ Case insensitive OK
};

// ❌ PROBLEMA: Verifica por NOME e ID separadamente
const estaNosIds = tarefa.funcionariosIds?.some(id => {
  const matchNome = checkName(id, usuarioNome);  // Compara ID com NOME
  const matchId = id === usuarioId;               // Compara ID com ID
  return matchNome || matchId;
});
```

**Problemas específicos:**
1. ✅ `checkName` funciona bem (case insensitive)
2. ❌ `estaNosIds` compara ID do array com NOME do usuário (pode não funcionar)
3. ❌ Tarefas antigas têm `funcionariosIds` com NOMES
4. ❌ Tarefas novas têm `funcionariosIds` com IDs
5. ❌ Mistura de dados antigos e novos causa inconsistência

---

### ❌ Problema 2: Notificações push não funcionam
**Localização:** `CriarTarefa.jsx` linha 68-78

**Fluxo atual:**
```javascript
// 1. Tarefa é criada no Firestore
await addDoc(collection(db, 'tarefas'), tarefaData);

// 2. Notificação é criada no Firestore
await notifyNewTask(funcionarioId, titulo, prioridade, tarefa);

// 3. ❌ MAS... não há integração com Firebase Cloud Messaging!
```

**O que está faltando:**
1. ❌ **Não há chamada para `pushNotificationService`** após criar a notificação
2. ❌ **Não há trigger no backend** para enviar push quando nova notificação é criada
3. ❌ **Não há Firebase Cloud Function** para processar notificações

**Arquitetura atual vs necessária:**

```
ATUAL (INCOMPLETO):
┌─────────────┐
│ CriarTarefa │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│ notifyNewTask() │ ─── Cria doc no Firestore
└─────────────────┘
       │
       ▼
┌──────────────────┐
│   Firestore      │
│ /notificacoes    │ ❌ Fica parado aqui!
└──────────────────┘

NECESSÁRIO:
┌─────────────┐
│ CriarTarefa │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│ notifyNewTask() │ ─── Cria doc no Firestore
└──────┬──────────┘
       │
       ▼
┌──────────────────┐     ┌──────────────────────┐
│   Firestore      │     │ Cloud Function       │
│ /notificacoes    │────▶│ sendPushOnNewDoc()   │
└──────────────────┘     └──────┬───────────────┘
                                │
                                ▼
                         ┌─────────────────┐
                         │  Firebase FCM   │
                         └────────┬────────┘
                                  │
                                  ▼
                            ┌──────────┐
                            │  Mobile  │
                            │   App    │
                            └──────────┘
```

---

## ✅ Soluções

### 🔧 Solução 1: Corrigir filtro de tarefas

**Estratégia:** Normalizar comparação para suportar tanto IDs quanto nomes

```javascript
const isUserAssigned = (tarefa) => {
  if (!usuario) return false;
  
  const usuarioNome = usuario?.nome?.toLowerCase();
  const usuarioId = usuario?.id;
  const usuarioEmail = usuario?.email?.toLowerCase();
  
  // Função helper melhorada
  const matchUser = (value) => {
    if (!value) return false;
    const valueLower = String(value).toLowerCase();
    
    return valueLower === usuarioId ||                    // Match por ID
           valueLower === usuarioNome ||                  // Match por nome
           valueLower === usuarioEmail ||                 // Match por email
           valueLower.includes(usuarioNome) ||            // Nome parcial
           usuarioNome?.includes(valueLower);             // Nome reverso
  };
  
  // Verificar array de funcionáriosIds (pode ter IDs ou nomes)
  const estaNosIds = tarefa.funcionariosIds?.some(matchUser);
  
  // Verificar campos legados
  const ehResponsavel = matchUser(tarefa.responsavel);
  const ehFuncionario = matchUser(tarefa.funcionario);
  
  return estaNosIds || ehResponsavel || ehFuncionario;
};
```

---

### 🔧 Solução 2A: Push via Cloud Functions (Recomendado)

**Criar Cloud Function para enviar push automaticamente:**

```javascript
// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.sendPushOnNewNotification = functions.firestore
  .document('notificacoes/{notificationId}')
  .onCreate(async (snap, context) => {
    const notification = snap.data();
    const usuarioId = notification.usuarioId;
    
    // Buscar tokens do usuário
    const userDoc = await admin.firestore()
      .collection('usuarios')
      .doc(usuarioId)
      .get();
    
    const tokens = userDoc.data()?.fcmTokens || [];
    
    if (tokens.length === 0) {
      console.log('Usuário sem tokens FCM');
      return;
    }
    
    // Criar mensagem push
    const message = {
      notification: {
        title: notification.titulo,
        body: notification.mensagem,
        icon: '/icon-192x192.png'
      },
      data: {
        tipo: notification.tipo,
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
        tarefaId: notification.dados?.id || ''
      },
      tokens: tokens
    };
    
    // Enviar para todos os tokens
    try {
      const response = await admin.messaging().sendMulticast(message);
      console.log(`✅ Push enviado: ${response.successCount} sucessos, ${response.failureCount} falhas`);
      
      // Remover tokens inválidos
      const tokensToRemove = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          tokensToRemove.push(tokens[idx]);
        }
      });
      
      if (tokensToRemove.length > 0) {
        await admin.firestore()
          .collection('usuarios')
          .doc(usuarioId)
          .update({
            fcmTokens: admin.firestore.FieldValue.arrayRemove(...tokensToRemove)
          });
      }
    } catch (error) {
      console.error('❌ Erro ao enviar push:', error);
    }
  });
```

**Comandos para deploy:**
```bash
cd functions
npm install firebase-functions firebase-admin
firebase deploy --only functions
```

---

### 🔧 Solução 2B: Push direto no cliente (Alternativa)

**Modificar `CriarTarefa.jsx` para enviar push diretamente:**

```javascript
import { sendPushNotification } from '../../services/pushNotificationService';

const handleSubmit = async (e) => {
  // ... código existente ...
  
  const docRef = await addDoc(collection(db, 'tarefas'), tarefaData);
  
  // Criar notificações E enviar push
  for (const funcionarioId of formData.funcionariosIds) {
    const funcionario = funcionariosSelecionados.find(f => f.id === funcionarioId);
    
    // 1. Criar notificação no Firestore
    await notifyNewTask(funcionarioId, formData.titulo, formData.prioridade, tarefaData);
    
    // 2. Enviar push notification diretamente
    try {
      await sendPushNotification(
        funcionarioId,
        '📋 Nova tarefa atribuída',
        `Você foi designado para: ${formData.titulo}`,
        {
          tipo: 'tarefa',
          tarefaId: docRef.id,
          prioridade: formData.prioridade
        }
      );
      console.log(`✅ Push enviado para ${funcionario?.nome}`);
    } catch (pushError) {
      console.error('Erro ao enviar push:', pushError);
      // Não bloqueia a criação da tarefa
    }
  }
};
```

**Criar função `sendPushNotification` em `pushNotificationService.js`:**

```javascript
/**
 * Envia push notification para um usuário específico
 */
export async function sendPushNotification(usuarioId, titulo, corpo, dados = {}) {
  try {
    // Buscar tokens FCM do usuário
    const userRef = doc(db, 'usuarios', usuarioId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      console.warn('Usuário não encontrado:', usuarioId);
      return;
    }
    
    const userData = userSnap.data();
    const tokens = userData.fcmTokens || [];
    
    if (tokens.length === 0) {
      console.warn('Usuário sem tokens FCM:', usuarioId);
      return;
    }
    
    // Para web: usar Notification API
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(titulo, {
        body: corpo,
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        tag: dados.tipo || 'notification',
        data: dados
      });
    }
    
    // Para mobile: enviar via FCM (requer Cloud Function ou backend)
    // Aqui você precisaria chamar seu backend/Cloud Function
    console.log('📱 Push notification preparado:', { titulo, corpo, tokens });
    
  } catch (error) {
    console.error('Erro ao enviar push notification:', error);
    throw error;
  }
}
```

---

## 🎯 Recomendações

### ✅ Prioridade ALTA (Fazer agora)
1. **Corrigir filtro `isUserAssigned`** - Tarefas aparecerão para funcionários
2. **Testar com console.log** para debug
3. **Verificar dados no Firestore** - Confirmar se `funcionariosIds` contém IDs corretos

### ⚠️ Prioridade MÉDIA (Fazer depois)
4. **Implementar Cloud Functions** para push automático (melhor solução)
5. **Ou implementar push direto no cliente** (solução alternativa mais rápida)

### 💡 Prioridade BAIXA (Melhorias futuras)
6. **Migrar tarefas antigas** para usar IDs em vez de nomes
7. **Adicionar índices no Firestore** para queries mais rápidas
8. **Implementar retry** para notificações que falharem

---

## 🧪 Como Testar

### Teste 1: Tarefas aparecem
```javascript
// No console do navegador:
console.log('Usuario:', usuario);
console.log('Tarefas:', tarefas);
console.log('Tarefas filtradas:', tarefasFiltradas);
```

### Teste 2: Notificações criadas
```javascript
// No Firestore, verificar coleção 'notificacoes'
// Deve ter documentos com:
{
  usuarioId: "abc123",
  tipo: "tarefa",
  titulo: "📋 Nova tarefa atribuída",
  mensagem: "...",
  lida: false,
  timestamp: ...
}
```

### Teste 3: Push notifications
```javascript
// No console, após criar tarefa:
// Deve aparecer: "✅ Push enviado para [nome do funcionário]"
```

---

## 📊 Status Atual

| Componente | Status | Funciona? |
|-----------|--------|-----------|
| Criar tarefa | ✅ | Sim |
| Salvar no Firestore | ✅ | Sim |
| Criar notificação | ✅ | Sim |
| Filtro de tarefas | ⚠️ | Parcial (só funciona com nomes) |
| Push para mobile | ❌ | Não |
| Push para web | ❌ | Não |
| Cloud Functions | ❌ | Não existe |

---

## 🚀 Próximos Passos

1. ✅ Aplicar correção do filtro `isUserAssigned`
2. ✅ Testar se tarefas aparecem
3. ⏭️ Escolher solução de push (Cloud Functions OU direto no cliente)
4. ⏭️ Implementar solução escolhida
5. ⏭️ Testar push notifications
6. ⏭️ Deploy e monitoramento

---

**Última atualização:** $(date)
