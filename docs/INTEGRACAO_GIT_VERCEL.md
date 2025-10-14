# 🚀 Integração Git + Vercel - Sistema de Atualizações

## 📋 Visão Geral

Sistema completamente integrado com GitHub e Vercel que rastreia automaticamente deploys, commits e informações de build, vinculando-os às atualizações do aplicativo.

---

## 🎯 Funcionalidades Implementadas

### ✅ 1. Geração Automática de Informações de Deploy

**Script: `scripts/generate-version.js`**

Executado automaticamente a cada build (`prebuild` script), coleta:

#### Git Information:
- ✅ Commit hash (curto e completo)
- ✅ Branch name
- ✅ Commit message
- ✅ Commit author
- ✅ Commit date
- ✅ Remote repository URL

#### Vercel Information (quando disponível):
- ✅ Environment (production/preview/development)
- ✅ Deployment URL
- ✅ Commit SHA
- ✅ Commit message
- ✅ Commit author
- ✅ Repository owner/slug

#### Build Information:
- ✅ Version (package.json)
- ✅ Build number (timestamp único)
- ✅ Build date/time
- ✅ Environment

---

## 📁 Estrutura de Arquivos

### 1. `public/version.json`

Arquivo gerado automaticamente a cada build:

```json
{
  "version": "1.0.0",
  "buildDate": "2025-10-14T13:24:14.551Z",
  "buildNumber": 1760448254552,
  "buildId": "build-1760448254552",
  "environment": "production",
  "timestamp": 1760448254552,
  "git": {
    "commit": "5bb670cd",
    "commitFull": "5bb670cd1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p",
    "branch": "main",
    "message": "feat: add update system with git integration",
    "author": "Vinícius Silva",
    "date": "2025-10-14T13:20:00.000Z",
    "remoteUrl": "https://github.com/Changzaoo/GardenAlmoxarifado.git"
  },
  "vercel": {
    "env": "production",
    "url": "workflow-garden.vercel.app",
    "commitSha": "5bb670cd1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p",
    "commitMessage": "feat: add update system with git integration",
    "commitAuthor": "Vinícius Silva",
    "commitRef": "main",
    "repoOwner": "Changzaoo",
    "repoSlug": "GardenAlmoxarifado"
  }
}
```

### 2. `src/components/Updates/DeployInfo.jsx`

Componente React que exibe informações de deploy:
- Versão atual
- Build number e data
- Informações do commit (hash, mensagem, autor)
- Branch
- Links para GitHub (repositório e commit específico)
- Informações do Vercel (se disponível)

### 3. `src/components/Updates/AppUpdateManager.jsx`

Gerenciador de atualizações MODIFICADO para:
- Carregar automaticamente versão do `version.json`
- Anexar informações de deploy às atualizações
- Exibir informações do commit na atualização ativa
- Mostrar componente `DeployInfo` com detalhes completos

---

## 🔄 Fluxo de Deploy → Atualização

### 1. **Developer Faz Commit**
```bash
git add .
git commit -m "feat: nova funcionalidade X"
git push origin main
```

### 2. **Vercel Detecta Push**
- Webhook do GitHub aciona Vercel
- Vercel inicia processo de build
- Define variáveis de ambiente:
  - `VERCEL_ENV`
  - `VERCEL_URL`
  - `VERCEL_GIT_COMMIT_SHA`
  - `VERCEL_GIT_COMMIT_MESSAGE`
  - `VERCEL_GIT_COMMIT_AUTHOR_NAME`
  - E outras...

### 3. **Build Executa Script**
```json
// package.json
{
  "scripts": {
    "prebuild": "node scripts/generate-version.js",
    "build": "react-scripts build"
  }
}
```

**Script `generate-version.js` coleta:**
1. Informações do Git via `execSync`
2. Variáveis de ambiente do Vercel
3. Gera `public/version.json`

### 4. **Deploy Completo**
- Build finalizado
- `version.json` disponível em `/version.json`
- Aplicativo atualizado

### 5. **Admin Cria Atualização**
1. Acessa `Administração do Sistema` > `Atualizações do App`
2. Vê informações do deploy atual (componente `DeployInfo`)
3. Clica em "Criar Atualização"
4. Versão já preenchida automaticamente
5. Sistema busca `version.json` automaticamente
6. Ao enviar, informações do commit são anexadas:

```javascript
{
  versao: "1.0.0",
  titulo: "Nova funcionalidade X",
  descricao: "...",
  // ... outros campos
  deploy: {
    buildNumber: 1760448254552,
    buildDate: "2025-10-14T13:24:14.551Z",
    gitCommit: "5bb670cd",
    gitCommitFull: "5bb670cd1a2b...",
    gitBranch: "main",
    gitMessage: "feat: nova funcionalidade X",
    gitAuthor: "Vinícius Silva",
    gitDate: "2025-10-14T13:20:00.000Z",
    vercelEnv: "production",
    vercelUrl: "workflow-garden.vercel.app"
  }
}
```

### 6. **Usuários Veem Notificação**
- Modal com informações da atualização
- Inclui detalhes do commit e deploy
- Links para GitHub (se disponível)

---

## 🛠️ Configuração

### Variáveis de Ambiente Vercel

O Vercel fornece automaticamente essas variáveis durante o build:

```bash
# Ambiente
VERCEL_ENV=production|preview|development

# URL do deploy
VERCEL_URL=workflow-garden.vercel.app

# Git Info
VERCEL_GIT_PROVIDER=github
VERCEL_GIT_REPO_OWNER=Changzaoo
VERCEL_GIT_REPO_SLUG=GardenAlmoxarifado
VERCEL_GIT_REPO_ID=123456789
VERCEL_GIT_COMMIT_REF=main
VERCEL_GIT_COMMIT_SHA=5bb670cd1a2b3c4d...
VERCEL_GIT_COMMIT_MESSAGE=feat: add update system
VERCEL_GIT_COMMIT_AUTHOR_LOGIN=Changzaoo
VERCEL_GIT_COMMIT_AUTHOR_NAME=Vinícius Silva
```

**Nenhuma configuração manual necessária!** ✨

### Package.json

```json
{
  "scripts": {
    "prebuild": "node scripts/generate-version.js",
    "build": "react-scripts build",
    "start": "react-scripts start"
  }
}
```

---

## 📊 Componentes Visuais

### 1. **DeployInfo Component**

Exibe:
- 📦 Card de Deploy Atual (versão, build number)
- 🌿 Card Git Info (commit, branch, autor, mensagem)
- ☁️ Card Vercel Info (ambiente, URL)
- 🔗 Links diretos para:
  - Repositório GitHub
  - Commit específico no GitHub
  - Deploy no Vercel

### 2. **AppUpdateManager - Atualização Ativa**

Quando há atualização ativa, mostra:
- Informações básicas (título, descrição, changelog)
- **NOVO:** Box "DEPLOY INFO" com:
  - Commit hash
  - Mensagem do commit
  - Autor
  - Data/hora do build
  - URL Vercel (se disponível)

### 3. **Modal de Criação**

- Versão preenchida automaticamente
- Aviso mostrando quantos usuários elegíveis

---

## 🔗 Links Automáticos

### GitHub Repository
```
https://github.com/{owner}/{repo}
```

### GitHub Commit
```
https://github.com/{owner}/{repo}/commit/{commitSha}
```

### Vercel Deployment
```
https://{vercelUrl}
```

---

## 📝 Exemplo Completo

### 1. Developer Commit
```bash
git commit -m "fix: corrigir bug no carregamento de imagens"
git push origin main
```

### 2. Vercel Build
```
✅ Build iniciado
📦 Instalando dependências
🔧 Executando prebuild (generate-version.js)
   📦 Versão: 1.0.0
   🔢 Build: 1760448254552
   📅 Data: 2025-10-14T13:24:14.551Z
   🌿 Branch: main
   💾 Commit: 5bb670cd
   👤 Autor: Vinícius Silva
   💬 Mensagem: fix: corrigir bug no carregamento de imagens
   🔷 Vercel Env: production
   🌐 Vercel URL: workflow-garden.vercel.app
🏗️ Compilando aplicação
✅ Deploy completo!
```

### 3. version.json Gerado
```json
{
  "version": "1.0.0",
  "buildNumber": 1760448254552,
  "git": {
    "commit": "5bb670cd",
    "message": "fix: corrigir bug no carregamento de imagens",
    "author": "Vinícius Silva",
    "branch": "main"
  },
  "vercel": {
    "env": "production",
    "url": "workflow-garden.vercel.app"
  }
}
```

### 4. Admin Vê no Painel
```
┌─────────────────────────────────────┐
│ 🚀 Deploy Atual                     │
│ Versão 1.0.0                        │
│                                     │
│ BUILD: 1760448254552                │
│ 14/10/2025, 10:24                   │
│                                     │
│ 🌿 Git Info                         │
│ Commit: 5bb670cd                    │
│ fix: corrigir bug no carregamento...│
│ Autor: Vinícius Silva               │
│ Branch: main                        │
│ [Ver no GitHub →]                   │
│                                     │
│ ☁️ Vercel Deployment                │
│ Ambiente: PRODUCTION                │
│ URL: workflow-garden.vercel.app     │
└─────────────────────────────────────┘
```

### 5. Admin Cria Atualização

Campo "Versão" já preenchido com `1.0.0`

Ao enviar, Firebase salva:
```javascript
{
  versao: "1.0.0",
  titulo: "Correção de Bug - Carregamento de Imagens",
  descricao: "Corrigido problema que impedia...",
  tipo: "recomendada",
  prioridade: "alta",
  changelog: "• Corrigido bug no SafeImage\n• Melhorias...",
  deploy: {
    gitCommit: "5bb670cd",
    gitMessage: "fix: corrigir bug no carregamento de imagens",
    gitAuthor: "Vinícius Silva",
    buildDate: "2025-10-14T13:24:14.551Z",
    vercelUrl: "workflow-garden.vercel.app"
  }
}
```

### 6. Usuários Veem
```
┌─────────────────────────────────────┐
│ 🔵 Nova Atualização                 │
│ Versão 1.0.0                        │
│                                     │
│ Correção de Bug - Carregamento...  │
│ Corrigido problema que impedia...  │
│                                     │
│ O QUE HÁ DE NOVO:                   │
│ • Corrigido bug no SafeImage       │
│ • Melhorias de performance          │
│                                     │
│ 📦 DEPLOY INFO:                     │
│ Commit: 5bb670cd                    │
│ Mensagem: fix: corrigir bug...     │
│ Autor: Vinícius Silva               │
│ Build: 14/10/2025, 10:24            │
│                                     │
│ [Mais Tarde] [Atualizar Agora →]   │
└─────────────────────────────────────┘
```

---

## ✅ Checklist de Implementação

- [x] Script `generate-version.js` melhorado
- [x] Coleta de informações Git completas
- [x] Integração com variáveis Vercel
- [x] Geração de `version.json` automática
- [x] Componente `DeployInfo` criado
- [x] Integração no `AppUpdateManager`
- [x] Preenchimento automático de versão
- [x] Anexar deploy info em atualizações
- [x] Exibir deploy info em atualizações ativas
- [x] Links para GitHub automáticos
- [x] Formatação de datas PT-BR
- [x] Design responsivo e dark mode
- [x] Documentação completa

---

## 🎯 Benefícios

1. **Rastreabilidade Total:**
   - Cada atualização vinculada a commit específico
   - Histórico completo de deploys
   - Transparência sobre o que mudou

2. **Automação Completa:**
   - Zero configuração manual
   - Informações coletadas automaticamente
   - Versão sempre sincronizada

3. **Transparência:**
   - Usuários veem quem fez as mudanças
   - Mensagem do commit contexto
   - Links diretos para código

4. **Debugging Facilitado:**
   - Identificar rapidamente qual deploy causou problema
   - Correlacionar bugs com commits
   - Rollback informado

---

## 🔮 Melhorias Futuras

- [ ] Webhook do Vercel para criar atualização automática
- [ ] Notificação Slack/Discord quando deploy completo
- [ ] Comparar versões e mostrar diff
- [ ] Integração com GitHub Releases
- [ ] Deploy rollback direto do painel
- [ ] Analytics de taxa de atualização por deploy
- [ ] Preview de deploy antes de promover

---

**Criado em:** 14/10/2025  
**Versão:** 2.0.0  
**Status:** ✅ Implementado e Integrado
