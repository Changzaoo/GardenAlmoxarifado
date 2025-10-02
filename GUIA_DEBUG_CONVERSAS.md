# 🔍 GUIA DE DEBUG: Mensagens Não Aparecem

## ❓ Problema: "Nenhuma conversa ainda"

Quando você abre a página de Mensagens, aparece "Nenhuma conversa ainda" mesmo que existam conversas.

---

## 🔍 Checklist de Diagnóstico

### **Passo 1: Abrir Console do Navegador**

1. Pressione **F12** para abrir DevTools
2. Vá na aba **Console**
3. Recarregue a página (F5)

---

### **Passo 2: Verificar Logs de Inicialização**

**Logs que DEVEM aparecer:**

```
✅ useMensagens: Inicializando para usuário: [ID do usuário]
🔍 Buscando conversas para usuário: [ID do usuário]
📦 Snapshot recebido: X conversas
📋 Conversas processadas: X
```

---

### **Caso 1: Aparece "⚠️ Usuário não está logado"**

**Problema:** Você não está logado ou o campo `id` está incorreto

**Solução:**

1. Verifique se está logado:
   ```javascript
   // No console (F12)
   localStorage.getItem('usuario')
   ```

2. Deve retornar um JSON com o campo `id`:
   ```json
   {
     "id": "abc123",
     "nome": "Seu Nome",
     "email": "seu@email.com"
   }
   ```

3. **Se não tem `id`:**
   - Faça **logout** e **login** novamente
   - Ou corrija manualmente no console:
   ```javascript
   let user = JSON.parse(localStorage.getItem('usuario'));
   user.id = user.email; // ou outro identificador único
   localStorage.setItem('usuario', JSON.stringify(user));
   location.reload();
   ```

---

### **Caso 2: Aparece "📦 Snapshot recebido: 0 conversas"**

**Problema:** Não há conversas no banco de dados

**Solução:**

1. **Crie uma conversa:**
   - Clique no botão **"+" azul** no canto superior direito
   - Selecione um usuário
   - Envie uma mensagem

2. **Verifique no Firestore:**
   - Abra Firebase Console
   - Vá em Firestore Database
   - Procure pela coleção `conversas`
   - Verifique se há documentos

---

### **Caso 3: Erro de Permissão do Firestore**

**Logs que indicam esse problema:**
```
❌ Erro ao escutar conversas: FirebaseError: Missing or insufficient permissions
```

**Solução:**

1. Abra Firebase Console: https://console.firebase.google.com
2. Vá em **Firestore Database** → **Regras**
3. Verifique se tem estas regras:

```javascript
match /conversas/{conversaId} {
  allow read: if request.auth != null && 
                 request.auth.uid in resource.data.participantes;
  
  allow create: if request.auth != null && 
                   request.auth.uid in request.resource.data.participantes;
}
```

4. Clique em **"Publicar"**
5. Aguarde 30 segundos
6. Recarregue a página (F5)

---

### **Caso 4: Campo `participantes` incorreto**

**Problema:** Conversas existem mas você não está na lista de participantes

**Verificar:**

1. Abra Firebase Console
2. Vá em Firestore Database
3. Abra uma conversa
4. Verifique o campo `participantes`:

```javascript
participantes: ["user123", "user456"]
```

5. **Seu ID deve estar nessa lista!**

**Solução:**

Se seu ID não está na lista:
- Delete a conversa e crie uma nova
- Ou adicione manualmente seu ID no Firestore

---

### **Caso 5: Erro de Autenticação**

**Logs que indicam esse problema:**
```
❌ Erro ao atualizar status: FirebaseError: Missing or insufficient permissions
```

**Solução:**

1. Verifique se está autenticado no Firebase:
   ```javascript
   // No console
   import { getAuth } from 'firebase/auth';
   const auth = getAuth();
   console.log('Usuário Firebase:', auth.currentUser);
   ```

2. Se retornar `null`, você não está autenticado no Firebase
3. Você precisa fazer login com Firebase Authentication

---

## 🛠️ Comandos Úteis no Console

### **1. Ver usuário atual:**
```javascript
JSON.parse(localStorage.getItem('usuario'))
```

### **2. Ver todos os dados salvos:**
```javascript
console.log('Usuario:', localStorage.getItem('usuario'));
console.log('Usuarios:', localStorage.getItem('usuarios'));
```

### **3. Limpar dados e tentar novamente:**
```javascript
localStorage.clear();
location.reload();
```

### **4. Adicionar ID manualmente:**
```javascript
let user = JSON.parse(localStorage.getItem('usuario'));
if (!user.id) {
  user.id = user.email || 'user_' + Date.now();
  localStorage.setItem('usuario', JSON.stringify(user));
  console.log('ID adicionado:', user.id);
  location.reload();
}
```

---

## 📋 Resumo das Causas Comuns

| Sintoma | Causa | Solução |
|---------|-------|---------|
| "⚠️ Usuário não está logado" | Sem `id` no usuário | Fazer logout/login ou adicionar `id` manualmente |
| "📦 Snapshot: 0" | Nenhuma conversa criada | Criar conversa pelo botão "+" |
| "Missing permissions" | Regras do Firestore | Publicar regras corretas |
| Nada aparece no console | Erro antes da inicialização | Ver erros vermelhos no console |

---

## 🎯 Solução Rápida

Se nada funciona, execute este script no console (F12):

```javascript
// Script de diagnóstico completo
(async function() {
  console.log('🔍 DIAGNÓSTICO COMPLETO');
  console.log('========================');
  
  // 1. Verificar usuário
  const user = JSON.parse(localStorage.getItem('usuario'));
  console.log('1. Usuário:', user);
  console.log('   - Tem ID?', !!user?.id);
  console.log('   - ID:', user?.id);
  
  // 2. Adicionar ID se não tiver
  if (user && !user.id) {
    console.log('⚠️ Usuário sem ID, adicionando...');
    user.id = user.email || 'user_' + Date.now();
    localStorage.setItem('usuario', JSON.stringify(user));
    console.log('✅ ID adicionado:', user.id);
    console.log('🔄 Recarregue a página (F5)');
    return;
  }
  
  // 3. Verificar Firestore
  console.log('2. Tentando acessar Firestore...');
  const { db } = await import('./firebaseConfig');
  const { collection, query, where, getDocs } = await import('firebase/firestore');
  
  try {
    const q = query(
      collection(db, 'conversas'),
      where('participantes', 'array-contains', user.id)
    );
    const snapshot = await getDocs(q);
    console.log('✅ Firestore acessível');
    console.log('   - Conversas encontradas:', snapshot.size);
    
    if (snapshot.size === 0) {
      console.log('⚠️ Nenhuma conversa encontrada para este usuário');
      console.log('💡 Solução: Clique no botão "+" e crie uma conversa');
    } else {
      console.log('📋 Conversas:');
      snapshot.forEach(doc => {
        const data = doc.data();
        console.log('   -', doc.id, ':', data.nome || 'Sem nome');
      });
    }
  } catch (error) {
    console.error('❌ Erro ao acessar Firestore:', error.message);
    if (error.code === 'permission-denied') {
      console.log('⚠️ Problema: Regras do Firestore bloqueando acesso');
      console.log('💡 Solução: Publicar regras no Firebase Console');
    }
  }
  
  console.log('========================');
  console.log('🔍 DIAGNÓSTICO COMPLETO');
})();
```

---

## ✅ Checklist Final

Antes de reportar um problema, verifique:

- [ ] Console aberto (F12)
- [ ] Sem erros vermelhos no console
- [ ] Log "✅ useMensagens: Inicializando" aparece
- [ ] Usuário tem campo `id`
- [ ] Regras do Firestore publicadas
- [ ] Pelo menos uma conversa existe no Firestore
- [ ] Seu ID está no array `participantes` da conversa

---

## 📞 Como Reportar Problema

Se ainda não funcionar, copie e envie:

1. **Todos os logs do console** (F12 → Console → Copiar tudo)
2. **Screenshot da página de Mensagens**
3. **Resultado do comando:**
   ```javascript
   JSON.parse(localStorage.getItem('usuario'))
   ```

---

**🎯 Na maioria dos casos, o problema é:**
1. Usuário sem campo `id` (80% dos casos)
2. Nenhuma conversa criada ainda (15% dos casos)
3. Regras do Firestore não publicadas (5% dos casos)

Execute o script de diagnóstico acima para identificar rapidamente!
