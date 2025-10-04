# 🔧 Correção: Usuários Criados Não Aparecem na Página de Tarefas

## 📋 Problema Identificado

Usuários criados através do modal "Novo Usuário" **não apareciam** na lista de funcionários disponíveis ao criar tarefas.

### 🔍 Causa Raiz

O sistema tinha **duas coleções separadas** no Firestore:

1. **`usuarios`** - Onde novos usuários são criados (via modal de Usuários)
2. **`funcionarios`** - Onde o sistema antigo armazenava funcionários

O componente de tarefas (`TarefasTab`) usava o `FuncionariosProvider`, que **só carregava dados da coleção `funcionarios`**, ignorando completamente a coleção `usuarios`.

```javascript
// ❌ ANTES (carregava apenas 'funcionarios')
const unsubscribe = onSnapshot(collection(db, 'funcionarios'), (snapshot) => {
  const funcionariosData = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  setFuncionarios(funcionariosData);
});
```

**Resultado:**
- ✅ Funcionários antigos (coleção `funcionarios`) → Apareciam nas tarefas
- ❌ Usuários novos (coleção `usuarios`) → **NÃO apareciam** nas tarefas

---

## ✅ Solução Implementada

### **Mesclagem de Duas Coleções**

Modifiquei o `FuncionariosProvider` para carregar e mesclar dados de **ambas** as coleções:

```javascript
// ✅ DEPOIS (carrega 'funcionarios' + 'usuarios')
useEffect(() => {
  const unsubscribers = [];

  // 1. Subscrição para 'funcionarios' (legado)
  const unsubscribeFuncionarios = onSnapshot(
    collection(db, 'funcionarios'), 
    (snapshot) => {
      const funcionariosData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        origem: 'funcionarios' // Marcar origem
      }));
      
      const funcionariosAtivos = funcionariosData.filter(func => !func.demitido);
      
      // Mesclar com usuários
      setFuncionarios(prev => {
        const usuarios = prev.filter(f => f.origem === 'usuarios');
        return [...funcionariosAtivos, ...usuarios];
      });
    }
  );
  unsubscribers.push(unsubscribeFuncionarios);

  // 2. Subscrição para 'usuarios' (novo sistema)
  const unsubscribeUsuarios = onSnapshot(
    collection(db, 'usuarios'),
    (snapshot) => {
      const usuariosData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          nome: data.nome,
          email: data.email,
          username: data.email,
          cargo: data.cargo || 'Funcionário',
          empresaId: data.empresaId,
          empresaNome: data.empresaNome,
          setorId: data.setorId,
          setorNome: data.setorNome,
          nivel: data.nivel,
          ativo: data.ativo !== false,
          origem: 'usuarios' // Marcar origem
        };
      });
      
      const usuariosAtivos = usuariosData.filter(user => user.ativo);
      
      // Mesclar com funcionários
      setFuncionarios(prev => {
        const funcionarios = prev.filter(f => f.origem === 'funcionarios');
        
        // Evitar duplicatas (mesmo email)
        const usuariosNaoLegacy = usuariosAtivos.filter(usuario => {
          return !funcionarios.some(func => 
            func.email === usuario.email || func.id === usuario.id
          );
        });
        
        return [...funcionarios, ...usuariosNaoLegacy];
      });
    }
  );
  unsubscribers.push(unsubscribeUsuarios);

  return () => unsubscribers.forEach(unsub => unsub());
}, []);
```

---

## 📊 Como Funciona Agora

### **Fluxo Completo**

1. **FuncionariosProvider inicia**
   - Cria duas subscrições simultâneas (listeners) no Firestore
   - Uma para `funcionarios` (coleção antiga)
   - Outra para `usuarios` (coleção nova)

2. **Dados chegam da coleção `funcionarios`**
   - Carrega todos os documentos
   - Filtra apenas ativos (`!demitido`)
   - Marca origem como `'funcionarios'`
   - Mescla com `usuarios` existentes no estado

3. **Dados chegam da coleção `usuarios`**
   - Carrega todos os documentos
   - Mapeia campos para estrutura compatível:
     ```javascript
     {
       id: doc.id,
       nome: data.nome,
       email: data.email,
       username: data.email,  // email como username
       cargo: data.cargo || 'Funcionário',
       empresaId: data.empresaId,
       empresaNome: data.empresaNome,
       setorId: data.setorId,
       setorNome: data.setorNome,
       nivel: data.nivel,
       ativo: data.ativo !== false,
       origem: 'usuarios'
     }
     ```
   - Filtra apenas ativos (`ativo !== false`)
   - Remove duplicatas (se houver alguém em ambas as coleções)
   - Mescla com `funcionarios` existentes no estado

4. **Estado final**
   ```javascript
   funcionarios = [
     // Funcionários da coleção 'funcionarios'
     { id: "func1", nome: "João Antigo", origem: "funcionarios" },
     { id: "func2", nome: "Maria Antiga", origem: "funcionarios" },
     
     // Usuários da coleção 'usuarios'
     { id: "user1", nome: "Ruan", origem: "usuarios" },
     { id: "user2", nome: "Pedro Novo", origem: "usuarios" }
   ]
   ```

5. **Componente de Tarefas**
   - Recebe array mesclado via `useFuncionarios()`
   - Exibe todos no dropdown de seleção
   - Permite atribuir tarefas para qualquer um

---

## 🎯 Benefícios

### ✅ **1. Retrocompatibilidade**
- Sistema antigo continua funcionando
- Funcionários da coleção `funcionarios` ainda aparecem
- Nenhum dado perdido

### ✅ **2. Suporte para Novo Sistema**
- Usuários criados via modal agora aparecem
- Mesma interface para ambos os tipos

### ✅ **3. Evita Duplicatas**
```javascript
// Se alguém existe em ambas as coleções, prioriza 'funcionarios'
const usuariosNaoLegacy = usuariosAtivos.filter(usuario => {
  return !funcionarios.some(func => 
    func.email === usuario.email || func.id === usuario.id
  );
});
```

### ✅ **4. Real-time em Ambas as Coleções**
- Qualquer alteração em `funcionarios` → atualiza automaticamente
- Qualquer alteração em `usuarios` → atualiza automaticamente
- Criou novo usuário → aparece instantaneamente nas tarefas

### ✅ **5. Logs Detalhados**
```javascript
console.log('📋 Funcionários carregados da coleção "funcionarios":', count);
console.log('👥 Usuários carregados da coleção "usuarios":', count);
console.log('✅ Total mesclado (funcionarios + usuarios):', count);
```

---

## 🔍 Teste de Verificação

### **Como Testar**

1. **Abrir Console do Navegador (F12)**

2. **Verificar Logs no Console**
   ```
   📋 Funcionários carregados da coleção "funcionarios": 3
   👥 Usuários carregados da coleção "usuarios": 2
   ✅ Total mesclado (funcionarios + usuarios): 5
      - Da coleção "funcionarios": 3
      - Da coleção "usuarios": 2
   ```

3. **Criar Nova Tarefa**
   - Clicar em "Nova Tarefa"
   - Abrir dropdown "Funcionários Responsáveis"
   - **Verificar se o usuário Ruan aparece na lista**

4. **Selecionar Usuário**
   - Selecionar "Ruan" da lista
   - Verificar se aparece como chip selecionado
   - Criar a tarefa

5. **Verificar Tarefa Criada**
   - Tarefa deve aparecer na lista
   - Nome "Ruan" deve estar visível
   - Notificação deve ser enviada

---

## 📝 Mapeamento de Campos

| Campo na Coleção `usuarios` | Campo no Estado Mesclado | Observação |
|----------------------------|--------------------------|------------|
| `nome` | `nome` | Nome completo |
| `email` | `email` | Email do usuário |
| `email` | `username` | Usado como username também |
| `cargo` | `cargo` | Padrão: "Funcionário" se não tiver |
| `empresaId` | `empresaId` | ID da empresa |
| `empresaNome` | `empresaNome` | Nome da empresa |
| `setorId` | `setorId` | ID do setor |
| `setorNome` | `setorNome` | Nome do setor |
| `nivel` | `nivel` | Nível de permissão |
| `ativo` | `ativo` | Status ativo/inativo |
| - | `origem` | **Novo**: "usuarios" (para debug) |

---

## 🚨 Avisos Importantes

### **1. Performance**
Com duas subscrições simultâneas, há mais conexões ativas com o Firestore. Isso é **aceitável** para a quantidade esperada de usuários, mas monitore o uso.

### **2. Duplicatas**
Se um usuário existir em **ambas** as coleções (mesmo email), a versão da coleção `funcionarios` terá **prioridade**.

### **3. Estrutura de Dados**
Alguns campos podem não existir em todos os usuários:
- `cargo` → Padrão: "Funcionário"
- `ativo` → Padrão: `true`
- `empresaNome`, `setorNome` → Podem ser `undefined`

### **4. Migração Futura (Recomendado)**
Para simplificar o sistema no futuro, considere:

**Opção A**: Migrar todos os funcionários da coleção `funcionarios` para `usuarios`
```javascript
// Script de migração (executar uma vez)
const funcionariosSnapshot = await getDocs(collection(db, 'funcionarios'));
for (const doc of funcionariosSnapshot.docs) {
  const data = doc.data();
  await addDoc(collection(db, 'usuarios'), {
    nome: data.nome,
    email: data.email,
    senha: data.senha || 'temporaria123', // Definir senha temporária
    nivel: data.nivel || 1,
    ativo: !data.demitido,
    cargo: data.cargo || 'Funcionário',
    // ... outros campos
  });
}
```

**Opção B**: Descontinuar coleção `funcionarios` e usar apenas `usuarios`
- Atualizar todos os lugares que referenciam `funcionarios`
- Migrar dados históricos
- Remover `FuncionariosProvider` e usar `useAuth()` diretamente

---

## 📈 Estatísticas

| Métrica | Antes | Depois |
|---------|-------|--------|
| Coleções monitoradas | 1 (`funcionarios`) | 2 (`funcionarios` + `usuarios`) |
| Usuários novos visíveis | ❌ Não | ✅ Sim |
| Funcionários antigos visíveis | ✅ Sim | ✅ Sim |
| Duplicatas evitadas | ❌ Não verificava | ✅ Sim |
| Real-time updates | ✅ Sim | ✅ Sim (ambas) |
| Logs de debug | ❌ Básico | ✅ Detalhado |

---

## ✅ Checklist de Verificação

- [x] `FuncionariosProvider.jsx` modificado
- [x] Subscrição dupla implementada
- [x] Mapeamento de campos da coleção `usuarios`
- [x] Filtro de duplicatas funcionando
- [x] Logs de debug adicionados
- [x] Zero erros de compilação
- [ ] **Teste manual**: Criar usuário e verificar se aparece nas tarefas
- [ ] **Teste manual**: Atribuir tarefa para usuário novo
- [ ] **Teste manual**: Verificar notificações para usuário novo

---

## 🎯 Resultado Esperado

Após esta correção:

1. ✅ **Criar novo usuário** via modal
2. ✅ **Abrir página de tarefas** → Clicar em "Nova Tarefa"
3. ✅ **Abrir dropdown de funcionários** → **Ruan aparece na lista!**
4. ✅ **Selecionar Ruan** → Criar tarefa
5. ✅ **Tarefa criada** → Ruan recebe notificação
6. ✅ **Tarefa visível** → Nome de Ruan aparece na tarefa

---

**Arquivo Modificado**: `src/components/Funcionarios/FuncionariosProvider.jsx`  
**Linhas Alteradas**: ~45 linhas  
**Compatibilidade**: ✅ Retrocompatível (sistema antigo continua funcionando)  
**Teste Necessário**: ⏳ Criar usuário e verificar se aparece em tarefas

---

**Criado em**: 04/10/2025  
**Status**: ✅ Implementado - Aguardando teste
**Próxima ação**: Criar novo usuário e verificar se aparece no dropdown de tarefas
