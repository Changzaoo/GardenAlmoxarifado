# 🎬 Demonstração Visual - Sistema de Horas em Tempo Real

## 📸 Preview da Interface

### 1. Relógio em Tempo Real
```
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║          🔄 TEMPO REAL                                    ║
║                                                           ║
║               08h 45m 23s                                 ║
║                    ↓  ↓  ↓                                ║
║               08h 45m 24s  (atualiza)                     ║
║                    ↓  ↓  ↓                                ║
║               08h 45m 25s  (atualiza)                     ║
║                                                           ║
║          Horas contabilizadas hoje                        ║
║                                                           ║
║    ┌─────────────────────────────────────────┐           ║
║    │  ✏️  Corrigir Pontos do Dia            │           ║
║    └─────────────────────────────────────────┘           ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```

### 2. Saldo do Mês (Positivo)
```
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║    📈 Saldo do Mês                                        ║
║                                                           ║
║            +8h 30m                                        ║
║         (Cor: Ciano)                                      ║
║                                                           ║
║    ✅ Funcionário está acima da meta                     ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```

### 3. Saldo do Mês (Negativo)
```
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║    ⏱️  Saldo do Mês                                       ║
║                                                           ║
║            -2h 15m                                        ║
║         (Cor: Vermelho)                                   ║
║                                                           ║
║    ⚠️ Funcionário está abaixo da meta                    ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```

## 🖼️ Modal de Edição de Pontos

### Estado Inicial (Vazio)
```
╔═══════════════════════════════════════════════════════════╗
║  ✏️ Corrigir Pontos                               [X]    ║
║  Funcionário: Vinícius                                    ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║  📅 Data                                                  ║
║  ┌─────────────────────────────────────────────────┐     ║
║  │  2025-10-08                                     │     ║
║  └─────────────────────────────────────────────────┘     ║
║                                                           ║
║  ┌─────────────────────┐  ┌─────────────────────┐       ║
║  │ 🕐 1º Ponto         │  │ 🕐 2º Ponto         │       ║
║  │ Entrada (Verde)     │  │ Saída Almoço (Lara) │       ║
║  │ ┌─────────────────┐ │  │ ┌─────────────────┐ │       ║
║  │ │     --:--       │ │  │ │     --:--       │ │       ║
║  │ └─────────────────┘ │  │ └─────────────────┘ │       ║
║  └─────────────────────┘  └─────────────────────┘       ║
║                                                           ║
║  ┌─────────────────────┐  ┌─────────────────────┐       ║
║  │ 🕐 3º Ponto         │  │ 🕐 4º Ponto         │       ║
║  │ Volta Almoço (Azul) │  │ Saída (Vermelho)    │       ║
║  │ ┌─────────────────┐ │  │ ┌─────────────────┐ │       ║
║  │ │     --:--       │ │  │ │     --:--       │ │       ║
║  │ └─────────────────┘ │  │ └─────────────────┘ │       ║
║  └─────────────────────┘  └─────────────────────┘       ║
║                                                           ║
║  ╔═══════════════════════════════════════════════╗       ║
║  ║ ℹ️ Como funciona:                             ║       ║
║  ║ • Preencha apenas os pontos que deseja        ║       ║
║  ║   corrigir                                    ║       ║
║  ║ • Deixe em branco os que não precisam ser     ║       ║
║  ║   alterados                                   ║       ║
║  ║ • Use formato 24h (ex: 14:30)                 ║       ║
║  ║ • A correção sobrescreve os pontos existentes ║       ║
║  ╚═══════════════════════════════════════════════╝       ║
║                                                           ║
║  ┌─────────────┐          ┌─────────────────────┐       ║
║  │  Cancelar   │          │ 💾 Salvar Pontos    │       ║
║  └─────────────┘          └─────────────────────┘       ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```

### Estado Preenchido
```
╔═══════════════════════════════════════════════════════════╗
║  ✏️ Corrigir Pontos                               [X]    ║
║  Funcionário: Vinícius                                    ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║  📅 Data                                                  ║
║  ┌─────────────────────────────────────────────────┐     ║
║  │  2025-10-08                                     │     ║
║  └─────────────────────────────────────────────────┘     ║
║                                                           ║
║  ┌─────────────────────┐  ┌─────────────────────┐       ║
║  │ 🕐 1º Ponto         │  │ 🕐 2º Ponto         │       ║
║  │ Entrada             │  │ Saída Almoço        │       ║
║  │ ┌─────────────────┐ │  │ ┌─────────────────┐ │       ║
║  │ │     08:00       │ │  │ │     12:00       │ │       ║
║  │ └─────────────────┘ │  │ └─────────────────┘ │       ║
║  └─────────────────────┘  └─────────────────────┘       ║
║                                                           ║
║  ┌─────────────────────┐  ┌─────────────────────┐       ║
║  │ 🕐 3º Ponto         │  │ 🕐 4º Ponto         │       ║
║  │ Volta Almoço        │  │ Saída               │       ║
║  │ ┌─────────────────┐ │  │ ┌─────────────────┐ │       ║
║  │ │     13:00       │ │  │ │     17:30       │ │       ║
║  │ └─────────────────┘ │  │ └─────────────────┘ │       ║
║  └─────────────────────┘  └─────────────────────┘       ║
║                                                           ║
║  [Informações omitidas por brevidade]                    ║
║                                                           ║
║  ┌─────────────┐          ┌─────────────────────┐       ║
║  │  Cancelar   │          │ 💾 Salvar Pontos    │ ← Clique
║  └─────────────┘          └─────────────────────┘       ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```

## 🎯 Fluxo de Interação

### Cenário 1: Visualizar Horas em Tempo Real

```
┌─────────────────────────────────────────────────────────┐
│ 1. Usuário está na página de Funcionários              │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 2. Clica no card "Horas Trabalhadas" do funcionário    │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 3. Modal abre com relógio em TEMPO REAL                │
│    - Números atualizam a cada 1 segundo                │
│    - Ícone de refresh gira continuamente               │
│    - Display: 08h 45m 23s → 08h 45m 24s → ...         │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 4. Usuário visualiza:                                   │
│    ✓ Tempo real contabilizado                          │
│    ✓ Saldo do mês (+8h 30m ou -2h 15m)                │
│    ✓ Estatísticas (dias trabalhados, total de horas)  │
│    ✓ Botões de exportação (Excel/PDF)                 │
└─────────────────────────────────────────────────────────┘
```

### Cenário 2: Corrigir Pontos

```
┌─────────────────────────────────────────────────────────┐
│ 1. No modal de Horas Trabalhadas                        │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 2. Clica em "✏️ Corrigir Pontos do Dia"                │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 3. Modal de edição abre                                 │
│    - Data pré-selecionada (hoje)                       │
│    - 4 campos de horário vazios                        │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 4. Usuário preenche os pontos:                         │
│    - 08:00 (Entrada)                                   │
│    - 12:00 (Saída almoço)                              │
│    - 13:00 (Volta almoço)                              │
│    - 17:30 (Saída)                                     │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 5. Clica em "💾 Salvar Pontos"                         │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 6. Sistema valida:                                      │
│    ✓ Data está preenchida?                             │
│    ✓ Horários no formato HH:MM?                        │
│    ✓ Horários válidos (00:00-23:59)?                   │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 7. Toast de loading: "Salvando pontos..."              │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 8. Salva no Firestore                                   │
│    - Coleção: 'pontos'                                 │
│    - Documento: funcionarioId                          │
│    - Campo: data (2025-10-08)                          │
│    - Valor: {entrada, saidaAlmoco, voltaAlmoco, saida}│
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 9. Toast de sucesso: "✓ Pontos salvos com sucesso!"   │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 10. Modal fecha automaticamente                         │
│     Estados resetam para vazio                         │
└─────────────────────────────────────────────────────────┘
```

## 🎨 Cores e Estados

### Estado do Relógio
```css
/* Fundo do relógio */
background: linear-gradient(to-bottom-right, 
  #3b82f6,  /* blue-500 */
  #2563eb,  /* blue-600 */
  #1d4ed8   /* blue-700 */
);

/* Texto principal (horas e minutos) */
color: white;
font-size: 3.75rem; /* 60px no desktop */
font-family: monospace;

/* Texto de segundos (menor) */
color: rgba(255, 255, 255, 0.9);
font-size: 3rem; /* 48px no desktop */

/* Ícone de atualização */
color: rgba(255, 255, 255, 0.8);
animation: spin 3s linear infinite;
```

### Estados dos Ícones de Ponto
```
1º Ponto (Entrada)        → 🟢 Verde  (#16a34a)
2º Ponto (Saída Almoço)   → 🟠 Laranja (#ea580c)
3º Ponto (Volta Almoço)   → 🔵 Azul   (#2563eb)
4º Ponto (Saída)          → 🔴 Vermelho (#dc2626)
```

## 📊 Exemplos de Uso

### Exemplo 1: Funcionário com Saldo Positivo
```
Funcionário: João Silva
Data: 08/10/2025

┌─────────────────────────────────────┐
│   TEMPO REAL: 08h 47m 32s          │
└─────────────────────────────────────┘

Saldo do Mês: +12h 30m ✅
- Dias trabalhados: 20
- Total de horas: 172h 30m
- Meta esperada: 160h (20 dias × 8h)
- Status: ACIMA DA META
```

### Exemplo 2: Funcionário com Saldo Negativo
```
Funcionário: Maria Santos
Data: 08/10/2025

┌─────────────────────────────────────┐
│   TEMPO REAL: 05h 12m 45s          │
└─────────────────────────────────────┘

Saldo do Mês: -8h 15m ⚠️
- Dias trabalhados: 18
- Total de horas: 135h 45m
- Meta esperada: 144h (18 dias × 8h)
- Status: ABAIXO DA META
```

### Exemplo 3: Correção de Pontos
```
Cenário: Funcionário esqueceu de bater o 3º ponto

ANTES:
✓ 1º Ponto: 08:00
✓ 2º Ponto: 12:00
✗ 3º Ponto: --:--
✓ 4º Ponto: 18:00

AÇÃO:
1. Abre modal de correção
2. Seleciona data: 07/10/2025
3. Preenche apenas: 3º Ponto = 13:00
4. Deixa outros campos vazios
5. Salva

DEPOIS:
✓ 1º Ponto: 08:00
✓ 2º Ponto: 12:00
✓ 3º Ponto: 13:00 (CORRIGIDO)
✓ 4º Ponto: 18:00
```

## 🔔 Notificações (Toasts)

### Sucesso
```
┌─────────────────────────────────────┐
│ ✓ Pontos salvos com sucesso!        │
│   [Tipo: success, Duração: 3s]      │
└─────────────────────────────────────┘
```

### Erro - Data Inválida
```
┌─────────────────────────────────────┐
│ ✗ Selecione uma data válida          │
│   [Tipo: error, Duração: 3s]        │
└─────────────────────────────────────┘
```

### Erro - Horário Inválido
```
┌─────────────────────────────────────┐
│ ✗ Horário inválido no campo entrada │
│   Use o formato HH:MM                │
│   [Tipo: error, Duração: 3s]        │
└─────────────────────────────────────┘
```

### Loading
```
┌─────────────────────────────────────┐
│ ⏳ Salvando pontos...                │
│   [Tipo: loading, até completar]   │
└─────────────────────────────────────┘
```

## 🎬 Animações

### 1. Abertura do Modal Principal
```
Estado Inicial:
- opacity: 0
- scale: 0.9
- translateY: 20px

Animação (300ms):
- opacity: 0 → 1
- scale: 0.9 → 1
- translateY: 20px → 0px

Resultado: Modal "cresce" de baixo para cima com fade-in
```

### 2. Abertura do Modal de Edição
```
Estado Inicial:
- opacity: 0
- scale: 0.95
- translateY: 20px

Animação (300ms):
- opacity: 0 → 1
- scale: 0.95 → 1
- translateY: 20px → 0px

Resultado: Modal aparece suavemente no centro
```

### 3. Ícone de Refresh Girando
```
Animation: rotate
Duration: 3 segundos
Iterations: infinite
Direction: clockwise

0s   → 0°
0.75s → 90°
1.5s  → 180°
2.25s → 270°
3s    → 360° (reinicia)
```

### 4. Botão Hover (Salvar Pontos)
```
Estado Normal:
- scale: 1
- shadow: lg

Ao passar mouse:
- scale: 1.05 (5% maior)
- shadow: xl (sombra maior)
- duration: 150ms

Resultado: Botão "cresce" sutilmente ao passar o mouse
```

## 📱 Responsividade Detalhada

### Desktop (≥768px)
```
Relógio:
- Tamanho: 3.75rem (60px)
- Segundos: 3rem (48px)
- Grid pontos: 2 colunas
- Modal largura: max-w-lg (32rem)

Botões:
- Largura: flex-1 (50% cada)
- Padding: py-3 (12px vertical)
```

### Mobile (<768px)
```
Relógio:
- Tamanho: 3rem (48px)
- Segundos: 2.5rem (40px)
- Grid pontos: 2 colunas (compacto)
- Modal largura: max-w-full

Botões:
- Largura: flex-1 (50% cada)
- Padding: py-2 (8px vertical)
```

---

**Arquivo de Referência:**  
`src/components/Funcionarios/components/ModalDetalhesEstatisticas.jsx`

**Documentação Técnica:**  
`docs/Sistema_Horas_Tempo_Real.md`
