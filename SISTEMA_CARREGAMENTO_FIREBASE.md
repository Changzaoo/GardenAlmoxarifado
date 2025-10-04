# 📦 Sistema de Carregamento de Usuários do Firebase

## 🎯 Visão Geral

O sistema agora carrega **todos os dados dos usuários** diretamente da coleção `usuarios` do Firebase, incluindo:

- ✅ Dados básicos (nome, email, nível)
- ✅ Senhas (criptografadas com SHA-512)
- ✅ Preferências do usuário
- ✅ Configuração de menu personalizado
- ✅ Dados adicionais (avatar, bio, telefone)

## 📊 Estrutura de Dados no Firebase

### Coleção: `usuarios`

```javascript
{
  // Dados básicos
  nome: "João Silva",
  email: "joao@empresa.com",
  nivel: 2, // 1=Funcionário, 2=Supervisor, 3=Gerente, 4=Admin
  ativo: true,
  
  // Senha criptografada (SHA-512)
  senhaHash: "abc123...",
  senhaSalt: "xyz789...",
  senhaVersion: 2,
  senhaAlgorithm: "sha512",
  senha: null, // Removido após migração
  
  // Vínculos
  empresaId: "empresa_123",
  setorId: "setor_456",
  cargoId: "cargo_789",
  
  // Timestamps
  dataCriacao: "2025-10-04T10:00:00.000Z",
  ultimoLogin: "2025-10-04T15:30:00.000Z",
  
  // Preferências
  preferencias: {
    tema: "dark",           // "light", "dark", "auto"
    notificacoes: true,     // Habilitar notificações
    sons: true,             // Sons do sistema
    idioma: "pt-BR",        // Idioma da interface
    emailNotificacoes: false // Notificações por email
  },
  
  // Menu personalizado
  menuConfig: [
    { id: "notificacoes", ordem: 0, visivel: true },
    { id: "mensagens", ordem: 1, visivel: true },
    { id: "tarefas", ordem: 2, visivel: false }
  ],
  menuPersonalizado: true,
  
  // Dados adicionais
  telefone: "(11) 98765-4321",
  avatar: "https://...",
  bio: "Gerente de TI"
}
```

## 🔄 Fluxo de Carregamento

### 1. Inicialização

```
App inicia
  ↓
Conecta com Firebase
  ↓
carregarUsuarios() é chamado
  ↓
Busca todos os documentos em /usuarios
  ↓
Mapeia e estrutura os dados
  ↓
Armazena em state 'usuarios'
  ↓
Se vazio, cria admin padrão
```

### 2. Sincronização em Tempo Real

```
Firebase Listener ativo
  ↓
Qualquer mudança em /usuarios
  ↓
Listener recebe atualização
  ↓
Atualiza state automaticamente
  ↓
Se usuário logado foi alterado
  ↓
Atualiza dados do usuário logado
```

## 🔧 Funções Disponíveis

### `carregarUsuarios()`

Carrega todos os usuários do Firebase.

```javascript
const usuarios = await carregarUsuarios();
// Retorna: Array de usuários com todos os dados
```

### `atualizarPreferenciasUsuario(userId, novasPreferencias)`

Atualiza preferências de um usuário.

```javascript
await atualizarPreferenciasUsuario('user_123', {
  tema: 'dark',
  notificacoes: false
});
```

**Permissões:**
- Usuário pode atualizar suas próprias preferências
- Admin pode atualizar preferências de qualquer usuário

### `atualizarMenuUsuario(userId, novoMenuConfig)`

Personaliza o menu de um usuário.

```javascript
await atualizarMenuUsuario('user_123', [
  { id: 'mensagens', ordem: 0, visivel: true },
  { id: 'tarefas', ordem: 1, visivel: true },
  { id: 'inventario', ordem: 2, visivel: false }
]);
```

**Permissões:**
- Usuário pode personalizar seu próprio menu
- Admin pode personalizar menu de qualquer usuário

### `atualizarUsuario(id, dadosAtualizados)`

Atualiza quaisquer dados do usuário.

```javascript
await atualizarUsuario('user_123', {
  nome: 'João Pedro Silva',
  telefone: '(11) 99999-8888',
  bio: 'Desenvolvedor Full Stack',
  senha: 'novaSenha123' // Será criptografada automaticamente
});
```

## 🎨 Exemplo de Uso: Atualizar Preferências

```javascript
import { useAuth } from './hooks/useAuth';

function SettingsPage() {
  const { usuario, atualizarPreferenciasUsuario } = useAuth();
  
  const alterarTema = async (novoTema) => {
    const resultado = await atualizarPreferenciasUsuario(usuario.id, {
      tema: novoTema
    });
    
    if (resultado.success) {
      console.log('✅ Tema atualizado!');
    }
  };
  
  return (
    <select onChange={(e) => alterarTema(e.target.value)}>
      <option value="light">Claro</option>
      <option value="dark">Escuro</option>
      <option value="auto">Automático</option>
    </select>
  );
}
```

## 🎨 Exemplo de Uso: Personalizar Menu

```javascript
import { useAuth } from './hooks/useAuth';

function MenuCustomizer() {
  const { usuario, atualizarMenuUsuario } = useAuth();
  
  const salvarMenu = async (menuConfig) => {
    const resultado = await atualizarMenuUsuario(usuario.id, menuConfig);
    
    if (resultado.success) {
      console.log('✅ Menu personalizado!');
    }
  };
  
  return (
    // Interface de personalização
    <MenuEditor onSave={salvarMenu} />
  );
}
```

## 🔐 Sistema de Senhas

### Migração Automática

Quando um usuário com senha em texto plano faz login:

1. Sistema verifica a senha
2. Se válida, criptografa com SHA-512
3. Salva hash e salt no Firebase
4. Remove senha em texto plano
5. Próximo login já usa versão criptografada

```javascript
// Antes (texto plano)
{
  senha: "123456"
}

// Depois (criptografada)
{
  senhaHash: "abc123...",
  senhaSalt: "xyz789...",
  senhaVersion: 2,
  senhaAlgorithm: "sha512",
  senha: null
}
```

### Criar Novo Usuário

```javascript
await criarUsuario({
  nome: "Maria Santos",
  email: "maria@empresa.com",
  senha: "senhaSegura123", // Será criptografada automaticamente
  nivel: NIVEIS_PERMISSAO.GERENTE,
  empresaId: "empresa_123",
  setorId: "setor_456"
});
```

## 📡 Sincronização em Tempo Real

O sistema usa **Firestore Realtime Listeners** para manter dados sincronizados:

### Vantagens:
- ✅ Atualização instantânea quando dados mudam
- ✅ Múltiplos dispositivos sincronizados
- ✅ Sem necessidade de recarregar página
- ✅ Otimizado para performance

### Como Funciona:

```javascript
// Listener é configurado automaticamente
onSnapshot(collection(db, 'usuarios'), (snapshot) => {
  // Executado em TODA mudança na coleção
  const usuariosAtualizados = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  
  setUsuarios(usuariosAtualizados);
});
```

### Eventos que Acionam:
- ➕ Novo usuário criado
- ✏️ Usuário atualizado
- 🗑️ Usuário removido
- 🔄 Preferências alteradas
- 🎨 Menu personalizado

## 🎯 Boas Práticas

### ✅ Faça:
- Use `atualizarPreferenciasUsuario()` para preferências
- Use `atualizarMenuUsuario()` para menu personalizado
- Use `atualizarUsuario()` para outros dados
- Confie no listener para sincronização automática

### ❌ Não Faça:
- Não modifique `usuarios` diretamente
- Não salve senhas em texto plano
- Não ignore erros das funções de atualização
- Não desabilite o listener sem necessidade

## 🔍 Debugging

### Ver usuários carregados:

```javascript
// No console do navegador
console.table(window.usuarios);
```

### Ver dados do usuário logado:

```javascript
console.log('Usuário:', window.usuario);
console.log('Preferências:', window.usuario?.preferencias);
console.log('Menu:', window.usuario?.menuConfig);
```

### Forçar recarregamento:

```javascript
// No código
await carregarUsuarios();
```

## 📊 Performance

### Otimizações Implementadas:
- ✅ Cache local via state
- ✅ Listener eficiente (apenas mudanças)
- ✅ Estrutura otimizada no Firebase
- ✅ Carregamento único na inicialização

### Métricas Esperadas:
- Carregamento inicial: ~500ms
- Atualização via listener: ~50ms
- Salvamento de preferências: ~200ms

## 🆘 Troubleshooting

### Usuários não carregam

**Verificar:**
```javascript
console.log('Firebase Status:', window.firebaseStatus);
console.log('Usuários carregados:', window.usuarios?.length);
```

**Solução:**
- Verificar conexão com Firebase
- Verificar permissões no Firestore Rules
- Limpar cache e recarregar

### Preferências não salvam

**Verificar:**
```javascript
const resultado = await atualizarPreferenciasUsuario(userId, prefs);
console.log('Resultado:', resultado);
```

**Possíveis causas:**
- Sem permissão
- Firebase offline
- Estrutura de dados incorreta

---

**Última atualização: 04/10/2025**
