# 📅 Sistema de Cronogramas Semanais - Documentação Completa

## 🎯 Visão Geral

Sistema completo para criação e gerenciamento de cronogramas semanais de tarefas para funcionários. Permite criar modelos reutilizáveis, atribuir tarefas a múltiplos funcionários, acompanhar progresso e controlar execução por dia da semana.

---

## 📁 Arquivos Criados

### 1. **ModelosTarefas.jsx** (`src/components/Tarefas/`)
Componente para gerenciar modelos de tarefas reutilizáveis.

**Funcionalidades:**
- ✅ Criar modelos de tarefas com título, descrição, tipo e prioridade
- ✅ Editar modelos existentes
- ✅ Excluir modelos
- ✅ Visualização em cards com filtros visuais
- ✅ 6 tipos de tarefas: Manutenção, Limpeza, Organização, Segurança, Inventário, Outro
- ✅ 3 níveis de prioridade: Alta, Média, Baixa

**Firestore Collection:** `modelosTarefas`
```javascript
{
  titulo: string,
  descricao: string,
  prioridade: 'alta' | 'media' | 'baixa',
  tipo: 'manutencao' | 'limpeza' | 'organizacao' | 'seguranca' | 'inventario' | 'outro',
  createdBy: string (userId),
  createdAt: timestamp,
  updatedAt: timestamp
}
```

---

### 2. **CriarCronogramaSemanal.jsx** (`src/components/Tarefas/`)
Modal em 3 etapas para criar cronogramas semanais.

**Funcionalidades:**

#### Etapa 1: Seleção de Funcionários
- ✅ Selecionar múltiplos funcionários
- ✅ Definir data de início do cronograma
- ✅ Visualização de cards com foto e cargo

#### Etapa 2: Organizar Tarefas por Dia
- ✅ Adicionar tarefas de modelos existentes
- ✅ Criar novas tarefas na hora
- ✅ Editar tarefas já adicionadas
- ✅ Remover tarefas
- ✅ Copiar tarefas entre dias
- ✅ Definir horário para cada tarefa
- ✅ Navegação por dias da semana com contador de tarefas

#### Etapa 3: Revisão
- ✅ Resumo completo do cronograma
- ✅ Estatísticas: funcionários, total de tarefas, data de início
- ✅ Listagem de todas as tarefas por dia

**Firestore Collection:** `cronogramasSemanais`
```javascript
{
  funcionariosIds: string[],
  criadoPor: string (userId),
  dataInicio: string (YYYY-MM-DD),
  status: 'ativo' | 'concluido' | 'cancelado',
  tarefasPorDia: {
    segunda: [{
      id: number,
      modeloId: string (optional),
      titulo: string,
      descricao: string,
      prioridade: string,
      tipo: string,
      horario: string (HH:mm),
      concluida: boolean
    }],
    terca: [...],
    // ... outros dias
  },
  createdAt: timestamp
}
```

---

### 3. **DetalhesCronogramaSemanal.jsx** (`src/components/Tarefas/`)
Modal para visualizar e interagir com cronograma semanal.

**Funcionalidades:**
- ✅ Sidebar com navegação por dias da semana
- ✅ Progresso por dia e geral
- ✅ Restrição: só pode iniciar tarefas no dia correto ou depois
- ✅ Marcar tarefas como concluídas
- ✅ Visualização de horários, prioridades e tipos
- ✅ Alerta visual para dias bloqueados
- ✅ Atualização em tempo real do progresso

**Lógica de Controle:**
```javascript
// Só pode iniciar tarefa no dia correto ou depois
const podeConcluirTarefa = (dia) => {
  const indiceDiaAtual = diasOrdenados.indexOf(diaAtual);
  const indiceDiaTarefa = diasOrdenados.indexOf(dia);
  return indiceDiaTarefa <= indiceDiaAtual;
};
```

---

### 4. **CronogramaSemanalCard.jsx** (`src/components/Tarefas/`)
Card exibido na aba "Minhas Tarefas" do perfil.

**Funcionalidades:**
- ✅ Mostra cronogramas ativos do funcionário
- ✅ Progresso visual (barra e percentual)
- ✅ Preview das tarefas do dia atual
- ✅ Contador de tarefas concluídas/total do dia
- ✅ Clique abre modal de detalhes
- ✅ Design gradiente atraente
- ✅ Atualização em tempo real via onSnapshot

---

### 5. **tarefaNotificationService.js** (Atualizado)
Adicionada função para notificar cronogramas semanais.

**Nova Função:**
```javascript
export const notificarCronogramaSemanal = async (
  funcionarioId, 
  totalTarefas, 
  dataInicio, 
  cronograma
) => {
  const titulo = '📅 Novo Cronograma Semanal';
  const dataFormatada = new Date(dataInicio + 'T00:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  const mensagem = `Um novo cronograma com ${totalTarefas} tarefas foi criado para você. Início: ${dataFormatada}`;

  await criarNotif(funcionarioId, 'cronograma_semanal', titulo, mensagem, {
    cronogramaId: cronograma.id,
    totalTarefas,
    dataInicio,
    acao: 'cronograma_atribuido'
  });
};
```

---

## 🔄 Integrações

### ProfileTab.jsx
Adicionado componente `CronogramaSemanalCard` na aba Minhas Tarefas:
```jsx
{activeTab === 'tarefas' && (
  <div className="space-y-6">
    {/* Cronograma Semanal */}
    <CronogramaSemanalCard />

    {/* Tarefas Individuais */}
    <div className="bg-white ...">
      <TarefasTab ... />
    </div>
  </div>
)}
```

### TarefasTab.jsx
Adicionados 2 novos botões no header:
1. **"Modelos"** (verde) - Abre modal de gerenciamento de modelos
2. **"Cronograma Semanal"** (roxo/rosa) - Abre criador de cronograma

```jsx
{showAddButton && usuario.nivel >= NIVEIS_PERMISSAO.SUPERVISOR && (
  <div className="flex flex-wrap gap-3 pt-2">
    <button onClick={() => setShowModelosTarefas(true)}>
      Modelos
    </button>
    <button onClick={() => setShowCriarCronograma(true)}>
      Cronograma Semanal
    </button>
    {/* ... outros botões ... */}
  </div>
)}
```

---

## 🎨 UI/UX Design

### Cores e Gradientes
- **Modelos:** Verde/Esmeralda (`from-green-500 to-emerald-500`)
- **Cronograma:** Roxo/Rosa (`from-purple-500 to-pink-500`)
- **Card de Cronograma:** Azul/Roxo (`from-blue-500 to-purple-600`)
- **Progresso:** Branco com opacidade sobre fundo gradiente

### Animações
- ✅ Hover com `scale-105` nos botões
- ✅ Transições suaves de 300ms
- ✅ Sombras elevadas em hover
- ✅ Barras de progresso animadas

### Responsividade
- ✅ Grid adaptativo (1, 2 ou 3 colunas conforme tela)
- ✅ Modais com scroll interno
- ✅ Botões que se reorganizam em telas menores

---

## 📊 Fluxo de Uso

### 1. Administrador/Supervisor

#### Criar Modelos de Tarefas (Opcional)
1. Acessar página de Tarefas
2. Clicar em botão "Modelos" (verde)
3. Criar modelos reutilizáveis
4. Salvar para uso posterior

#### Criar Cronograma Semanal
1. Clicar em "Cronograma Semanal" (roxo/rosa)
2. **Etapa 1:** Selecionar funcionários e data de início
3. **Etapa 2:** Para cada dia da semana:
   - Adicionar tarefas de modelos OU
   - Criar novas tarefas na hora
   - Editar/Remover tarefas
   - Copiar tarefas entre dias
4. **Etapa 3:** Revisar resumo completo
5. Confirmar criação
6. ✅ Notificações enviadas automaticamente

### 2. Funcionário

#### Receber Notificação
1. Recebe notificação push no navegador
2. Vê notificação na página de Notificações
3. Clica na notificação (direciona para Meu Perfil > Minhas Tarefas)

#### Visualizar Cronograma
1. Acessa "Meu Perfil" > aba "Minhas Tarefas"
2. Vê card de Cronograma Semanal com:
   - Progresso geral
   - Tarefas de hoje
3. Clica no card para ver detalhes

#### Executar Tarefas
1. Modal de detalhes abre
2. Seleciona dia da semana na sidebar
3. **Se não for o dia correto:** tarefas aparecem bloqueadas com alerta
4. **Se for o dia correto ou depois:** pode marcar como concluída
5. Clica em "Marcar como Concluída"
6. Progresso atualiza em tempo real

---

## 🔐 Permissões

### SUPERVISOR (nivel >= 2)
- ✅ Criar modelos de tarefas
- ✅ Editar/Excluir modelos
- ✅ Criar cronogramas semanais
- ✅ Atribuir cronogramas a múltiplos funcionários

### FUNCIONÁRIO (nivel 1)
- ✅ Visualizar cronogramas atribuídos
- ✅ Marcar tarefas como concluídas (apenas no dia correto)
- ✅ Ver progresso do cronograma

---

## 🗄️ Estrutura do Firestore

### Collections Criadas

#### `modelosTarefas`
```
modelosTarefas/
├── {docId}/
    ├── titulo: "Limpeza do almoxarifado"
    ├── descricao: "Varrer e organizar prateleiras"
    ├── prioridade: "media"
    ├── tipo: "limpeza"
    ├── createdBy: "userId"
    ├── createdAt: timestamp
    └── updatedAt: timestamp
```

#### `cronogramasSemanais`
```
cronogramasSemanais/
├── {docId}/
    ├── funcionariosIds: ["userId1", "userId2"]
    ├── criadoPor: "adminUserId"
    ├── dataInicio: "2025-10-06"
    ├── status: "ativo"
    ├── tarefasPorDia: {
    │   ├── segunda: [{...}, {...}]
    │   ├── terca: [{...}]
    │   └── ...
    │   }
    └── createdAt: timestamp
```

#### `notificacoes` (Tipo novo)
```
notificacoes/
├── {docId}/
    ├── usuarioId: "funcionarioId"
    ├── tipo: "cronograma_semanal"
    ├── titulo: "📅 Novo Cronograma Semanal"
    ├── mensagem: "Um novo cronograma com 15 tarefas..."
    ├── dados: {
    │   ├── cronogramaId: "cronogramaId"
    │   ├── totalTarefas: 15
    │   ├── dataInicio: "2025-10-06"
    │   └── acao: "cronograma_atribuido"
    │   }
    ├── lida: false
    └── timestamp: timestamp
```

---

## 🎯 Casos de Uso

### Caso 1: Limpeza Semanal do Almoxarifado
**Cenário:** Criar cronograma de limpeza para 3 funcionários

1. Admin cria modelos:
   - "Varrer chão" (Limpeza, Média)
   - "Organizar prateleiras" (Organização, Baixa)
   - "Limpar banheiros" (Limpeza, Alta)

2. Admin cria cronograma:
   - Seleciona 3 funcionários
   - Segunda: Varrer + Organizar (08:00 e 10:00)
   - Quarta: Limpar banheiros (09:00)
   - Sexta: Varrer + Organizar (08:00 e 10:00)

3. Funcionários recebem notificação

4. Na segunda, funcionários marcam tarefas como concluídas

### Caso 2: Inventário Mensal
**Cenário:** Contagem de itens durante toda a semana

1. Admin cria cronograma com tarefas diferentes cada dia:
   - Segunda: Setor A
   - Terça: Setor B
   - Quarta: Setor C
   - Quinta: Setor D
   - Sexta: Conferência final

2. Funcionário só pode contar Setor A na segunda
3. Na terça, libera Setor B
4. Progresso vai atualizando durante a semana

---

## 🚀 Benefícios do Sistema

### Para Administradores
✅ **Eficiência:** Reutilizar modelos economiza tempo
✅ **Controle:** Acompanhar progresso em tempo real
✅ **Escalabilidade:** Atribuir mesmo cronograma para múltiplos funcionários
✅ **Organização:** Planejar semana inteira de uma vez

### Para Funcionários
✅ **Clareza:** Saber exatamente o que fazer cada dia
✅ **Autonomia:** Marcar conclusão de tarefas
✅ **Motivação:** Ver progresso visual da semana
✅ **Notificações:** Receber alertas de novos cronogramas

### Para o Sistema
✅ **Estruturado:** Dados bem organizados no Firestore
✅ **Tempo Real:** Atualizações instantâneas com onSnapshot
✅ **Histórico:** Manter registro de cronogramas passados
✅ **Análise:** Possibilidade de gerar relatórios futuros

---

## 📝 Próximas Melhorias Sugeridas

### Funcionalidades Adicionais
- [ ] **Cronogramas recorrentes:** Repetir automaticamente toda semana
- [ ] **Templates de cronograma:** Salvar cronogramas completos como template
- [ ] **Notificações por dia:** Lembrete diário das tarefas do dia
- [ ] **Comentários em tarefas:** Funcionários adicionarem observações
- [ ] **Anexos:** Permitir fotos de comprovação de conclusão
- [ ] **Dashboard de supervisão:** Visualizar progresso de todos os funcionários
- [ ] **Relatórios:** Gerar PDF com histórico de cronogramas
- [ ] **Calendário visual:** Ver cronogramas em formato de calendário mensal

### Melhorias de UX
- [ ] **Arrastar e soltar:** Reorganizar tarefas entre dias
- [ ] **Cores personalizadas:** Cada tipo de tarefa com cor diferente
- [ ] **Filtros avançados:** Filtrar cronogramas por período/funcionário
- [ ] **Busca:** Pesquisar tarefas dentro do cronograma
- [ ] **Notificações inteligentes:** Lembrar apenas tarefas não iniciadas

---

## 🐛 Troubleshooting

### Problema: Notificações não aparecem
**Solução:** Verificar permissão do navegador em Configurações > Notificações

### Problema: Não consigo iniciar tarefa
**Solução:** Verificar se é o dia correto. Sistema bloqueia tarefas de dias futuros.

### Problema: Cronograma não aparece no perfil
**Solução:** 
1. Verificar se funcionário foi incluído na lista
2. Verificar se status é "ativo"
3. Verificar query no Firebase onde `funcionariosIds` contém userId

### Problema: Progresso não atualiza
**Solução:** Componente usa onSnapshot, deve atualizar automaticamente. Verificar conexão com Firebase.

---

## 📞 Suporte

Para dúvidas ou problemas, consulte:
1. Este documento de documentação
2. Código comentado nos componentes
3. Console do navegador para logs de debug

---

**Versão:** 1.0.0  
**Data de Criação:** 03/10/2025  
**Última Atualização:** 03/10/2025
