# 📝 Guia de Manutenção - Central de Ajuda

## Como Adicionar Novo Conteúdo

Este guia mostra como adicionar novos módulos, FAQs, tutoriais e outros conteúdos à Central de Ajuda.

---

## 📦 Adicionar Novo Módulo/Funcionalidade

### Localização
Arquivo: `src/components/Support/SupportTab.jsx`
Array: `systemModules`

### Estrutura
```javascript
{
  id: 'nome-modulo',              // ID único (kebab-case)
  title: 'Nome do Módulo',        // Nome exibido
  description: 'Descrição curta', // Subtítulo
  icone: IconeComponente,         // Ícone do lucide-react
  cor: 'blue',                    // Cor do gradiente
  categoria: 'estoque',           // Categoria (estoque/pessoas/relatorios/admin)
  features: [                     // Array de funcionalidades
    {
      name: 'Nome da Feature',
      description: 'O que ela faz',
      permission: NIVEIS_PERMISSAO.FUNCIONARIO, // Nível de acesso
      howTo: 'Instruções passo a passo de como usar'
    }
  ]
}
```

### Exemplo Completo
```javascript
{
  id: 'notificacoes',
  title: 'Notificações',
  description: 'Sistema de alertas e notificações em tempo real',
  icone: Bell,                    // Importar: import { Bell } from 'lucide-react'
  cor: 'yellow',
  categoria: 'pessoas',
  features: [
    {
      name: 'Receber Notificações',
      description: 'Receba alertas de eventos importantes',
      permission: NIVEIS_PERMISSAO.FUNCIONARIO,
      howTo: 'As notificações aparecem automaticamente no canto superior direito. Clique no ícone de sino para ver todas.'
    },
    {
      name: 'Configurar Preferências',
      description: 'Escolha quais notificações deseja receber',
      permission: NIVEIS_PERMISSAO.FUNCIONARIO,
      howTo: 'Acesse Configurações > Notificações e marque as opções desejadas.'
    }
  ]
}
```

### Cores Disponíveis
- `blue`, `green`, `purple`, `yellow`, `orange`, `red`
- `indigo`, `cyan`, `teal`, `pink`, `slate`, `gray`

### Categorias Disponíveis
- `estoque` - Inventário, ferramentas, empréstimos
- `pessoas` - Funcionários, equipes, tarefas, ponto
- `relatorios` - Dashboard, analytics, relatórios
- `admin` - Configurações, sistema, backup

---

## ❓ Adicionar Nova FAQ

### Localização
Array: `faqs`

### Estrutura
```javascript
{
  question: 'Pergunta completa?',
  answer: 'Resposta detalhada explicando tudo.',
  categoria: 'estoque',              // mesmas categorias dos módulos
  relevancia: 'alta'                 // alta/media/baixa (não usado atualmente)
}
```

### Exemplo
```javascript
{
  question: 'Como faço para exportar relatórios?',
  answer: 'Para exportar um relatório, acesse a aba Analytics ou Dashboard, configure os filtros desejados e clique no botão "Exportar" no canto superior direito. Você pode escolher entre PDF, Excel ou CSV.',
  categoria: 'relatorios',
  relevancia: 'alta'
}
```

---

## 🚀 Adicionar Tutorial de Primeiros Passos

### Localização
Array: `primeiroPassos`

### Estrutura
```javascript
{
  id: 6,                           // Número sequencial
  titulo: '6. Nome do Tutorial',   // Título com número
  descricao: 'Breve descrição',
  icone: IconeComponente,
  cor: 'blue',                     // Cor do gradiente
  passos: [                        // Array de passos
    'Primeiro passo a fazer',
    'Segundo passo',
    'Terceiro passo',
    // ...
  ]
}
```

### Exemplo
```javascript
{
  id: 6,
  titulo: '6. Gerar Relatórios',
  descricao: 'Aprenda a criar e exportar relatórios personalizados',
  icone: FileText,
  cor: 'indigo',
  passos: [
    'Acesse a aba "Analytics" no menu principal',
    'Selecione o tipo de relatório desejado',
    'Configure os filtros (período, funcionários, setores)',
    'Clique em "Gerar Relatório"',
    'Clique em "Exportar" e escolha o formato (PDF/Excel/CSV)'
  ]
}
```

---

## 🎬 Adicionar Vídeo Tutorial

### Localização
Array: `videoTutorials`

### Estrutura
```javascript
{
  id: 6,
  titulo: 'Nome do Vídeo',
  duracao: '5:30',                 // mm:ss
  thumbnail: '🎬',                 // Emoji ou URL futura
  categoria: 'Básico',             // Iniciante/Básico/Intermediário/Avançado
  descricao: 'Descrição do conteúdo do vídeo'
}
```

### Exemplo
```javascript
{
  id: 6,
  titulo: 'Gerenciando Transferências entre Setores',
  duracao: '7:45',
  thumbnail: '🔄',
  categoria: 'Intermediário',
  descricao: 'Aprenda a realizar transferências de ferramentas entre diferentes setores da empresa'
}
```

---

## ⌨️ Adicionar Atalho de Teclado

### Localização
Array: `keyboardShortcuts`

### Estrutura
```javascript
{
  tecla: 'Ctrl + X',               // Combinação de teclas
  acao: 'Descrição da ação'
}
```

### Exemplo
```javascript
{
  tecla: 'Ctrl + Shift + E',
  acao: 'Abrir tela de novo empréstimo'
}
```

---

## 🎨 Adicionar Nova Categoria

### 1. Adicionar no Array `categories`
```javascript
{
  id: 'nova-categoria',
  nome: 'Nome Categoria',
  icone: IconeComponente,
  cor: 'blue'
}
```

### 2. Usar nos Módulos
```javascript
{
  id: 'meu-modulo',
  // ...
  categoria: 'nova-categoria',  // Usar o mesmo ID
  // ...
}
```

### 3. Usar nas FAQs
```javascript
{
  question: 'Minha pergunta?',
  answer: 'Resposta',
  categoria: 'nova-categoria',  // Usar o mesmo ID
  // ...
}
```

---

## 🎨 Adicionar Novo Ícone

### 1. Importar no Topo do Arquivo
```javascript
import { 
  // ... ícones existentes
  NomeDoIcone  // Adicionar novo
} from 'lucide-react';
```

### 2. Usar no Módulo
```javascript
icone: NomeDoIcone,
```

### Ícones Recomendados
- **Estoque**: Package, Box, Boxes, Archive
- **Pessoas**: Users, User, UserPlus, Users2
- **Tarefas**: CheckSquare, CheckCircle, ListChecks
- **Relatórios**: BarChart3, LineChart, PieChart, TrendingUp
- **Notificações**: Bell, BellRing, AlertCircle
- **Configurações**: Settings, Sliders, Cog
- **Segurança**: Shield, Lock, Key, Eye
- **Documentos**: FileText, File, Files, Folder
- **Comunicação**: MessageSquare, Mail, Send

---

## 🔧 Personalizar Cores

### Alterar Cor de um Módulo
```javascript
{
  id: 'meu-modulo',
  cor: 'purple',  // Trocar para outra cor
  // ...
}
```

### Cores de Gradiente
As cores são aplicadas automaticamente no formato:
- `from-{cor}-500 to-{cor}-600` (light mode)
- `dark:from-{cor}-900/20 dark:to-{cor}-900/20` (dark mode)

### Adicionar Nova Cor Customizada
No Tailwind CSS já estão disponíveis:
- slate, gray, zinc, neutral, stone
- red, orange, amber, yellow, lime, green
- emerald, teal, cyan, sky, blue, indigo
- violet, purple, fuchsia, pink, rose

---

## 📝 Boas Práticas

### Títulos
- ✅ Claros e descritivos
- ✅ Máximo 3-4 palavras
- ❌ Evitar siglas sem explicação

### Descrições
- ✅ 1-2 linhas
- ✅ Explicar o propósito
- ❌ Não repetir o título

### Features
- ✅ Nome da feature + verbo de ação
- ✅ Descrição concisa (1 linha)
- ✅ HowTo com 2-3 passos claros
- ❌ Instruções muito longas

### FAQs
- ✅ Pergunta em forma de pergunta (?)
- ✅ Resposta completa mas concisa
- ✅ Incluir próximos passos quando possível
- ❌ Respostas muito técnicas

### Tutoriais
- ✅ 3-5 passos
- ✅ Ordem lógica
- ✅ Cada passo começa com verbo
- ❌ Passos muito complexos

---

## 🔄 Atualizar Estatísticas

As estatísticas no header são calculadas automaticamente:
```javascript
{systemModules.length}  // Número de módulos
{faqs.length}           // Número de FAQs
{videoTutorials.length} // Número de vídeos
{primeiroPassos.length} // Número de tutoriais
```

Não precisa alterar nada, apenas adicionar conteúdo nos arrays!

---

## 🐛 Troubleshooting

### Módulo não aparece
- Verifique se o ID é único
- Verifique se a categoria existe
- Verifique se o ícone foi importado

### Busca não encontra
- Verifique se o texto está correto
- A busca é case-insensitive
- Busca em: title, description, features (name, description, howTo)

### Filtro não funciona
- Verifique se a categoria do módulo corresponde ao ID do filtro
- Categorias devem ser exatamente iguais

### Ícone não aparece
- Verifique se foi importado do lucide-react
- Verifique se o nome está correto
- Use PascalCase para o nome

---

## ✅ Checklist ao Adicionar Conteúdo

### Novo Módulo
- [ ] ID único definido
- [ ] Título e descrição escritos
- [ ] Ícone importado e aplicado
- [ ] Cor escolhida
- [ ] Categoria definida
- [ ] Ao menos 1 feature adicionada
- [ ] Testado em mobile
- [ ] Testado em dark mode

### Nova FAQ
- [ ] Pergunta clara
- [ ] Resposta completa
- [ ] Categoria definida
- [ ] Testado com busca

### Novo Tutorial
- [ ] Título numerado
- [ ] Ícone apropriado
- [ ] 3-5 passos claros
- [ ] Ordem lógica

---

## 📞 Suporte

Se precisar de ajuda para adicionar conteúdo:
1. Consulte os exemplos acima
2. Copie a estrutura existente
3. Adapte para seu caso
4. Teste em todos os modos (claro/escuro, mobile/desktop)

---

**Última atualização**: Outubro 2025
**Versão**: 2.0.0
