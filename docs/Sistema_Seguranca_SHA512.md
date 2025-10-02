# Sistema de Segurança SHA-512 - Documentação Completa

## 📋 Visão Geral

Este documento descreve a implementação completa do sistema de criptografia de senhas usando SHA-512 no sistema WorkFlow. O sistema garante máxima segurança para senhas de usuários com acesso ao sistema.

---

## 🔐 Arquitetura de Segurança

### Algoritmo Principal: SHA-512

**Por que SHA-512?**
- ✅ Hash de 512 bits (64 bytes) - muito mais seguro que MD5 (128 bits) ou SHA-1 (160 bits)
- ✅ Resistente a colisões - praticamente impossível gerar duas senhas com o mesmo hash
- ✅ Irreversível - não há como recuperar a senha a partir do hash
- ✅ Padrão da indústria aprovado pela NSA
- ✅ Performance adequada para autenticação de usuários

### Componentes de Segurança

```
Senha Segura = SHA-512(senha + salt + APP_SECRET)
```

**Elementos:**
1. **Senha**: Texto fornecido pelo usuário
2. **Salt**: String aleatória única de 16 bytes por senha
3. **APP_SECRET**: Chave secreta da aplicação (constante)
4. **Hash**: Resultado SHA-512 armazenado no banco de dados

---

## 📁 Estrutura de Arquivos

### 1. `src/utils/crypto.js`

**Funções principais:**

#### `generateSecureSalt()`
```javascript
// Gera salt aleatório de 16 bytes
const generateSecureSalt = () => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};
```

#### `encryptPassword(password)`
```javascript
export const encryptPassword = (password) => {
  const salt = generateSecureSalt();
  const hash = CryptoJS.SHA512(password + salt + APP_SECRET).toString();
  
  return {
    hash: hash,           // Hash SHA-512 da senha
    salt: salt,           // Salt único gerado
    version: 2,           // Versão do algoritmo
    algorithm: 'SHA-512'  // Nome do algoritmo
  };
};
```

#### `verifyPassword(password, storedHash, salt, version)`
```javascript
export const verifyPassword = (password, storedHash, salt, version = 2) => {
  try {
    if (version === 2) {
      // SHA-512 (versão atual)
      const computedHash = CryptoJS.SHA512(password + salt + APP_SECRET).toString();
      return computedHash === storedHash;
    } else {
      // AES (versão 1 - legacy)
      const key = generateEncryptionKey(salt);
      const decrypted = CryptoJS.AES.decrypt(storedHash, key).toString(CryptoJS.enc.Utf8);
      return decrypted === password;
    }
  } catch (error) {
    console.error('Erro ao verificar senha:', error);
    return false;
  }
};
```

---

### 2. `src/components/Workflow.jsx`

**Implementação de autenticação e gerenciamento de usuários**

#### Login com SHA-512
```javascript
const login = async (email, senha, lembrar = false) => {
  // ... busca usuário ...
  
  // Verificar se tem senha criptografada (nova) ou texto plano (legado)
  const senhaHash = usuarioEncontrado.senhaHash;
  const senhaSalt = usuarioEncontrado.senhaSalt;
  const senhaVersion = usuarioEncontrado.senhaVersion || 1;
  const senhaPlaintext = usuarioEncontrado.senha;
  
  let senhaValida = false;
  
  if (senhaHash && senhaSalt) {
    // Senha SHA-512 (nova)
    senhaValida = verifyPassword(senha, senhaHash, senhaSalt, senhaVersion);
  } else if (senhaPlaintext) {
    // Senha em texto plano (legado)
    senhaValida = senhaPlaintext === senha;
  }
  
  if (senhaValida) {
    // Auto-migração de senhas legadas
    if (usuarioEncontrado.senha) {
      const { hash, salt, version, algorithm } = encryptPassword(senha);
      await updateDoc(doc(db, 'usuarios', usuarioEncontrado.id), {
        senhaHash: hash,
        senhaSalt: salt,
        senhaVersion: version,
        senhaAlgorithm: algorithm,
        senha: null
      });
      console.log('✅ Senha migrada para SHA-512 com sucesso');
    }
    
    // ... resto do login ...
  }
};
```

#### Criar Usuário
```javascript
const criarUsuario = async (dadosUsuario) => {
  // Criptografar senha com SHA-512
  const { hash, salt, version, algorithm } = encryptPassword(dadosUsuario.senha);
  
  const novoUsuario = {
    ...dadosUsuario,
    senhaHash: hash,
    senhaSalt: salt,
    senhaVersion: version,
    senhaAlgorithm: algorithm,
    senha: null, // Não armazena senha em texto plano
    ativo: true,
    dataCriacao: new Date().toISOString(),
    ultimoLogin: null
  };
  
  delete novoUsuario.senha; // Remove campo senha
  
  await addDoc(collection(db, 'usuarios'), novoUsuario);
  console.log('✅ Usuário criado com senha SHA-512');
};
```

#### Atualizar Usuário
```javascript
const atualizarUsuario = async (id, dadosAtualizados) => {
  // Se a senha foi alterada, criptografar com SHA-512
  if (dadosAtualizados.senha) {
    const { hash, salt, version, algorithm } = encryptPassword(dadosAtualizados.senha);
    
    dadosAtualizados = {
      ...dadosAtualizados,
      senhaHash: hash,
      senhaSalt: salt,
      senhaVersion: version,
      senhaAlgorithm: algorithm,
      senha: null
    };
    
    delete dadosAtualizados.senha;
    console.log('✅ Senha do usuário atualizada para SHA-512');
  }
  
  await updateDoc(doc(db, 'usuarios', id), dadosAtualizados);
};
```

---

### 3. `src/components/usuarios/UsuariosTab.jsx`

**Interface de gerenciamento de usuários**

#### Melhorias Visuais

**Header com Badge de Segurança:**
```jsx
<div className="flex items-center gap-2 text-xs bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg px-3 py-2">
  <Shield className="w-4 h-4 text-green-600 dark:text-green-400" />
  <span className="text-green-700 dark:text-green-300 font-medium">
    Senhas criptografadas com SHA-512 | {usuariosVisiveis.length} usuário(s) cadastrado(s)
  </span>
</div>
```

**Indicador Visual de Segurança SHA-512:**
```jsx
{usuario.senhaVersion === 2 && (
  <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-0.5">
    <Shield className="w-3 h-3 text-white" />
  </div>
)}
```

**Busca Avançada:**
- Busca por: nome, email, empresa, setor, função
- Ordenação alfabética automática
- Filtro por permissões de usuário

---

## 🗄️ Estrutura do Banco de Dados (Firestore)

### Collection: `usuarios`

**Campos de Autenticação:**

```javascript
{
  // Dados do usuário
  nome: string,
  email: string,
  cargo: string,
  empresaId: string,
  empresaNome: string,
  setorId: string,
  setorNome: string,
  nivel: number,
  ativo: boolean,
  
  // SHA-512 (versão 2)
  senhaHash: string,      // Hash SHA-512 da senha
  senhaSalt: string,      // Salt único de 16 bytes
  senhaVersion: 2,        // Versão do algoritmo
  senhaAlgorithm: 'SHA-512', // Nome do algoritmo
  
  // Campo legado (removido após migração)
  senha: null,            // Texto plano (não usado mais)
  
  // Metadados
  dataCriacao: string,
  ultimoLogin: string
}
```

---

## 🔄 Fluxo de Autenticação

### 1. Login de Usuário Novo (SHA-512)

```
Usuário → Senha "123456"
         ↓
Salt gerado: "a3f8e9c2..."
         ↓
Hash SHA-512: SHA-512("123456" + "a3f8e9c2..." + APP_SECRET)
         ↓
Firestore: {
  senhaHash: "c5d8f3a1...",
  senhaSalt: "a3f8e9c2...",
  senhaVersion: 2
}
         ↓
Login bem-sucedido ✅
```

### 2. Login de Usuário Legado (Auto-migração)

```
Usuário → Senha "123456"
         ↓
Firestore: { senha: "123456" } (texto plano)
         ↓
Verificação: senha === "123456" ✅
         ↓
Auto-migração:
  - Gera salt: "b7c2e4f1..."
  - Calcula hash SHA-512
  - Atualiza Firestore: {
      senhaHash: "d3e9f7b2...",
      senhaSalt: "b7c2e4f1...",
      senhaVersion: 2,
      senha: null
    }
         ↓
Console: "✅ Senha migrada para SHA-512 com sucesso"
         ↓
Login bem-sucedido ✅
```

### 3. Criação de Novo Usuário

```
Admin → Nova senha "senha123"
         ↓
encryptPassword("senha123")
         ↓
Salt gerado: "f4a9e2c7..."
         ↓
Hash SHA-512: "e8d3f9a1..."
         ↓
Firestore: {
  nome: "João Silva",
  email: "joao@empresa.com",
  senhaHash: "e8d3f9a1...",
  senhaSalt: "f4a9e2c7...",
  senhaVersion: 2,
  senhaAlgorithm: "SHA-512"
}
         ↓
Console: "✅ Usuário criado com senha SHA-512"
```

---

## 🛡️ Níveis de Segurança

### Comparação com Algoritmos Anteriores

| Algoritmo | Bits | Força | Status |
|-----------|------|-------|--------|
| MD5 | 128 | ❌ Quebrado | Não use |
| SHA-1 | 160 | ⚠️ Vulnerável | Não use |
| SHA-256 | 256 | ✅ Seguro | Bom |
| **SHA-512** | **512** | **✅✅ Muito seguro** | **Ideal** |

### Proteções Implementadas

1. **Salting**: Cada senha tem salt único (impede rainbow tables)
2. **App Secret**: Chave adicional conhecida apenas pela aplicação
3. **Versionamento**: Sistema suporta migração entre algoritmos
4. **Auto-migração**: Senhas legadas são atualizadas automaticamente
5. **Backward Compatibility**: Sistema funciona com versão 1 (AES) e versão 2 (SHA-512)

---

## 📊 Interface de Usuários - Recursos

### Características Principais

✅ **Ordenação alfabética automática**
✅ **Busca avançada** (nome, email, empresa, setor, função)
✅ **Badge de segurança SHA-512** no header
✅ **Indicador visual** de senhas criptografadas
✅ **Colunas organizacionais** (empresa/setor, função)
✅ **Badges gradientes** para níveis de acesso
✅ **Status de último login** detalhado
✅ **Modo escuro** totalmente suportado

### Visual Moderno

- **Avatares com iniciais** coloridos por nível
- **Badges gradientes** para status e níveis
- **Hover effects** suaves
- **Ícones lucide-react** consistentes
- **Tabela responsiva** com linhas zebradas
- **Botões de ação** com feedback visual

---

## 🧪 Testes Recomendados

### 1. Criar Novo Usuário
```javascript
// Resultado esperado:
// - Console: "✅ Usuário criado com senha SHA-512"
// - Firestore: senhaHash, senhaSalt, senhaVersion: 2
// - Sem campo "senha"
```

### 2. Login com Usuário Novo
```javascript
// Resultado esperado:
// - Verificação SHA-512 bem-sucedida
// - Login autorizado
// - Campo "ultimoLogin" atualizado
```

### 3. Login com Usuário Legado
```javascript
// Resultado esperado:
// - Console: "✅ Senha migrada para SHA-512 com sucesso"
// - Firestore atualizado com senhaHash/senhaSalt
// - Campo "senha" removido (null)
```

### 4. Atualizar Senha
```javascript
// Resultado esperado:
// - Console: "✅ Senha do usuário atualizada para SHA-512"
// - Novo hash e salt gerados
// - Login funciona com nova senha
```

---

## ⚠️ Avisos Importantes

### NÃO FAÇA:

❌ **Não armazene senhas em texto plano**
❌ **Não compartilhe o APP_SECRET**
❌ **Não use o mesmo salt para múltiplas senhas**
❌ **Não exponha hashes na API pública**
❌ **Não transmita senhas sem HTTPS**

### FAÇA:

✅ **Use HTTPS em produção**
✅ **Mantenha APP_SECRET seguro (variáveis de ambiente)**
✅ **Implemente rate limiting no login**
✅ **Monitore tentativas de login falhas**
✅ **Eduque usuários sobre senhas fortes**
✅ **Faça backup seguro dos dados**

---

## 🔧 Manutenção

### Logs de Debug

O sistema inclui logs no console para monitoramento:

```javascript
// Criação de usuário
console.log('✅ Usuário criado com senha SHA-512');

// Login com migração
console.log('✅ Senha migrada para SHA-512 com sucesso');

// Atualização de senha
console.log('✅ Senha do usuário atualizada para SHA-512');

// Erros
console.error('Erro ao verificar senha:', error);
```

### Verificar Migração Completa

```javascript
// Query no Firestore para verificar usuários não migrados
const usuariosLegados = await getDocs(
  query(
    collection(db, 'usuarios'),
    where('senhaVersion', '!=', 2)
  )
);

console.log(`${usuariosLegados.size} usuários ainda não migrados`);
```

---

## 📈 Roadmap Futuro

### Melhorias Planejadas

1. **Argon2**: Considerar migração para Argon2 (vencedor do Password Hashing Competition)
2. **2FA**: Implementar autenticação de dois fatores
3. **Histórico de senhas**: Impedir reutilização de senhas antigas
4. **Complexidade de senhas**: Validação de força de senha
5. **Expiração de senhas**: Forçar troca periódica
6. **Notificações**: Alertas de login em novo dispositivo

---

## 📝 Conclusão

O sistema SHA-512 implementado oferece **segurança de nível empresarial** para autenticação de usuários. Com auto-migração, versionamento e backward compatibility, o sistema é robusto e preparado para o futuro.

### Checklist de Implementação ✅

- [x] Função de criptografia SHA-512
- [x] Função de verificação com versionamento
- [x] Geração de salt aleatório
- [x] Login com SHA-512
- [x] Auto-migração de senhas legadas
- [x] Criação de usuários com SHA-512
- [x] Atualização de senhas com SHA-512
- [x] Interface visual aprimorada
- [x] Badge de segurança
- [x] Indicadores visuais de criptografia
- [x] Busca avançada
- [x] Documentação completa

---

**Última atualização**: 2024
**Versão do sistema**: 2.0 (SHA-512)
**Status**: ✅ Produção
