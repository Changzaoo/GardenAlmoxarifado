# 🔍 DEBUG: Conversas Aparecem e Somem Rapidamente

## 🐛 Problema Relatado

Usuário **teste** possui **3 conversas** que:
1. ✅ Aparecem rapidamente na tela
2. ❌ Depois somem imediatamente
3. ❌ Fica mostrando "Nenhuma conversa ainda"

---

## 🎯 Logs Adicionados

Adicionei **5 pontos de monitoramento** ultra-detalhados:

### **1. Hook useMensagens - Criação do Listener**
```javascript
=================================================
CRIANDO LISTENER DE CONVERSAS para usuario: teste
=================================================
```

### **2. Hook useMensagens - Callback do Listener**
```javascript
=================================================
CALLBACK DE CONVERSAS EXECUTADO
Quantidade: 3
IDs das conversas: [conv1, conv2, conv3]
Conversas completas: [...]
Chamando setConversas com 3 conversas
Stack trace do callback
=================================================
```

### **3. Hook useMensagens - Monitor do Estado**
```javascript
###############################################
ESTADO CONVERSAS MUDOU!
Quantidade atual: 3 (ou 0 se sumiu!)
IDs: [...]
Stack trace da mudanca
###############################################
```

### **4. MensagensMain - Props do Hook**
```javascript
>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
MensagensMain - Conversas do hook MUDARAM
Quantidade: 3
IDs: [...]
Loading: false
>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
```

### **5. ListaConversas - Props Recebidas**
```javascript
***********************************************
ListaConversas - Props conversas MUDARAM
Quantidade recebida: 3
IDs: [...]
Loading: false
Stack trace
***********************************************
```

---

## 🧪 TESTE AGORA

### **Passo 1: Limpar Console**
1. Pressione **F12** para abrir DevTools
2. Clique no ícone **🚫** para limpar logs antigos
3. Deixe o console aberto e visível

### **Passo 2: Recarregar Página**
1. Pressione **F5** ou **Ctrl+R**
2. Entre na página de **Mensagens**
3. **NÃO faça mais nada** - apenas observe os logs

### **Passo 3: Copiar TODOS os Logs**
1. Quando as conversas sumirem, clique com o botão direito no console
2. Selecione **"Save as..."** ou copie TUDO
3. Me envie os logs completos aqui

---

## 🔍 O Que Estou Procurando

### **Cenário 1: Listener Funciona mas Estado é Resetado**

**Logs esperados:**
```
=================================================
CALLBACK DE CONVERSAS EXECUTADO
Quantidade: 3
=================================================
###############################################
ESTADO CONVERSAS MUDOU!
Quantidade atual: 3
###############################################
[Algum tempo depois...]
###############################################
ESTADO CONVERSAS MUDOU!
Quantidade atual: 0  ← AQUI! Estado foi para 0!
###############################################
```

**Significa:** Algo está chamando `setConversas([])` depois que os dados chegam.

---

### **Cenário 2: Listener é Chamado Múltiplas Vezes**

**Logs esperados:**
```
=================================================
CALLBACK DE CONVERSAS EXECUTADO
Quantidade: 3
=================================================
=================================================
CALLBACK DE CONVERSAS EXECUTADO  ← DE NOVO!
Quantidade: 0  ← Array vazio!
=================================================
```

**Significa:** O listener está sendo chamado novamente com array vazio.

---

### **Cenário 3: Hook Desmonta e Remonta**

**Logs esperados:**
```
=================================================
CRIANDO LISTENER DE CONVERSAS
=================================================
[Conversas chegam...]
Limpeza do useMensagens hook  ← Hook desmontou!
Desconectando listener de conversas
=================================================
CRIANDO LISTENER DE CONVERSAS  ← Hook remontou!
=================================================
```

**Significa:** O componente está desmontando e remontando, causando perda de estado.

---

### **Cenário 4: Props Não Chegam no ListaConversas**

**Logs esperados:**
```
>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
MensagensMain - Conversas do hook MUDARAM
Quantidade: 3  ← Hook tem 3 conversas
>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

***********************************************
ListaConversas - Props conversas MUDARAM
Quantidade recebida: 0  ← Mas chegam 0 no componente!
***********************************************
```

**Significa:** Props não estão sendo passadas corretamente.

---

## 📊 Análise dos Stack Traces

Os **stack traces** mostrarão **DE ONDE** cada função está sendo chamada.

**Exemplo de stack trace útil:**
```
Stack trace:
    at setConversas (useMensagens.js:67)
    at callback (useMensagens.js:63)
    at onSnapshot (firestore.js:123)
    at ... [resto do trace]
```

Isso me dirá exatamente qual código está causando o problema.

---

## 🎯 Informações Que Preciso

Por favor, me envie:

1. ✅ **TODOS os logs do console** desde o carregamento até as conversas sumirem
2. ✅ **Todos os stack traces** (não omita nada!)
3. ✅ Se possível, tire um **print/screenshot** do console
4. ✅ Diga **quanto tempo** as conversas ficam visíveis antes de sumir (1 segundo? menos?)

---

## 💡 Dicas

### **Preservar Logs**
No console, clique com botão direito → **"Preserve log"**
Isso manterá todos os logs mesmo se a página recarregar.

### **Filtrar Logs**
Se tiver muitos logs, filtre por:
- `CONVERSAS` - Ver apenas logs relacionados a conversas
- `ESTADO` - Ver mudanças de estado
- `CALLBACK` - Ver execuções de callbacks

### **Ver Stack Traces Completos**
Clique na **seta** ao lado de cada log que tem `console.trace()`
Isso expandirá o stack trace completo.

---

## 🚀 Próximos Passos

Após analisar os logs, vou:

1. ✅ Identificar **exatamente** onde o estado está sendo perdido
2. ✅ Identificar se há **loop** ou **re-render** infinito
3. ✅ Verificar se o **listener** está funcionando corretamente
4. ✅ Corrigir o problema na raiz

---

## 📝 Informações Adicionais Úteis

Se puder, responda também:

1. **Quantas conversas o usuário "teste" tem no Firestore?**
   - Abra Firebase Console → Firestore → conversas
   - Verifique quantos documentos existem onde `participantes` contém o ID do teste

2. **O problema acontece com outros usuários ou só com "teste"?**

3. **As conversas aparecem por quanto tempo?**
   - Menos de 1 segundo?
   - 1-2 segundos?
   - Mais que 2 segundos?

4. **Você consegue clicar em uma conversa antes dela sumir?**

---

**🔥 TESTE AGORA e me envie os logs completos!**

Com essas informações, vou descobrir exatamente o que está acontecendo e corrigir o problema definitivamente.
