# 🔧 CORREÇÃO: Mensagens Aparecem e Somem Rapidamente

## 🐛 Problema Identificado

**Sintoma:** Mensagens aparecem por uma fração de segundo e depois desaparecem imediatamente.

**Causa Raiz:** **Loop infinito de re-renderização** causado por dependência circular no `useCallback`.

---

## 📊 Como o Loop Acontecia

### **Fluxo do Bug:**

```javascript
// Passo 1: selecionarConversa é definido com dependências
const selecionarConversa = useCallback((conversa) => {
  setConversaAtiva(conversa); // ← Muda conversaAtiva
  // ...
}, [usuario?.id, conversaAtiva]); // ← conversaAtiva está aqui!

// Passo 2: Usuario seleciona conversa
selecionarConversa(conversa1);

// Passo 3: Estado muda
// conversaAtiva = conversa1

// Passo 4: useCallback recria a função (porque conversaAtiva mudou!)
// selecionarConversa = nova função

// Passo 5: Componentes que usam selecionarConversa re-renderizam

// Passo 6: Se algo dispara selecionarConversa novamente...
// → VOLTA AO PASSO 2 → LOOP INFINITO! 🔁
```

### **Consequência:**

1. ✅ `setMensagens([])` limpa mensagens
2. ✅ Listener traz mensagens → mensagens aparecem
3. ❌ Loop reinicia → `setMensagens([])` é chamado novamente
4. ❌ Mensagens somem
5. 🔁 Repete infinitamente

---

## ✅ Solução Aplicada

### **Usar `ref` em vez de dependência**

**ANTES (com bug):**
```javascript
const selecionarConversa = useCallback((conversa) => {
  // Usa conversaAtiva diretamente
  if (conversaAtiva?.id === conversa.id) return;
  
  setConversaAtiva(conversa);
  // ...
}, [usuario?.id, conversaAtiva]); // ← BUG: conversaAtiva cria loop!
```

**DEPOIS (corrigido):**
```javascript
// 1. Criar ref para armazenar conversaAtiva
const conversaAtivaRef = useRef(null);

// 2. Sincronizar ref com estado
useEffect(() => {
  conversaAtivaRef.current = conversaAtiva;
}, [conversaAtiva]);

// 3. Usar ref no useCallback
const selecionarConversa = useCallback((conversa) => {
  // Usa ref em vez do estado diretamente
  if (conversaAtivaRef.current?.id === conversa.id) return;
  
  conversaAtivaRef.current = conversa; // Atualiza ref imediatamente
  setConversaAtiva(conversa);          // Atualiza estado
  // ...
}, [usuario?.id]); // ← CORRIGIDO: Sem conversaAtiva!
```

---

## 🎯 Por Que Isso Funciona?

### **Refs vs Estado:**

| Característica | useState | useRef |
|---------------|----------|--------|
| Causa re-render ao mudar | ✅ Sim | ❌ Não |
| Persiste entre renders | ✅ Sim | ✅ Sim |
| Recria useCallback ao mudar | ✅ Sim | ❌ Não |
| Valor sempre atual | ⚠️ Pode ser stale | ✅ Sempre atual |

### **Como Funciona Agora:**

1. ✅ `conversaAtivaRef` guarda o valor atual sem causar re-render
2. ✅ `useCallback` não é recriado quando conversa muda
3. ✅ Verificação `if (conversaAtivaRef.current?.id === conversa.id)` funciona corretamente
4. ✅ Sem loop infinito!

---

## 📝 Mudanças no Código

### **Arquivo: `src/hooks/useMensagens.js`**

**Mudança 1: Adicionar ref**
```javascript
const unsubscribeConversas = useRef(null);
const unsubscribeMensagens = useRef(null);
const typingTimeoutRef = useRef(null);
const conversaAtivaRef = useRef(null); // ← NOVO: Ref para evitar loop
```

**Mudança 2: Sincronizar ref com estado**
```javascript
// Sincronizar ref com estado
useEffect(() => {
  conversaAtivaRef.current = conversaAtiva;
}, [conversaAtiva]);
```

**Mudança 3: Usar ref em selecionarConversa**
```javascript
const selecionarConversa = useCallback((conversa) => {
  console.log('📂 Selecionando conversa:', conversa.id);
  console.log('📊 Conversa ativa atual:', conversaAtivaRef.current?.id); // ← Usa ref
  
  // Se for a mesma conversa, não fazer nada
  if (conversaAtivaRef.current?.id === conversa.id) { // ← Usa ref
    console.log('⏭️ Mesma conversa já está ativa, ignorando');
    return;
  }
  
  // ... resto do código ...
  
  // Atualizar ref antes de atualizar estado
  conversaAtivaRef.current = conversa; // ← Atualiza ref imediatamente
  setConversaAtiva(conversa);
  
  // ... resto do código ...
}, [usuario?.id]); // ← REMOVIDO conversaAtiva das dependências!
```

---

## 🧪 Como Testar

### **Teste 1: Mensagens Permanecem Visíveis**

1. Abra uma conversa
2. Aguarde mensagens carregarem
3. **Verifique:** Mensagens devem **permanecer** visíveis
4. **Não deve:** Aparecer e sumir rapidamente

### **Teste 2: Logs no Console**

Abra console (F12) e veja os logs:

**ANTES (com bug):**
```
📂 Selecionando conversa: abc123
🧹 Array de mensagens limpo
🎧 Iniciando listener
📬 Mensagens recebidas: 5
💾 Atualizando estado
📂 Selecionando conversa: abc123  ← Loop!
🧹 Array de mensagens limpo      ← Loop!
🎧 Iniciando listener            ← Loop!
[Repete infinitamente...]
```

**DEPOIS (corrigido):**
```
📂 Selecionando conversa: abc123
📊 Conversa ativa atual: undefined
🧹 Array de mensagens limpo
🎧 Iniciando listener
📬 Mensagens recebidas: 5
💾 Atualizando estado
[Para aqui - sem loop! ✅]
```

### **Teste 3: Trocar de Conversa**

1. Selecione conversa A
2. Mensagens aparecem
3. Selecione conversa B
4. Mensagens de B aparecem
5. **Verifique:** Sem flicker, transição suave

### **Teste 4: Clicar na Mesma Conversa**

1. Selecione uma conversa
2. Clique na mesma conversa novamente
3. **Console deve mostrar:**
   ```
   📂 Selecionando conversa: abc123
   📊 Conversa ativa atual: abc123
   ⏭️ Mesma conversa já está ativa, ignorando
   ```
4. **Verifique:** Mensagens não são recarregadas

---

## 🎯 Benefícios da Correção

### **1. Performance** ✅
- Sem loops infinitos
- Menos re-renders desnecessários
- Listener não é recriado toda hora

### **2. UX Melhorado** ✅
- Mensagens permanecem visíveis
- Transição suave entre conversas
- Sem flicker ou "piscar" na tela

### **3. Debug Facilitado** ✅
- Logs claros mostram o que está acontecendo
- Fácil identificar se há problemas

### **4. Código Mais Robusto** ✅
- Previne bugs futuros de dependências circulares
- Pattern recomendado pela documentação do React

---

## 📚 Conceitos Aprendidos

### **Problema Clássico: Dependências Circulares**

```javascript
// ❌ NÃO FAZER:
const funcao = useCallback(() => {
  setState(novoValor);
}, [state]); // ← Circular: função depende do estado que ela muda!

// ✅ FAZER:
const stateRef = useRef(state);
useEffect(() => { stateRef.current = state; }, [state]);

const funcao = useCallback(() => {
  // Usa ref em vez de estado
  if (stateRef.current === algo) return;
  setState(novoValor);
}, []); // ← Sem dependências circulares!
```

### **Quando Usar Refs:**

Use `useRef` quando você precisa:
1. ✅ Valor que persiste entre renders
2. ✅ Não causa re-render ao mudar
3. ✅ Evitar dependências circulares em `useCallback`/`useEffect`
4. ✅ Armazenar valores mutáveis (timers, subscriptions, etc)

---

## 🔍 Diagnóstico de Problemas Similares

### **Como Identificar Loop Infinito:**

1. **Console mostra logs repetindo infinitamente**
2. **Navegador fica lento ou trava**
3. **Mensagens/dados aparecem e somem rapidamente**
4. **DevTools React mostra muitos re-renders**

### **Como Corrigir:**

1. **Identifique o useCallback/useEffect problemático**
2. **Veja quais dependências estão no array**
3. **Identifique dependências circulares** (estado que é mudado dentro da função)
4. **Use ref para quebrar o ciclo**

---

## 📊 Comparação Técnica

### **ANTES:**
```javascript
// Fluxo problemático:
selecionarConversa() 
  → setConversaAtiva() 
  → conversaAtiva muda 
  → selecionarConversa recriado (dependência!) 
  → Componentes re-renderizam 
  → Volta ao início 
  → LOOP INFINITO
```

### **DEPOIS:**
```javascript
// Fluxo corrigido:
selecionarConversa() 
  → conversaAtivaRef.current = conversa 
  → setConversaAtiva() 
  → conversaAtiva muda 
  → ref sincroniza no próximo render
  → selecionarConversa NÃO é recriado (sem dependência!)
  → FIM (sem loop)
```

---

## ✅ Checklist de Verificação

Após a correção, verifique:

- [ ] Mensagens aparecem e **permanecem** visíveis
- [ ] Sem logs repetindo no console
- [ ] Navegador não fica lento
- [ ] Trocar de conversa funciona suavemente
- [ ] Clicar na mesma conversa não recarrega mensagens
- [ ] Log "⏭️ Mesma conversa já está ativa" aparece quando aplicável

---

**🎉 Correção aplicada com sucesso!**

O problema de loop infinito foi resolvido usando `useRef` para quebrar a dependência circular. Agora as mensagens devem aparecer e permanecer visíveis indefinidamente, sem flicker ou desaparecimento.

**Teste agora e veja a diferença!** 🚀
