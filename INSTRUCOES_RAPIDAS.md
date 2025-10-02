# 🚨 INSTRUÇÕES RÁPIDAS: Mensagens Não Aparecem

## 📋 Checklist Rápido (3 minutos)

### **1. Abra o Console (F12)**
- Pressione F12 no navegador
- Vá na aba "Console"
- Recarregue a página (F5)

---

### **2. Identifique o Problema**

#### **Se aparecer: "⚠️ Usuário não está logado"**
```javascript
// Execute no console:
let user = JSON.parse(localStorage.getItem('usuario'));
console.log('Usuário:', user);
console.log('Tem ID?', !!user?.id);
```

**Solução:**
```javascript
// Se não tem ID, adicione:
user.id = user.email || 'user_' + Date.now();
localStorage.setItem('usuario', JSON.stringify(user));
location.reload();
```

---

#### **Se aparecer: "❌ ERRO CRÍTICO: Usuário sem campo id"**

**Solução imediata:**
1. Faça **logout**
2. Faça **login** novamente
3. OU execute no console:
```javascript
let user = JSON.parse(localStorage.getItem('usuario'));
user.id = user.email;
localStorage.setItem('usuario', JSON.stringify(user));
location.reload();
```

---

#### **Se aparecer: "📦 Snapshot recebido: 0 conversas"**

**Solução:**
1. Não há conversas criadas ainda
2. Clique no botão **"+"** azul
3. Selecione um usuário
4. Envie uma mensagem

---

#### **Se aparecer: "Missing or insufficient permissions"**

**Solução:**
1. Abra Firebase Console: https://console.firebase.google.com
2. Vá em **Firestore Database** → **Regras**
3. Clique em **"Publicar"**
4. Aguarde 30 segundos
5. Recarregue a página

---

## 🛠️ Script de Diagnóstico Automático

Cole isso no console (F12) para diagnóstico completo:

```javascript
(function() {
  console.log('🔍 === DIAGNÓSTICO AUTOMÁTICO ===');
  
  // Verificar usuário
  const user = JSON.parse(localStorage.getItem('usuario'));
  console.log('1️⃣ Usuário:', user);
  
  if (!user) {
    console.error('❌ Nenhum usuário logado!');
    console.log('💡 Solução: Faça login');
    return;
  }
  
  if (!user.id) {
    console.error('❌ Usuário sem campo ID!');
    console.log('💡 Corrigindo automaticamente...');
    user.id = user.email || 'user_' + Date.now();
    localStorage.setItem('usuario', JSON.stringify(user));
    console.log('✅ ID adicionado:', user.id);
    console.log('🔄 Recarregue a página (F5)');
    return;
  }
  
  console.log('✅ Usuário OK');
  console.log('   ID:', user.id);
  console.log('   Nome:', user.nome);
  console.log('   Email:', user.email);
  console.log('');
  console.log('2️⃣ Aguarde os logs de conversas...');
  console.log('   Deve aparecer: "📦 Snapshot recebido: X conversas"');
  console.log('');
  console.log('🔍 === FIM DO DIAGNÓSTICO ===');
})();
```

---

## ✅ Logs Esperados (Quando Funciona)

```
✅ useMensagens: Inicializando para usuário: user@email.com
👤 Nome: Seu Nome
📧 Email: user@email.com
🔍 Buscando conversas para usuário: user@email.com
📦 Snapshot recebido: 3 conversas
📋 Conversas processadas: 3
📊 ListaConversas - Status: {loading: false, totalConversas: 3, ...}
```

---

## 🎯 Causas Mais Comuns (90% dos casos)

1. **Usuário sem campo `id`** → Execute o script de diagnóstico
2. **Nenhuma conversa criada** → Clique no "+" e crie uma
3. **Regras do Firestore** → Publique as regras no Firebase Console

---

## 📞 Ainda Não Funciona?

Copie e envie:
1. Todos os logs do console (F12)
2. Screenshot da página
3. Resultado de: `JSON.parse(localStorage.getItem('usuario'))`

---

**⏱️ Tempo estimado para resolver: 2-5 minutos**
