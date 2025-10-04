# 📅 Sistema de Controle de Ponto - Guia Completo

## 🎯 Visão Geral

Sistema completo de marcação de presença e faltas baseado em planilha de ponto mensal, com interface visual intuitiva e colorida.

---

## ✨ Funcionalidades

### 📊 Visualização
- ✅ **Planilha mensal** com todos os dias do mês
- ✅ **Grid visual** com funcionários em linhas e dias em colunas
- ✅ **Cores distintas** para cada tipo de status
- ✅ **Destaque de finais de semana** (cinza)
- ✅ **Estatísticas individuais** por funcionário
- ✅ **Resumo geral** do mês

### 🎨 Status Disponíveis

| Status | Código | Cor | Descrição |
|--------|--------|-----|-----------|
| **Presente** | P | 🟢 Verde | Funcionário compareceu |
| **Falta** | F | 🔴 Vermelho | Funcionário faltou |
| **Atestado** | A | 🔵 Azul | Falta justificada (médico) |
| **Férias** | FE | 🟣 Roxo | Funcionário em férias |
| **Folga** | FO | 🟡 Amarelo | Dia de folga |
| **Não marcado** | - | ⚪ Cinza | Ainda não marcado |

### 🔐 Permissões

- **👨‍💼 Supervisores e Administradores:**
  - ✅ Marcar presença/falta de todos
  - ✅ Visualizar todos os funcionários
  - ✅ Navegar entre meses
  - ✅ Exportar relatórios
  - ✅ Marcar dia completo (todos de uma vez)

- **👷 Funcionários:**
  - ❌ Não têm acesso à página de ponto
  - ℹ️ Apenas supervisores podem marcar ponto

---

## 🎮 Como Usar

### 1. Acessar o Sistema
```
Menu → Ponto
```

### 2. Navegar pelos Meses
- **← Seta esquerda:** Mês anterior
- **→ Seta direita:** Próximo mês
- **Exibição:** Nome do mês e ano atual

### 3. Marcar Ponto Individual

**Passo a passo:**
1. Localize o funcionário na linha
2. Encontre o dia na coluna
3. Clique no quadrado colorido
4. Selecione o status no dropdown:
   - P - Presente
   - F - Falta
   - A - Atestado
   - FE - Férias
   - FO - Folga

**Visual:**
```
┌─────────────┬───┬───┬───┐
│ Funcionário │ 1 │ 2 │ 3 │
├─────────────┼───┼───┼───┤
│ João Silva  │🟢│🟢│🔴│
│             │ P │ P │ F │
└─────────────┴───┴───┴───┘
```

### 4. Filtrar por Setor

**Se você é administrador:**
1. Veja o dropdown "Filtro de setor" no topo
2. Selecione um setor específico
3. Ou escolha "Todos os setores"

### 5. Ver Estatísticas

**Por funcionário (última coluna):**
- ✅ **XP** = X presenças
- ❌ **XF** = X faltas  
- 🔵 **XA** = X atestados

**Resumo geral (cards no rodapé):**
- Total de presenças do mês
- Total de faltas do mês
- Total de atestados
- Total de férias
- Total de folgas

---

## 🗓️ Layout da Planilha

```
┌──────────────────┬────┬─────┬───┬───┬───┬───┬───┬───┬───┬─────────────┐
│   Funcionário    │Set │  D  │ S │ T │ Q │ Q │ S │ S │...│ Estatísticas│
│                  │    │  1  │ 2 │ 3 │ 4 │ 5 │ 6 │ 7 │   │             │
├──────────────────┼────┼─────┼───┼───┼───┼───┼───┼───┼───┼─────────────┤
│ 👤 João Silva    │ A  │ 🟢P │🟢P│🟢P│🟢P│🟢P│⚪-│⚪-│...│ 5P 0F 0A    │
├──────────────────┼────┼─────┼───┼───┼───┼───┼───┼───┼───┼─────────────┤
│ 👤 Maria Santos  │ B  │ 🟢P │🟢P│🔴F│🟢P│🟢P│⚪-│⚪-│...│ 4P 1F 0A    │
├──────────────────┼────┼─────┼───┼───┼───┼───┼───┼───┼───┼─────────────┤
│ 👤 Pedro Costa   │ A  │ 🟢P │🔵A│🔵A│🟢P│🟢P│⚪-│⚪-│...│ 3P 0F 2A    │
└──────────────────┴────┴─────┴───┴───┴───┴───┴───┴───┴───┴─────────────┘
```

**Legenda:**
- 🟢 P = Presente
- 🔴 F = Falta
- 🔵 A = Atestado
- 🟣 FE = Férias
- 🟡 FO = Folga
- ⚪ - = Não marcado
- Colunas D (Domingo) e S (Sábado) em **cinza** = fim de semana

---

## 💾 Armazenamento no Firebase

### Estrutura no Firestore:

```
pontos/
  ├─ 2025-10/              ← Mês-Ano
  │  └─ registros/
  │     ├─ abc123_2025-10-01   ← funcionarioId_data
  │     │  ├─ funcionarioId: "abc123"
  │     │  ├─ data: "2025-10-01"
  │     │  ├─ status: "presente"
  │     │  ├─ marcadoPor: "xyz789"
  │     │  └─ marcadoEm: "2025-10-01T08:30:00Z"
  │     │
  │     ├─ abc123_2025-10-02
  │     ├─ def456_2025-10-01
  │     └─ ...
  │
  ├─ 2025-11/
  │  └─ registros/
  │     └─ ...
  └─ ...
```

**Vantagens:**
- ✅ Organização por mês
- ✅ Fácil consulta de período específico
- ✅ Histórico completo preservado
- ✅ Rastreabilidade (quem marcou e quando)

---

## 🎨 Temas (Dark/Light Mode)

### Light Mode
```
┌─────────────────────────────────┐
│ Controle de Ponto     [Exportar]│
├─────────────────────────────────┤
│ Fundo: Branco                   │
│ Textos: Cinza escuro            │
│ Presente: Verde claro           │
│ Falta: Vermelho claro           │
│ Atestado: Azul claro            │
└─────────────────────────────────┘
```

### Dark Mode
```
┌─────────────────────────────────┐
│ Controle de Ponto     [Exportar]│
├─────────────────────────────────┤
│ Fundo: Cinza escuro             │
│ Textos: Branco                  │
│ Presente: Verde escuro          │
│ Falta: Vermelho escuro          │
│ Atestado: Azul escuro           │
└─────────────────────────────────┘
```

---

## 📱 Responsividade

### Desktop (> 1024px)
- Tabela completa visível
- Scroll horizontal se muitos dias
- Todas as colunas

### Tablet (768px - 1024px)
- Tabela com scroll horizontal
- Cards de resumo empilhados

### Mobile (< 768px)
- Tabela com scroll horizontal obrigatório
- Nome do funcionário fixo (sticky)
- Cards de resumo em coluna única

---

## 🔔 Notificações (Toast)

| Ação | Tipo | Mensagem |
|------|------|----------|
| Marcar ponto | ✅ Sucesso | "Ponto marcado com sucesso!" |
| Erro ao marcar | ❌ Erro | "Erro ao marcar ponto" |
| Sem permissão | ⚠️ Aviso | "Você não tem permissão para marcar ponto" |
| Dia completo marcado | ✅ Sucesso | "Dia X marcado para todos!" |
| Exportar | ℹ️ Info | "Funcionalidade de exportação em desenvolvimento" |

---

## 🛠️ Funcionalidades Futuras

### ⏳ Em Desenvolvimento
- [ ] **Exportar para Excel/PDF**
- [ ] **Relatório mensal detalhado**
- [ ] **Gráficos de frequência**
- [ ] **Comparativo mês a mês**
- [ ] **Alertas de faltas excessivas**

### 💡 Ideias Futuras
- [ ] **Justificativa de faltas** (anexar atestado)
- [ ] **Aprovação de atestados** por RH
- [ ] **Banco de horas**
- [ ] **Integração com folha de pagamento**
- [ ] **Notificação de aniversariantes**
- [ ] **Histórico de ponto por funcionário**

---

## 🐛 Resolução de Problemas

### Problema: Não consigo marcar ponto
**Solução:**
- Verifique se você é Supervisor ou Admin
- Funcionários não têm permissão

### Problema: Não vejo alguns funcionários
**Solução:**
- Se não é admin, você só vê funcionários do seu setor
- Verifique o filtro de setor

### Problema: Status não muda
**Solução:**
- Recarregue a página
- Verifique sua conexão com internet
- Veja o console do navegador (F12)

### Problema: Data errada
**Solução:**
- Use as setas para navegar ao mês correto
- Verifique a data do sistema

---

## 📊 Casos de Uso

### Caso 1: Marcação Diária
**Cenário:** Supervisor marcando presença do dia

1. Acessar "Ponto" no menu
2. Verificar se está no mês/dia correto
3. Para cada funcionário presente:
   - Clicar no quadrado do dia
   - Selecionar "P" (Presente)
4. Para funcionários ausentes:
   - Selecionar "F" (Falta) ou "A" (Atestado)

### Caso 2: Funcionário de Férias
**Cenário:** Marcar período de férias

1. Acessar "Ponto"
2. Localizar o funcionário
3. Para cada dia de férias:
   - Clicar no quadrado
   - Selecionar "FE" (Férias)
4. Ou usar atalho: marcar dia completo

### Caso 3: Fechamento Mensal
**Cenário:** Gerar relatório do mês

1. Navegar até o mês desejado
2. Verificar estatísticas no rodapé
3. Clicar em "Exportar" (quando disponível)
4. Salvar arquivo gerado

---

## 🎯 Métricas e KPIs

### Por Funcionário:
- **Taxa de presença:** (Presenças / Dias úteis) × 100%
- **Taxa de faltas:** (Faltas / Dias úteis) × 100%
- **Dias com atestado:** Total de atestados

### Geral:
- **Total de presenças** no mês
- **Total de faltas** no mês
- **Total de atestados** no mês
- **Média de presença** por dia

---

## 🔐 Segurança

- ✅ **Autenticação obrigatória**
- ✅ **Permissões por nível** (supervisor/admin)
- ✅ **Rastreamento de mudanças** (quem marcou)
- ✅ **Data/hora de marcação** registrada
- ✅ **Proteção contra modificações** não autorizadas

---

## 📞 Suporte

**Problemas técnicos?**
- Menu → Suporte
- Ou entre em contato com o administrador do sistema

**Dúvidas sobre uso?**
- Consulte este guia
- Fale com seu supervisor

---

## 📝 Changelog

### Versão 1.0.0 (Outubro 2025)
- ✅ Sistema de ponto completo implementado
- ✅ Marcação individual por dia/funcionário
- ✅ Filtro por setor
- ✅ Estatísticas em tempo real
- ✅ Navegação entre meses
- ✅ Suporte a dark mode
- ✅ Layout responsivo
- ✅ Integração com Firebase

---

**Última atualização:** Outubro 2025  
**Versão:** 1.0.0  
**Desenvolvido por:** Sistema WorkFlow Zendaya
