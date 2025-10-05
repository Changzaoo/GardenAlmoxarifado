# Sistema de Unificação de Funcionários Duplicados

## 📋 Visão Geral

Sistema automático para detectar e unificar funcionários duplicados na página de Funcionários, preservando as fotos e dados mais completos.

## 🎯 Funcionalidades

### Detecção Automática
- Detecta funcionários com **mesmo nome** (ignora maiúsculas, minúsculas e acentos)
- Detecta funcionários com **mesmo email**
- Busca em ambas as coleções: `funcionarios` e `usuario`
- Remove duplicatas exatas por ID

### Unificação Inteligente
- **Prioriza funcionários com foto** ao escolher o principal
- **Mescla dados** de todos os duplicados:
  - Foto (photoURL)
  - Cargo
  - Telefone
  - Email
  - Empresa e Setor
- **Remove** os funcionários duplicados após unificação
- **Mantém** apenas o funcionário principal com dados mesclados

## 🚀 Como Usar

### 1. Acessar o Sistema
1. Acesse a página **Funcionários**
2. Clique no botão **"Unificar"** (ícone de merge, cor laranja)
   - Localizado ao lado do botão "Grupos"
   - Visível apenas para administradores (nível >= 2)

### 2. Interface do Modal

#### Estatísticas (Topo)
```
┌─────────────────┬─────────────────┬─────────────────┐
│ Grupos          │ Total           │ Serão           │
│ Duplicados      │ Duplicados      │ Removidos       │
│ 3               │ 7               │ 4               │
└─────────────────┴─────────────────┴─────────────────┘
```

#### Botão de Ação em Lote
```
[🔀 Unificar Todos os Duplicados (3 grupos)]
```

#### Lista de Grupos Duplicados
Cada grupo mostra:
- **Tipo**: "Mesmo Nome" ou "Mesmo Email"
- **Chave**: Nome ou email duplicado
- **Quantidade**: Número de funcionários encontrados
- **Expandir/Ocultar**: Ver detalhes de cada funcionário

### 3. Visualização de Funcionários Duplicados

Cada card de funcionário mostra:
```
┌─────────────────────────────────────────────────┐
│ [FOTO]  João Silva  [PRINCIPAL] [📷]           │
│                                                 │
│ 📧 joao@email.com    💼 Desenvolvedor          │
│ 📱 (11) 98765-4321   🆔 abc12345...            │
└─────────────────────────────────────────────────┘
```

**Indicadores:**
- `[PRINCIPAL]` - Badge verde: Será mantido
- `[📷]` - Ícone azul: Tem foto de perfil
- **Borda verde**: Funcionário principal (com mais dados/foto)
- **Borda cinza**: Funcionário que será removido

### 4. Unificar Funcionários

#### Opção 1: Unificar Grupo Individual
1. Expanda um grupo de duplicados
2. Clique em **"Unificar Este Grupo"**
3. Confirme a ação

#### Opção 2: Unificar Todos
1. Clique em **"Unificar Todos os Duplicados"**
2. Confirme a ação no prompt:
   ```
   Deseja unificar todos os 3 grupos de duplicados?
   
   Isso irá remover 4 funcionário(s) duplicado(s) e
   manter apenas 1 de cada grupo com os dados mesclados.
   ```
3. Aguarde o processamento

### 5. Resultado

Após unificação:
- ✅ Toast de sucesso
- 🔄 Lista atualizada automaticamente
- 📊 Estatísticas recalculadas
- 🗑️ Duplicados removidos do Firebase

## 📐 Lógica de Escolha do Funcionário Principal

### Prioridades:
1. **Foto de perfil** (photoURL)
2. **Dados mais completos**:
   - Cargo (+2 pontos)
   - Telefone (+2 pontos)
   - Email (+1 ponto)
   - EmpresaId (+1 ponto)
   - SetorId (+1 ponto)

### Exemplo de Pontuação:
```javascript
Funcionário A:
- Foto: ✅
- Cargo: Desenvolvedor (+2)
- Telefone: (11) 98765-4321 (+2)
- Email: joao@email.com (+1)
- Pontuação: 5 pontos + FOTO = PRINCIPAL

Funcionário B:
- Foto: ❌
- Cargo: Dev (+2)
- Telefone: ❌
- Email: joao.silva@email.com (+1)
- Pontuação: 3 pontos = SERÁ REMOVIDO
```

## 🔧 Arquivos Criados

### 1. `src/utils/unificarFuncionarios.js`
**Funções principais:**

#### `detectarDuplicados(funcionarios)`
Detecta grupos de funcionários duplicados.
```javascript
const resultado = detectarDuplicados(funcionarios);
// {
//   total: 3,
//   grupos: [...],
//   totalFuncionariosDuplicados: 7,
//   podeUnificar: 4
// }
```

#### `unificarGrupoDuplicados(grupoDuplicado)`
Unifica um grupo específico.
```javascript
const resultado = await unificarGrupoDuplicados(grupo);
// {
//   sucesso: true,
//   principalId: "abc123",
//   removidos: 2,
//   dadosMesclados: { ... }
// }
```

#### `unificarTodosDuplicados(funcionarios)`
Unifica todos os duplicados de uma vez.
```javascript
const resultado = await unificarTodosDuplicados(funcionarios);
// {
//   total: 3,
//   sucessos: 3,
//   erros: 0,
//   detalhes: [...]
// }
```

#### `buscarEDetectarDuplicados()`
Busca todos os funcionários e detecta duplicados automaticamente.
```javascript
const resultado = await buscarEDetectarDuplicados();
// {
//   funcionarios: [...],
//   duplicados: { total: 3, grupos: [...] },
//   totalFuncionarios: 45
// }
```

### 2. `src/components/Funcionarios/components/ModalUnificarDuplicados.jsx`
**Componente React** para interface visual.

**Props:**
- `isOpen` (boolean): Controla visibilidade
- `onClose` (function): Callback ao fechar
- `onUnificado` (function): Callback após unificação

**Subcomponentes:**
- `GrupoDuplicado`: Exibe um grupo de duplicados
- `FuncionarioDuplicadoCard`: Card de cada funcionário

### 3. Alterações em `FuncionariosTab.jsx`
- Adicionado import do modal
- Adicionado estado `showUnificarModal`
- Adicionado prop `onUnificar` na `BarraBuscaModerna`
- Renderiza `ModalUnificarDuplicados`

### 4. Alterações em `BarraBuscaModerna.jsx`
- Adicionado import do ícone `Merge`
- Adicionado prop `onUnificar`
- Adicionado botão "Unificar" (laranja/vermelho)

## 🎨 Estilo Visual

### Cores e Gradientes
- **Botão Unificar**: `from-orange-500 to-red-500`
- **Header Modal**: `from-orange-500 to-red-500`
- **Grupos Duplicados**: Fundo laranja
- **Funcionário Principal**: Borda e fundo verde
- **Botão Ação**: `from-blue-500 to-indigo-500`
- **Botão Todos**: `from-green-500 to-emerald-500`

### Animações (Framer Motion)
- **Modal**: Fade + Scale
- **Grupos**: Accordion com height animation
- **Botões**: Hover scale + shadow
- **Cards**: Hover elevate

## 🔍 Exemplo de Uso Completo

```javascript
// 1. Usuário clica em "Unificar" na página de Funcionários
setShowUnificarModal(true);

// 2. Modal carrega automaticamente os duplicados
const resultado = await buscarEDetectarDuplicados();
setDuplicados(resultado.duplicados);

// 3. Exibe estatísticas:
// - 3 grupos duplicados
// - 7 funcionários totais
// - 4 serão removidos

// 4. Usuário clica "Unificar Todos"
const resultadoUnificacao = await unificarTodosDuplicados(resultado.funcionarios);
// { total: 3, sucessos: 3, erros: 0 }

// 5. Toast de sucesso
showToast('3 grupo(s) unificado(s) com sucesso!', 'success');

// 6. Recarrega lista
await carregarDuplicados();
onUnificado();
```

## ⚠️ Avisos Importantes

### Backup
- **Sempre faça backup** antes de unificar em produção
- Operação **não pode ser desfeita** automaticamente
- Funcionários removidos são deletados permanentemente

### Permissões
- Funcionalidade visível apenas para **administradores** (nível >= 2)
- Requer permissão de escrita no Firebase

### Validações
- Não unifica funcionários demitidos
- Não unifica se não houver duplicados
- Valida dados antes de mesclar

## 🐛 Troubleshooting

### Duplicados não aparecem
- ✅ Verifique se há funcionários com mesmo nome/email
- ✅ Confirme que não são IDs idênticos
- ✅ Veja console para logs de detecção

### Erro ao unificar
- ✅ Verifique permissões no Firebase
- ✅ Confirme conexão com internet
- ✅ Veja console para mensagens de erro

### Foto não aparece após unificação
- ✅ Verifique se algum duplicado tinha photoURL
- ✅ Confirme URL da foto válida
- ✅ Recarregue a página

## 📊 Estatísticas e Logs

O sistema gera logs detalhados no console:

```javascript
// Detecção
console.log('🔍 Detectando duplicados...');
console.log('✅ Encontrados 3 grupos de duplicados');

// Unificação
console.log('🔗 Unificando grupo: João Silva');
console.log('📸 Mantendo foto de: joão@email.com');
console.log('🗑️ Removendo: 2 duplicados');
console.log('✅ Grupo unificado com sucesso');
```

## 🚀 Melhorias Futuras

- [ ] Histórico de unificações
- [ ] Desfazer unificação (backup automático)
- [ ] Unificação por outros campos (CPF, matrícula)
- [ ] Sugestões inteligentes de merge
- [ ] Comparação lado a lado antes de unificar
- [ ] Exportar relatório de duplicados
- [ ] Agendar unificação automática

## 📝 Changelog

### v1.0.0 (05/10/2025)
- ✨ Implementação inicial
- 🎨 Interface visual completa
- 🔍 Detecção por nome e email
- 🔗 Unificação individual e em lote
- 📸 Preservação de fotos
- 📊 Estatísticas detalhadas
- ✅ Build: 774.54 kB

---

**Desenvolvido para o sistema WorkFlow Control**
*Gestão inteligente de funcionários*
