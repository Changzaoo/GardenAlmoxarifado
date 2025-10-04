# 🔐 Guia de Solução de Problemas de Login

## 🚨 Problema: "Email ou senha incorretos"

### ✅ Credenciais Padrão do Sistema

O sistema possui 4 usuários padrão:

#### 👑 ADMINISTRADOR
- **Usuário**: `admin`
- **Senha**: `admin@362*`
- **Permissões**: Acesso total ao sistema

#### 👨‍💼 GERENTE
- **Usuário**: `joao`
- **Senha**: `123456`
- **Permissões**: Gerenciamento de equipe e inventário

#### 👷 SUPERVISOR
- **Usuário**: `maria`
- **Senha**: `123456`
- **Permissões**: Supervisão de tarefas e escalas

#### 👤 FUNCIONÁRIO
- **Usuário**: `pedro`
- **Senha**: `123456`
- **Permissões**: Acesso básico

---

## 🔧 Soluções Rápidas

### 1️⃣ Limpar Cache e Dados

#### Pelo Navegador:
1. Pressione `F12` para abrir o DevTools
2. Vá em `Application` (Chrome) ou `Armazenamento` (Firefox)
3. Clique em `Clear storage` ou `Limpar dados`
4. Marque todas as opções:
   - ✅ Local Storage
   - ✅ Session Storage
   - ✅ IndexedDB
   - ✅ Cookies
   - ✅ Cache Storage
5. Clique em `Clear site data`
6. Recarregue a página (`Ctrl + Shift + R`)

#### Pelo Console (Automático):
1. Pressione `F12`
2. Vá na aba `Console`
3. Cole o seguinte código e pressione Enter:

```javascript
// Carrega o script de diagnóstico
const script = document.createElement('script');
script.src = '/diagnostico-login.js';
document.head.appendChild(script);

// Após carregar, execute:
setTimeout(() => {
  limparTudo(); // Isso limpará TUDO e recarregará a página
}, 1000);
```

### 2️⃣ Verificar Logs no Console

1. Pressione `F12`
2. Vá na aba `Console`
3. Tente fazer login
4. Procure por mensagens como:
   - 🔐 Tentativa de login
   - 📋 Total de usuários carregados
   - ✅ Usuário encontrado
   - ❌ Senha inválida

**O que observar:**
- Se aparecer "Total de usuários carregados: 0" → Sistema não carregou usuários
- Se aparecer "Usuário não encontrado" → Email/usuário incorreto
- Se aparecer "Senha inválida" → Senha incorreta

### 3️⃣ Testar Credenciais

**Digite exatamente como mostrado (case-sensitive para senha):**

```
Usuário: admin
Senha: admin@362*
```

**⚠️ Atenção:**
- Não adicione espaços antes ou depois
- A senha do admin tem caracteres especiais: `@` e `*`
- Verifique se não está com CAPS LOCK ativado

### 4️⃣ Verificar Conexão com Firebase

No console do navegador, execute:

```javascript
console.log('Firebase Status:', localStorage.getItem('firebase-status'));
```

- Se retornar `null` ou `error`: Firebase não está conectado
- Se retornar `connected`: Firebase funcionando

### 5️⃣ Forçar Carregamento de Usuários Locais

No console, execute:

```javascript
// Isso força o carregamento dos usuários padrão
localStorage.setItem('force-local-users', 'true');
location.reload();
```

---

## 🐛 Problemas Comuns

### ❌ "Total de usuários carregados: 0"

**Causa:** Sistema não conseguiu carregar usuários do Firebase nem localmente.

**Solução:**
1. Limpe o cache (Método 1)
2. Recarregue a página
3. Se persistir, force usuários locais (Método 5)

### ❌ Senha não aceita mesmo estando correta

**Causa:** Sistema pode estar comparando com senha criptografada antiga.

**Solução:**
1. Limpe TODOS os dados (Método 1)
2. Recarregue a página
3. Tente novamente com `admin` / `admin@362*`

### ❌ Cookies não habilitados

**Causa:** Navegador bloqueando cookies.

**Solução:**
1. Chrome: `chrome://settings/cookies` → Permitir cookies
2. Firefox: `about:preferences#privacy` → Aceitar cookies
3. Edge: `edge://settings/content/cookies` → Permitir cookies

### ❌ Service Worker interferindo

**Causa:** Service Worker em cache com versão antiga.

**Solução:**
```javascript
// Execute no console
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(reg => reg.unregister());
  console.log('Service Workers removidos');
  location.reload(true);
});
```

---

## 🔍 Diagnóstico Avançado

### Script de Diagnóstico Completo

Cole no console do navegador:

```javascript
fetch('/diagnostico-login.js')
  .then(r => r.text())
  .then(eval)
  .catch(() => console.log('Arquivo de diagnóstico não encontrado'));
```

Isso mostrará:
- ✅ Status do LocalStorage
- ✅ Cookies ativos
- ✅ Service Workers registrados
- ✅ Bancos de dados IndexedDB
- ✅ Caches ativos
- ✅ Credenciais padrão

### Verificar Estado do Sistema

```javascript
// Cole no console
console.group('🔍 Estado do Sistema');
console.log('Usuários carregados:', window.usuarios?.length || 0);
console.log('Usuário logado:', window.usuario?.nome || 'Nenhum');
console.log('Firebase:', window.firebaseStatus || 'Desconhecido');
console.log('Cookies:', document.cookie || 'Nenhum');
console.groupEnd();
```

---

## 📞 Suporte

Se nada funcionar:

1. **Documente o problema:**
   - Capturas de tela do erro
   - Logs do console (F12)
   - Navegador e versão usados

2. **Teste em navegador diferente:**
   - Chrome
   - Firefox
   - Edge

3. **Modo Incógnito:**
   - Abra uma janela anônima
   - Tente fazer login
   - Se funcionar → Problema é cache/extensões

4. **Verifique a URL:**
   - Deve ser `localhost:3000` (dev)
   - Ou o domínio correto em produção

---

## ✨ Após Resolver

1. Limpe o cache completamente
2. Recarregue a página (Ctrl + Shift + R)
3. Tente login com `admin` / `admin@362*`
4. Se funcionar, crie um novo usuário com suas credenciais
5. Faça logout e teste com o novo usuário

---

**Última atualização: 04/10/2025**
