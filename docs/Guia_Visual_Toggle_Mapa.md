# 🎯 Guia Rápido: Toggle + Mapa Mundi

## 📍 Como Usar

### 1️⃣ Ativar/Desativar Servidor

**Localização:** Cards de servidores customizados

```
┌─────────────────────────────────┐
│ 🖥️  WorkFlow1            ❌     │
│ Project ID: workflow-br1        │
│ Adicionado: 06/10/2025         │
│ Status: ⚫ Inativo  [ ⚫️     ]  │  ← CLIQUE AQUI
└─────────────────────────────────┘

       👇 Após clicar

┌─────────────────────────────────┐
│ 🖥️  WorkFlow1            ❌     │
│ Project ID: workflow-br1        │
│ Adicionado: 06/10/2025         │
│ Status: ✅ Ativo    [     ⚫️ ]  │  ← ATIVADO
└─────────────────────────────────┘
```

**Toast aparece:** 🔄 Servidor WorkFlow1 ativado

---

### 2️⃣ Visualizar no Mapa

**Localização:** Abaixo dos servidores customizados

```
🗺️ Mapa Global de Servidores
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

             🌍 MAPA MUNDI

    📍 (verde)  = Servidor Ativo
    📍 (cinza)  = Servidor Inativo

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Ações no Mapa:**
- **Passar o mouse:** Ver nome e localização
- **Clicar no pin:** Abrir detalhes completos
- **Botões +/-:** Dar zoom

---

### 3️⃣ Ver Detalhes do Servidor

**Ao clicar em um pin no mapa:**

```
┌──────────────────────────────────────┐
│ 🖥️  WorkFlow1         📍 São Paulo   │
│                                  ❌   │
├──────────────────────────────────────┤
│                                      │
│ Status: ✅ Ativo                     │
│                                      │
│ 📝 Descrição:                        │
│ Novo Servidor do sistema             │
│                                      │
│ 🔐 Configurações Firebase:           │
│ Project ID: workflow-br1             │
│ Auth Domain: workflow-br1.firebase... │
│ Storage Bucket: workflow-br1.appspo...│
│                                      │
│ 📅 Criado em: 06/10/2025             │
│ 🧪 Último teste: 06/10/2025          │
│                                      │
│ 📍 Localização:                      │
│ 🇧🇷 São Paulo, Brasil                │
│ Região: southamerica-east1           │
└──────────────────────────────────────┘
```

---

## 🎨 Legendas Visuais

### Status de Servidor:

| Visual | Status | Descrição |
|--------|--------|-----------|
| ✅ `[ ⚫️     ]` Verde | **ATIVO** | Servidor em operação |
| ⚫ `[     ⚫️ ]` Cinza | **INATIVO** | Servidor desligado |

### Pins no Mapa:

| Cor | Status |
|-----|--------|
| 📍 **Verde** | Servidor ativo e operacional |
| 📍 **Cinza** | Servidor inativo/standby |

### Contador (Topo do Mapa):

```
┌─────────────────────┐
│ ✅ 3 | ❌ 1          │
│  Ativos | Inativos  │
└─────────────────────┘
```

---

## 🌍 Regiões Mapeadas

### América:
- 🇺🇸 EUA (7 regiões)
- 🇨🇦 Canadá (2 regiões)
- 🇧🇷 Brasil
- 🇨🇱 Chile

### Europa:
- 🇧🇪 Bélgica
- 🇬🇧 Reino Unido
- 🇩🇪 Alemanha
- 🇳🇱 Holanda
- 🇨🇭 Suíça
- 🇫🇮 Finlândia
- 🇵🇱 Polônia

### Ásia:
- 🇯🇵 Japão (2 regiões)
- 🇰🇷 Coreia do Sul
- 🇹🇼 Taiwan
- 🇭🇰 Hong Kong
- 🇸🇬 Singapura
- 🇮🇳 Índia (2 regiões)
- 🇮🇩 Indonésia

### Oceania:
- 🇦🇺 Austrália (2 regiões)

### Oriente Médio:
- 🇮🇱 Israel

### África:
- 🇿🇦 África do Sul

---

## ⚡ Atalhos

| Ação | Como Fazer |
|------|------------|
| **Ativar servidor** | Clicar no toggle switch |
| **Ver no mapa** | Scroll até "Mapa Global" |
| **Ver detalhes** | Clicar no pin verde/cinza |
| **Zoom in** | Clicar botão **+** |
| **Zoom out** | Clicar botão **-** |
| **Fechar modal** | Clicar **X** ou fora do modal |

---

## 🔔 Notificações

Você receberá toasts para:
- ✅ Servidor ativado
- ⏸️ Servidor desativado
- 🎉 Servidor adicionado
- ❌ Erro na conexão

**Duração:** 2-3 segundos  
**Posição:** Topo direito

---

## 💾 Persistência

Todos os status são salvos no **localStorage**:
- Status de ativação (ativo/inativo)
- Data da última alteração
- Configurações do servidor

**Ao recarregar a página:** Tudo é mantido! ✅

---

## 🎯 Exemplo Completo

### Cenário: Adicionar e ativar servidor no Japão

1. **Adicionar Servidor:**
   - Clicar "**+ Adicionar Servidor**"
   - Nome: "Tokyo Production"
   - Project ID: `my-app-asia-northeast1`
   - Preencher demais campos
   - Testar conexão ✅
   - Salvar

2. **Ativar Servidor:**
   - Localizar card "Tokyo Production"
   - Status mostra: ⚫ Inativo `[ ⚫️     ]`
   - Clicar no toggle
   - Status muda: ✅ Ativo `[     ⚫️ ]`
   - Toast: "🔄 Servidor Tokyo Production ativado"

3. **Visualizar no Mapa:**
   - Scroll até o mapa
   - Ver pin **verde** 📍 no Japão 🇯🇵
   - Passar mouse: "🇯🇵 Tokyo Production - Tóquio, Japão"
   - Clicar: Modal com todos os detalhes

4. **Resultado:**
   - ✅ Servidor ativo e visível
   - 📍 Pin verde no mapa
   - 💾 Status salvo no localStorage

---

## 🐛 Solução de Problemas

### Servidor não aparece no mapa?
- ✅ Verifique se o servidor foi salvo
- ✅ Recarregue a página
- ✅ Veja se o authDomain tem região válida

### Toggle não funciona?
- ✅ Verifique console do navegador (F12)
- ✅ Confirme que localStorage não está cheio
- ✅ Tente limpar cache do navegador

### Mapa não carrega?
- ✅ Verifique conexão com internet (TopoJSON externo)
- ✅ Veja console para erros
- ✅ Tente recarregar (Ctrl + Shift + R)

---

**Pronto! Agora você tem controle visual completo dos seus servidores! 🎉**
