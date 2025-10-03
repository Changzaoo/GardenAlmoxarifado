# 🎭 Animações Diferenciadas: Presente vs Ausente

## 📋 Resumo

Implementação de animações sofisticadas e distintas para os botões **Presente** (✓) e **Ausente** (✗) na página de Escala, cada uma com tema visual e comportamento apropriado ao seu contexto.

**Data**: 3 de outubro de 2025

---

## 🎨 Paleta de Cores

### ✅ Presente (Positivo)
| Elemento | Cor | Código | Uso |
|----------|-----|--------|-----|
| **Principal** | Verde | `#10b981` / `green-500` | Bordas, checkmark |
| **Secundária** | Esmeralda | `#34d399` / `emerald-400` | Brilhos, partículas |
| **Gradiente** | Verde-Esmeralda | `green-600 → emerald-600` | Background foto |
| **Borda rotativa** | Verde-Esmeralda | `green-500 → emerald-500` | Container |
| **Texto** | Verde claro | `green-300/400` | Mensagens |
| **Grade** | Verde alpha | `rgba(34, 197, 94, 0.8)` | Grid tech |

### ❌ Ausente (Negativo)
| Elemento | Cor | Código | Uso |
|----------|-----|--------|-----|
| **Principal** | Vermelho | `#ef4444` / `red-500` | Bordas, X |
| **Secundária** | Laranja | `#fb923c` / `orange-400` | Alertas, detalhes |
| **Gradiente** | Vermelho-Laranja | `red-600 → orange-600` | Background foto |
| **Borda rotativa** | Vermelho-Laranja | `red-500 → orange-500` | Container |
| **Texto** | Laranja/Vermelho | `orange-300 / red-400` | Mensagens |
| **Grade** | Vermelho alpha | `rgba(239, 68, 68, 0.8)` | Grid tech |

---

## 🎬 Diferenças por Fase

### Fase 1: SCANNING (0-1s)

#### ✅ Presente:
```
- Linha de scan: ÚNICA, verde-esmeralda suave
- Cor: emerald-400
- Movimento: Suave, 2s por ciclo
- Animação: scan-line (normal)
- Container: Verde suave, profissional
- Mensagem: "Digitalizando biometria facial..."
```

#### ❌ Ausente:
```
- Linhas de scan: DUPLAS, vermelho-laranja agressivas
- Cor primária: red-500 (espessa, com shadow)
- Cor secundária: orange-400 (fina, atraso 0.3s)
- Movimento: Rápido, 1.5s por ciclo
- Animação: scan-line-warning (escala X maior)
- Container: Vermelho intenso
- Efeito extra: Shake (treme)
- Alerta: Badge "ALERTA" piscando no canto
- Mensagem: "⚠️ Verificando ausência do funcionário..."
```

**Código scan-line-warning:**
```css
@keyframes scan-line-warning {
  0%, 100% { transform: translateY(-100%) scaleX(1.2); }
  50% { transform: translateY(100%) scaleX(1.2); }
}
```

**Código shake:**
```css
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px) rotate(-2deg); }
  75% { transform: translateX(5px) rotate(2deg); }
}
```

---

### Fase 2: ANALYZING (1-2s)

#### ✅ Presente:
```
- Grade: Verde (rgba(34, 197, 94, 0.8))
- Partículas: 5 partículas
  - Cor: emerald-400
  - Tamanho: 2px (uniforme)
  - Movimento: Circular suave e ordenado
  - Velocidades: 2s, 2.5s, 3s, 3.5s, 4s
  - Distribuição: 72° (360/5)
  - Raio: 80px fixo
- Efeito foto: hologram-flicker (suave)
- Mensagem: "Processando dados do funcionário..."
```

#### ❌ Ausente:
```
- Grade: Vermelha (rgba(239, 68, 68, 0.8))
- Partículas: 7 partículas (mais caóticas)
  - Cores alternadas:
    - Pares (0,2,4,6): red-500, 3px
    - Ímpares (1,3,5): orange-400, 2px
  - Movimento: Errático e desorganizado
  - Velocidades: 1.5s, 1.8s, 2.1s, 2.4s, 2.7s, 3s, 3.3s
  - Distribuição: 51.4° (irregular)
  - Raio: 70-90px (varia com Math.random)
  - Escala: 0.8-1.5 (varia dinamicamente)
- Efeito foto: glitch-effect (tremendo)
- Mensagem: "⚠️ Analisando motivo da ausência..."
```

**Código glitch-effect:**
```css
@keyframes glitch-effect {
  0%, 100% { transform: translate(0, 0); opacity: 1; }
  20% { transform: translate(-2px, 2px); opacity: 0.8; }
  40% { transform: translate(2px, -2px); opacity: 0.9; }
  60% { transform: translate(-2px, -2px); opacity: 0.7; }
  80% { transform: translate(2px, 2px); opacity: 0.85; }
}
```

---

### Fase 3: VERIFYING (2-3s)

#### ✅ Presente:
```
- Partículas: Continuam suaves e ordenadas
- Cor do pulso: pulse-glow-presente (verde)
- Borda: Rotação horária (3s)
- Mensagem: "Verificando credenciais..."
```

#### ❌ Ausente:
```
- Partículas: Continuam erráticas
- Cor do pulso: pulse-glow-ausente (vermelho)
- Borda: Rotação anti-horária (2s, mais rápida)
- Mensagem: "⚠️ Registrando falta no sistema..."
```

**Códigos de pulso:**
```css
@keyframes pulse-glow-presente {
  0%, 100% { box-shadow: 0 0 20px rgba(34, 197, 94, 0.5); }
  50% { box-shadow: 0 0 40px rgba(34, 197, 94, 0.8), 0 0 60px rgba(34, 197, 94, 0.4); }
}

@keyframes pulse-glow-ausente {
  0%, 100% { box-shadow: 0 0 20px rgba(239, 68, 68, 0.5); }
  50% { box-shadow: 0 0 40px rgba(239, 68, 68, 0.8), 0 0 60px rgba(239, 68, 68, 0.4); }
}
```

---

### Fase 4: CONFIRMED (3-4s)

#### ✅ Presente:
```
Símbolo: ✓ (Checkmark)
- Path único: M30 50 L45 65 L70 35
- Cor: #10b981 (verde)
- Animação: check-draw (0.5s, delay 0.3s)
- Círculo: Verde girando

Mensagem principal:
- "✓ PRESENÇA CONFIRMADA"
- Cor: green-400
- Tamanho: text-xl

Submensagem:
- "Funcionário marcado como presente"
- Cor: green-300

Raios de luz: bg-green-500/10
```

#### ❌ Ausente:
```
Símbolo: ✗ (X)
- Path 1: M35 35 L65 65 (diagonal \)
- Path 2: M65 35 L35 65 (diagonal /)
- Cor: #ef4444 (vermelho)
- Animação: x-draw (0.5s cada)
  - Path 1: delay 0.3s
  - Path 2: delay 0.5s (desenha sequencial)
- Círculo: Vermelho girando

Mensagem principal:
- "✗ FALTA REGISTRADA"
- Cor: red-400
- Tamanho: text-xl

Submensagem:
- "⚠️ Ausência registrada no sistema"
- Cor: orange-300

Raios de luz: bg-red-500/10
```

**Animação X:**
```css
@keyframes x-draw {
  0% { stroke-dashoffset: 200; }
  100% { stroke-dashoffset: 0; }
}
```

---

## 📊 Barra de Progresso

### ✅ Presente:
```css
bg-gradient-to-r from-green-500 via-emerald-400 to-green-500
```
- Transição suave verde-esmeralda
- Fluxo calmo

### ❌ Ausente:
```css
bg-gradient-to-r from-red-500 via-orange-400 to-red-500
```
- Transição agressiva vermelho-laranja
- Fluxo intenso

**Ambos usam**:
```
25% → 50% → 75% → 100%
Animação: data-flow 2s ease-in-out infinite
```

---

## 🎯 Elementos Únicos do Ausente

### 1. Badge de Alerta
```jsx
{animacaoVerificacao.tipo === 'ausente' && animacaoVerificacao.fase === 'scanning' && (
  <div className="absolute top-4 right-4 flex items-center gap-2 animate-pulse">
    <div className="w-3 h-3 bg-red-500 rounded-full" 
         style={{ animation: 'warning-pulse 1s ease-in-out infinite' }} />
    <span className="text-red-400 text-xs font-bold">ALERTA</span>
  </div>
)}
```

### 2. Shake Animation
```jsx
style={{ 
  animation: animacaoVerificacao.tipo === 'ausente' && animacaoVerificacao.fase === 'scanning' 
    ? 'shake 0.5s ease-in-out infinite' 
    : 'none'
}}
```

### 3. Glitch Effect na Foto
```jsx
style={{ 
  animation: animacaoVerificacao.tipo === 'ausente' && animacaoVerificacao.fase === 'analyzing'
    ? 'glitch-effect 0.3s ease-in-out infinite'
    : 'hologram-flicker 3s ease-in-out infinite'
}}
```

### 4. Partículas Caóticas
```javascript
// 7 partículas ao invés de 5
// Tamanhos variados (2px e 3px)
// Cores alternadas (red-500 e orange-400)
// Raios variáveis (70-90px)
// Escalas dinâmicas (0.8-1.5)
// Distribuição irregular (51.4° ao invés de 72°)
```

---

## 📐 Dados Técnicos (Rodapé)

### Cores por Tipo:

| Campo | Presente | Ausente |
|-------|----------|---------|
| **Dia** | `emerald-400` | `orange-400` |
| **Status** | `green-400` (PRESENTE) | `red-400` (AUSENTE) |
| **Hora** | `emerald-400` | `orange-400` |
| **Border** | `border-green-500/30` | `border-red-500/30` |

---

## 🎭 Comparação Visual Rápida

### Presente (Positivo, Calmo, Profissional)
```
🟢 Verde-Esmeralda
✓ Checkmark único
📊 5 partículas ordenadas
➡️ Movimento suave
✨ Brilho verde
🔄 Rotação horária
📝 Mensagens tranquilas
```

### Ausente (Negativo, Alerta, Urgente)
```
🔴 Vermelho-Laranja
✗ X duplo (sequencial)
📊 7 partículas caóticas
⚡ Movimento errático
🚨 Badge de alerta
💥 Efeito glitch/shake
🔄 Rotação anti-horária
⚠️ Mensagens de aviso
```

---

## 🔧 Implementação Técnica

### Estado React
```javascript
const [animacaoVerificacao, setAnimacaoVerificacao] = useState(null);

// Estrutura:
{
  funcionarioId: string,
  dia: number,
  tipo: 'presente' | 'ausente',  // ← Define qual animação
  funcionario: object,
  fase: 'scanning' | 'analyzing' | 'verifying' | 'confirmed'
}
```

### Lógica de Cores
```jsx
// Container
className={`bg-gradient-to-br ${
  animacaoVerificacao.tipo === 'presente'
    ? 'from-gray-900 via-emerald-900/50 to-gray-900 border-green-500/50'
    : 'from-gray-900 via-red-900/50 to-gray-900 border-red-500/50'
}`}

// Borda rotativa
className={`bg-gradient-to-r ${
  animacaoVerificacao.tipo === 'presente'
    ? 'from-green-500 via-emerald-500 to-green-500'
    : 'from-red-500 via-orange-500 to-red-500'
}`}

// Direção da rotação
style={{ 
  animation: animacaoVerificacao.tipo === 'presente' 
    ? 'rotate-border 3s linear infinite' 
    : 'rotate-border-reverse 2s linear infinite'
}}
```

---

## 🎨 Todas as Animações CSS

### Comuns:
- `scan-line` - Linha de scan padrão
- `rotate-border` - Rotação horária
- `data-flow` - Fluxo de dados
- `hologram-flicker` - Efeito holograma

### Específicas do Presente:
- `pulse-glow-presente` - Brilho verde
- `check-draw` - Desenho do checkmark
- `orbit-{0-4}` - 5 partículas ordenadas

### Específicas do Ausente:
- `scan-line-warning` - Scan duplo e largo
- `pulse-glow-ausente` - Brilho vermelho
- `rotate-border-reverse` - Rotação anti-horária
- `glitch-effect` - Efeito de falha/glitch
- `shake` - Tremor
- `warning-pulse` - Pulso de alerta
- `x-draw` - Desenho do X
- `orbit-warning-{0-6}` - 7 partículas caóticas

---

## 📊 Timeline Completa

```
┌─────────────────────────────────────────────────────────────┐
│ PRESENTE (Verde/Esmeralda - Calmo e Profissional)          │
├─────────────────────────────────────────────────────────────┤
│ 0s   SCANNING      ✓ Linha verde única, movimento suave    │
│ 1s   ANALYZING     ✓ 5 partículas ordenadas, grid verde    │
│ 2s   VERIFYING     ✓ Partículas continuam, pulso verde     │
│ 3s   CONFIRMED     ✓ Checkmark desenhado, raios verdes     │
│ 4s   FIM           ✓ Tela fecha, presença salva            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ AUSENTE (Vermelho/Laranja - Alerta e Urgente)              │
├─────────────────────────────────────────────────────────────┤
│ 0s   SCANNING      ⚠️ 2 linhas vermelhas, shake, badge     │
│ 1s   ANALYZING     ⚠️ 7 partículas caóticas, glitch        │
│ 2s   VERIFYING     ⚠️ Partículas erráticas, pulso vermelho │
│ 3s   CONFIRMED     ⚠️ X desenhado sequencial, raios vermelhos│
│ 4s   FIM           ⚠️ Tela fecha, falta salva              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Experiência do Usuário

### Presente (Sensação)
- ✅ **Confiável**: Animações suaves inspiram confiança
- 🟢 **Positivo**: Verde transmite aprovação e sucesso
- 📊 **Organizado**: Partículas ordenadas = sistema controlado
- ⭐ **Profissional**: Movimento calmo = ambiente corporativo

### Ausente (Sensação)
- ⚠️ **Alerta**: Animações agitadas chamam atenção
- 🔴 **Crítico**: Vermelho indica problema/falta
- 💥 **Urgente**: Movimento caótico = situação anormal
- 🚨 **Notificação**: Badge e shake = "preste atenção!"

---

## 📝 Mensagens por Fase

| Fase | Presente | Ausente |
|------|----------|---------|
| **Scanning** | "Digitalizando biometria facial..." | "⚠️ Verificando ausência do funcionário..." |
| **Analyzing** | "Processando dados do funcionário..." | "⚠️ Analisando motivo da ausência..." |
| **Verifying** | "Verificando credenciais..." | "⚠️ Registrando falta no sistema..." |
| **Confirmed** | "Funcionário marcado como presente" | "⚠️ Ausência registrada no sistema" |

---

## 🎉 Resultado Final

Duas animações **completamente distintas** que:

✅ **Presente**: Transmite aprovação, sucesso, ordem e profissionalismo
❌ **Ausente**: Transmite alerta, urgência, atenção e importância

Cada uma com sua própria **identidade visual**, **comportamento** e **mensagens contextuais**, criando uma experiência memorável e adequada ao contexto de cada ação.

---

**Desenvolvido em**: 3 de outubro de 2025
**Arquivos modificados**: `src/pages/Escala/EscalaPage.jsx`
**Animações CSS**: 15+ keyframes customizadas
**Linhas de código**: ~400 linhas de animação
**Duração**: 4 segundos cada
**Tipos de animação**: 2 (presente e ausente)
