# 🔧 CORREÇÃO - Erro Firestore "Unsupported field value: undefined"

## 🐛 Problema Identificado

### Erro Original
```
ERROR
Function where() called with invalid data. Unsupported field value: undefined
FirebaseError: Function where() called with invalid data. Unsupported field value: undefined
```

### Causa Raiz
O erro ocorria quando o sistema tentava fazer queries no Firestore usando valores `undefined`:

```javascript
// ❌ ANTES (causava erro)
where('empresaId', '==', usuario.empresaId)  // usuario.empresaId pode ser undefined
where('setorId', '==', usuario.setorId)      // usuario.setorId pode ser undefined
```

### Cenários Problemáticos
1. **Usuário não carregado ainda** - `usuario` é `undefined`
2. **Dados incompletos** - Usuário existe mas não tem `empresaId` ou `setorId`
3. **Novo usuário** - Cadastro ainda não foi completado pelo admin

---

## ✅ Solução Implementada

### 1. Validações nos useEffect (MensagensTab.jsx)

#### Carregamento de Funcionários
```javascript
// ✅ DEPOIS (com validação)
useEffect(() => {
  // Verificar se usuário existe
  if (!usuario?.id) {
    console.log('MensagensTab: Usuário não definido');
    return;
  }

  // Verificar se tem empresaId e setorId
  if (!usuario.empresaId || !usuario.setorId) {
    console.warn('MensagensTab: Usuário sem empresaId ou setorId', usuario);
    setFuncionarios([]);
    return;
  }

  // Agora é seguro fazer a query
  const q = query(
    collection(db, 'funcionarios'),
    where('empresaId', '==', usuario.empresaId),
    where('setorId', '==', usuario.setorId)
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const funcs = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(f => f.id !== usuario.id);
    setFuncionarios(funcs);
  }, (error) => {
    // Tratamento de erro
    console.error('Erro ao carregar funcionários:', error);
    setFuncionarios([]);
  });

  return () => unsubscribe();
}, [usuario]);
```

#### Carregamento de Conversas
```javascript
// ✅ Validação antes da query
useEffect(() => {
  if (!usuario?.id) {
    console.log('MensagensTab: Aguardando usuário para carregar conversas');
    setCarregando(false);
    return;
  }

  // Query só executa se usuario.id existe
  const q = query(
    collection(db, 'conversas'),
    where('participantes', 'array-contains', usuario.id),
    orderBy('ultimaAtualizacao', 'desc')
  );

  // ... resto do código
}, [usuario]);
```

### 2. Interface de Aviso (MensagensTab.jsx)

#### Loading State
```javascript
// Se usuário ainda não carregou
if (!usuario) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="text-gray-600 dark:text-gray-400">Carregando...</p>
      </div>
    </div>
  );
}
```

#### Configuração Incompleta
```javascript
// Se usuário não tem empresa/setor
if (!usuario.empresaId || !usuario.setorId) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-bold mb-2">Configuração Incompleta</h3>
        <p className="text-gray-600 mb-4">
          Para usar o sistema de mensagens, você precisa estar vinculado 
          a uma empresa e setor.
        </p>
        <p className="text-sm text-gray-500">
          Entre em contato com o administrador para completar seu cadastro.
        </p>
      </div>
    </div>
  );
}
```

### 3. Tratamento de Erro nas Queries (ChatArea.jsx)

```javascript
// ✅ Callback de erro no onSnapshot
const unsubscribe = onSnapshot(q, (snapshot) => {
  // Sucesso
  const msgs = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  setMensagens(msgs);
  setCarregando(false);
}, (error) => {
  // Erro - não quebra a aplicação
  console.error('Erro ao carregar mensagens:', error);
  setMensagens([]);
  setCarregando(false);
});
```

---

## 📋 Checklist de Validação

### Antes de Fazer Query no Firestore

- [ ] ✅ Verificar se `usuario` não é `undefined`
- [ ] ✅ Verificar se `usuario.id` existe
- [ ] ✅ Verificar se campos necessários existem (`empresaId`, `setorId`)
- [ ] ✅ Adicionar tratamento de erro no `onSnapshot`
- [ ] ✅ Mostrar interface adequada para cada estado

### Estados a Considerar

1. **Loading** - Usuário ainda carregando
2. **Incompleto** - Usuário sem dados necessários
3. **Vazio** - Nenhuma conversa/mensagem
4. **Erro** - Falha na query
5. **Sucesso** - Dados carregados

---

## 🔍 Como Reproduzir (para testar correção)

### Teste 1: Usuário Novo
1. Criar novo usuário sem empresaId/setorId
2. Acessar aba "Mensagens"
3. **Resultado esperado**: Mensagem "Configuração Incompleta"

### Teste 2: Loading
1. Limpar cache do navegador
2. Fazer login
3. Clicar rapidamente em "Mensagens"
4. **Resultado esperado**: Spinner de loading

### Teste 3: Usuário Completo
1. Usuário com empresaId e setorId
2. Acessar "Mensagens"
3. **Resultado esperado**: Sistema funciona normalmente

---

## 🛡️ Boas Práticas Aplicadas

### 1. Defensive Programming
```javascript
// Sempre use optional chaining
if (!usuario?.id) return;
if (!usuario?.empresaId || !usuario?.setorId) return;
```

### 2. Early Return
```javascript
// Retorne cedo se condições não forem atendidas
if (!usuario) return <LoadingComponent />;
if (!usuario.empresaId) return <WarningComponent />;
// Código principal só executa se tudo estiver OK
```

### 3. Error Callbacks
```javascript
// Sempre adicione callback de erro
onSnapshot(query, 
  (snapshot) => { /* sucesso */ },
  (error) => { /* erro */ }
);
```

### 4. Fallback Values
```javascript
// Use valores padrão seguros
setFuncionarios([]);  // Array vazio em vez de undefined
setMensagens([]);     // Array vazio em vez de undefined
```

### 5. Console Logs para Debug
```javascript
// Logs informativos (não errors) para desenvolvimento
console.log('MensagensTab: Usuário não definido');
console.warn('MensagensTab: Usuário sem empresaId ou setorId', usuario);
```

---

## 📊 Impacto da Correção

### Antes ❌
- ❌ Erro crítico ao abrir Mensagens
- ❌ App quebrava para usuários novos
- ❌ Experiência ruim para usuário
- ❌ Difícil identificar problema

### Depois ✅
- ✅ Sem erros no console
- ✅ Funciona para todos os tipos de usuário
- ✅ Mensagens claras e amigáveis
- ✅ Fácil debug com logs

---

## 🔄 Arquivos Modificados

### 1. MensagensTab.jsx
- ✅ Validação em `useEffect` de funcionários
- ✅ Validação em `useEffect` de conversas
- ✅ Componente de loading
- ✅ Componente de configuração incompleta
- ✅ Tratamento de erro em callbacks

### 2. ChatArea.jsx
- ✅ Validação em `useEffect` de mensagens
- ✅ Tratamento de erro em callbacks
- ✅ Logs informativos

---

## 🎯 Próximos Passos (Recomendações)

### 1. Melhorar Cadastro de Usuários
- Garantir que `empresaId` e `setorId` sejam obrigatórios
- Validar na criação do usuário
- Não permitir login sem dados completos

### 2. Adicionar Validação Global
```javascript
// Hook customizado para validar usuário
const useValidatedUser = () => {
  const { usuario } = useAuth();
  
  if (!usuario) return { isValid: false, reason: 'loading' };
  if (!usuario.empresaId || !usuario.setorId) {
    return { isValid: false, reason: 'incomplete' };
  }
  
  return { isValid: true, usuario };
};
```

### 3. Página de Configuração
- Criar página para usuário completar cadastro
- Redirecionar automaticamente se incompleto
- Wizard de onboarding

---

## 📚 Referências

- [Firestore Query Operators](https://firebase.google.com/docs/firestore/query-data/queries)
- [JavaScript Optional Chaining](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining)
- [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)

---

## ✅ Status

**Problema**: ❌ RESOLVIDO  
**Data**: 4 de outubro de 2025  
**Impacto**: 🟢 BAIXO (correção preventiva)  
**Testes**: ✅ PASSANDO

---

**Sistema de mensagens agora é robusto e à prova de erros! 🛡️**
