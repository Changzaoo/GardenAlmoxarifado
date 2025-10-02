# 🚀 Guia Rápido - Sistema de Inventário

## ⚡ Início Rápido

### 1️⃣ Acesse a Aba Inventário
No menu principal, clique em **Inventário** para acessar o hub centralizado.

### 2️⃣ Navegue pelas Sub-abas
```
┌─────────────────────────────────────────────────────────┐
│ Inventário │ Compras │ Danificadas │ Perdidas │ Verificação │
└─────────────────────────────────────────────────────────┘
```

**5 abas disponíveis:**
- 📦 **Inventário** - Lista completa de itens com disponibilidade
- 🛒 **Compras** - Histórico e gestão de compras
- 🔧 **Danificadas** - Ferramentas danificadas
- ❌ **Perdidas** - Ferramentas perdidas
- ✅ **Verificação** - Verificação mensal com comparações visuais

---

## 💡 Funcionalidades Principais

### 📦 Aba Inventário

**Ver Item:**
- Clique em qualquer item para ver detalhes completos
- Veja quantidade total, disponível e em uso

**Adicionar Novo Item:**
1. Clique no botão **Adicionar Item**
2. Preencha: Nome, Categoria, Quantidade, etc.
3. Clique em **Salvar**

**Filtros:**
- Por categoria
- Por setor
- Busca por nome

### 🔄 Sistema de Empréstimos

**Ver Disponibilidade:**
```
┌────────────┬───────┬───────────┬────────┐
│ Item       │ Total │ Disponível│ Em Uso │
├────────────┼───────┼───────────┼────────┤
│ Martelo    │ 10    │ 8         │ 2      │
│ Furadeira  │ 15    │ 10        │ 5      │
└────────────┴───────┴───────────┴────────┘
```

**Fórmula:**
```
Disponível = Total - Em Uso
```

**Criar Empréstimo:**
1. Vá para aba **Empréstimos**
2. Clique em **Novo Empréstimo**
3. Selecione colaborador e ferramentas
4. Defina quantidades
5. Confirme

**O que acontece:**
- ✅ `disponível` diminui automaticamente
- ✅ `emUso` aumenta automaticamente
- ✅ Sistema valida disponibilidade antes de emprestar

**Devolver Empréstimo:**
1. Na lista de empréstimos, encontre o item
2. Clique em **Devolver**
3. Escolha quantidade (total ou parcial)
4. Confirme

**O que acontece:**
- ✅ `disponível` aumenta automaticamente
- ✅ `emUso` diminui automaticamente
- ✅ Sistema recalcula valores corretamente

### ✅ Verificação Mensal

**Acessar:**
Clique na aba **Verificação** dentro de Inventário

**Interface:**
```
┌──────────────────────────────────────────────┐
│ 📦 Total de Itens    🔄 Empréstimos Ativos   │
│    45                   12                   │
│                                              │
│ ✅ Verificações Realizadas                   │
│    3                                         │
└──────────────────────────────────────────────┘
```

**Tabela de Diferenças:**
```
┌─────────────┬──────────┬───────────┬──────────┬───────┬──────────┐
│ Item        │ Anterior │ Disponível│ Emprestado│ Atual │ Diferença│
├─────────────┼──────────┼───────────┼──────────┼───────┼──────────┤
│ Martelo     │ 8        │ 8         │ 2        │ 10    │ +2 📈    │
│ Furadeira   │ 15       │ 10        │ 3        │ 13    │ -2 📉    │
│ Chave Allen │ 20       │ 18        │ 2        │ 20    │ 0  ➖    │
└─────────────┴──────────┴───────────┴──────────┴───────┴──────────┘
```

**Legendas:**
- 📈 **Verde** = Item aumentou (compra)
- 📉 **Vermelho** = Item diminuiu (perda/dano)
- ➖ **Cinza** = Sem mudança

**Nova Verificação:**
1. Clique em **Nova Verificação**
2. O sistema captura estado atual
3. Registra para comparação futura

---

## 🛠️ Ferramentas de Debug

### Para Desenvolvedores / Administradores

**Abrir Console:**
- Pressione `F12`
- Vá para aba **Console**

### 🔍 Diagnosticar Problemas

**Verificar Todo o Inventário:**
```javascript
await window.workflowDebug.diagnosticarInventario()
```

**Resultado:**
```
🔍 Iniciando diagnóstico completo do inventário...
📦 Total de itens no inventário: 45
📋 Total de empréstimos ativos: 12

✅ Nenhuma inconsistência encontrada! Inventário está correto.
```

**Ou, se houver problemas:**
```
⚠️ Encontradas 2 inconsistências:
┌──────────┬──────────────┬───────────────┬────────────────┬────────────────┬─────────────┐
│ Item     │ Disp. Atual  │ Disp. Esperado│ Em Uso Atual   │ Em Uso Esperado│ Empréstimos │
├──────────┼──────────────┼───────────────┼────────────────┼────────────────┼─────────────┤
│ Martelo  │ 5            │ 8             │ 5              │ 2              │ 1           │
└──────────┴──────────────┴───────────────┴────────────────┴────────────────┴─────────────┘
```

### 🔧 Corrigir Problemas

**Corrigir Item Específico:**
```javascript
await window.workflowDebug.corrigirEstadoItem('Martelo')
```

**Resultado:**
```
🔧 Iniciando correção de estado para: Martelo
📦 Item encontrado: {quantidadeTotal: 10, disponivelAtual: 5}
🔍 Verificando 12 empréstimos ativos
📋 Empréstimos ativos encontrados: 1
✅ Corrigindo estado
✔️ Verificação pós-correção: disponivel: 8, emUso: 2
```

**Corrigir TUDO Automaticamente:**
```javascript
await window.workflowDebug.corrigirTodoInventario()
```

**Resultado:**
```
🔍 Iniciando diagnóstico completo...
⚠️ Encontradas 3 inconsistências
🔧 Corrigindo inconsistências automaticamente...
⚙️ Corrigindo Martelo...
⚙️ Corrigindo Furadeira...
⚙️ Corrigindo Chave Inglesa...
✅ Correção completa!
```

---

## 🎯 Cenários Comuns

### Cenário 1: Item Devolvido Não Aumentou Disponibilidade

**Problema:**
- Colaborador devolveu 3 furadeiras
- Disponível continua em 10 (deveria ser 13)

**Solução:**
1. Abra console (F12)
2. Execute:
   ```javascript
   await window.workflowDebug.corrigirEstadoItem('Furadeira')
   ```
3. Verifique se corrigiu:
   ```javascript
   await window.workflowDebug.diagnosticarInventario()
   ```

### Cenário 2: Múltiplos Itens com Problema

**Problema:**
- Vários itens mostrando valores incorretos

**Solução:**
```javascript
// Corrige tudo de uma vez
await window.workflowDebug.corrigirTodoInventario()
```

### Cenário 3: Verificar Antes de Relatório Mensal

**Ação Preventiva:**
```javascript
// 1. Diagnostica
const resultado = await window.workflowDebug.diagnosticarInventario()

// 2. Se encontrou problemas, corrige
if (resultado.temInconsistencias) {
  await window.workflowDebug.corrigirTodoInventario()
}

// 3. Verifica novamente
await window.workflowDebug.diagnosticarInventario()
// ✅ Nenhuma inconsistência encontrada!
```

Agora pode fazer a verificação mensal com confiança! ✅

---

## 📊 Entendendo os Números

### Exemplo Prático

**Situação Inicial:**
```
Item: Martelo
Quantidade Total: 10
Disponível: 10
Em Uso: 0
```

**Após Empréstimo de 3:**
```
Item: Martelo
Quantidade Total: 10
Disponível: 7    ← Diminuiu
Em Uso: 3        ← Aumentou
```

**Após Devolução de 2:**
```
Item: Martelo
Quantidade Total: 10
Disponível: 9    ← Aumentou
Em Uso: 1        ← Diminuiu
```

**Após Devolução do Último:**
```
Item: Martelo
Quantidade Total: 10
Disponível: 10   ← Voltou ao normal
Em Uso: 0        ← Voltou a zero
```

**Validação:**
```
Sempre: Disponível + Em Uso = Quantidade Total
        9 + 1 = 10 ✅
```

---

## ⚠️ Erros Comuns

### ❌ "Quantidade insuficiente para emprestar"

**Causa:**
Item não tem quantidade disponível suficiente.

**Verificar:**
1. Vá para aba Inventário
2. Encontre o item
3. Veja coluna "Disponível"

**Solução:**
- Se `Disponível = 0`: Aguarde devolução de empréstimos
- Se `Disponível < 0`: Execute correção (veja seção Debug)
- Se valor estiver errado: Execute `corrigirEstadoItem()`

### ❌ Item não aparece na lista

**Causa:**
Filtros ativos ou item de outro setor.

**Solução:**
1. Limpe todos os filtros
2. Verifique permissão de setor
3. Confirme que item existe no banco

### ❌ Empréstimos ativos não aparecem

**Causa:**
Status do empréstimo pode estar incorreto.

**Solução:**
1. Verifique filtro de status
2. Confirme que status = "emprestado"
3. Execute diagnóstico

---

## 📱 Interface Mobile

### Menu Compacto
Em dispositivos móveis, as abas aparecem em formato vertical compacto:

```
┌─────────────┐
│ 📦 Inventário │ (15)
├─────────────┤
│ 🛒 Compras   │ (3)
├─────────────┤
│ 🔧 Danificadas│ (2)
├─────────────┤
│ ❌ Perdidas  │ (1)
├─────────────┤
│ ✅ Verificação│ (5)
└─────────────┘
```

### Gestos
- **Deslizar** → Trocar de aba
- **Tocar** → Selecionar item
- **Segurar** → Menu de contexto

---

## 🎓 Dicas Profissionais

### 1. Verificação Regular
Execute diagnóstico semanalmente:
```javascript
await window.workflowDebug.diagnosticarInventario()
```

### 2. Antes de Relatórios
Sempre corrija inconsistências antes de gerar relatórios:
```javascript
await window.workflowDebug.corrigirTodoInventario()
```

### 3. Monitore Logs
Mantenha console aberto durante operações críticas para ver logs em tempo real:
```
🔄 Iniciando atualização...
📦 Item encontrado...
✅ Estado atualizado...
```

### 4. Badges de Contador
Use os badges nas abas para monitorar rapidamente:
- 📦 **Inventário (45)** → 45 itens totais
- 🔧 **Danificadas (2)** → 2 itens danificados
- ❌ **Perdidas (1)** → 1 item perdido

### 5. Verificação Mensal
Faça no início de cada mês para ter histórico consistente.

---

## 🆘 Ajuda Rápida

| Problema | Solução Rápida |
|----------|----------------|
| Item não atualiza | `corrigirEstadoItem('NomeDoItem')` |
| Múltiplos erros | `corrigirTodoInventario()` |
| Verificar estado | `diagnosticarInventario()` |
| Valores negativos | Execute correção automática |
| Empréstimo travado | Verifique status no Firebase |

---

## 📞 Comandos de Console - Cola

**Copie e cole no console (F12):**

```javascript
// Ver funções disponíveis
window.workflowDebug

// Diagnosticar tudo
await window.workflowDebug.diagnosticarInventario()

// Corrigir item específico
await window.workflowDebug.corrigirEstadoItem('NOME_DO_ITEM')

// Corrigir tudo automaticamente
await window.workflowDebug.corrigirTodoInventario()
```

---

## ✅ Checklist Diário

- [ ] Verificar se há inconsistências
- [ ] Processar devoluções pendentes
- [ ] Atualizar itens danificados/perdidos
- [ ] Revisar empréstimos atrasados
- [ ] Verificar níveis de estoque baixo

## ✅ Checklist Mensal

- [ ] Executar diagnóstico completo
- [ ] Corrigir todas inconsistências
- [ ] Fazer nova verificação mensal
- [ ] Gerar relatório de movimentação
- [ ] Revisar compras necessárias

---

**🎉 Pronto! Você está apto para usar o sistema de inventário corrigido!**

**Documentação completa:** Ver `SISTEMA_INVENTARIO_CORRIGIDO.md`
