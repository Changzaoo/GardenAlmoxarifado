# 🔧 Guia Passo-a-Passo: Configurar Variável no Vercel

## 📋 Problema

As senhas **NÃO funcionam no Vercel** porque a variável `REACT_APP_CRYPTO_SECRET` não está configurada.

### ❌ O que acontece agora:
```javascript
// Local (desenvolvimento)
APP_SECRET = 'workflow-garden-secure-key-2025' ✅

// Vercel (produção)
APP_SECRET = undefined ❌
```

### ✅ O que precisa acontecer:
```javascript
// Local (desenvolvimento)
APP_SECRET = 'workflow-garden-secure-key-2025' ✅

// Vercel (produção)
APP_SECRET = 'workflow-garden-secure-key-2025' ✅
```

---

## 🎯 Solução: 3 Passos Simples

### **Passo 1: Acessar Vercel Dashboard**

1. Ir para: https://vercel.com/
2. Fazer login
3. Selecionar o projeto: **GardenAlmoxarifado**

---

### **Passo 2: Ir em Configurações**

1. Clicar na aba **"Settings"** (Configurações)
2. No menu lateral, clicar em **"Environment Variables"**

---

### **Passo 3: Adicionar Nova Variável**

1. Clicar no botão **"Add New"** ou **"Add Variable"**
2. Preencher os campos:

```
┌─────────────────────────────────────────────────┐
│ Name:  REACT_APP_CRYPTO_SECRET                  │
│                                                 │
│ Value: workflow-garden-secure-key-2025          │
│                                                 │
│ Environments:                                   │
│   ☑ Production                                  │
│   ☑ Preview                                     │
│   ☑ Development                                 │
└─────────────────────────────────────────────────┘
```

3. Clicar em **"Save"** (Salvar)

---

### **Passo 4: Redeploy**

**Importante**: A variável só será aplicada após um novo deploy!

#### Opção A: Redeploy Automático (Recomendado)
1. Fazer qualquer commit no GitHub (pode ser este mesmo)
2. Vercel vai detectar e fazer deploy automaticamente
3. Aguardar deploy terminar

#### Opção B: Redeploy Manual
1. Na página do projeto no Vercel
2. Ir em **"Deployments"**
3. Clicar nos 3 pontinhos (...) do último deploy
4. Clicar em **"Redeploy"**
5. Confirmar clicando em **"Redeploy"** novamente

---

## ✅ Verificar se Funcionou

### 1. Acessar o Site no Vercel

Abrir o site deployado no Vercel (ex: `https://garden-almoxarifado.vercel.app`)

### 2. Abrir Console do Navegador

- Chrome/Edge: `F12` ou `Ctrl+Shift+I`
- Firefox: `F12` ou `Ctrl+Shift+K`
- Safari: `Cmd+Option+I`

### 3. Procurar pelos Logs

Ao carregar a página, você deve ver:

#### ✅ Se Configurado Corretamente:
```
🔑 Crypto: APP_SECRET configurado: SIM ✅
🌍 Crypto: Environment: production
```

#### ❌ Se Ainda Não Configurado:
```
🔑 Crypto: APP_SECRET configurado: NÃO ❌
🌍 Crypto: Environment: production
❌ ERRO CRÍTICO: REACT_APP_CRYPTO_SECRET não está definido no Vercel!
⚠️ As senhas SHA-512 NÃO funcionarão sem esta variável!
📋 Solução: Configure REACT_APP_CRYPTO_SECRET=workflow-garden-secure-key-2025 no Vercel
```

### 4. Testar Login

Tentar fazer login com um usuário que tem senha SHA-512 no Firebase Backup.

#### ✅ Se Funcionou:
```
🔐 Tentativa de login: { email: 'ruan', senhaLength: 4 }
🗄️ Buscando usuário no Firebase Backup (garden-backup)...
✅ Usuário encontrado no Firebase Backup
🔒 Verificando senha criptografada SHA-512...
Resultado da verificação SHA-512: true ✅
✅ Senha válida! Prosseguindo com login...
✅ Login bem-sucedido! 🎉
```

#### ❌ Se Não Funcionou:
```
🔐 Tentativa de login: { email: 'ruan', senhaLength: 4 }
🗄️ Buscando usuário no Firebase Backup (garden-backup)...
✅ Usuário encontrado no Firebase Backup
🔒 Verificando senha criptografada SHA-512...
Resultado da verificação SHA-512: false ❌
❌ Senha inválida!
```

---

## 🎯 Checklist Completo

Marque cada item conforme completar:

- [ ] **1. Acessar Vercel Dashboard**
  - [ ] Fazer login em https://vercel.com/
  - [ ] Selecionar projeto GardenAlmoxarifado

- [ ] **2. Adicionar Variável de Ambiente**
  - [ ] Ir em Settings → Environment Variables
  - [ ] Clicar em "Add New"
  - [ ] Nome: `REACT_APP_CRYPTO_SECRET`
  - [ ] Valor: `workflow-garden-secure-key-2025`
  - [ ] Marcar: Production, Preview, Development
  - [ ] Clicar em Save

- [ ] **3. Redeploy**
  - [ ] Fazer commit no GitHub (trigger automático), OU
  - [ ] Redeploy manual no Vercel

- [ ] **4. Verificar Console**
  - [ ] Abrir site no Vercel
  - [ ] Abrir DevTools (F12)
  - [ ] Verificar log: "APP_SECRET configurado: SIM ✅"

- [ ] **5. Testar Login**
  - [ ] Tentar login com usuário SHA-512
  - [ ] Verificar se login funciona
  - [ ] Confirmar que não aparece erro de senha

---

## 🚨 Troubleshooting

### Problema: Ainda aparece "APP_SECRET: NÃO ❌"

**Causa**: Deploy antigo ainda está rodando

**Solução**:
1. Verificar se o deploy mais recente está ativo
2. Limpar cache do navegador: `Ctrl+Shift+Delete`
3. Recarregar página com `Ctrl+F5` (hard refresh)
4. Se persistir, fazer novo redeploy manual

---

### Problema: Login funciona local mas não no Vercel

**Causa**: Senhas foram geradas localmente e não funcionam no Vercel

**Solução**: 
1. Configurar variável no Vercel (este guia)
2. Fazer login localmente com cada usuário
3. Sistema vai migrar senha para usar a chave correta
4. Agora funciona no Vercel também

---

### Problema: "Senha inválida" mesmo com senha correta

**Causas possíveis**:
1. ❌ Variável não configurada no Vercel
2. ❌ Deploy antigo sem a variável
3. ❌ Senha gerada com APP_SECRET diferente

**Solução**:
1. Configurar variável (este guia)
2. Redeploy
3. Se persistir, criar novo usuário de teste no Firebase Backup:
```javascript
{
  "email": "teste",
  "senha": "123456",  // Texto plano - será migrado
  "ativo": true,
  "nivel": 4,
  "nome": "Usuário Teste"
}
```
4. Fazer login localmente primeiro para migrar
5. Depois testar no Vercel

---

## 📊 Estrutura Visual da Configuração

```
Vercel Dashboard
├── Projects
│   └── GardenAlmoxarifado ← Selecionar este
│       ├── Overview
│       ├── Deployments
│       ├── Analytics
│       └── Settings ← Clicar aqui
│           ├── General
│           ├── Domains
│           ├── Environment Variables ← Clicar aqui
│           │   └── [Add New] ← Clicar aqui
│           │       ├── Name: REACT_APP_CRYPTO_SECRET
│           │       ├── Value: workflow-garden-secure-key-2025
│           │       ├── Environment:
│           │       │   ├── ☑ Production
│           │       │   ├── ☑ Preview
│           │       │   └── ☑ Development
│           │       └── [Save] ← Clicar aqui
│           ├── Git
│           └── ...
```

---

## 🎉 Resultado Final

Após seguir todos os passos:

### ✅ Local (Desenvolvimento)
- Login funciona ✅
- Senhas SHA-512 validam corretamente ✅
- Console mostra "APP_SECRET configurado: SIM" ✅

### ✅ Vercel (Produção)
- Login funciona ✅
- Senhas SHA-512 validam corretamente ✅
- Console mostra "APP_SECRET configurado: SIM" ✅

### ✅ Segurança
- Senhas protegidas com SHA-512 ✅
- Salt único por usuário ✅
- Chave secreta consistente ✅
- Auto-migração de senhas legadas ✅

---

## 📝 Notas Importantes

### ⚠️ Não Commitar Arquivo .env

O arquivo `.env.production` com a chave **NÃO deve** ser commitado no Git!

Ele já está no `.gitignore`:
```
# Environment variables
.env
.env.local
.env.production
.env.production.local
```

### 🔒 Segurança da Chave

A chave `workflow-garden-secure-key-2025` é segura porque:
1. Não está commitada no repositório público
2. Está apenas nas variáveis de ambiente
3. É combinada com salt único por usuário
4. Usa algoritmo SHA-512 (muito seguro)

### 🔄 Migração Automática

Quando um usuário com senha em texto plano faz login:
1. Sistema valida senha: `"senha" === "senha"` ✅
2. Gera hash SHA-512 automaticamente
3. Salva no Firebase Backup
4. Remove senha em texto plano
5. Próximo login usa SHA-512 🔒

---

## 🔗 Links Úteis

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Vercel Docs - Environment Variables**: https://vercel.com/docs/concepts/projects/environment-variables
- **Firebase Console**: https://console.firebase.google.com/
- **CryptoJS Documentation**: https://cryptojs.gitbook.io/docs/

---

**Criado em**: 4 de outubro de 2025  
**Status**: ✅ Código corrigido | ⚠️ Aguardando configuração no Vercel  
**Versão**: 2.1

**Desenvolvido com 🔒 para Garden Almoxarifado**
