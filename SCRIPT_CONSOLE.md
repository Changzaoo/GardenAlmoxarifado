# 🆘 COLE ISTO NO CONSOLE (F12)

Copie e cole este código no console do navegador:

```javascript
(async()=>{console.log('%c🆘 LIMPANDO CACHE...','color:#f00;font-size:20px');try{if(window.indexedDB&&window.indexedDB.databases){const dbs=await window.indexedDB.databases();for(const db of dbs){if(db.name&&(db.name.includes('firestore')||db.name.includes('firebase'))){console.log('🗑️',db.name);indexedDB.deleteDatabase(db.name)}}}for(let i=localStorage.length-1;i>=0;i--){const k=localStorage.key(i);if(k&&(k.includes('firebase')||k.includes('firestore'))){localStorage.removeItem(k)}}console.log('%c✅ LIMPO!','color:#0f0;font-size:20px');setTimeout(()=>location.reload(true),2000)}catch(e){console.error(e);setTimeout(()=>location.reload(true),1000)}})();
```

## Como usar:

1. **F12** - Abre DevTools
2. **Console** - Clica na aba
3. **Ctrl+V** - Cola o código acima
4. **Enter** - Executa
5. **Aguarde** - 2 segundos

✅ **Pronto!**

---

## Versão Legível (mesma coisa):

```javascript
(async () => {
  console.log('%c🆘 LIMPANDO CACHE...', 'color:#f00;font-size:20px');
  
  try {
    // Deletar IndexedDB
    if (window.indexedDB && window.indexedDB.databases) {
      const dbs = await window.indexedDB.databases();
      for (const db of dbs) {
        if (db.name && (db.name.includes('firestore') || db.name.includes('firebase'))) {
          console.log('🗑️', db.name);
          indexedDB.deleteDatabase(db.name);
        }
      }
    }
    
    // Limpar localStorage
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && (k.includes('firebase') || k.includes('firestore'))) {
        localStorage.removeItem(k);
      }
    }
    
    console.log('%c✅ LIMPO!', 'color:#0f0;font-size:20px');
    setTimeout(() => location.reload(true), 2000);
    
  } catch (e) {
    console.error(e);
    setTimeout(() => location.reload(true), 1000);
  }
})();
```

---

## ⚡ Alternativa Ultra-Rápida

Se não quiser usar script, apenas:

1. **Ctrl + Shift + Delete**
2. **Clear data**
3. **Ctrl + F5**

---

✅ **Qualquer uma das opções resolve!**
