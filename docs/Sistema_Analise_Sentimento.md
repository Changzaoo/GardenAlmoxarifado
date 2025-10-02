# Sistema de Análise de Sentimento em Avaliações

## 📊 Visão Geral

Sistema inteligente que analisa automaticamente comentários e observações em avaliações de funcionários, identificando palavras positivas e negativas para ajustar as notas de forma justa e objetiva.

---

## 🎯 Objetivo

Criar um sistema que:
- ✅ Identifica palavras positivas e negativas em comentários
- ✅ Ajusta automaticamente as avaliações baseado no sentimento
- ✅ Fornece feedback visual sobre o sentimento geral
- ✅ Aplica-se a todos os tipos de avaliação (desempenho, tarefas, autoavaliação)

---

## 🔍 Dicionário de Palavras

### Palavras Positivas (32 termos)
```javascript
'excelente', 'ótimo', 'bom', 'muito bom', 'perfeito', 'maravilhoso', 'incrível',
'eficiente', 'dedicado', 'competente', 'profissional', 'organizado', 'pontual',
'responsável', 'proativo', 'criativo', 'inovador', 'colaborativo', 'produtivo',
'capaz', 'talentoso', 'qualificado', 'comprometido', 'atencioso', 'rápido',
'preciso', 'cuidadoso', 'melhorou', 'superou', 'sucesso', 'positivo'
```

### Palavras Negativas (30 termos)
```javascript
'ruim', 'péssimo', 'horrível', 'terrível', 'fraco', 'inadequado', 'insuficiente',
'lento', 'atrasado', 'desorganizado', 'irresponsável', 'negligente', 'descuidado',
'incompetente', 'despreparado', 'desmotivado', 'preguiçoso', 'ausente', 'faltou',
'problema', 'erro', 'falha', 'defeito', 'piorou', 'negativo', 'insatisfatório',
'decepcionante', 'abaixo', 'crítico', 'preocupante'
```

---

## ⚙️ Como Funciona

### 1. Análise de Texto

```javascript
analisarSentimento(texto)
```

**Input:** Comentário ou observação de uma avaliação

**Processo:**
1. Converte texto para minúsculas
2. Percorre lista de palavras positivas
3. Conta quantas foram encontradas
4. Percorre lista de palavras negativas
5. Conta quantas foram encontradas
6. Calcula score: `positivo - negativo`

**Output:**
```javascript
{
  positivo: 3,      // Quantidade de palavras positivas
  negativo: 1,      // Quantidade de palavras negativas
  score: 2          // Score final (3 - 1 = 2)
}
```

### 2. Impacto nas Avaliações

#### Fórmula de Ajuste
```javascript
impacto = (score / totalAvaliacoes) * 0.5
notaAjustada = notaOriginal + impacto
notaFinal = Math.max(0, Math.min(5, notaAjustada))
```

#### Exemplo Prático

**Funcionário A - Avaliações de Desempenho:**
- Avaliação 1: 4 estrelas + "Excelente trabalho, muito dedicado" (2 positivos)
- Avaliação 2: 3 estrelas + "Bom profissional, organizado" (2 positivos)
- Avaliação 3: 5 estrelas + "Perfeito, superou expectativas" (2 positivos)

**Cálculo:**
```
Média original = (4 + 3 + 5) / 3 = 4.0
Sentimento total = 6 positivos, 0 negativos
Score = 6 - 0 = 6

Impacto = (6 / 3) * 0.5 = 1.0
Nota ajustada = 4.0 + 1.0 = 5.0
Nota final = 5.0 (limite máximo)
```

---

## 📈 Tipos de Avaliação Afetados

### 1. Avaliação de Desempenho
- **Tipo:** `desempenho`
- **Fonte:** Supervisores/Administradores
- **Campos analisados:** `comentario`, `observacao`
- **Impacto:** ±0.5 estrelas por avaliação

### 2. Avaliação de Tarefas
- **Tipo:** Avaliações gerais (sem tipo ou diferente de `desempenho`)
- **Fonte:** Qualquer usuário
- **Campos analisados:** `comentario`, `observacao`
- **Impacto:** ±0.5 estrelas por avaliação

### 3. Autoavaliação
- **Tipo:** Qualquer avaliação feita pelo próprio funcionário
- **Fonte:** Próprio funcionário
- **Campos analisados:** `comentario`, `observacao`
- **Impacto:** ±0.5 estrelas por avaliação

---

## 🎨 Visualização no Modal

### Indicador de Sentimento

Aparece abaixo de cada tipo de avaliação no card do funcionário:

```
┌────────────────────────────────┐
│  Desempenho          (5)       │
│  ⭐⭐⭐⭐⭐                    │
│  4.8 / 5.0                     │
│  ─────────────────────────     │
│  💬 +12 positivos -2 negativos │
└────────────────────────────────┘
```

### Cores dos Indicadores

| Tipo      | Cor                | Classe CSS                |
|-----------|--------------------|---------------------------|
| Positivos | Verde              | `text-green-600`          |
| Negativos | Vermelho           | `text-red-600`            |
| Neutro    | Cinza              | `text-gray-400`           |

---

## 🔧 Implementação Técnica

### Estrutura de Dados

```javascript
avaliacoes[funcionarioId] = {
  desempenho: 4.8,                    // Nota ajustada
  tarefas: 4.2,                       // Nota ajustada
  totalAvaliacoesDesempenho: 5,
  totalAvaliacoesTarefas: 20,
  tarefasConcluidas: 12,
  sentimentoDesempenho: {
    positivo: 12,                     // Total de palavras positivas
    negativo: 2,                      // Total de palavras negativas
    score: 10                         // Score acumulado
  },
  sentimentoTarefas: {
    positivo: 25,
    negativo: 5,
    score: 20
  },
  mediaGeral: 4.5                     // Média entre desempenho e tarefas
}
```

### Fluxo de Processamento

```
1. Carregar avaliações do Firestore
   ↓
2. Para cada avaliação:
   ├─ Ler campo comentario/observacao
   ├─ Executar analisarSentimento(texto)
   ├─ Acumular resultados por funcionário
   └─ Separar por tipo (desempenho vs tarefas)
   ↓
3. Calcular médias originais
   ↓
4. Aplicar impacto do sentimento
   ├─ impacto = (score / total) * 0.5
   ├─ notaAjustada = original + impacto
   └─ notaFinal = limitar entre 0 e 5
   ↓
5. Armazenar em estado do componente
   ↓
6. Renderizar com indicadores visuais
```

---

## 📊 Exemplos de Casos

### Caso 1: Feedback Muito Positivo

**Input:**
- Nota: 4 estrelas
- Comentário: "Funcionário excelente, muito dedicado e profissional. Sempre pontual e organizado."

**Análise:**
- Positivos: excelente, dedicado, profissional, pontual, organizado = 5
- Negativos: 0
- Score: 5

**Resultado:**
- Impacto: +0.5 estrelas
- Nota final: 4.5 estrelas

---

### Caso 2: Feedback Misto

**Input:**
- Nota: 3 estrelas
- Comentário: "Bom funcionário mas apresentou problemas de organização. Melhorou recentemente."

**Análise:**
- Positivos: bom, melhorou = 2
- Negativos: problemas, desorganização = 2
- Score: 0

**Resultado:**
- Impacto: 0 estrelas (neutro)
- Nota final: 3.0 estrelas

---

### Caso 3: Feedback Negativo

**Input:**
- Nota: 2 estrelas
- Comentário: "Desempenho fraco, apresentou erros e foi negligente."

**Análise:**
- Positivos: 0
- Negativos: fraco, erros, negligente = 3
- Score: -3

**Resultado:**
- Impacto: -0.5 estrelas
- Nota final: 1.5 estrelas

---

## 🎯 Ordenação por Avaliação

Sistema calcula **média geral** para ordenação:

```javascript
mediaGeral = (notaDesempenho + notaTarefas) / 2
```

**Exemplo:**
- Funcionário A: Desempenho 4.8, Tarefas 4.2 → Média 4.5
- Funcionário B: Desempenho 5.0, Tarefas 3.8 → Média 4.4
- Funcionário C: Desempenho 4.5, Tarefas 4.5 → Média 4.5

**Ordenação (Melhores Avaliações):**
1. Funcionário A (4.5)
2. Funcionário C (4.5)
3. Funcionário B (4.4)

---

## 🚫 Exclusão de Usuários sem Cargo

### Filtro Aplicado

```javascript
funcionariosDoSetor.filter(
  func => func.setorId === setor.id && 
          func.cargo && 
          func.cargo.trim() !== ''
)
```

### Motivo
Usuários sem cargo definido são considerados:
- Contas administrativas
- Perfis incompletos
- Usuários inativos

Estes não devem aparecer na listagem de funcionários do setor.

---

## 📱 Interface do Usuário

### Botões de Ordenação

#### Ordenação Alfabética (Padrão)
```
[A-Z (Alfabética)] ← Azul quando ativo
```
- Ordena por `nome` (A→Z)
- Ignora acentuação
- Case-insensitive

#### Ordenação por Avaliação
```
[🔼 Melhores Avaliações] ← Verde quando ativo
```
- Ordena por `mediaGeral` (maior→menor)
- Considera impacto do sentimento
- Mostra melhores avaliados primeiro

---

## 🎨 Componentes Visuais

### Card de Funcionário

```
┌──────────────────────────────────┐
│        ┌─────────────┐            │
│        │    FOTO     │            │
│        └─────────────┘            │
│         [Ativo]                   │
│                                   │
│      João Silva                   │
│      Jardineiro                   │
│                                   │
│  ┌──────────┬──────────┐         │
│  │  ✓ 12    │  🏆 25   │         │
│  │  Tarefas │ Avaliações│        │
│  └──────────┴──────────┘         │
│                                   │
│  ┌─ Desempenho (5) ──────┐       │
│  │  ⭐⭐⭐⭐⭐            │       │
│  │  4.8 / 5.0             │       │
│  │  💬 +12 positivos      │       │
│  │     -2 negativos       │       │
│  └────────────────────────┘       │
│                                   │
│  ┌─ Tarefas (20) ────────┐       │
│  │  ⭐⭐⭐⭐☆            │       │
│  │  4.2 / 5.0             │       │
│  │  💬 +25 positivos      │       │
│  │     -5 negativos       │       │
│  └────────────────────────┘       │
└──────────────────────────────────┘
```

---

## 🔄 Atualizações em Tempo Real

### Quando o sentimento é recalculado?

1. **Ao abrir o modal**: Carrega todas as avaliações e recalcula
2. **Nova avaliação adicionada**: Próxima abertura do modal
3. **Avaliação editada**: Próxima abertura do modal
4. **Comentário modificado**: Próxima abertura do modal

### Cache
- ❌ Não há cache permanente
- ✅ Sempre calcula em tempo real
- ✅ Garante dados atualizados

---

## 📊 Estatísticas Globais

### Por Setor
O modal mostra no rodapé:
```
Total: 47 funcionário(s)
```

### Por Funcionário
Cada card mostra:
- **Tarefas Concluídas**: Quantidade
- **Total de Avaliações**: Desempenho + Tarefas
- **Sentimento Desempenho**: +X positivos, -Y negativos
- **Sentimento Tarefas**: +X positivos, -Y negativos

---

## 🎯 Boas Práticas

### Para Avaliadores

1. **Seja específico**: Use palavras claras e objetivas
2. **Justifique notas**: Explique o motivo da avaliação
3. **Use vocabulário positivo**: Quando aplicável
4. **Documente problemas**: Quando necessário

### Exemplos de Bons Comentários

✅ **Bom:**
> "Funcionário excelente, sempre pontual e organizado. Demonstra comprometimento e é muito eficiente nas tarefas."

✅ **Construtivo:**
> "Bom desempenho geral, mas apresentou alguns atrasos. Está melhorando e demonstra esforço."

❌ **Evitar:**
> "OK" (sem contexto)
> "5 estrelas" (redundante)
> Comentários vazios

---

## 🔮 Melhorias Futuras

- [ ] Machine Learning para análise mais sofisticada
- [ ] Suporte a mais idiomas (inglês, espanhol)
- [ ] Análise de contexto (negação, ironia)
- [ ] Peso diferente por tipo de palavra
- [ ] Histórico de evolução de sentimento
- [ ] Comparação entre setores
- [ ] Alertas para mudanças drásticas
- [ ] Export de relatórios com análise

---

## 📝 Changelog

### Versão 1.0 (2 de outubro de 2025)
- ✅ Sistema de análise de sentimento implementado
- ✅ 32 palavras positivas identificadas
- ✅ 30 palavras negativas identificadas
- ✅ Impacto de ±0.5 estrelas por avaliação
- ✅ Indicadores visuais nos cards
- ✅ Ordenação por avaliação com sentimento
- ✅ Exclusão de usuários sem cargo
- ✅ Suporte a dark mode

---

**Status:** ✅ Implementado e Funcional  
**Componente:** `ModalFuncionariosSetor.jsx`  
**Localização:** `src/components/Setores/`
