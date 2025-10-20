# 🔔 Sistema de Notificações de Mensagens

## Resumo das Melhorias Implementadas

### ✨ Recursos Implementados

#### 1. **Som de Notificação** 🔊
- ✅ Reproduz som ao receber nova mensagem
- ✅ Arquivo: `/public/sounds/notification.wav`
- ✅ Volume ajustável (padrão: 60%)
- ✅ Não toca se estiver na conversa ativa
- ✅ Tratamento de erros silencioso

```javascript
const audio = new Audio('/sounds/notification.wav');
audio.volume = 0.6;
await audio.play();
```

#### 2. **Notificações Push** 📱
- ✅ **Service Worker**: Notificações persistentes
- ✅ **Notificação Básica**: Fallback para navegadores sem SW
- ✅ **Vibração**: Padrão [200ms, 100ms, 200ms]
- ✅ **Ícone**: Logo da aplicação
- ✅ **Badge**: Indicador visual
- ✅ **Tag**: Agrupa notificações por conversa
- ✅ **Ações**: Botões "Abrir" e "Fechar"

#### 3. **Lógica Inteligente** 🧠
```
┌─────────────────────────────────────┐
│ Nova mensagem recebida              │
└──────────┬──────────────────────────┘
           │
           ▼
    ┌──────────────────┐
    │ Está na conversa?│──── SIM ──► Não notifica
    └──────┬───────────┘
           │ NÃO
           ▼
    ┌──────────────────────┐
    │ Janela ativa?        │
    │ Página de mensagens? │
    └──────┬───────────────┘
           │
      ┌────┴────┐
      │         │
     SIM       NÃO
      │         │
      ▼         ▼
   Toast    Notificação
   Apenas   Push + Som
```

#### 4. **Permissões de Notificação** 🔐
- ✅ Solicitação automática ao acessar mensagens
- ✅ Notificação de teste ao conceder permissão
- ✅ Toast informativo se negada
- ✅ Configuração persistente no navegador

#### 5. **Configurações Personalizáveis** ⚙️
```javascript
Preferências do usuário:
- enabled: true/false
- sound: true/false
- vibration: true/false
- desktop: true/false
- mobile: true/false
- showPreview: true/false
- playOnFocus: false
```

#### 6. **Multi-plataforma** 🌐
- ✅ **Desktop**: Notificações nativas do SO
- ✅ **Mobile Web**: Push notifications
- ✅ **Service Worker**: Notificações em segundo plano
- ✅ **Fallback**: Toast notifications sempre disponível

## 🎯 Comportamento das Notificações

### Cenário 1: Usuário está na conversa ativa
```
❌ SEM notificação
❌ SEM som
✅ Mensagem aparece diretamente no chat
```

### Cenário 2: Usuário está em outra conversa
```
✅ Notificação push
✅ Som de notificação
✅ Toast informativo
✅ Contador de não lidas atualizado
```

### Cenário 3: Usuário está em outra página
```
✅ Notificação push completa
✅ Som de notificação
✅ Toast informativo
✅ Badge no navegador (se suportado)
```

### Cenário 4: Navegador em segundo plano
```
✅ Notificação do sistema operacional
✅ Som (se permitido pelo SO)
✅ Ícone na bandeja de notificações
✅ Ao clicar: abre aplicação na conversa
```

## 🔊 Sistema de Som

### Arquivo de Som
- **Localização**: `/public/sounds/notification.wav`
- **Formato**: WAV (melhor compatibilidade)
- **Duração**: ~1 segundo
- **Volume padrão**: 60%

### Quando o som toca:
1. Nova mensagem recebida
2. Usuário NÃO está na conversa
3. Configuração de som está ativada
4. Navegador permite autoplay

### Tratamento de Erros:
```javascript
try {
  const playPromise = audio.play();
  if (playPromise !== undefined) {
    playPromise
      .then(() => console.log('✅ Som reproduzido'))
      .catch((error) => console.warn('⚠️ Erro silencioso'));
  }
} catch (error) {
  // Ignora erro silenciosamente
}
```

## 📱 Notificações Push

### Estrutura da Notificação:
```javascript
{
  title: "Nome do Remetente",
  body: "Conteúdo da mensagem (max 100 chars)",
  icon: "/logo192.png",
  badge: "/logo192.png",
  tag: "msg-{conversaId}",
  data: {
    conversaId: "xxx",
    url: "/#/mensagens?conversa=xxx",
    timestamp: Date
  },
  vibrate: [200, 100, 200],
  actions: [
    { action: 'open', title: '📖 Abrir' },
    { action: 'close', title: '✖️ Fechar' }
  ]
}
```

### Hierarquia de Implementação:
```
1. Service Worker (preferencial)
   ├─ registration.showNotification()
   └─ Suporta ações e persistência
   
2. Notificação Básica (fallback)
   ├─ new Notification()
   └─ Funcionalidade limitada
   
3. Toast (backup visual)
   └─ Sempre disponível
```

## ⚙️ Configuração do Usuário

### Painel de Configurações:
Acesso: **Mensagens → ⚙️ Configurações**

#### Opções disponíveis:
1. **Ativar Notificações** 🔔
   - Liga/desliga todas as notificações

2. **Som** 🔊
   - Tocar som ao receber mensagem

3. **Vibração** 📳
   - Vibrar dispositivo (mobile)

4. **Notificações Desktop** 💻
   - Push notifications no desktop

5. **Notificações Mobile** 📱
   - Push notifications no mobile

6. **Visualização de Conteúdo** 👁️
   - Mostrar preview da mensagem

7. **Som com Janela Ativa** 🔊
   - Tocar som mesmo estando na página

#### Botão de Teste:
- Envia notificação de teste
- Toca som de teste
- Vibração de teste
- Verifica configurações

## 🔧 Implementação Técnica

### Hook useMensagens.js

#### Funções Principais:

##### 1. `playNotificationSound()`
```javascript
// Reproduz som de notificação
// Volume: 0.6 (60%)
// Formato: WAV
// Erro: Silencioso
```

##### 2. `sendPushNotification()`
```javascript
// Envia notificação push
// Parâmetros:
{
  remetente: String,
  mensagem: String,
  conversaId: String,
  timestamp: Date
}
```

##### 3. `setupGlobalMessageListeners()`
```javascript
// Cria listeners para TODAS as conversas
// Detecta novas mensagens em tempo real
// Dispara notificações automaticamente
```

### Componente MensagensMain.jsx

#### Inicialização:
```javascript
useEffect(() => {
  requestNotificationPermission();
  notificationManager.initialize(userId);
}, [userId]);
```

### Componente NotificationSettings.jsx

#### Recursos:
- Toggle para cada configuração
- Botão de teste de notificação
- Solicitação de permissão
- Link para configurações do navegador

## 📊 Fluxo de Dados

```
Firebase (nova mensagem)
        │
        ▼
onSnapshot listener
        │
        ▼
setupGlobalMessageListeners
        │
        ├─► playNotificationSound()
        │
        └─► sendPushNotification()
                │
                ├─► Service Worker
                │   └─► registration.showNotification()
                │
                ├─► Notificação Básica
                │   └─► new Notification()
                │
                └─► Toast (backup)
                    └─► toast.info()
```

## 🚀 Como Usar

### Para Desenvolvedores:

1. **Verificar arquivo de som**:
```bash
ls public/sounds/notification.wav
```

2. **Testar localmente**:
```bash
npm start
# Acesse: http://localhost:3000/#/mensagens
# Permita notificações quando solicitado
# Envie mensagem de outro usuário
```

3. **Testar notificação**:
```javascript
// No console do navegador:
navigator.serviceWorker.ready.then(registration => {
  registration.showNotification('Teste', {
    body: 'Mensagem de teste',
    icon: '/logo192.png'
  });
});
```

### Para Usuários:

1. Acesse **Mensagens**
2. Permita notificações quando solicitado
3. Configure preferências em **⚙️ → Notificações**
4. Teste com botão **"Enviar Teste"**

## 🐛 Troubleshooting

### Som não toca:
1. Verifique volume do dispositivo
2. Navegador pode bloquear autoplay
3. Usuário deve interagir com página primeiro
4. Verifique console para erros

### Notificação não aparece:
1. Verifique permissão: `Notification.permission`
2. Service Worker registrado?
3. HTTPS obrigatório para production
4. Verifique configurações do navegador

### Notificação duplicada:
- Sistema usa TAG para prevenir duplicatas
- Tag: `msg-{conversaId}`
- Notificações antigas são substituídas

## 🔒 Segurança e Privacidade

- ✅ Permissão explícita do usuário
- ✅ Controle total sobre configurações
- ✅ Preview opcional da mensagem
- ✅ Sem envio de dados para terceiros
- ✅ Notificações apenas em HTTPS

## 📈 Performance

### Otimizações:
- Cache de áudio pré-carregado
- Reutilização de objetos Audio
- Listeners otimizados (1 por conversa)
- Debounce em notificações rápidas
- Auto-fechamento após 10s

### Consumo de Recursos:
- **Memória**: ~5MB (listeners + cache)
- **CPU**: Mínimo (eventos assíncronos)
- **Rede**: Apenas para novas mensagens
- **Bateria**: Impacto baixo

## 🎨 Customização Futura

### Possíveis Melhorias:
1. Sons personalizados por conversa
2. Diferentes tons para menções
3. Notificações agrupadas
4. Preview de imagens
5. Respostas rápidas
6. Modo "Não Perturbe"
7. Horários personalizados
8. Prioridade de contatos

## 📝 Changelog

### v2.0 (Atual)
- ✅ Som de notificação implementado
- ✅ Push notifications com Service Worker
- ✅ Vibração em dispositivos móveis
- ✅ Configurações personalizáveis
- ✅ Notificação de teste
- ✅ Lógica inteligente de contexto

### v1.0 (Anterior)
- Toast notifications básicas
- Sem som
- Sem push notifications

## 🎯 Compatibilidade

| Recurso | Chrome | Firefox | Safari | Edge | Mobile |
|---------|--------|---------|--------|------|--------|
| Notificações | ✅ | ✅ | ✅ | ✅ | ✅ |
| Som | ✅ | ✅ | ⚠️ | ✅ | ⚠️ |
| Vibração | ✅ | ✅ | ❌ | ✅ | ✅ |
| Service Worker | ✅ | ✅ | ✅ | ✅ | ✅ |
| Push API | ✅ | ✅ | ✅ | ✅ | ✅ |

⚠️ = Requer interação do usuário
❌ = Não suportado

## 📞 Suporte

Para problemas ou sugestões:
1. Verificar console do navegador
2. Testar em modo anônimo
3. Limpar cache e cookies
4. Verificar permissões do navegador
5. Reportar issue no GitHub
