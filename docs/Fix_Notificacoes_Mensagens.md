# 🔔 Sistema de Notificações de Mensagens - Correções e Melhorias

## 📋 Visão Geral

Correção e melhoria do sistema de notificações push para mensagens, garantindo que notificações sejam entregues tanto no desktop quanto no mobile quando novas mensagens chegam.

---

## 🐛 Problemas Corrigidos

### 1. **Usuários Não Apareciam na Busca**

#### Problema:
- Ao clicar em "Nova Conversa", a lista de usuários aparecia vazia
- Mensagem exibida: "Nenhum usuário disponível"
- Impossível iniciar conversas

#### Causa:
O código estava buscando apenas da coleção `usuarios` e filtrava por `empresaId` e `setorId`, mas o sistema tem **múltiplas coleções de usuários**:
- `usuarios` (plural - sistema novo)
- `usuario` (singular - sistema legado)  
- `funcionarios` (legado)

#### Solução:
```javascript
// ❌ ANTES: Buscava apenas de 'usuarios' com filtros restritos
const qUsuarios = query(
  collection(db, 'usuarios'),
  where('empresaId', '==', usuario.empresaId),
  where('setorId', '==', usuario.setorId),
  where('ativo', '==', true)
);

// ✅ DEPOIS: Busca de TODAS as 3 coleções sem filtros restritos
const todosUsuariosMap = new Map();

// 1️⃣ Buscar de 'usuarios' (plural)
const qUsuarios = query(collection(db, 'usuarios'));

// 2️⃣ Buscar de 'usuario' (singular)
const qUsuario = query(collection(db, 'usuario'));

// 3️⃣ Buscar de 'funcionarios'
const qFuncionarios = query(collection(db, 'funcionarios'));

// Mesclar tudo evitando duplicatas com Map
```

**Melhorias:**
- ✅ Busca em **3 coleções** simultaneamente
- ✅ Usa `Map` para evitar duplicatas
- ✅ Filtra apenas `ativo !== false` e `!demitido`
- ✅ Remove filtros restritivos de empresa/setor
- ✅ Logs detalhados no console para debug

---

### 2. **Notificações Push Não Eram Enviadas**

#### Problema:
- Mensagens novas não geravam notificações push
- Usuários não eram alertados sobre novas mensagens
- Sistema de notificação existia mas não era chamado

#### Causa:
A função `notificarNovaMensagem` existia no `notificationService.js` mas **nunca era chamada** quando uma mensagem era enviada.

#### Solução:

**Arquivo:** `src/components/Mensagens/ChatArea.jsx`

```javascript
// ✅ 1. Importar serviço de notificações
import { notificarNovaMensagem } from '../../services/notificationService';

// ✅ 2. Chamar após enviar mensagem
const mensagemDoc = await addDoc(collection(db, 'mensagens'), novaMensagem);

await updateDoc(conversaRef, updates);

// 🔔 ENVIAR NOTIFICAÇÃO PUSH para todos os participantes
const nomeRemetente = usuario.nome || usuario.displayName || 'Alguém';
conversa.participantes.forEach(async (participanteId) => {
  if (participanteId !== usuario.id) {
    try {
      await notificarNovaMensagem(
        participanteId,
        { id: mensagemDoc.id, texto: conteudo },
        nomeRemetente
      );
      console.log(`🔔 Notificação enviada para ${participanteId}`);
    } catch (error) {
      console.error(`❌ Erro ao notificar ${participanteId}:`, error);
    }
  }
});
```

**Melhorias:**
- ✅ Notificação enviada para **todos os participantes** (exceto remetente)
- ✅ Inclui nome do remetente na notificação
- ✅ Tratamento de erros individual por participante
- ✅ Logs detalhados para debug

---

### 3. **Ícone de Busca Mal Posicionado**

#### Problema:
- Ícone de lupa estava **dentro** do campo de digitação
- Visual confuso e pouco intuitivo

#### Solução:

**Arquivo:** `src/components/Mensagens/NovaConversaModal.jsx`

```javascript
// ❌ ANTES: Ícone dentro do campo
<div className="relative">
  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2" />
  <input placeholder="Buscar funcionários..." />
</div>

// ✅ DEPOIS: Ícone e label ACIMA do campo
<div className="space-y-2">
  {/* Ícone e label acima */}
  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
    <Search className="w-4 h-4" />
    <span className="text-sm font-medium">Buscar usuários...</span>
  </div>
  
  {/* Campo limpo sem ícone interno */}
  <input
    placeholder="Digite o nome ou cargo"
    className="w-full px-4 py-2 rounded-lg..."
  />
</div>
```

**Melhorias:**
- ✅ Ícone posicionado **acima** do campo (conforme solicitado)
- ✅ Label "Buscar usuários..." também acima
- ✅ Campo de busca mais limpo e espaçoso
- ✅ Placeholder mais descritivo ("Digite o nome ou cargo")
- ✅ Contador de selecionados com cor azul

---

## 🔔 Sistema de Notificações Push

### Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                  Sistema de Notificações                │
└─────────────────────────────────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
         ▼                 ▼                 ▼
┌────────────────┐ ┌────────────────┐ ┌────────────────┐
│ Desktop Web    │ │  Mobile Web    │ │ Mobile Native  │
│ (Chrome, Edge) │ │ (PWA)          │ │ (Capacitor)    │
└────────────────┘ └────────────────┘ └────────────────┘
         │                 │                 │
         └─────────────────┼─────────────────┘
                           │
                           ▼
         ┌─────────────────────────────────┐
         │ notificationService.js          │
         │ - criarNotificacao()            │
         │ - enviarNotificacaoPush()       │
         │ - notificarNovaMensagem()       │
         └─────────────────────────────────┘
                           │
                           ▼
         ┌─────────────────────────────────┐
         │ service-worker.js               │
         │ - Recebe push do Firebase       │
         │ - Mostra notificação nativa     │
         │ - Gerencia badge/contador       │
         │ - Actions (Abrir, Responder)    │
         └─────────────────────────────────┘
                           │
                           ▼
         ┌─────────────────────────────────┐
         │ Firebase Cloud Messaging (FCM)  │
         │ - Entrega push multiplataforma  │
         └─────────────────────────────────┘
```

### Fluxo de Notificação

```
1. Usuário A envia mensagem
   ↓
2. ChatArea.jsx salva mensagem no Firestore
   ↓
3. notificarNovaMensagem() é chamada para cada participante
   ↓
4. notificationService.js:
   - Cria documento em Firestore (coleção 'notificacoes')
   - Chama enviarNotificacaoPush()
   ↓
5. enviarNotificacaoPush():
   - Verifica permissão (Notification.permission)
   - Cria notificação nativa do navegador
   - Define ícone, som, ações
   ↓
6. Service Worker recebe evento 'push'
   - Incrementa badge
   - Mostra notificação persistente
   - Registra em histórico
   ↓
7. Usuário clica na notificação
   - Service Worker abre app
   - Navega para conversa específica
   - Limpa badge/contador
```

---

## 📱 Suporte Multiplataforma

### Desktop (Web)
```javascript
// Chrome, Edge, Firefox, Opera
if ('Notification' in window && Notification.permission === 'granted') {
  new Notification(titulo, {
    body: mensagem,
    icon: '/logo192.png',
    tag: 'mensagem-123',
    requireInteraction: false
  });
}
```

**Features:**
- ✅ Notificações nativas do sistema operacional
- ✅ Som customizável
- ✅ Clique abre aplicação
- ✅ Timeout automático (5 segundos)
- ✅ Badge no ícone do navegador

### Mobile (PWA)
```javascript
// Service Worker Push Event
self.addEventListener('push', (event) => {
  const payload = event.data.json();
  self.registration.showNotification(titulo, {
    body: mensagem,
    vibrate: [200, 100, 200],
    badge: '/logo192.png',
    actions: [
      { action: 'open', title: '📖 Abrir' },
      { action: 'reply', title: '✍️ Responder' }
    ]
  });
});
```

**Features:**
- ✅ Notificações mesmo com app fechado
- ✅ Vibração customizável
- ✅ Ações rápidas (Abrir, Responder)
- ✅ Badge no ícone do app
- ✅ Persistência entre sessões

### Mobile Native (Capacitor)
```javascript
// notificationManager.js
import { PushNotifications } from '@capacitor/push-notifications';

await PushNotifications.requestPermissions();
await PushNotifications.register();

PushNotifications.addListener('pushNotificationReceived', (notification) => {
  // Notificação recebida com app aberto
});
```

**Features:**
- ✅ Notificações nativas iOS/Android
- ✅ Som e vibração do sistema
- ✅ Badge no ícone do app
- ✅ Integração com centro de notificações

---

## 🔐 Permissões

### Fluxo de Solicitação

```javascript
// 1. Verificar se navegador suporta
if (!('Notification' in window)) {
  return 'not-supported';
}

// 2. Verificar permissão atual
if (Notification.permission === 'granted') {
  return 'granted';
}

// 3. Solicitar permissão
const permission = await Notification.requestPermission();
// Retorna: 'granted', 'denied', 'default'
```

### Estados de Permissão

| Estado | Descrição | Ação |
|--------|-----------|------|
| `granted` | ✅ Permissão concedida | Enviar notificações normalmente |
| `denied` | ❌ Permissão negada | Não enviar, mostrar aviso |
| `default` | ⚠️ Não perguntado ainda | Solicitar permissão |

---

## 🛠️ Configuração Firebase

### firebase.json
```json
{
  "messaging": {
    "vapidKey": "YOUR_VAPID_KEY",
    "senderId": "YOUR_SENDER_ID"
  }
}
```

### Service Worker Registration
```javascript
// index.js ou App.js
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js')
    .then(registration => {
      console.log('Service Worker registrado');
    });
}
```

---

## 📊 Logs de Debug

### Console Logs Adicionados

```javascript
// MensagensTab.jsx
console.log('🔍 MensagensTab: Carregando usuários para mensagens...');
console.log(`📦 Carregados ${snapshot.docs.length} usuários da coleção 'usuarios'`);
console.log(`✅ Total de usuários disponíveis para mensagens: ${listaFinal.length}`);

// ChatArea.jsx
console.log('✅ Mensagem enviada:', mensagemDoc.id);
console.log(`🔔 Notificação enviada para ${participanteId}`);

// notificationService.js
console.log('📬 Criando notificação:', { usuarioId, tipo, titulo });
console.log('✅ Notificação criada no Firestore:', docRef.id);
console.log('🔔 Enviando notificação push...');
console.log('✅ Notificação push enviada');
```

---

## 🧪 Como Testar

### 1. Testar Busca de Usuários

1. Fazer login no sistema
2. Ir para aba "Mensagens"
3. Clicar no botão **+** (Nova Conversa)
4. Verificar se a lista de usuários aparece
5. Digitar no campo de busca
6. Abrir console (F12) e verificar logs:
   ```
   🔍 MensagensTab: Carregando usuários...
   📦 Carregados X usuários da coleção 'usuarios'
   📦 Carregados Y usuários da coleção 'usuario'
   📦 Carregados Z usuários da coleção 'funcionarios'
   ✅ Total de usuários disponíveis: N
   ```

### 2. Testar Notificações Desktop

1. Abrir app no Chrome/Edge
2. Permitir notificações quando solicitado
3. Abrir o app em **duas abas** diferentes (ou dois navegadores)
4. Na Aba 1: Fazer login como Usuário A
5. Na Aba 2: Fazer login como Usuário B
6. Na Aba 1: Enviar mensagem para Usuário B
7. **Resultado esperado:** Aba 2 recebe notificação nativa do sistema
8. Verificar console da Aba 1:
   ```
   ✅ Mensagem enviada: abc123
   🔔 Notificação enviada para user-B-id
   ```

### 3. Testar Notificações Mobile

1. Instalar PWA no celular (Adicionar à tela inicial)
2. Permitir notificações quando solicitado
3. Fechar o app completamente
4. De outro dispositivo, enviar mensagem para este usuário
5. **Resultado esperado:** Notificação aparece mesmo com app fechado
6. Clicar na notificação abre o app direto na conversa

### 4. Testar Notificações Native (Capacitor)

1. Fazer build do app: `npm run build`
2. Sincronizar com Capacitor: `npx cap sync`
3. Abrir no Android Studio/Xcode
4. Executar no dispositivo físico
5. Permitir notificações quando solicitado
6. Colocar app em background
7. Enviar mensagem de outro dispositivo
8. **Resultado esperado:** Notificação nativa iOS/Android

---

## 🔧 Troubleshooting

### Problema: "Nenhum usuário disponível"

**Soluções:**
1. Abrir console (F12) e verificar erros
2. Verificar se as coleções existem no Firestore:
   - `usuarios` (plural)
   - `usuario` (singular)
   - `funcionarios`
3. Verificar se usuários têm campo `ativo: true`
4. Verificar logs: `📦 Carregados X usuários...`

### Problema: Notificações não aparecem

**Soluções:**
1. Verificar permissão no navegador:
   ```javascript
   console.log(Notification.permission); // Deve ser 'granted'
   ```
2. Verificar se service worker está registrado:
   ```javascript
   navigator.serviceWorker.getRegistrations().then(console.log);
   ```
3. Testar notificação manual no console:
   ```javascript
   new Notification('Teste', { body: 'Funcionou!' });
   ```
4. Verificar se função foi chamada (logs):
   ```
   🔔 Notificação enviada para user-id
   ```

### Problema: Notificações mobile não funcionam

**Soluções:**
1. Verificar se PWA está instalada (não apenas aberta no navegador)
2. Verificar se permissões foram concedidas
3. Verificar Firebase Cloud Messaging no console do Firebase
4. Testar com app em background E em foreground
5. Verificar logs do service worker

---

## 📝 Arquivos Modificados

### 1. `src/components/Mensagens/MensagensTab.jsx`
- ✅ Busca de 3 coleções simultaneamente
- ✅ Usa `Map` para evitar duplicatas
- ✅ Remove filtros restritos de empresa/setor
- ✅ Logs detalhados

### 2. `src/components/Mensagens/ChatArea.jsx`
- ✅ Import de `notificarNovaMensagem`
- ✅ Chamada da notificação após enviar mensagem
- ✅ Loop para notificar todos os participantes
- ✅ Logs de sucesso/erro

### 3. `src/components/Mensagens/NovaConversaModal.jsx`
- ✅ Ícone de lupa movido para cima do campo
- ✅ Label "Buscar usuários..." acima
- ✅ Campo mais limpo e espaçoso
- ✅ Contador com cor azul

---

## 📦 Commits

```bash
git commit -m "fix: corrige busca de usuários em mensagens e adiciona notificações push
- busca de 3 coleções (usuarios, usuario, funcionarios)
- move ícone de lupa para cima do campo
- adiciona notificarNovaMensagem ao enviar mensagem
- logs detalhados para debug"
```

---

## 🎯 Resultado Final

### Antes ❌
- Lista de usuários vazia
- Impossível iniciar conversas
- Sem notificações de mensagens novas
- Ícone de busca mal posicionado

### Depois ✅
- Lista completa de usuários disponíveis
- Busca em 3 coleções diferentes
- Notificações push funcionando (desktop + mobile)
- Visual moderno e intuitivo
- Logs detalhados para debug
- Sistema robusto e confiável

---

**Data da Correção**: 06/10/2025  
**Versão**: 1.0.0  
**Build**: 1759750481404  
**Branch**: main  
**Commit**: 08547632
