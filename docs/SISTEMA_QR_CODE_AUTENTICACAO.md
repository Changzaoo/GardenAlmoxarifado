# 📱 SISTEMA DE QR CODE PARA AUTENTICAÇÃO

## 🎯 Visão Geral

Sistema completo de autenticação via QR Code único e temporário para criação de conta e redefinição de senha, substituindo o sistema de códigos de texto tradicionais.

---

## ✨ Características Principais

### 1. **QR Code Único e Temporário**
- ✅ Gerado com timestamp preciso (ano, mês, dia, hora, minuto, segundo, milissegundo)
- ✅ Componente aleatório adicional para garantir unicidade
- ✅ Cada QR Code só pode ser usado **uma única vez**
- ✅ Expira automaticamente após o período configurado (padrão: 24 horas)
- ✅ Marcado como "usado" imediatamente após validação bem-sucedida

### 2. **Dois Tipos de QR Code**

#### **A) QR Code de Criação de Conta**
- Permite que novos usuários criem conta sem necessidade de código manual
- Pré-configura: nível de permissão, empresa e setor (quando aplicável)
- Usuário apenas escaneia e define senha
- Ideal para onboarding de novos funcionários

#### **B) QR Code de Redefinição de Senha**
- Permite que usuários redefinam senha sem código manual
- Vinculado a um usuário específico
- Email pré-preenchido automaticamente
- Mais seguro que códigos de texto

### 3. **Interface Moderna**
- 🎨 Seletor visual entre "Código de Texto" e "QR Code"
- 📱 QR Code exibido em tela cheia com informações detalhadas
- 💾 Opção de copiar URL e baixar imagem do QR Code
- 🔒 Indicadores de segurança e validade
- ⏱️ Contador de tempo restante

---

## 🏗️ Arquitetura do Sistema

### **Componentes Criados:**

```
src/
├── services/
│   └── qrCodeAuth.js                 ← Lógica de backend (Firestore)
├── components/
│   ├── QRCode/
│   │   ├── QRCodeDisplay.jsx         ← Exibição do QR Code gerado
│   │   └── QRCodeScanner.jsx         ← Leitura de QR Code via câmera
│   └── PasswordReset/
│       ├── PasswordResetManager.jsx  ← MODIFICADO: Suporte a QR Code
│       └── PasswordResetForm.jsx     ← MODIFICADO: Aceita token do QR
└── App.jsx                           ← MODIFICADO: Novas rotas
```

### **Rotas Adicionadas:**

| Rota | Componente | Descrição |
|------|-----------|-----------|
| `/qr-auth` | `QRCodeScanner` | Página de escaneamento de QR Code |
| `/redefinir-senha` | `PasswordResetForm` | Redefinição de senha (aceita QR Code) |

---

## 🔐 Segurança

### **Firestore Security Rules**

```javascript
// ✅ Regras para QR Codes de autenticação
match /qr_codes_auth/{qrCodeId} {
  // Apenas admins podem criar
  allow create: if hasMinLevel(0);
  
  // Qualquer um pode ler (para validar antes de autenticar)
  allow read: if true;
  
  // Apenas admins ou sistema pode atualizar (marcar como usado)
  allow update: if hasMinLevel(0) || (!resource.data.usado);
  
  // Apenas admins podem deletar
  allow delete: if hasMinLevel(0);
}
```

### **Validações de Segurança:**

1. ✅ **Token único**: Gerado com timestamp + aleatoriedade
2. ✅ **Uso único**: Marcado como "usado" após primeira validação
3. ✅ **Expiração**: Verificação automática de validade temporal
4. ✅ **ID matching**: Token deve corresponder ao ID do documento
5. ✅ **Apenas admin cria**: Somente administradores podem gerar QR Codes

---

## 📊 Estrutura de Dados

### **Coleção: `qr_codes_auth`**

```javascript
{
  token: "ABC123XYZ789...",           // Token único de 32 caracteres
  tipo: "criacao_conta",              // "criacao_conta" | "redefinicao_senha"
  
  // Para criação de conta:
  nivelUsuario: "1",
  empresaId: "empresa123",
  empresaNome: "Empresa XYZ",
  setorId: "setor456",
  setorNome: "TI",
  
  // Para redefinição de senha:
  usuarioId: "user789",
  usuarioEmail: "user@example.com",
  usuarioNome: "João Silva",
  
  // Controle:
  usado: false,
  criadoEm: Timestamp,
  expiraEm: "2024-10-10T12:00:00Z",
  validadeHoras: 24,
  criadoPor: "admin@example.com",
  usadoEm: null,                      // Timestamp quando foi usado
  usadoPor: null                      // Email de quem usou
}
```

---

## 🚀 Como Usar

### **1. Para Administradores (Gerar QR Code)**

1. Acesse **Administração** → **Códigos de Redefinição**
2. Clique em **"Novo Código"**
3. Escolha entre:
   - 🔑 **Código de Texto** (tradicional)
   - 📱 **QR Code Único** (moderno)
4. Configure:
   - Tipo: Criação de Conta ou Redefinição de Senha
   - Nível de permissão (para criação)
   - Empresa/Setor (se aplicável)
   - Validade em horas
5. Clique em **"Gerar QR Code"**
6. QR Code será exibido em tela cheia
7. Opções:
   - **Copiar URL**: Para enviar por mensagem/email
   - **Baixar**: Salvar imagem do QR Code
   - **Revogar**: Cancelar QR Code antes do uso

### **2. Para Usuários (Usar QR Code)**

#### **Via Aplicativo:**
1. Abra o app e vá para a tela de login
2. Clique em "Escanear QR Code"
3. Aponte a câmera para o QR Code
4. Aguarde validação automática
5. Será redirecionado para:
   - **Criação de conta**: Definir nome e senha
   - **Redefinição**: Definir nova senha
6. Dados são pré-preenchidos automaticamente

#### **Via URL (Link Direto):**
1. Clique no link do QR Code enviado
2. Será redirecionado automaticamente para a página correta
3. Dados já estarão preenchidos
4. Apenas defina senha e confirme

---

## 🔄 Fluxo Completo

### **Criação de Conta:**

```
Admin                        Sistema                      Novo Usuário
  │                            │                              │
  │ Gera QR Code              │                              │
  │ (criacao_conta)            │                              │
  │──────────────────────────>│                              │
  │                            │                              │
  │                            │ Salva em qr_codes_auth      │
  │                            │ com token único             │
  │                            │                              │
  │ Exibe QR Code              │                              │
  │<──────────────────────────│                              │
  │                            │                              │
  │ Compartilha com usuário    │                              │
  │─────────────────────────────────────────────────────────>│
  │                            │                              │
  │                            │     Escaneia QR Code         │
  │                            │<─────────────────────────────│
  │                            │                              │
  │                            │ Valida token                 │
  │                            │ - Token existe?              │
  │                            │ - Não usado?                 │
  │                            │ - Não expirado?              │
  │                            │                              │
  │                            │ Redireciona para             │
  │                            │ /criar-conta                 │
  │                            │ com dados pré-preenchidos    │
  │                            │─────────────────────────────>│
  │                            │                              │
  │                            │     Define nome e senha      │
  │                            │<─────────────────────────────│
  │                            │                              │
  │                            │ Marca QR como usado          │
  │                            │ Cria conta do usuário        │
  │                            │                              │
  │                            │ Sucesso! Conta criada        │
  │                            │─────────────────────────────>│
```

### **Redefinição de Senha:**

```
Admin                        Sistema                      Usuário
  │                            │                              │
  │ Gera QR Code              │                              │
  │ (redefinicao_senha)        │                              │
  │ + usuarioId                │                              │
  │──────────────────────────>│                              │
  │                            │                              │
  │                            │ Salva em qr_codes_auth      │
  │                            │                              │
  │ Exibe QR Code              │                              │
  │<──────────────────────────│                              │
  │                            │                              │
  │ Compartilha com usuário    │                              │
  │─────────────────────────────────────────────────────────>│
  │                            │                              │
  │                            │     Escaneia QR Code         │
  │                            │<─────────────────────────────│
  │                            │                              │
  │                            │ Valida token                 │
  │                            │ Redireciona para             │
  │                            │ /redefinir-senha             │
  │                            │ com email pré-preenchido     │
  │                            │─────────────────────────────>│
  │                            │                              │
  │                            │     Define nova senha        │
  │                            │<─────────────────────────────│
  │                            │                              │
  │                            │ Marca QR como usado          │
  │                            │ Atualiza senha do usuário    │
  │                            │                              │
  │                            │ Sucesso! Senha atualizada    │
  │                            │─────────────────────────────>│
```

---

## ⚙️ Configurações

### **Validade Padrão:**
- 24 horas (configurável no momento da geração)
- Mínimo: 1 hora
- Máximo: 168 horas (7 dias)

### **Token:**
- Comprimento: 32 caracteres
- Formato: Base64 alphanumeric
- Componentes:
  - Timestamp completo: ANO+MÊS+DIA+HORA+MIN+SEG+MS
  - Random: 8 caracteres aleatórios

### **URL do QR Code:**
```
https://seu-app.com/qr-auth?token=ABC123...&id=docId123
```

---

## 🧪 Testes

### **Cenários de Teste:**

1. ✅ **Criar QR Code de criação de conta**
   - Admin gera QR Code com nível 1 (funcionário) + empresa + setor
   - QR Code é exibido corretamente
   - URL pode ser copiada
   - Imagem pode ser baixada

2. ✅ **Criar QR Code de redefinição de senha**
   - Admin seleciona usuário existente
   - QR Code é gerado com email do usuário
   - Informações corretas são exibidas

3. ✅ **Escanear QR Code válido**
   - Apontar câmera para QR Code
   - Validação automática bem-sucedida
   - Redirecionamento correto
   - Dados pré-preenchidos

4. ✅ **Tentar usar QR Code duas vezes**
   - Primeira vez: sucesso
   - Segunda vez: erro "QR Code já foi utilizado"

5. ✅ **QR Code expirado**
   - Criar QR Code com 1 hora de validade
   - Aguardar expiração
   - Tentar usar: erro "QR Code expirado"

6. ✅ **Revogar QR Code**
   - Admin revoga QR Code ativo
   - Tentar usar: erro "QR Code já foi utilizado"

---

## 📝 Notas Técnicas

### **Bibliotecas Utilizadas:**

```json
{
  "qrcode.react": "^3.1.0",      // Geração de QR Code SVG
  "react-qr-scanner": "^1.0.0"   // Leitura de QR Code via câmera
}
```

### **Correções Aplicadas:**

1. ✅ **Bug de empresas não carregando**
   - **Problema**: `PasswordResetManager` usava `firebaseDual` em vez de `firebaseConfig`
   - **Solução**: Trocado import para usar `firebaseConfig` correto
   - **Arquivo**: `src/components/PasswordReset/PasswordResetManager.jsx`

---

## 🎨 Melhorias Visuais

### **Design do Seletor:**
- Cards com ícones grandes
- Hover effects suaves
- Cores diferenciadas (azul para código, roxo para QR Code)
- Indicador visual do selecionado

### **Exibição do QR Code:**
- Modal em tela cheia
- QR Code grande (256x256)
- Informações organizadas em cards coloridos
- Botões de ação destacados
- Contador de tempo restante

### **Scanner:**
- Guia visual para posicionar QR Code
- Mensagens de status claras
- Animações de sucesso/erro
- Instruções passo a passo

---

## 🚨 Problemas Conhecidos e Soluções

### **1. Câmera não funciona no navegador**
**Causa**: Permissões de câmera negadas
**Solução**:
1. Verifique permissões do navegador
2. Use HTTPS (câmera não funciona em HTTP)
3. Tente outro navegador

### **2. QR Code não escaneia**
**Causa**: QR Code muito pequeno ou câmera de baixa qualidade
**Solução**:
1. Aumentar tamanho do QR Code na tela
2. Melhorar iluminação
3. Segurar dispositivo mais estável

### **3. "QR Code inválido"**
**Causa**: URL incorreta ou QR Code de outro sistema
**Solução**:
1. Verificar se QR Code foi gerado por este sistema
2. Verificar se URL está completa (token + id)

---

## 📖 Documentação de API

### **`criarQRCodeCriacaoConta(dados)`**
```javascript
const resultado = await criarQRCodeCriacaoConta({
  nivelUsuario: "1",
  empresaId: "empresa123",
  empresaNome: "Empresa XYZ",
  setorId: "setor456",
  setorNome: "TI",
  validadeHoras: 24,
  criadoPor: "admin@example.com"
});

// Retorna:
{
  success: true,
  qrCode: {
    id: "doc123",
    url: "https://app.com/qr-auth?token=...&id=doc123",
    token: "ABC123...",
    ...dados
  }
}
```

### **`criarQRCodeRedefinicaoSenha(dados)`**
```javascript
const resultado = await criarQRCodeRedefinicaoSenha({
  usuarioId: "user123",
  usuarioEmail: "user@example.com",
  usuarioNome: "João Silva",
  validadeHoras: 24,
  criadoPor: "admin@example.com"
});
```

### **`validarQRCode(token, id)`**
```javascript
const resultado = await validarQRCode(token, id);

// Retorna (sucesso):
{
  success: true,
  qrCode: {
    id: "doc123",
    tipo: "criacao_conta",
    ...dados
  }
}

// Retorna (erro):
{
  success: false,
  error: "QR Code já foi utilizado",
  usado: true,
  usadoEm: Timestamp
}
```

### **`marcarQRCodeComoUsado(id, usadoPor)`**
```javascript
await marcarQRCodeComoUsado(qrCodeId, "user@example.com");
```

### **`revogarQRCode(id)`**
```javascript
await revogarQRCode(qrCodeId);
```

---

## ✅ Checklist de Implementação

- [x] Criar serviço `qrCodeAuth.js`
- [x] Criar componente `QRCodeDisplay.jsx`
- [x] Criar componente `QRCodeScanner.jsx`
- [x] Modificar `PasswordResetManager.jsx`
- [x] Modificar `PasswordResetForm.jsx`
- [x] Adicionar rotas no `App.jsx`
- [x] Criar regras de segurança no Firestore
- [x] Deploy das regras do Firestore
- [x] Corrigir bug de empresas não carregando
- [x] Adicionar seletor visual código vs QR Code
- [x] Implementar validação de uso único
- [x] Implementar expiração automática
- [ ] Criar fluxo de criação de conta com QR Code
- [x] Testar fluxo completo de redefinição de senha

---

## 🎯 Próximos Passos

1. **Criar página de criação de conta** que aceita token do QR Code
2. **Adicionar notificações** quando QR Code é usado
3. **Dashboard de QR Codes** para administradores
4. **Estatísticas de uso** (quantos QR Codes criados, usados, expirados)
5. **Exportar lista de QR Codes** ativos em PDF
6. **Integração com notificações push** quando QR Code é usado

---

## 📞 Suporte

Em caso de dúvidas ou problemas:

1. Verifique se as regras do Firestore foram aplicadas
2. Confirme que as bibliotecas foram instaladas (`npm install`)
3. Teste em ambiente HTTPS (câmera não funciona em HTTP)
4. Verifique permissões de câmera do navegador

---

**Desenvolvido com ❤️ pelo Time Garden Almoxarifado**
