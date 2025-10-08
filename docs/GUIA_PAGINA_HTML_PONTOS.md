# 🌐 Guia: Página HTML - Inserir Pontos Perfeitos

## 📋 Visão Geral

Página HTML com interface visual para inserir pontos perfeitos, banco de horas e registro de escalas de forma automática.

---

## 🚀 Como Usar

### **Passo 1: Configurar Firebase**

1. Abra o arquivo: `inserir-pontos-interface.html`

2. Localize a seção de configuração (linha ~280):

```javascript
const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_AUTH_DOMAIN",
  projectId: "SEU_PROJECT_ID",
  storageBucket: "SEU_STORAGE_BUCKET",
  messagingSenderId: "SEU_MESSAGING_SENDER_ID",
  appId: "SEU_APP_ID"
};
```

3. **Substitua** pelas suas credenciais do Firebase:
   - Abra: Firebase Console → Configurações do Projeto → Suas aplicações
   - Copie as credenciais
   - Cole no arquivo HTML

---

### **Passo 2: Abrir a Página**

1. **Duplo-clique** no arquivo `inserir-pontos-interface.html`
2. A página abrirá no navegador
3. Você verá uma interface roxa moderna

---

### **Passo 3: Executar**

1. Leia os avisos na página
2. Clique no botão **"▶️ Executar Script"**
3. Aguarde o processamento (1-2 minutos)
4. Veja o log em tempo real
5. Ao final, verá estatísticas:
   - Funcionários processados
   - Pontos inseridos
   - Horas adicionadas
   - Escalas registradas

---

## 🎨 Interface Visual

### **Header (Roxo)**
```
🚀 Inserir Pontos Perfeitos
Adicione pontos e banco de horas de 01/10 a 07/10/2025
```

### **Caixa de Informações (Azul)**
- ✅ Lista do que o script faz
- 📋 Operações realizadas

### **Caixa de Avisos (Amarelo)**
- ⚠️ Avisos importantes
- Requisitos necessários

### **Botões**
- **▶️ Executar Script** (Roxo) - Inicia o processo
- **🗑️ Limpar Log** (Cinza) - Limpa a tela de log

### **Barra de Progresso**
- Mostra progresso: "5/15 funcionários"
- Visual: Gradiente roxo

### **Log Console (Preto)**
- Mensagens coloridas:
  - 🔵 Azul = Informação
  - 🟢 Verde = Sucesso
  - 🟡 Amarelo = Aviso
  - 🔴 Vermelho = Erro

### **Estatísticas (Cards)**
```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│ 15          │ 420         │ 650h 40m    │ 105         │
│ Funcionários│ Pontos      │ Horas       │ Escalas     │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

---

## 🔧 Escalas Configuradas

### **Escala M (6x1) - CORRIGIDA**
```
Segunda-Sexta:
  Entrada: 07:20
  Almoço: 12:00-13:00
  Saída: 16:20
  Total: 8h

Sábado:
  Entrada: 07:20
  Saída Almoço: 11:20 ✅ CORRIGIDO
  Total: 4h

Domingo:
  FOLGA ✅ CORRIGIDO
```

### **Escala M1 (6x1)**
```
Segunda-Sexta:
  Entrada: 07:00
  Almoço: 12:00-13:00
  Saída: 15:20
  Total: 7h20

Fim de Semana:
  Entrada: 07:00
  Almoço: 10:00-11:00
  Saída: 13:00
  Total: 6h
```

### **Escala M4 (5x2)**
```
Segunda-Sexta:
  Entrada: 06:00
  Almoço: 10:30-11:30
  Saída: 15:40
  Total: 8h40

Fim de Semana:
  FOLGA
```

---

## 📊 O que é Inserido

### **1. Pontos (Collection: `pontos`)**

Para cada dia trabalhado:
```javascript
{
  funcionarioId: "123",
  funcionarioNome: "Robson",
  tipo: "entrada",
  timestamp: Timestamp(2025-10-01 07:20:00),
  data: Timestamp(2025-10-01 07:20:00),
  localizacao: {
    latitude: -22.9068,
    longitude: -43.1729,
    precisao: 10
  },
  origem: "script_automatico_html",
  observacao: "Ponto perfeito inserido automaticamente (01-07/10/2025)"
}
```

4 pontos por dia completo:
- `entrada`
- `saida_almoco`
- `retorno_almoco` (se aplicável)
- `saida` (se aplicável)

---

### **2. Banco de Horas (Collection: `funcionarios`)**

Atualiza documento do funcionário:
```javascript
{
  bancoHoras: 2640, // Minutos acumulados (44h)
  ultimaAtualizacaoBancoHoras: Timestamp.now()
}
```

**Cálculo:**
- Soma os minutos trabalhados de 01/10 a 07/10
- Adiciona ao banco de horas existente
- Não substitui, apenas soma

---

### **3. Escalas (Collection: `escalas`)** ✨ NOVO

Para cada dia:
```javascript
// Documento ID: "2025-10-01"
{
  "123": "M",    // funcionarioId: escala
  "456": "M1",
  "789": "M4"
}
```

Permite consultar qual escala cada funcionário estava em cada dia.

---

## 🔍 Verificações

O script **NÃO duplica**:

1. ✅ Verifica se funcionário está ativo
2. ✅ Verifica se escala está configurada
3. ✅ Verifica se dia é de trabalho
4. ✅ **Verifica se já existe ponto naquele dia**
5. ✅ Pula dias já processados

---

## 📝 Exemplo de Log

```
═══════════════════════════════════════════════════════════
🚀 SCRIPT: Inserir Pontos Perfeitos + Banco de Horas
═══════════════════════════════════════════════════════════

⏳ Iniciando processo...

📋 Buscando funcionários ativos...
✅ 15 funcionários encontrados

👤 Processando: Robson (Escala: M)
   ✅ 01/10 (Ter) - 4 pontos inseridos (8h 0m)
   ✅ 02/10 (Qua) - 4 pontos inseridos (8h 0m)
   ✅ 03/10 (Qui) - 4 pontos inseridos (8h 0m)
   ✅ 04/10 (Sex) - 4 pontos inseridos (8h 0m)
   ✅ 05/10 (Sáb) - 2 pontos inseridos (4h 0m) ← CORRIGIDO
   ⏭️  06/10 (Dom) - Folga ← CORRIGIDO
   ✅ 07/10 (Seg) - 4 pontos inseridos (8h 0m)
   💰 Banco de Horas: +44h 0m

═══════════════════════════════════════════════════════════
🎉 PROCESSO CONCLUÍDO COM SUCESSO!
═══════════════════════════════════════════════════════════

📊 RESUMO GERAL:
   • Funcionários processados: 15
   • Pontos inseridos: 420
   • Escalas registradas: 105 (15 funcionários × 7 dias)
   • Total de horas adicionadas: 650h 40m

✅ Todos os funcionários agora têm pontos perfeitos de 01/10 a 07/10!
✅ Banco de horas atualizado para todos!
✅ Escalas registradas no sistema!

⚡ Recarregue a página do sistema para ver as mudanças!
```

---

## ⚠️ Firestore Rules

Certifique-se de que suas regras permitem escrita:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Pontos
    match /pontos/{pontoId} {
      allow write: if request.auth != null && 
                     request.auth.token.nivel >= 2; // Admin
    }
    
    // Funcionários
    match /funcionarios/{funcId} {
      allow write: if request.auth != null && 
                     request.auth.token.nivel >= 2; // Admin
    }
    
    // Escalas
    match /escalas/{escalaId} {
      allow write: if request.auth != null && 
                     request.auth.token.nivel >= 2; // Admin
    }
  }
}
```

---

## 🐛 Troubleshooting

### **Erro: "Missing or insufficient permissions"**
**Solução:**
- Faça login como admin no sistema
- Ou ajuste Firestore Rules para permitir escrita

---

### **Erro: "Firebase not defined"**
**Solução:**
- Verifique conexão com internet
- Firebase CDN pode estar bloqueado
- Tente usar outro navegador

---

### **Erro: "Invalid Firebase configuration"**
**Solução:**
- Verifique se configurou corretamente as credenciais
- Confira se copiou TODOS os campos
- Não deixe "SUA_API_KEY" sem substituir

---

### **Log não aparece**
**Solução:**
- Verifique console do navegador (F12)
- Pode haver erro de JavaScript
- Veja erros na aba Console

---

## 💡 Dicas

1. **Teste com 1 funcionário primeiro:**
   - Edite o código para filtrar apenas 1 ID
   - Veja se funciona
   - Depois libere para todos

2. **Horário de execução:**
   - Execute em horário de baixo movimento
   - Preferencialmente após expediente

3. **Backup:**
   - Faça backup do Firebase antes
   - Firestore → Export

4. **Monitoramento:**
   - Acompanhe o log em tempo real
   - Se der erro, interrompa (F5)

---

## 📱 Compatibilidade

Testado e funcionando em:
- ✅ Google Chrome 90+
- ✅ Firefox 88+
- ✅ Edge 90+
- ✅ Safari 14+

Não funciona em:
- ❌ Internet Explorer
- ❌ Navegadores muito antigos

---

## 🎉 Pronto!

A página está configurada e pronta para uso!

Basta abrir o arquivo HTML e clicar em "Executar Script".

**Boa sorte! 🚀**
