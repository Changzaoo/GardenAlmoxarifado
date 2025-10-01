# Sistema de Notificações Completo - Implementação

## 📋 Visão Geral

Sistema completo de notificações implementado para o WorkFlow, incluindo:
- ✅ Notificações de mensagens no chat
- ✅ Notificações gerais (tarefas e empréstimos)
- ✅ Página dedicada de notificações
- ✅ Notificações push no mobile (Capacitor)
- ✅ Notificações sonoras (som do Kali Linux)
- ✅ Badges com contador de não lidas
- ✅ Integração automática nos fluxos de negócio

---

## 🏗️ Arquitetura

### Contextos de Notificação

#### 1. **MessageNotificationContext** (Chat)
- **Arquivo**: `src/components/MessageNotificationContext.jsx`
- **Propósito**: Gerenciar notificações de mensagens do chat
- **Funcionalidades**:
  - Monitor em tempo real da coleção `chats/{id}/messages`
  - Contador de mensagens não lidas por chat
  - Notificação sonora quando novas mensagens chegam
  - Suporte para chats individuais e em grupo

#### 2. **NotificationProvider** (Geral)
- **Arquivo**: `src/components/NotificationProvider.jsx`
- **Propósito**: Gerenciar notificações gerais do sistema
- **Funcionalidades**:
  - Monitor em tempo real da coleção `notificacoes`
  - Notificações push no mobile via Capacitor
  - Notificações de desktop via Web Notifications API
  - Notificação sonora quando novas notificações chegam
  - Controle de som (habilitar/desabilitar)
  - Prevenção de duplicatas via `processedNotifications` Set
  - Janela de 5 segundos para novas notificações (evita histórico)

---

## 📁 Estrutura de Arquivos

### Componentes Criados/Modificados

```
src/
├── components/
│   ├── MessageNotificationContext.jsx    ✅ Corrigido (Firestore paths)
│   ├── NotificationProvider.jsx          ✅ Reescrito completamente
│   ├── NotificationsPage.jsx             ✅ Criado (página de notificações)
│   └── Workflow.jsx                       ✅ Integrado com notificações
│
├── services/
│   └── workflowService.js                 ✅ Adicionado suporte a notificações
│
├── utils/
│   └── notificationHelpers.js             ✅ Criado (funções auxiliares)
│
└── components/Tarefas/
    └── CriarTarefa.jsx                    ✅ Integrado com notificações
```

### Arquivos de Som

```
public/sounds/notification.wav              ✅ Som dual-tone (800Hz→1000Hz, 300ms)
```

---

## 🔔 Tipos de Notificação

### 1. **Notificações de Chat** (MessageNotificationContext)
```javascript
// Estrutura em Firestore: chats/{chatId}/messages
{
  senderId: string,
  text: string,
  timestamp: Date,
  read: boolean,
  type: 'individual' | 'group'
}
```

### 2. **Notificações Gerais** (NotificationProvider)
```javascript
// Estrutura em Firestore: notificacoes
{
  usuarioId: string,        // ID do usuário que receberá a notificação
  tipo: string,             // 'tarefa' | 'emprestimo' | 'ferramenta'
  titulo: string,           // Título da notificação
  mensagem: string,         // Mensagem detalhada
  lida: boolean,            // Status de leitura
  timestamp: Timestamp,     // Data/hora de criação
  dados: object             // Dados adicionais (opcional)
}
```

---

## 🛠️ Funções Auxiliares

### `notificationHelpers.js`

#### `createNotification(usuarioId, tipo, titulo, mensagem, dados)`
Função base para criar qualquer notificação.

#### `notifyNewTask(usuarioId, nomeTarefa, prioridade, tarefaData)`
Cria notificação quando uma nova tarefa é atribuída ao usuário.

```javascript
await notifyNewTask(
  'usuario123',
  'Realizar inventário',
  'alta',
  { id: 'tarefa456', descricao: '...' }
);
```

#### `notifyNewLoan(usuarioId, ferramentas, responsavel, emprestimoData)`
Cria notificação quando ferramentas são emprestadas ao usuário.

```javascript
await notifyNewLoan(
  'usuario123',
  ['Martelo', 'Chave de fenda'],
  'João Silva',
  { id: 'emp789', dataPrevistaDevolucao: '2024-12-31' }
);
```

#### `notifyToolAction(usuarioId, nomeFerramenta, acao, ferramentaData)`
Cria notificação para ações específicas em ferramentas.

```javascript
await notifyToolAction(
  'usuario123',
  'Furadeira',
  'atribuida',
  { id: 'tool999' }
);
```

#### `notifyTaskDeadline(usuarioId, nomeTarefa, prazo)`
Cria notificação quando o prazo de uma tarefa está próximo.

```javascript
await notifyTaskDeadline(
  'usuario123',
  'Finalizar relatório',
  '2024-12-31'
);
```

---

## 🎨 Interface do Usuário

### NotificationsPage
Página dedicada para visualizar todas as notificações.

**Recursos:**
- Filtros: Todas | Não lidas | Tarefa | Empréstimo
- Ícones específicos por tipo de notificação:
  - 📋 ClipboardList (Tarefa)
  - 📦 Package (Empréstimo)
  - 🛠️ Wrench (Ferramenta)
- Formatação de tempo relativo (ex: "há 5 minutos")
- Marcar como lida (individual ou todas)
- Badge com contador de não lidas
- Botão toggle para habilitar/desabilitar som
- Design responsivo com dark mode
- Estados vazios customizados

### Badges de Notificação

#### Menu Mobile
```jsx
// Workflow.jsx - Linha ~2016-2023
<div className="relative">
  <Icone className="w-6 h-6" />
  {aba.id === 'notificacoes' && notificationUnreadCount > 0 && (
    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
      {notificationUnreadCount > 9 ? '9+' : notificationUnreadCount}
    </span>
  )}
</div>
```

#### Menu Desktop
```jsx
// Workflow.jsx - Linha ~2163-2168
<div className="relative">
  <Icone className="w-5 h-5" />
  {aba.id === 'notificacoes' && notificationUnreadCount > 0 && (
    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
      {notificationUnreadCount > 9 ? '9+' : notificationUnreadCount}
    </span>
  )}
</div>
```

---

## 🔗 Integração nos Fluxos de Negócio

### 1. Criação de Tarefas
**Arquivo**: `src/components/Tarefas/CriarTarefa.jsx`

```javascript
// Após criar a tarefa no Firestore
const docRef = await addDoc(collection(db, 'tarefas'), tarefaData);

// Notificar cada funcionário atribuído
for (const funcionarioId of formData.funcionariosIds) {
  await notifyNewTask(
    funcionarioId,
    formData.titulo,
    formData.prioridade,
    { id: docRef.id, ...tarefaData }
  );
}
```

### 2. Criação de Empréstimos (Workflow.jsx)
**Arquivo**: `src/components/Workflow.jsx` - Função `adicionarEmprestimo`

```javascript
// Após criar o empréstimo
const novoEmprestimo = {
  ferramentas: ferramentasSelecionadas,
  responsavel: funcionarioSelecionado,
  // ...
};

const emprestimoRef = await addDoc(collection(db, 'emprestimos'), novoEmprestimo);

// Criar notificação
await notifyNewLoan(
  funcionarioSelecionado,
  ferramentasSelecionadas.map(f => f.nome),
  funcionarioSelecionado,
  { id: emprestimoRef.id, ...novoEmprestimo }
);
```

### 3. Criação de Empréstimos (workflowService.js)
**Arquivo**: `src/services/workflowService.js` - Função `createLoanWithAudit`

```javascript
// Após criar o empréstimo com audit trail
const docRef = await addDoc(collection(db, 'emprestimos'), emprestimoWithTracking);

// Criar notificação
await notifyNewLoan(
  emprestimo.responsavel,
  emprestimo.ferramentas.map(f => f.nome),
  emprestimo.responsavel,
  { id: docRef.id, ...emprestimoWithTracking }
);
```

---

## 📱 Notificações Mobile (Capacitor)

### Configuração
Utiliza o plugin `@capacitor/local-notifications` para notificações push no mobile.

### Implementação
```javascript
// NotificationProvider.jsx
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

const sendPushNotification = async (title, body) => {
  if (Capacitor.isNativePlatform()) {
    // Mobile - Capacitor Local Notifications
    const permission = await LocalNotifications.requestPermissions();
    if (permission.display === 'granted') {
      await LocalNotifications.schedule({
        notifications: [{
          title,
          body,
          id: Date.now(),
          schedule: { at: new Date(Date.now() + 100) },
          sound: 'notification.wav',
          smallIcon: 'ic_stat_icon_config_sample'
        }]
      });
    }
  } else {
    // Desktop - Web Notifications API
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/logo.png' });
    } else if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        new Notification(title, { body, icon: '/logo.png' });
      }
    }
  }
};
```

---

## 🔊 Sistema de Som

### Arquivo de Som
- **Localização**: `/public/sounds/notification.wav`
- **Características**:
  - Taxa de amostragem: 48000 Hz
  - Formato: Mono, 16-bit PCM
  - Duração: ~300ms
  - Tom: Dual-tone (800Hz → 1000Hz)
  - Inspirado no som de notificação do Kali Linux

### Implementação
```javascript
// NotificationProvider.jsx
const audioRef = useRef(null);
const [soundEnabled, setSoundEnabled] = useState(true);

const playNotificationSound = () => {
  if (soundEnabled && audioRef.current) {
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(err => {
      console.error('Erro ao tocar som de notificação:', err);
    });
  }
};

// No JSX
<audio ref={audioRef} src="/sounds/notification.wav" preload="auto" />
```

---

## 🎯 Hierarquia de Providers

### Workflow.jsx - Componente `Seed`
```jsx
<AuthProvider>
  <ToastProvider>
    <FuncionariosProvider>
      <NotificationProvider>
        <MessageNotificationProvider>
          <AnalyticsProvider>
            <AlmoxarifadoSistema />
          </AnalyticsProvider>
        </MessageNotificationProvider>
      </NotificationProvider>
    </FuncionariosProvider>
  </ToastProvider>
</AuthProvider>
```

**Importante**: A ordem dos providers é crucial:
1. `AuthProvider` - Autentica o usuário
2. `NotificationProvider` - Notificações gerais (usa usuário do AuthProvider)
3. `MessageNotificationProvider` - Notificações de chat (usa usuário do AuthProvider)

---

## 🔍 Monitoramento em Tempo Real

### NotificationProvider
```javascript
useEffect(() => {
  if (!usuario?.id) return;

  const notificacoesRef = collection(db, 'notificacoes');
  const q = query(
    notificacoesRef,
    where('usuarioId', '==', usuario.id),
    orderBy('timestamp', 'desc')
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    // Atualiza lista de notificações
    const novasNotificacoes = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setNotifications(novasNotificacoes);

    // Detecta novas notificações (criadas nos últimos 5 segundos)
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        const notificacao = change.doc.data();
        const timeDiff = Date.now() - notificacao.timestamp?.toDate?.()?.getTime();
        
        if (timeDiff < 5000 && !processedNotifications.current.has(change.doc.id)) {
          processedNotifications.current.add(change.doc.id);
          console.log('NotificationProvider: Nova notificação detectada!', notificacao);
          
          playNotificationSound();
          sendPushNotification(notificacao.titulo, notificacao.mensagem);
        }
      }
    });
  }, (error) => {
    console.error('Erro ao monitorar notificações:', error);
  });

  return () => unsubscribe();
}, [usuario, soundEnabled]);
```

### MessageNotificationContext
```javascript
useEffect(() => {
  if (!usuario?.id) return;

  const chatsRef = collection(db, 'chats');
  const q = query(chatsRef, where('participants', 'array-contains', usuario.id));

  const unsubscribe = onSnapshot(q, async (snapshot) => {
    const countsMap = {};

    for (const chatDoc of snapshot.docs) {
      const messagesRef = collection(db, 'chats', chatDoc.id, 'messages');
      const messagesQuery = query(
        messagesRef,
        where('senderId', '!=', usuario.id),
        where('read', '==', false)
      );

      const messagesSnapshot = await getDocs(messagesQuery);
      const unreadCount = messagesSnapshot.size;
      
      if (unreadCount > 0) {
        countsMap[chatDoc.id] = unreadCount;
      }

      // Detecta novas mensagens e toca som
      // ...
    }

    setUnreadCounts(countsMap);
  }, (error) => {
    console.error('Erro ao monitorar chats:', error);
  });

  return () => unsubscribe();
}, [usuario]);
```

---

## 🧪 Testes e Validação

### Checklist de Testes

#### ✅ Notificações de Chat
- [x] Novas mensagens incrementam contador
- [x] Som toca quando nova mensagem chega
- [x] Badge atualiza em tempo real
- [x] Funciona em chats individuais e em grupo

#### ✅ Notificações de Tarefas
- [x] Notificação criada ao atribuir tarefa
- [x] Notificação aparece na página de notificações
- [x] Som toca quando nova tarefa é atribuída
- [x] Push notification enviada no mobile
- [x] Badge mostra contador correto

#### ✅ Notificações de Empréstimos
- [x] Notificação criada ao emprestar ferramenta (Workflow.jsx)
- [x] Notificação criada ao emprestar ferramenta (workflowService.js)
- [x] Notificação aparece na página de notificações
- [x] Som toca quando novo empréstimo é criado
- [x] Push notification enviada no mobile
- [x] Badge mostra contador correto

#### ✅ Interface do Usuário
- [x] Página de notificações renderiza corretamente
- [x] Filtros funcionam (Todas, Não lidas, Tarefa, Empréstimo)
- [x] Marcar como lida funciona
- [x] Marcar todas como lidas funciona
- [x] Badge desktop mostra contador
- [x] Badge mobile mostra contador
- [x] Toggle de som funciona
- [x] Dark mode funciona
- [x] Layout responsivo

---

## 📊 Estrutura do Firestore

### Coleção: `notificacoes`
```
notificacoes/
├── {notificationId1}
│   ├── usuarioId: "user123"
│   ├── tipo: "tarefa"
│   ├── titulo: "📋 Nova tarefa atribuída"
│   ├── mensagem: "Você foi atribuído à tarefa: Realizar inventário"
│   ├── lida: false
│   ├── timestamp: Timestamp(2024-12-20 10:30:00)
│   └── dados: {
│       ├── tarefaId: "tarefa456"
│       ├── prioridade: "alta"
│       └── ...
│   }
├── {notificationId2}
│   ├── usuarioId: "user123"
│   ├── tipo: "emprestimo"
│   ├── titulo: "🔧 Ferramentas emprestadas"
│   ├── mensagem: "Martelo, Chave de fenda emprestadas para você"
│   ├── lida: false
│   ├── timestamp: Timestamp(2024-12-20 11:45:00)
│   └── dados: {
│       ├── emprestimoId: "emp789"
│       └── ...
│   }
└── ...
```

### Coleção: `chats/{chatId}/messages`
```
chats/
├── {chatId1}
│   └── messages/
│       ├── {messageId1}
│       │   ├── senderId: "user456"
│       │   ├── text: "Olá, tudo bem?"
│       │   ├── timestamp: Timestamp
│       │   ├── read: false
│       │   └── type: "individual"
│       └── ...
└── ...
```

---

## 🚀 Próximos Passos (Opcional)

### Melhorias Futuras
1. **Notificações por Email**
   - Integrar com serviço de email (SendGrid, Firebase Functions)
   - Enviar resumo diário de notificações não lidas

2. **Agrupamento de Notificações**
   - Agrupar múltiplas notificações do mesmo tipo
   - Ex: "5 novas tarefas atribuídas"

3. **Preferências de Notificação**
   - Página de configurações para escolher tipos de notificação
   - Horários de silêncio (não tocar som)

4. **Notificações de Prazo**
   - Alertas automáticos quando tarefas estão próximas do prazo
   - Alertas quando ferramentas emprestadas estão próximas da data de devolução

5. **Analytics**
   - Rastrear taxa de abertura de notificações
   - Tempo médio de resposta

---

## 🐛 Troubleshooting

### Som não toca
1. Verificar se `soundEnabled` está `true`
2. Verificar se arquivo `/sounds/notification.wav` existe
3. Verificar permissões de reprodução de áudio no navegador
4. Verificar console para erros de carregamento do áudio

### Notificações não aparecem
1. Verificar se usuário está autenticado (`usuario.id` existe)
2. Verificar estrutura do Firestore (coleção `notificacoes`)
3. Verificar se `NotificationProvider` está na hierarquia de componentes
4. Verificar console para erros do Firestore

### Push notifications não funcionam no mobile
1. Verificar se Capacitor está instalado (`npm install @capacitor/local-notifications`)
2. Verificar permissões no dispositivo
3. Verificar logs do Capacitor

### Badge não atualiza
1. Verificar se `useNotification` hook está sendo usado no componente
2. Verificar se `notificationUnreadCount` está sendo lido do hook
3. Verificar estrutura do Firestore (campo `lida` nas notificações)

---

## 📝 Notas de Implementação

### Prevenção de Duplicatas
O sistema usa um `Set` (`processedNotifications`) para evitar que a mesma notificação toque som múltiplas vezes:

```javascript
const processedNotifications = useRef(new Set());

// Ao detectar nova notificação
if (!processedNotifications.current.has(change.doc.id)) {
  processedNotifications.current.add(change.doc.id);
  playNotificationSound();
  sendPushNotification(...);
}
```

### Janela de Tempo (5 segundos)
Apenas notificações criadas nos últimos 5 segundos tocam som/enviam push. Isso evita que notificações antigas (do histórico) disparem alertas ao carregar a página:

```javascript
const timeDiff = Date.now() - notificacao.timestamp?.toDate?.()?.getTime();
if (timeDiff < 5000) {
  // Tocar som e enviar push
}
```

### Tratamento de Erros
Todas as funções de notificação têm try-catch para não bloquear o fluxo principal:

```javascript
try {
  await notifyNewTask(...);
} catch (notificationError) {
  console.error('Erro ao criar notificação:', notificationError);
  // Não bloqueia a criação da tarefa
}
```

---

## ✅ Status Final

### Implementado
✅ Sistema de notificações de chat  
✅ Sistema de notificações gerais  
✅ Página de notificações com filtros  
✅ Notificações push (mobile e desktop)  
✅ Notificações sonoras  
✅ Badges com contadores  
✅ Integração em tarefas  
✅ Integração em empréstimos (2 locais)  
✅ Funções auxiliares (notificationHelpers.js)  
✅ Dark mode support  
✅ Layout responsivo  
✅ Prevenção de duplicatas  
✅ Controle de som (enable/disable)  

### Testado
✅ Compilação sem erros  
✅ Estrutura do Firestore  
✅ Hierarquia de providers  
✅ Imports corretos  

---

## 📞 Contato e Suporte

Em caso de dúvidas ou problemas, verificar:
1. Console do navegador (erros de JavaScript)
2. Console do Firestore (estrutura de dados)
3. Logs do Capacitor (mobile)
4. Documentação do projeto em `/docs`

---

**Data de Implementação**: 20 de Dezembro de 2024  
**Versão**: 1.0.0  
**Status**: ✅ COMPLETO E FUNCIONAL
