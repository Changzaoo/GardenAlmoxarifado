# 💬 Sistema de Mensagens Completo

## 📋 Visão Geral

Sistema completo de mensagens em tempo real com interface moderna estilo WhatsApp/Telegram, integrado ao WorkFlow. Permite comunicação individual e em grupo entre funcionários da mesma empresa e setor.

## ✨ Funcionalidades

### 🎯 Principais Recursos

- ✅ **Mensagens em Tempo Real** - Atualizações instantâneas via Firestore
- ✅ **Conversas Individuais** - Chat direto entre dois funcionários
- ✅ **Grupos** - Conversas com múltiplos participantes
- ✅ **Status de Leitura** - Indicadores "visto", "entregue" e "enviado"
- ✅ **Notificações Push** - Som e notificações visuais
- ✅ **Upload de Imagens** - Envio de fotos via Discord CDN
- ✅ **Preview de Mensagens** - Última mensagem na lista de conversas
- ✅ **Contador de Não Lidas** - Badge com quantidade de mensagens não lidas
- ✅ **Busca de Conversas** - Filtro por nome de pessoa ou grupo
- ✅ **Timestamps** - Hora de envio e agrupamento por data
- ✅ **Interface Responsiva** - Layout adaptado para mobile e desktop
- ✅ **Dark Mode** - Suporte completo a tema escuro

### 🚀 Recursos Avançados

- **Agrupamento por Data** - Mensagens organizadas por "Hoje", "Ontem", datas específicas
- **Avatar com Fallback** - Primeira letra do nome quando sem foto
- **Indicador de Digitação** - Mostra quando alguém está digitando (preparado para futuro)
- **Scroll Automático** - Rola para última mensagem ao enviar/receber
- **Multi-seleção** - Criar grupos com vários participantes
- **Filtragem Inteligente** - Apenas funcionários da mesma empresa/setor

## 📁 Estrutura de Arquivos

```
src/components/Mensagens/
├── MensagensTab.jsx          # Componente principal (página de mensagens)
├── ConversasList.jsx         # Lista de conversas com preview
├── ChatArea.jsx              # Área de chat ativa
├── MessageBubble.jsx         # Balão de mensagem individual
├── MessageInput.jsx          # Input com envio de texto e imagens
└── NovaConversaModal.jsx     # Modal para criar nova conversa/grupo
```

## 🗄️ Estrutura do Firestore

### Coleção: `conversas`

```javascript
{
  id: "auto-generated",
  tipo: "individual" | "grupo",
  nome: "Nome do Grupo" (apenas para grupos),
  participantes: ["userId1", "userId2", ...],
  criadoPor: "userId",
  criadoEm: Timestamp,
  ultimaAtualizacao: Timestamp,
  ultimaMensagem: {
    conteudo: "Texto da mensagem",
    tipo: "texto" | "imagem",
    remetenteId: "userId",
    timestamp: Timestamp,
    status: { /* ... */ }
  },
  naoLidas: {
    "userId1": 0,
    "userId2": 3
  }
}
```

### Coleção: `mensagens`

```javascript
{
  id: "auto-generated",
  conversaId: "conversaId",
  remetenteId: "userId",
  remetenteNome: "Nome do Usuário",
  conteudo: "Texto ou URL da imagem",
  tipo: "texto" | "imagem",
  timestamp: Timestamp,
  metadata: {
    // Para imagens
    discordMessageId: "123456",
    discordChannelId: "123456",
    nomeArquivo: "imagem.jpg",
    tamanho: 1024000
  },
  status: {
    entregue: true,
    lida: {
      "userId1": true,
      "userId2": false
    },
    deletada: false
  }
}
```

## 🔔 Sistema de Notificações

### Notificações em Tempo Real

O sistema usa o `MessageNotificationContext` para gerenciar notificações:

```javascript
// Recursos de notificação
- Som de notificação customizado
- Notificações push (mobile via Capacitor)
- Notificações desktop (Web Notifications API)
- Badge com contador de mensagens não lidas
- Limpeza automática ao abrir conversa
```

### Configuração de Som

1. Adicione o arquivo de som em `public/sounds/notification.wav`
2. O som toca automaticamente ao receber nova mensagem
3. Usuário pode desabilitar nas configurações

## 🎨 Interface do Usuário

### Layout Principal (MensagensTab)

```
┌─────────────────────────────────────────┐
│  Header: Título + Botão Nova Conversa  │
├─────────────┬───────────────────────────┤
│             │                           │
│   Lista de  │    Área de Chat Ativa     │
│  Conversas  │                           │
│             │  - Header da conversa     │
│  - Busca    │  - Mensagens agrupadas    │
│  - Preview  │  - Input de mensagem      │
│  - Badge    │                           │
│             │                           │
└─────────────┴───────────────────────────┘
```

### Responsividade

- **Desktop (≥768px)**: Duas colunas lado a lado
- **Mobile (<768px)**: Uma coluna, alterna entre lista e chat

## 📝 Exemplos de Uso

### Criar Conversa Individual

```javascript
const criarConversaIndividual = async (funcionarioId) => {
  const novaConversa = {
    tipo: 'individual',
    participantes: [usuario.id, funcionarioId],
    criadoPor: usuario.id,
    criadoEm: serverTimestamp(),
    ultimaAtualizacao: serverTimestamp(),
    naoLidas: {
      [usuario.id]: 0,
      [funcionarioId]: 0
    }
  };

  const docRef = await addDoc(collection(db, 'conversas'), novaConversa);
  return docRef.id;
};
```

### Enviar Mensagem

```javascript
const enviarMensagem = async (conversaId, conteudo) => {
  const mensagem = {
    conversaId,
    remetenteId: usuario.id,
    remetenteNome: usuario.nome,
    conteudo,
    tipo: 'texto',
    timestamp: serverTimestamp(),
    status: {
      entregue: true,
      lida: {
        [usuario.id]: true,
        [outroUsuario.id]: false
      },
      deletada: false
    }
  };

  await addDoc(collection(db, 'mensagens'), mensagem);
};
```

### Marcar como Lida

```javascript
const marcarComoLida = async (mensagemId, usuarioId) => {
  const msgRef = doc(db, 'mensagens', mensagemId);
  await updateDoc(msgRef, {
    [`status.lida.${usuarioId}`]: true
  });
};
```

## 🔒 Segurança

### Regras do Firestore

```javascript
// firestore.rules
match /conversas/{conversaId} {
  allow read: if request.auth.uid in resource.data.participantes;
  allow create: if request.auth.uid != null;
  allow update: if request.auth.uid in resource.data.participantes;
}

match /mensagens/{mensagemId} {
  allow read: if request.auth.uid in get(/databases/$(database)/documents/conversas/$(resource.data.conversaId)).data.participantes;
  allow create: if request.auth.uid != null;
  allow update: if request.auth.uid in get(/databases/$(database)/documents/conversas/$(resource.data.conversaId)).data.participantes;
}
```

## 🎯 Roadmap

### Próximas Funcionalidades

- [ ] **Indicador de digitação em tempo real**
- [ ] **Mensagens de voz**
- [ ] **Mensagens de vídeo**
- [ ] **Compartilhamento de arquivos**
- [ ] **Reações com emoji**
- [ ] **Responder mensagens**
- [ ] **Encaminhar mensagens**
- [ ] **Pesquisa dentro da conversa**
- [ ] **Fixar conversas importantes**
- [ ] **Arquivar conversas**
- [ ] **Silenciar notificações por conversa**
- [ ] **Administradores de grupo**
- [ ] **Remover participantes**
- [ ] **Editar nome do grupo**
- [ ] **Foto do grupo**
- [ ] **Mensagens temporárias**

## 🐛 Troubleshooting

### Mensagens não aparecem

1. Verifique se o usuário está na lista de `participantes` da conversa
2. Confirme que o `conversaId` está correto na mensagem
3. Verifique as regras de segurança do Firestore

### Notificações não funcionam

1. **Desktop**: Verificar se o usuário deu permissão para notificações
2. **Mobile**: Confirmar que o Capacitor está configurado corretamente
3. Verificar se o arquivo de som existe em `public/sounds/notification.wav`

### Imagens não carregam

1. Verificar configuração do Discord Storage
2. Confirmar que o channel ID está correto
3. Validar tamanho da imagem (máx 10MB)

### Performance lenta

1. Implementar paginação de mensagens antigas
2. Limitar consultas com `.limit(50)`
3. Usar índices compostos no Firestore

## 📊 Performance

### Otimizações Implementadas

- ✅ **Queries Indexadas** - Índices compostos para buscas rápidas
- ✅ **Lazy Loading** - Carrega mensagens sob demanda
- ✅ **Scroll Virtual** - Para conversas com muitas mensagens
- ✅ **Debounce na Busca** - Evita consultas excessivas
- ✅ **Unsubscribe Automático** - Limpa listeners ao desmontar componentes

### Métricas Esperadas

- Tempo de carregamento: < 500ms
- Latência de mensagem: < 100ms
- Uso de memória: < 50MB por conversa

## 📱 Mobile (Capacitor)

### Notificações Push

```javascript
// capacitor.config.ts
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#EF4444",
      sound: "notification.mp3"
    }
  }
};
```

## 🎓 Boas Práticas

1. **Sempre limpar listeners** ao desmontar componentes
2. **Validar dados** antes de enviar ao Firestore
3. **Usar timestamps do servidor** para evitar dessincronização
4. **Implementar retry logic** para falhas de rede
5. **Comprimir imagens** antes do upload
6. **Limitar tamanho de mensagens** (ex: 5000 caracteres)

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique este guia
2. Consulte a documentação do Firestore
3. Entre em contato com a equipe de desenvolvimento

---

**Desenvolvido com ❤️ para o Sistema WorkFlow**

*Última atualização: 3 de outubro de 2025*
