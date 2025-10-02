# 🔧 CORREÇÃO APLICADA: Segunda Instância do Hook Removida

## 🐛 Problema Encontrado

**Causa Raiz:** O componente `ListaConversas` estava chamando `useMensagens()` **novamente**, criando uma **segunda instância do hook**!

### Como Isso Causava o Bug:

```
MensagensMain
  └─ useMensagens() [INSTÂNCIA 1]
      └─ ListaConversas
          └─ useMensagens() [INSTÂNCIA 2] ❌ DUPLICADO!
```

**Resultado:** Duas instâncias do hook = Dois listeners = Conflito de estados = Mensagens aparecem e somem!

---

## ✅ Solução Aplicada

### **ANTES (com bug):**

**ListaConversas.jsx:**
```jsx
import { useMensagens } from '../../hooks/useMensagens';

const ListaConversas = ({ onSelectConversa, conversaSelecionada, onNovaConversa }) => {
  const { conversas, loading, formatarTimestamp } = useMensagens(); // ❌ Segunda instância!
  // ...
}
```

### **DEPOIS (corrigido):**

**ListaConversas.jsx:**
```jsx
// ✅ SEM import do useMensagens!

const ListaConversas = ({ 
  onSelectConversa, 
  conversaSelecionada, 
  onNovaConversa,
  conversas = [],          // ✅ Recebe via props
  loading = false,         // ✅ Recebe via props
  formatarTimestamp = () => '' // ✅ Recebe via props
}) => {
  // Agora NÃO chama useMensagens()!
}
```

**MensagensMain.jsx:**
```jsx
const MensagensMain = () => {
  const hookMensagens = useMensagens(); // ✅ ÚNICA instância!
  const { 
    conversaAtiva,
    conversas,          // ✅ Extraído do hook
    loading,            // ✅ Extraído do hook
    formatarTimestamp,  // ✅ Extraído do hook
    // ... resto das props
  } = hookMensagens;

  return (
    // ...
    <ListaConversas
      onSelectConversa={handleSelectConversa}
      conversaSelecionada={conversaAtiva}
      onNovaConversa={() => setShowNovaConversa(true)}
      conversas={conversas}           // ✅ Passando via props
      loading={loading}               // ✅ Passando via props
      formatarTimestamp={formatarTimestamp} // ✅ Passando via props
    />
    // ...
  );
};
```

---

## 🎯 Resultado

### **Estrutura ANTES (errada):**
```
MensagensMain
├─ useMensagens() [INSTÂNCIA 1]
│   ├─ listener conversas
│   └─ listener mensagens
│
└─ ListaConversas
    └─ useMensagens() [INSTÂNCIA 2] ❌
        ├─ listener conversas (DUPLICADO!)
        └─ listener mensagens (DUPLICADO!)
```

### **Estrutura DEPOIS (correta):**
```
MensagensMain
├─ useMensagens() [ÚNICA INSTÂNCIA] ✅
│   ├─ listener conversas
│   └─ listener mensagens
│
└─ ListaConversas (recebe props) ✅
    └─ Sem hook, sem listeners!
```

---

## 🔍 Logs Adicionados para Debug

Adicionei **logs detalhados** em 5 pontos críticos:

### 1. **MensagensMain.handleSelectConversa**
```javascript
const handleSelectConversa = (conversa) => {
  console.log('🖱️ MensagensMain.handleSelectConversa chamado');
  console.trace('📍 Stack trace');
  selecionarConversa(conversa);
  setShowChat(true);
};
```

### 2. **useMensagens.selecionarConversa**
```javascript
const selecionarConversa = useCallback((conversa) => {
  console.log('═══════════════════════════════════════════════');
  console.log('📂 selecionarConversa CHAMADO');
  console.log('🆔 Conversa solicitada:', conversa.id);
  console.log('📊 Conversa ativa no ref:', conversaAtivaRef.current?.id);
  console.log('📊 Conversa ativa no state:', conversaAtiva?.id);
  console.trace('📍 Stack trace');
  // ...
}, [usuario?.id]);
```

### 3. **Callback do Listener**
```javascript
unsubscribeMensagens.current = mensagensService.listenToMessages(
  conversa.id,
  usuario.id,
  LIMITS.MESSAGES_PER_PAGE,
  (novasMensagens) => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📬 CALLBACK DO LISTENER EXECUTADO');
    console.log('🆔 Para conversa:', conversa.id);
    console.log('📊 Quantidade de mensagens:', novasMensagens.length);
    console.log('📝 IDs das mensagens:', novasMensagens.map(m => m.id));
    console.log('💾 Chamando setMensagens');
    // ...
  }
);
```

### 4. **JanelaChat useEffect**
```javascript
useEffect(() => {
  console.log('🪟 JanelaChat - Mensagens recebidas via props:', mensagens.length);
  console.log('🆔 IDs das mensagens:', mensagens.map(m => m.id));
  scrollToBottom();
}, [mensagens]);
```

### 5. **Stack Traces**
Adicionados `console.trace()` para rastrear DE ONDE as funções estão sendo chamadas.

---

## 🧪 Como Verificar Se Funcionou

1. **Recarregue a página** (F5)
2. **Abra o console** (F12)
3. **Clique em uma conversa**

**Você DEVE ver:**
```
[Um único fluxo de logs]
🖱️ MensagensMain.handleSelectConversa
📂 selecionarConversa CHAMADO
✅ Conversa diferente, procedendo...
🎧 Criando listener
📬 CALLBACK DO LISTENER EXECUTADO
📊 Quantidade: [número]
🪟 JanelaChat - Mensagens recebidas: [número]
[FIM - sem repetir]
```

**Você NÃO deve ver:**
- ❌ Logs repetindo infinitamente
- ❌ Múltiplas chamadas de `selecionarConversa`
- ❌ `setMensagens([])` sendo chamado após mensagens chegarem
- ❌ Mensagens sumindo da tela

---

## 📊 Mudanças nos Arquivos

### **Arquivos Modificados:**

1. ✅ `src/components/mensagens/ListaConversas.jsx`
   - Removido `import { useMensagens }`
   - Adicionado parâmetros `conversas`, `loading`, `formatarTimestamp` nas props
   - Agora recebe tudo via props

2. ✅ `src/components/mensagens/MensagensMain.jsx`
   - Extraído `conversas`, `loading`, `formatarTimestamp` do hook
   - Passando essas props para `ListaConversas`
   - Adicionado log com stack trace em `handleSelectConversa`

3. ✅ `src/hooks/useMensagens.js`
   - Adicionado logs detalhados em `selecionarConversa`
   - Adicionado logs no callback do listener
   - Adicionado stack traces

4. ✅ `src/components/mensagens/JanelaChat.jsx`
   - Adicionado log no useEffect que recebe mensagens

### **Documentos Criados:**

1. 📄 `DEBUG_LOGS_DETALHADOS.md` - Guia completo de como testar e interpretar os logs

---

## 🎯 Por Que Isso Deve Funcionar

### **Problema Anterior:**
- Duas instâncias do hook = Dois conjuntos de listeners
- Quando uma instância atualizava o estado, a outra também tentava
- Conflito de estados causava mensagens aparecerem e sumirem

### **Solução Atual:**
- ✅ **UMA ÚNICA instância** do hook em `MensagensMain`
- ✅ **UM ÚNICO conjunto** de listeners
- ✅ Estado gerenciado **centralizadamente**
- ✅ Props passadas de cima para baixo (padrão React)

### **Pattern Aplicado:**
```
CONTAINER COMPONENT (MensagensMain)
  └─ Tem o hook
  └─ Tem o estado
  └─ Tem os listeners
  └─ Passa tudo via props ↓
      
PRESENTATIONAL COMPONENTS
  └─ ListaConversas (recebe props)
  └─ JanelaChat (recebe props)
  └─ Apenas renderizam UI
```

---

## 📚 Conceitos Aplicados

### **1. Single Source of Truth**
Um único lugar detém o estado verdadeiro (MensagensMain).

### **2. Props Drilling**
Estado passa de pai para filho via props.

### **3. Separation of Concerns**
- Container: Lógica e estado
- Presentational: Apenas UI

### **4. Hook Instance Management**
Hooks devem ser chamados apenas UMA VEZ na árvore de componentes para o mesmo contexto.

---

**🚀 Teste agora e veja os logs detalhados no console!**

Se o problema persistir, os logs mostrarão **exatamente** onde está o erro.
