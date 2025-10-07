# 🚨 CORREÇÃO URGENTE: Erro de Permissões

## ❌ Erro Atual
```
Missing or insufficient permissions.
```

---

## ✅ SOLUÇÃO RÁPIDA (Siga na ordem!)

### 1️⃣ **RECARREGAR PÁGINA FORÇADO**
Pressione **Ctrl + Shift + R** na página do sistema

**Por quê?** As novas regras do Firestore foram deployadas mas o navegador está usando cache antigo.

---

### 2️⃣ **VERIFICAR SEU NÍVEL DE USUÁRIO**

Abra esta página no navegador:
```
http://localhost:3000/verificar-permissoes.html
```

Esta página vai mostrar:
- ✅ Se você tem permissões (nível >= 3)
- ❌ Se seu nível é insuficiente
- 📊 Seus dados de usuário

---

### 3️⃣ **SE NÍVEL < 3: AUMENTAR NO FIRESTORE**

**Opção A - Pelo Firebase Console:**
1. Vá para: https://console.firebase.google.com/project/garden-c0b50/firestore
2. Abra a coleção `usuario`
3. Encontre seu documento (pelo email)
4. Edite o campo `nivel` para `3` ou `4`
5. Salve

**Opção B - Usar ferramenta HTML:**
Abra no navegador:
```
http://localhost:3000/alterar-nivel-admin-manual.html
```

---

### 4️⃣ **LIMPAR CACHE DO FIRESTORE**

Se ainda der erro após recarregar:

**Console do Navegador (F12):**
```javascript
// Limpar tudo
localStorage.clear();
sessionStorage.clear();

// Limpar IndexedDB (Firestore cache)
indexedDB.databases().then(dbs => {
  dbs.forEach(db => {
    if (db.name.includes('firestore') || db.name.includes('firebase')) {
      indexedDB.deleteDatabase(db.name);
    }
  });
});

// Recarregar
window.location.reload();
```

Ou use a ferramenta:
```
http://localhost:3000/limpar-firestore-cache.html
```

---

### 5️⃣ **FAZER LOGOUT E LOGIN NOVAMENTE**

1. Sair do sistema
2. Limpar cache (Ctrl + Shift + Delete)
3. Fechar navegador
4. Abrir novamente
5. Fazer login

**Por quê?** Renovar o token de autenticação do Firebase.

---

## 🔍 DIAGNÓSTICO COMPLETO

### **Verificar Regras Deployadas:**
```bash
# No terminal do projeto:
firebase firestore:rules:list
```

Deve mostrar a versão mais recente (hoje).

### **Ver Logs do Firebase:**
```bash
# No terminal:
firebase deploy --only firestore:rules --debug
```

### **Testar Regras Manualmente:**
1. Vá para: https://console.firebase.google.com/project/garden-c0b50/firestore/rules
2. Clique em "Rules playground"
3. Cole:
   ```
   Tipo: get
   Caminho: /backup_test/test123
   ```
4. Simule com seu UID
5. Deve retornar: **ALLOWED**

---

## 📋 CHECKLIST

Marque conforme faz:

- [ ] Recarreguei a página com **Ctrl + Shift + R**
- [ ] Verifiquei meu nível em `/verificar-permissoes.html`
- [ ] Meu nível é >= 3 (Gerente ou Admin)
- [ ] Limpei o cache do navegador
- [ ] Fiz logout e login novamente
- [ ] Teste de conexão funciona! ✅

---

## 🆘 SE AINDA NÃO FUNCIONAR

### **Debug no Console (F12):**
```javascript
// Verificar usuário atual
console.log('UID:', firebase.auth().currentUser.uid);

// Verificar documento do usuário
firebase.firestore().collection('usuario')
  .doc(firebase.auth().currentUser.uid)
  .get()
  .then(doc => {
    if (doc.exists) {
      console.log('Dados:', doc.data());
      console.log('Nível:', doc.data().nivel);
    } else {
      console.log('❌ Documento não existe!');
    }
  });

// Testar permissão diretamente
firebase.firestore().collection('backup_test')
  .add({ test: true })
  .then(() => console.log('✅ Permissão OK!'))
  .catch(err => console.error('❌ Sem permissão:', err));
```

---

## 📞 SUPORTE

Se nada funcionar, compartilhe:
1. **Console logs** (F12 → Console)
2. **Network errors** (F12 → Network → filtrar "backup_test")
3. **Screenshot** do erro
4. **Seu nível** (de `/verificar-permissoes.html`)

---

## ✅ REGRAS CORRETAS (PARA REFERÊNCIA)

Estas regras já foram deployadas:

```javascript
// firestore.rules (linha 188-194)
match /backup_test/{testId} {
  allow read, write: if isAuthenticated() && 
                        exists(/databases/$(database)/documents/usuario/$(request.auth.uid)) &&
                        get(/databases/$(database)/documents/usuario/$(request.auth.uid)).data.nivel >= 3;
}
```

**Permitem:** Usuários com nível >= 3 podem ler/escrever em `backup_test`

---

**Data:** 07/10/2025  
**Status:** ✅ Regras deployadas, aguardando teste do usuário
