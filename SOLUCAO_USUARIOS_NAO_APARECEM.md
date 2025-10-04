# 🚨 GUIA DE RESOLUÇÃO: Usuários Importados Não Aparecem

## 📍 Você está aqui

Os usuários que você importou não estão aparecendo na página "Usuários do Sistema". Vamos resolver isso juntos!

---

## 🎯 Passo 1: Abrir o Console do Navegador

1. **Abra a página de Usuários do Sistema**
2. Pressione **F12** (ou clique com botão direito → Inspecionar)
3. Clique na aba **Console**
4. Recarregue a página (**Ctrl + R** ou **F5**)

---

## 🔍 Passo 2: Procurar Informações no Console

Após recarregar, procure por estas mensagens:

### ✅ Mensagem 1: Carregamento de Usuários

```
📥 Iniciando carregamento de usuários...
✅ Total de usuários carregados: X
📋 Lista de emails: ["admin", "angelo", ...]
```

**O QUE VERIFICAR:**
- ✅ O número **X** deve incluir seus usuários importados
- ✅ Os emails dos usuários importados aparecem na lista?

**SE NÃO APARECER:**
→ Problema: Usuários não estão no Firebase
→ Vá para o **Passo 5** (Verificar Firebase)

---

### ✅ Mensagem 2: Resumo da Filtragem

```
📊 RESUMO DA FILTRAGEM: {
  totalNoSistema: 10,
  usuariosVisiveis: 2,
  usuariosFiltrados: 8,
  nivelUsuarioLogado: 4,
  termoBusca: '(nenhum)'
}
```

**O QUE VERIFICAR:**
- ✅ `totalNoSistema`: Deve ser o total de usuários no Firebase
- ✅ `usuariosVisiveis`: Quantos aparecem para você
- ✅ `usuariosFiltrados`: Quantos foram ocultados
- ✅ `nivelUsuarioLogado`: Seu nível de permissão (4 = Admin)

**INTERPRETAÇÃO:**

| usuariosVisiveis | Significado | Solução |
|------------------|-------------|---------|
| **10** (todos) | ✅ Todos aparecem | Vá para Passo 3 |
| **2** (poucos) | ⚠️ Filtro de permissão | Vá para Passo 4 |
| **0** (nenhum) | ❌ Problema grave | Vá para Passo 5 |

---

### ✅ Mensagem 3: Lista Completa de Usuários

```
📋 Lista completa de usuários: [
  {
    id: "abc123",
    nome: "admin",
    email: "admin",
    nivel: 4,
    ativo: true,
    empresaNome: "Zendaya",
    setorNome: "Jardim"
  },
  {
    id: "def456",
    nome: "Angelo",
    email: "angelo",
    nivel: 4,
    ativo: true,
    empresaNome: undefined,  // ← PROBLEMA!
    setorNome: undefined     // ← PROBLEMA!
  }
]
```

**O QUE VERIFICAR:**
- ✅ Seus usuários importados aparecem nesta lista?
- ✅ Eles têm `ativo: true`?
- ✅ Eles têm `nivel` definido (1-4)?
- ✅ `empresaNome` e `setorNome` têm valores ou são `undefined`?

---

### ✅ Mensagem 4: Filtragem Individual

Para **cada** usuário, você verá:

```
🔍 Filtrando usuário: Angelo {
  id: "def456",
  isUsuarioLogado: false,
  nivel: 4,
  nivelLogado: 4,
  temPermissao: true,    // ← DEVE SER true
  matchBusca: true,      // ← DEVE SER true
  empresaNome: "Zendaya",
  setorNome: "Jardim",
  passaNoFiltro: true    // ← DEVE SER true PARA APARECER!
}
```

**O QUE VERIFICAR:**
- ✅ `temPermissao: true` → Se false, você não tem permissão para ver este usuário
- ✅ `matchBusca: true` → Se false, usuário não corresponde ao filtro de busca
- ✅ `passaNoFiltro: true` → **ESTE É O MAIS IMPORTANTE!**

**SE `passaNoFiltro: false`:**
→ O usuário está sendo filtrado
→ Vá para **Passo 4** (Verificar Permissões)

---

## 🔐 Passo 3: Verificar Permissões do Usuário Logado

### Regras de Visibilidade

| Seu Nível | Você Vê |
|-----------|---------|
| **Admin (4)** | ✅ **TODOS** os usuários |
| **Gerente (3)** | ✅ Usuários nível 1, 2 e você mesmo |
| **Supervisor (2)** | ✅ **Apenas você mesmo** |
| **Funcionário (1)** | ✅ **Apenas você mesmo** |

### Como Verificar Seu Nível

No console, procure:
```
👤 Usuário Logado: {
  nome: "Angelo",
  nivel: 4  // ← SEU NÍVEL AQUI
}
```

### ⚠️ Se você NÃO é Admin (nível 4):

**SOLUÇÃO:**
1. Faça logout
2. Faça login com uma conta **Administrador** (nível 4)
3. Ou peça para um admin promovê-lo

---

## 🏢 Passo 4: Verificar Agrupamento por Empresa/Setor

### Procure por estas mensagens:

```
📊 Agrupando usuário: Angelo {
  empresaKey: "Sem Empresa",  // ← Grupo onde usuário será listado
  setorKey: "Sem Setor",      // ← Subgrupo
  empresaNome: undefined,
  setorNome: undefined
}
```

### Possíveis Grupos

| empresaKey | setorKey | Onde Aparece |
|------------|----------|--------------|
| **"Zendaya"** | **"Jardim"** | Grupo: Zendaya • Jardim |
| **"Sem Empresa"** | **"Sem Setor"** | Grupo: Sem Empresa • Sem Setor |

### ⚠️ Se usuários estão em "Sem Empresa / Sem Setor":

**CAUSA:** Campos `empresaNome` ou `setorNome` estão vazios ou `undefined`

**SOLUÇÃO RÁPIDA:**
1. Na página de Usuários, **procure pelo grupo "Sem Empresa • Sem Setor"**
2. Clique na **seta ▶** para expandir o grupo
3. Os usuários devem aparecer ali!

**SOLUÇÃO PERMANENTE:**
→ Vá para **Passo 6** (Corrigir no Firebase)

---

## 🔍 Passo 5: Verificar Firebase Firestore

### Acessar Firebase Console

1. Abra: https://console.firebase.google.com/
2. Selecione seu projeto
3. Menu lateral → **Firestore Database**
4. Clique na coleção **`usuario`**

### Verificar Usuários Importados

Procure pelos usuários que você criou. Exemplo:

```
Documento: abc123
{
  nome: "Angelo"
  email: "angelo"
  senha: "voce"
  nivel: 4
  ativo: true
  empresaId: "TcVmHVefUYW1qsIQan2Z"
  empresaNome: "Zendaya"
  setorId: "o4GeEPjooTJ0ajimS4LK"
  setorNome: "Jardim"
  cargo: "Supervisor"
  dataCriacao: "2025-01-04T..."
}
```

### ✅ Checklist de Campos Obrigatórios

Para cada usuário, verifique se TEM:

- [ ] `nome` (ex: "Angelo")
- [ ] `email` (ex: "angelo")
- [ ] `nivel` (1, 2, 3 ou 4)
- [ ] `ativo` (deve ser `true`)
- [ ] `senha` ou `senhaHash` (para login)

### ⚠️ Campos Opcionais (mas importantes):

- [ ] `empresaNome` (ex: "Zendaya") - **Recomendado!**
- [ ] `setorNome` (ex: "Jardim") - **Recomendado!**
- [ ] `empresaId` (ID da empresa)
- [ ] `setorId` (ID do setor)

---

## 🛠️ Passo 6: Corrigir Campos Faltando no Firebase

Se os usuários estão no Firebase mas faltam campos:

### Opção A: Editar Manualmente (Poucos Usuários)

1. No Firebase Console → Firestore → Coleção `usuario`
2. Clique no usuário que quer editar
3. Clique em **"Adicionar campo"** ou edite os existentes
4. Adicione:
   - `empresaNome`: "Zendaya" (ou nome da empresa)
   - `setorNome`: "Jardim" (ou nome do setor)
5. Clique em **"Atualizar"**
6. Recarregue a página de Usuários

### Opção B: Script Automático (Muitos Usuários)

Execute este código no **Console do Navegador** (F12 → Console):

```javascript
// ATENÇÃO: Execute apenas se souber o que está fazendo!

(async function corrigirUsuarios() {
  const db = firebase.firestore();
  
  // Buscar todos os usuários
  const snapshot = await db.collection('usuario').get();
  
  for (const doc of snapshot.docs) {
    const usuario = doc.data();
    const updates = {};
    
    // Se falta empresaNome mas tem empresaId
    if (!usuario.empresaNome && usuario.empresaId) {
      const empresaDoc = await db.collection('empresas').doc(usuario.empresaId).get();
      if (empresaDoc.exists) {
        updates.empresaNome = empresaDoc.data().nome;
      }
    }
    
    // Se falta setorNome mas tem setorId
    if (!usuario.setorNome && usuario.setorId) {
      const setorDoc = await db.collection('setores').doc(usuario.setorId).get();
      if (setorDoc.exists) {
        updates.setorNome = setorDoc.data().nome;
      }
    }
    
    // Atualizar se houver mudanças
    if (Object.keys(updates).length > 0) {
      await doc.ref.update(updates);
      console.log(`✅ Atualizado: ${usuario.nome}`, updates);
    }
  }
  
  console.log('✅ Correção concluída! Recarregue a página.');
})();
```

---

## 🎯 Passo 7: Expandir Grupos na Página

### Se os usuários estão carregados mas não APARECEM:

**CAUSA:** Os grupos podem estar colapsados (fechados).

**SOLUÇÃO:**
1. Na página de Usuários, procure por cabeçalhos azuis com setas **▶**
2. Exemplo: `▶ Zendaya • Jardim` ou `▶ Sem Empresa • Sem Setor`
3. **Clique na seta** para expandir
4. Os usuários do grupo aparecerão!

### Verificar no Console:

```
🔑 Grupo Zendaya-Jardim: {
  isExpanded: false,  // ← Se false, grupo está fechado!
  totalUsuarios: 5,
  usuarios: [...]
}
```

---

## ✅ Solução Rápida (Resumo)

1. **Abrir Console** (F12)
2. **Recarregar página** (F5)
3. **Verificar logs** "📊 RESUMO DA FILTRAGEM"
4. **Se `nivelUsuarioLogado` < 4**: Fazer login como Admin
5. **Se `usuariosVisiveis` = 0**: Verificar Firebase
6. **Procurar grupos** com setas **▶**
7. **Clicar nas setas** para expandir grupos
8. **Usuários devem aparecer!** ✅

---

## 🆘 Ainda não funciona?

### Compartilhe estas informações:

1. **Screenshot do Console** (F12 → aba Console)
2. **Screenshot do Firebase** (coleção `usuario`)
3. **Seu nível de acesso** (aparece no console: "👤 Usuário Logado")
4. **Total de usuários** (aparece no console: "📋 Total de usuários")
5. **Usuários visíveis** (aparece no console: "📊 RESUMO DA FILTRAGEM")

---

## 📞 Mensagem de Erro Comum

### "Nenhum usuário cadastrado no sistema"

**CAUSA:** Filtros muito restritivos ou permissão insuficiente

**SOLUÇÕES:**
1. Limpe o campo de busca (se tiver texto)
2. Faça login como Administrador (nível 4)
3. Expanda todos os grupos (clique nas setas ▶)
4. Verifique Firebase (Passo 5)

---

✅ **Após seguir este guia, os usuários importados devem aparecer!**

Se precisar de mais ajuda, compartilhe os logs do console. 🚀
