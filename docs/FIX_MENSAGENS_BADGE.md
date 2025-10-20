# Correção de Bugs nas Mensagens

## Data: 2025
## Desenvolvedor: GitHub Copilot

---

## 🐛 Problemas Identificados

### 1. Mensagens Novas Aparecendo como "Sem mensagens"
**Sintoma:** Quando uma nova mensagem era recebida, a lista de conversas mostrava "Sem mensagens" em vez do conteúdo real.

**Causa Raiz:** 
- O campo `ultimaMensagem` estava sendo salvo como objeto no Firestore com a estrutura:
  ```javascript
  ultimaMensagem: {
    texto: "conteúdo da mensagem",
    remetenteId: "...",
    timestamp: Date,
    timestampCliente: number
  }
  ```
- Mas no código do listener global (`setupGlobalMessageListeners`), estava sendo atualizado como string simples:
  ```javascript
  ultimaMensagem: novaMensagem.textoOriginal || novaMensagem.texto
  ```
- O componente `ListaConversas.jsx` esperava `conversa.ultimaMensagem?.texto`, que ficava undefined com a string direta.

### 2. Badge de Mensagens Não Lidas Não Desaparecia
**Sintoma:** Ao clicar em uma conversa com mensagens não lidas, o badge vermelho com o número de mensagens não desaparecia.

**Causa Raiz:**
- A função `selecionarConversa` zerava o contador localmente e no Firebase
- Mas quando o listener do Firestore (`listenToConversations`) recebia uma atualização, ele sobrescrevia o estado local
- O estado do Firebase podia demorar alguns segundos para sincronizar, então o badge voltava a aparecer

---

## ✅ Soluções Implementadas

### 1. Padronização do Formato de `ultimaMensagem`

**Arquivo:** `src/hooks/useMensagens.js`

**Mudanças:**

#### a) Listener Global (linha ~124)
```javascript
// ANTES
ultimaMensagem: novaMensagem.textoOriginal || novaMensagem.texto

// DEPOIS
ultimaMensagem: {
  texto: novaMensagem.texto,
  remetenteId: novaMensagem.remetenteId,
  timestamp: novaMensagem.timestampLocal || new Date(novaMensagem.timestampCliente || Date.now()),
  timestampCliente: novaMensagem.timestampCliente
}
```

#### b) Optimistic Update - Envio de Mensagem de Texto (linha ~709)
```javascript
// ANTES
ultimaMensagem: textoTrimmed.substring(0, 50)

// DEPOIS
ultimaMensagem: {
  texto: textoTrimmed.substring(0, 50),
  remetenteId: usuario.id,
  timestamp: agora,
  timestampCliente: agora.getTime()
}
```

#### c) Optimistic Update - Envio de Arquivo (linha ~792)
```javascript
// ANTES
ultimaMensagem: `${tipoEmoji} ${tipo}`

// DEPOIS
ultimaMensagem: {
  texto: `${tipoEmoji} ${tipo}`,
  remetenteId: usuario.id,
  timestamp: agora,
  timestampCliente: agora.getTime()
}
```

### 2. Preservação do Estado Local do Badge

**Arquivo:** `src/hooks/useMensagens.js`

**Mudança no Callback do Listener (linha ~460):**

```javascript
// ANTES
setConversas(conversasFiltradas);
setLoading(false);
atualizarTotalNaoLidas(conversasFiltradas);

// DEPOIS
// ⚡ PRESERVAR estado local do badge se conversa está ativa
setConversas(prevConversas => {
  return conversasFiltradas.map(conversa => {
    // Se esta conversa está ativa, manter naoLidas = 0
    if (conversaAtivaRef.current?.id === conversa.id) {
      return { ...conversa, naoLidas: 0 };
    }
    return conversa;
  });
});

setLoading(false);

// Calcular total de não lidas considerando conversa ativa
const conversasComBadgeCorrigido = conversasFiltradas.map(c => 
  c.id === conversaAtivaRef.current?.id ? { ...c, naoLidas: 0 } : c
);
atualizarTotalNaoLidas(conversasComBadgeCorrigido);
```

### 3. Limpeza de Código

Removidos `console.trace()` que eram apenas para debug:
- Linha ~460: `console.trace('Stack trace do callback')`
- Linha ~534: `console.trace('Stack trace da mudanca')`
- Linha ~560: `console.trace('Stack trace da chamada:')`

---

## 🔍 Como Funciona Agora

### Fluxo de Mensagem Nova:

1. **Usuário A envia mensagem para Usuário B**
   - `sendMessage()` do service salva no Firestore
   - Campo `ultimaMensagem` é salvo como objeto no documento da conversa

2. **Listener Global detecta nova mensagem**
   - `setupGlobalMessageListeners` recebe a mensagem
   - Atualiza o estado local com objeto `ultimaMensagem` completo
   - Incrementa contador `naoLidas` (se não estiver na conversa ativa)

3. **Listener de Conversas recebe update do Firestore**
   - `listenToConversations` callback é chamado
   - Verifica se conversa está ativa (`conversaAtivaRef.current`)
   - Se estiver ativa, força `naoLidas = 0` no estado local
   - Previne que o Firebase sobrescreva o badge zerado

4. **Componente renderiza corretamente**
   - `ListaConversas.jsx` acessa `conversa.ultimaMensagem?.texto`
   - Mostra o conteúdo real da mensagem
   - Badge reflete o estado correto

### Fluxo de Abertura de Conversa:

1. **Usuário clica em conversa com badge**
   - `selecionarConversa()` é chamado
   - Zera `naoLidas` no estado local imediatamente (UX instantâneo)
   - Chama `clearUnreadCount()` no Firebase (background)
   - Chama `marcarNotificacoesComoLidas()`

2. **Firebase recebe a atualização**
   - Listener detecta mudança no documento da conversa
   - Callback de `listenToConversations` é executado

3. **Estado local é preservado**
   - Como `conversaAtivaRef.current.id === conversa.id`
   - O map força `naoLidas: 0` mesmo que Firebase tenha valor diferente
   - Badge permanece zerado

---

## 🎯 Estrutura de Dados Final

### Objeto Conversa:
```javascript
{
  id: "conversa123",
  participantes: ["user1", "user2"],
  tipo: "PRIVADA",
  nome: "Jonathan",
  photoURL: "https://...",
  ultimaMensagem: {
    texto: "o pai do teu fi rapaz",
    remetenteId: "user2",
    timestamp: Date(2025, 0, 1, 14, 30),
    timestampCliente: 1735747800000
  },
  atualizadaEm: Date(2025, 0, 1, 14, 30),
  naoLidas: 0, // ou número > 0
  arquivado: false,
  silenciado: false,
  fixado: false
}
```

### Componente ListaConversas:
```jsx
<p>
  {conversa.ultimaMensagem?.texto || 'Sem mensagens'}
</p>
```

---

## 🧪 Testes Recomendados

1. **Teste de Mensagem Nova:**
   - Envie mensagem de outro usuário
   - Verifique se aparece na lista
   - Verifique se o conteúdo está correto (não "Sem mensagens")
   - Verifique se badge aparece com número correto

2. **Teste de Limpeza de Badge:**
   - Deixe mensagens não lidas acumularem
   - Clique na conversa
   - Verifique se badge desaparece imediatamente
   - Aguarde 5 segundos (sync do Firebase)
   - Verifique se badge continua zerado

3. **Teste de Tipos de Mensagem:**
   - Envie mensagem de texto
   - Envie imagem (deve aparecer "🖼️ IMAGEM")
   - Envie áudio (deve aparecer "🎵 AUDIO")
   - Todos devem aparecer corretamente na lista

4. **Teste Multi-conversa:**
   - Abra conversa A
   - Receba mensagem na conversa B
   - Verifique que badge aparece em B
   - Verifique que badge NÃO aparece em A (se mensagem for sua)

---

## 📚 Arquivos Modificados

1. **src/hooks/useMensagens.js**
   - Padronização de `ultimaMensagem` em 3 locais
   - Preservação de estado do badge no listener
   - Remoção de console.trace

2. **src/components/Mensagens/ListaConversas.jsx**
   - Nenhuma mudança necessária (já estava correto)

3. **src/services/mensagensService.js**
   - Nenhuma mudança necessária (já estava correto)

---

## 🎉 Resultado

✅ Mensagens novas aparecem com conteúdo correto  
✅ Badge desaparece instantaneamente ao abrir conversa  
✅ Badge permanece zerado mesmo após sync do Firebase  
✅ Badge no menu desaparece ao entrar na aba de mensagens  
✅ Código mais limpo (sem console.trace)  
✅ Estrutura de dados consistente em todo o app  

---

## 🆕 Correção Adicional: Badge no Menu (20/10/2025)

### Problema:
O badge de mensagens não lidas permanecia visível no menu mesmo quando o usuário estava na aba de mensagens.

### Causa:
O componente `MessagesBadge` estava sendo renderizado sem verificar se a aba estava ativa. O badge só some quando `count === 0`, mas o `totalNaoLidas` pode ter valor > 0 mesmo quando o usuário está vendo as mensagens.

### Solução:
Adicionei verificação para ocultar o badge quando a aba correspondente está ativa:

**Arquivo:** `src/components/Workflow.jsx`

**Mudança - Menu Mobile (linha ~3382):**
```jsx
// ANTES
{aba.id === 'mensagens' && (
  <MessagesBadge count={mensagensNaoLidas} size="sm" max={99} />
)}

// DEPOIS
{aba.id === 'mensagens' && abaAtiva !== 'mensagens' && (
  <MessagesBadge count={mensagensNaoLidas} size="sm" max={99} />
)}
```

**Mudança - Menu Desktop (linha ~3542):**
```jsx
// ANTES
{aba.id === 'mensagens' && (
  <MessagesBadge count={mensagensNaoLidas} size="md" max={99} />
)}

// DEPOIS
{aba.id === 'mensagens' && abaAtiva !== 'mensagens' && (
  <MessagesBadge count={mensagensNaoLidas} size="md" max={99} />
)}
```

**Nota:** A mesma correção foi aplicada para o badge de notificações para manter consistência.

### Resultado:
✅ Badge desaparece instantaneamente ao clicar na aba de mensagens  
✅ Badge volta a aparecer ao sair da aba se houver mensagens não lidas  
✅ Comportamento consistente entre mobile e desktop  
✅ Mesma lógica aplicada para notificações  

---

## 🔗 Documentos Relacionados

- `CHAT_HEADS_FLUTUANTES.md` - Sistema de chat heads flutuantes
- `SISTEMA_AUTENTICACAO_QRCODE.md` - Sistema de autenticação
- `AUTO_UPDATE_SYSTEM.md` - Sistema de atualização automática
