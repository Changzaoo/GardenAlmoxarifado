# 🚨 Sistema de Relatórios de Erros - Documentação Completa

## 📋 Visão Geral

Sistema completo para captura, armazenamento e gerenciamento de relatórios de erros do WorkFlow. Permite que usuários reportem erros diretamente da tela de erro e que administradores gerenciem todos os relatórios.

## 🎯 Funcionalidades Implementadas

### 1. Tela de Erro Aprimorada (ErrorScreen)

#### Botão "Reportar este Erro"
- Aparece na tela de erro com logo vermelha
- Permite ao usuário descrever o problema
- Gera código único de erro (ERR-XXXXX)
- Feedback visual de sucesso após envio

#### Informações Capturadas Automaticamente
- **Mensagem do erro**: Texto do erro capturado
- **Stack trace**: Pilha de chamadas completa
- **Informações do navegador**:
  - Nome (Chrome, Firefox, Safari, Edge)
  - Versão
  - Sistema Operacional
- **URL**: Página onde o erro ocorreu
- **Timestamp**: Data e hora exatas
- **Usuário**: ID, nome e email do usuário logado
- **Descrição manual**: Texto fornecido pelo usuário

### 2. Página de Gerenciamento (ErrorReportsPage)

#### Funcionalidades para Usuários Comuns
- ✅ Visualizar próprios relatórios
- ✅ Buscar por mensagem/código
- ✅ Filtrar por status
- ✅ Ver detalhes completos

#### Funcionalidades para Administradores
- ✅ Visualizar TODOS os relatórios
- ✅ Alterar status (Pendente → Analisando → Resolvido)
- ✅ Excluir relatórios
- ✅ Busca avançada
- ✅ Filtros por status

#### Interface
- **Header**: Título, contador de relatórios
- **Filtros**: Busca em tempo real + dropdown de status
- **Lista**: Cards clicáveis com informações resumidas
- **Modal**: Detalhes completos do erro
- **Ações**: Botões de mudança de status (admin only)

### 3. Integração no Menu

#### Desktop
- Novo botão no menu lateral esquerdo
- Ícone: `AlertTriangle` (triângulo de alerta)
- Localização: Abaixo do botão "Legal"

#### Mobile
- Item no menu de navegação inferior
- Ícone e comportamento consistentes
- Responsivo e touch-friendly

## 🗂️ Estrutura de Dados (Firebase)

### Coleção: `errorReports`

```javascript
{
  // Identificadores
  errorCode: "ERR-XXXXX",          // Código único gerado
  
  // Informações do erro
  errorMessage: "TypeError: ...",   // Mensagem do erro
  errorStack: "at Component...",    // Stack trace completo
  
  // Contexto
  timestamp: "2025-10-03T...",      // Data/hora do erro
  url: "https://workflow.../",      // URL onde ocorreu
  
  // Informações do navegador
  browserInfo: {
    name: "Chrome",                 // Nome do navegador
    version: "118.0.5993.88",       // Versão
    os: "Windows"                   // Sistema operacional
  },
  
  // Informações do usuário
  usuarioId: "func123",             // ID do usuário
  usuarioNome: "João Silva",        // Nome
  usuarioEmail: "joao@...",         // Email
  
  // Descrição manual
  descricao: "Estava tentando...",  // Descrição do usuário
  
  // Status e gerenciamento
  status: "pendente",               // pendente|analisando|resolvido|fechado
  criadoEm: "2025-10-03T...",      // Data de criação
  atualizadoEm: "2025-10-03T...",  // Última atualização
  atualizadoPor: "admin@..."       // Quem atualizou
}
```

## 📊 Status Possíveis

| Status | Cor | Ícone | Significado |
|--------|-----|-------|-------------|
| **Pendente** | Amarelo | `Clock` | Aguardando análise |
| **Analisando** | Azul | `RefreshCw` | Em investigação |
| **Resolvido** | Verde | `CheckCircle` | Problema corrigido |
| **Fechado** | Cinza | `XCircle` | Arquivado/ignorado |

## 🎨 Interface de Usuário

### Cores e Temas
```css
/* Light Mode */
--bg-primary: white
--bg-secondary: gray-50
--text-primary: gray-900
--text-secondary: gray-600

/* Dark Mode */
--bg-primary: gray-800
--bg-secondary: gray-900
--text-primary: white
--text-secondary: gray-400
```

### Componentes

#### StatusBadge
- Badge arredondado com ícone
- Cores dinâmicas baseadas no status
- Suporte a dark mode

#### DetalhesModal
- Modal fullscreen responsivo
- Seções organizadas:
  1. Info do usuário
  2. Mensagem de erro
  3. Stack trace (código)
  4. Descrição do usuário
  5. Info técnica
- Botões de ação (admin)

#### Card de Relatório
```jsx
<div className="bg-white rounded-xl p-6 hover:shadow-md">
  <StatusBadge />
  <Código do erro />
  <Mensagem />
  <Usuário e data />
</div>
```

## 🔒 Permissões

### Nível 1 - Funcionário
- ✅ Ver próprios relatórios
- ✅ Criar novos relatórios
- ❌ Ver relatórios de outros
- ❌ Alterar status
- ❌ Excluir relatórios

### Nível 4 - Admin
- ✅ Ver TODOS os relatórios
- ✅ Criar relatórios
- ✅ Alterar status
- ✅ Excluir relatórios
- ✅ Gerenciamento completo

## 🚀 Fluxo de Uso

### Para Usuários

1. **Erro ocorre** → Logo vermelha aparece
2. **Clica em "Reportar este Erro"**
3. **Modal abre** → Digite descrição (opcional)
4. **Clica em "Enviar Relatório"**
5. **Confirmação** → Código copiado para clipboard
6. **Acesso posterior** → Menu "Relatórios de Erros"

### Para Administradores

1. **Acessa** "Relatórios de Erros" no menu
2. **Visualiza** lista de todos os relatórios
3. **Filtra/busca** por status ou texto
4. **Clica em relatório** → Modal com detalhes
5. **Atualiza status**:
   - Pendente → Analisando
   - Analisando → Resolvido
6. **Exclui** se necessário

## 📱 Responsividade

### Desktop (> 768px)
- Menu lateral fixo com botão dedicado
- Layout de 2 colunas para filtros
- Cards em lista vertical
- Modal centralizado (max-width: 3xl)

### Mobile (< 768px)
- Menu inferior com ícone
- Filtros em coluna única
- Cards full-width
- Modal fullscreen
- Touch gestures otimizados

## 🛠️ Funções Principais

### getBrowserInfo()
Detecta informações do navegador automaticamente:
```javascript
{
  name: 'Chrome',
  version: '118.0.5993.88',
  os: 'Windows'
}
```

### enviarRelatorioErro()
Abre modal para descrição e envia relatório:
```javascript
const enviarRelatorioErro = async () => {
  // 1. Valida usuário logado
  // 2. Abre modal de descrição
  // 3. Aguarda confirmação
  // 4. Salva no Firebase
  // 5. Mostra feedback
}
```

### atualizarStatus()
Altera status do relatório (admin):
```javascript
const atualizarStatus = async (id, novoStatus) => {
  await updateDoc(doc(db, 'errorReports', id), {
    status: novoStatus,
    atualizadoEm: new Date(),
    atualizadoPor: usuario.email
  });
}
```

### excluirRelatorio()
Remove relatório permanentemente (admin):
```javascript
const excluirRelatorio = async (id) => {
  if (confirm('Tem certeza?')) {
    await deleteDoc(doc(db, 'errorReports', id));
  }
}
```

## 🎯 Casos de Uso

### Caso 1: Usuário Reporta Erro
```
Usuário → Erro ocorre → Clica "Reportar"
      → Descreve problema → Envia
      → Recebe confirmação → Código copiado
```

### Caso 2: Admin Analisa Erro
```
Admin → Abre página → Vê lista
     → Busca por código → Abre detalhes
     → Marca "Analisando" → Investiga
     → Marca "Resolvido" → Fecha
```

### Caso 3: Usuário Consulta Status
```
Usuário → Abre "Relatórios de Erros"
       → Vê próprios relatórios
       → Clica em relatório
       → Vê status atualizado
```

## 📈 Benefícios

### Para Usuários
- ✅ Reportar problemas facilmente
- ✅ Acompanhar status dos erros
- ✅ Comunicação clara com suporte
- ✅ Histórico de problemas

### Para Administradores
- ✅ Centralização de erros
- ✅ Priorização inteligente
- ✅ Rastreamento completo
- ✅ Análise de padrões
- ✅ Melhoria contínua

### Para o Sistema
- ✅ Debug facilitado
- ✅ Identificação de bugs recorrentes
- ✅ Dados para análise
- ✅ Melhoria da experiência

## 🔧 Manutenção

### Adicionar Novo Status
```javascript
// 1. Adicionar em StatusBadge
const configs = {
  novo_status: {
    color: 'bg-purple-100 text-purple-800',
    icon: IconName,
    label: 'Novo Status'
  }
};

// 2. Adicionar no dropdown de filtros
<option value="novo_status">Novo Status</option>
```

### Adicionar Campo no Relatório
```javascript
// 1. Adicionar na função enviarRelatorioErro
const relatorio = {
  ...camposExistentes,
  novoCampo: valorNovoCampo
};

// 2. Exibir no DetalhesModal
<div>
  <span>Novo Campo:</span>
  <p>{relatorio.novoCampo}</p>
</div>
```

## 📝 Arquivos Modificados

### 1. ErrorReportsPage.jsx (NOVO)
- **Path**: `src/pages/ErrorReports/ErrorReportsPage.jsx`
- **Linhas**: ~550 linhas
- **Função**: Página completa de gerenciamento

### 2. Workflow.jsx (MODIFICADO)
- **Seção**: ErrorScreen (linhas 1111-1220)
- **Adicionado**:
  - Modal de descrição
  - Função getBrowserInfo()
  - Função enviarRelatorioErro()
  - Botão "Reportar este Erro"
- **Imports**: CheckCircle, RefreshCw, ErrorReportsPage

### 3. Workflow.jsx (MODIFICADO)
- **Seção**: Configuração de abas (linha ~2650)
- **Adicionado**: Aba 'relatorios-erro' na lista

### 4. Workflow.jsx (MODIFICADO)
- **Seção**: Renderização (linha ~3590)
- **Adicionado**: Condição para ErrorReportsPage

### 5. Workflow.jsx (MODIFICADO)
- **Seção**: Menu lateral (linha ~3420)
- **Adicionado**: Botão AlertTriangle para relatórios

## 🎓 Guia de Testes

### Teste 1: Reportar Erro
1. Force um erro no console
2. Verifique se logo fica vermelha
3. Clique em "Reportar este Erro"
4. Digite descrição
5. Verifique sucesso e código copiado

### Teste 2: Visualizar Relatórios (Usuário)
1. Acesse menu "Relatórios de Erros"
2. Verifique que vê apenas seus relatórios
3. Clique em um relatório
4. Verifique detalhes completos

### Teste 3: Gerenciar Relatórios (Admin)
1. Acesse como admin
2. Verifique que vê todos os relatórios
3. Teste busca e filtros
4. Altere status de um relatório
5. Exclua um relatório

### Teste 4: Responsividade
1. Teste em desktop
2. Teste em mobile
3. Verifique menu e botões
4. Teste modal em ambos

## ✅ Checklist de Implementação

- [x] Criar ErrorReportsPage.jsx
- [x] Modificar ErrorScreen com botão
- [x] Adicionar getBrowserInfo()
- [x] Implementar envio de relatório
- [x] Adicionar aba no menu
- [x] Adicionar botão no menu lateral
- [x] Implementar permissões
- [x] Criar modal de detalhes
- [x] Adicionar filtros e busca
- [x] Implementar mudança de status
- [x] Adicionar exclusão de relatórios
- [x] Testar em desktop
- [x] Testar em mobile
- [x] Criar documentação

## 🌟 Melhorias Futuras

### Fase 2 (Opcional)
- [ ] Notificações push para novos erros
- [ ] Dashboard de estatísticas
- [ ] Gráficos de tendências
- [ ] Exportação para CSV/PDF
- [ ] Anexar screenshots
- [ ] Chat em tempo real com usuário
- [ ] Integração com Slack/Discord
- [ ] Tags personalizadas
- [ ] Atribuição de erros a desenvolvedores
- [ ] SLA e prioridades automáticas

---

**Desenvolvido com** 🚨 **para WorkFlow**
*Sistema de Relatórios de Erros v1.0*
