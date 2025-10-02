# ⚡ Configuração Rápida - Notificações Push

## 🚀 Setup em 5 Minutos

### Passo 1: Instalar Dependências
```bash
npm install @capacitor/push-notifications
```

### Passo 2: Configurar Firebase Web Push

1. **Obter VAPID Key:**
   - Acesse: https://console.firebase.google.com
   - Seu Projeto → ⚙️ Project Settings → Cloud Messaging
   - Web Push certificates → "Generate key pair"
   - Copie a chave gerada

2. **Adicionar ao `.env`:**
```env
REACT_APP_FIREBASE_VAPID_KEY=YOUR_VAPID_KEY_HERE
```

3. **Criar Service Worker (`public/firebase-messaging-sw.js`):**
```javascript
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('Background Message:', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo.png',
    badge: '/logo.png',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
```

### Passo 3: Adicionar Som de Notificação

**Download sugerido:** https://notificationsounds.com/ (escolha um som curto)

**Ou criar manualmente:**
1. Grave um som curto (1-2 segundos)
2. Converta para MP3
3. Salve em: `public/sounds/notification.mp3`

### Passo 4: Deploy Cloud Functions

```bash
# Navegar para pasta functions
cd functions

# Instalar dependências
npm install firebase-functions firebase-admin

# Deploy
firebase deploy --only functions

# Ou deploy específico
firebase deploy --only functions:sendMessageNotification
firebase deploy --only functions:updateUnreadCount
firebase deploy --only functions:cleanupOldTokens
```

### Passo 5: Atualizar Firestore Rules

Copie e cole no Firebase Console → Firestore → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /usuarios/{userId} {
      allow read: if request.auth != null;
      allow update: if request.auth != null && 
        (request.auth.uid == userId || 
         request.resource.data.keys().hasOnly(['fcmTokens']));
    }
  }
}
```

Clique em **"Publicar"**

---

## 📱 Configuração Mobile

### Android

1. **Adicionar `google-services.json`:**
   - Firebase Console → Project Settings → Your apps
   - Clique no ícone Android
   - Download `google-services.json`
   - Cole em: `android/app/google-services.json`

2. **Verificar `android/app/build.gradle`:**
```gradle
apply plugin: 'com.android.application'
apply plugin: 'com.google.gms.google-services' // ← Verificar se existe
```

3. **Verificar `android/build.gradle`:**
```gradle
dependencies {
    classpath 'com.google.gms:google-services:4.3.15' // ← Verificar se existe
}
```

### iOS

1. **Adicionar `GoogleService-Info.plist`:**
   - Firebase Console → Project Settings → Your apps
   - Clique no ícone iOS
   - Download `GoogleService-Info.plist`
   - Cole em: `ios/App/App/GoogleService-Info.plist`

2. **Atualizar `ios/App/App/Info.plist`:**
```xml
<key>UIBackgroundModes</key>
<array>
    <string>remote-notification</string>
</array>
```

3. **Configurar APNs no Firebase:**
   - Firebase Console → Project Settings → Cloud Messaging
   - Aba "Apple app configuration"
   - Upload do certificado APNs Key (.p8)
   - [Tutorial completo](https://firebase.google.com/docs/cloud-messaging/ios/certs)

---

## ✅ Checklist de Verificação

### Web
- [ ] VAPID key adicionada no `.env`
- [ ] `firebase-messaging-sw.js` criado em `public/`
- [ ] Som de notificação em `public/sounds/notification.mp3`
- [ ] Testado no Chrome/Firefox
- [ ] Permissão de notificações concedida

### Mobile
- [ ] Dependência `@capacitor/push-notifications` instalada
- [ ] `google-services.json` adicionado (Android)
- [ ] `GoogleService-Info.plist` adicionado (iOS)
- [ ] Testado em dispositivo real (não funciona em emulador)

### Backend
- [ ] Cloud Functions deployadas
- [ ] Firestore Rules atualizadas e publicadas
- [ ] Testado envio de mensagem
- [ ] Notificação recebida

---

## 🧪 Teste Rápido

### 1. Testar Permissão (Web)
Abra o console do navegador:
```javascript
await Notification.requestPermission();
// Resultado: "granted", "denied" ou "default"

new Notification('Teste', { body: 'Funcionando!' });
```

### 2. Testar Token FCM
```javascript
// No componente após login
import pushNotificationService from './services/pushNotificationService';

pushNotificationService.initialize(usuario.id)
  .then(() => console.log('✅ Push inicializado'))
  .catch(err => console.error('❌ Erro:', err));
```

### 3. Testar Cloud Function
```javascript
// Enviar mensagem de teste via Firestore
// A notificação deve aparecer automaticamente
```

### 4. Verificar Badge
- Envie uma mensagem para si mesmo de outro dispositivo
- Verifique se o badge aparece no ícone de mensagens
- Número deve aumentar em tempo real

---

## 🚨 Problemas Comuns

### "Permission denied" (Web)
**Solução:** Usuário negou permissões. Orientar a habilitar em:
- Chrome: 🔒 (cadeado) → Site settings → Notifications → Allow
- Firefox: 🔒 → Permissions → Notifications → Allow

### "Messaging not supported" (Web)
**Solução:** 
- Service Worker não registrado
- Verificar se `firebase-messaging-sw.js` existe
- Verificar console de erros

### Token não salvo no Firestore
**Solução:**
- Verificar Firestore Rules
- Verificar se usuário está autenticado
- Console: verificar erros de permissão

### Notificação não aparece (Mobile)
**Solução:**
- Verificar se testou em dispositivo real (não funciona em emulador)
- Verificar se o app está em background
- Android: verificar canais de notificação
- iOS: verificar certificado APNs

### Cloud Function não dispara
**Solução:**
```bash
# Ver logs das functions
firebase functions:log

# Verificar status
firebase functions:list
```

---

## 📊 Monitoramento

### Firebase Console

**Cloud Messaging:**
- https://console.firebase.google.com → Cloud Messaging
- Veja estatísticas de envio

**Functions:**
- https://console.firebase.google.com → Functions
- Monitore execuções e erros

**Firestore:**
- Verifique tokens salvos em `usuarios/{userId}/fcmTokens`

### Logs úteis:
```javascript
// Ver todos os listeners registrados
PushNotifications.addListener('registration', token => 
  console.log('📱 Token:', token)
);

PushNotifications.addListener('pushNotificationReceived', notification => 
  console.log('🔔 Recebida:', notification)
);

PushNotifications.addListener('pushNotificationActionPerformed', action => 
  console.log('👆 Tocada:', action)
);
```

---

## 📞 Links Úteis

- [Firebase Setup Guide](https://firebase.google.com/docs/cloud-messaging/js/client)
- [Capacitor Push Docs](https://capacitorjs.com/docs/apis/push-notifications)
- [Web Push Protocol](https://developers.google.com/web/fundamentals/push-notifications)
- [FCM HTTP v1 API](https://firebase.google.com/docs/reference/fcm/rest/v1/projects.messages)

---

## 🎉 Pronto!

Após seguir todos os passos, seu sistema de mensagens estará completo com:
- ✅ Criação de conversas e grupos
- ✅ Notificações push (web e mobile)
- ✅ Badge com contador em tempo real
- ✅ Som de notificação
- ✅ Deep linking para conversas

**Tempo estimado de configuração:** 10-15 minutos

---

**Última atualização:** 02/10/2025  
**Autor:** GitHub Copilot 🤖
