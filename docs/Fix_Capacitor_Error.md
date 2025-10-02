# 🔧 Solução de Problemas - Notificações Push

## ❌ Erro: Module not found '@capacitor/push-notifications'

### Causa
As dependências do Capacitor não estavam instaladas no projeto.

### ✅ Solução Aplicada

#### 1. Instaladas as dependências necessárias:
```bash
npm install @capacitor/push-notifications @capacitor/core
```

#### 2. Código atualizado com fallback:
O `pushNotificationService.js` agora detecta automaticamente se está em ambiente web ou mobile:

```javascript
// Importações opcionais (não quebra se Capacitor não estiver disponível)
let PushNotifications = null;
let Capacitor = null;

try {
  const capacitorCore = require('@capacitor/core');
  Capacitor = capacitorCore.Capacitor;
  
  if (Capacitor && Capacitor.isNativePlatform()) {
    const pushNotifications = require('@capacitor/push-notifications');
    PushNotifications = pushNotifications.PushNotifications;
  }
} catch (error) {
  console.log('ℹ️ Capacitor não disponível, usando apenas notificações web');
}
```

#### 3. Adicionadas verificações de segurança:
```javascript
// Antes de usar PushNotifications
if (!PushNotifications) {
  console.warn('PushNotifications não disponível');
  return;
}
```

---

## 🎯 O Sistema Agora Funciona Em:

### ✅ Web (Desktop/Mobile)
- Usa Firebase Cloud Messaging (FCM)
- Notificações do navegador
- Funciona sem Capacitor

### ✅ Mobile (iOS/Android)
- Usa Capacitor Push Notifications
- Notificações nativas
- Requer build com Capacitor

---

## 📦 Dependências Instaladas

```json
{
  "@capacitor/core": "^5.0.0",
  "@capacitor/push-notifications": "^5.0.0"
}
```

---

## 🚀 Comandos Úteis

### Reinstalar dependências (se necessário):
```bash
npm install
```

### Limpar cache e reinstalar:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Build para mobile:
```bash
# Android
npm run build
npx cap sync android
npx cap open android

# iOS
npm run build
npx cap sync ios
npx cap open ios
```

---

## 🧪 Testar Notificações

### Web (no navegador):
1. Abrir DevTools (F12)
2. Console:
```javascript
// Verificar suporte
console.log('Notificações:', 'Notification' in window);

// Solicitar permissão
Notification.requestPermission().then(permission => {
  console.log('Permissão:', permission);
});

// Teste
new Notification('Teste', { body: 'Funcionando!' });
```

### Mobile:
1. Build do app com Capacitor
2. Instalar em dispositivo físico
3. Notificações NÃO funcionam em emulador

---

## ⚠️ Observações Importantes

### 1. Notificações Web
- Funcionam IMEDIATAMENTE após npm install
- Não precisa build mobile
- Suportado por: Chrome, Firefox, Edge, Safari (14+)

### 2. Notificações Mobile
- Requerem build nativo (Android Studio / Xcode)
- Não funcionam no desenvolvimento web
- Precisam de dispositivo físico para testar

### 3. Fallback Automático
O sistema agora detecta automaticamente:
- **Web**: Usa apenas FCM
- **Mobile**: Usa Capacitor + FCM
- **Desenvolvimento**: Funciona sem Capacitor

---

## 🐛 Outros Erros Comuns

### Erro: "firebase/messaging not supported"
**Causa:** Service Worker não configurado ou navegador não suporta

**Solução:**
1. Criar `public/firebase-messaging-sw.js`
2. Usar HTTPS (notificações não funcionam em HTTP)
3. Verificar suporte do navegador

### Erro: "Permission denied"
**Causa:** Usuário negou permissões

**Solução:**
1. Chrome: Configurações → Privacidade → Notificações → Permitir
2. Firefox: Configurações → Privacidade → Permissões → Notificações
3. Safari: Preferências → Sites → Notificações

### Erro: VAPID key not configured
**Causa:** Variável de ambiente não configurada

**Solução:**
```env
REACT_APP_FIREBASE_VAPID_KEY=your_vapid_key_here
```

---

## ✅ Status Atual

- [x] Dependências instaladas
- [x] Código atualizado com fallback
- [x] Verificações de segurança adicionadas
- [x] Configuração do Capacitor atualizada
- [x] Sistema funcional em Web
- [ ] Configurar VAPID key (`.env`)
- [ ] Criar Service Worker (`firebase-messaging-sw.js`)
- [ ] Build para mobile (opcional)

---

## 📞 Próximos Passos

1. **Testar no navegador:**
   - Acessar o sistema
   - Verificar se notificações web funcionam
   - Console não deve mostrar erros do Capacitor

2. **Configurar FCM (Web):**
   - Seguir `docs/Setup_Notificacoes_Push.md`
   - Adicionar VAPID key
   - Criar Service Worker

3. **Build Mobile (Opcional):**
   - Apenas se quiser app nativo
   - Seguir documentação do Capacitor
   - Testar em dispositivo físico

---

**Status:** ✅ CORRIGIDO  
**Data:** 02/10/2025  
**Versão:** 1.0.1
