# Sistema de Tarefas Semanais e Melhorias Visuais

## 📋 Visão Geral

Este documento descreve as melhorias implementadas no sistema de tarefas do WorkFlow, incluindo:
1. **Melhorias visuais** na página de tarefas
2. **Sistema de atribuição semanal** de tarefas
3. **Notificações automáticas** para novas tarefas
4. **Integração com perfil do usuário**
5. **Menu mobile atualizado** para funcionários

---

## ✨ 1. Melhorias Visuais na Página de Tarefas

### Cards Modernos

Os cards de tarefas foram completamente redesenhados com:

- **Barra de prioridade colorida** no topo:
  - 🔥 **Alta**: Gradiente vermelho-rosa (`from-red-500 to-pink-600`)
  - ⚡ **Média**: Gradiente amarelo-laranja (`from-yellow-500 to-orange-600`)
  - ✓ **Baixa**: Gradiente verde-azul (`from-green-500 to-teal-600`)

- **Efeitos de hover**: 
  - Sombra elevada (`shadow-lg → shadow-2xl`)
  - Transformação 3D (`hover:-translate-y-1`)
  - Animações suaves (`transition-all duration-300`)

- **Badges de status coloridos**:
  - **Pendente**: Cinza (`bg-gray-100 dark:bg-gray-700`)
  - **Em Andamento**: Azul com pulso (`bg-blue-100 dark:bg-blue-900/40 animate-pulse`)
  - **Pausada**: Amarelo (`bg-yellow-100 dark:bg-yellow-900/40`)
  - **Concluída**: Verde (`bg-green-100 dark:bg-green-900/40`)

### Layout de Funcionários

```jsx
// Novo design com ponto de status animado
<div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border border-blue-200 dark:border-blue-700 rounded-full text-sm font-medium text-blue-700 dark:text-blue-300 hover:shadow-md transition-shadow">
  <div className="w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400 animate-pulse" />
  {func.nome}
</div>
```

### Botões de Ação com Gradiente

- **Iniciar**: Azul (`from-blue-500 to-blue-600`)
- **Pausar**: Amarelo-laranja (`from-yellow-500 to-orange-500`)
- **Concluir**: Verde-esmeralda (`from-green-500 to-emerald-600`)
- **Avaliar**: Amarelo-âmbar (`from-yellow-500 to-amber-600`)

Todos com efeitos:
- `hover:shadow-lg`
- `hover:scale-105`
- `transition-all duration-200`

### Avaliações em Destaque

Box gradiente para tarefas concluídas:

```jsx
<div className="p-3 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
  <div className="flex items-center justify-between">
    <span>👔 Supervisor:</span>
    <div className="flex items-center gap-0.5">
      {/* 5 estrelas com hover scale */}
      <Star className="w-4 h-4 transition-transform hover:scale-110" />
    </div>
  </div>
</div>
```

---

## 📅 2. Sistema de Atribuição Semanal

### Componente: `AtribuirTarefaSemanal.jsx`

Modal em 3 etapas para criar tarefas semanais em lote.

### Etapa 1: Dados da Tarefa

```jsx
{
  titulo: string,           // Obrigatório
  descricao: string,        // Opcional
  prioridade: 'baixa' | 'média' | 'alta'
}
```

**Seletor de prioridade visual**:
- Botões com gradiente que escalam ao serem selecionados (`scale-105`)
- Emojis temáticos: 🔥 Alta | ⚡ Média | ✓ Baixa

### Etapa 2: Selecionar Semana

**Campos de data**:
- `semanaInicio`: Data de início (padrão: segunda-feira da semana atual)
- `semanaFim`: Data de fim (padrão: domingo da semana atual)

**Atalhos rápidos**:
```jsx
[Esta Semana] [Próxima Semana] [Em 2 Semanas] [Em 3 Semanas]
```

Cada botão define automaticamente:
```javascript
const proximaSemana = addDays(new Date(), 7);
semanaInicio: format(startOfWeek(proximaSemana, { weekStartsOn: 1 }), 'yyyy-MM-dd')
semanaFim: format(endOfWeek(proximaSemana, { weekStartsOn: 1 }), 'yyyy-MM-dd')
```

**Preview do período**:
```jsx
📅 Período selecionado:
04 de outubro até 10 de outubro de 2025
```

### Etapa 3: Selecionar Funcionários

**Seleção múltipla**:
- Grid responsivo: 1 col mobile → 2 cols tablet → 3 cols desktop
- Cards clicáveis com checkbox visual
- Botões "Todos" e "Limpar" para seleção em massa
- Contador: `{X} de {Y} funcionários selecionados`

**Card de funcionário**:
```jsx
<button className={`p-4 rounded-xl border-2 transition-all ${
  selecionado 
    ? 'bg-green-100 border-green-500 shadow-lg scale-105'
    : 'bg-white border-gray-200 hover:border-green-300'
}`}>
  <CheckCircle /> {/* Aparece quando selecionado */}
  <p>{func.nome}</p>
  <p className="text-xs">{func.email}</p>
</button>
```

### Resumo Final

Antes de confirmar, exibe:
```
📋 Tarefa: Revisar documentos
📅 Período: 04 de outubro - 10 de outubro de 2025
👥 Funcionários: 5
🔥 Prioridade: Alta
```

### Estrutura de Dados Salva

```javascript
{
  titulo: "Revisar documentos",
  descricao: "Revisar todos os documentos...",
  prioridade: "alta",
  funcionariosIds: ["id1"],           // Array com 1 funcionário
  funcionarios: [{                     // Array com dados completos
    id: "id1",
    nome: "João Silva"
  }],
  semanaInicio: "2025-10-04",         // ✨ NOVO
  semanaFim: "2025-10-10",            // ✨ NOVO
  status: "pendente",
  dataCriacao: "2025-10-03T14:30:00Z",
  tipo: "semanal"                      // ✨ NOVO
}
```

**Importante**: O sistema cria **1 tarefa por funcionário**, não uma tarefa compartilhada!

---

## 🔔 3. Sistema de Notificações de Tarefas

### Notificação Automática

Quando tarefas são atribuídas via `AtribuirTarefaSemanal`, o sistema automaticamente cria notificações:

```javascript
await addDoc(collection(db, 'notificacoes'), {
  tipo: 'nova_tarefa',
  titulo: '📋 Nova Tarefa Semanal',
  mensagem: `Você recebeu uma nova tarefa: "${formData.titulo}"`,
  usuarioId: funcId,           // ID do funcionário
  lida: false,
  dataCriacao: new Date().toISOString(),
  metadados: {
    tarefaTitulo: formData.titulo,
    semanaInicio: formData.semanaInicio,
    semanaFim: formData.semanaFim,
    prioridade: formData.prioridade
  }
});
```

### Visualização de Notificações

Os funcionários veem a notificação na:
1. **Página de Notificações** (ícone sino)
2. **Badge de contador** no ícone
3. **Toast notification** (se o sistema de push estiver ativo)

### Metadados Disponíveis

A notificação inclui:
- `tarefaTitulo`: Nome da tarefa
- `semanaInicio`: Data inicial
- `semanaFim`: Data final
- `prioridade`: Nível de prioridade

Esses dados podem ser usados para:
- Criar links diretos para a tarefa
- Filtrar notificações por período
- Priorizar visualização

---

## 👤 4. Integração com Meu Perfil

### ProfileTab: Aba "Minhas Tarefas"

O componente `ProfileTab.jsx` já possuía suporte para tarefas, mas foi atualizado:

```jsx
<TarefasTab 
  showOnlyUserTasks={true}      // ✅ Mostra apenas tarefas do usuário
  showAddButton={false}          // ✅ Esconde botão de criar (funcionários não criam)
  funcionarios={funcionarios}    // Lista de funcionários para resolver IDs
/>
```

### Filtro de Tarefas do Usuário

A função `isUserAssigned` verifica se a tarefa pertence ao usuário:

```javascript
const isUserAssigned = (tarefa) => {
  const matchUser = (value) => {
    // Match por ID exato
    if (value === usuarioId) return true;
    
    // Match por nome (exato ou parcial)
    if (usuarioNome && value.includes(usuarioNome)) return true;
    
    // Match por email
    if (usuarioEmail && value === usuarioEmail) return true;
    
    return false;
  };
  
  // Verifica array de funcionáriosIds
  const estaNosIds = tarefa.funcionariosIds?.some(matchUser);
  
  // Verifica campos legados
  const ehFuncionario = matchUser(tarefa.funcionario);
  
  return estaNosIds || ehFuncionario;
};
```

### Estatísticas Atualizadas

O perfil exibe:

```jsx
<div className="grid grid-cols-3 gap-4">
  <div>{stats.tarefasConcluidas} Tarefas Concluídas</div>
  <div>{stats.ferramentasEmprestadas} Ferramentas</div>
  <div>{stats.mediaEstrelas.toFixed(1)} ⭐</div>
</div>
```

**Sistema de Pontuação**:
```javascript
const calcularPontuacao = (dados) => ({
  ferramentas: dados.ferramentasDevolvidas * 20,    // 20 pts por ferramenta
  tarefas: dados.tarefasConcluidas * 50,            // 50 pts por tarefa
  avaliacao: Math.round(dados.mediaEstrelas * 10)   // 10 pts por estrela
});
```

---

## 📱 5. Menu Inferior Mobile para Funcionários

### Alteração em `getAbasMenuInferior()`

**Antes**: `'meu-perfil'` era excluído para todos os níveis  
**Depois**: `'meu-perfil'` aparece para funcionários (nível 1)

```javascript
const getAbasMenuInferior = () => {
  if (!menuPersonalizado) {
    // Para funcionários (nível 1), incluir 'meu-perfil' no menu inferior
    const filtroAbasExcluidas = usuario?.nivel === NIVEIS_PERMISSAO.FUNCIONARIO
      ? (a => a.id !== 'ranking' && a.id !== itemFavorito)         // ✅ MANTÉM meu-perfil
      : (a => a.id !== 'ranking' && a.id !== 'meu-perfil' && a.id !== itemFavorito); // ❌ REMOVE meu-perfil
    
    return abas
      .filter(filtroAbasExcluidas)
      .filter(aba => aba.permissao?.() !== false)
      .slice(0, 3);
  }
  // ... lógica para menu personalizado
};
```

### Layout do Menu Mobile

```
[Aba 1] [Aba 2] [🔵 Favorito] [Meu Perfil] [☰ Menu]
         ├─────┤  └─ 20% elevado  └────────┤
         Laterais      Centro         Direita
```

**Para Funcionários (Nível 1)**:
```
[Empréstimos] [Presença] [🔵 Escala] [Meu Perfil] [☰]
```

**Para Supervisores/Admins (Nível 2+)**:
```
[Empréstimos] [Presença] [🔵 Escala] [Tarefas] [☰]
```

---

## 🎨 Estrutura de Cores e Temas

### Prioridades

| Nível | Cor Base | Gradiente | Uso |
|-------|----------|-----------|-----|
| 🔥 Alta | `red-500` | `from-red-500 to-pink-600` | Barra superior, badges |
| ⚡ Média | `yellow-500` | `from-yellow-500 to-orange-600` | Barra superior, badges |
| ✓ Baixa | `green-500` | `from-green-500 to-teal-600` | Barra superior, badges |

### Status

| Status | Cor Light | Cor Dark | Ícone |
|--------|-----------|----------|-------|
| Pendente | `bg-gray-100 text-gray-700` | `bg-gray-700 text-gray-300` | `<CircleDotDashed />` |
| Em Andamento | `bg-blue-100 text-blue-700` | `bg-blue-900/40 text-blue-300` | `<Clock />` + `animate-pulse` |
| Pausada | `bg-yellow-100 text-yellow-700` | `bg-yellow-900/40 text-yellow-300` | `<PauseCircle />` |
| Concluída | `bg-green-100 text-green-700` | `bg-green-900/40 text-green-300` | `<CheckCircle />` |

### Botões de Ação

```jsx
// Iniciar/Retomar
className="bg-gradient-to-r from-blue-500 to-blue-600 hover:shadow-lg hover:scale-105"

// Pausar
className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:shadow-lg hover:scale-105"

// Concluir
className="bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-lg hover:scale-105"

// Avaliar
className="bg-gradient-to-r from-yellow-500 to-amber-600 hover:shadow-lg hover:scale-105"
```

---

## 🔧 Uso do Sistema

### Criar Tarefa Semanal (Supervisor/Admin)

1. Acesse a página **Tarefas**
2. Clique no botão **"📅 Tarefa Semanal"** (roxo com gradiente)
3. **Etapa 1**: Preencha título, descrição e prioridade
4. **Etapa 2**: Selecione a semana (use atalhos ou datas customizadas)
5. **Etapa 3**: Marque os funcionários que receberão a tarefa
6. Clique em **"✓ Criar Tarefas Semanais"**

### Visualizar Tarefas (Funcionário)

**Opção 1**: Menu inferior → **Meu Perfil** → Aba **"Minhas Tarefas"**  
**Opção 2**: Menu lateral → **Tarefas** (se tiver permissão)

### Notificações

1. Clique no ícone **🔔** (sino) no topo
2. Veja a lista de notificações não lidas
3. Notificações de tarefas aparecem como:
   ```
   📋 Nova Tarefa Semanal
   Você recebeu uma nova tarefa: "Revisar documentos"
   ```

---

## 📊 Estrutura de Collections Firestore

### Collection: `tarefas`

```javascript
{
  id: "auto-generated-id",
  titulo: "Revisar documentos",
  descricao: "Revisar todos os documentos pendentes...",
  prioridade: "alta" | "média" | "baixa",
  
  // Arrays de funcionários
  funcionariosIds: ["userId1", "userId2"],      // IDs puros
  funcionarios: [                                // Objetos completos
    { id: "userId1", nome: "João Silva" },
    { id: "userId2", nome: "Maria Santos" }
  ],
  
  // Campos de semana (NOVOS)
  semanaInicio: "2025-10-04",                   // ISO date string
  semanaFim: "2025-10-10",                      // ISO date string
  tipo: "semanal" | undefined,                  // Identificador
  
  // Status e avaliação
  status: "pendente" | "em_andamento" | "pausada" | "concluida",
  avaliacaoSupervisor: 5,                       // 1-5 estrelas
  avaliacaoFuncionario: 4,                      // 1-5 estrelas
  
  // Timestamps
  dataCriacao: "2025-10-03T14:30:00Z",
  dataInicio: "2025-10-04T08:00:00Z",
  dataConclusao: "2025-10-10T17:00:00Z",
  
  // Controle de tempo
  tempoPausado: 3600000,                        // milissegundos
  dataUltimaPausa: "2025-10-05T10:00:00Z"
}
```

### Collection: `notificacoes`

```javascript
{
  id: "auto-generated-id",
  tipo: "nova_tarefa",                          // Tipo específico
  titulo: "📋 Nova Tarefa Semanal",
  mensagem: "Você recebeu uma nova tarefa: \"Revisar documentos\"",
  usuarioId: "userId1",                         // Destinatário
  lida: false,
  dataCriacao: "2025-10-03T14:30:00Z",
  
  // Metadados customizados
  metadados: {
    tarefaTitulo: "Revisar documentos",
    semanaInicio: "2025-10-04",
    semanaFim: "2025-10-10",
    prioridade: "alta"
  }
}
```

---

## 🚀 Próximos Passos Sugeridos

### Melhorias Futuras

1. **Filtro por semana** na página de tarefas:
   ```jsx
   <select value={filtroSemana}>
     <option value="todas">Todas as semanas</option>
     <option value="esta-semana">Esta semana</option>
     <option value="proxima-semana">Próxima semana</option>
   </select>
   ```

2. **Calendário visual** para tarefas semanais:
   - Visualização em grade semanal
   - Drag & drop para reagendar
   - Cores por prioridade

3. **Notificações push** (PWA):
   - Alertas no início da semana
   - Lembretes de tarefas próximas ao prazo
   - Notificação de novas atribuições

4. **Dashboard de produtividade**:
   - Gráfico de tarefas concluídas por semana
   - Comparação com semanas anteriores
   - Ranking de funcionários mais produtivos

5. **Comentários em tarefas**:
   - Thread de discussão
   - Anexos de arquivos
   - Menções a outros usuários

6. **Recorrência de tarefas**:
   - Tarefas semanais automáticas
   - Padrões customizáveis (toda segunda, etc.)
   - Histórico de execuções

---

## 📝 Notas Técnicas

### Performance

- **Lazy loading** dos cards: Carrega apenas 10 tarefas por vez (`quantidadeExibida`)
- **useMemo** para filtros: Evita recálculos desnecessários
- **onSnapshot** otimizado: Queries com índices no Firestore

### Acessibilidade

- Todos os botões têm `aria-label` implícito
- Cores com contraste mínimo WCAG AA
- Suporte a temas claro/escuro
- Touch targets de 44x44px (mobile)

### Responsividade

```jsx
// Grid adaptativo
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"

// Texto truncado em mobile
className="text-xs sm:text-sm truncate"

// Ícones redimensionados
className="w-4 h-4 sm:w-5 sm:h-5"
```

---

## 🐛 Troubleshooting

### Tarefa não aparece no Meu Perfil

**Causa**: `funcionarios` array vazio ou `funcionariosIds` incorreto  
**Solução**: Verificar se a tarefa foi criada com os campos corretos:

```javascript
// ✅ CORRETO
funcionariosIds: ["userId123"]
funcionarios: [{ id: "userId123", nome: "João" }]

// ❌ INCORRETO
funcionariosIds: []
funcionarios: []
```

### Notificação não foi criada

**Causa**: Erro no `addDoc` para `notificacoes`  
**Solução**: Verificar permissões do Firestore:

```javascript
// firestore.rules
match /notificacoes/{notifId} {
  allow create: if request.auth != null;
  allow read: if request.auth.uid == resource.data.usuarioId;
}
```

### Menu "Meu Perfil" não aparece no mobile

**Causa**: Nível de permissão incorreto  
**Solução**: Verificar se `usuario.nivel === 1` (Funcionário)

```javascript
console.log('Nível do usuário:', usuario.nivel);
console.log('Abas do menu:', getAbasMenuInferior());
```

---

## 📚 Referências

- **date-fns**: Manipulação de datas ([https://date-fns.org/](https://date-fns.org/))
- **Lucide Icons**: Ícones utilizados ([https://lucide.dev/](https://lucide.dev/))
- **Tailwind CSS**: Classes de estilização ([https://tailwindcss.com/](https://tailwindcss.com/))
- **Firebase Firestore**: Banco de dados ([https://firebase.google.com/docs/firestore](https://firebase.google.com/docs/firestore))

---

**Última atualização**: 03 de outubro de 2025  
**Versão**: 1.0.0  
**Autor**: WorkFlow Development Team
