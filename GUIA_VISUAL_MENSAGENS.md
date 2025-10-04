# 🎯 Guia Visual - Sistema de Mensagens com Long Press

## 📱 Como Usar no Mobile

### 1️⃣ Pressione e Segure (500ms)

```
┌─────────────────────────────┐
│  👤 João Silva              │
│  ┌─────────────────────┐   │
│  │ Olá! Como vai?      │   │ ← Pressione e segure aqui
│  │         14:25 ✓✓    │   │
│  └─────────────────────┘   │
│                             │
│  ┌─────────────────────┐   │
│  │ Tudo bem e você?    │   │
│  │         14:26 ✓     │   │
│  └─────────────────────┘   │
└─────────────────────────────┘
```

### 2️⃣ Vibração + Modal Aparece

```
┌─────────────────────────────┐
│                             │
│   ⚡ BZZZZ ⚡ (vibra)       │
│                             │
│  ┌───────────────────────┐ │
│  │ 🗑️ Apagar mensagem    │ │
│  │ ──────────────────    │ │
│  │ "Olá! Como vai?"      │ │
│  │                       │ │
│  │ 🗑️ Apagar para mim    │ │
│  │ Você não verá mais... │ │
│  │                       │ │
│  │ 🗑️ Apagar para todos  │ │
│  │ Todos os participan...│ │
│  │                       │ │
│  │      Cancelar         │ │
│  └───────────────────────┘ │
└─────────────────────────────┘
```

### 3️⃣ Escolha uma Opção

```
┌─────────────────────────────┐
│  ┌───────────────────────┐ │
│  │ 🗑️ Apagar mensagem    │ │
│  │                       │ │
│  │ [🗑️ Apagar para mim]  │ ← Toque aqui
│  │    (sempre disponível) │ │
│  │                       │ │
│  │ [🗑️ Apagar p/ todos]  │ ← Ou aqui (< 30min)
│  │   (até 30 minutos)    │ │
│  │                       │ │
│  │ ⏰ Tempo excedido?    │ ← Aparece se > 30min
│  │   Não pode apagar...  │ │
│  │                       │ │
│  │      [Cancelar]       │ │
│  └───────────────────────┘ │
└─────────────────────────────┘
```

---

## 💻 Como Usar no Desktop

### 1️⃣ Passe o Mouse sobre a Mensagem

```
┌─────────────────────────────────────┐
│  👤 João Silva                      │
│  ┌───────────────────────┐ ✏️ 🗑️   │ ← Botões aparecem
│  │ Olá! Como vai?        │          │
│  │           14:25 ✓✓    │          │
│  └───────────────────────┘          │
└─────────────────────────────────────┘
```

### 2️⃣ Clique no Botão Lixeira

```
┌─────────────────────────────────────┐
│  ┌───────────────────────┐          │
│  │ Olá! Como vai?        │          │
│  │           14:25 ✓✓    │          │
│  └───────────────────────┘          │
│         ↓                            │
│  ┌─────────────────────┐            │
│  │ 🗑️ Apagar para mim  │            │
│  │ 🗑️ Apagar p/ todos  │ ← Se < 30min
│  │ ⏰ Tempo excedido    │ ← Se > 30min
│  └─────────────────────┘            │
└─────────────────────────────────────┘
```

---

## ⏰ Sistema de 30 Minutos

### Mensagem Recente (< 30 min)

```
┌────────────────────────────────┐
│  Enviada há: 5 minutos         │
│  ✅ PODE apagar para todos     │
│                                │
│  [🗑️ Apagar para todos]        │
│  ← DISPONÍVEL (vermelho)       │
└────────────────────────────────┘
```

### Mensagem Antiga (> 30 min)

```
┌────────────────────────────────┐
│  Enviada há: 45 minutos        │
│  ❌ NÃO pode apagar p/ todos   │
│                                │
│  ⏰ Tempo limite excedido       │
│  Mensagens só podem ser        │
│  apagadas para todos em        │
│  até 30 minutos após envio     │
│  ← BLOQUEADO (cinza)           │
└────────────────────────────────┘
```

---

## 👤 Nomes de Usuários

### Suas Mensagens

```
┌─────────────────────────────┐
│         Você  ← Nome azul claro
│  ┌─────────────────────┐   │
│  │ Mensagem enviada   │   │
│  │         14:25 ✓✓   │   │
│  └─────────────────────┘   │
└─────────────────────────────┘
```

### Mensagens de Outros

```
┌─────────────────────────────┐
│  João Silva  ← Nome azul escuro
│  ┌─────────────────────┐   │
│  │ Mensagem recebida  │   │
│  │         14:26 ✓    │   │
│  └─────────────────────┘   │
└─────────────────────────────┘
```

---

## 🎨 Fluxograma Completo

```
        [Usuário quer apagar mensagem]
                    ↓
        ┌───────────┴────────────┐
        │                        │
    [Mobile]              [Desktop]
        │                        │
        ↓                        ↓
[Long press 500ms]    [Hover + Click lixeira]
        │                        │
        ↓                        ↓
   [Vibração]          [Menu dropdown aparece]
        │                        │
        ↓                        ↓
[Modal fullscreen]              │
        │                        │
        └────────┬───────────────┘
                 ↓
        [Verifica se < 30 min?]
                 │
         ┌───────┴────────┐
         │                │
       [SIM]            [NÃO]
         │                │
         ↓                ↓
   [Mostra opção]   [Mostra aviso]
   "Apagar p/ todos" "Tempo excedido"
         │
         ↓
   [Usuário escolhe]
         │
    ┌────┴─────┐
    │          │
[Para mim] [P/ todos]
    │          │
    ↓          ↓
[Confirma] [Confirma]
    │          │
    └────┬─────┘
         ↓
   [Mensagem deletada]
```

---

## 🧪 Testes Visuais

### ✅ Checklist de Funcionamento

```
Desktop:
□ Hover mostra botões ✏️ 🗑️
□ Click abre menu dropdown
□ Opções visíveis e clicáveis
□ Fecha ao clicar fora

Mobile:
□ Long press funciona (500ms)
□ Vibra ao ativar
□ Modal slide-up suave
□ Botões grandes (fácil tocar)
□ Fecha ao tocar backdrop

Ambos:
□ Nome do remetente visível
□ Cor diferente (suas vs outras)
□ Opção "Para todos" só se < 30min
□ Aviso claro se > 30min
□ Confirmação antes de apagar
```

---

## 🎯 Próximos Passos

1. Abra `http://localhost:3001`
2. Vá para `/mensagens`
3. Envie uma mensagem
4. Teste os métodos de deleção:
   - **Desktop**: Hover + Click
   - **Mobile**: Long press (DevTools mobile ou real)
5. Observe o nome do remetente
6. Teste o limite de 30 minutos

---

**Dica**: Use o Chrome DevTools (F12) → Toggle Device Toolbar (Ctrl+Shift+M) para simular mobile no desktop!
