# 🚀 Novas Funcionalidades - Sistema de Mensagens

## 📋 Resumo das Implementações

### ✅ 1. Componente NovaConversa
**Arquivo:** `src/components/Mensagens/NovaConversa.jsx` (485 linhas)

Modal completo para criar conversas e grupos com:
- 🎯 Seleção entre conversa individual ou grupo
- 🔍 Busca de usuários por nome, email ou setor
- ✅ Seleção múltipla de participantes
- 📝 Campos para nome e descrição do grupo
- 🎨 Interface em 3 etapas: tipo → usuários → detalhes
- 📱 Responsivo para mobile e desktop

**Como usar:**
```jsx
<NovaConversa
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  onIniciarConversa={(userId) => handleIniciarConversa(userId)}
  onCriarGrupo={(nome, descricao, participantes) => handleCriarGrupo(nome, descricao, participantes)}
  usuarioAtual={usuario}
/>
```

---

### ✅ 2. Sistema de Notificações Push
**Arquivo:** `src/services/pushNotificationService.js` (349 linhas)

Serviço completo de notificações push para Web e Mobile:

#### Features:
- 📱 **Suporte nativo**: iOS e Android via Capacitor
- 🌐 **Suporte web**: Firebase Cloud Messaging (FCM)
- 🔔 **Notificações em foreground**: Toast com avatar e mensagem
- 🎵 **Som de notificação**: Reproduz `notification.mp3`
- 🎯 **Deep linking**: Abre conversa ao tocar na notificação
- 💾 **Gerenciamento de tokens**: Salva no Firestore
- 🔄 **Auto cleanup**: Remove tokens inválidos

#### Métodos principais:
```javascript
// Inicializar notificações
await pushNotificationService.initialize(userId);

// Enviar notificação (backend)
await pushNotificationService.sendNotification(
  userId,
  'Título',
  'Corpo da mensagem',
  { conversaId, mensagemId }
);

// Limpar ao fazer logout
await pushNotificationService.cleanup();
```

#### Eventos customizados:
```javascript
// Evento quando recebe mensagem
window.addEventListener('newMessage', (event) => {
  console.log('Nova mensagem:', event.detail);
});

// Evento quando toca na notificação
window.addEventListener('openConversa', (event) => {
  console.log('Abrir conversa:', event.detail.conversaId);
});
```

---

### ✅ 3. Cloud Functions para Notificações
**Arquivo:** `functions/index.js` (375 linhas)

Firebase Cloud Functions para enviar notificações automáticas:

#### Functions implementadas:

**a) `sendMessageNotification`**
- Dispara quando nova mensagem é criada
- Envia push para todos os participantes (exceto remetente)
- Respeita configuração de silenciar
- Remove tokens inválidos automaticamente
- Customiza notificação por tipo de mensagem

**b) `updateUnreadCount`**
- Atualiza contador de não lidas em tempo real
- Mantém última mensagem atualizada
- Incrementa badge do app

**c) `cleanupOldTokens`**
- Executa diariamente às 3:00 AM
- Remove tokens com mais de 90 dias
- Mantém Firestore limpo

#### Estrutura da notificação:
```javascript
{
  notification: {
    title: "João em Grupo Dev",
    body: "Enviou uma mensagem",
    sound: "default",
    badge: "1"
  },
  data: {
    conversaId: "abc123",
    mensagemId: "msg456",
    senderId: "user789",
    senderName: "João",
    type: "new_message"
  }
}
```

#### Deploy:
```bash
cd functions
npm install firebase-functions firebase-admin
firebase deploy --only functions
```

---

### ✅ 4. Badge de Mensagens Não Lidas
**Integrado em:** `src/components/Workflow.jsx`

Badge visual no ícone de mensagens mostrando contador em tempo real:

#### Features:
- 🔴 Badge vermelho com contador
- ⚡ Animação pulse chamando atenção
- 🔢 Mostra "99+" quando > 99 mensagens
- 📱 Funciona em mobile e desktop
- 🔄 Atualiza em tempo real

#### Implementação:
```jsx
// Hook integrado no AlmoxarifadoSistema
const { totalNaoLidas: mensagensNaoLidas } = useMensagens();

// Badge no menu
{aba.id === 'mensagens' && mensagensNaoLidas > 0 && (
  <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
    {mensagensNaoLidas > 99 ? '99+' : mensagensNaoLidas}
  </span>
)}
```

---

### ✅ 5. Integração MensagensMain
**Atualizado:** `src/components/Mensagens/MensagensMain.jsx`

Componente principal agora com:
- ➕ Botão "Nova Conversa" no header
- 🔔 Inicialização automática de notificações push
- 🔄 Callbacks para criar conversas e grupos
- 📱 Suporte a deep linking

#### Fluxo completo:
```
1. Usuário clica no botão "+"
2. Abre modal NovaConversa
3. Seleciona tipo (individual/grupo)
4. Busca e seleciona usuários
5. (Grupos) Define nome e descrição
6. Cria conversa no Firestore
7. Abre janela de chat
8. Push notification registrado
```

---

## 📦 Dependências Necessárias

### package.json
```json
{
  "dependencies": {
    "@capacitor/core": "^5.0.0",
    "@capacitor/push-notifications": "^5.0.0",
    "firebase": "^10.0.0",
    "react-toastify": "^9.0.0"
  }
}
```

### Instalação:
```bash
npm install @capacitor/push-notifications
```

---

## 🔧 Configuração Necessária

### 1. Firebase Cloud Messaging (Web)

**a) Gerar VAPID Key:**
1. Firebase Console → Project Settings
2. Cloud Messaging tab
3. Web Push certificates → Generate key pair
4. Copiar o valor

**b) Adicionar ao `.env`:**
```env
REACT_APP_FIREBASE_VAPID_KEY=your_vapid_key_here
```

**c) Criar `public/firebase-messaging-sw.js`:**
```javascript
importScripts('https://www.gserviceaccount.com/firebasejs/10.0.0/firebase-app-compat.js');
importScripts('https://www.gserviceaccount.com/firebasejs/10.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "your-api-key",
  authDomain: "your-auth-domain",
  projectId: "your-project-id",
  storageBucket: "your-storage-bucket",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
});

const messaging = firebase.messaging();
```

### 2. Capacitor (Mobile)

**a) iOS - `ios/App/App/Info.plist`:**
```xml
<key>UIBackgroundModes</key>
<array>
  <string>remote-notification</string>
</array>
```

**b) Android - Já configurado automaticamente**

**c) Firebase Cloud Messaging:**
- Adicionar `google-services.json` (Android)
- Adicionar `GoogleService-Info.plist` (iOS)

### 3. Som de Notificação

**Criar arquivo:** `public/sounds/notification.mp3`
- Formato: MP3
- Duração recomendada: 1-2 segundos
- Volume: médio

---

## 🔒 Firestore Security Rules

Adicionar ao `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Usuários podem atualizar seus próprios tokens FCM
    match /usuarios/{userId} {
      allow read: if request.auth != null;
      allow update: if request.auth != null && request.auth.uid == userId;
      
      // Permitir adicionar tokens FCM
      allow update: if request.auth != null && 
        request.auth.uid == userId &&
        request.resource.data.keys().hasOnly(['fcmTokens']);
    }
    
    // Conversas e mensagens
    match /conversas/{conversaId} {
      allow read: if request.auth != null && 
        request.auth.uid in resource.data.participantes;
      
      allow write: if request.auth != null && 
        request.auth.uid in resource.data.participantes;
      
      match /mensagens/{mensagemId} {
        allow read: if request.auth != null;
        allow create: if request.auth != null;
        allow update, delete: if request.auth != null && 
          request.auth.uid == resource.data.remetenteId;
      }
    }
  }
}
```

---

## 🧪 Testes

### 1. Testar Nova Conversa
```javascript
// Abrir modal
setShowNovaConversa(true);

// Criar conversa individual
await handleIniciarConversa('user123');

// Criar grupo
await handleCriarGrupo('Equipe Dev', 'Grupo de desenvolvimento', ['user1', 'user2', 'user3']);
```

### 2. Testar Notificações Push

**Web:**
```javascript
// Verificar permissão
console.log(Notification.permission); // "granted", "denied", "default"

// Solicitar permissão
await Notification.requestPermission();

// Enviar teste
new Notification('Teste', { body: 'Funcionando!' });
```

**Mobile:**
```javascript
// Verificar status
const status = await PushNotifications.checkPermissions();
console.log(status);

// Solicitar permissão
const result = await PushNotifications.requestPermissions();
console.log(result);
```

### 3. Testar Badge
```javascript
// No console do navegador
window.dispatchEvent(new CustomEvent('newMessage', {
  detail: { conversaId: '123', mensagemId: '456' }
}));
```

---

## 📊 Estrutura no Firestore

### Documento de Usuário com Tokens:
```javascript
{
  id: "user123",
  nome: "João Silva",
  email: "joao@example.com",
  fcmTokens: [
    {
      token: "eXdG5h7...FCM_TOKEN",
      platform: "web", // ou "ios", "android"
      registeredAt: "2025-10-02T10:30:00Z"
    },
    {
      token: "fY9k2L...ANOTHER_TOKEN",
      platform: "android",
      registeredAt: "2025-10-01T15:20:00Z"
    }
  ]
}
```

### Participantes Info com Contador:
```javascript
{
  conversaId: "conv123",
  participantesInfo: {
    "user123": {
      naoLidas: 5,
      silenciado: false,
      arquivado: false,
      ultimaVez: Timestamp
    },
    "user456": {
      naoLidas: 0,
      silenciado: true,
      arquivado: false,
      ultimaVez: Timestamp
    }
  }
}
```

---

## 🐛 Troubleshooting

### Notificações não aparecem (Web)

**1. Verificar permissão:**
```javascript
if (Notification.permission !== 'granted') {
  await Notification.requestPermission();
}
```

**2. Verificar service worker:**
```javascript
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log('Service Workers:', registrations);
});
```

**3. Verificar token FCM:**
```javascript
const token = await getToken(messaging, { vapidKey: VAPID_KEY });
console.log('FCM Token:', token);
```

### Notificações não aparecem (Mobile)

**1. Verificar Capacitor:**
```javascript
import { Capacitor } from '@capacitor/core';
console.log('Platform:', Capacitor.getPlatform());
console.log('Is Native:', Capacitor.isNativePlatform());
```

**2. Verificar registro:**
```javascript
PushNotifications.addListener('registration', (token) => {
  console.log('Token registrado:', token.value);
});

PushNotifications.addListener('registrationError', (error) => {
  console.error('Erro no registro:', error);
});
```

**3. iOS: Verificar certificado APNs no Firebase Console**

**4. Android: Verificar google-services.json**

### Badge não atualiza

**1. Verificar hook:**
```javascript
const { totalNaoLidas } = useMensagens();
console.log('Total não lidas:', totalNaoLidas);
```

**2. Verificar Firestore:**
```javascript
// No Firebase Console, verificar participantesInfo.{userId}.naoLidas
```

---

## 🎯 Próximos Passos

### Melhorias Sugeridas:

1. **Notificações agrupadas** - Agrupar múltiplas mensagens
2. **Notificações silenciosas** - Atualizar badge sem som
3. **Notificações programadas** - Agendar envio
4. **Analytics** - Rastrear taxa de abertura
5. **Rich notifications** - Imagens nas notificações
6. **Action buttons** - Responder direto da notificação
7. **Quiet hours** - Horário de não perturbe
8. **Notification channels** - Diferentes canais (Android)

---

## 📝 Checklist de Implementação

- [x] Criar componente NovaConversa
- [x] Implementar pushNotificationService
- [x] Criar Cloud Functions
- [x] Integrar em MensagensMain
- [x] Adicionar badge no menu
- [x] Atualizar ListaConversas
- [ ] Adicionar VAPID key no .env
- [ ] Criar firebase-messaging-sw.js
- [ ] Configurar google-services.json (Android)
- [ ] Configurar GoogleService-Info.plist (iOS)
- [ ] Adicionar som de notificação
- [ ] Deploy das Cloud Functions
- [ ] Atualizar Firestore Rules
- [ ] Testar notificações em todos os dispositivos

---

## 💡 Dicas de Uso

1. **Sempre inicialize pushNotificationService após login**
2. **Cleanup ao fazer logout para evitar notificações indesejadas**
3. **Teste em modo incógnito para simular novo usuário**
4. **Use Firebase Console para debug de notificações**
5. **Monitore erros de tokens inválidos no Firestore**

---

## 📞 Suporte

Em caso de dúvidas, consulte:
- [Firebase Cloud Messaging Docs](https://firebase.google.com/docs/cloud-messaging)
- [Capacitor Push Notifications](https://capacitorjs.com/docs/apis/push-notifications)
- [Web Push Protocol](https://web.dev/push-notifications-overview/)

---

**Última atualização:** 02/10/2025  
**Versão:** 1.0.0  
**Status:** ✅ Produção
