# 📋 Documentação - Aplicação de Pontos Perfeitos em Lote

## 📌 Visão Geral

Sistema de aplicação de pontos perfeitos em lote para múltiplos funcionários através de interface gráfica intuitiva, eliminando a necessidade de scripts manuais de console.

---

## 🎯 Funcionalidades

### ✨ Características Principais

- **Seleção de Intervalo de Datas**: Escolha data inicial e final para aplicação dos pontos
- **Seleção Múltipla de Funcionários**: Escolha quais funcionários receberão os pontos perfeitos
- **Botão "Selecionar Todos"**: Aplica para todos os funcionários de uma vez
- **Barra de Progresso em Tempo Real**: Acompanhe o processamento (`X/Y funcionários`)
- **Log Console ao Vivo**: Veja cada operação sendo executada com cores:
  - 🟢 Verde: Sucesso
  - 🟡 Amarelo: Avisos (duplicados ignorados)
  - 🔴 Vermelho: Erros
  - 🔵 Azul: Informações gerais
- **Resumo de Resultados**: Card final com totais:
  - Total de funcionários processados
  - Total de pontos inseridos
  - Total de dias processados
  - Total de horas adicionadas ao banco
- **Prevenção de Duplicatas**: Sistema verifica automaticamente se já existem pontos para o dia antes de inserir
- **Atualização Automática do Banco de Horas**: Campo `bancoHoras` é atualizado com os minutos trabalhados

---

## 🚀 Como Usar

### Passo 1: Acessar a Funcionalidade

1. Navegue até a aba **Funcionários**
2. Localize o botão verde **"Pontos Perfeitos"** ao lado do botão azul "Adicionar" (canto superior esquerdo)
3. Clique no botão para abrir o modal

### Passo 2: Configurar Período

1. **Data Inicial**: Selecione a data de início do período
2. **Data Final**: Selecione a data de término do período
3. O sistema considerará todos os dias entre essas datas (inclusive)

### Passo 3: Selecionar Funcionários

1. **Opção A - Individual**: Marque os checkboxes dos funcionários desejados
2. **Opção B - Todos**: Clique em **"Selecionar Todos"** no canto superior direito da lista de funcionários
3. Para desmarcar todos, clique em **"Desmarcar Todos"** (o botão alterna entre as duas opções)

### Passo 4: Aplicar Pontos

1. Clique no botão **"Aplicar Pontos"**
2. Aguarde o processamento (acompanhe pela barra de progresso)
3. Observe os logs em tempo real para detalhes de cada operação
4. Ao final, veja o resumo com os totais

### Passo 5: Verificar Resultados

1. Feche o modal
2. Os cards dos funcionários já exibirão as horas atualizadas
3. Verifique o Firebase Firestore:
   - Coleção `pontos`: Novos documentos com os pontos inseridos
   - Coleção `funcionarios`: Campo `bancoHoras` atualizado

---

## ⚙️ Regras de Negócio

### 🕐 Horários por Escala

O sistema respeita os horários específicos de cada escala:

#### Escala M (6x1 - 8h/dia)
- **Segunda a Sexta**:
  - Entrada: 07:20
  - Saída Almoço: 11:20
  - Retorno Almoço: 12:20
  - Saída: 17:20
  - **Total: 8 horas**

- **Sábado**:
  - Entrada: 07:20
  - Saída Almoço: 10:20
  - Retorno Almoço: 11:20
  - Saída: 11:20 *(tempo zero após almoço)*
  - **Total: 5 horas**

- **Domingo**: Não trabalha

#### Escala M1 (6x1 - 7h20/dia)
- **Segunda a Sábado**:
  - Entrada: 07:20
  - Saída Almoço: 11:20
  - Retorno Almoço: 12:20
  - Saída: 16:40
  - **Total: 7h20**

- **Domingo**: Não trabalha

#### Escala M4 (5x2 - 8h40/dia)
- **Segunda a Sexta**:
  - Entrada: 07:20
  - Saída Almoço: 11:20
  - Retorno Almoço: 12:20
  - Saída: 17:40
  - **Total: 8h40**

- **Sábado e Domingo**: Não trabalha

### 🔒 Validações Aplicadas

1. **Data Inicial ≤ Data Final**: Sistema valida que a data inicial não pode ser posterior à final
2. **Pelo Menos 1 Funcionário**: É necessário selecionar ao menos um funcionário
3. **Sem Duplicatas**: Se já existir ponto para o dia, o sistema ignora e registra no log
4. **Respeito aos Finais de Semana**:
   - Escala M4: Ignora sábados e domingos
   - Escala M: Ignora domingos
   - Escala M1: Trabalha todos os dias exceto domingo
5. **Feriados**: Sistema não verifica feriados (pode ser adicionado futuramente)

### 📊 Cálculo das Horas

Para cada dia processado:

```javascript
// Exemplo: Escala M em dia de semana (8 horas)
const minutos = (
  (11:20 - 07:20) +  // Manhã: 4h = 240min
  (17:20 - 12:20)    // Tarde: 5h = 300min
) = 540 minutos = 9 horas

// Descontando 1h de almoço:
Horas Trabalhadas = 540 - 60 = 480 minutos = 8 horas
```

---

## 🗂️ Estrutura de Dados

### Coleção `pontos`

Cada ponto inserido cria um documento com a estrutura:

```javascript
{
  usuario: "funcionario_id",
  tipo: "entrada" | "saida_almoco" | "retorno_almoco" | "saida",
  timestamp: Timestamp,
  local: null,
  data: "DD/MM/YYYY",
  hora: "HH:MM",
  observacao: "Ponto inserido automaticamente via sistema de pontos perfeitos em lote"
}
```

### Coleção `funcionarios`

Campo `bancoHoras` é atualizado:

```javascript
{
  bancoHoras: bancoHorasAtual + minutosTrabalhadosNoPeriodo
}
```

---

## 🎨 Interface do Modal

### Seções do Modal

1. **Cabeçalho**:
   - Ícone de relógio (Clock)
   - Título "Aplicar Pontos Perfeitos em Lote"
   - Descrição: "Insira pontos de entrada e saída perfeitos..."

2. **Seletores de Data**:
   - Input de data inicial (type="date")
   - Input de data final (type="date")

3. **Lista de Funcionários**:
   - Checkbox "Selecionar Todos"
   - Lista scrollável com checkboxes individuais
   - Exibe: Nome + Matrícula + Escala

4. **Barra de Progresso**:
   - Indicador visual de progresso (`X/Y`)
   - Porcentagem calculada em tempo real

5. **Console de Logs**:
   - Área scrollável com logs coloridos
   - Auto-scroll para última mensagem

6. **Card de Resumo**:
   - Exibido ao final do processamento
   - Estatísticas completas da operação

7. **Botões de Ação**:
   - **Cancelar**: Fecha o modal sem ação
   - **Aplicar Pontos**: Inicia o processamento

---

## 🔧 Arquivos Modificados/Criados

### Novos Arquivos

1. **`src/components/Funcionarios/components/ModalAplicarPontosPerfeitosLote.jsx`**
   - Componente principal do modal
   - 450+ linhas
   - Lógica completa de aplicação de pontos

### Arquivos Modificados

1. **`src/components/Funcionarios/FuncionariosTab.jsx`**
   - Linha 40: Import do novo modal
   - Linha 58: Estado `showPontosPerfeitosModal`
   - Linha 707: Prop `onPontosPerfeitosLote` passada para BarraBuscaModerna
   - Linha 891: Renderização do modal

2. **`src/components/Funcionarios/components/BarraBuscaModerna.jsx`**
   - Linha 18: Import do ícone `Clock`
   - Linha 20: Prop `onPontosPerfeitosLote` adicionada
   - Linhas 159-170: Botão "Pontos Perfeitos" com gradiente verde

---

## 🎯 Casos de Uso

### Caso 1: Resetar Horas de Outubro

**Cenário**: Sistema foi resetado em 08/10/2025, precisa adicionar horas dos dias anteriores (01/10 a 07/10).

**Passos**:
1. Abrir modal "Pontos Perfeitos"
2. Data Inicial: 01/10/2025
3. Data Final: 07/10/2025
4. Selecionar Todos
5. Aplicar Pontos

**Resultado**: 
- ~7 dias × N funcionários × 4 pontos = Total de pontos inseridos
- Banco de horas atualizado com 8h/dia (M), 7h20/dia (M1) ou 8h40/dia (M4)

### Caso 2: Funcionário Faltou e Justificou

**Cenário**: Funcionário João faltou dia 15/10 mas teve falta abonada, precisa receber as horas.

**Passos**:
1. Abrir modal "Pontos Perfeitos"
2. Data Inicial: 15/10/2025
3. Data Final: 15/10/2025
4. Selecionar apenas "João"
5. Aplicar Pontos

**Resultado**:
- 4 pontos inseridos para João no dia 15/10
- Banco de horas atualizado com as horas do dia

### Caso 3: Período de Férias Coletivas

**Cenário**: Empresa teve recesso no Carnaval (10/02 a 14/02), mas quer computar como horas normais.

**Passos**:
1. Abrir modal "Pontos Perfeitos"
2. Data Inicial: 10/02/2025
3. Data Final: 14/02/2025
4. Selecionar funcionários que tiveram recesso
5. Aplicar Pontos

**Resultado**:
- 5 dias × N funcionários × 4 pontos
- Horas adicionadas ao banco como se tivessem trabalhado

---

## ⚠️ Avisos e Observações

### ⚡ Performance

- **Operação Assíncrona**: O processamento é feito de forma assíncrona para evitar travamentos
- **Batch Operations**: Firebase Firestore suporta até 500 operações por batch (sistema divide automaticamente)
- **Tempo de Processamento**: ~100-500ms por funcionário dependendo do número de dias

### 🔐 Segurança

- **Nível de Acesso**: Botão só é visível para usuários com `nivel >= 2` (Admin/Supervisor)
- **Validação no Frontend**: Todas as validações são feitas antes de enviar ao Firestore
- **Observação Automática**: Todos os pontos inseridos contêm campo `observacao` identificando origem

### 🗑️ Exclusão de Pontos

- Sistema **NÃO** possui funcionalidade de exclusão em lote
- Para remover pontos inseridos incorretamente, use o Firebase Console ou crie script de exclusão

### 📝 Logs de Auditoria

- Considerar adicionar coleção `logs_acoes_admin` para rastrear quem aplicou pontos em lote
- Pode ser útil para auditoria futura

---

## 🚧 Melhorias Futuras

### Funcionalidades Sugeridas

1. **Filtro de Feriados**: Integrar com API de feriados nacionais/municipais
2. **Histórico de Aplicações**: Registrar quem aplicou pontos para quais funcionários
3. **Desfazer Operação**: Botão para reverter aplicação de pontos em lote
4. **Exportar Relatório**: Baixar PDF/Excel com resumo da operação
5. **Agendamento**: Programar aplicação de pontos para data futura
6. **Notificações**: Alertar funcionários quando pontos forem adicionados
7. **Validação de Conflitos**: Verificar se há ponto manual conflitante antes de inserir
8. **Modo de Simulação**: Preview dos pontos que seriam inseridos sem realizar a operação

---

## 📞 Suporte

Para dúvidas ou problemas:
- Consulte este documento
- Verifique os logs do console do navegador (F12)
- Entre em contato com o desenvolvedor do sistema

---

## 📜 Histórico de Versões

| Versão | Data | Descrição |
|--------|------|-----------|
| 1.0.0 | 2025 | Versão inicial com funcionalidades completas |

---

**Desenvolvido por**: GitHub Copilot  
**Última Atualização**: 2025  
**Tecnologias**: React 18, Firebase Firestore, Framer Motion, Lucide React
