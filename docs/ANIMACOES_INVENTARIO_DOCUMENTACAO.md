# 🎬 Documentação das Animações do Inventário

## 📋 Índice
1. [Adicionar Item](#1-adicionar-item)
2. [Compra](#2-compra)
3. [Ferramenta Danificada](#3-ferramenta-danificada)
4. [Ferramenta Perdida](#4-ferramenta-perdida)
5. [Verificação Mensal](#5-verificação-mensal)

---

## 1. Adicionar Item

### 📦 `AdicionarItemAnimation.jsx`

Animação sofisticada que mostra um item sendo criado e adicionado ao inventário da empresa ou ao almoxarifado do setor.

### 🎨 Visual
- **Layout**: Vertical (Criação → Movimento → Destino)
- **Cores**: Gradiente azul/índigo
- **Duração**: ~6.4 segundos

### 🎭 Fases da Animação

#### Fase 1: Start (600ms)
- Animação inicial do container
- Preparando cadastro

#### Fase 2: Creating (1800ms)
- **Efeitos**:
  - Ícone de "+" rotativo
  - 20 partículas voando em círculo
  - 3 ondas concêntricas expandindo
  - Pulsação do card
- **Cor**: Azul

#### Fase 3: Moving (2000ms)
- **Efeitos**:
  - Ícone muda para Package
  - Seta animada para baixo
  - 8 partículas seguindo a seta
  - Rotação suave do pacote
- **Mensagem**: "Adicionando ao inventário/almoxarifado..."

#### Fase 4: Storing (1200ms)
- **Efeitos**:
  - Card de destino pulsando
  - Ondas de recebimento (3 camadas)
  - Ícone: Building2 (empresa) ou Warehouse (almoxarifado)
  - Badge de status processando
- **Cores**: Roxo (empresa) ou Verde (almoxarifado)

#### Fase 5: Complete (800ms)
- **Efeitos**:
  - 30 confetes coloridos explodindo
  - 15 sparkles voando
  - Badge "Adicionado" com checkmark
  - Barra de progresso 100%

### 📊 Props
```jsx
{
  item: {
    nome: string,
    quantidade: number,
    categoria: string
  },
  empresa: string,
  setor: string,
  destino: 'empresa' | 'almoxarifado',
  onComplete: () => void
}
```

### 💡 Exemplo de Uso
```jsx
<AdicionarItemAnimation
  item={{
    nome: "Martelo",
    quantidade: 5,
    categoria: "Ferramentas"
  }}
  empresa="Zendaya Garden"
  setor="Manutenção"
  destino="almoxarifado"
  onComplete={() => console.log('Item adicionado!')}
/>
```

---

## 2. Compra

### 🛒 `CompraAnimation.jsx`

Animação que simula o processo completo de compra: pedido → pagamento → transporte → recebimento.

### ❌ `CancelamentoCompraAnimation.jsx` (NOVA!)

Animação **REVERSA** sofisticada que mostra o cancelamento de uma compra com todos os processos invertidos.

### 🎨 Visual
- **Layout**: Horizontal - 3 colunas (Pedido | Transporte | Recebimento)
- **Cores**: Gradiente verde/esmeralda
- **Duração**: ~6.9 segundos

### 🎭 Fases da Animação

#### Fase 1: Start (600ms)
- Container aparecendo com spring
- Inicializando pedido

#### Fase 2: Ordering (1800ms)
- **Coluna Esquerda (Pedido)**:
  - Carrinho de compras pulsando
  - 15 moedas ($) voando em círculo
  - 3 ondas verdes expandindo
  - Cartão de crédito rotacionando (flip 3D)
  - Valor da compra exibido

#### Fase 3: Shipping (2200ms)
- **Coluna Central (Transporte)**:
  - Caminhão se movendo (vai e volta)
  - 5 nuvens de fumaça atrás
  - Linha de estrada com marcação animada
  - Contador de pacotes pulsando
  - Barra de progresso do transporte

#### Fase 4: Receiving (1500ms)
- **Coluna Direita (Recebimento)**:
  - Ícone de pacote recebendo itens
  - 8 mini-pacotes caindo de cima
  - 3 ondas brancas de recebimento
  - Status pulsando (amarelo → verde)

#### Fase 5: Complete (800ms)
- **Efeitos**:
  - Checkmark verde no almoxarifado
  - 40 confetes verdes/dourados
  - 20 sparkles
  - Todos status = "Recebido"

### 📊 Props
```jsx
{
  compra: {
    item: string,
    quantidade: number,
    valor: number,
    fornecedor: string
  },
  onComplete: () => void
}
```

### 💡 Exemplo de Uso
```jsx
<CompraAnimation
  compra={{
    item: "Parafusos M8",
    quantidade: 500,
    valor: 350.00,
    fornecedor: "Ferramax"
  }}
  onComplete={() => console.log('Compra recebida!')}
/>
```

---

## 2B. Cancelamento de Compra ❌ (NOVA!)

### 🚫 `CancelamentoCompraAnimation.jsx`

Animação **REVERSA E DRAMÁTICA** do processo de compra, mostrando cancelamento com rejeição de pagamento e devolução.

### 🎨 Visual
- **Layout**: Horizontal - 3 colunas INVERTIDAS (Almoxarifado → Transporte Reverso → Pedido Rejeitado)
- **Cores**: Gradiente vermelho/laranja (alerta/perigo)
- **Duração**: ~6.9 segundos

### 🎭 Fases da Animação

#### Fase 1: Start (600ms)
- Container aparecendo com aviso
- Background pulsante vermelho

#### Fase 2: Rejecting (1800ms)
- **Coluna Direita (Pedido Rejeitado)**:
  - Carrinho com **X BRANCO GIGANTE** sobre ele
  - 20 X's vermelhos voando em círculo
  - 3 ondas vermelhas de rejeição
  - Cartão de crédito com **X GIGANTE** e texto "NEGADO"
  - Cartão rotacionando (flip 3D)
  - Valores riscados (line-through)
  - Ícone XCircle mostrando rejeição

#### Fase 3: Returning (2200ms)
- **Coluna Central (Transporte Reverso)**:
  - Caminhão espelhado horizontalmente (voltando)
  - Movimento para a ESQUERDA (reverso)
  - 5 nuvens de fumaça VERMELHA
  - Barra de progresso DIMINUINDO (100% → 0%)
  - Contador com XCircle vermelho
  - **Coluna Esquerda (Almoxarifado)**:
  - 8 pacotes SUBINDO (devolvendo)
  - 3 ondas vermelhas invertidas (encolhendo)
  - Animação de devolução

#### Fase 4: Canceling (1500ms)
- Banner vermelho "Compra Cancelada"
- Informações riscadas e com opacidade 50%
- Status mudando para "Cancelado"

#### Fase 5: Complete (800ms)
- **Efeitos DRAMÁTICOS**:
  - X vermelho GIGANTE sobre o almoxarifado
  - 50 X's vermelhos explodindo em todas direções
  - 15 ícones Ban (proibido) girando e voando
  - Todos os valores e textos riscados
  - Background vermelho

### 📊 Props
```jsx
{
  compra: {
    item: string,
    quantidade: number,
    valor: number,
    fornecedor: string
  },
  onComplete: () => void
}
```

### 💡 Exemplo de Uso
```jsx
<CancelamentoCompraAnimation
  compra={{
    item: "Parafusos M8",
    quantidade: 500,
    valor: 350.00,
    fornecedor: "Ferramax"
  }}
  onComplete={() => console.log('Compra cancelada!')}
/>
```

### 🎨 Características Especiais

#### Elementos Únicos:
- **Cartão com X GIGANTE**: X branco enorme sobre o cartão vermelho
- **Texto "NEGADO"**: Badge com XCircle e texto em negrito
- **Valores Riscados**: Todos os valores com `line-through`
- **Caminhão Espelhado**: `scaleX: -1` para voltar
- **Fumaça Vermelha**: Indicando problema/erro
- **Pacotes Subindo**: Animação reversa de recebimento
- **50 X's Explodindo**: Efeito final dramático
- **15 Ícones Ban**: Símbolos de proibição voando
- **Opacidade 50%**: Card de detalhes desbotado

#### Cores:
- **Primária**: Vermelho (`from-red-400 to-red-600`)
- **Secundária**: Laranja (`from-red-50 to-orange-50`)
- **Alerta**: Vermelho pulsante constante
- **Rejeição**: Vermelho intenso com X's

---

## 3. Ferramenta Danificada

### 🔧💥 `FerramentaDanificadaAnimation.jsx`

Animação dramática mostrando uma ferramenta sendo danificada com efeitos de quebra, impacto e alerta.

### 🎨 Visual
- **Layout**: Central com ênfase no item danificado
- **Cores**: Gradiente vermelho/laranja (alerta)
- **Duração**: ~5.8 segundos

### 🎭 Fases da Animação

#### Fase 1: Start (500ms)
- Container com leve rotação inicial
- Background pulsante de alerta

#### Fase 2: Detecting (1500ms)
- **Efeitos**:
  - 8 raios vermelhos rotativos ao redor
  - Pulsação do título com ícones de alerta
  - Background vermelho pulsante

#### Fase 3: Breaking (2000ms)
- **Efeitos incríveis**:
  - 3 rachaduras vermelhas aparecendo na ferramenta
  - 25 fragmentos vermelhos voando em todas direções
  - 4 ondas de impacto vermelhas
  - 6 chamas subindo
  - Ferramenta tremendo violentamente
- **Visual**: Destruição progressiva

#### Fase 4: Reporting (1500ms)
- **Efeitos**:
  - Indicador de gravidade pulsando
  - Barras de nível (Baixa/Média/Alta)
  - Animação das barras enchendo
  - Card de informações aparecendo

#### Fase 5: Complete (800ms)
- **Efeitos**:
  - X vermelho gigante sobre a ferramenta
  - 12 raios vermelhos emanando
  - 25 ícones de alerta voando
  - Badge "DANIFICADA" em vermelho

### 📊 Props
```jsx
{
  ferramenta: {
    nome: string,
    motivo: string,
    gravidade: 'baixa' | 'média' | 'alta'
  },
  onComplete: () => void
}
```

### 💡 Exemplo de Uso
```jsx
<FerramentaDanificadaAnimation
  ferramenta={{
    nome: "Furadeira Bosch",
    motivo: "Queda de altura elevada",
    gravidade: "alta"
  }}
  onComplete={() => console.log('Dano registrado!')}
/>
```

---

## 4. Ferramenta Perdida

### 🔍❓ `FerramentaPerdidaAnimation.jsx`

Animação de busca e não localização de ferramenta, com radar, pontos de interrogação e efeito fantasma.

### 🎨 Visual
- **Layout**: Horizontal - 3 colunas (Radar | Ferramenta | Local)
- **Cores**: Gradiente laranja/amarelo
- **Duração**: ~6.8 segundos

### 🎭 Fases da Animação

#### Fase 1: Start (500ms)
- Inicializando sistema de busca

#### Fase 2: Searching (2200ms)
- **Coluna Esquerda (Radar)**:
  - Círculo de radar laranja
  - 4 ondas amarelas expandindo
  - Linha rotativa de varredura (360°)
  - 8 pontos de detecção piscando
  - 12 pontos de interrogação voando em círculo
  - Ícone Radar rotacionando continuamente

#### Fase 3: Not Found (1800ms)
- **Coluna Central (Ferramenta)**:
  - Ferramenta com efeito fantasma (opacidade pulsante)
  - 3 ondas cinzas desvanecendo
  - X vermelho aparecendo sobre o item
  - Background preto/transparente
- **Coluna Direita (Local)**:
  - Pin de localização com ondas vermelhas
  - Pulso de alerta vermelho
  - Último local conhecido destacado

#### Fase 4: Reporting (1200ms)
- **Efeitos**:
  - Banner de alerta vermelho
  - Informações da perda aparecendo
  - Status mudando para "Não Encontrada"

#### Fase 5: Complete (800ms)
- **Efeitos**:
  - 20 X vermelhos voando
  - Todas informações confirmadas
  - Badge "PERDIDA" em vermelho

### 📊 Props
```jsx
{
  ferramenta: {
    nome: string,
    local_ultima_vez: string,
    responsavel: string
  },
  onComplete: () => void
}
```

### 💡 Exemplo de Uso
```jsx
<FerramentaPerdidaAnimation
  ferramenta={{
    nome: "Chave Inglesa 12",
    local_ultima_vez: "Setor de Jardinagem - Área Externa",
    responsavel: "João Silva"
  }}
  onComplete={() => console.log('Perda registrada!')}
/>
```

---

## 5. Verificação Mensal

### 📊✅ `VerificacaoMensalAnimation.jsx`

Animação completa de auditoria mensal com scanner, análise de dados e geração de relatório.

### 🎨 Visual
- **Layout**: 3 colunas (Scanner | Análise | Relatório)
- **Cores**: Gradiente azul/ciano com grid
- **Duração**: ~7.3 segundos

### 🎭 Fases da Animação

#### Fase 1: Start (500ms)
- Grid animado no fundo
- Preparando verificação

#### Fase 2: Scanning (2500ms)
- **Coluna Esquerda (Scanner)**:
  - Linha horizontal de scan subindo e descendo
  - 20 partículas brancas caindo
  - 3 ondas ciano expandindo
  - Contador de itens incrementando dinamicamente
  - Pacote pulsando

#### Fase 3: Analyzing (2000ms)
- **Coluna Central (Análise)**:
  - Gráfico de barras animado (8 barras)
  - Barras crescendo em alturas aleatórias
  - Ícone de BarChart pulsando no centro
  - 2 ondas azuis de análise
  - Card de progresso mostrando porcentagem

#### Fase 4: Reporting (1500ms)
- **Coluna Direita (Relatório)**:
  - Ícone de documento com checkmark
  - 5 linhas de texto sendo "escritas"
  - 3 ondas verdes de conclusão
  - Status mudando de amarelo para verde

#### Fase 5: Complete (800ms)
- **Efeitos finais**:
  - Checkmark verde gigante no scanner
  - 50 confetes coloridos (azul, ciano, verde, laranja)
  - 25 sparkles azuis
  - Card de resumo completo:
    - Total de itens
    - Itens verificados
    - Inconsistências encontradas
  - Status: "Concluído"

### 📊 Props
```jsx
{
  verificacao: {
    mes: string,
    ano: string,
    total_itens: number,
    itens_verificados: number,
    inconsistencias: number
  },
  onComplete: () => void
}
```

### 💡 Exemplo de Uso
```jsx
<VerificacaoMensalAnimation
  verificacao={{
    mes: "Janeiro",
    ano: "2025",
    total_itens: 347,
    itens_verificados: 347,
    inconsistencias: 3
  }}
  onComplete={() => console.log('Verificação concluída!')}
/>
```

---

## 🎨 Paleta de Cores por Animação

### Adicionar Item
- **Primária**: Azul (`from-blue-400 to-blue-600`)
- **Secundária**: Índigo (`from-blue-50 to-indigo-50`)
- **Empresa**: Roxo (`from-purple-400 to-purple-600`)
- **Almoxarifado**: Verde (`from-green-400 to-green-600`)

### Compra
- **Primária**: Verde (`from-green-400 to-emerald-600`)
- **Transporte**: Azul (`from-blue-400 to-blue-600`)
- **Pagamento**: Moedas douradas (`text-yellow-400`)
- **Conclusão**: Verde esmeralda

### Ferramenta Danificada
- **Primária**: Vermelho (`from-red-400 to-red-600`)
- **Secundária**: Laranja (`from-red-50 to-orange-50`)
- **Alerta**: Vermelho pulsante
- **Gravidade Alta**: Vermelho intenso

### Ferramenta Perdida
- **Primária**: Laranja (`from-orange-400 to-orange-600`)
- **Secundária**: Amarelo (`from-orange-50 to-yellow-50`)
- **Radar**: Amarelo (`border-yellow-300`)
- **Não encontrado**: Vermelho (`text-red-500`)

### Verificação Mensal
- **Primária**: Azul (`from-blue-400 to-cyan-600`)
- **Análise**: Ciano (`from-blue-500 to-cyan-500`)
- **Conclusão**: Verde (`from-green-400 to-emerald-600`)
- **Grid**: Azul transparente

---

## ⚡ Características Técnicas Comuns

### Tecnologias
- **Framer Motion**: 12.23.13
- **Lucide React**: Ícones
- **Tailwind CSS**: Estilização
- **React**: 18.2.0

### Performance
- Todas as animações usam `transform` e `opacity` para performance otimizada
- GPU-accelerated animations
- Não há layout shifts

### Responsividade
- Todos os componentes são responsivos
- Padding adaptativo (`p-4`)
- Grid/Flex com gap responsivo
- Max-width controlado

### Dark Mode
- Suporte completo a dark mode
- Classes dark: em todos elementos
- Contraste adequado em ambos modos

### Acessibilidade
- Cores com contraste adequado
- Textos legíveis
- Ícones com significado claro
- Feedback visual em todas fases

---

## 🔧 Integração com InventarioTab

### Padrão de Integração

```jsx
// 1. Importar animação
import AdicionarItemAnimation from './AdicionarItemAnimation';

// 2. Adicionar estados
const [showAdicionarAnimation, setShowAdicionarAnimation] = useState(false);
const [dadosAdicionarItem, setDadosAdicionarItem] = useState(null);

// 3. Modificar handler para mostrar animação
const handleAdicionarItem = (item, destino) => {
  setDadosAdicionarItem({ item, destino });
  setShowAdicionarAnimation(true);
};

// 4. Criar função de finalização
const finalizarAdicaoItem = async () => {
  try {
    // Processar adição no Firebase
    await addDoc(collection(db, 'inventario'), dadosAdicionarItem);
    
    // Limpar estados
    setShowAdicionarAnimation(false);
    setDadosAdicionarItem(null);
    
    // Atualizar lista
    fetchInventario();
  } catch (error) {
    console.error('Erro:', error);
  }
};

// 5. Renderizar animação condicionalmente
return (
  <>
    {/* Conteúdo normal */}
    
    {showAdicionarAnimation && dadosAdicionarItem && (
      <AdicionarItemAnimation
        item={dadosAdicionarItem.item}
        empresa={empresaSelecionada}
        setor={setorSelecionado}
        destino={dadosAdicionarItem.destino}
        onComplete={finalizarAdicaoItem}
      />
    )}
  </>
);
```

---

## 📈 Estatísticas das Animações

| Animação | Duração | Fases | Partículas | Ícones | Ondas |
|----------|---------|-------|------------|--------|-------|
| Adicionar Item | 6.4s | 5 | 20 | 4 | 9 |
| Compra | 6.9s | 5 | 28 | 7 | 9 |
| Danificada | 5.8s | 5 | 25 | 5 | 16 |
| Perdida | 6.8s | 5 | 20 | 6 | 11 |
| Verificação | 7.3s | 5 | 45 | 8 | 8 |

---

## 🎯 Casos de Uso

### Quando usar cada animação:

1. **Adicionar Item**: Ao cadastrar novo item no sistema
2. **Compra**: Ao registrar entrada de compra
3. **Danificada**: Ao reportar dano em ferramenta
4. **Perdida**: Ao registrar perda de item
5. **Verificação Mensal**: Ao concluir auditoria mensal

---

## 🚀 Performance Tips

1. **Lazy Loading**: Carregar animações apenas quando necessário
2. **Unmount**: Limpar estados após conclusão
3. **Debounce**: Evitar múltiplas animações simultâneas
4. **Memoization**: Usar React.memo se necessário

---

## 📝 Checklist de Implementação

- [ ] Importar componente de animação
- [ ] Criar estados (show, dados)
- [ ] Modificar handler para trigger animação
- [ ] Criar função finalizar com Firebase
- [ ] Renderizar condicionalmente
- [ ] Testar fluxo completo
- [ ] Verificar limpeza de estados
- [ ] Validar dark mode
- [ ] Testar responsividade

---

**Criado em**: 02/10/2025  
**Versão**: 1.0  
**Autor**: Zendaya Garden - Sistema de Inventário
