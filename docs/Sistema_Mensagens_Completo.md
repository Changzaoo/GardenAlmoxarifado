# 📱 Sistema de Mensagens WorkFlow

## Visão Geral

Sistema completo de mensagens em tempo real, similar ao WhatsApp, implementado com React e Firebase. Oferece comunicação instantânea entre usuários com recursos avançados de chat.

---

## 🎯 Funcionalidades Principais

### ✅ Mensagens
- ✅ Envio e recebimento em tempo real
- ✅ Mensagens de texto, imagens, arquivos, vídeo e áudio
- ✅ Status de mensagem (enviando, enviada, entregue, lida)
- ✅ Indicador visual com ícones (✓, ✓✓, ✓✓ azul)
- ✅ Edição de mensagens enviadas
- ✅ Exclusão de mensagens (para mim ou para todos)
- ✅ Timestamp e data de envio
- ✅ Agrupamento de mensagens do mesmo remetente

### ✅ Conversas
- ✅ Conversas privadas (1:1)
- ✅ Suporte para grupos (preparado para expansão)
- ✅ Lista de conversas ordenada por última mensagem
- ✅ Contador de mensagens não lidas
- ✅ Busca de conversas
- ✅ Filtros (todas, não lidas, arquivadas)

### ✅ Status e Presença
- ✅ Status online/offline em tempo real
- ✅ Última vez visto
- ✅ Indicador de digitação ("está digitando...")
- ✅ Status customizáveis (Online, Ausente, Não Perturbe)

### ✅ Anexos
- ✅ Upload de imagens com preview
- ✅ Upload de arquivos (PDF, DOC, XLS, etc)
- ✅ Upload de vídeos com player integrado
- ✅ Upload de áudios
- ✅ Validação de tamanho e tipo
- ✅ Download de anexos

### ✅ Bloqueio e Privacidade
- ✅ Bloquear usuários
- ✅ Desbloquear usuários
- ✅ Mensagens bloqueadas não são enviadas
- ✅ Indicador visual de bloqueio

### ✅ Configurações
- ✅ Silenciar notificações por conversa
- ✅ Arquivar conversas
- ✅ Fixar conversas importantes
- ✅ Deletar conversa completa

### ✅ Interface
- ✅ Design moderno similar ao WhatsApp
- ✅ Dark mode completo
- ✅ Responsivo (mobile e desktop)
- ✅ Animações suaves
- ✅ Scroll infinito (carrega mensagens antigas)
- ✅ Botão de scroll para baixo
- ✅ Avatar com inicial do nome

---

## 📁 Estrutura de Arquivos

```
src/
├── constants/
│   └── mensagensConstants.js         # Constantes e configurações
├── services/
│   └── mensagensService.js           # Serviço Firebase
├── hooks/
│   └── useMensagens.js               # Hook customizado
└── components/
    └── Mensagens/
        ├── MensagensMain.jsx         # Componente principal
        ├── ListaConversas.jsx        # Lista de chats
        ├── JanelaChat.jsx            # Área de conversa
        ├── InputMensagem.jsx         # Campo de entrada
        ├── BolhaMensagem.jsx         # Mensagem individual
        └── PerfilUsuario.jsx         # Perfil e configurações
```

---

## 🗄️ Estrutura do Firestore

### Coleção: `conversas`
```javascript
{
  id: "conversaId",
  tipo: "privada" | "grupo",
  participantes: ["userId1", "userId2"],
  participantesInfo: {
    userId1: {
      naoLidas: 0,
      ultimaVez: timestamp,
      silenciado: false,
      arquivado: false,
      fixado: false
    }
  },
  nome: "Nome do Grupo" (opcional),
  ultimaMensagem: {
    id: "msgId",
    texto: "Última mensagem...",
    remetenteId: "userId",
    timestamp: timestamp
  },
  bloqueios: {
    userId1: "userId2" // userId1 bloqueou userId2
  },
  digitando: {
    userId1: timestamp // Quem está digitando
  },
  criadaEm: timestamp,
  atualizadaEm: timestamp
}
```

### Subcoleção: `conversas/{conversaId}/mensagens`
```javascript
{
  id: "mensagemId",
  texto: "Conteúdo da mensagem",
  remetenteId: "userId",
  tipo: "texto" | "imagem" | "arquivo" | "audio" | "video" | "sistema",
  anexoUrl: "https://..." (opcional),
  status: "enviando" | "enviada" | "entregue" | "lida" | "erro",
  timestamp: timestamp,
  editada: false,
  editadaEm: timestamp (se editada),
  deletada: false,
  leitaPor: ["userId1", "userId2"],
  entregueA: ["userId1", "userId2"]
}
```

### Coleção: `usuarios`
```javascript
{
  id: "userId",
  status: "online" | "offline" | "ausente" | "nao_perturbe",
  ultimaVez: timestamp,
  bloqueados: ["userId1", "userId2"] // Lista de bloqueados
}
```

---

## 🔧 Como Usar

### 1. Iniciar Conversa
```javascript
const { iniciarConversa } = useMensagens();

// Iniciar conversa com outro usuário
const conversa = await iniciarConversa(outroUsuarioId);
```

### 2. Enviar Mensagem
```javascript
const { enviarMensagem } = useMensagens();

await enviarMensagem(conversaId, "Olá, tudo bem?");
```

### 3. Enviar Arquivo
```javascript
const { enviarArquivo } = useMensagens();

const file = event.target.files[0];
await enviarArquivo(conversaId, file, MESSAGE_TYPE.IMAGEM);
```

### 4. Bloquear Usuário
```javascript
const { bloquearUsuario } = useMensagens();

await bloquearUsuario(conversaId, usuarioId);
```

### 5. Escutar Mensagens
```javascript
const { mensagens, selecionarConversa } = useMensagens();

// Selecionar conversa para escutar mensagens
selecionarConversa(conversa);

// Mensagens atualizam automaticamente
console.log(mensagens);
```

---

## ⚙️ Configurações

### Limites
```javascript
MAX_MESSAGE_LENGTH: 5000       // Caracteres
MAX_FILE_SIZE: 16MB            // Arquivos
MAX_IMAGE_SIZE: 5MB            // Imagens
MAX_VIDEO_SIZE: 16MB           // Vídeos
MESSAGES_PER_PAGE: 50          // Paginação
TYPING_TIMEOUT: 3000ms         // Indicador de digitação
```

### Tipos de Arquivo Aceitos
- **Imagens**: JPEG, PNG, GIF, WebP
- **Documentos**: PDF, DOC, DOCX, XLS, XLSX, TXT, CSV
- **Áudio**: MP3, OGG, WAV, WebM
- **Vídeo**: MP4, WebM, OGG

---

## 🎨 Personalização

### Cores de Status
```javascript
Online: #00BA7C (verde)
Offline: #8899A6 (cinza)
Ausente: #FFD700 (amarelo)
Não Perturbe: #F4212E (vermelho)
```

### Ícones de Status de Mensagem
- ⏱️ Enviando (Clock icon)
- ✓ Enviada (Check)
- ✓✓ Entregue (CheckCheck cinza)
- ✓✓ Lida (CheckCheck azul)
- ⚠️ Erro (AlertCircle)

---

## 🚀 Recursos Avançados

### Scroll Infinito
As mensagens são carregadas em lotes de 50. Ao rolar para o topo, mais mensagens antigas são carregadas automaticamente.

### Otimização de Performance
- **useMemo**: Cache de dados filtrados
- **Listeners em tempo real**: Apenas para conversa ativa
- **Cleanup**: Listeners são removidos ao trocar de conversa

### Sincronização Offline (preparado)
- Fila de mensagens offline
- Retry automático
- Cache local de 24 horas

### Segurança
- Validação de bloqueio antes de enviar
- Verificação de permissões
- Sanitização de inputs
- Validação de tipos de arquivo

---

## 📱 Responsividade

### Desktop (≥ 1024px)
- Layout de 2 colunas (lista + chat)
- Menu lateral fixo
- Scroll independente

### Mobile (< 1024px)
- Layout de tela única
- Navegação entre lista e chat
- Botão de voltar
- Menu hamburger

---

## 🔔 Notificações

### Tipos de Notificação
- Nova mensagem recebida
- Mensagem enviada com sucesso
- Erro ao enviar mensagem
- Usuário bloqueado/desbloqueado

### Sons
```javascript
NEW_MESSAGE: '/sounds/notification.mp3'
SENT: '/sounds/sent.mp3'
ERROR: '/sounds/error.mp3'
```

---

## 🔐 Permissões

### Níveis de Acesso
- ✅ **Todos os usuários**: Podem usar o sistema de mensagens
- ✅ **Supervisor+**: Sem restrições adicionais
- ✅ **Admin**: Acesso total

### Ações por Nível
| Ação | Funcionário | Supervisor | Gerente | Admin |
|------|------------|------------|---------|-------|
| Enviar mensagem | ✅ | ✅ | ✅ | ✅ |
| Ver conversas | ✅ | ✅ | ✅ | ✅ |
| Bloquear usuário | ✅ | ✅ | ✅ | ✅ |
| Criar grupo | ✅ | ✅ | ✅ | ✅ |
| Deletar mensagem | ✅ (própria) | ✅ (própria) | ✅ (própria) | ✅ |

---

## 🐛 Solução de Problemas

### Mensagens não aparecem
1. Verificar conexão com Firebase
2. Verificar se conversa está selecionada
3. Checar console para erros

### Upload de arquivo falha
1. Verificar tamanho do arquivo (máx 16MB)
2. Verificar tipo de arquivo aceito
3. Checar regras do Storage

### Status online/offline incorreto
1. Verificar listener do usuário
2. Checar atualização de status ao montar/desmontar

### Indicador de digitação não funciona
1. Verificar timeout (3 segundos)
2. Checar atualização no Firebase
3. Verificar conversaId correto

---

## 📝 Próximas Melhorias

### Planejado
- [ ] Mensagens de áudio (gravação)
- [ ] Compartilhamento de localização
- [ ] Reações às mensagens (emoji)
- [ ] Respostas (reply)
- [ ] Encaminhar mensagens
- [ ] Mensagens fixadas
- [ ] Busca dentro da conversa
- [ ] Backup de conversas
- [ ] Criptografia end-to-end
- [ ] Chamadas de voz/vídeo
- [ ] Stories/Status
- [ ] Grupos com admin
- [ ] Adicionar/remover participantes
- [ ] Mudar foto do grupo

### Em Desenvolvimento
- ✅ Sistema completo funcional
- ✅ Bloqueio de usuários
- ✅ Status online/offline
- ✅ Indicador de digitação

---

## 📚 Referências

- [Firebase Firestore](https://firebase.google.com/docs/firestore)
- [React Hooks](https://reactjs.org/docs/hooks-intro.html)
- [Lucide Icons](https://lucide.dev/)
- [TailwindCSS](https://tailwindcss.com/)

---

## 🤝 Contribuindo

Para adicionar novas funcionalidades:

1. Atualizar constantes em `mensagensConstants.js`
2. Adicionar métodos no `mensagensService.js`
3. Expor funcionalidade no hook `useMensagens.js`
4. Criar/atualizar componentes UI
5. Testar com diferentes cenários
6. Documentar mudanças

---

## ✅ Checklist de Implementação

- [x] Constantes e tipos
- [x] Serviço Firebase
- [x] Hook customizado
- [x] Componente BolhaMensagem
- [x] Componente InputMensagem
- [x] Componente JanelaChat
- [x] Componente ListaConversas
- [x] Componente PerfilUsuario
- [x] Componente MensagensMain
- [x] Integração com Workflow
- [x] Dark mode
- [x] Responsividade
- [x] Sistema de bloqueio
- [x] Upload de arquivos
- [x] Status de mensagens
- [x] Indicador de digitação

---

**Versão**: 1.0.0  
**Data**: Outubro 2025  
**Status**: ✅ Completo e Funcional
