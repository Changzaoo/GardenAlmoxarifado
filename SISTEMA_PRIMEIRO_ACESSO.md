# 🔐 Sistema de Primeiro Acesso e Recuperação de Senha

## Visão Geral

Sistema completo de autenticação com configuração de senha personalizada no primeiro acesso e recuperação de senha através de pergunta secreta.

## 📋 Componentes Criados

### 1. PrimeiroAcessoModal.jsx

**Localização:** `src/components/Auth/PrimeiroAcessoModal.jsx`

**Funcionalidade:**
- Modal exibido automaticamente quando usuário faz login pela primeira vez
- Solicita criação de senha personalizada
- Solicita configuração de pergunta e resposta secreta
- Validação de requisitos de senha em tempo real
- Interface em 2 etapas com barra de progresso

**Quando é exibido:**
- Usuário possui senha padrão "123456" em texto plano
- Usuário não possui `fraseSecreta` configurada

**Recursos:**
- ✅ Validação de senha (mínimo 6 caracteres, maiúscula, minúscula, número)
- ✅ Indicadores visuais de requisitos atendidos
- ✅ Confirmação de senha
- ✅ Mostrar/ocultar senha
- ✅ Tema dark mode
- ✅ Animações suaves
- ✅ Não pode ser fechado (obrigatório completar)

**Props:**
```javascript
<PrimeiroAcessoModal
  usuario={objeto}       // Objeto do usuário logado
  onComplete={function}  // Callback após conclusão
/>
```

**Dados salvos no Firestore:**
```javascript
{
  senhaHash: string,              // SHA-512 hash da senha
  senhaSalt: string,              // Salt único para criptografia
  senhaVersion: number,           // Versão do algoritmo (2)
  senha: null,                    // Remove senha em texto plano
  fraseSecreta: string,           // Pergunta de segurança
  respostaSecretaHash: string,    // Hash da resposta
  respostaSecretaSalt: string,    // Salt da resposta
  primeiroAcesso: false,          // Flag de primeiro acesso
  dataAlteracaoSenha: string      // ISO timestamp
}
```

---

### 2. RecuperarSenhaModal.jsx

**Localização:** `src/components/Auth/RecuperarSenhaModal.jsx`

**Funcionalidade:**
- Modal de recuperação de senha com 3 etapas
- Busca usuário por email
- Exibe pergunta secreta **parcialmente oculta**
- Valida resposta do usuário
- Permite criação de nova senha

**Quando é exibido:**
- Usuário clica em "Esqueci minha senha" na tela de login

**Recursos:**
- ✅ Busca por email no Firestore
- ✅ Ocultação inteligente da pergunta secreta
- ✅ Validação de resposta (case-insensitive)
- ✅ Mesmas validações de senha do primeiro acesso
- ✅ Pode ser fechado a qualquer momento
- ✅ Tema dark mode

**Props:**
```javascript
<RecuperarSenhaModal
  onClose={function}    // Callback para fechar modal
  onSuccess={function}  // Callback após recuperação bem-sucedida
/>
```

**Etapas:**

1. **Email:**
   - Usuário digita email
   - Sistema busca no Firestore
   - Valida se possui `fraseSecreta`

2. **Resposta Secreta:**
   - Exibe pergunta parcialmente oculta
   - Usuário responde
   - Validação com hash SHA-512

3. **Nova Senha:**
   - Usuário cria nova senha
   - Mesmas validações do primeiro acesso
   - Salva com criptografia SHA-512

**Algoritmo de Ocultação:**

```javascript
// Exemplo 1: Frase curta (≤2 palavras)
"Qual seu animal?" → "Qual **** animal?"

// Exemplo 2: Frase longa (>2 palavras)
"Qual o nome do seu primeiro animal de estimação?"
→ "Qual ******** estimação?"
// Mostra primeira e última palavra, oculta o meio
```

---

## 🔄 Integração no Workflow.jsx

### 1. Imports Adicionados
```javascript
import PrimeiroAcessoModal from './Auth/PrimeiroAcessoModal';
import RecuperarSenhaModal from './Auth/RecuperarSenhaModal';
```

### 2. States Adicionados no AuthProvider
```javascript
const [showPrimeiroAcesso, setShowPrimeiroAcesso] = useState(false);
const [showRecuperarSenha, setShowRecuperarSenha] = useState(false);
```

### 3. Modificação na Função de Login

**Antes:**
```javascript
setUsuario(usuarioAtualizado);
return { success: true };
```

**Depois:**
```javascript
// Verificar se é primeiro acesso
const isPrimeiroAcesso = usuarioEncontrado.senha === '123456' && !usuarioEncontrado.fraseSecreta;

const usuarioAtualizado = {
  ...usuarioEncontrado,
  ultimoLogin: new Date().toISOString(),
  primeiroAcesso: isPrimeiroAcesso
};

setUsuario(usuarioAtualizado);

// Se for primeiro acesso, mostrar modal
if (isPrimeiroAcesso) {
  setShowPrimeiroAcesso(true);
}

return { success: true };
```

### 4. Modais no Return do AuthProvider

```javascript
return (
  <AuthContext.Provider value={value}>
    {children}
    
    {/* Modal de Primeiro Acesso */}
    {showPrimeiroAcesso && usuario && (
      <PrimeiroAcessoModal
        usuario={usuario}
        onComplete={() => {
          setShowPrimeiroAcesso(false);
          const usuarioAtualizado = { ...usuario, primeiroAcesso: false };
          setUsuario(usuarioAtualizado);
          salvarDadosLogin(usuarioAtualizado, true);
        }}
      />
    )}
    
    {/* Modal de Recuperar Senha */}
    {showRecuperarSenha && (
      <RecuperarSenhaModal
        onClose={() => setShowRecuperarSenha(false)}
        onSuccess={() => {
          setShowRecuperarSenha(false);
          alert('Senha alterada com sucesso! Faça login com sua nova senha.');
        }}
      />
    )}
  </AuthContext.Provider>
);
```

### 5. Botão "Esqueci Minha Senha" no LoginForm

```javascript
<button
  type="button"
  onClick={onEsqueciSenha}
  className="w-full mt-3 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
>
  Esqueci minha senha
</button>
```

### 6. Prop Passada no App Component

```javascript
const App = () => {
  const { usuario, isLoading, setShowRecuperarSenha } = useAuth();
  
  return usuario ? (
    <AlmoxarifadoSistema />
  ) : (
    <LoginForm onEsqueciSenha={() => setShowRecuperarSenha(true)} />
  );
};
```

---

## 🔒 Segurança

### Criptografia SHA-512

**Todas as senhas são criptografadas com:**
- Algoritmo: SHA-512
- Salt aleatório único por usuário
- Armazenamento: apenas hash + salt (nunca texto plano)

**Campos armazenados:**
```javascript
{
  senhaHash: "a1b2c3...",      // Hash SHA-512
  senhaSalt: "xyz123...",      // Salt único
  senhaVersion: 2,             // Versão do algoritmo
  senha: null                  // Removido após migração
}
```

### Validação de Senha

**Requisitos obrigatórios:**
- ✅ Mínimo 6 caracteres
- ✅ Pelo menos uma letra maiúscula (A-Z)
- ✅ Pelo menos uma letra minúscula (a-z)
- ✅ Pelo menos um número (0-9)

**Indicadores visuais:**
- ✓ Verde = Requisito atendido
- ✗ Cinza = Requisito pendente

### Resposta Secreta

**Armazenamento:**
- Hash SHA-512 da resposta em lowercase
- Salt único
- Comparação case-insensitive

**Validação:**
```javascript
const respostaCorreta = verifyPassword(
  respostaUsuario.toLowerCase().trim(),
  usuarioEncontrado.respostaSecretaHash,
  usuarioEncontrado.respostaSecretaSalt
);
```

---

## 📊 Fluxo Completo

### Fluxo de Primeiro Acesso

```
1. Usuário faz login com senha padrão "123456"
   ↓
2. Sistema detecta primeiro acesso
   ↓
3. Modal PrimeiroAcessoModal é exibido
   ↓
4. Etapa 1: Criar senha personalizada
   - Validar requisitos
   - Confirmar senha
   ↓
5. Etapa 2: Configurar segurança
   - Pergunta secreta
   - Resposta
   ↓
6. Sistema salva dados criptografados
   ↓
7. Modal fecha automaticamente
   ↓
8. Usuário pode usar o sistema normalmente
```

### Fluxo de Recuperação de Senha

```
1. Usuário clica em "Esqueci minha senha"
   ↓
2. Modal RecuperarSenhaModal é exibido
   ↓
3. Etapa 1: Digitar email
   ↓
4. Sistema busca usuário no Firestore
   ↓
5. Etapa 2: Responder pergunta secreta
   - Pergunta parcialmente oculta
   - Validação de resposta
   ↓
6. Etapa 3: Criar nova senha
   - Validar requisitos
   - Confirmar senha
   ↓
7. Sistema salva nova senha criptografada
   ↓
8. Mensagem de sucesso
   ↓
9. Usuário faz login com nova senha
```

---

## 🎨 Interface

### Cores e Temas

**PrimeiroAcessoModal:**
- Gradiente: Blue 500 → Purple 600
- Ícone: Shield (escudo)
- Cor primária: Azul

**RecuperarSenhaModal:**
- Gradiente: Orange 500 → Red 600
- Ícone: HelpCircle (interrogação)
- Cor primária: Laranja

**Ambos:**
- ✅ Suporte completo a dark mode
- ✅ Animações suaves
- ✅ Responsivo (mobile-friendly)
- ✅ Acessível (keyboard navigation)

### Ícones Utilizados

```javascript
// PrimeiroAcessoModal
<Shield />      // Header
<Lock />        // Nova senha
<Key />         // Confirmar senha
<Eye />         // Mostrar senha
<EyeOff />      // Ocultar senha
<Check />       // Requisito atendido
<X />           // Requisito pendente
<AlertTriangle /> // Aviso

// RecuperarSenhaModal
<HelpCircle />  // Header
<Lock />        // Nova senha
<Key />         // Confirmar senha
<Eye />         // Mostrar senha
<EyeOff />      // Ocultar senha
<Check />       // Requisito atendido
<X />           // Requisito pendente/Fechar
```

---

## 🧪 Testes

### Cenários de Teste

**1. Primeiro Acesso:**
```
- Criar usuário com senha "123456"
- Fazer login
- Verificar se modal aparece
- Criar senha fraca → deve bloquear
- Criar senha forte → deve permitir
- Configurar pergunta e resposta
- Verificar se salvou corretamente no Firestore
```

**2. Recuperação de Senha:**
```
- Clicar em "Esqueci minha senha"
- Digitar email inexistente → deve retornar erro
- Digitar email válido → deve mostrar pergunta
- Responder errado → deve retornar erro
- Responder certo → deve liberar nova senha
- Criar nova senha
- Fazer login com nova senha → deve funcionar
```

**3. Segurança:**
```
- Tentar fazer SQL injection no email
- Tentar XSS na pergunta secreta
- Verificar se senhas são criptografadas
- Verificar se texto plano é removido
- Verificar validação de requisitos
```

---

## 📝 Estrutura do Banco (Firestore)

### Coleção: usuarios

**Campos relacionados à autenticação:**

```javascript
{
  // Dados básicos
  id: string,
  nome: string,
  email: string,
  ativo: boolean,
  nivel: number,
  
  // Autenticação (MIGRAÇÃO)
  senha: string | null,           // LEGADO: texto plano (será removido)
  
  // Autenticação (NOVA)
  senhaHash: string,              // SHA-512 hash
  senhaSalt: string,              // Salt único
  senhaVersion: number,           // Versão do algoritmo (2)
  senhaAlgorithm: string,         // "sha512"
  
  // Recuperação de senha
  fraseSecreta: string,           // Pergunta de segurança
  respostaSecretaHash: string,    // Hash SHA-512 da resposta
  respostaSecretaSalt: string,    // Salt da resposta
  
  // Controle
  primeiroAcesso: boolean,        // Flag de primeiro acesso
  dataAlteracaoSenha: string,     // ISO timestamp
  ultimoLogin: string,            // ISO timestamp
  dataCriacao: string             // ISO timestamp
}
```

---

## 🔧 Funções Utilitárias

### encryptPassword(senha)

**Localização:** `src/utils/crypto.js`

**Uso:**
```javascript
const { hash, salt, version, algorithm } = encryptPassword('MinhaSenh@123');

await updateDoc(doc(db, 'usuarios', userId), {
  senhaHash: hash,
  senhaSalt: salt,
  senhaVersion: version,
  senhaAlgorithm: algorithm,
  senha: null
});
```

### verifyPassword(senha, hash, salt, version)

**Localização:** `src/utils/crypto.js`

**Uso:**
```javascript
const senhaValida = verifyPassword(
  senhaDigitada,
  usuario.senhaHash,
  usuario.senhaSalt,
  usuario.senhaVersion || 2
);

if (senhaValida) {
  // Login bem-sucedido
}
```

---

## 🚀 Próximos Passos (Opcional)

### Melhorias Futuras

1. **Email de Recuperação:**
   - Enviar código por email como alternativa
   - Integração com SendGrid/Firebase Auth Email

2. **2FA (Autenticação de 2 Fatores):**
   - SMS
   - Google Authenticator
   - Email

3. **Histórico de Senhas:**
   - Impedir reutilização das últimas 5 senhas
   - Campo `historicoSenhas: []`

4. **Expiração de Senha:**
   - Forçar troca a cada 90 dias
   - Campo `dataExpiracaoSenha: string`

5. **Bloqueio por Tentativas:**
   - Bloquear após 5 tentativas erradas
   - Campo `tentativasLogin: number`
   - Campo `bloqueadoAte: string`

6. **Validação de Senha Comprometida:**
   - Verificar em base de senhas vazadas (Have I Been Pwned API)

7. **Força da Senha:**
   - Indicador visual de força (fraca/média/forte)
   - Sugestões de senha segura

---

## 📚 Dependências

**Pacotes utilizados:**
- `react` - Framework
- `firebase/firestore` - Banco de dados
- `lucide-react` - Ícones
- Função customizada `encryptPassword/verifyPassword` (SHA-512)

**Nenhuma instalação adicional necessária!**

---

## ✅ Checklist de Implementação

- [x] PrimeiroAcessoModal.jsx criado
- [x] RecuperarSenhaModal.jsx criado
- [x] Estados adicionados no AuthProvider
- [x] Função de login modificada
- [x] Modais integrados no return do AuthProvider
- [x] Botão "Esqueci minha senha" adicionado
- [x] Prop passada no App component
- [x] Validação de requisitos de senha
- [x] Criptografia SHA-512 implementada
- [x] Ocultação parcial de pergunta secreta
- [x] Tema dark mode configurado
- [x] Animações adicionadas
- [x] Documentação criada

---

## 🎯 Resumo

Sistema completo de autenticação implementado com:
- ✅ Configuração de senha no primeiro acesso
- ✅ Pergunta e resposta secreta
- ✅ Recuperação de senha
- ✅ Criptografia SHA-512
- ✅ Validação robusta
- ✅ Interface moderna e acessível
- ✅ Suporte a dark mode
- ✅ Totalmente integrado ao Workflow

**Pronto para produção!** 🚀
