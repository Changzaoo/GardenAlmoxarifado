# 🔧 Correção do Sistema de Mensagens - Regras do Firestore

## ❌ Problema Identificado

O sistema de mensagens estava carregando indefinidamente porque **as regras de segurança do Firestore não permitiam acesso à coleção `conversas`**.

## ✅ Solução

### Opção 1: Deploy Automático via CLI (Recomendado)

1. **Configure o Firebase CLI:**
```bash
firebase login
firebase use --add
```

2. **Selecione seu projeto** quando solicitado

3. **Faça deploy das regras:**
```bash
firebase deploy --only firestore:rules
```

### Opção 2: Atualização Manual (Rápida)

1. **Acesse o Firebase Console:**
   - Vá para: https://console.firebase.google.com
   - Selecione seu projeto

2. **Abra Firestore Database:**
   - No menu lateral, clique em "Firestore Database"
   - Clique na aba "Regras" (Rules)

3. **Adicione as regras de mensagens:**

Localize o final do arquivo de regras (antes do último `}`) e adicione:

```javascript
// ==================== SISTEMA DE MENSAGENS ====================

// Regras para conversas
match /conversas/{conversaId} {
  // Permitir leitura se o usuário é participante
  allow read: if request.auth != null && 
                 request.auth.uid in resource.data.participantes;
  
  // Permitir criação de novas conversas
  allow create: if request.auth != null && 
                   request.auth.uid in request.resource.data.participantes;
  
  // Permitir atualização se o usuário é participante
  allow update: if request.auth != null && 
                   request.auth.uid in resource.data.participantes;
  
  // Permitir exclusão apenas para grupos (admin do grupo)
  allow delete: if request.auth != null && 
                   resource.data.tipo == 'grupo' &&
                   resource.data.admin == request.auth.uid;
  
  // Regras para mensagens dentro de conversas
  match /mensagens/{mensagemId} {
    // Permitir leitura se o usuário é participante da conversa
    allow read: if request.auth != null && 
                   request.auth.uid in get(/databases/$(database)/documents/conversas/$(conversaId)).data.participantes;
    
    // Permitir criação se o usuário é participante
    allow create: if request.auth != null && 
                     request.auth.uid in get(/databases/$(database)/documents/conversas/$(conversaId)).data.participantes &&
                     request.resource.data.remetenteId == request.auth.uid;
    
    // Permitir atualização apenas do próprio usuário
    allow update: if request.auth != null && 
                     resource.data.remetenteId == request.auth.uid;
    
    // Permitir exclusão apenas do próprio usuário
    allow delete: if request.auth != null && 
                     resource.data.remetenteId == request.auth.uid;
  }
}

// Regras para usuários (necessário para buscar info de outros usuários)
match /usuarios/{userId} {
  // Qualquer usuário autenticado pode ler outros usuários (para mensagens)
  allow read: if request.auth != null;
  
  // Apenas o próprio usuário pode atualizar seus dados
  allow update: if request.auth != null && request.auth.uid == userId;
  
  // Permitir atualização dos campos de mensagens
  allow update: if request.auth != null && 
                   request.auth.uid == userId &&
                   request.resource.data.diff(resource.data).affectedKeys().hasOnly(['fcmTokens', 'status', 'ultimaVez']);
}
```

4. **Publique as regras:**
   - Clique no botão "Publicar" (Publish)
   - Aguarde a confirmação

### Opção 3: Regras de Teste (Apenas para Desenvolvimento)

⚠️ **ATENÇÃO: Use apenas em ambiente de desenvolvimento!**

Se você quiser testar rapidamente, pode usar estas regras temporárias:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**IMPORTANTE:** Estas regras permitem qualquer operação para usuários autenticados. Use apenas para testes!

## 📊 Verificação

Após atualizar as regras:

1. **Recarregue a página do aplicativo**
2. **Abra o Console do navegador** (F12)
3. **Procure pelos logs:**
   ```
   ✅ useMensagens: Inicializando para usuário: [ID]
   🔍 Buscando conversas para usuário: [ID]
   📦 Snapshot recebido: X conversas
   ```

4. **Se aparecer erro de permissão:**
   ```
   ❌ FirebaseError: Missing or insufficient permissions
   ```
   - Verifique se as regras foram publicadas corretamente
   - Confirme que o usuário está autenticado
   - Verifique se o campo `uid` do Firebase Auth coincide com o `id` do usuário

## 🔍 Índices Compostos (Opcional)

O Firestore pode solicitar a criação de índices. Se aparecer um erro com link para criar índice:

1. **Clique no link do erro** (ele leva direto para a criação)
2. **Ou crie manualmente:**
   - Vá em "Firestore Database" > "Índices"
   - Clique em "Adicionar índice"
   - **Coleção:** conversas
   - **Campos:**
     - `participantes` (Array-contains)
     - `atualizadaEm` (Descending)

## 📝 Logs de Debug Adicionados

O sistema agora inclui logs detalhados no console:

- `⚠️` = Aviso (usuário não logado)
- `✅` = Sucesso (inicialização)
- `🔍` = Busca (query no Firestore)
- `📦` = Dados recebidos (snapshot)
- `📋` = Dados processados
- `📩` = Conversas carregadas
- `❌` = Erro

## 🎯 Resultado Esperado

Após aplicar as regras, você deve ver:

1. ✅ Lista de conversas carrega (ou vazio se não houver)
2. ✅ Botão "+" aparece no topo
3. ✅ Modal "Nova Conversa" abre ao clicar no "+"
4. ✅ Lista de usuários aparece no modal
5. ✅ Possível criar conversas e grupos
6. ✅ Mensagens são enviadas e recebidas em tempo real

## 🆘 Ainda não funciona?

Se após atualizar as regras ainda não funcionar:

1. **Verifique o Console do navegador** (F12)
2. **Copie todos os logs vermelhos (erros)**
3. **Verifique se o usuário tem o campo `id`:**
   ```javascript
   console.log(usuario); // No console
   ```
4. **Verifique a estrutura do Firestore:**
   - A coleção `conversas` existe?
   - Os documentos têm o campo `participantes` (array)?

## 📚 Arquivos Atualizados

- ✅ `firestore.rules` - Regras de segurança atualizadas
- ✅ `firebase.json` - Configuração do Firebase criada
- ✅ `firestore.indexes.json` - Índices compostos definidos
- ✅ `src/hooks/useMensagens.js` - Logs de debug adicionados
- ✅ `src/services/mensagensService.js` - Logs de debug adicionados

## 🎉 Próximos Passos

Após as mensagens funcionarem:

1. Remover logs de debug (opcional)
2. Configurar push notifications
3. Fazer deploy das Cloud Functions
4. Testar em dispositivos móveis
