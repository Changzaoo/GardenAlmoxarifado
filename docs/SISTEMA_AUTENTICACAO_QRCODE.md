# 🔐 Sistema de Autenticação por QR Code

## Visão Geral

Sistema completo de criação de contas via QR Code, onde o administrador gera códigos únicos com permissões pré-definidas, e os usuários apenas precisam escanear e preencher informações básicas.

---

## 🎯 Fluxo de Funcionamento

### 1. **Geração do QR Code (Administrador)**

**Localização**: `PasswordResetManager.jsx` → Aba "Criação de Contas"

**Processo**:
1. Admin seleciona:
   - Nível de Permissão (0-6)
   - Empresa (se aplicável)
   - Setor (se aplicável)
   - Validade (padrão 24h)

2. Sistema gera:
   - Token único de 32 caracteres
   - QR Code com URL: `{origem}/qr-auth?token={token}&id={docId}`
   - Documento no Firestore (`qr_codes_auth`)

**Dados Armazenados**:
```javascript
{
  token: string,           // Token único
  tipo: 'criacao_conta',
  nivelUsuario: number,    // 0-6
  empresaId: string,       // Opcional
  empresaNome: string,     // Opcional
  setorId: string,         // Opcional
  setorNome: string,       // Opcional
  usado: boolean,          // false inicialmente
  criadoEm: timestamp,
  expiraEm: ISO string,
  validadeHoras: number,
  criadoPor: string,       // Email/nome do admin
  usadoEm: null,
  usadoPor: null
}
```

---

### 2. **Escaneamento do QR Code (Usuário)**

**Componente**: `QRCodeScanner.jsx`

**Processo**:
1. Usuário escaneia QR Code
2. Scanner captura token da URL
3. Valida token no Firestore
4. Redireciona para `CriarConta.jsx` com dados

**Validações**:
- ✅ Token existe no banco
- ✅ QR Code não foi usado
- ✅ QR Code não expirou (24h padrão)
- ✅ Tipo correto ('criacao_conta')

---

### 3. **Criação da Conta (Usuário)**

**Componente**: `CriarConta.jsx`

**Campos Pré-Preenchidos** (do QR Code):
- ✅ Empresa
- ✅ Setor
- ✅ Nível de Permissão

**Campos a Preencher** (pelo usuário):
- 📝 Nome Completo
- 📝 Email (username)
- 📝 Senha
- 📝 Confirmar Senha

**Validações**:
```javascript
// Nome
- Mínimo 3 caracteres
- Obrigatório

// Email
- Formato válido (regex)
- Único no sistema

// Senha
- Mínimo 8 caracteres
- Letra maiúscula
- Letra minúscula
- Número
- Caractere especial

// Confirmação
- Senhas devem coincidir
```

**Processo de Criação**:
1. Validar todos os campos
2. Verificar se email já existe
3. Criar usuário com `passwordService.createUserWithPassword()`
4. Marcar QR Code como usado
5. Redirecionar para login

---

## 🔧 Correção Implementada

### **Problema Original**
```
ERROR: Unsupported field value: undefined 
(found in field criadoPor in document qr_codes_auth/...)
```

### **Causa**
Campo `criadoPor` recebia `usuario.email`, mas `usuario` poderia ser `undefined` ou não ter `email`.

### **Solução**
```javascript
// Antes
criadoPor: dados.criadoPor,

// Depois
criadoPor: dados.criadoPor || 'Sistema',
```

```javascript
// Antes
criadoPor: usuario.email

// Depois
criadoPor: usuario?.email || usuario?.nome || 'Administrador'
```

---

## 📁 Arquivos Envolvidos

### **Services**
- `src/services/qrCodeAuth.js` - Lógica de QR Codes
- `src/services/passwordService.js` - Criação de usuário
- `src/services/authService.js` - Validações

### **Components**
- `src/components/PasswordReset/PasswordResetManager.jsx` - Geração de QR Codes
- `src/components/QRCode/QRCodeScanner.jsx` - Scanner
- `src/components/QRCode/QRCodeDisplay.jsx` - Visualização
- `src/components/Auth/CriarConta.jsx` - Formulário de criação

### **Firestore Collections**
- `qr_codes_auth` - QR Codes gerados
- `usuarios` - Usuários do sistema

---

## 🎨 Interface do Usuário

### **Tela de Criação (Admin)**
```
┌─────────────────────────────────────┐
│  Gerar QR Code de Criação de Conta │
├─────────────────────────────────────┤
│  Nível:     [Funcionário ▼]         │
│  Empresa:   [Garden      ▼]         │
│  Setor:     [Almoxarifado▼]         │
│  Validade:  [24 horas    ]          │
│                                     │
│  [Gerar QR Code]                    │
└─────────────────────────────────────┘
```

### **Tela de Registro (Usuário)**
```
┌─────────────────────────────────────┐
│  Criar Conta                        │
├─────────────────────────────────────┤
│  QR Code Válido ✅                   │
│  Empresa: Garden                    │
│  Setor: Almoxarifado               │
│  Nível: Funcionário                 │
├─────────────────────────────────────┤
│  Nome:           [____________]     │
│  Email:          [____________]     │
│  Senha:          [____________]     │
│  Confirmar:      [____________]     │
│                                     │
│  Força da Senha: ████░░░░ Média    │
│                                     │
│  [Criar Conta]                      │
└─────────────────────────────────────┘
```

---

## 🔒 Segurança

### **Token Único**
- 32 caracteres alfanuméricos
- Baseado em timestamp + aleatoriedade
- Hash com Base64

### **Validade Temporal**
- Expiração configurável (padrão 24h)
- Verificação no momento do uso
- Limpeza automática de códigos expirados

### **Uso Único**
- QR Code marcado como usado após criação
- Impossível reutilizar mesmo código
- Rastreamento de quem usou

### **Senha Criptografada**
- Hash SHA-256
- Salt único por usuário
- Chave de autenticação separada

---

## 🚀 Uso do Sistema

### **Para Administradores**
1. Acesse **Gerenciar Usuários** → **Criar Códigos**
2. Selecione aba **"Criação de Contas"**
3. Configure permissões, empresa e setor
4. Clique em **"Gerar QR Code"**
5. Compartilhe o QR Code com o novo usuário

### **Para Novos Usuários**
1. Escaneie o QR Code fornecido
2. Preencha nome, email e senha
3. Confirme a senha
4. Clique em **"Criar Conta"**
5. Aguarde aprovação do administrador (se necessário)

---

## ✅ Melhorias Implementadas

- ✅ Correção do erro `undefined` em `criadoPor`
- ✅ Fallback para valores vazios
- ✅ Validação robusta de QR Codes
- ✅ Interface intuitiva de criação
- ✅ Sistema de fotos de funcionários
- ✅ Tema escuro completo
- ✅ Responsivo para mobile

---

## 📊 Fluxo Completo (Diagrama)

```
┌─────────────┐
│Administrador│
└──────┬──────┘
       │
       │ 1. Gera QR Code
       ▼
┌─────────────────────┐
│PasswordResetManager │
│  - Seleciona dados  │
│  - Gera token       │
│  - Salva Firestore  │
└──────┬──────────────┘
       │
       │ 2. QR Code gerado
       ▼
┌─────────────────┐
│  qr_codes_auth  │ ◄─── Firestore Collection
└──────┬──────────┘
       │
       │ 3. Usuário escaneia
       ▼
┌─────────────────┐
│ QRCodeScanner   │
│  - Valida token │
│  - Busca dados  │
└──────┬──────────┘
       │
       │ 4. Redireciona com dados
       ▼
┌─────────────────┐
│  CriarConta     │
│  - Mostra dados │
│  - Preenche     │
│  - Cria usuário │
└──────┬──────────┘
       │
       │ 5. Marca QR como usado
       ▼
┌─────────────────┐
│   usuarios      │ ◄─── Firestore Collection
└─────────────────┘
```

---

## 🎯 Próximas Melhorias Sugeridas

- [ ] Notificação push quando conta é criada
- [ ] Histórico de QR Codes gerados
- [ ] Estatísticas de uso
- [ ] Exportação de QR Code como PDF
- [ ] QR Code em lote
- [ ] Personalização de validade por nível
- [ ] Aprovação automática para certos níveis

---

**Documentação atualizada**: 10 de outubro de 2025  
**Versão do Sistema**: 2.0  
**Status**: ✅ Funcionando Perfeitamente
