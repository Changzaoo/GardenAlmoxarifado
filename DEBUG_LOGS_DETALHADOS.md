# 🔍 DEBUG: Mensagens Aparecem e Somem - Logs Detalhados

## 🎯 Objetivo

Descobrir **exatamente** o que está causando as mensagens aparecerem e sumirem rapidamente.

---

## ✅ Correções Aplicadas

### 1. **Removida Segunda Instância do Hook**
**Problema encontrado:** `ListaConversas` estava chamando `useMensagens()` novamente, criando uma **segunda instância** do hook!

**Correção:**
- ✅ `ListaConversas` agora recebe `conversas`, `loading` e `formatarTimestamp` via **props**
- ✅ `MensagensMain` passa essas props da **única instância** do hook
- ✅ Agora há apenas **UMA instância** do `useMensagens` em toda a árvore de componentes

### 2. **Logs Detalhados Adicionados**
Adicionei logs em **5 pontos críticos** para rastrear o fluxo:

1. **MensagensMain.handleSelectConversa** - Quando usuário clica na conversa
2. **useMensagens.selecionarConversa** - Quando a função é executada
3. **Listener callback** - Quando mensagens chegam do Firestore
4. **JanelaChat useEffect** - Quando componente recebe mensagens via props
5. **Stack traces** - Para ver DE ONDE as funções estão sendo chamadas

---

## 🧪 Como Testar

### **Passo 1: Limpar o Console**
1. Abra o console do navegador (F12)
2. Clique no ícone 🚫 para limpar todos os logs anteriores
3. Deixe o console aberto e visível

### **Passo 2: Selecionar uma Conversa**
1. Na página de Mensagens, clique em **UMA conversa**
2. **NÃO clique em mais nenhuma conversa** por enquanto
3. Observe o console atentamente

### **Passo 3: Analisar os Logs**

Você deve ver uma sequência como esta:

```
═══════════════════════════════════════════════
🖱️ MensagensMain.handleSelectConversa chamado para: abc123
📍 Stack trace da chamada:
═══════════════════════════════════════════════
📂 selecionarConversa CHAMADO
🆔 Conversa solicitada: abc123
📊 Conversa ativa no ref: undefined
📊 Conversa ativa no state: null
📍 Stack trace da chamada:
═══════════════════════════════════════════════
✅ Conversa diferente, procedendo...
🔄 Atualizando conversaAtivaRef.current para: abc123
🔄 Chamando setConversaAtiva
🧹 Limpando array de mensagens com setMensagens([])
🎧 Criando listener de mensagens para conversa: abc123
👂 Escutando mensagens para conversa: abc123
📨 Snapshot de mensagens recebido: 5
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📬 CALLBACK DO LISTENER EXECUTADO
🆔 Para conversa: abc123
📊 Quantidade de mensagens: 5
📝 IDs das mensagens: [msg1, msg2, msg3, msg4, msg5]
💾 Chamando setMensagens com 5 mensagens
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🪟 JanelaChat - Mensagens recebidas via props: 5
🆔 IDs das mensagens: [msg1, msg2, msg3, msg4, msg5]
```

**Isso é o comportamento CORRETO!** ✅

---

## ❌ Cenários de ERRO

### **Erro 1: selecionarConversa é chamado MÚLTIPLAS VEZES**

Se você ver isto:

```
═══════════════════════════════════════════════
📂 selecionarConversa CHAMADO
🆔 Conversa solicitada: abc123
═══════════════════════════════════════════════
📂 selecionarConversa CHAMADO  ← DE NOVO!
🆔 Conversa solicitada: abc123
═══════════════════════════════════════════════
📂 selecionarConversa CHAMADO  ← E DE NOVO!
🆔 Conversa solicitada: abc123
```

**Significa:** Algo está chamando `selecionarConversa` repetidamente.

**Ação:** Olhe os **stack traces** para ver DE ONDE está vindo a chamada.

---

### **Erro 2: Mensagens chegam e depois vem array vazio**

Se você ver isto:

```
📬 CALLBACK DO LISTENER EXECUTADO
📊 Quantidade de mensagens: 5
💾 Chamando setMensagens com 5 mensagens
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🪟 JanelaChat - Mensagens recebidas via props: 5

[Algum tempo depois...]

📬 CALLBACK DO LISTENER EXECUTADO  ← DE NOVO!
📊 Quantidade de mensagens: 0      ← ZERO!
💾 Chamando setMensagens com 0 mensagens
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🪟 JanelaChat - Mensagens recebidas via props: 0  ← SUMIU!
```

**Significa:** O listener está sendo chamado novamente com array vazio.

**Ação:** Verificar se o listener está sendo recriado ou se há algum problema no Firestore.

---

### **Erro 3: setMensagens([]) é chamado após as mensagens chegarem**

Se você ver isto:

```
📬 CALLBACK DO LISTENER EXECUTADO
📊 Quantidade de mensagens: 5
💾 Chamando setMensagens com 5 mensagens
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🪟 JanelaChat - Mensagens recebidas via props: 5

═══════════════════════════════════════════════
📂 selecionarConversa CHAMADO  ← CHAMADO DE NOVO!
🧹 Limpando array de mensagens  ← LIMPOU!
```

**Significa:** `selecionarConversa` está sendo chamado novamente depois que as mensagens já chegaram.

**Ação:** Verificar POR QUE está sendo chamado novamente (ver stack trace).

---

## 🎯 O Que Eu Preciso Ver

Depois de seguir os passos acima, **copie e cole TODOS os logs do console** aqui na conversa.

Especialmente:
1. ✅ Toda a sequência de logs desde o clique até as mensagens aparecerem
2. ✅ Se houver logs repetindo, copie TODOS
3. ✅ Os **stack traces** são MUITO importantes - não os omita!
4. ✅ Se as mensagens sumirem, copie os logs do momento que elas somem

---

## 💡 Dicas

### Se você vir "⏭️ Mesma conversa já está ativa, IGNORANDO":
✅ **ISSO É BOM!** Significa que a verificação do ref está funcionando.

### Se você NÃO vir nenhum log:
❌ A página pode não ter sido recarregada. Pressione **F5** e tente novamente.

### Se os logs estiverem muito rápidos:
💡 Clique com o botão direito no console → **"Preserve log"** → Isso manterá todos os logs mesmo se a página recarregar.

---

## 🔍 Análise que Farei

Com os logs, poderei identificar **exatamente**:

1. ✅ Quantas vezes `selecionarConversa` é chamado
2. ✅ De onde vem cada chamada (stack trace)
3. ✅ Se o listener está sendo recriado
4. ✅ Se as mensagens chegam e depois são limpadas
5. ✅ Se há algum loop ou re-render infinito
6. ✅ O timing exato de cada operação

---

## 📊 Exemplo de Logs Saudáveis

```
[Clique do usuário]
═══════════════════════════════════════════════
🖱️ MensagensMain.handleSelectConversa
═══════════════════════════════════════════════
📂 selecionarConversa CHAMADO
✅ Conversa diferente, procedendo...
🎧 Criando listener
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📬 CALLBACK DO LISTENER EXECUTADO
📊 Quantidade: 5
💾 Chamando setMensagens com 5 mensagens
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🪟 JanelaChat - Mensagens recebidas: 5
[FIM - sem mais logs]
```

Mensagens devem **permanecer visíveis** e não deve haver mais logs após isso (a menos que você envie uma nova mensagem ou troque de conversa).

---

**🚀 Teste agora e me envie os logs completos!**
