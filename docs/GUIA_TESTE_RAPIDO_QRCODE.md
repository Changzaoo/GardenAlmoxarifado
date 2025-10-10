# 🧪 Guia Rápido de Teste - QR Code Simplificado

## ✅ O Que Foi Corrigido

### Problema 1: Link do QR Code não redirecionava
**Status**: ✅ RESOLVIDO
- Adicionada rota `/criar-conta` no `App.jsx`
- Redirecionamento funcionando corretamente

### Problema 2: Email obrigatório no formulário
**Status**: ✅ RESOLVIDO
- Removido campo de email
- Adicionado campo de Nome Público (username)
- Formulário agora solicita apenas: Nome, Username e Senha

---

## 🎯 Teste Rápido (5 minutos)

### Passo 1: Gerar QR Code
1. Faça login como **Admin**
2. Vá em **Gerenciar Usuários**
3. Clique em **"Criar Códigos"**
4. Selecione aba **"Criação de Contas"**
5. Preencha:
   - Nível: Funcionário
   - Empresa: Garden (se aplicável)
   - Setor: Almoxarifado (se aplicável)
   - Validade: 24 horas
6. Clique em **"Gerar QR Code"**
7. ✅ **Copie a URL** gerada

---

### Passo 2: Acessar Link
1. Abra uma **nova aba anônima** (Ctrl + Shift + N)
2. Cole a URL copiada
3. Pressione Enter

**O que deve acontecer**:
```
1. Carrega: /qr-auth?token=ABC&id=123
   ↓ (1.5 segundos)
2. Mensagem: "Validando QR Code..."
   ↓
3. Mensagem: "QR Code válido! Redirecionando..."
   ↓
4. Redireciona para: /criar-conta
```

---

### Passo 3: Criar Conta (Novo Formulário)
Você deve ver:

```
┌────────────────────────────────────────┐
│  ← Voltar    Criar Conta               │
├────────────────────────────────────────┤
│  ✅ QR Code validado com sucesso       │
│  Empresa: Garden                       │
│  Setor: Almoxarifado                  │
├────────────────────────────────────────┤
│  Nome Completo                         │
│  👤 [_____________________]            │
│  Seu nome real (visível apenas...     │
│                                        │
│  Nome Público (Username)               │
│  👤 [_____________________]            │
│  Apenas letras, números e under...    │
│                                        │
│  Senha                                 │
│  🔒 [_____________________] 👁         │
│  [Indicador de Força]                  │
│                                        │
│  Confirmar Senha                       │
│  🔒 [_____________________] 👁         │
│                                        │
│  [Criar Conta]                         │
└────────────────────────────────────────┘
```

**Preencha**:
- Nome Completo: `Teste Usuario`
- Nome Público: `teste_usuario`
- Senha: `Teste@123`
- Confirmar Senha: `Teste@123`

**Clique em**: `Criar Conta`

---

### Passo 4: Verificar Sucesso
Deve aparecer:

```
┌────────────────────────────────────────┐
│           ✅ (ícone grande)            │
│                                        │
│          Conta Criada!                 │
│                                        │
│  Sua conta foi criada com sucesso     │
│  e está aguardando aprovação do       │
│  administrador.                        │
│                                        │
│  Seu nome público: @teste_usuario     │
│                                        │
│  [Voltar para Login]                   │
└────────────────────────────────────────┘
```

**Aguarde 3 segundos** → Redireciona automaticamente para `/login`

---

## 🎭 Testes de Validação

### Teste A: Nome Público Inválido

#### Com espaço ❌
- Nome Público: `teste usuario`
- Erro esperado: "Nome público deve conter apenas letras, números e underline (_)"

#### Caracteres especiais ❌
- Nome Público: `teste@123`
- Erro esperado: "Nome público deve conter apenas letras, números e underline (_)"

#### Muito curto ❌
- Nome Público: `ab`
- Erro esperado: "Nome público deve ter no mínimo 3 caracteres"

#### Formato correto ✅
- Nome Público: `joao_silva_123`
- Deve aceitar normalmente

---

### Teste B: Senha Fraca

#### Sem números ❌
- Senha: `SenhaForte!`
- Erro esperado: "Senha deve conter pelo menos um número"

#### Sem maiúsculas ❌
- Senha: `senha@123`
- Erro esperado: "Senha deve conter pelo menos uma letra maiúscula"

#### Sem especial ❌
- Senha: `Senha123`
- Erro esperado: "Senha deve conter pelo menos um caractere especial"

#### Muito curta ❌
- Senha: `Se@1`
- Erro esperado: "Senha deve ter no mínimo 8 caracteres"

#### Senha forte ✅
- Senha: `Senha@123`
- Deve mostrar indicador verde: "Senha muito forte"

---

### Teste C: Nome Público Duplicado

1. Crie conta com nome público: `usuario_teste`
2. Gere novo QR Code
3. Tente criar outra conta com: `usuario_teste`
4. **Erro esperado**: "Este nome público já está em uso. Escolha outro."

---

### Teste D: QR Code Usado

1. Use um QR Code para criar conta
2. Copie a URL usada
3. Tente usar a mesma URL novamente
4. **Erro esperado**: "Este QR Code já foi utilizado"

---

## 🔍 Checklist Completo

### Geração
- [ ] Admin consegue gerar QR Code
- [ ] URL é exibida corretamente
- [ ] QR Code visual aparece

### Redirecionamento
- [ ] Link redireciona para `/qr-auth`
- [ ] Validação automática funciona
- [ ] Redireciona para `/criar-conta` após validação
- [ ] Mensagens de progresso aparecem

### Formulário
- [ ] Badge verde "QR Code validado" aparece
- [ ] Empresa e setor são mostrados
- [ ] Campo "Nome Completo" presente
- [ ] Campo "Nome Público" presente
- [ ] Campo "Senha" com indicador de força
- [ ] Campo "Confirmar Senha" presente
- [ ] Botão "Criar Conta" visível

### Validações
- [ ] Nome público não aceita espaços
- [ ] Nome público não aceita caracteres especiais
- [ ] Nome público único (não permite duplicatas)
- [ ] Senha forte é exigida
- [ ] Senhas devem coincidir

### Criação
- [ ] Conta é criada com sucesso
- [ ] QR Code é marcado como usado
- [ ] Mensagem de sucesso aparece
- [ ] Mostra nome público criado
- [ ] Redireciona para login após 3s

### Verificação no Firebase
- [ ] Documento criado em `usuarios`
- [ ] Campo `nome` preenchido
- [ ] Campo `nomePublico` preenchido
- [ ] Campo `email` vazio
- [ ] Campo `empresaId` preenchido
- [ ] Campo `setorId` preenchido
- [ ] Campo `ativo` = false
- [ ] Campo `nivel` = 1
- [ ] QR Code em `qr_codes_auth` marcado como `usado: true`

---

## 🐛 Se Algo Der Errado

### Problema: Não redireciona
**Console**: Verificar erros no console do navegador (F12)
**Causa**: Possível erro na validação do QR Code
**Solução**: Gerar novo QR Code

### Problema: "QR Code inválido"
**Causa**: Token ou ID incorreto na URL
**Solução**: Copiar URL completa novamente

### Problema: "QR Code expirado"
**Causa**: QR Code gerado há mais de 24h
**Solução**: Gerar novo QR Code

### Problema: Nome público já existe
**Causa**: Username já cadastrado
**Solução**: Escolher outro nome público

---

## ✅ Resultado Esperado

### Banco de Dados
```javascript
// Coleção: usuarios
{
  id: "abc123xyz",
  nome: "Teste Usuario",
  nomePublico: "teste_usuario",
  email: "",
  authKey: "Teste@123",
  senhaHash: "...",
  senhaSalt: "...",
  nivel: 1,
  ativo: false,
  empresaId: "EMP001",
  empresaNome: "Garden",
  setorId: "SET001",
  setorNome: "Almoxarifado",
  dataCriacao: Timestamp,
  dataAlteracaoSenha: Timestamp
}

// Coleção: qr_codes_auth
{
  id: "qr123",
  token: "abc...",
  tipo: "criacao_conta",
  usado: true,
  usadoEm: Timestamp,
  usadoPor: "abc123xyz",
  empresaId: "EMP001",
  setorId: "SET001",
  criadoEm: Timestamp
}
```

---

## 🎯 Resumo das Mudanças

| O que mudou | Antes | Agora |
|-------------|-------|-------|
| Campos do formulário | 4 campos | 3 campos |
| Email obrigatório? | ✅ Sim | ❌ Não |
| Nome público | ❌ Não tinha | ✅ Sim |
| Validação de username | ❌ Não | ✅ Sim |
| Tempo de preenchimento | ~45s | ~30s |
| Experiência do usuário | Complicada | Simplificada |

---

**Pronto para testar!** 🚀

Se encontrar qualquer problema, verifique:
1. Console do navegador (F12)
2. Firestore Database
3. Erros na criação da conta
4. QR Code está válido (não expirado, não usado)
