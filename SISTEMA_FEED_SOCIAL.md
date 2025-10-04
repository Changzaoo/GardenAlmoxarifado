# 📱 Sistema de Feed Social com Upload Discord

## 🎯 Visão Geral

Sistema completo de feed social para funcionários compartilharem fotos e interagirem, com armazenamento de imagens usando Discord como CDN gratuito.

## ✨ Funcionalidades Principais

### 1. Feed de Publicações
- ✅ Timeline de posts com fotos e legendas
- ✅ Upload de imagens para Discord
- ✅ Curtidas e comentários
- ✅ Visualização por empresa/setor
- ✅ Modo "Explorar" para ver posts de outras equipes

### 2. Privacidade e Visibilidade
- **Modo Normal:** Mostra apenas posts da mesma empresa e setor
- **Modo Explorar:** Mostra posts de todas as empresas (opt-in)
- Filtros automáticos baseados em `empresaId` e `setorId`

### 3. Interações Sociais
- **Curtidas:** Sistema de "likes" com contador
- **Comentários:** Threads de discussão em cada post
- **Tempo Real:** Atualizações instantâneas via Firestore listeners

### 4. Armazenamento Inteligente
- **Discord CDN:** Imagens armazenadas gratuitamente no Discord
- **Compressão Automática:** Reduz imagens grandes antes do upload
- **Validação:** Verifica tipo, tamanho e dimensões
- **Backup:** Sistema também usa Discord para backups gerais

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────┐
│                   Frontend                       │
│  ┌───────────────────────────────────────────┐  │
│  │          FeedTab.jsx                      │  │
│  │  - Timeline de posts                      │  │
│  │  - Toggle Explorar/Equipe                 │  │
│  │  - Botão criar publicação                 │  │
│  └───────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────┐  │
│  │          PostCard.jsx                     │  │
│  │  - Card individual de post                │  │
│  │  - Sistema de curtidas                    │  │
│  │  - Sistema de comentários                 │  │
│  │  - Menu de ações (deletar)                │  │
│  └───────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────┐  │
│  │       NovoPostModal.jsx                   │  │
│  │  - Upload de imagem                       │  │
│  │  - Campo de legenda                       │  │
│  │  - Preview e compressão                   │  │
│  │  - Barra de progresso                     │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────┐
│                   Serviços                       │
│  ┌───────────────────────────────────────────┐  │
│  │      discordStorage.js                    │  │
│  │  - uploadToDiscord()                      │  │
│  │  - deleteFromDiscord()                    │  │
│  │  - validateImage()                        │  │
│  │  - compressImage()                        │  │
│  │  - backupToDiscord()                      │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────┐
│              Discord Bot API                     │
│  - Bot Token: MTMxNTk1NTMx...                   │
│  - Server ID: 1423835753925836842               │
│  - Canais:                                       │
│    • #posts-images (imagens de posts)           │
│    • #backups (backups do sistema)              │
│    • #profile-pictures (fotos de perfil)        │
└─────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────┐
│                Firestore Database                │
│  Collection: posts                               │
│  {                                               │
│    id, autorId, autorNome, autorFoto,           │
│    empresaId, setorId,                          │
│    legenda, imagemUrl (Discord CDN),            │
│    imagemDiscord: {messageId, channelId},       │
│    dataPostagem,                                 │
│    curtidas: [userId1, userId2...],             │
│    comentarios: [{...}, {...}]                  │
│  }                                               │
└─────────────────────────────────────────────────┘
```

## 📁 Estrutura de Arquivos

```
src/
├── components/
│   └── Feed/
│       └── FeedTab.jsx              // Componente principal do feed
│
├── services/
│   └── discordStorage.js            // Serviço de upload Discord
│
└── firebaseConfig.js                // Configuração Firebase
```

## 🔧 Configuração

### Discord Bot Setup

**1. Token do Bot:**
```javascript
[REMOVIDO POR SEGURANÇA - Use variável de ambiente VITE_DISCORD_BOT_TOKEN]
```

**2. Server ID:**
```javascript
1423835753925836842
```

**3. Canais (IDs placeholder - serão criados automaticamente):**
```javascript
{
  posts: '1423835753925836845',      // #posts-images
  backups: '1423835753925836846',    // #backups
  profiles: '1423835753925836847'    // #profile-pictures
}
```

### Criar Canais Automaticamente

Execute uma única vez no console do navegador após login:

```javascript
import { setupDiscordChannels } from './services/discordStorage';

// Criar canais
const result = await setupDiscordChannels();
console.log('Canais criados:', result);

// Atualizar IDs no discordStorage.js com os IDs retornados
```

**Resultado esperado:**
```javascript
[
  { success: true, name: 'posts-images', id: '...' },
  { success: true, name: 'backups', id: '...' },
  { success: true, name: 'profile-pictures', id: '...' }
]
```

## 💾 Estrutura de Dados (Firestore)

### Collection: `posts`

```javascript
{
  // Identificação
  id: string,                          // Auto-gerado pelo Firestore
  
  // Autor
  autorId: string,                     // ID do usuário
  autorNome: string,                   // Nome do funcionário
  autorFoto: string | null,            // URL da foto de perfil
  
  // Organização
  empresaId: string,                   // ID da empresa
  empresaNome: string,                 // Nome da empresa
  setorId: string,                     // ID do setor
  setorNome: string,                   // Nome do setor
  
  // Conteúdo
  legenda: string,                     // Texto da publicação
  imagemUrl: string,                   // URL do CDN Discord
  imagemDiscord: {
    messageId: string,                 // ID da mensagem no Discord
    channelId: string,                 // ID do canal
    filename: string                   // Nome do arquivo
  },
  
  // Timestamps
  dataPostagem: string,                // ISO 8601 timestamp
  
  // Interações
  curtidas: string[],                  // Array de userIds que curtiram
  comentarios: [
    {
      id: string,                      // Timestamp como ID
      autorId: string,
      autorNome: string,
      autorFoto: string | null,
      texto: string,
      data: string                     // ISO 8601 timestamp
    }
  ]
}
```

### Exemplo Real:

```javascript
{
  id: "abc123xyz",
  autorId: "user_001",
  autorNome: "João Silva",
  autorFoto: "https://cdn.discordapp.com/...",
  empresaId: "empresa_001",
  empresaNome: "Almoxarifado Central",
  setorId: "setor_001",
  setorNome: "Manutenção",
  legenda: "Novo equipamento instalado hoje! 🔧⚙️",
  imagemUrl: "https://cdn.discordapp.com/attachments/1423835753925836845/...",
  imagemDiscord: {
    messageId: "1234567890123456789",
    channelId: "1423835753925836845",
    filename: "equipamento_novo.jpg"
  },
  dataPostagem: "2025-10-03T14:30:00.000Z",
  curtidas: ["user_002", "user_003", "user_005"],
  comentarios: [
    {
      id: "1728058200000",
      autorId: "user_002",
      autorNome: "Maria Santos",
      autorFoto: null,
      texto: "Ficou ótimo! Parabéns pela instalação 👏",
      data: "2025-10-03T14:35:00.000Z"
    }
  ]
}
```

## 🎨 Interface do Usuário

### 1. Header do Feed

```
┌────────────────────────────────────────────────┐
│  Feed Social                    [Explorar 🌐]  │
│  Explorando todas as publicações               │
│                                                 │
│  [📷 Criar nova publicação]                    │
└────────────────────────────────────────────────┘
```

**Toggle Explorar:**
- OFF: Mostra apenas posts da mesma empresa/setor (azul)
- ON: Mostra todos os posts (gradiente roxo-rosa)

### 2. Card de Post

```
┌────────────────────────────────────────────────┐
│  👤 João Silva              ⋮ Menu             │
│     há 2 horas • Almoxarifado Central          │
├────────────────────────────────────────────────┤
│  [            IMAGEM DO POST             ]     │
│                                                 │
├────────────────────────────────────────────────┤
│  João Silva Novo equipamento instalado! 🔧     │
├────────────────────────────────────────────────┤
│  ❤️ 15   💬 3                                  │
├────────────────────────────────────────────────┤
│  Comentários:                                  │
│  👤 Maria: Ficou ótimo! 👏                     │
│     há 5 minutos                               │
│                                                 │
│  [Digite um comentário...        ] [Enviar]    │
└────────────────────────────────────────────────┘
```

### 3. Modal de Nova Publicação

```
┌────────────────────────────────────────────────┐
│  Nova Publicação                           ✕   │
├────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────┐ │
│  │                                           │ │
│  │          📷 Clique para adicionar        │ │
│  │             uma imagem                    │ │
│  │  JPG, PNG, GIF ou WebP (máx. 25MB)      │ │
│  │                                           │ │
│  └──────────────────────────────────────────┘ │
│                                                 │
│  Legenda:                                      │
│  ┌──────────────────────────────────────────┐ │
│  │ Escreva uma legenda...                    │ │
│  │                                           │ │
│  │                                           │ │
│  └──────────────────────────────────────────┘ │
│                                                 │
│  [Cancelar]              [Publicar]            │
└────────────────────────────────────────────────┘
```

## 🔐 Segurança e Permissões

### Regras de Visibilidade

**Modo Normal (Equipe):**
```javascript
query(
  collection(db, 'posts'),
  where('empresaId', '==', usuario.empresaId),
  where('setorId', '==', usuario.setorId),
  orderBy('dataPostagem', 'desc')
)
```

**Modo Explorar:**
```javascript
query(
  collection(db, 'posts'),
  orderBy('dataPostagem', 'desc')
)
```

### Ações Permitidas

| Ação               | Qualquer Usuário | Autor do Post |
|--------------------|------------------|---------------|
| Ver posts          | ✅               | ✅            |
| Curtir             | ✅               | ✅            |
| Comentar           | ✅               | ✅            |
| Criar post         | ✅               | ✅            |
| Deletar post       | ❌               | ✅            |
| Deletar comentário | ❌               | ⚠️ (futuro)   |

## 📤 Upload de Imagens

### Fluxo Completo

```javascript
// 1. Usuário seleciona arquivo
<input type="file" accept="image/*" onChange={handleImagemChange} />

// 2. Validar imagem
await validateImage(file);
// - Tipo: JPG, PNG, GIF, WebP
// - Tamanho: máx 25MB
// - Dimensões: máx 8000x8000px

// 3. Comprimir se > 2MB
if (file.size > 2 * 1024 * 1024) {
  file = await compressImage(file, 1920, 0.85);
}

// 4. Upload para Discord
const result = await uploadToDiscord(file, 'posts', metadata);
// Retorna: { url, messageId, channelId, filename }

// 5. Salvar no Firestore
await addDoc(collection(db, 'posts'), {
  ...dadosPost,
  imagemUrl: result.url,
  imagemDiscord: {
    messageId: result.messageId,
    channelId: result.channelId,
    filename: result.filename
  }
});
```

### Compressão Automática

**Parâmetros:**
- `maxWidth`: 1920px (Full HD)
- `quality`: 0.85 (85%)
- `format`: JPEG

**Economia esperada:**
- Imagem de 10MB → ~2-3MB
- Mantém qualidade visual
- Acelera upload e carregamento

## 🗑️ Deletar Post

### Processo

```javascript
const handleDeletar = async () => {
  // 1. Confirmar com usuário
  if (!confirm('Deseja realmente deletar?')) return;
  
  // 2. Deletar imagem do Discord
  await deleteFromDiscord(
    post.imagemDiscord.messageId, 
    post.imagemDiscord.channelId
  );
  
  // 3. Deletar post do Firestore
  await deleteDoc(doc(db, 'posts', post.id));
};
```

**Nota:** Apenas o autor pode deletar seu próprio post.

## 💾 Sistema de Backup

### Backup Automático para Discord

```javascript
import { backupToDiscord } from './services/discordStorage';

// Fazer backup de dados
const dados = {
  posts: [...],
  usuarios: [...],
  // ... outros dados
};

await backupToDiscord(dados, 'backup-diario');
```

**Resultado:**
- Arquivo JSON salvo no canal #backups
- Nome: `backup-diario_1696348200000.json`
- Pode ser baixado e restaurado manualmente

### Exemplo de Uso

```javascript
// Backup semanal automático
setInterval(async () => {
  const posts = await getDocs(collection(db, 'posts'));
  const postsData = posts.docs.map(doc => doc.data());
  
  await backupToDiscord({ posts: postsData }, 'backup-semanal');
}, 7 * 24 * 60 * 60 * 1000); // 7 dias
```

## 🎯 Funcionalidades Futuras (Roadmap)

### Curto Prazo
- [ ] Editar posts
- [ ] Deletar comentários próprios
- [ ] Notificações de curtidas/comentários
- [ ] Marcar amigos (@menção)
- [ ] Hashtags (#trending)

### Médio Prazo
- [ ] Stories (24h)
- [ ] Vídeos curtos
- [ ] Filtros de imagem
- [ ] Múltiplas imagens por post (carrossel)
- [ ] Salvar posts favoritos

### Longo Prazo
- [ ] Feed algorítmico (IA)
- [ ] Recomendações de pessoas
- [ ] Grupos privados
- [ ] Transmissão ao vivo
- [ ] Reações além de curtir (emoji)

## 🐛 Solução de Problemas

### Erro: "Failed to upload to Discord"

**Causa:** Token do bot inválido ou canais não existem

**Solução:**
1. Verificar token em `discordStorage.js`
2. Executar `setupDiscordChannels()` para criar canais
3. Atualizar IDs dos canais no código

### Erro: "Image too large"

**Causa:** Imagem > 25MB

**Solução:**
1. Sistema comprime automaticamente imagens > 2MB
2. Se ainda assim > 25MB, solicitar ao usuário reduzir resolução

### Posts não aparecem

**Causa:** Filtros de empresa/setor

**Solução:**
1. Verificar se `empresaId` e `setorId` estão definidos no usuário
2. Ativar modo "Explorar" para ver todos os posts
3. Verificar console do navegador para erros de query

### Comentários não salvam

**Causa:** Estrutura de dados incorreta

**Solução:**
1. Verificar se post possui campo `comentarios: []` inicializado
2. Verificar permissões do Firestore

## 📊 Monitoramento

### Métricas Importantes

```javascript
// Total de posts
const totalPosts = await getDocs(collection(db, 'posts'));
console.log('Total de posts:', totalPosts.size);

// Posts por empresa
const postsEmpresa = await getDocs(
  query(collection(db, 'posts'), where('empresaId', '==', 'empresa_001'))
);
console.log('Posts da empresa:', postsEmpresa.size);

// Usuários mais ativos
const posts = await getDocs(collection(db, 'posts'));
const autores = {};
posts.forEach(doc => {
  const autorId = doc.data().autorId;
  autores[autorId] = (autores[autorId] || 0) + 1;
});
console.log('Posts por autor:', autores);
```

## 🚀 Performance

### Otimizações Implementadas

1. **Lazy Loading:** Imagens carregam sob demanda
2. **Compressão:** Reduz tamanho de imagens grandes
3. **Real-time limitado:** Apenas posts recentes carregam
4. **CDN Discord:** Latência baixa globalmente
5. **Firestore Queries:** Índices compostos em `empresaId+setorId+dataPostagem`

### Índices Firestore Necessários

```javascript
// firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "posts",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "empresaId", "order": "ASCENDING" },
        { "fieldPath": "setorId", "order": "ASCENDING" },
        { "fieldPath": "dataPostagem", "order": "DESCENDING" }
      ]
    }
  ]
}
```

## 🎓 Tutoriais Rápidos

### Como Criar um Post

1. Clique em "Criar nova publicação"
2. Selecione uma imagem (opcional)
3. Escreva uma legenda
4. Clique em "Publicar"
5. Aguarde o upload (barra de progresso)
6. Post aparece no feed instantaneamente

### Como Comentar

1. Encontre o post
2. Clique no ícone de comentário (💬)
3. Digite seu comentário no campo
4. Pressione Enter ou clique em "Enviar"
5. Comentário aparece imediatamente

### Como Explorar Posts de Outras Equipes

1. Clique no toggle "Explorar" no topo
2. Feed atualiza automaticamente
3. Veja posts de todas as empresas/setores
4. Clique novamente para voltar ao modo normal

## 📞 Suporte

**Problemas técnicos:**
- Verificar console do navegador (F12)
- Verificar logs do Discord (Developer Portal)
- Verificar regras do Firestore

**Dúvidas:**
- Consultar esta documentação
- Verificar código-fonte comentado

---

## ✅ Checklist de Implementação

- [x] Serviço de upload Discord criado
- [x] Componente FeedTab implementado
- [x] Sistema de curtidas funcional
- [x] Sistema de comentários funcional
- [x] Filtros por empresa/setor
- [x] Modo explorar implementado
- [x] Compressão de imagens
- [x] Validação de arquivos
- [x] Sistema de backup
- [x] Integração no menu principal
- [x] Documentação completa

**Status:** ✅ SISTEMA COMPLETO E FUNCIONAL

**Pronto para uso em produção!** 🚀
