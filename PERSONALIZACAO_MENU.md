# 📱 Sistema de Personalização de Menu

## 🎯 Visão Geral

Sistema completo que permite aos usuários personalizar os itens e a ordem do menu inferior e menu fullscreen do aplicativo móvel.

## ✨ Funcionalidades Implementadas

### 1. **Long Press para Configuração** (5 segundos)
- Pressione e segure o botão "Menu" no menu inferior por 5 segundos
- Indicador visual de progresso mostrando a barra preenchendo
- Animação suave de opacidade azul durante o pressionamento
- Cancela automaticamente se o dedo se mover ou for levantado

### 2. **Modal de Configuração Completo**
Interface intuitiva com:
- **Header**: Título "Personalizar Menu" + descrição
- **Lista de Itens Arrastáveis**:
  - Cada item mostra ícone, nome e posição atual
  - Setas para cima/baixo para reordenar itens
  - Toggle switch para mostrar/ocultar no menu inferior
  - Visual diferenciado: itens visíveis em azul, ocultos em cinza
- **Preview em Tempo Real**: Mostra como o menu inferior ficará
- **Botões de Ação**: Cancelar e Salvar Configuração

### 3. **Persistência de Dados**
- Salva no Firebase na coleção `usuarios` com campo `menuConfig`
- Estrutura de dados:
```javascript
menuConfig: [
  { id: 'dashboard', visivel: true, ordem: 0 },
  { id: 'notificacoes', visivel: true, ordem: 1 },
  { id: 'mensagens', visivel: true, ordem: 2 },
  // ...
]
```

### 4. **Aplicação da Personalização**
- **Menu Inferior**: Mostra até 3 itens personalizáveis + Empréstimos (fixo) + Menu
- **Menu Fullscreen**: Exibe todos os itens na ordem personalizada
- Configuração padrão se usuário não personalizou: primeiros 4 itens disponíveis

## 🔧 Arquitetura Técnica

### Estados Criados
```javascript
const [menuPersonalizado, setMenuPersonalizado] = useState(null);
const [showMenuConfig, setShowMenuConfig] = useState(false);
const [menuLongPressTimer, setMenuLongPressTimer] = useState(null);
const [menuLongPressProgress, setMenuLongPressProgress] = useState(0);
```

### Funções Principais

#### `carregarMenuConfig()`
- Carrega configuração do Firebase ao montar componente
- Se não existir, cria configuração padrão

#### `salvarMenuConfig(novaConfig)`
- Salva configuração no Firebase
- Atualiza estado local

#### `reordenarMenuItem(fromIndex, toIndex)`
- Move item da posição `fromIndex` para `toIndex`
- Atualiza campo `ordem` de todos os itens

#### `toggleMenuItemVisibilidade(itemId)`
- Alterna visibilidade do item no menu inferior

#### `getAbasOrdenadas()`
- Retorna array de abas na ordem personalizada pelo usuário
- Usado no menu fullscreen

#### `getAbasMenuInferior()`
- Retorna apenas abas visíveis para o menu inferior
- Usado na barra de navegação inferior

## 🎨 Design e UX

### Visual do Long Press
```jsx
{menuLongPressProgress > 0 && (
  <div 
    className="absolute inset-0 bg-blue-500 opacity-20"
    style={{ clipPath: `inset(${100 - menuLongPressProgress}% 0 0 0)` }}
  />
)}
```
- Barra azul preenchendo de baixo para cima
- 5 segundos de duração (100ms por 2% = 5000ms)

### Toggle Switch Personalizado
```jsx
<button className="relative inline-flex h-8 w-14 items-center rounded-full">
  <span className={`inline-block h-6 w-6 transform rounded-full bg-white 
    ${config?.visivel ? 'translate-x-7' : 'translate-x-1'}`} />
</button>
```
- Azul quando ativo, cinza quando inativo
- Bolinha branca desliza suavemente

### Sistema de Cores
- **Item Visível**: `bg-blue-50 dark:bg-blue-900/20 border-blue-500`
- **Item Oculto**: `bg-gray-50 dark:bg-gray-800 border-gray-200`
- **Ícone Ativo**: `bg-blue-500 text-white`
- **Ícone Inativo**: `bg-gray-200 text-gray-500`

## 📋 Regras de Negócio

### Itens com Posição Fixa
- **Empréstimos**: Sempre no centro do menu inferior (posição especial elevada)
- **Menu**: Sempre último item no menu inferior

### Itens Excluídos do Menu Inferior
- **Ranking**: Não aparece no menu inferior por padrão
- **Meu Perfil**: Não aparece no menu inferior por padrão

### Limites
- **Menu Inferior**: Até 3 itens personalizáveis + 2 fixos (Empréstimos e Menu)
- **Menu Fullscreen**: Todos os itens com permissão do usuário

## 🔐 Permissões

Todos os usuários podem personalizar seu próprio menu, independente do nível de permissão. A personalização é individual por usuário.

## 📱 Responsividade

- **Mobile**: Sistema completo de personalização
- **Desktop**: Menu lateral fixo (não personalizável)

## 🚀 Como Usar

### Para o Usuário:
1. No menu inferior, pressione e segure o botão "Menu" por 5 segundos
2. Aguarde a barra azul preencher completamente
3. Modal de configuração abre automaticamente
4. Use as setas ↑↓ para reordenar itens
5. Use o toggle (botão deslizante) para mostrar/ocultar itens
6. Veja o preview em tempo real na parte inferior do modal
7. Clique em "Salvar Configuração" para aplicar mudanças

### Exemplo de Configuração:
```
Menu Inferior Padrão:
[Dashboard] [Notificações] [Empréstimos] [Mensagens] [Menu]

Após Personalização:
[Mensagens] [Inventário] [Empréstimos] [Notificações] [Menu]
```

## 🔄 Fluxo de Dados

```
1. Usuário faz long press (5s)
   ↓
2. Modal abre com configuração atual
   ↓
3. Usuário reordena/toggle itens
   ↓
4. Preview atualiza em tempo real
   ↓
5. Clica em "Salvar"
   ↓
6. Dados salvos no Firebase (campo menuConfig)
   ↓
7. Estado local atualizado
   ↓
8. Menu inferior e fullscreen re-renderizam
   ↓
9. Mudanças aplicadas imediatamente
```

## 🐛 Tratamento de Erros

- Se Firebase falhar ao carregar: usa configuração padrão
- Se Firebase falhar ao salvar: mantém estado local mas avisa no console
- Se usuário não tiver campo `menuConfig`: cria automaticamente no primeiro acesso

## 📊 Estrutura de Dados no Firebase

```javascript
// Documento em firestore/usuarios/{userId}
{
  nome: "João Silva",
  email: "joao@example.com",
  nivel: 2,
  menuConfig: [
    { id: 'mensagens', visivel: true, ordem: 0 },
    { id: 'inventario', visivel: true, ordem: 1 },
    { id: 'emprestimos', visivel: true, ordem: 2 },
    { id: 'notificacoes', visivel: true, ordem: 3 },
    { id: 'dashboard', visivel: false, ordem: 4 },
    { id: 'tarefas', visivel: false, ordem: 5 },
    // ...
  ]
}
```

## 🎯 Benefícios

1. **Produtividade**: Acesso rápido às funcionalidades mais usadas
2. **Personalização**: Cada usuário adapta o app ao seu fluxo de trabalho
3. **UX Moderna**: Interação intuitiva com drag & drop visual
4. **Persistência**: Configuração mantida entre sessões
5. **Escalabilidade**: Fácil adicionar novos itens de menu

## 🔮 Possíveis Melhorias Futuras

- [ ] Drag & drop com toque (arrastar com o dedo)
- [ ] Temas de cores para cada item
- [ ] Ícones personalizados
- [ ] Perfis de configuração pré-definidos
- [ ] Compartilhar configuração entre dispositivos
- [ ] Estatísticas de uso dos itens de menu
- [ ] Sugestões de organização baseadas em uso

---

**Desenvolvido para WorkFlow - Sistema de Almoxarifado**
