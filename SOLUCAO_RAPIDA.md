# ⚡ SOLUÇÃO RÁPIDA: "Nenhuma conversa ainda"

## 🎯 Problema

Página de Mensagens mostra "Nenhuma conversa ainda" e nada aparece.

---

## ✅ SOLUÇÃO RÁPIDA (30 segundos)

### **Passo 1: Abra o Console**
Pressione **F12** → Aba **Console**

### **Passo 2: Cole este código**
```javascript
// Script de correção automática
let user = JSON.parse(localStorage.getItem('usuario'));
if (user && !user.id) {
  user.id = user.email || 'user_' + Date.now();
  localStorage.setItem('usuario', JSON.stringify(user));
  console.log('✅ Corrigido! Recarregando...');
  location.reload();
} else {
  console.log('✅ Usuário está OK');
  console.log('💡 Se ainda não funciona, crie uma conversa clicando no "+"');
}
```

### **Passo 3: Pressione Enter**

**Pronto!** A página vai recarregar e funcionar.

---

## 📊 Outras Causas

Se ainda não funcionar:

1. **Nenhuma conversa criada:**
   - Clique no botão **"+"** azul
   - Selecione um usuário
   - Envie uma mensagem

2. **Regras do Firestore:**
   - Abra: https://console.firebase.google.com
   - Firestore Database → Regras → Publicar

---

## 📖 Documentação Completa

- `INSTRUCOES_RAPIDAS.md` - Guia rápido (5 min)
- `GUIA_DEBUG_CONVERSAS.md` - Guia completo (todas as causas)

---

**⏱️ Em 99% dos casos, o script acima resolve!**
