# 🧪 TESTE RÁPIDO - Usuários nas Tarefas

## ⚡ Verificação Rápida (2 minutos)

### ✅ **PASSO 1: Verificar Console**

1. Abrir o sistema
2. Apertar **F12** (abrir console do navegador)
3. Procurar por estes logs:

```
📋 Funcionários carregados da coleção "funcionarios": X
👥 Usuários carregados da coleção "usuarios": X
✅ Total mesclado (funcionarios + usuarios): X
   - Da coleção "funcionarios": X
   - Da coleção "usuarios": X
```

**O que verificar:**
- ✅ **"usuarios": > 0** → Usuários estão sendo carregados!
- ✅ **Total mesclado aumentou** → Mesclagem funcionando!

---

### ✅ **PASSO 2: Criar Nova Tarefa**

1. Ir para página **"Tarefas"**
2. Clicar em **"+ Nova Tarefa"**
3. No campo **"Funcionários Responsáveis"**, abrir o dropdown

**O que procurar:**
- ✅ **Nome "Ruan" aparece na lista?**
- ✅ **Outros usuários novos aparecem?**

---

### ✅ **PASSO 3: Atribuir Tarefa**

1. Selecionar **"Ruan"** da lista
2. Preencher:
   - **Título**: "Teste de atribuição"
   - **Descrição**: "Verificar se Ruan recebe"
   - **Prioridade**: Qualquer uma
3. Clicar em **"Criar Tarefa"**

**O que verificar:**
- ✅ Mensagem "Tarefa criada com sucesso!"
- ✅ Tarefa aparece na lista
- ✅ Nome "Ruan" visível na tarefa

---

### ✅ **PASSO 4: Verificar Logs de Criação**

No console (F12), procurar:

```
🔔 Criando notificações para funcionários: ["userId123"]
📬 Enviando notificação para: Ruan (ID: userId123)
✅ Todas as notificações foram criadas com sucesso
```

**O que verificar:**
- ✅ Nome "Ruan" aparece no log
- ✅ ID está correto
- ✅ Notificação criada com sucesso

---

## 🎯 Resultados Esperados

| Teste | Esperado | Status |
|-------|----------|--------|
| Console mostra "usuarios": > 0 | ✅ Sim | [ ] |
| Ruan aparece no dropdown | ✅ Sim | [ ] |
| Consegue selecionar Ruan | ✅ Sim | [ ] |
| Tarefa é criada com sucesso | ✅ Sim | [ ] |
| Nome de Ruan aparece na tarefa | ✅ Sim | [ ] |
| Notificação é enviada | ✅ Sim | [ ] |

---

## ❌ Se Não Funcionar

### **Problema 1: Console não mostra "usuarios": > 0**

**Causa**: Coleção `usuarios` está vazia ou não existe

**Solução**:
1. Verificar se o usuário foi criado corretamente
2. Abrir Firebase Console
3. Verificar coleção `usuarios`
4. Confirmar que o documento do Ruan existe

---

### **Problema 2: Ruan não aparece no dropdown**

**Causa**: Usuário está inativo ou nome está errado

**Solução no Console (F12)**:
```javascript
// Verificar dados do usuário
const funcionarios = /* acessar contexto */;
console.log('Usuários da coleção usuarios:', 
  funcionarios.filter(f => f.origem === 'usuarios')
);
```

Verificar:
- Campo `nome` está preenchido?
- Campo `ativo` é `true`?
- Campo `email` está correto?

---

### **Problema 3: Erro ao criar tarefa**

**Causa**: Dados do usuário estão incompletos

**Verificar no console**:
```
❌ Erro ao criar tarefa: [mensagem do erro]
```

**Solução**: Verificar se o usuário tem todos os campos obrigatórios

---

## 📸 Screenshots Necessários (Se houver problema)

Por favor, enviar:

1. **Screenshot do Console (F12)** mostrando os logs:
   ```
   📋 Funcionários carregados...
   👥 Usuários carregados...
   ✅ Total mesclado...
   ```

2. **Screenshot do Dropdown** de "Funcionários Responsáveis"
   - Lista completa de nomes visíveis

3. **Screenshot da Tarefa Criada**
   - Mostrando nome do Ruan

---

## 🔧 Debug Avançado (Se necessário)

Execute no Console (F12):

```javascript
// 1. Verificar estrutura do provider
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebaseConfig';

// Verificar coleção 'usuarios'
const usuariosSnapshot = await getDocs(collection(db, 'usuarios'));
console.log('Total na coleção usuarios:', usuariosSnapshot.size);
usuariosSnapshot.forEach(doc => {
  console.log('Usuário:', doc.id, doc.data());
});

// Verificar coleção 'funcionarios'
const funcionariosSnapshot = await getDocs(collection(db, 'funcionarios'));
console.log('Total na coleção funcionarios:', funcionariosSnapshot.size);
funcionariosSnapshot.forEach(doc => {
  console.log('Funcionário:', doc.id, doc.data());
});
```

---

**Tempo estimado**: 2 minutos  
**Dificuldade**: Fácil  
**Objetivo**: Confirmar que usuários novos aparecem nas tarefas
