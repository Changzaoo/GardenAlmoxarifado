# 🚀 Sistema de Migração para Novo Modelo de Usuário

## 📋 Visão Geral

Foi implementado um **sistema completo de migração** que atualiza todos os usuários do sistema para um novo modelo mais robusto e funcional, incluindo:

- **Status online/offline** em tempo real
- **Timestamp de última atividade**
- **Item favorito** personalizável
- **MenuConfig** - Configuração personalizada de menu por usuário

## 🎯 Novo Modelo de Usuário

### Estrutura Completa

```javascript
{
  // Dados Básicos
  nome: "Angelo",
  email: "Angelo",
  nivel: 3,
  ativo: true,
  
  // Segurança (SHA-512)
  senha: null,
  senhaHash: "a67f238b7f0ad4a6f84d93f211787392...",
  senhaSalt: "e0ffd1a2af28ffc289e16376e690c426",
  senhaVersion: 2,
  senhaAlgorithm: "SHA-512",
  
  // Informações Profissionais
  cargo: "Supervisor",
  empresaId: "TcVmHVefUYW1qsIQan2Z",
  empresaNome: "Zendaya",
  setorId: "o4GeEPjooTJ0ajimS4LK",
  setorNome: "Jardim",
  
  // Contato
  telefone: "",
  whatsapp: "",
  
  // Visual
  photoURL: "",
  
  // ✨ NOVOS CAMPOS ✨
  status: "online",                    // online/offline/ausente/ocupado
  ultimaVez: Timestamp,                // Última atividade
  itemFavorito: "escala",              // Item preferido do menu
  
  // Configuração de Menu (array)
  menuConfig: [
    { id: "notificacoes", ordem: 0, visivel: true },
    { id: "relatorios-erro", ordem: 1, visivel: true },
    { id: "mensagens", ordem: 2, visivel: true },
    { id: "tarefas", ordem: 3, visivel: true },
    { id: "escala", ordem: 4, visivel: false },
    // ... outros itens
  ],
  
  // Datas
  dataCriacao: "2025-09-30T12:48:52.922Z",
  ultimoLogin: "2025-10-02T23:29:13.184Z"
}
```

## 📦 Arquivos Criados

### 1. **`src/constants/usuarioModel.js`**

Define o modelo padrão de usuário e funções utilitárias:

- `criarModeloUsuarioPadrao()` - Cria usuário com todos os campos
- `validarModeloUsuario()` - Valida se usuário tem todos os campos
- `atualizarMenuPorNivel()` - Configura menu baseado no nível
- `compararUsuarios()` - Compara dois usuários
- `MENU_CONFIG_PADRAO` - Configuração padrão do menu
- `STATUS_USUARIO` - Constantes de status

### 2. **`src/utils/migrarUsuariosNovoModelo.js`**

Script de migração com funções:

- `verificarStatusMigracaoUsuarios()` - Verifica quais usuários precisam migração
- `migrarUsuarioIndividual()` - Migra um usuário específico
- `executarMigracaoUsuarios()` - Executa migração em lote
- `reverterMigracao()` - Reverte mudanças se necessário

### 3. **`src/components/Admin/MigracaoUsuariosNovoModeloModal.jsx`**

Modal interativo com 4 etapas:

1. **Verificação** - Mostra estatísticas e campos faltando
2. **Confirmação** - Confirma antes de executar
3. **Executando** - Feedback visual durante processo
4. **Resultado** - Mostra estatísticas finais

### 4. **`src/services/statusUsuarioService.js`**

Serviço de gerenciamento de status online:

- `iniciar()` - Inicia monitoramento para usuário
- `parar()` - Para monitoramento
- `atualizarStatus()` - Atualiza status no Firestore
- `monitorarAtividade()` - Detecta atividade (mouse, teclado, scroll)
- `ouvirStatus()` - Listener em tempo real para status de outro usuário
- `calcularTempoDesdeUltimaVez()` - Formata tempo de inatividade

## 🎨 Interface de Migração

### Estatísticas Exibidas

- **Total de Usuários** - Quantidade total no sistema
- **Já Atualizados** - Usuários com modelo completo
- **Precisam Migração** - Usuários a serem atualizados
- **Campos Diferentes** - Quantidade de campos novos

### Campos Adicionados

- `status` - Status de presença
- `ultimaVez` - Timestamp de última atividade
- `itemFavorito` - Item preferido
- `menuConfig` - Configuração de menu

### Opções de Migração

✅ **Simular Migração** - Testa sem alterar dados  
✅ **Executar Migração** - Aplica mudanças no banco

## 🔧 Integração com Sistema

### 1. **Login**

Ao fazer login, o sistema:
- ✅ Inicia serviço de status automaticamente
- ✅ Define usuário como "online"
- ✅ Atualiza `ultimaVez` no Firestore

```javascript
// Em Workflow.jsx - função login
await statusUsuarioService.iniciar(usuarioEncontrado.id);
```

### 2. **Logout**

Ao fazer logout, o sistema:
- ✅ Para serviço de status
- ✅ Define usuário como "offline"
- ✅ Atualiza `ultimaVez` com timestamp final

```javascript
// Em Workflow.jsx - função logout
await statusUsuarioService.parar();
```

### 3. **Criação de Usuário**

Ao criar novo usuário:
- ✅ Usa `criarModeloUsuarioPadrao()` com todos os campos
- ✅ Configura `menuConfig` baseado no nível
- ✅ Define `status` inicial como "offline"

```javascript
// Em Workflow.jsx - função criarUsuario
const modeloUsuario = criarModeloUsuarioPadrao({...dadosUsuario});
modeloUsuario.menuConfig = atualizarMenuPorNivel(dadosUsuario.nivel);
```

## 🎯 Funcionalidades do Status Online

### Monitoramento Automático

- **Eventos detectados**: mousedown, keydown, scroll, touchstart, click
- **Tempo para ausente**: 5 minutos sem atividade
- **Atualização periódica**: A cada 30 segundos

### Estados Possíveis

```javascript
STATUS_USUARIO = {
  ONLINE: 'online',      // Usuário ativo
  OFFLINE: 'offline',    // Usuário desconectado
  AUSENTE: 'ausente',    // Sem atividade por 5+ minutos
  OCUPADO: 'ocupado'     // Definido manualmente
}
```

### Detecção de Saída

- ✅ `beforeunload` - Ao fechar/recarregar página
- ✅ `unload` - Backup para garantir atualização
- ✅ `visibilitychange` - Ao trocar de aba

## 📊 MenuConfig - Configuração de Menu

### Estrutura

Cada item do menu tem:

```javascript
{
  id: "tarefas",      // Identificador único
  ordem: 3,           // Posição no menu (0-14)
  visivel: true       // Visibilidade para o usuário
}
```

### Visibilidade por Nível

**Funcionário (nível 1)**:
- Notificações, Mensagens, Tarefas

**Supervisor (nível 2)**:
- + Escala, Ponto, Ranking

**Gerente (nível 3)**:
- + Inventário, Empréstimos, Funcionários, Feed

**Admin (nível 4)**:
- Todos os itens

### Personalização

Usuários podem personalizar:
- ✅ Ordem dos itens
- ✅ Visibilidade de cada item
- ✅ Item favorito (acesso rápido)

## 🚀 Como Usar

### 1. **Acessar Painel Administrativo**

1. Faça login como **Administrador**
2. Navegue até a aba **"Admin"** ou **"Sistema"**
3. Procure o botão **"Atualizar Modelo de Usuários"** (verde/teal)

### 2. **Verificar Status**

O modal abrirá automaticamente mostrando:
- Quantos usuários precisam migração
- Quais campos serão adicionados
- Lista de usuários a serem atualizados

### 3. **Opção 1: Simular**

Para testar sem alterar dados:
1. Clique em **"Simular Migração"**
2. Revise as mudanças que seriam feitas
3. Nenhum dado é alterado no banco

### 4. **Opção 2: Executar**

Para aplicar as mudanças:
1. Clique em **"Continuar"**
2. Confirme a migração
3. Clique em **"Executar Migração"**
4. Aguarde o processamento
5. Verifique os resultados

### 5. **Verificar Resultado**

O sistema mostra:
- ✅ Total processados
- ✅ Migrados com sucesso
- ✅ Já atualizados (pulados)
- ❌ Erros (se houver)

## 🔒 Segurança

### Preservação de Dados

- ✅ **Todos os dados existentes são preservados**
- ✅ **Apenas campos novos são adicionados**
- ✅ **Não sobrescreve campos existentes**
- ✅ **Possibilidade de reversão**

### Validação

Antes de migrar, o sistema valida:
- ✅ Presença de campos obrigatórios
- ✅ Tipo de dados correto
- ✅ Integridade de referências

### Logs Detalhados

Cada operação gera logs:
- 🔍 Verificação inicial
- 📊 Agrupamento por status
- 🔄 Migração individual
- ✅ Resultado final

## 📈 Performance

### Operações em Lote

- Usa `writeBatch` do Firestore
- Até 500 operações por batch
- Commit automático ao atingir limite

### Otimização

- ✅ Pula usuários já migrados
- ✅ Valida antes de processar
- ✅ Atualiza apenas campos necessários

## 🐛 Tratamento de Erros

### Durante Migração

Se houver erro em um usuário:
- ✅ Continua processando outros
- ✅ Registra erro específico
- ✅ Mostra no resultado final

### Recuperação

Se algo der errado:
- ✅ Use `reverterMigracao()` para voltar
- ✅ Remove apenas campos novos
- ✅ Preserva dados originais

## 🎓 Exemplos de Uso

### 1. Verificar se Precisa Migração

```javascript
import { verificarStatusMigracaoUsuarios } from './utils/migrarUsuariosNovoModelo';

const status = await verificarStatusMigracaoUsuarios();
console.log(`${status.estatisticas.precisamMigracao} usuários precisam migração`);
```

### 2. Migrar Programaticamente

```javascript
import { executarMigracaoUsuarios } from './utils/migrarUsuariosNovoModelo';

// Simular
const resultadoSim = await executarMigracaoUsuarios({ apenasSimular: true });

// Executar
const resultado = await executarMigracaoUsuarios();
console.log(`${resultado.resultados.sucesso} usuários migrados`);
```

### 3. Ouvir Status de Usuário

```javascript
import statusUsuarioService from './services/statusUsuarioService';

const unsubscribe = statusUsuarioService.ouvirStatus(
  'usuarioId123',
  ({ status, ultimaVez }) => {
    console.log(`Status: ${status}`);
    console.log(`Última vez: ${ultimaVez}`);
  }
);

// Para parar de ouvir
unsubscribe();
```

### 4. Calcular Tempo de Inatividade

```javascript
import statusUsuarioService from './services/statusUsuarioService';

const tempo = statusUsuarioService.calcularTempoDesdeUltimaVez(ultimaVez);
// Retorna: "5 minutos atrás", "2 horas atrás", etc.
```

## 🔄 Compatibilidade

### Usuários Existentes

- ✅ Funcionam normalmente antes da migração
- ✅ Ganham novos recursos após migração
- ✅ Nenhuma perda de dados

### Novos Usuários

- ✅ Criados automaticamente com modelo completo
- ✅ MenuConfig configurado pelo nível
- ✅ Status inicial como "offline"

## 📝 Próximos Passos

1. **Execute a migração** no painel admin
2. **Verifique os resultados** no console
3. **Teste o status online** fazendo login/logout
4. **Personalize menus** se desejar
5. **Monitore logs** para garantir funcionamento

## 🎉 Benefícios

### Para Usuários

- ✅ Status online visível
- ✅ Menu personalizado
- ✅ Acesso rápido a item favorito
- ✅ Experiência mais personalizada

### Para Administradores

- ✅ Visibilidade de usuários ativos
- ✅ Estatísticas de uso
- ✅ Controle granular de permissões
- ✅ Migração segura e auditável

### Para Desenvolvedores

- ✅ Modelo consistente
- ✅ Fácil manutenção
- ✅ Extensível para novos campos
- ✅ Bem documentado

---

✅ **Sistema completo de migração implementado e pronto para uso!**

**Acesse o Painel Admin → Clique em "Atualizar Modelo de Usuários" → Siga as instruções na tela!** 🚀
