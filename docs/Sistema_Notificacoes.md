# Sistema de Notificações de Mensagens - Documentação

## 📱 Funcionalidades Implementadas

### 1. Badge de Notificações no Botão do Chat
- **Badge vermelho** com contador aparece no botão flutuante do chat (mobile)
- Mostra o **número total de mensagens não lidas**
- Aparece como **"99+"** se houver mais de 99 mensagens
- **Animação pulse** para chamar atenção

### 2. Badges na Lista de Conversas
- Cada usuário com mensagens não lidas mostra um **badge vermelho** ao lado do nome
- Badge mostra a **quantidade exata de mensagens não lidas** daquele usuário
- Badge desaparece automaticamente quando você abre a conversa

### 3. Notificações Push (Mobile)
- **Android/iOS**: Notificações locais usando Capacitor
- Mostra:
  - Título: "Nova mensagem de [Nome do Usuário]"
  - Conteúdo: Prévia da mensagem (primeiros 100 caracteres)
- **Som personalizado** incluído na notificação
- **Ícone vermelho** para destacar

### 4. Notificações Desktop
- **Web Notifications API** para desktop
- Solicita permissão automaticamente na primeira vez
- Mostra mesmo conteúdo das notificações mobile
- Não requer interação para funcionar

### 5. Alertas Sonoros
- **Som suave** estilo Kali Linux (dois tons: 800Hz → 1000Hz)
- Duração: 300ms
- Volume: 50%
- Toca automaticamente ao receber nova mensagem
- Funciona tanto no desktop quanto no mobile

## 🔧 Arquitetura Técnica

### Contexto: MessageNotificationContext
Gerencia todo o estado de notificações:
- `unreadCounts`: Objeto com contadores por usuário `{ userId: count }`
- `totalUnread`: Soma total de mensagens não lidas
- `lastMessages`: Últimas mensagens de cada conversa
- `markMessagesAsRead(userId)`: Marca mensagens como lidas
- `playNotificationSound()`: Toca o som de notificação

### Componentes Criados

1. **MessageNotificationContext.jsx**
   - Provider principal do sistema
   - Monitora mensagens em tempo real
   - Dispara notificações e sons

2. **ChatNotificationBadge.jsx**
   - Badge visual para o botão do chat
   - Mostra contador total

3. **notification-generator.html**
   - Ferramenta HTML para gerar sons personalizados
   - Permite testar e baixar diferentes configurações

## 📂 Estrutura de Dados no Firestore

### Coleção: `conversas`
```javascript
{
  participantes: [userId1, userId2],
  tipo: 'privada' | 'grupo',
  ultimaMensagem: string,
  ultimaMensagemTimestamp: timestamp
}
```

### Subcoleção: `conversas/{conversaId}/mensagens`
```javascript
{
  conteudo: string,
  remetenteId: string,
  timestamp: timestamp,
  lida: boolean,  // ← Campo para rastreamento
  lidaEm: timestamp  // ← Quando foi lida
}
```

## 🚀 Como Usar

### Para Usuários

1. **Ver mensagens não lidas:**
   - Badge vermelho aparece automaticamente no botão do chat
   - Número indica quantas mensagens você tem

2. **Abrir conversa:**
   - Clique no usuário na lista
   - Badge desaparece automaticamente ao abrir

3. **Notificações mobile:**
   - Aceite as permissões quando solicitadas
   - Notificações chegam mesmo com app minimizado

4. **Notificações desktop:**
   - Aceite as permissões do navegador
   - Som toca automaticamente (pode ser desabilitado nas configurações do navegador)

### Para Desenvolvedores

#### 1. Adicionar o Provider no App
```jsx
import { MessageNotificationProvider } from './components/Chat/MessageNotificationContext';

<MessageNotificationProvider>
  {/* Seus componentes aqui */}
</MessageNotificationProvider>
```

#### 2. Usar o Hook em Componentes
```jsx
import { useMessageNotifications } from './components/Chat/MessageNotificationContext';

function MeuComponente() {
  const { unreadCounts, totalUnread, markMessagesAsRead } = useMessageNotifications();
  
  // unreadCounts[userId] = número de mensagens não lidas daquele usuário
  // totalUnread = total geral
  // markMessagesAsRead(userId) = marcar como lidas
}
```

#### 3. Personalizar Sons
1. Abra `public/sounds/notification-generator.html` no navegador
2. Clique em "Testar Som" para ouvir
3. Ajuste frequências e duração no código se necessário
4. Clique em "Gerar e Baixar"
5. Substitua `public/sounds/notification.wav`

## 🎨 Customização

### Alterar Cor do Badge
No arquivo `ChatNotificationBadge.jsx`:
```jsx
className="... bg-red-500 ..." // Mude para bg-blue-500, bg-green-500, etc.
```

### Alterar Volume do Som
No arquivo `MessageNotificationContext.jsx`:
```javascript
audioRef.current.volume = 0.5; // 0.0 a 1.0
```

### Alterar Limite do Badge (99+)
No arquivo `ChatNotificationBadge.jsx`:
```jsx
{totalUnread > 99 ? '99+' : totalUnread}
// Mude 99 para outro valor
```

## 🔒 Permissões Necessárias

### Android (capacitor.config.ts)
```typescript
{
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#EF4444"
    }
  }
}
```

### iOS (Info.plist)
```xml
<key>NSUserNotificationAlertStyle</key>
<string>alert</string>
```

## 🐛 Troubleshooting

### Som não toca
- Verifique se o arquivo existe em `public/sounds/notification.wav`
- Verifique o volume do sistema
- Alguns navegadores bloqueiam autoplay - usuário precisa interagir com a página primeiro

### Notificações não aparecem (Desktop)
- Verifique as configurações do navegador
- Em Chrome: chrome://settings/content/notifications
- Certifique-se de que o site tem permissão

### Notificações não aparecem (Mobile)
- Verifique as permissões do app nas configurações do dispositivo
- Android: Configurações > Apps > WorkFlow > Notificações
- iOS: Configurações > WorkFlow > Notificações

### Badge não atualiza
- Verifique se o MessageNotificationProvider está no nível correto da árvore de componentes
- Deve estar acima de todos os componentes que usam o hook
- Verifique o console para erros do Firestore

## 📊 Monitoramento

O sistema loga automaticamente no console:
- Número de empréstimos carregados
- Mensagens recebidas
- Erros de permissão
- Status de notificações

Para debug adicional, descomente as linhas de `console.log` no `MessageNotificationContext.jsx`.

## 🎯 Próximos Passos (Sugestões)

1. **Badge no ícone da aba do navegador**
   - Usar Favicon Badge para mostrar contador

2. **Configurações de notificação**
   - Permitir usuário ativar/desativar sons
   - Escolher diferentes tons de notificação

3. **Notificações agrupadas**
   - "3 novas mensagens de João, Maria e..."

4. **Vibração mobile**
   - Adicionar feedback háptico

5. **Histórico de notificações**
   - Central de notificações no app
