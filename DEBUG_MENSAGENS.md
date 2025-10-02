# 🔍 DEBUG: Mensagens Não Aparecem

## 🚨 PROBLEMA IDENTIFICADO E CORRIGIDO

### **Mudanças Feitas:**

1. ✅ **Ordenação simplificada**: Voltou para `orderBy('timestamp')` em vez de `timestampCliente`
2. ✅ **Hook corrigido**: Removido uso incorreto de async/await
3. ✅ **SendMessage simplificado**: Removida transação complexa que pode falhar
4. ✅ **Tratamento de erros melhorado**: Fallback para mensagens não criptografadas

---

## 🔍 CHECKLIST DE DEBUG

### **Passo 1: Verificar Regras do Firestore**

1. Acesse: https://console.firebase.google.com
2. Vá em Firestore Database > Regras
3. Verifique se tem estas regras:

```javascript
match /conversas/{conversaId} {
  allow read, create, update: if request.auth != null && 
                                  request.auth.uid in resource.data.participantes;
  
  match /mensagens/{mensagemId} {
    allow read, create: if request.auth != null;
    allow update, delete: if request.auth != null && 
                             resource.data.remetenteId == request.auth.uid;
  }
}

match /usuarios/{userId} {
  allow read: if request.auth != null;
  allow update: if request.auth != null && request.auth.uid == userId;
}
```

4. Se não tem, adicione e publique

---

### **Passo 2: Verificar Console do Navegador**

1. Abra o app (F5 para recarregar)
2. Abra Console (F12)
3. Vá em "Mensagens"
4. Crie uma conversa
5. Envie uma mensagem: "Teste"

**Logs esperados ao ENVIAR:**
```
📤 Tentando enviar mensagem: {...}
🚀 Enviando mensagem para Firestore...
📨 sendMessage chamado: {...}
👥 Participantes: ["user1", "user2"]
🔐 Criptografando mensagem...
💾 Salvando mensagem no Firestore...
✅ Mensagem salva com ID: abc123
🔄 Última mensagem atualizada
📊 Contador atualizado
🎉 Mensagem enviada e criptografada!
✅ Mensagem enviada com sucesso!
```

**Logs esperados ao RECEBER (destinatário):**
```
👂 Escutando mensagens para conversa: xyz789
📨 Snapshot de mensagens recebido: 1
🔑 Chave de descriptografia gerada
🔓 Mensagem descriptografada
✅ Mensagens processadas: 1
📬 Mensagens recebidas no hook: 1
```

---

### **Passo 3: Verificar Firestore**

1. Abra Firebase Console
2. Vá em Firestore Database
3. Navegue: `conversas` > {id da conversa} > `mensagens`

**Deve ter:**
- ✅ Um documento com a mensagem
- ✅ Campo `texto` criptografado: "U2FsdGVkX1+..."
- ✅ Campo `remetenteId` com ID do remetente
- ✅ Campo `timestamp` com data/hora

**Se NÃO tem documento:**
- ❌ Mensagem não foi salva
- Veja logs: erro ao enviar?
- Veja regras: permissão negada?

---

### **Passo 4: Verificar Estrutura da Conversa**

1. No Firestore, abra: `conversas` > {id da conversa}
2. Verifique os campos:

```javascript
{
  tipo: "privada",
  participantes: ["user1", "user2"],  // ← Deve ter ambos os IDs
  participantesInfo: {
    user1: { ... },
    user2: { ... }
  },
  ultimaMensagem: {
    texto: "Teste",  // ← Deve atualizar
    timestamp: ...
  }
}
```

**Se `participantes` estiver errado:**
- ❌ Conversa mal criada
- Recrie a conversa

---

## 🐛 ERROS COMUNS E SOLUÇÕES

### **Erro 1: `Missing or insufficient permissions`**

**Console mostra:**
```
❌ FirebaseError: Missing or insufficient permissions
```

**Causa:** Regras do Firestore não aplicadas

**Solução:**
1. Aplicar regras do Passo 1
2. Aguardar 30 segundos
3. Recarregar página (F5)
4. Tentar novamente

---

### **Erro 2: `usuario is undefined`**

**Console mostra:**
```
⚠️ useMensagens: Usuário não está logado
❌ Usuário não está logado
```

**Causa:** Usuário não está autenticado

**Solução:**
1. Fazer logout
2. Fazer login novamente
3. Verificar localStorage:
   ```javascript
   // No console
   localStorage.getItem('usuario')
   ```
4. Se `null`, fazer login

---

### **Erro 3: Mensagem salva mas não aparece**

**Firestore tem mensagem, mas não aparece na tela**

**Debug:**

1. Verifique logs do destinatário:
   ```
   👂 Escutando mensagens para conversa
   📨 Snapshot de mensagens recebido: X
   ```

2. Se `X = 0` (nenhuma mensagem):
   - ❌ Listener não está pegando mensagens
   - Verifique se está na conversa certa
   - Verifique campo `conversaId` na mensagem

3. Se `X > 0` mas não aparece:
   - ❌ Erro ao processar mensagens
   - Veja se tem erro vermelho após "Snapshot recebido"
   - Pode ser erro de descriptografia

---

### **Erro 4: Texto aparece criptografado**

**Mensagem aparece como: `U2FsdGVkX1+...`**

**Causa:** Descriptografia falhou

**Debug:**

1. Verifique logs:
   ```
   🔑 Chave de descriptografia gerada  ← Deve ter
   🔓 Mensagem descriptografada       ← Deve ter
   ```

2. Se não tem "🔓":
   - ❌ Descriptografia não rodou
   - Verifique se `encrypted: true` no documento
   - Verifique se `currentUserId` está correto

3. Se tem "❌ Erro ao descriptografar":
   - Chave diferente do envio
   - Mensagem corrompida
   - Participantes da conversa mudaram

---

### **Erro 5: Listener não inicia**

**Console não mostra: "👂 Escutando mensagens"**

**Causa:** Hook não chamou `listenToMessages`

**Debug:**

1. Verifique se conversa foi selecionada:
   ```javascript
   // No console
   console.log('conversaAtiva:', conversaAtiva)
   ```

2. Se `null`:
   - ❌ Conversa não foi aberta
   - Clique na conversa para selecionar

3. Se tem conversa mas não escuta:
   - ❌ Erro no useEffect
   - Veja console: erro vermelho?

---

## 🧪 TESTE MANUAL COMPLETO

### **Teste 1: Criar Conversa e Enviar**

```
1. Usuário A faz login
2. Vai em "Mensagens"
3. Clica no "+" azul
4. Seleciona Usuário B
5. Conversa abre

Resultado esperado:
✅ Tela de chat aparece
✅ Input de mensagem visível
✅ Console mostra: "👂 Escutando mensagens"
```

### **Teste 2: Enviar Mensagem**

```
1. Usuário A digita: "Teste 123"
2. Clica em enviar (ou Enter)

Console deve mostrar:
✅ 📤 Tentando enviar mensagem
✅ 🚀 Enviando mensagem
✅ 🔐 Criptografando
✅ 💾 Salvando
✅ ✅ Mensagem salva
✅ 🎉 Enviada e criptografada

Tela deve mostrar:
✅ Bolha de mensagem do lado direito
✅ Texto: "Teste 123"
✅ Status: "enviada" ou ícone de check
```

### **Teste 3: Receber Mensagem**

```
1. Usuário B (destinatário) faz login
2. Vai em "Mensagens"
3. Vê lista de conversas
4. Clica na conversa com Usuário A

Console deve mostrar:
✅ 👂 Escutando mensagens
✅ 📨 Snapshot recebido: 1
✅ 🔑 Chave gerada
✅ 🔓 Descriptografada
✅ ✅ Mensagens processadas: 1

Tela deve mostrar:
✅ Bolha de mensagem do lado esquerdo
✅ Texto: "Teste 123"
✅ Nome/foto do Usuário A
```

---

## 📋 CHECKLIST DE CONFIGURAÇÃO

**Antes de testar:**

- [ ] Regras do Firestore publicadas
- [ ] Página recarregada (F5)
- [ ] Console aberto (F12)
- [ ] Dois usuários logados (para testar envio/recebimento)

**Estrutura no Firestore:**

- [ ] Coleção `conversas` existe
- [ ] Documentos de conversa têm campo `participantes`
- [ ] Subcoleção `mensagens` existe dentro de conversas
- [ ] Mensagens têm campos: `texto`, `remetenteId`, `timestamp`

**Código atualizado:**

- [ ] `src/services/mensagensService.js` atualizado
- [ ] `src/hooks/useMensagens.js` atualizado
- [ ] `src/services/cryptographyService.js` existe
- [ ] `crypto-js` instalado

---

## 🔧 COMANDOS DE DEBUG

### **Verificar se mensagem foi salva:**

```javascript
// No console do navegador (F12)

// 1. Obter ID da conversa atual
console.log('Conversa:', conversaAtiva?.id)

// 2. Ver no Firestore Console se tem mensagens
```

### **Verificar usuário logado:**

```javascript
// No console
console.log('Usuário:', localStorage.getItem('usuario'))

// Deve retornar JSON com id, nome, etc
// Se null, precisa fazer login
```

### **Forçar refresh do listener:**

```javascript
// No console
// Sair e entrar na conversa novamente
// Ou recarregar a página (F5)
```

### **Ver todas as conversas:**

```javascript
// Firebase Console > Firestore
// Navegar para: conversas
// Ver todos os documentos
// Verificar campo 'participantes' em cada um
```

---

## 🆘 SE NADA FUNCIONAR

### **Último Recurso: Reset Completo**

1. **Limpar dados locais:**
   ```javascript
   // No console (F12)
   localStorage.clear()
   sessionStorage.clear()
   ```

2. **Recarregar página:** F5

3. **Fazer login novamente**

4. **Criar NOVA conversa** (não usar conversa antiga)

5. **Enviar mensagem simples:** "teste"

6. **Verificar Firestore:** Mensagem deve aparecer

7. **Verificar regras:** Devem estar aplicadas

---

## 📊 LOGS COMPLETOS ESPERADOS

### **Envio completo (sucesso):**

```
📤 Tentando enviar mensagem: {conversaId: "abc", texto: "teste", ...}
🚀 Enviando mensagem para Firestore...
📨 sendMessage chamado: {conversaId: "abc", remetenteId: "user1", tipo: "texto"}
👥 Participantes: ["user1", "user2"]
🔐 Criptografando mensagem...
💾 Salvando mensagem no Firestore...
✅ Mensagem salva com ID: msg123
🔄 Última mensagem atualizada
📊 Contador atualizado
🎉 Mensagem enviada e criptografada!
✅ Mensagem enviada com sucesso!
```

### **Recebimento completo (sucesso):**

```
👂 Escutando mensagens para conversa: abc
📨 Snapshot de mensagens recebido: 1
🔑 Chave de descriptografia gerada
🔓 Mensagem descriptografada
✅ Mensagens processadas: 1
📬 Mensagens recebidas no hook: 1
```

---

## 🎯 RESULTADO ESPERADO

Após seguir todos os passos:

1. ✅ Mensagem é enviada pelo Usuário A
2. ✅ Aparece no Firestore (criptografada)
3. ✅ Aparece na tela do Usuário A (descriptografada)
4. ✅ Aparece na tela do Usuário B (descriptografada)
5. ✅ Contador de não lidas atualiza
6. ✅ Última mensagem atualiza na lista

---

## 📞 COMO REPORTAR PROBLEMA

Se ainda não funcionar, copie e me envie:

1. **Todos os logs do console** (F12 > Console > Copiar tudo)
2. **Screenshot do Firestore** (conversas e mensagens)
3. **Regras atuais** (Firestore > Regras > Copiar)
4. **Versão do navegador** (Chrome, Firefox, etc)
5. **Erros vermelhos** (se houver)

---

**🔍 Siga o checklist passo a passo e me avise onde parou!**
