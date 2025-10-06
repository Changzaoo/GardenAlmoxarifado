# Otimizações de Memória RAM - GardenFlow

## 📊 Problema Identificado
- **Consumo anterior**: >1.9GB RAM
- **Objetivo**: Reduzir para <500MB

## ✅ Otimizações Implementadas

### 1. **Gerenciamento de Listeners do Firebase**
📁 `src/utils/memoryOptimization.js`

- ✅ Criado `ListenerManager` para gerenciar todos os listeners
- ✅ Cleanup automático de listeners antigos
- ✅ Prevenção de listeners duplicados
- ✅ Monitoramento de listeners ativos

**Uso:**
```javascript
import { listenerManager } from '../utils/memoryOptimization';

// Adicionar listener
const unsubscribe = onSnapshot(q, callback);
listenerManager.add('meu-listener-id', unsubscribe);

// Remover quando não precisar mais
listenerManager.remove('meu-listener-id');

// Remover todos (ao desmontar componente principal)
listenerManager.removeAll();
```

### 2. **Limits em Queries do Firebase**
📁 `src/utils/memoryOptimization.js`

Configurados limites para todas as queries:
- **Mensagens**: 50 por conversa
- **Conversas**: 30 mais recentes
- **Empréstimos**: 100 mais recentes
- **Tarefas**: 50 mais recentes
- **Notificações**: 50 mais recentes
- **Inventário**: 200 itens
- **Funcionários**: 100
- **Avaliações**: 20

**Aplicado em:**
- ✅ `mensagensService.js` - Lista de conversas limitada a 30
- ⏳ Outros serviços (próxima iteração)

### 3. **Cache de Queries**
📁 `src/utils/memoryOptimization.js`

- ✅ Cache simples com TTL de 5 minutos
- ✅ Limpeza automática de cache expirado
- ✅ Reduz queries repetidas ao Firebase

**Uso:**
```javascript
import { getCachedQuery, setCachedQuery } from '../utils/memoryOptimization';

const cached = getCachedQuery('minha-chave');
if (cached) {
  return cached;
}

const data = await fetchData();
setCachedQuery('minha-chave', data);
```

### 4. **Componente de Imagem Otimizado**
📁 `src/components/common/OptimizedImage.jsx`

- ✅ Lazy loading com Intersection Observer
- ✅ Placeholder animado durante carregamento
- ✅ Tratamento de erro
- ✅ React.memo para prevenir re-renders
- ✅ Carrega apenas quando visível na tela

**Uso:**
```jsx
import OptimizedImage from '../components/common/OptimizedImage';

<OptimizedImage
  src="/path/to/image.jpg"
  alt="Descrição"
  width={200}
  height={200}
  className="rounded-full"
/>
```

### 5. **Compressão de Imagens**
📁 `src/utils/memoryOptimization.js`

- ✅ Função `compressImage` para reduzir tamanho
- ✅ Resize automático (máx 800x800)
- ✅ Qualidade configurável (padrão 70%)
- ✅ Conversão para JPEG

**Uso:**
```javascript
import { compressImage } from '../utils/memoryOptimization';

const compressedFile = await compressImage(file, 800, 800, 0.7);
```

### 6. **Limpeza de LocalStorage**
📁 `src/utils/memoryOptimization.js`

- ✅ Remove dados antigos (>7 dias) automaticamente
- ✅ Executado na inicialização
- ✅ Previne acúmulo de dados obsoletos

### 7. **Monitor de Memória (Dev)**
📁 `src/utils/memoryOptimization.js`

- ✅ Log de uso de memória a cada 30s (apenas dev)
- ✅ Mostra: usado, total, limite, porcentagem
- ✅ Ajuda a identificar vazamentos

### 8. **Helpers de Performance**
📁 `src/utils/memoryOptimization.js`

- ✅ `debounce` - Atrasa execução de função
- ✅ `throttle` - Limita frequência de execução
- ✅ `cleanupEventListeners` - Remove listeners do DOM

### 9. **HOCs de Otimização React**
📁 `src/utils/reactOptimizations.js`

- ✅ `withMemo` - Memoização fácil
- ✅ `withLazy` - Lazy loading de componentes
- ✅ `arePropsEqualIgnoreFunctions` - Comparador que ignora funções
- ✅ `areListPropsEqual` - Comparador otimizado para listas

## 🔄 Próximas Etapas (Para Implementar)

### Alta Prioridade

#### 1. **Virtualização de Listas Longas**
Instalar e implementar `react-window`:
```bash
npm install react-window
```

Componentes a virtualizar:
- `ListaEmprestimos.jsx` (pode ter 100+ itens)
- `ListaConversas.jsx` (pode ter 30+ itens)
- `TarefasTab.jsx` (pode ter 50+ itens)
- `MensagensTab.jsx` (lista de mensagens)

**Exemplo:**
```jsx
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={items.length}
  itemSize={80}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      {/* Seu item aqui */}
    </div>
  )}
</FixedSizeList>
```

#### 2. **Memoizar Componentes Pesados**
Adicionar `React.memo` em:
- `EmprestimoCard` (re-renderiza muito)
- `BolhaMensagem` (muitas instâncias)
- `TarefaCard` (lista grande)
- `ConversaItem` (lista grande)

**Exemplo:**
```jsx
export default React.memo(EmprestimoCard, (prevProps, nextProps) => {
  return prevProps.emprestimo.id === nextProps.emprestimo.id &&
         prevProps.emprestimo.status === nextProps.emprestimo.status;
});
```

#### 3. **useMemo e useCallback Estratégicos**
Adicionar em:
- Cálculos de filtros (empréstimos, tarefas)
- Funções de callback passadas para listas
- Computações pesadas (estatísticas, totais)

**Exemplo:**
```jsx
const emprestimosFiltrados = useMemo(() => {
  return emprestimos.filter(e => e.status === filtroStatus);
}, [emprestimos, filtroStatus]);

const handleClick = useCallback((id) => {
  // função
}, [dependencias]);
```

#### 4. **Paginação**
Implementar em:
- Lista de empréstimos (carregar 20 por vez)
- Lista de tarefas (carregar 20 por vez)
- Mensagens (já tem, mas melhorar)
- Histórico (todas as páginas de histórico)

#### 5. **Lazy Loading de Rotas**
Carregar componentes de páginas sob demanda:

```jsx
const EmprestimosPage = React.lazy(() => import('./pages/Emprestimos'));
const TarefasPage = React.lazy(() => import('./pages/Tarefas'));

<Suspense fallback={<Loading />}>
  <Route path="/emprestimos" component={EmprestimosPage} />
</Suspense>
```

### Média Prioridade

#### 6. **Otimizar Animações**
- Reduzir uso de Framer Motion em listas grandes
- Usar CSS animations para animações simples
- Desabilitar animações em dispositivos fracos

#### 7. **Service Workers**
- Cache de assets estáticos
- Cache de dados do Firebase (offline-first)
- Reduz chamadas à rede

#### 8. **Web Workers**
Mover processamento pesado para workers:
- Cálculos estatísticos
- Processamento de imagens
- Parsing de dados grandes

### Baixa Prioridade

#### 9. **Bundle Analysis**
```bash
npm run build -- --stats
npx webpack-bundle-analyzer build/bundle-stats.json
```

Identificar:
- Bibliotecas grandes não usadas
- Código duplicado
- Oportunidades de code splitting

#### 10. **Remover Dependências Não Usadas**
Auditar e remover:
- Bibliotecas instaladas mas não importadas
- Polyfills desnecessários
- Versões antigas de bibliotecas

## 📈 Como Medir Resultados

### Chrome DevTools

1. **Performance Monitor**:
   - Abrir DevTools (F12)
   - Cmd/Ctrl + Shift + P
   - Digitar "Performance Monitor"
   - Monitorar "JS heap size"

2. **Memory Profiler**:
   - Aba "Memory"
   - "Take heap snapshot"
   - Comparar antes/depois de usar o app

3. **Performance Tab**:
   - Gravar sessão de uso
   - Identificar bottlenecks
   - Ver call tree

### Console do Navegador

```javascript
// Ver uso de memória
console.log(performance.memory);

// Ver listeners ativos (após implementar listenerManager)
import { listenerManager } from './utils/memoryOptimization';
console.log('Listeners ativos:', listenerManager.getActiveCount());
```

## 🎯 Metas de Performance

| Métrica | Antes | Meta | Prioridade |
|---------|-------|------|------------|
| RAM Inicial | ~1.9GB | <500MB | 🔴 Alta |
| RAM Após 5min | ~2.5GB | <700MB | 🔴 Alta |
| Tempo de Carregamento | ~8s | <3s | 🟡 Média |
| Listeners Ativos | ~50+ | <20 | 🔴 Alta |
| Tamanho do Bundle | ~3MB | <1.5MB | 🟡 Média |

## 📋 Checklist de Implementação

### Fase 1 - Otimizações Críticas (Implementado)
- [x] Criar utilitários de otimização de memória
- [x] Adicionar limits em queries do Firebase
- [x] Criar ListenerManager
- [x] Criar componente OptimizedImage
- [x] Adicionar cache de queries
- [x] Implementar limpeza de localStorage
- [x] Adicionar monitor de memória (dev)

### Fase 2 - React Optimizations (Próximo)
- [ ] Instalar react-window
- [ ] Virtualizar ListaEmprestimos
- [ ] Virtualizar ListaConversas
- [ ] Virtualizar TarefasTab
- [ ] Memoizar componentes de lista
- [ ] Adicionar useMemo em filtros
- [ ] Adicionar useCallback em handlers

### Fase 3 - Lazy Loading (Depois)
- [ ] Lazy loading de rotas
- [ ] Lazy loading de modals
- [ ] Lazy loading de imagens em listas

### Fase 4 - Advanced (Futuro)
- [ ] Implementar paginação
- [ ] Service Workers
- [ ] Web Workers
- [ ] Bundle analysis e otimização

## 🚀 Como Aplicar as Otimizações

### 1. Substituir imagens normais por OptimizedImage

**Antes:**
```jsx
<img src={user.photoURL} alt={user.nome} />
```

**Depois:**
```jsx
<OptimizedImage src={user.photoURL} alt={user.nome} />
```

### 2. Adicionar memoização em componentes de lista

**Antes:**
```jsx
const EmprestimoCard = ({ emprestimo, onClick }) => {
  return <div onClick={() => onClick(emprestimo)}>...</div>;
};
```

**Depois:**
```jsx
const EmprestimoCard = React.memo(({ emprestimo, onClick }) => {
  return <div onClick={() => onClick(emprestimo)}>...</div>;
}, (prev, next) => prev.emprestimo.id === next.emprestimo.id);
```

### 3. Usar listenerManager para Firebase listeners

**Antes:**
```jsx
useEffect(() => {
  const unsubscribe = onSnapshot(query, callback);
  return () => unsubscribe();
}, []);
```

**Depois:**
```jsx
import { listenerManager } from '../utils/memoryOptimization';

useEffect(() => {
  const unsubscribe = onSnapshot(query, callback);
  listenerManager.add('component-listener', unsubscribe);
  return () => listenerManager.remove('component-listener');
}, []);
```

### 4. Implementar paginação simples

**Antes:**
```jsx
const [emprestimos, setEmprestimos] = useState([]);
// Carrega tudo de uma vez
```

**Depois:**
```jsx
const [emprestimos, setEmprestimos] = useState([]);
const [page, setPage] = useState(0);
const ITEMS_PER_PAGE = 20;

const emprestimosPaginados = emprestimos.slice(
  page * ITEMS_PER_PAGE,
  (page + 1) * ITEMS_PER_PAGE
);

// Botões de navegação
<button onClick={() => setPage(p => p - 1)}>Anterior</button>
<button onClick={() => setPage(p => p + 1)}>Próximo</button>
```

## 📞 Suporte

Se tiver dúvidas sobre as otimizações:
1. Verifique este documento primeiro
2. Consulte os comentários nos arquivos criados
3. Use o monitor de memória para identificar problemas
4. Compare snapshots de heap para encontrar vazamentos

## 🔍 Debugging

### Verificar listeners ativos:
```javascript
// No console
listenerManager.getActiveCount()
```

### Ver cache:
```javascript
// Inspecionar queryCache (não exposto por padrão, mas pode ser adicionado)
```

### Forçar limpeza:
```javascript
listenerManager.removeAll()
clearQueryCache()
cleanupLocalStorage(0) // Limpa tudo
```
