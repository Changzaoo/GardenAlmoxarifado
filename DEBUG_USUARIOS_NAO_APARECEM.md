# 🔍 Debug: Usuários Não Aparecem na Página

## 🎯 Objetivo

Identificar por que os usuários da coleção `usuario` não estão aparecendo expandidos na página de Usuários do Sistema.

## 📝 Logs Adicionados

Foram adicionados logs detalhados em **3 pontos críticos**:

### 1. **Filtro de Usuários** (Linha ~312)
```javascript
console.log(`🔍 Filtrando usuário: ${usuario.nome}`, {
  id: usuario.id,
  isUsuarioLogado,
  nivel: usuario.nivel,
  nivelLogado: usuarioLogado.nivel,
  temPermissao,
  matchBusca,
  empresaNome: usuario.empresaNome,
  setorNome: usuario.setorNome,
  passaNoFiltro: temPermissao && matchBusca
});
```

### 2. **Agrupamento de Usuários** (Linha ~348)
```javascript
console.log(`📊 Agrupando usuário: ${usuario.nome}`, {
  empresaKey,
  setorKey,
  empresaNome: usuario.empresaNome,
  setorNome: usuario.setorNome
});

console.log('📋 Usuários Agrupados:', usuariosAgrupados);
console.log('🏢 Empresas Ordenadas:', empresasOrdenadas);
```

### 3. **Estado de Expansão dos Grupos** (Linha ~371)
```javascript
console.log('🔓 Estado de Grupos Expandidos:', novoEstado);
```

### 4. **Renderização dos Grupos** (Linha ~526)
```javascript
console.log(`🔑 Grupo ${grupoKey}:`, {
  isExpanded,
  totalUsuarios: usuarios.length,
  usuarios: usuarios.map(u => u.nome)
});
```

## 🧪 Como Testar

### Passo 1: Abrir o Console do Navegador
1. Abra o aplicativo no navegador
2. Pressione **F12** ou **Ctrl+Shift+I** para abrir as DevTools
3. Vá para a aba **Console**

### Passo 2: Navegar para a Página de Usuários
1. Faça login como **Administrador**
2. Clique na aba **"Usuários"** ou **"Gerenciamento de Usuários"**

### Passo 3: Verificar os Logs

Você deverá ver uma sequência de logs como esta:

```
👤 Usuário Logado: { id: "...", nome: "Administrador", email: "admin", nivel: 4 }
📋 Total de usuários no sistema: 1

🔍 Filtrando usuário: Administrador
  ↳ id: "wzrMMqQVxB4e4MMF9C9rv"
  ↳ isUsuarioLogado: true
  ↳ nivel: 4
  ↳ nivelLogado: 4
  ↳ temPermissao: true
  ↳ matchBusca: true
  ↳ empresaNome: ""
  ↳ setorNome: ""
  ↳ passaNoFiltro: true

📊 Agrupando usuário: Administrador
  ↳ empresaKey: "Sem Empresa"
  ↳ setorKey: "Sem Setor"
  ↳ empresaNome: ""
  ↳ setorNome: ""

📋 Usuários Agrupados: 
  {
    "Sem Empresa": {
      "Sem Setor": [
        { id: "...", nome: "Administrador", ... }
      ]
    }
  }

🏢 Empresas Ordenadas: ["Sem Empresa"]

🔓 Estado de Grupos Expandidos: 
  {
    "Sem Empresa-Sem Setor": true
  }

🔑 Grupo Sem Empresa-Sem Setor:
  ↳ isExpanded: true
  ↳ totalUsuarios: 1
  ↳ usuarios: ["Administrador"]
```

## 🔍 Cenários Possíveis

### ✅ Cenário 1: Grupo Expandido mas Não Aparece
**Logs esperados:**
```
🔓 Estado de Grupos Expandidos: { "Sem Empresa-Sem Setor": true }
🔑 Grupo Sem Empresa-Sem Setor: { isExpanded: true, totalUsuarios: 1 }
```

**Problema:** CSS ou condição de renderização
**Solução:** Verificar se há conflito de CSS ou z-index

---

### ❌ Cenário 2: Grupo Não Está Expandido
**Logs esperados:**
```
🔓 Estado de Grupos Expandidos: { "Sem Empresa-Sem Setor": false }
🔑 Grupo Sem Empresa-Sem Setor: { isExpanded: false, totalUsuarios: 1 }
```

**Problema:** Estado inicial incorreto
**Solução:** Forçar estado inicial como `true`

---

### ⚠️ Cenário 3: Usuário Não Passa no Filtro
**Logs esperados:**
```
🔍 Filtrando usuário: Administrador
  ↳ passaNoFiltro: false  ❌
```

**Problema:** Filtro de permissões ou busca bloqueando
**Solução:** Verificar lógica de `temPermissao` e `matchBusca`

---

### 🚫 Cenário 4: Usuário Não Está na Lista
**Logs esperados:**
```
📋 Total de usuários no sistema: 0
```

**Problema:** Listener não carregou os usuários do Firestore
**Solução:** Verificar conexão com Firestore e listener

---

## 🛠️ Ações Corretivas

### Se o grupo está expandido mas não aparece:

1. **Verificar se a linha está sendo renderizada:**
   - Inspecionar elemento no navegador
   - Procurar pela linha `<tr>` com os dados do usuário
   - Verificar se há `display: none` ou `opacity: 0`

2. **Verificar a condição de renderização:**
   ```javascript
   {isExpanded && usuarios.map((usuario, index) => (
     // Se isExpanded for true mas não renderiza, há problema aqui
   ```

### Se o grupo não está expandido:

1. **Clicar no cabeçalho do grupo** e verificar se o log aparece:
   ```
   🖱️ Clicou para expandir/colapsar grupo: Sem Empresa-Sem Setor
   ```

2. **Se não clicar**, há problema com o evento onClick

3. **Se clicar mas não expandir**, há problema no `setGruposExpandidos`

### Se o usuário não passa no filtro:

1. **Verificar o campo que está bloqueando:**
   - `temPermissao: false` → Problema de nível de acesso
   - `matchBusca: false` → Problema de termo de busca

2. **Limpar o campo de busca** no topo da página

### Se não há usuários na lista:

1. **Verificar no Firestore:**
   - Firebase Console → Firestore Database
   - Verificar se existe a coleção `usuario` (singular)
   - Verificar se há documentos dentro

2. **Verificar o listener no console:**
   ```
   📥 Iniciando carregamento de usuários...
   ✅ Total de usuários carregados: X
   ```

---

## 📊 Checklist de Diagnóstico

Marque conforme for testando:

- [ ] Console aberto (F12)
- [ ] Navegou para página de Usuários
- [ ] Viu logs de "Usuário Logado"
- [ ] Viu logs de "Total de usuários no sistema"
- [ ] Viu logs de "Filtrando usuário"
- [ ] Viu logs de "Agrupando usuário"
- [ ] Viu logs de "Usuários Agrupados"
- [ ] Viu logs de "Estado de Grupos Expandidos"
- [ ] Viu logs de "Grupo X"
- [ ] Grupo está expandido (`isExpanded: true`)
- [ ] Tentou clicar no cabeçalho do grupo
- [ ] Viu log de "Clicou para expandir/colapsar"

---

## 📤 Como Reportar

Copie e cole **TODOS os logs do console** aqui no chat. Incluindo:

1. Logs de carregamento inicial
2. Logs de filtragem
3. Logs de agrupamento
4. Logs de estado de expansão
5. Logs de renderização dos grupos

Isso me ajudará a identificar exatamente onde está o problema! 🎯

---

## 🔄 Reverter Mudanças (Se Necessário)

Se os logs estiverem poluindo muito o console, você pode:

1. **Comentar os console.log** após coletar os dados
2. Ou adicionar um filtro no console: digite `🔍` na barra de filtro para ver apenas logs de debug

---

✅ **Com esses logs, conseguirei identificar exatamente qual é o problema!**
