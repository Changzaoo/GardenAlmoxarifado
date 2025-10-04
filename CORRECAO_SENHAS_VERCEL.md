# 🔧 Correção: Senhas não funcionam no Vercel

## 🐛 Problema Identificado

As senhas não funcionam quando o aplicativo é deployado no Vercel por **2 motivos principais**:

### 1. **APP_SECRET diferente entre local e Vercel**

O sistema usa uma chave secreta (`APP_SECRET`) para gerar o hash das senhas. Esta chave é diferente em desenvolvimento e produção:

```javascript
// src/utils/crypto.js
const APP_SECRET = process.env.NODE_ENV === 'production'
  ? process.env.REACT_APP_CRYPTO_SECRET  // ❌ NÃO DEFINIDO NO VERCEL
  : 'workflow-garden-secure-key-2025';   // ✅ Usado localmente
```

**Resultado**: 
- Local: Usa `'workflow-garden-secure-key-2025'`
- Vercel: Usa `undefined` (variável não configurada)
- **Hash calculado é diferente!** ❌

### 2. **Migração de senha salva no banco errado**

Quando uma senha em texto plano é validada, o sistema migra para SHA-512. Porém, estava salvando no Firebase Primary (`db`) em vez do Firebase Backup (`backupDb`):

```javascript
// ❌ ANTES (ERRADO)
await updateDoc(doc(db, 'usuarios', usuarioEncontrado.id), { ... });

// ✅ AGORA (CORRETO)
await updateDoc(doc(backupDb, 'usuarios', usuarioEncontrado.id), { ... });
```

---

## 🔐 Como o Sistema de Senhas Funciona

### Algoritmo: SHA-512 com Salt

```javascript
// 1. Gerar salt único (16 caracteres aleatórios)
const salt = CryptoJS.lib.WordArray.random(16).toString();

// 2. Calcular hash
const hash = CryptoJS.SHA512(senha + salt + APP_SECRET).toString();

// 3. Salvar no Firebase
{
  senhaHash: hash,        // Hash SHA-512 da senha
  senhaSalt: salt,        // Salt único usado
  senhaVersion: 2,        // Versão do algoritmo
  senhaAlgorithm: "SHA-512"
}
```

### Verificação de Senha

```javascript
// Recalcular hash com a senha digitada
const computedHash = CryptoJS.SHA512(senhaDigitada + salt + APP_SECRET).toString();

// Comparar com hash armazenado
return computedHash === senhaHash; // true = senha correta
```

### ⚠️ Problema Crítico

Se `APP_SECRET` for diferente, o hash nunca será igual:

```javascript
// Local (desenvolvimento)
APP_SECRET = 'workflow-garden-secure-key-2025'
hash = SHA512(senha + salt + 'workflow-garden-secure-key-2025')

// Vercel (produção)
APP_SECRET = undefined
hash = SHA512(senha + salt + undefined)  // ❌ DIFERENTE!
```

---

## ✅ Solução

### Passo 1: Configurar Variável de Ambiente no Vercel

1. Acessar [Vercel Dashboard](https://vercel.com/)
2. Selecionar o projeto **GardenAlmoxarifado**
3. Ir em **Settings → Environment Variables**
4. Adicionar nova variável:

```
Nome:  REACT_APP_CRYPTO_SECRET
Valor: workflow-garden-secure-key-2025
```

5. Aplicar para **Production**, **Preview** e **Development**
6. **Redeploy** o projeto

### Passo 2: Atualizar .env.example

```bash
# Crypto Secret (usado para hash de senhas)
REACT_APP_CRYPTO_SECRET=workflow-garden-secure-key-2025
```

### Passo 3: Criar .env.production

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
VITE_FIREBASE_PROJECT_ID=your_project_id_here
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
VITE_FIREBASE_APP_ID=your_app_id_here
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id_here

# Crypto Secret
REACT_APP_CRYPTO_SECRET=workflow-garden-secure-key-2025
```

---

## 🧪 Testar Localmente com Produção

Para simular o ambiente de produção localmente:

```bash
# 1. Criar arquivo .env.production.local
REACT_APP_CRYPTO_SECRET=workflow-garden-secure-key-2025

# 2. Build de produção
npm run build

# 3. Servir build local
npx serve -s build
```

---

## 🔄 Alterações Feitas no Código

### src/components/Workflow.jsx

```diff
  } else if (usuarioEncontrado.senha) {
    // Senha em texto plano (sistema legado) - comparação direta
    console.log('📝 Verificando senha em texto plano...');
-   console.log('Senha digitada:', senha);
-   console.log('Senha armazenada:', usuarioEncontrado.senha);
    senhaValida = usuarioEncontrado.senha === senha;
    console.log('Resultado da comparação:', senhaValida);
    
-   // Se válida, migrar para SHA-512
+   // Se válida, migrar para SHA-512 no Firebase Backup
    if (senhaValida) {
+     console.log('🔄 Migrando senha para SHA-512...');
      const { hash, salt, version, algorithm } = encryptPassword(senha);
      try {
-       await updateDoc(doc(db, 'usuarios', usuarioEncontrado.id), {
+       await updateDoc(doc(backupDb, 'usuarios', usuarioEncontrado.id), {
          senhaHash: hash,
          senhaSalt: salt,
          senhaVersion: version,
          senhaAlgorithm: algorithm,
          senha: null // Remove senha em texto plano
        });
-       console.log('✅ Senha migrada para SHA-512 com sucesso');
+       console.log('✅ Senha migrada para SHA-512 no Firebase Backup');
      } catch (error) {
-       console.warn('⚠️ Erro ao migrar senha:', error);
+       console.warn('⚠️ Erro ao migrar senha no Firebase Backup:', error);
      }
    }
  }
```

**Mudanças**:
1. ✅ Removidos logs de senha em texto plano (segurança)
2. ✅ Migração agora salva no `backupDb` em vez de `db`
3. ✅ Logs mais claros indicando Firebase Backup

---

## 📊 Estrutura de Dados no Firebase Backup

### Usuário com Senha SHA-512 (Recomendado)

```javascript
{
  // Identificação
  "email": "ruan",
  "nome": "Ruan",
  
  // Empresa e Setor
  "empresaId": "TcVmirNvefUVV1gjQanzZ",
  "empresaName": "Zendaya",
  "setorId": "o4GeEPjoojJGajjm34LK",
  "setorName": "Jardim",
  
  // Segurança (SHA-512)
  "senhaHash": "q0dafa3B7f14a38424...",
  "senhaSalt": "19a04b53af364837...",
  "senhaVersion": 2,
  "senhaAlgorithm": "SHA-512",
  "senha": null,  // Removido após migração
  
  // Status
  "ativo": true,
  "nivel": 1,
  "status": "offline",
  
  // Timestamps
  "dataCriacao": "2025-08-26T10:15:00.821Z",
  "ultimoLogin": "2025-10-04T18:33:17.072Z",
  "ultimaVez": "4 de outubro de 2025 às 09:08:25 UTC-3"
}
```

### Usuário com Senha em Texto Plano (Legado)

```javascript
{
  "email": "teste@example.com",
  "senha": "123456",  // ⚠️ Será migrado no primeiro login
  "ativo": true,
  "nivel": 4,
  "nome": "Usuário Teste"
}
```

**Quando o usuário fizer login**:
- Sistema valida senha em texto plano: `"123456" === "123456"` ✅
- Gera hash SHA-512 automaticamente
- Atualiza documento no Firebase Backup
- Próximo login usará SHA-512 🔒

---

## 🔍 Debug de Senhas

### Logs no Console

#### Login Bem-Sucedido (SHA-512):
```
🔐 Tentativa de login: { email: 'ruan', senhaLength: 4 }
🗄️ Buscando usuário no Firebase Backup (garden-backup)...
✅ Usuário encontrado no Firebase Backup: { id: '87BoXJZoHWry6RQddzr9', ... }
✅ Usuário encontrado: { email: 'ruan', nivel: 1, temSenhaHash: true, temSenhaSalt: true }
🔒 Verificando senha criptografada SHA-512...
Resultado da verificação SHA-512: true
✅ Senha válida! Prosseguindo com login...
✅ Último login atualizado no Firebase Backup
```

#### Login Bem-Sucedido (Texto Plano → Migração):
```
🔐 Tentativa de login: { email: 'teste@example.com', senhaLength: 6 }
🗄️ Buscando usuário no Firebase Backup (garden-backup)...
✅ Usuário encontrado no Firebase Backup
✅ Usuário encontrado: { temSenhaHash: false, temSenhaTexto: true }
📝 Verificando senha em texto plano...
Resultado da comparação: true
🔄 Migrando senha para SHA-512...
✅ Senha migrada para SHA-512 no Firebase Backup
✅ Senha válida! Prosseguindo com login...
```

#### Login Falhou (Senha Incorreta):
```
🔐 Tentativa de login: { email: 'ruan', senhaLength: 5 }
🗄️ Buscando usuário no Firebase Backup (garden-backup)...
✅ Usuário encontrado no Firebase Backup
🔒 Verificando senha criptografada SHA-512...
Resultado da verificação SHA-512: false
❌ Senha inválida!
```

#### Login Falhou (APP_SECRET errado no Vercel):
```
🔐 Tentativa de login: { email: 'ruan', senhaLength: 4 }
🗄️ Buscando usuário no Firebase Backup (garden-backup)...
✅ Usuário encontrado no Firebase Backup
🔒 Verificando senha criptografada SHA-512...
⚠️ APP_SECRET: undefined  ← PROBLEMA!
Resultado da verificação SHA-512: false
❌ Senha inválida!
```

### Como Adicionar Log do APP_SECRET (Debug)

```javascript
// src/utils/crypto.js (temporário para debug)
const APP_SECRET = process.env.NODE_ENV === 'production'
  ? process.env.REACT_APP_CRYPTO_SECRET
  : 'workflow-garden-secure-key-2025';

// Adicionar log temporário
console.log('🔑 APP_SECRET configurado:', APP_SECRET ? 'SIM' : 'NÃO');
console.log('🌍 Environment:', process.env.NODE_ENV);
```

---

## 🚀 Checklist de Deploy

Antes de fazer deploy no Vercel:

- [ ] Variável `REACT_APP_CRYPTO_SECRET` configurada no Vercel
- [ ] Arquivo `.env.production` criado localmente (não commitado)
- [ ] Firebase Backup credenciais configuradas
- [ ] Build local testado: `npm run build && npx serve -s build`
- [ ] Login testado com usuário SHA-512
- [ ] Login testado com usuário texto plano (migração)
- [ ] Console sem erros de `APP_SECRET undefined`
- [ ] Commit e push das alterações
- [ ] Redeploy no Vercel
- [ ] Testar login no ambiente de produção

---

## 🎯 Resultado Esperado

### ✅ Após Correção

1. **Variável configurada no Vercel**: `REACT_APP_CRYPTO_SECRET` definida
2. **Senhas SHA-512 funcionam**: Hash calculado corretamente
3. **Migração funciona**: Senhas texto plano migradas para Firebase Backup
4. **Login funciona em produção**: Mesma experiência que local

### ❌ Antes da Correção

1. **APP_SECRET undefined**: Hash calculado errado
2. **Senhas sempre inválidas**: Comparação falhava
3. **Migração no banco errado**: Salvava em `db` em vez de `backupDb`
4. **Login quebrado em produção**: Impossível autenticar

---

## 📝 Comandos Úteis

```bash
# Build de produção local
npm run build

# Servir build
npx serve -s build

# Ver variáveis de ambiente
npm run env

# Deploy no Vercel
vercel --prod

# Logs do Vercel
vercel logs [deployment-url]
```

---

## 🔗 Referências

- **Algoritmo SHA-512**: [CryptoJS Documentation](https://cryptojs.gitbook.io/docs/)
- **Vercel Environment Variables**: [Vercel Docs](https://vercel.com/docs/concepts/projects/environment-variables)
- **Firebase Backup**: `garden-backup` projeto
- **Coleção**: `usuarios`
- **Campos**: `email`, `senhaHash`, `senhaSalt`, `senhaVersion`, `senhaAlgorithm`

---

**Status**: ✅ Correções aplicadas no código  
**Pendente**: Configurar variável no Vercel e redeploy

**Desenvolvido com 🔒 para Garden Almoxarifado**  
*Sistema de Autenticação v2.1 - Senhas funcionando no Vercel!*
