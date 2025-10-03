# 🔔 Sistema de Notificações Push - Estilo Twitter

## 📋 Resumo da Implementação

Implementação completa de um sistema avançado de notificações push para mensagens, similar ao Twitter, com suporte para navegador e mobile em segundo plano.

**Data de implementação**: 3 de outubro de 2025

---

## ✅ O Que Foi Implementado

### 1. Service Worker Avançado (`service-worker.js`)

**Funcionalidades**:
- ✅ Gerenciamento de notificações push em segundo plano
- ✅ Recepção de mensagens FCM quando app está fechado
- ✅ Sistema de badges no ícone do app
- ✅ Fila de notificações (máximo 50)
- ✅ Ações personalizadas nas notificações (Abrir, Responder)
- ✅ Vibração personalizada: [200ms, 100ms, 200ms]
- ✅ Sincronização em background
- ✅ Comunicação bidirecional com app principal

**Eventos tratados**:
```javascript
- 'push' → Recebe e mostra notificação
- 'notificationclick' → Abre app na conversa
- 'message' → Comandos do app (limpar badges, atualizar config)
- 'sync' → Sincronização offline
```

---

### 2. Gerenciador de Notificações (`notificationManager.js`)

**Classe principal**: `NotificationManager`

**Recursos**:
- ✅ Integração com Firebase Cloud Messaging (FCM)
- ✅ Solicitação e gerenciamento de permissões
- ✅ Registro e atualização de tokens FCM
- ✅ Sistema de sons (3 tipos: message, mention, call)
- ✅ Sistema de preferências com localStorage
- ✅ Supressão inteligente de notificações
- ✅ Badge API para contadores no ícone
- ✅ Gerenciamento multi-dispositivo
- ✅ Fila de notificações offline
- ✅ Retry automático

**Preferências disponíveis**:
```javascript
{
  enabled: true,           // Notificações ativas
  sound: true,             // Sons
  vibration: true,         // Vibração (mobile)
  desktop: true,           // Notificações desktop
  showPreview: true,       // Mostrar prévia da mensagem
  playOnFocus: false       // Tocar som quando app está focado
}
```

**Métodos principais**:
- `initialize(userId)` - Inicializa sistema completo
- `requestPermission()` - Solicita permissão do navegador
- `showNotification(options)` - Mostra notificação
- `updateBadge(increment)` - Atualiza contador no ícone
- `playSound(type)` - Toca som de notificação
- `savePreferences(prefs)` - Salva preferências
- `cleanup()` - Limpa recursos ao desmontar

---

### 3. Interface de Configurações (`NotificationSettings.jsx`)

**Componente React**: Modal de configurações

**Funcionalidades**:
- ✅ Status da permissão de notificações
- ✅ Botão para solicitar permissão
- ✅ Botão de teste de notificação
- ✅ Toggle switches para cada preferência
- ✅ Feedback visual (ícones coloridos)
- ✅ Suporte a tema escuro
- ✅ Toast de confirmação
- ✅ Design responsivo

**Toggles disponíveis**:
1. 🖥️ **Notificações Desktop** - Ativar/desativar notificações no navegador
2. 🔊 **Sons** - Tocar som ao receber notificação
3. 📳 **Vibração** - Vibrar dispositivo (mobile)
4. 👁️ **Prévia de Mensagens** - Mostrar conteúdo da mensagem

---

### 4. Integração no Sistema de Mensagens

#### Modificações em `MensagensMain.jsx`:
```javascript
// Import do novo sistema
import notificationManager from '../../services/notificationManager';
import NotificationSettings from './NotificationSettings';

// Estado para modal de configurações
const [showNotificationSettings, setShowNotificationSettings] = useState(false);

// Inicialização no useEffect
useEffect(() => {
  if (usuario?.id) {
    notificationManager.initialize(usuario.id)
      .then(result => console.log('✅ Notificações inicializadas:', result))
      .catch(err => console.error('❌ Erro:', err));
  }
  
  return () => notificationManager.cleanup();
}, [usuario?.id]);

// Modal de configurações
{showNotificationSettings && (
  <NotificationSettings
    onClose={() => setShowNotificationSettings(false)}
  />
)}
```

#### Modificações em `ListaConversas.jsx`:
```javascript
// Novo botão no header
<button 
  onClick={onOpenNotificationSettings}
  className="p-2.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full transition-all transform hover:scale-110"
  title="Configurações de notificações"
>
  <Bell className="w-5 h-5" />
</button>
```

---

## 🎯 Como Funciona

### Fluxo de Notificação:

```
1. Nova mensagem no Firestore
   ↓
2. Cloud Function envia payload FCM
   ↓
3. Service Worker recebe push event
   ↓
4. Verifica preferências do usuário
   ↓
5. Mostra notificação do navegador
   ↓
6. Atualiza badge no ícone do app
   ↓
7. Toca som (se habilitado)
   ↓
8. Vibra dispositivo (se mobile + habilitado)
   ↓
9. Usuário clica → Abre app na conversa
```

### Supressão Inteligente:

O sistema **NÃO** mostra notificações quando:
- ✅ Usuário está na página de mensagens (`/mensagens`)
- ✅ Janela do navegador está focada
- ✅ Notificações desktop desabilitadas nas preferências

Isso evita notificações redundantes quando o usuário já está vendo as mensagens.

---

## 📦 Arquivos Criados/Modificados

### ✨ Novos arquivos:
- `src/services/notificationManager.js` (600+ linhas)
- `src/components/Mensagens/NotificationSettings.jsx` (291 linhas)
- `public/sounds/README.md` (guia de sons)

### 🔧 Arquivos modificados:
- `service-worker.js` (reescrito - 200+ linhas)
- `src/components/Mensagens/MensagensMain.jsx`
- `src/components/Mensagens/ListaConversas.jsx`

### 📁 Diretórios criados:
- `public/sounds/` (para arquivos de som)

---

## ⚙️ Configuração Necessária

### 1. Firebase Cloud Messaging (OBRIGATÓRIO)

1. Acesse o **Firebase Console**
2. Vá em **Project Settings** → **Cloud Messaging**
3. Na aba **Web configuration**, clique em **Generate key pair**
4. Copie a **VAPID key**
5. Adicione ao arquivo `.env`:

```env
REACT_APP_FIREBASE_VAPID_KEY=sua_vapid_key_aqui
```

### 2. Arquivos de Som (OPCIONAL)

Adicione os seguintes arquivos em `public/sounds/`:
- `notification.mp3` - Som de mensagem normal
- `mention.mp3` - Som de menção (@usuario)
- `call.mp3` - Som de chamada (futuro)

**Onde encontrar**:
- [Zapsplat](https://www.zapsplat.com/) - Sons gratuitos
- [Freesound](https://freesound.org/) - Comunidade de sons
- [Notification Sounds](https://notificationsounds.com/) - Sons de notificação

**Recomendações**:
- Formato: MP3, 128kbps
- Tamanho: <50KB cada
- Duração: 1-2 segundos
- Volume: Médio (ajustado no código)

Se não adicionar sons, o sistema funciona normalmente mas sem áudio.

---

## 🧪 Como Testar

### Teste 1: Permissão de Notificações
1. Abra o app em `/mensagens`
2. Clique no ícone 🔔 (bell) no header
3. Clique em "Solicitar Permissão"
4. Aceite a permissão do navegador
5. ✅ Status deve mudar para "Concedida"

### Teste 2: Notificação de Teste
1. No modal de configurações
2. Clique em "Testar Notificação"
3. ✅ Deve aparecer notificação do navegador
4. ✅ Deve tocar som (se habilitado)
5. ✅ Badge deve atualizar

### Teste 3: Preferências
1. Desative "Sons" no modal
2. Teste novamente
3. ✅ Notificação aparece mas sem som
4. Reative "Sons"
5. ✅ Som volta a funcionar

### Teste 4: Notificação em Segundo Plano
1. Minimize o navegador ou vá para outra aba
2. Envie uma mensagem de outro usuário
3. ✅ Notificação deve aparecer mesmo com app fechado
4. Clique na notificação
5. ✅ App deve abrir na conversa correta

### Teste 5: Supressão Inteligente
1. Abra a conversa onde vai receber mensagem
2. Fique com a janela focada
3. Receba uma mensagem
4. ✅ Notificação **NÃO** deve aparecer (você já está vendo)

### Teste 6: Badge Counter
1. Feche o app
2. Receba 3 mensagens
3. ✅ Badge no ícone deve mostrar "3"
4. Abra o app
5. ✅ Badge deve limpar automaticamente

---

## 📱 Suporte Mobile (Capacitor)

O sistema já tem hooks preparados para mobile:

```javascript
// Em notificationManager.js
if (Capacitor.isNativePlatform()) {
  await PushNotifications.requestPermissions();
  await PushNotifications.register();
  
  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    // Tratamento de notificação mobile
  });
}
```

**Para testar no mobile**:
1. Build da app: `npm run build`
2. Sincronizar com Capacitor: `npx cap sync`
3. Abrir no Android Studio: `npx cap open android`
4. Ou no Xcode: `npx cap open ios`
5. Compilar e testar em dispositivo real

---

## 🎨 Personalização

### Mudar Sons:
Substitua os arquivos MP3 em `public/sounds/` mantendo os nomes.

### Ajustar Volume:
```javascript
// Em notificationManager.js, método loadSounds()
this.sounds.message.volume = 0.7; // 0.0 a 1.0
```

### Mudar Vibração:
```javascript
// Em service-worker.js, evento 'push'
vibrate: [300, 100, 300] // [vibrar, pausar, vibrar] em ms
```

### Adicionar Novas Preferências:
```javascript
// 1. Adicionar em notificationManager.js
this.preferences = {
  // ... existentes
  mute_groups: false, // Nova preferência
};

// 2. Adicionar toggle em NotificationSettings.jsx
<div className="flex items-center justify-between p-4 ...">
  <div>
    <h3>Silenciar Grupos</h3>
    <p>Não receber notificações de grupos</p>
  </div>
  <button onClick={() => updatePreference('mute_groups', !preferences.mute_groups)}>
    {/* Toggle switch */}
  </button>
</div>
```

---

## 🐛 Troubleshooting

### Notificações não aparecem:
1. ✅ Verifique permissão no navegador (deve estar "granted")
2. ✅ Verifique console do navegador (F12) por erros
3. ✅ Confirme que VAPID key está configurada
4. ✅ Teste com notificação de teste primeiro

### Sons não tocam:
1. ✅ Verifique se arquivos MP3 existem em `public/sounds/`
2. ✅ Confirme que preferência "Sons" está ativada
3. ✅ Teste áudio do navegador em outro site
4. ✅ Veja console por erros de carregamento

### Badge não atualiza:
1. ✅ Badge API só funciona em PWA instalado
2. ✅ Ou em navegadores Chromium (Chrome, Edge, Brave)
3. ✅ Firefox não suporta Badge API
4. ✅ Safari tem suporte limitado

### Service Worker não registra:
1. ✅ App deve estar em HTTPS (ou localhost)
2. ✅ Verifique `navigator.serviceWorker` está disponível
3. ✅ Limpe cache: DevTools → Application → Clear storage
4. ✅ Re-registre: DevTools → Application → Service Workers → Unregister

---

## 📊 Próximos Passos

### Fase 1: Testing (Urgente)
- [ ] Configurar VAPID key no Firebase
- [ ] Adicionar arquivos de som
- [ ] Testar notificações no navegador
- [ ] Testar em múltiplos dispositivos

### Fase 2: Backend (Importante)
- [ ] Criar Cloud Function para enviar push notifications
- [ ] Enviar notificação quando mensagem é recebida
- [ ] Incluir metadados (conversaId, senderId, preview)
- [ ] Rate limiting para evitar spam

### Fase 3: Mobile (Médio prazo)
- [ ] Testar Capacitor Push Notifications
- [ ] Build Android e testar em dispositivo
- [ ] Build iOS e testar em dispositivo
- [ ] Configurar APNs (Apple Push Notification service)

### Fase 4: Analytics (Baixa prioridade)
- [ ] Rastrear taxa de concessão de permissão
- [ ] Medir click-through rate de notificações
- [ ] Analytics de preferências mais usadas
- [ ] Monitorar erros de FCM

---

## 🔐 Segurança

### Boas Práticas Implementadas:
- ✅ VAPID key em variável de ambiente (.env)
- ✅ Tokens FCM armazenados por usuário no Firestore
- ✅ Verificação de permissões antes de mostrar notificações
- ✅ Limpeza de recursos ao desmontar componente
- ✅ Validação de dados antes de processar payload
- ✅ Try-catch em todas operações assíncronas

### Considerações:
- 🔒 Não envie dados sensíveis em notificações
- 🔒 Use `showPreview: false` para ocultar conteúdo
- 🔒 Implemente rate limiting no backend
- 🔒 Revogue tokens de dispositivos inativos

---

## 📚 Recursos

### Documentação:
- [Web Push Notifications](https://web.dev/push-notifications-overview/)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Notification API](https://developer.mozilla.org/en-US/docs/Web/API/notification)
- [Badge API](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/setAppBadge)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

### Capacitor:
- [Capacitor Push Notifications](https://capacitorjs.com/docs/apis/push-notifications)
- [Capacitor Local Notifications](https://capacitorjs.com/docs/apis/local-notifications)

---

## 🎉 Conclusão

Você agora tem um **sistema completo de notificações push** estilo Twitter, com:

✅ Notificações em segundo plano
✅ Badges no ícone do app
✅ Sistema de sons customizável
✅ Painel de configurações para o usuário
✅ Supressão inteligente
✅ Suporte mobile preparado
✅ Multi-dispositivo
✅ Offline-ready

**Próximo passo**: Configure a VAPID key e teste! 🚀

---

**Desenvolvido em**: 3 de outubro de 2025
**Linhas de código**: ~1200 linhas
**Arquivos criados**: 3
**Arquivos modificados**: 3
