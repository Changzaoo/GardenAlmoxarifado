# 🔍 Debug: Usuários Importados Não Aparecem

## 🎯 Problema Identificado

Usuários importados não estão sendo exibidos na página "Usuários do Sistema".

---

## 🔬 Pontos de Investigação

### 1. **Verificar se os usuários estão no Firestore**

**Acesse o Firebase Console:**
1. Vá para [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto
3. Navegue até **Firestore Database**
4. Verifique a coleção **`usuario`**

**O que verificar:**
- ✅ Os usuários importados aparecem na coleção?
- ✅ Qual é a estrutura dos documentos?
- ✅ Todos os campos necessários estão presentes?

---

### 2. **Campos Obrigatórios para Exibição**

Um usuário precisa ter **no mínimo** estes campos para aparecer:

```javascript
{
  nome: "Nome do Usuário",       // ✅ OBRIGATÓRIO
  email: "email@exemplo.com",    // ✅ OBRIGATÓRIO
  nivel: 1,                      // ✅ OBRIGATÓRIO (1-4)
  ativo: true,                   // ✅ OBRIGATÓRIO
  empresaId: "id_empresa",       // Opcional (mas recomendado)
  empresaNome: "Nome Empresa",   // Opcional
  setorId: "id_setor",          // Opcional (mas recomendado)
  setorNome: "Nome Setor",      // Opcional
  cargo: "Função",              // Opcional
  senha: "senha_hash",          // Para login
  senhaVersion: 2,              // Versão da criptografia
  dataCriacao: "2025-01-01",    // Data de criação
  ultimoLogin: null             // Último acesso
}
```

---

### 3. **Verificar Logs do Console do Navegador**

**Abra o Console do Navegador:**
1. Pressione **F12** ou clique com botão direito → Inspecionar
2. Vá para a aba **Console**
3. Recarregue a página de Usuários

**Procure por estes logs:**

#### 📥 Carregamento de Usuários
```
📥 Iniciando carregamento de usuários...
✅ Total de usuários carregados: X
📋 Lista de emails: [...]
```

#### 👤 Dados do Usuário Logado
```
👤 Usuário Logado: { id, nome, email, nivel }
📋 Total de usuários no sistema: X
```

#### 🔍 Filtragem de Usuários
Para **CADA** usuário, você verá:
```
🔍 Filtrando usuário: Nome do Usuário
{
  id: "abc123",
  isUsuarioLogado: false,
  nivel: 1,
  nivelLogado: 4,
  temPermissao: true,    // ← SE FALSE, usuário não aparece!
  matchBusca: true,      // ← SE FALSE, usuário não aparece!
  empresaNome: "...",
  setorNome: "...",
  passaNoFiltro: true    // ← DEVE SER TRUE para aparecer!
}
```

#### 📊 Agrupamento
```
📊 Agrupando usuário: Nome
{
  empresaKey: "Zendaya",
  setorKey: "Jardim",
  empresaNome: "Zendaya",
  setorNome: "Jardim"
}
```

#### 🔑 Expansão de Grupos
```
🔑 Grupo Zendaya-Jardim:
{
  isExpanded: true,       // ← DEVE SER TRUE para usuários aparecerem!
  totalUsuarios: 5,
  usuarios: [...]
}
```

---

## 🐛 Problemas Comuns e Soluções

### ❌ Problema 1: `temPermissao: false`

**Causa:** O usuário logado não tem permissão para ver outros usuários.

**Regras de Permissão:**
- **Admin (nível 4)**: Vê **TODOS** os usuários
- **Gerente (nível 3)**: Vê usuários de nível < 3 + ele mesmo
- **Supervisor (nível 2)**: Vê apenas ele mesmo
- **Funcionário (nível 1)**: Vê apenas ele mesmo

**Solução:**
- Faça login como **Administrador** para ver todos os usuários
- Ou ajuste o nível dos usuários importados

---

### ❌ Problema 2: `isExpanded: false`

**Causa:** O grupo está colapsado (fechado).

**Solução:**
1. Na página de Usuários, procure pelos cabeçalhos de grupos
2. Clique na **seta ▶** ao lado do nome da empresa/setor
3. O grupo expandirá e mostrará os usuários

**Comportamento Esperado:**
- Grupos novos devem abrir **automaticamente** na primeira vez
- Após expandir/colapsar manualmente, o estado é preservado

---

### ❌ Problema 3: Campos `empresaNome` ou `setorNome` ausentes

**Causa:** Usuários importados podem ter apenas `empresaId` e `setorId`, sem os nomes.

**Verificação:**
No console, veja se aparecem logs assim:
```
📊 Agrupando usuário: Angelo
{
  empresaKey: "Sem Empresa",     // ← Problema!
  setorKey: "Sem Setor",         // ← Problema!
  empresaNome: undefined,
  setorNome: undefined
}
```

**Solução:**
Os usuários serão agrupados em **"Sem Empresa" / "Sem Setor"**.

Para corrigir permanentemente:
1. Adicione os campos `empresaNome` e `setorNome` no Firestore
2. Ou execute um script de migração para preencher automaticamente

---

### ❌ Problema 4: Campo `ativo: false`

**Causa:** Usuários importados podem estar marcados como inativos.

**Verificação:**
No Firestore, verifique se os usuários têm `ativo: true`.

**Solução:**
```javascript
// No Firebase Console → Firestore
// Edite o documento do usuário
ativo: true  // ← Alterar para true
```

---

## 🔧 Script de Debug Rápido

Execute este código no **Console do Navegador** na página de Usuários:

```javascript
// 1. Ver todos os usuários carregados
console.log('Total de usuários:', window.usuarios?.length || 0);
console.table(window.usuarios || []);

// 2. Ver usuários filtrados
const filtrados = window.usuariosVisiveis || [];
console.log('Usuários visíveis:', filtrados.length);
console.table(filtrados);

// 3. Ver grupos
console.log('Grupos de usuários:', window.usuariosAgrupados || {});

// 4. Ver estado de expansão dos grupos
console.log('Grupos expandidos:', window.gruposExpandidos || {});
```

---

## 🚀 Solução Rápida

### Método 1: Expandir Todos os Grupos

Na página de Usuários, **clique nas setas** (▶) de cada grupo para expandi-los.

### Método 2: Verificar Permissões

Certifique-se de estar logado como **Administrador**.

### Método 3: Verificar Firestore

1. Acesse Firebase Console
2. Vá em Firestore Database → Coleção `usuario`
3. Verifique se os usuários importados estão lá
4. Confira os campos: `nome`, `email`, `nivel`, `ativo`

### Método 4: Adicionar Logs Temporários

Execute no console do navegador:

```javascript
// Forçar recarregamento de usuários
window.location.reload();

// Ou se tiver acesso ao código:
// Adicione console.log em UsuariosTab.jsx linha ~315
```

---

## 📋 Checklist de Verificação

Use este checklist para identificar o problema:

- [ ] Usuários importados aparecem no Firestore?
- [ ] Usuários têm campo `nome`?
- [ ] Usuários têm campo `email`?
- [ ] Usuários têm campo `nivel` (1-4)?
- [ ] Usuários têm campo `ativo: true`?
- [ ] Você está logado como Admin (nível 4)?
- [ ] No console, aparece "Total de usuários carregados: X" com X > 0?
- [ ] No console, aparecem logs "🔍 Filtrando usuário"?
- [ ] No console, `passaNoFiltro: true` para os usuários?
- [ ] Na página, há cabeçalhos de grupos (empresa/setor)?
- [ ] Os grupos estão expandidos (▼) ou colapsados (▶)?
- [ ] Ao clicar na seta do grupo, os usuários aparecem?

---

## 🎓 Próximos Passos

### Se os usuários aparecem no Firestore mas não na página:

1. **Verificar permissões**: Login como Admin
2. **Expandir grupos**: Clicar nas setas dos grupos
3. **Verificar logs**: Abrir console F12 e procurar erros
4. **Adicionar campos**: Se faltam `empresaNome` ou `setorNome`

### Se os usuários NÃO aparecem no Firestore:

1. **Reimportar usuários**: Execute o script de importação novamente
2. **Verificar credenciais**: Firebase está configurado corretamente?
3. **Verificar nome da coleção**: Deve ser `usuario` (sem acento)

---

## 💡 Dica Final

Para **garantir visibilidade máxima**, os usuários importados devem ter:

```javascript
{
  nome: "Angelo",
  email: "angelo",
  senha: "voce",
  nivel: 4,                    // Admin = 4
  ativo: true,                 // SEMPRE true
  empresaId: "xxx",
  empresaNome: "Zendaya",      // Nome legível
  setorId: "yyy",
  setorNome: "Jardim",         // Nome legível
  cargo: "Supervisor",
  dataCriacao: "2025-01-04T...",
  ultimoLogin: null,
  senhaVersion: 2              // SHA-512
}
```

---

✅ **Após seguir este guia, os usuários importados devem aparecer corretamente!**

Se o problema persistir, compartilhe:
1. Screenshots do console (F12)
2. Screenshot do Firestore (coleção `usuario`)
3. Nível do usuário logado
