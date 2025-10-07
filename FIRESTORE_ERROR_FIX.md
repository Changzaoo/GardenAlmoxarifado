# 🔥 Solução para Erro: FIRESTORE INTERNAL ASSERTION FAILED

## ❌ Erro que você está vendo:

```
ERROR
FIRESTORE (12.2.0) INTERNAL ASSERTION FAILED: Unexpected state (ID: ca9) CONTEXT: {"ve":-1}
```

---

## ✅ SOLUÇÕES (Em ordem de prioridade)

### 🎯 Solução 1: Usar a Ferramenta de Limpeza (RECOMENDADO)

Abra no navegador:
```
http://localhost:3000/limpar-firestore-cache.html
```

Clique no botão **"🗑️ Limpar Tudo (Recomendado)"** e aguarde o reload automático.

---

### 🛠️ Solução 2: Limpeza Manual pelo DevTools

1. Abra o **DevTools** (pressione `F12`)
2. Vá na aba **Application** (ou **Aplicativo**)
3. No menu esquerdo:
   - Expanda **IndexedDB**
   - Procure por databases com nomes contendo `firestore`, `firebase` ou `garden-c0b50`
   - Clique com o botão direito em cada um → **Delete database**
4. Ainda no menu esquerdo:
   - Clique em **Local Storage** → `http://localhost:3000`
   - Clique com botão direito → **Clear**
   - Clique em **Session Storage** → `http://localhost:3000`
   - Clique com botão direito → **Clear**
5. Recarregue a página com **Ctrl + Shift + R** (hard reload)

---

### 💻 Solução 3: Console do Navegador

Cole no Console (F12 → Console):

```javascript
// Limpar IndexedDB do Firestore
(async () => {
  const dbs = await indexedDB.databases();
  for (const db of dbs) {
    if (db.name.includes('firestore') || db.name.includes('garden')) {
      indexedDB.deleteDatabase(db.name);
      console.log('🗑️ Deleted:', db.name);
    }
  }
  localStorage.clear();
  sessionStorage.clear();
  console.log('✅ Cache limpo! Recarregando...');
  setTimeout(() => location.reload(), 1000);
})();
```

---

## 🔍 Causa do Problema

O erro ocorreu porque:

1. **Listeners duplicados não foram limpos**
   - No `ProfileTab.jsx` havia dois `return` statements consecutivos
   - Isso impedia a limpeza dos listeners do Firestore
   - Cada vez que o componente remontava, novos listeners eram criados

2. **Cache corrompido do IndexedDB**
   - O Firestore mantém um cache local no IndexedDB
   - Listeners não limpos corromperam esse cache
   - Resultado: estado interno inconsistente

---

## ✅ Correções Aplicadas

### No código:

**Arquivo:** `src/components/Profile/ProfileTab.jsx`

**ANTES (❌ Errado):**
```javascript
return () => {
  unsubscribeFuncionarios();
  unsubscribeUsuario();
};

return () => unsubscribe(); // ❌ Nunca executado!
```

**DEPOIS (✅ Correto):**
```javascript
return () => {
  console.log('🧹 Limpando listeners do ProfileTab');
  unsubscribeFuncionarios();
  unsubscribeUsuario();
};
// ✅ Removido o segundo return
```

---

## 🎯 Verificação Pós-Limpeza

Após aplicar uma das soluções:

1. Abra o DevTools (F12)
2. Vá na aba **Console**
3. Você deve ver logs como:
   ```
   ✅ Usando dados do FuncionariosProvider
   🧹 Limpando listeners do ProfileTab
   ```

4. **NÃO deve** ver mais os erros:
   ```
   ❌ FIRESTORE INTERNAL ASSERTION FAILED
   ```

---

## 🚀 Prevenção Futura

### Boas Práticas com Firestore Listeners:

1. **Sempre limpe listeners no cleanup:**
   ```javascript
   useEffect(() => {
     const unsubscribe = onSnapshot(query, callback);
     return () => unsubscribe(); // ✅ SEMPRE fazer isso
   }, [deps]);
   ```

2. **Evite listeners duplicados:**
   ```javascript
   // ❌ Evite:
   onSnapshot(query, callback);
   onSnapshot(query, callback); // Duplicado!
   
   // ✅ Correto:
   useEffect(() => {
     const unsub = onSnapshot(query, callback);
     return () => unsub();
   }, []);
   ```

3. **Use dependências corretas:**
   ```javascript
   // ❌ Evite re-subscrever desnecessariamente:
   useEffect(() => {
     const unsub = onSnapshot(query, callback);
     return () => unsub();
   }, [algoQueNaoAfetaAQuery]); // Problema!
   
   // ✅ Correto:
   useEffect(() => {
     const unsub = onSnapshot(query, callback);
     return () => unsub();
   }, []); // Ou deps relevantes
   ```

---

## 📞 Suporte

Se o erro persistir após todas as soluções:

1. **Feche TODAS as abas do localhost:3000**
2. **Reinicie o navegador** completamente
3. **Limpe o cache do navegador:**
   - Chrome: `Ctrl + Shift + Delete` → Marcar tudo → Limpar
4. **Reinicie o servidor de desenvolvimento:**
   ```bash
   # Parar o servidor (Ctrl + C)
   npm start
   ```

---

## 📊 Status da Correção

- ✅ **Código corrigido**: ProfileTab.jsx
- ✅ **Ferramenta de limpeza criada**: `/limpar-firestore-cache.html`
- ✅ **Logs de debug adicionados**
- ✅ **Documentação completa**

---

**Última atualização:** 06/10/2025  
**Versão:** 1.0.0  
**Status:** ✅ Resolvido
