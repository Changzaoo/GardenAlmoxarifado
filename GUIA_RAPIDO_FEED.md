# 🚀 Guia Rápido - Feed Social

## 📱 Começando

### 1. Acesse o Feed
- Entre no sistema
- Clique na aba **"Feed"** no menu (ícone 📷)

### 2. Primeira Configuração (Execute UMA vez)

Abra o console do navegador (F12) e execute:

```javascript
// Importar função (copie do código)
const setupDiscordChannels = async () => {
  const channels = [
    { name: 'posts-images', topic: 'Imagens dos posts do feed social' },
    { name: 'backups', topic: 'Backups automáticos do sistema' },
    { name: 'profile-pictures', topic: 'Fotos de perfil dos usuários' }
  ];

  const DISCORD_CONFIG = {
    botToken: 'SEU_BOT_TOKEN_AQUI', // Substitua pelo seu token
    serverId: '1423835753925836842'
  };

  for (const channel of channels) {
    const response = await fetch(
      `https://discord.com/api/v10/guilds/${DISCORD_CONFIG.serverId}/channels`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bot ${DISCORD_CONFIG.botToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: channel.name,
          type: 0,
          topic: channel.topic
        })
      }
    );
    
    const data = await response.json();
    console.log(`Canal ${channel.name}: ${data.id}`);
  }
};

// Executar
await setupDiscordChannels();
```

**Resultado esperado:**
```
Canal posts-images: 1234567890123456789
Canal backups: 9876543210987654321
Canal profile-pictures: 5555555555555555555
```

**IMPORTANTE:** Copie esses IDs e atualize no arquivo:
`src/services/discordStorage.js` → `DISCORD_CONFIG.channels`

```javascript
channels: {
  posts: '1234567890123456789',        // Seu ID aqui
  backups: '9876543210987654321',      // Seu ID aqui
  profiles: '5555555555555555555'      // Seu ID aqui
}
```

---

## 📝 Como Usar

### ✏️ Criar uma Publicação

1. **Clique em "Criar nova publicação"**
2. **Selecione uma imagem:**
   - Clique na área tracejada
   - Escolha JPG, PNG, GIF ou WebP
   - Máximo 25MB
3. **Escreva uma legenda** (opcional)
4. **Clique em "Publicar"**
5. **Aguarde o upload** (barra de progresso)

✅ Pronto! Seu post aparece no feed

---

### ❤️ Curtir um Post

1. Encontre o post
2. Clique no ícone de coração ❤️
3. Curtida registrada instantaneamente
4. Clique novamente para remover

---

### 💬 Comentar

1. Encontre o post
2. Clique no ícone de balão 💬
3. Digite seu comentário
4. Pressione Enter ou clique em "Enviar"
5. Comentário aparece em tempo real

---

### 🌐 Modo Explorar

**Por padrão:** Você vê apenas posts da sua equipe (mesma empresa e setor)

**Para explorar tudo:**
1. Clique no botão "Explorar" no topo
2. Feed atualiza automaticamente
3. Veja posts de TODAS as empresas
4. Clique novamente para voltar ao normal

---

### 🗑️ Deletar seu Post

1. Clique nos 3 pontos (⋮) no seu post
2. Selecione "Deletar"
3. Confirme a ação
4. Post e imagem são removidos

⚠️ **Atenção:** Apenas você pode deletar seus próprios posts!

---

## 🎯 Dicas de Uso

### 📸 Melhores Práticas para Fotos

✅ **BOM:**
- Fotos bem iluminadas
- Foco no assunto principal
- Resolução: 1920x1080 (Full HD)
- Formato: JPG ou PNG

❌ **EVITAR:**
- Fotos muito escuras
- Imagens borradas
- Arquivos gigantes (>10MB)
- Fotos ofensivas ou inapropriadas

### ✍️ Legendas Efetivas

✅ **BOM:**
```
"Novo equipamento instalado no setor de manutenção! 
Agora nosso trabalho vai ficar mais rápido 🔧⚙️"
```

❌ **EVITAR:**
```
"foto"
```

### 💬 Comentários Construtivos

✅ **BOM:**
- "Ótimo trabalho! Parabéns pela conquista 👏"
- "Boa ideia! Podemos implementar isso aqui também?"
- "Ficou show! Qual marca você usou?"

❌ **EVITAR:**
- Comentários ofensivos
- Spam
- Informações confidenciais

---

## 🔍 Filtros e Visibilidade

### Quem vê seus posts?

| Modo          | Visibilidade                                    |
|---------------|-------------------------------------------------|
| **Normal**    | Apenas funcionários da mesma empresa e setor    |
| **Explorar**  | Todos os funcionários de todas as empresas      |

### Exemplo:

**Sua empresa:** Almoxarifado Central  
**Seu setor:** Manutenção

**Modo Normal:**
- ✅ Vê: Posts da Manutenção do Almoxarifado Central
- ❌ Não vê: Posts de outros setores ou empresas

**Modo Explorar:**
- ✅ Vê: TODOS os posts de TODAS as empresas

---

## ⚙️ Configurações

### Compressão Automática

Imagens maiores que 2MB são **automaticamente comprimidas** para:
- Largura máxima: 1920px (Full HD)
- Qualidade: 85%
- Formato: JPEG

**Vantagens:**
- Upload mais rápido
- Economiza banda
- Mantém qualidade visual

### Limites

| Item              | Limite          |
|-------------------|-----------------|
| Tamanho da imagem | 25 MB           |
| Dimensões         | 8000 x 8000 px  |
| Legenda           | Ilimitada       |
| Comentário        | Ilimitado       |
| Posts por dia     | Ilimitado       |

---

## 🐛 Problemas Comuns

### "Erro ao enviar para Discord"

**Causa:** Canais não configurados

**Solução:**
1. Execute o setup dos canais (veja início deste guia)
2. Atualize os IDs em `discordStorage.js`
3. Recarregue a página

---

### "Arquivo muito grande"

**Causa:** Imagem > 25MB

**Solução:**
1. Reduzir resolução da imagem
2. Usar ferramenta online: [TinyPNG.com](https://tinypng.com)
3. Exportar como JPG com qualidade 80%

---

### Posts não aparecem

**Causa:** Você está no modo "Equipe" e sua equipe não postou nada

**Solução:**
1. Clique em "Explorar" para ver posts de outras equipes
2. Ou seja o primeiro a postar em sua equipe!

---

### Imagem não carrega

**Causa:** Link do Discord expirado (raro)

**Solução:**
1. Deletar o post e criar novamente
2. Se persistir, verificar se bot Discord está online

---

## 📊 Estatísticas

### Ver suas estatísticas

```javascript
// Abra o console (F12) e execute:

// Total de posts seus
const meusPosts = await getDocs(
  query(
    collection(db, 'posts'), 
    where('autorId', '==', 'SEU_USER_ID')
  )
);
console.log('Meus posts:', meusPosts.size);

// Total de curtidas recebidas
let totalCurtidas = 0;
meusPosts.forEach(doc => {
  totalCurtidas += (doc.data().curtidas || []).length;
});
console.log('Total de curtidas:', totalCurtidas);

// Total de comentários recebidos
let totalComentarios = 0;
meusPosts.forEach(doc => {
  totalComentarios += (doc.data().comentarios || []).length;
});
console.log('Total de comentários:', totalComentarios);
```

---

## 🎓 Tutorial em Vídeo (Texto)

### Passo a Passo Completo

**1. Preparação (30 segundos)**
- Abra o sistema
- Faça login
- Clique na aba "Feed"

**2. Primeira Publicação (2 minutos)**
- Clique em "Criar nova publicação"
- Clique na área tracejada
- Selecione uma foto do seu computador/celular
- Espere a prévia aparecer
- Digite uma legenda descritiva
- Clique em "Publicar"
- Aguarde a barra de progresso (10-30 segundos)
- ✅ Post publicado com sucesso!

**3. Interagindo (1 minuto)**
- Role o feed para ver outros posts
- Clique no ❤️ para curtir
- Clique no 💬 para comentar
- Digite algo legal e pressione Enter
- Veja seu comentário aparecer

**4. Explorando (30 segundos)**
- Clique no botão "Explorar" no topo
- Veja posts de todas as empresas
- Interaja com posts de outras equipes
- Clique novamente para voltar ao modo normal

**5. Gerenciando (1 minuto)**
- Encontre um post seu
- Clique nos 3 pontinhos (⋮)
- Selecione "Deletar"
- Confirme
- Post removido!

---

## 🎯 Metas e Desafios

### Desafios Semanais

**Iniciante:**
- [ ] Criar 1 post
- [ ] Curtir 5 posts
- [ ] Comentar em 3 posts

**Intermediário:**
- [ ] Criar 3 posts
- [ ] Receber 10 curtidas
- [ ] Receber 5 comentários

**Avançado:**
- [ ] Criar 5 posts
- [ ] Receber 25 curtidas
- [ ] Iniciar uma discussão com 10+ comentários

---

## 🌟 Boas Práticas da Comunidade

### Código de Conduta

✅ **Seja respeitoso**
✅ **Compartilhe conhecimento**
✅ **Celebre conquistas**
✅ **Ajude colegas**
✅ **Mantenha profissionalismo**

❌ **Não seja ofensivo**
❌ **Não faça spam**
❌ **Não compartilhe dados confidenciais**
❌ **Não use linguagem inadequada**

---

## 📞 Suporte

**Dúvidas?**
1. Consulte esta documentação
2. Pergunte a um colega que já usa
3. Entre em contato com TI

**Problemas técnicos?**
1. Tente recarregar a página (F5)
2. Limpe o cache do navegador
3. Verifique sua conexão com internet
4. Relate ao suporte técnico

---

## ✅ Checklist de Configuração

### Para Administradores

- [ ] Executar `setupDiscordChannels()`
- [ ] Copiar IDs dos canais criados
- [ ] Atualizar IDs em `discordStorage.js`
- [ ] Testar upload de imagem
- [ ] Verificar permissões do bot
- [ ] Testar deletar post
- [ ] Configurar backup automático
- [ ] Treinar funcionários

### Para Usuários

- [ ] Fazer login no sistema
- [ ] Acessar aba "Feed"
- [ ] Criar primeiro post
- [ ] Curtir post de colega
- [ ] Comentar em post
- [ ] Testar modo "Explorar"
- [ ] Deletar post de teste

---

## 🚀 Pronto!

Agora você está pronto para usar o Feed Social!

**Divirta-se compartilhando momentos e conectando com sua equipe! 🎉**

---

**Última atualização:** 03/10/2025  
**Versão:** 1.0.0
