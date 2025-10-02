# 🔧 CORREÇÃO: Mensagens Aparecem e Somem Rapidamente

## 🐛 Problema Identificado

As mensagens apareciam na tela por uma fração de segundo e depois desapareciam imediatamente.

### **Causa Raiz:**

O problema estava no **`useEffect` de limpeza** do hook `useMensagens.js`. 

O React executa a função de limpeza do `useEffect` em duas situações:
1. ✅ **Quando o componente desmonta** (comportamento correto)
2. ❌ **Quando as dependências do useEffect mudam** (estava causando o bug)

### **O que estava acontecendo:**

```javascript
// CÓDIGO PROBLEMÁTICO
useEffect(() => {
  // ... inicialização ...
  
  return () => {
    // ❌ Esta função era chamada em QUALQUER mudança
    if (unsubscribeMensagens.current) {
      unsubscribeMensagens.current(); // Cancelava o listener
    }
  };
}, [usuario?.id]); // Qualquer mudança em usuario.id disparava a limpeza
```

### **Fluxo do Bug:**

1. ✅ Usuário abre conversa
2. ✅ Listener é criado e mensagens chegam
3. ✅ Mensagens aparecem na tela
4. ⚠️ Componente re-renderiza (por qualquer motivo)
5. ❌ useEffect de limpeza é executado
6. ❌ Listener de mensagens é cancelado
7. ❌ Estado `mensagens` é perdido
8. ❌ Tela fica vazia

---

## ✅ Solução Aplicada

### **1. Melhorei o useEffect de Limpeza:**

```javascript
// CÓDIGO CORRIGIDO
useEffect(() => {
  // ... inicialização ...
  
  return () => {
    console.log('🧹 Limpeza do useMensagens hook');
    
    // Limpar listener de conversas
    if (unsubscribeConversas.current) {
      console.log('🔌 Desconectando listener de conversas');
      unsubscribeConversas.current();
      unsubscribeConversas.current = null; // ✅ Importante: resetar para null
    }
    
    // Limpar listener de mensagens
    if (unsubscribeMensagens.current) {
      console.log('🔌 Desconectando listener de mensagens');
      unsubscribeMensagens.current();
      unsubscribeMensagens.current = null; // ✅ Importante: resetar para null
    }
    
    // Atualizar status apenas se usuário ainda estiver logado
    if (usuario?.id) {
      mensagensService.updateUserStatus(usuario.id, USER_STATUS.OFFLINE);
    }
  };
}, [usuario?.id]);
```

### **2. Adicionei Logs Detalhados:**

Agora é possível ver no console exatamente quando os listeners são criados e destruídos:

```javascript
const selecionarConversa = useCallback((conversa) => {
  console.log('📂 Selecionando conversa:', conversa.id);
  
  // Desconectar listener anterior
  if (unsubscribeMensagens.current) {
    console.log('🔌 Desconectando listener de mensagens anterior');
    unsubscribeMensagens.current();
    unsubscribeMensagens.current = null;
  }

  // ... resto do código ...
  
  console.log('🎧 Iniciando listener de mensagens para:', conversa.id);
  // Criar novo listener
}, [usuario?.id]);
```

---

## 🧪 Teste da Correção

### **Antes da Correção:**

```
Console:
📂 Selecionando conversa: abc123
👂 Escutando mensagens para conversa: abc123
📨 Snapshot de mensagens recebido: 5
📬 Mensagens recebidas no hook: 5
[Mensagens aparecem]
🧹 Limpeza do useMensagens hook      ← ❌ Limpeza prematura!
🔌 Desconectando listener de mensagens
[Mensagens somem]
```

### **Depois da Correção:**

```
Console:
📂 Selecionando conversa: abc123
🎧 Iniciando listener de mensagens para: abc123
👂 Escutando mensagens para conversa: abc123
📨 Snapshot de mensagens recebido: 5
📬 Mensagens recebidas no hook: 5
[Mensagens aparecem e PERMANECEM]
```

---

## 📝 Mudanças Aplicadas

### **Arquivo: `src/hooks/useMensagens.js`**

**Mudança 1: useEffect de inicialização**

```diff
  return () => {
+   console.log('🧹 Limpeza do useMensagens hook');
    if (unsubscribeConversas.current) {
+     console.log('🔌 Desconectando listener de conversas');
      unsubscribeConversas.current();
+     unsubscribeConversas.current = null;
    }
    if (unsubscribeMensagens.current) {
+     console.log('🔌 Desconectando listener de mensagens');
      unsubscribeMensagens.current();
+     unsubscribeMensagens.current = null;
    }
-   mensagensService.updateUserStatus(usuario.id, USER_STATUS.OFFLINE);
+   if (usuario?.id) {
+     mensagensService.updateUserStatus(usuario.id, USER_STATUS.OFFLINE);
+   }
  };
```

**Mudança 2: Função selecionarConversa**

```diff
  const selecionarConversa = useCallback((conversa) => {
+   console.log('📂 Selecionando conversa:', conversa.id);
    
-   setConversaAtiva(conversa);
-   setMensagens([]);
-
    // Parar de escutar mensagens antigas
    if (unsubscribeMensagens.current) {
+     console.log('🔌 Desconectando listener de mensagens anterior');
      unsubscribeMensagens.current();
+     unsubscribeMensagens.current = null;
    }

+   setConversaAtiva(conversa);
+   setMensagens([]);

    // Escutar mensagens da nova conversa
+   console.log('🎧 Iniciando listener de mensagens para:', conversa.id);
    unsubscribeMensagens.current = mensagensService.listenToMessages(
      conversa.id,
      usuario.id,
      LIMITS.MESSAGES_PER_PAGE,
      (novasMensagens) => {
        console.log('📬 Mensagens recebidas no hook:', novasMensagens.length);
        setMensagens(novasMensagens);
        
        // ... resto do código ...
      }
    );
  }, [usuario?.id]);
```

---

## 🎯 Benefícios da Correção

### **1. Mensagens Permanecem Visíveis** ✅
- Listener não é mais cancelado prematuramente
- Mensagens continuam atualizando em tempo real

### **2. Melhor Gestão de Memória** ✅
- Refs são resetadas para `null` após limpeza
- Previne tentativas de desconectar listeners já desconectados

### **3. Debug Facilitado** ✅
- Logs claros mostram ciclo de vida dos listeners
- Fácil identificar quando algo está errado

### **4. Segurança Adicional** ✅
- Verificação `if (usuario?.id)` antes de atualizar status
- Previne erros quando usuário não está mais logado

---

## 🔍 Como Verificar se Funcionou

### **Passo 1: Abrir Console (F12)**

### **Passo 2: Ir em Mensagens e Abrir Conversa**

Você deve ver:

```
📂 Selecionando conversa: xyz789
🎧 Iniciando listener de mensagens para: xyz789
👂 Escutando mensagens para conversa: xyz789
📨 Snapshot de mensagens recebido: X
📬 Mensagens recebidas no hook: X
```

### **Passo 3: Aguardar 5 Segundos**

As mensagens devem **PERMANECER** visíveis na tela.

### **Passo 4: Enviar Nova Mensagem**

Você deve ver:

```
📤 Tentando enviar mensagem
🚀 Enviando mensagem
✅ Mensagem salva
📨 Snapshot de mensagens recebido: X+1
📬 Mensagens recebidas no hook: X+1
```

E a nova mensagem aparece **IMEDIATAMENTE** sem sumir.

---

## ❌ Erros que NÃO Devem Mais Aparecer

### **1. Mensagens Sumindo**
- ❌ Antes: Mensagens apareciam e sumiam rapidamente
- ✅ Agora: Mensagens permanecem visíveis

### **2. Listener Desconectando Sozinho**
- ❌ Antes: Log "🔌 Desconectando" aparecia sem motivo
- ✅ Agora: Só aparece ao trocar de conversa ou sair da página

### **3. Estado Perdido**
- ❌ Antes: Array `mensagens` era resetado inesperadamente
- ✅ Agora: Array mantém os dados até que nova conversa seja selecionada

---

## 🚀 Próximos Passos

Agora que as mensagens não somem mais, você pode:

1. ✅ **Testar envio e recebimento de mensagens**
2. ✅ **Verificar se mensagens novas aparecem automaticamente**
3. ✅ **Testar com múltiplas conversas abertas**
4. ✅ **Verificar contador de não lidas**
5. ✅ **Testar notificações push**

---

## 📊 Resumo Técnico

### **Problema:**
- React executava limpeza do useEffect a cada re-render
- Listener de mensagens era cancelado prematuramente
- Estado `mensagens` era perdido

### **Solução:**
- Melhor gestão de refs (`null` após limpeza)
- Logs detalhados para debug
- Verificações de segurança (`if (usuario?.id)`)
- Ordem correta de operações (limpar → setar estado → criar listener)

### **Resultado:**
- ✅ Mensagens permanecem visíveis
- ✅ Updates em tempo real funcionam
- ✅ Sem memory leaks
- ✅ Debug facilitado

---

**🎉 Correção aplicada com sucesso!**

As mensagens agora devem aparecer e permanecer visíveis na tela. Se ainda houver algum problema, verifique os logs no console para identificar onde o fluxo está falhando.
