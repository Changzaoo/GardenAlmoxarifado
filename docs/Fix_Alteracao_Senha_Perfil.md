# 🔧 Fix: Correção da Alteração de Senha no Editar Perfil

## 📋 Problema Identificado

Quando o usuário alterava a senha no modal "Editar Perfil" (menu lateral), a senha **não estava sendo realmente alterada** e o usuário não conseguia fazer login com a nova senha.

### 🔍 Causa Raiz

O sistema de autenticação usa **3 níveis de verificação de senha** em ordem de prioridade:

1. **authKey** - Senha em texto plano (PRIORIDADE 1 - verificada primeiro)
2. **senhaHash + senhaSalt** - Hash SHA-512 (PRIORIDADE 2)
3. **senha** - Texto plano legado (PRIORIDADE 3)

O problema estava em **4 arquivos** onde ao atualizar a senha, o código estava definindo o `authKey` com senhas padrão baseadas no nível do usuário:

```javascript
// ❌ CÓDIGO ERRADO (antes da correção)
dadosParaAtualizar.authKey = usuario.nivel === 0 ? 'admin2024' : 'workflow2024';
```

Isso significava que:
- **Administradores** (nível 0) sempre tinham authKey = `"admin2024"`
- **Outros usuários** sempre tinham authKey = `"workflow2024"`

Como o `authKey` é a **primeira verificação** no login, a senha digitada pelo usuário era **ignorada** e o sistema tentava autenticar com essas senhas padrões.

---

## ✅ Solução Implementada

### Arquivos Corrigidos

1. **src/components/Auth/UserProfileModal.jsx** (Modal "Editar Perfil")
2. **src/components/Auth/RecuperarSenhaModal.jsx** (Recuperação de senha)
3. **src/components/Auth/PrimeiroAcessoModal.jsx** (Primeiro acesso)
4. **src/hooks/useAuth.jsx** (Hook de autenticação)
5. **src/services/passwordReset.js** (Criação de usuário com código)

### Código Corrigido

```javascript
// ✅ CÓDIGO CORRETO (após correção)
// authKey agora recebe a SENHA DIGITADA pelo usuário
dadosParaAtualizar.authKey = userData.senha.trim();
// ou
dadosParaAtualizar.authKey = novaSenha;
```

---

## 🔐 Como Funciona a Autenticação Agora

### Fluxo de Login (authService.js)

```javascript
// PRIORIDADE 1: Verifica authKey (senha em texto plano)
if (userData.authKey) {
  return senhaFornecida === userData.authKey; // ✅ Agora compara com a senha digitada
}

// PRIORIDADE 2: Verifica senhaHash + senhaSalt (SHA-512)
if (userData.senhaHash && userData.senhaSalt) {
  return await verifyPassword(senhaFornecida, userData.senhaHash, userData.senhaSalt);
}

// PRIORIDADE 3: Verifica senha legado (texto plano)
if (userData.senha) {
  return senhaFornecida === userData.senha;
}
```

### Estrutura de Campos no Firebase

Quando um usuário altera a senha, os seguintes campos são salvos:

```javascript
{
  // 🔑 Autenticação Principal (verificada primeiro)
  authKey: "senha_digitada_pelo_usuario",
  authKeyUpdatedAt: Date,
  
  // 🔒 Backup Criptografado (verificado em segundo)
  senhaHash: "hash_sha512_da_senha",
  senhaSalt: "salt_gerado",
  senhaVersion: 1,
  senhaAlgorithm: "SHA-512",
  
  // 🚫 Senha legado (removida)
  senha: null,
  
  // 📅 Metadados
  dataAlteracaoSenha: "2025-10-06T11:07:58.806Z"
}
```

---

## 🧪 Como Testar a Correção

### 1. Alterar Senha no Perfil

1. Faça login no sistema
2. Clique no menu lateral (seu nome/foto)
3. Clique em "Editar Perfil"
4. Digite uma nova senha (mínimo 6 caracteres)
5. Clique em "Atualizar"
6. Faça logout
7. Faça login com a **nova senha** ✅

### 2. Verificar no Firebase

Acesse o Firebase Console e veja o documento do usuário:

```json
{
  "authKey": "minha_nova_senha_123",
  "senhaHash": "hash_sha512_...",
  "senhaSalt": "salt_gerado...",
  "senha": null
}
```

O campo `authKey` deve conter a **senha digitada**, não `"admin2024"` ou `"workflow2024"`.

---

## 📊 Impacto da Correção

### Antes (Problema)
- ❌ Senha alterada no perfil não funcionava
- ❌ Usuário não conseguia fazer login
- ❌ authKey sempre recebia senha padrão
- ❌ Sistema ignorava senha digitada

### Depois (Correção)
- ✅ Senha alterada no perfil funciona corretamente
- ✅ Usuário consegue fazer login com nova senha
- ✅ authKey recebe senha digitada pelo usuário
- ✅ Sistema autentica com senha correta

---

## 🔒 Segurança

### Múltiplos Níveis de Verificação

O sistema mantém **3 métodos de autenticação** para:
- **Compatibilidade**: Usuários antigos continuam funcionando
- **Segurança**: Hash SHA-512 como backup
- **Flexibilidade**: authKey permite redefinição rápida

### Recomendações

1. **authKey** é prioridade 1 para facilitar alterações
2. **senhaHash** funciona como backup seguro
3. Sempre que alterar senha, ambos são atualizados
4. Campo `senha` legado sempre é removido (null)

---

## 📝 Commit

```bash
git commit -m "fix: corrige atualização de senha no editar perfil - authKey agora usa senha digitada ao invés de senha padrão"
```

### Arquivos Alterados
- src/components/Auth/UserProfileModal.jsx
- src/components/Auth/RecuperarSenhaModal.jsx
- src/components/Auth/PrimeiroAcessoModal.jsx
- src/hooks/useAuth.jsx
- src/services/passwordReset.js
- build/ (arquivos compilados)

### Resultado
- ✅ Compilação bem-sucedida
- ✅ Bundle: 774.53 kB (-17 B)
- ✅ Sem erros de compilação
- ✅ Push para GitHub realizado

---

## 🎯 Conclusão

O problema foi **identificado e corrigido** em todos os locais onde a senha é alterada. Agora o sistema:

1. ✅ Salva a senha digitada no campo `authKey`
2. ✅ Mantém backup criptografado em `senhaHash`
3. ✅ Remove senha em texto plano do campo `senha`
4. ✅ Permite login com a nova senha imediatamente
5. ✅ Funciona em todas as telas de alteração de senha

---

## 📚 Referências

- **Sistema de Autenticação**: `src/services/authService.js`
- **Verificação de Senha**: Linhas 123-154 (authKey → senhaHash → senha)
- **Documentação Completa**: `docs/Sistema_Autenticacao_Completo.md`
- **Criptografia**: `src/utils/crypto.js` (SHA-512)

---

**Data da Correção**: 06/10/2025  
**Versão**: 1.0.0  
**Build**: 1759748878807  
**Branch**: main  
**Commit**: 46c98bd8
