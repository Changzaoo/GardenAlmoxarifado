# 💰 Cards Azuis com Valores de Inventário

## 🎯 Visão Geral

Sistema integrado de visualização financeira nos cards de empresas e setores no Gerenciamento Unificado, com design azul profissional e layout retangular otimizado para desktop.

---

## ✨ Implementação Realizada

### 1. **Dados Carregados** 📊

Adicionados novos estados para dados financeiros:

```javascript
const [inventario, setInventario] = useState([]);
const [ferramentasDanificadas, setFerramentasDanificadas] = useState([]);
const [ferramentasPerdidas, setFerramentasPerdidas] = useState([]);
```

**Função de Carregamento:**
```javascript
const carregarDadosFinanceiros = async () => {
  // Carrega de 3 coleções Firebase:
  // 1. inventario (itens do estoque)
  // 2. ferramentas_danificadas (perdas por danos)
  // 3. ferramentas_perdidas (perdas totais)
};
```

---

### 2. **Funções de Cálculo** 🧮

#### **Por Setor:**
```javascript
const calcularValoresSetor = (setorId, setorNome) => {
  // Filtra itens do setor
  // Calcula valor bruto (quantidade × valorUnitário)
  // Calcula desconto de danificadas (por nome)
  // Calcula desconto de perdidas (por nome)
  
  return {
    valorBruto,
    valorDanificadas,
    valorPerdidas,
    valorLiquido: valorBruto - valorDanificadas - valorPerdidas,
    totalItens,
    quantidadeTotal
  };
};
```

#### **Por Empresa (Agregação):**
```javascript
const calcularValoresEmpresa = (empresaId) => {
  // Filtra todos os setores da empresa
  // Soma valores de TODOS os setores
  
  return {
    valorBruto,
    valorDanificadas,
    valorPerdidas,
    valorLiquido,
    totalItens,
    quantidadeTotal,
    totalSetores
  };
};
```

**Fórmula:**
```
Valor Líquido = Valor Bruto - Danificadas - Perdidas

Empresa = Σ (Todos os Setores)
```

---

## 🎨 Design dos Cards

### **Card de Empresa - Retangular Desktop** 📱➡️💻

#### **Estrutura:**
```
┌──────────────────────────────────────────────────────────────────┐
│ 🏢 Nome da Empresa                            [Editar] [Excluir] │
│ 📋 CNPJ • 📞 Telefone • 📧 Email                                 │
│ 📍 Endereço                                                       │
├──────────────────────────────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌────────────┐ ┌─────────┐│
│ │  Bruto  │ │  Danif  │ │ Perdid  │ │  LÍQUIDO   │ │  Stats  ││
│ │ R$ XXX  │ │ -R$ XX  │ │ -R$ XX  │ │  R$ XXXX   │ │ 3 setor ││
│ └─────────┘ └─────────┘ └─────────┘ └────────────┘ └─────────┘│
├──────────────────────────────────────────────────────────────────┤
│ 💼 Setores (3)                                                   │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                │
│ │ Setor A     │ │ Setor B     │ │ Setor C     │                │
│ │ 45 itens    │ │ 32 itens    │ │ 28 itens    │                │
│ │ R$ 50.000   │ │ R$ 35.000   │ │ R$ 25.000   │                │
│ └─────────────┘ └─────────────┘ └─────────────┘                │
└──────────────────────────────────────────────────────────────────┘
```

#### **Cores (Gradiente Azul):**
- **Header:** `from-blue-600 to-blue-700`
- **Background:** `from-blue-50 via-blue-100 to-indigo-100`
- **Bordas:** `border-blue-200`
- **Valor Líquido:** `from-green-500 to-emerald-600`
- **Estatísticas:** `bg-blue-600`

#### **Responsividade:**
```css
/* Desktop (lg+) */
grid-cols-2 lg:grid-cols-5  /* 5 cards de valores */

/* Tablet (md) */
grid-cols-2 md:grid-cols-2  /* 2 colunas de setores */

/* Mobile */
grid-cols-2  /* 2 colunas básicas */
```

---

### **Card de Setor - Grid Compacto** 🔷

#### **Layout:**
```
┌────────────────────────────┐
│ 💼 Setor TI      [✏️] [🗑️] │
│ 🏢 Garden Almoxarifado     │
│ 👤 João Silva              │
├────────────────────────────┤
│ 📦 45 itens • 120 unidades │
├────────────────────────────┤
│ Bruto:      R$ 50.000,00  │
│ 🟠 Danif:  - R$ 2.000,00  │
│ 🔴 Perdid: - R$ 1.500,00  │
│ ━━━━━━━━━━━━━━━━━━━━━━━━ │
│ 💰 Líquido: R$ 46.500,00  │
├────────────────────────────┤
│ [████████████░░░] 93.0%   │
│ do valor original          │
├────────────────────────────┤
│ 📝 Descrição do setor      │
└────────────────────────────┘
```

#### **Grid Layout:**
```css
/* Desktop */
grid-cols-1 md:grid-cols-2 lg:grid-cols-3

/* Aba Setores */
grid-cols-1 md:grid-cols-2 lg:grid-cols-3
```

---

## 📊 Informações Exibidas

### **Card de Empresa:**

#### **Header (Azul):**
- 🏢 Nome da empresa (tamanho grande)
- 📋 CNPJ
- 📞 Telefone
- 📧 Email
- 📍 Endereço
- Botões: Editar | Excluir

#### **Grid de Valores (5 colunas):**

**1. Valor Bruto (Branco/Azul):**
```
Valor Bruto
R$ 170.000,00
```

**2. Danificadas (Laranja):**
```
Danificadas
- R$ 10.000,00
```

**3. Perdidas (Vermelho):**
```
Perdidas
- R$ 4.500,00
```

**4. Valor Líquido (Verde - Destaque):**
```
💰 Valor Líquido
R$ 155.500,00
```
*Card maior (col-span-2 em mobile)*

**5. Estatísticas (Azul Escuro):**
```
📊 Estatísticas
Setores: 3
Itens: 145
Unidades: 350
```

#### **Grid de Setores (3 colunas):**
- Mini-cards de cada setor
- Nome + Ícone
- Total de itens e unidades
- Valores: Bruto, Danificadas, Perdidas, Líquido
- Barra de progresso visual

---

### **Card de Setor:**

#### **Header (Azul):**
- 💼 Nome do setor
- 🏢 Nome da empresa
- 👤 Responsável
- Botões: Editar | Excluir

#### **Estatísticas:**
```
📦 45 itens • 120 unidades
```

#### **Valores (Breakdown):**
```
Valor Bruto:        R$ 50.000,00
🟠 Danificadas:   - R$ 2.000,00
🔴 Perdidas:      - R$ 1.500,00
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 Valor Líquido:  R$ 46.500,00
```

#### **Barra de Progresso:**
```
[████████████░░░] 93.0% do valor original
```
- Gradiente: `from-blue-500 to-green-500`
- Percentual: (líquido / bruto) × 100

#### **Descrição (Opcional):**
```
📝 Setor responsável por TI e infraestrutura
```

---

## 🔧 Integração

### **Abas:**

#### **1. Aba "Empresas":**
- Cards retangulares grandes
- Layout desktop otimizado
- Setores expandidos dentro do card
- Soma de TODOS os setores

#### **2. Aba "Setores":**
- Grid de 3 colunas (desktop)
- Cards compactos individuais
- Filtro por empresa (admin)
- Valores individuais de cada setor

#### **3. Aba "Visão Geral" (separada):**
- Componente `EmpresasSetoresFinanceiro`
- Visão financeira global
- Hierarquia expandível

---

## 🎯 Casos de Uso

### **Exemplo Real:**

**Garden Almoxarifado:**
- **Setor TI:**
  - 45 itens, 120 unidades
  - Bruto: R$ 50.000
  - Danificadas: - R$ 2.000
  - Perdidas: - R$ 1.500
  - **Líquido: R$ 46.500** (93%)

- **Setor Produção:**
  - 75 itens, 200 unidades
  - Bruto: R$ 95.000
  - Danificadas: - R$ 5.000
  - Perdidas: - R$ 2.000
  - **Líquido: R$ 88.000** (92.6%)

- **Setor Logística:**
  - 25 itens, 30 unidades
  - Bruto: R$ 25.000
  - Danificadas: - R$ 3.000
  - Perdidas: - R$ 1.500
  - **Líquido: R$ 20.500** (82%)

**Total da Empresa:**
- 3 setores
- 145 itens
- 350 unidades
- Bruto: R$ 170.000
- Danificadas: - R$ 10.000
- Perdidas: - R$ 5.000
- **Líquido: R$ 155.000** (91.2%)

---

## 💡 Benefícios

### ✅ **Visual:**
- Design azul profissional e consistente
- Layout retangular otimizado para desktop
- Cards expansivos com informações completas

### ✅ **Funcional:**
- Valores calculados automaticamente
- Agregação de setores por empresa
- Descontos de perdas visíveis

### ✅ **Gerencial:**
- Visão completa do patrimônio
- Identificação rápida de perdas
- Comparação entre setores

### ✅ **Responsivo:**
- Adapta-se a diferentes telas
- Grid flexível (1-3 colunas)
- Valores sempre legíveis

---

## 🎨 Código CSS Chave

### **Card de Empresa:**
```css
/* Container Principal */
.rounded-2xl
.border-2 border-blue-200
.bg-gradient-to-br from-blue-50 via-blue-100 to-indigo-100
.shadow-xl hover:shadow-2xl

/* Header Azul */
.bg-gradient-to-r from-blue-600 to-blue-700
.text-white

/* Grid de Valores */
.grid grid-cols-2 lg:grid-cols-5 gap-4

/* Valor Líquido (Destaque) */
.bg-gradient-to-br from-green-500 to-emerald-600
.col-span-2 lg:col-span-1
.text-2xl font-bold

/* Estatísticas */
.bg-blue-600
.text-white
```

### **Card de Setor:**
```css
/* Container */
.rounded-xl
.border-2 border-blue-200
.bg-gradient-to-br from-blue-50 to-indigo-100

/* Header */
.bg-gradient-to-r from-blue-600 to-blue-700

/* Valores */
.space-y-2
.text-sm

/* Barra de Progresso */
.h-2 bg-blue-200 rounded-full
.bg-gradient-to-r from-blue-500 to-green-500
```

---

## 📱 Breakpoints Responsivos

```javascript
/* Mobile First */
grid-cols-1          // Padrão mobile
grid-cols-2          // 2 colunas em valores

/* Tablet (md: 768px+) */
md:grid-cols-2       // 2 colunas em setores
md:grid-cols-2       // 2 valores por linha

/* Desktop (lg: 1024px+) */
lg:grid-cols-3       // 3 setores por linha
lg:grid-cols-5       // 5 valores por linha (empresa)
lg:col-span-1        // Ajustes de span
```

---

## 🔄 Fluxo de Dados

```
Firebase Collections
├─ empresas
├─ setores
├─ inventario
├─ ferramentas_danificadas
└─ ferramentas_perdidas
        ↓
carregarDadosFinanceiros()
        ↓
calcularValoresSetor(setorId)
        ↓
calcularValoresEmpresa(empresaId)
        ↓
Renderização dos Cards
        ↓
UI Azul Profissional
```

---

## 🚀 Performance

### **Otimizações:**
- ✅ Carregamento paralelo (Promise.all)
- ✅ Cálculos em memória (não consulta BD repetidamente)
- ✅ Filtros eficientes (array methods)
- ✅ Renderização condicional (valores > 0)

### **Caching:**
- Estados mantidos em memória
- Recalcula apenas quando dados mudam
- Evita consultas desnecessárias

---

## 📝 Manutenção

### **Para Adicionar Nova Métrica:**

1. Adicionar estado:
```javascript
const [novosDados, setNovosDados] = useState([]);
```

2. Carregar em `carregarDadosFinanceiros()`:
```javascript
const novosRef = collection(db, 'nova_colecao');
const novosSnap = await getDocs(novosRef);
setNovosDados(novosSnap.docs.map(...));
```

3. Atualizar cálculos:
```javascript
const calcularValoresSetor = (setorId) => {
  // ... existing code
  const novosValores = novosDados.filter(...);
  return { ...valores, novosValores };
};
```

4. Adicionar ao UI:
```jsx
<div className="bg-purple-50 ...">
  <div>Novos Valores</div>
  <div>R$ {valores.novosValores}</div>
</div>
```

---

## 🎉 Resultado Final

### **Antes:**
```
┌───────────────────────┐
│ Empresa X             │
│ CNPJ: XXX             │
│ [Editar] [Excluir]    │
└───────────────────────┘
```

### **Depois:**
```
┌─────────────────────────────────────────────────────────────────┐
│ 🏢 Empresa X                     [Editar] [Excluir]            │
│ 📋 CNPJ • 📞 Tel • 📧 Email • 📍 Endereço                      │
├─────────────────────────────────────────────────────────────────┤
│ [Bruto] [Danif] [Perdid] [💰 LÍQUIDO] [📊 Stats]              │
│                                                                  │
│ 💼 Setores (3)                                                  │
│ [Setor A: R$ 50k] [Setor B: R$ 35k] [Setor C: R$ 25k]        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Status

**Data:** 8 de outubro de 2025  
**Status:** ✅ **COMPLETO E FUNCIONAL**  
**Versão:** 2.0  
**Design:** Azul Profissional Desktop-First  

---

## 🎯 Conclusão

Sistema completo de visualização financeira integrado aos cards de empresas e setores:
- ✅ Design azul profissional
- ✅ Layout retangular desktop
- ✅ Valores calculados automaticamente
- ✅ Agregação por empresa
- ✅ Breakdown por setor
- ✅ Responsivo e performático

**Pronto para uso em produção!** 🚀💙
