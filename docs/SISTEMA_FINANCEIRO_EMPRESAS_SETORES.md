# 💰 Sistema Financeiro de Empresas e Setores

## 🎯 Visão Geral

Sistema de visualização financeira completo com cálculo automático de valores do inventário por empresa e setor, incluindo descontos de ferramentas danificadas e perdidas.

---

## ✨ Funcionalidades Implementadas

### 1. **Visão Financeira Geral** 💼
- ✅ Resumo geral de todas as empresas
- ✅ Valores totais: Bruto, Danificadas, Perdidas e Líquido
- ✅ Cards visuais com ícones e cores
- ✅ Design responsivo (desktop e mobile)

### 2. **Hierarquia Expandível** 📊
```
📊 Visão Geral
  ├─ 🏢 Empresa 1
  │   ├─ 💼 Setor A
  │   ├─ 💼 Setor B
  │   └─ 💼 Setor C
  ├─ 🏢 Empresa 2
  │   ├─ 💼 Setor X
  │   └─ 💼 Setor Y
  └─ 🏢 Empresa 3
      └─ 💼 Setor Z
```

### 3. **Cálculos Automáticos** 🧮

#### Por Setor:
- **Valor Bruto:** Soma de (quantidade × valorUnitário) de todos os itens
- **Danificadas:** Soma de valorEstimado das ferramentas danificadas do setor
- **Perdidas:** Soma de valorEstimado das ferramentas perdidas do setor
- **Valor Líquido:** Valor Bruto - Danificadas - Perdidas

#### Por Empresa:
- **Soma de todos os setores** da empresa
- **Total de itens** no inventário
- **Quantidade total** de unidades
- **Número de setores**

#### Totais Gerais:
- **Soma de todas as empresas**
- **Valor total do inventário** da organização

---

## 🎨 Design Azul Profissional

### Cores Principais:
- **Azul Primário:** `#2563EB` (blue-600)
- **Azul Secundário:** `#3B82F6` (blue-500)
- **Indigo:** `#4F46E5` (indigo-600)
- **Verde (Positivo):** `#10B981` (green-500)
- **Laranja (Danificadas):** `#F59E0B` (orange-500)
- **Vermelho (Perdidas):** `#EF4444` (red-500)

### Gradientes:
```css
/* Header Principal */
from-blue-600 via-blue-700 to-indigo-700

/* Background Geral */
from-blue-50 via-blue-100 to-indigo-100

/* Cards de Empresa */
from-blue-500 to-blue-600

/* Valor Líquido */
from-green-500 to-emerald-600

/* Setores Expandidos */
from-blue-50 to-indigo-50
```

---

## 📱 Interface Responsiva

### Desktop (lg+):
```
┌─────────────────────────────────────────┐
│  💰 Gestão Financeira                  │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐         │
│  │Brt │ │Dan │ │Prd │ │Liq │         │
│  └────┘ └────┘ └────┘ └────┘         │
├─────────────────────────────────────────┤
│  🏢 Empresa A              [valores...]│
│    └─ [Setores em grid 3 colunas]     │
├─────────────────────────────────────────┤
│  🏢 Empresa B              [valores...]│
└─────────────────────────────────────────┘
```

### Tablet (md):
```
┌─────────────────────────┐
│  💰 Gestão Financeira  │
│  ┌────┐ ┌────┐        │
│  │Brt │ │Dan │        │
│  └────┘ └────┘        │
│  ┌────┐ ┌────┐        │
│  │Prd │ │Liq │        │
│  └────┘ └────┘        │
├─────────────────────────┤
│  🏢 Empresa A          │
│    └─ [2 colunas]     │
└─────────────────────────┘
```

### Mobile:
```
┌───────────────┐
│ 💰 Gestão    │
│ ┌──────────┐ │
│ │  Bruto   │ │
│ └──────────┘ │
│ ┌──────────┐ │
│ │  Líquido │ │
│ └──────────┘ │
├───────────────┤
│ 🏢 Empresa A │
│ [valores]    │
└───────────────┘
```

---

## 🔧 Estrutura de Código

### Arquivo Principal:
**`src/components/EmpresasSetores/EmpresasSetoresFinanceiro.jsx`**

### Estados:
```javascript
const [empresas, setEmpresas] = useState([]);
const [setores, setSetores] = useState([]);
const [inventario, setInventario] = useState([]);
const [ferramentasDanificadas, setFerramentasDanificadas] = useState([]);
const [ferramentasPerdidas, setFerramentasPerdidas] = useState([]);
const [empresaSelecionada, setEmpresaSelecionada] = useState(null);
```

### Funções de Cálculo:

#### `calcularValoresSetor(setorId)`
```javascript
{
  valorBruto,          // Total de itens × valores
  valorDanificadas,    // Soma de danificadas
  valorPerdidas,       // Soma de perdidas
  valorLiquido,        // Bruto - Danificadas - Perdidas
  totalItens,          // Quantidade de itens diferentes
  quantidadeTotal      // Soma de todas as unidades
}
```

#### `calcularValoresEmpresa(empresaId)`
```javascript
{
  valorBruto,          // Soma de todos os setores
  valorDanificadas,    // Soma de todos os setores
  valorPerdidas,       // Soma de todos os setores
  valorLiquido,        // Bruto - Danificadas - Perdidas
  totalItens,          // Total de itens da empresa
  quantidadeTotal,     // Total de unidades
  totalSetores         // Número de setores
}
```

### Integração:
**`src/components/EmpresasSetores/GerenciamentoUnificado.jsx`**

Nova aba "Visão Financeira" adicionada:
```jsx
<button onClick={() => setAbaAtiva('visao-geral')}>
  <DollarSign />
  Visão Financeira
</button>

{abaAtiva === 'visao-geral' && (
  <EmpresasSetoresFinanceiro usuarioAtual={usuarioAtual} />
)}
```

---

## 📊 Exemplo de Dados

### Cenário:
**Empresa: Garden Almoxarifado**
- Setor TI: R$ 50.000 (inventário)
  - Danificadas: R$ 2.000
  - Perdidas: R$ 1.500
  - **Líquido: R$ 46.500**

- Setor Produção: R$ 120.000
  - Danificadas: R$ 8.000
  - Perdidas: R$ 3.000
  - **Líquido: R$ 109.000**

**Total Empresa:**
- Bruto: R$ 170.000
- Danificadas: R$ 10.000
- Perdidas: R$ 4.500
- **Líquido: R$ 155.500**

---

## 🎯 Visual dos Cards

### Card de Resumo Geral:
```
┌─────────────────────────────────┐
│ 💰 Gestão Financeira           │
│                                 │
│ ┏━━━━━━┓ ┏━━━━━━┓ ┏━━━━━━┓    │
│ ┃ R$   ┃ ┃ - R$ ┃ ┃ - R$ ┃    │
│ ┃170k  ┃ ┃  10k ┃ ┃  4.5k┃    │
│ ┃Bruto ┃ ┃ Dani ┃ ┃ Perd ┃    │
│ ┗━━━━━━┛ ┗━━━━━━┛ ┗━━━━━━┛    │
│                                 │
│ ┏━━━━━━━━━━━━━━━┓              │
│ ┃  R$ 155.500   ┃              │
│ ┃    LÍQUIDO    ┃              │
│ ┗━━━━━━━━━━━━━━━┛              │
└─────────────────────────────────┘
```

### Card de Empresa:
```
┌─────────────────────────────────┐
│ 🏢 Garden Almoxarifado    [>]  │
│ 2 setores • 145 itens           │
│                                 │
│ Bruto      Dani    Perd  Líqui │
│ R$170k   -R$10k  -R$4.5k R$155k│
└─────────────────────────────────┘
```

### Card de Setor (Expandido):
```
┌────────────────────────┐
│ 💼 Setor TI           │
│ 45 itens • 120 unid.  │
│                        │
│ Bruto:    R$ 50.000   │
│ Dani:    - R$ 2.000   │
│ Perd:    - R$ 1.500   │
│ ━━━━━━━━━━━━━━━━━━━━ │
│ Líquido:  R$ 46.500   │
└────────────────────────┘
```

---

## 🚀 Como Usar

### 1. Acessar a Página:
```
Menu > Empresas/Setores > Aba "Visão Financeira"
```

### 2. Visualizar Totais Gerais:
- Cards no topo mostram valores de toda a organização

### 3. Expandir Empresa:
- Clique no card da empresa
- Visualize todos os setores

### 4. Analisar Setores:
- Cada setor mostra valores individuais
- Compare valores entre setores

---

## 📈 Benefícios

### ✅ **Transparência Total**
- Valores reais do inventário
- Descontos visíveis e rastreáveis

### ✅ **Tomada de Decisão**
- Identifique setores com altas perdas
- Compare desempenho entre empresas

### ✅ **Gestão Eficiente**
- Visão hierárquica clara
- Navegação intuitiva

### ✅ **Design Profissional**
- Interface moderna e limpa
- Cores consistentes (azul)
- Responsivo em todos os dispositivos

---

## 🎨 Componentes Visuais

### Ícones Utilizados:
- 🏢 **Building2** - Empresas
- 💼 **Briefcase** - Setores
- 💰 **DollarSign** - Valores monetários
- 📦 **Package** - Inventário
- 📊 **TrendingUp** - Crescimento
- ⚠️ **AlertCircle** - Perdas/Danos
- ➡️ **ChevronRight** - Expandir
- 📊 **BarChart3** - Estatísticas
- 🔷 **Layers** - Camadas/Setores

### Animações:
- ✨ Hover com escala (transform: scale(1.05))
- 🔄 Transições suaves (300ms)
- 💫 Sombras dinâmicas
- 🎭 Backdrop blur em cards

---

## 🔒 Permissões

### Todos os Usuários:
- ✅ Visualizar visão financeira
- ✅ Expandir empresas e setores
- ✅ Ver valores calculados

### Administradores:
- ✅ Todas as empresas visíveis
- ✅ Todos os setores visíveis

### Gerentes:
- ✅ Apenas sua empresa
- ✅ Setores da sua empresa

---

## 📝 Notas Técnicas

### Performance:
- **useMemo** para cálculos pesados
- Carregamento paralelo de dados (Promise.all)
- Filtros otimizados

### Compatibilidade:
- ✅ React 18+
- ✅ Tailwind CSS 3+
- ✅ Lucide React Icons
- ✅ Firebase Firestore

### Dados Necessários:
1. **Coleção `empresas`** (id, nome, cnpj, ativo)
2. **Coleção `setores`** (id, nome, empresaId, ativo)
3. **Coleção `inventario`** (id, nome, setorId, quantidade, valorUnitario)
4. **Coleção `ferramentas_danificadas`** (id, nomeItem, setorId, valorEstimado)
5. **Coleção `ferramentas_perdidas`** (id, nomeItem, setorId, valorEstimado)

---

## 🐛 Tratamento de Erros

### Dados Vazios:
```jsx
{empresas.length === 0 && (
  <div>
    <Building2 />
    <h3>Nenhuma Empresa Cadastrada</h3>
    <p>Comece cadastrando uma empresa...</p>
  </div>
)}
```

### Setores Vazios:
```jsx
{setoresEmpresa.length === 0 && (
  <div>
    <Package />
    <p>Nenhum setor cadastrado</p>
  </div>
)}
```

### Erros de Carregamento:
```javascript
try {
  await carregarTodosDados();
} catch (error) {
  console.error('Erro:', error);
  // Continua com dados vazios
}
```

---

## 🎯 Próximos Passos (Opcional)

### 1. **Filtros Avançados**
```javascript
- Filtrar por período
- Filtrar por valor mínimo
- Ordenar por valor líquido
```

### 2. **Exportação**
```javascript
- Exportar para PDF
- Exportar para Excel
- Gerar relatórios
```

### 3. **Gráficos**
```javascript
- Gráfico de pizza (setores)
- Gráfico de barras (empresas)
- Linha do tempo (histórico)
```

### 4. **Alertas**
```javascript
- Perdas acima de 10%
- Setores sem inventário
- Valores negativos
```

---

## 📅 Informações

**Data de Implementação:** 8 de outubro de 2025  
**Status:** ✅ **COMPLETO E FUNCIONAL**  
**Versão:** 1.0  
**Design:** Azul Profissional Responsivo

---

## 🎉 Conclusão

Sistema completo de visualização financeira implementado com:
- ✅ Cálculos automáticos de valores
- ✅ Descontos de perdas e danos
- ✅ Design azul profissional
- ✅ Interface responsiva
- ✅ Hierarquia expandível
- ✅ Performance otimizada

**Pronto para uso em produção!** 🚀
