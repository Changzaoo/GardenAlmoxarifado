# Correção de Mensagens e Notificações

## Resumo das Implementações

Este documento descreve as correções e novas funcionalidades implementadas no sistema de mensagens.

---

## 1. ✅ Correção: Notificações não lidas ao clicar na conversa

### Problema
Quando o usuário clicava em uma conversa, o contador de mensagens não lidas não era zerado.

### Solução
- Adicionado alias `markAsRead()` no `mensagensService.js` para manter compatibilidade
- A função `marcarComoLidas()` agora é chamada automaticamente quando mensagens são carregadas
- O contador é zerado no Firestore via batch update

### Arquivos Modificados
- `src/services/mensagensService.js` - Adicionado método `markAsRead()`
- `src/hooks/useMensagens.js` - Função já estava implementada corretamente

---

## 2. ✅ Novo: Nome do participante no cabeçalho

### Implementação
Adicionada funcionalidade para buscar e exibir o nome real do outro participante na conversa.

### Mudanças
1. **mensagensService.js**
   - Nova função: `getUserInfo(userId)` - Busca informações do usuário no Firestore

2. **useMensagens.js**
   - Nova função: `buscarInfoParticipante(participanteId)` - Wrapper para buscar info
   - Exportada no retorno do hook

3. **JanelaChat.jsx**
   - Novo estado: `nomeParticipante`
   - Nova função: `carregarNomeParticipante()` - Carrega nome ao abrir conversa
   - Header atualizado para mostrar nome real ao invés de apenas primeira letra

### Como Funciona
1. Ao selecionar uma conversa, `JanelaChat` identifica o outro participante
2. Busca informações do usuário no Firestore
3. Exibe o nome completo no cabeçalho da conversa

---

## 3. ✅ Novo: Opção "Apagar para mim"

### Implementação
Permite que o usuário apague mensagens apenas para si, mantendo-as visíveis para outros participantes.

### Como Funciona
1. **mensagensService.js**
   - Nova função: `deleteMessageForMe(conversaId, mensagemId, userId)`
   - Adiciona o `userId` ao array `deletadaPara` da mensagem
   - Não remove a mensagem do Firestore

2. **useMensagens.js**
   - Nova função: `apagarParaMim(conversaId, mensagemId)`
   - Chama o serviço e exibe toast de confirmação

3. **JanelaChat.jsx**
   - Filtra mensagens onde `msg.deletadaPara?.includes(conversa.userId)`
   - Mensagens apagadas não são exibidas para o usuário que apagou

4. **BolhaMensagem.jsx**
   - Nova prop: `onDeleteForMe`
   - Menu dropdown com opção "Apagar para mim"

### Estrutura no Firestore
```javascript
{
  id: "msg123",
  texto: "Olá!",
  remetenteId: "user1",
  deletadaPara: ["user2"], // Usuário que apagou para si
  // ... outros campos
}
```

---

## 4. ✅ Novo: Opção "Apagar para todos"

### Implementação
Permite que o remetente apague a mensagem para todos os participantes da conversa.

### Como Funciona
1. **mensagensService.js**
   - Nova função: `deleteMessageForEveryone(conversaId, mensagemId, userId)`
   - Verifica se usuário é o remetente (somente remetente pode apagar para todos)
   - Marca mensagem com flags:
     - `deletada: true`
     - `deletadaParaTodos: true`
     - `texto: "Esta mensagem foi apagada"`
     - `deletadaEm: timestamp`

2. **useMensagens.js**
   - Nova função: `apagarParaTodos(conversaId, mensagemId)`
   - Chama o serviço com validação de erro

3. **JanelaChat.jsx**
   - Mensagens deletadas são renderizadas com texto padrão
   - Confirmação antes de apagar

4. **BolhaMensagem.jsx**
   - Nova prop: `onDeleteForEveryone`
   - Menu dropdown com opção "Apagar para todos" (apenas para mensagens próprias)
   - Renderização especial para mensagens deletadas

### Restrições
- ⚠️ **Apenas o remetente** pode apagar para todos
- Se outro usuário tentar, recebe erro: "Apenas o remetente pode apagar para todos"

### Estrutura no Firestore
```javascript
{
  id: "msg123",
  deletada: true,
  deletadaParaTodos: true,
  texto: "Esta mensagem foi apagada",
  deletadaEm: Timestamp,
  // ... outros campos originais mantidos
}
```

---

## 5. ✅ Novo: Menu Dropdown de Opções

### Implementação
Menu interativo que aparece ao passar o mouse sobre as mensagens.

### Características
- **Aparece no hover** - Menu exibido ao passar mouse na mensagem
- **Posicionamento inteligente** - Lado esquerdo para mensagens próprias, direito para dos outros
- **Opções contextuais**:
  - ✏️ **Editar** - Apenas para mensagens de texto próprias
  - 🗑️ **Menu de deleção** (dropdown):
    - "Apagar para mim" - Disponível para todas as mensagens
    - "Apagar para todos" - Apenas para mensagens próprias

### Visual
```
┌─────────────────────┐
│  ✏️ Editar          │
│  🗑️ Apagar ▼        │
│    ├─ Apagar p/ mim │
│    └─ Apagar p/ todos│
└─────────────────────┘
```

---

## Fluxo Completo

### Cenário 1: Usuário A apaga mensagem para si
1. Usuário A clica em "Apagar para mim"
2. Sistema adiciona ID de A ao array `deletadaPara` da mensagem
3. Mensagem desaparece apenas para A
4. Usuário B continua vendo a mensagem normalmente

### Cenário 2: Usuário A apaga mensagem para todos
1. Usuário A (remetente) clica em "Apagar para todos"
2. Sistema valida que A é o remetente
3. Marca mensagem como `deletada: true` e `deletadaParaTodos: true`
4. Todos os participantes veem "Esta mensagem foi apagada"

### Cenário 3: Abrindo conversa com mensagens não lidas
1. Usuário clica na conversa (badge mostrando "3" mensagens não lidas)
2. `selecionarConversa()` é chamada
3. Listener carrega mensagens
4. Mensagens não lidas são identificadas
5. `marcarComoLidas()` é chamada automaticamente
6. Contador no Firestore é zerado: `participantesInfo.{userId}.naoLidas: 0`
7. Badge de notificação desaparece

---

## Arquivos Modificados

### Serviços
- ✅ `src/services/mensagensService.js`
  - `markAsRead()` - Alias para compatibilidade
  - `deleteMessageForMe()` - Nova função
  - `deleteMessageForEveryone()` - Nova função
  - `getUserInfo()` - Nova função

### Hooks
- ✅ `src/hooks/useMensagens.js`
  - `apagarParaMim()` - Nova função
  - `apagarParaTodos()` - Nova função
  - `buscarInfoParticipante()` - Nova função
  - Exportadas no retorno do hook

### Componentes
- ✅ `src/components/Mensagens/MensagensMain.jsx`
  - Recebe e passa novas props para JanelaChat

- ✅ `src/components/Mensagens/JanelaChat.jsx`
  - Estado `nomeParticipante`
  - Função `carregarNomeParticipante()`
  - Filtro de mensagens por `deletadaPara`
  - Passa callbacks para BolhaMensagem

- ✅ `src/components/Mensagens/BolhaMensagem.jsx`
  - Props: `onDeleteForMe`, `onDeleteForEveryone`
  - Estado: `showDeleteMenu`
  - Menu dropdown interativo
  - Confirmações antes de apagar

---

## Testes Recomendados

### Teste 1: Notificações não lidas
1. ✅ Enviar mensagem de Usuário B para Usuário A
2. ✅ Verificar badge de notificação em A
3. ✅ Clicar na conversa
4. ✅ Verificar se badge desaparece

### Teste 2: Nome do participante
1. ✅ Abrir conversa privada
2. ✅ Verificar se nome completo aparece no cabeçalho
3. ✅ Não deve mostrar apenas primeira letra

### Teste 3: Apagar para mim
1. ✅ Enviar mensagem
2. ✅ Clicar em "Apagar para mim"
3. ✅ Verificar se mensagem desaparece
4. ✅ Outro usuário deve continuar vendo

### Teste 4: Apagar para todos
1. ✅ Enviar mensagem
2. ✅ Clicar em "Apagar para todos"
3. ✅ Verificar se todos veem "Esta mensagem foi apagada"
4. ✅ Tentar apagar mensagem de outro usuário (deve dar erro)

---

## Possíveis Melhorias Futuras

1. **Notificações Push**
   - Integrar com sistema de push notifications quando mensagem chega

2. **Indicador de digitação**
   - Mostrar "Usuário está digitando..." em tempo real

3. **Confirmação visual**
   - Animação ao apagar mensagem
   - Feedback visual mais rico

4. **Histórico de deleções**
   - Log de quem apagou mensagens e quando

5. **Recuperação de mensagens**
   - Opção de "desfazer" logo após apagar

---

## Notas Técnicas

### Firestore Security Rules
Certifique-se de que as regras do Firestore permitem:
```javascript
// Permitir que usuário adicione seu ID ao deletadaPara
allow update: if request.auth.uid in resource.data.participantes &&
  request.resource.data.deletadaPara is list;

// Permitir que remetente apague para todos
allow update: if request.auth.uid == resource.data.remetenteId &&
  request.resource.data.deletadaParaTodos == true;
```

### Performance
- Mensagens são filtradas no cliente (não no Firestore)
- Para conversas muito longas, considerar paginação melhorada
- Cache local pode ser implementado para melhorar desempenho

---

## Conclusão

Todas as funcionalidades solicitadas foram implementadas com sucesso:
- ✅ Notificações não lidas são zeradas ao abrir conversa
- ✅ Nome do participante é exibido no cabeçalho
- ✅ Opção "Apagar para mim" funcional
- ✅ Opção "Apagar para todos" funcional
- ✅ Menu dropdown interativo com todas as opções

O sistema está pronto para uso! 🎉
