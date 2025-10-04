# 🔍 Visualização de Usuários na Página de Usuários do Sistema

## 📋 Problema Identificado

Os usuários cadastrados na coleção `usuario` do Firestore não estavam aparecendo corretamente na **Página de Usuários do Sistema** porque:

1. Os dados não estavam sendo **enriquecidos** com os nomes de empresa e setor
2. A página agrupa usuários por empresa/setor, então usuários sem esses dados não apareciam organizados

## ✅ Solução Implementada

### 1. **Enriquecimento Automático no Listener de Usuários**

**Arquivo**: `src/components/Workflow.jsx` - Linha ~443

Agora quando os usuários são carregados em tempo real, o sistema:
- Busca automaticamente todas as empresas e setores
- Cria mapas de IDs → Nomes
- Enriquece cada usuário com `empresaNome` e `setorNome`

```javascript
// Listener em tempo real para usuários no Firebase
useEffect(() => {
  let unsubscribe = null;
  
  const setupFirebaseListener = () => {
    try {
      unsubscribe = onSnapshot(collection(db, 'usuario'), async (snapshot) => {
        const usuariosCarregados = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        }));
        
        // ✅ NOVO: Enriquecer usuários com nomes de empresa e setor
        try {
          const empresasSnapshot = await getDocs(collection(db, 'empresas'));
          const empresasMap = {};
          empresasSnapshot.docs.forEach(doc => {
            empresasMap[doc.id] = doc.data().nome;
          });
          
          const setoresSnapshot = await getDocs(collection(db, 'setores'));
          const setoresMap = {};
          setoresSnapshot.docs.forEach(doc => {
            setoresMap[doc.id] = doc.data().nome;
          });
          
          // Adicionar nomes de empresa e setor aos usuários
          const usuariosEnriquecidos = usuariosCarregados.map(usuario => ({
            ...usuario,
            empresaNome: usuario.empresaNome || (usuario.empresaId && empresasMap[usuario.empresaId]) || '',
            setorNome: usuario.setorNome || (usuario.setorId && setoresMap[usuario.setorId]) || ''
          }));
          
          setUsuarios(usuariosEnriquecidos);
        } catch (error) {
          console.error('Erro ao enriquecer dados dos usuários:', error);
          setUsuarios(usuariosCarregados);
        }
        
        // Se não houver usuários, criar usuário admin padrão
        if (usuariosCarregados.length === 0) {
          await criarUsuarioAdmin();
        }
      });
    } catch (error) {
      console.error('Erro ao configurar listener:', error);
    }
  };
  
  if (firebaseStatus === 'connected') {
    setupFirebaseListener();
  }
  
  return () => {
    if (unsubscribe) unsubscribe();
  };
}, [firebaseStatus]);
```

### 2. **Enriquecimento na Função `carregarUsuarios`**

**Arquivo**: `src/components/Workflow.jsx` - Linha ~659

A função de carregamento manual também foi atualizada com o mesmo processo de enriquecimento.

### 3. **Enriquecimento ao Criar Novo Usuário**

**Arquivo**: `src/components/Workflow.jsx` - Linha ~1046

Quando um novo usuário é criado:
- Busca o nome da empresa (se `empresaId` fornecido)
- Busca o nome do setor (se `setorId` fornecido)
- Salva os nomes junto com os IDs no documento

```javascript
const criarUsuario = async (dadosUsuario) => {
  // ... validações ...
  
  // ✅ NOVO: Buscar nomes de empresa e setor
  let empresaNome = dadosUsuario.empresaNome || '';
  let setorNome = dadosUsuario.setorNome || '';
  
  try {
    if (dadosUsuario.empresaId && !empresaNome) {
      const empresaDoc = await getDoc(doc(db, 'empresas', dadosUsuario.empresaId));
      if (empresaDoc.exists()) {
        empresaNome = empresaDoc.data().nome;
      }
    }
    
    if (dadosUsuario.setorId && !setorNome) {
      const setorDoc = await getDoc(doc(db, 'setores', dadosUsuario.setorId));
      if (setorDoc.exists()) {
        setorNome = setorDoc.data().nome;
      }
    }
  } catch (error) {
    console.error('Erro ao buscar nomes de empresa/setor:', error);
  }
  
  const novoUsuario = {
    ...dadosUsuario,
    empresaNome,  // ✅ Salva o nome
    setorNome,    // ✅ Salva o nome
    // ... resto dos dados ...
  };
  
  // Salvar no Firestore
  const docRef = await addDoc(collection(db, 'usuario'), novoUsuario);
  // ...
};
```

### 4. **Enriquecimento ao Atualizar Usuário**

**Arquivo**: `src/components/Workflow.jsx` - Linha ~1085

Quando um usuário é editado e a empresa/setor mudam:
- Busca os novos nomes automaticamente
- Atualiza os campos `empresaNome` e `setorNome`

```javascript
const atualizarUsuario = async (id, dadosAtualizados) => {
  // ... validações ...
  
  // ✅ NOVO: Buscar nomes se IDs foram alterados
  if (dadosAtualizados.empresaId !== undefined) {
    try {
      if (dadosAtualizados.empresaId) {
        const empresaDoc = await getDoc(doc(db, 'empresas', dadosAtualizados.empresaId));
        if (empresaDoc.exists()) {
          dadosAtualizados.empresaNome = empresaDoc.data().nome;
        }
      } else {
        dadosAtualizados.empresaNome = '';
      }
    } catch (error) {
      console.error('Erro ao buscar nome da empresa:', error);
    }
  }
  
  if (dadosAtualizados.setorId !== undefined) {
    try {
      if (dadosAtualizados.setorId) {
        const setorDoc = await getDoc(doc(db, 'setores', dadosAtualizados.setorId));
        if (setorDoc.exists()) {
          dadosAtualizados.setorNome = setorDoc.data().nome;
        }
      } else {
        dadosAtualizados.setorNome = '';
      }
    } catch (error) {
      console.error('Erro ao buscar nome do setor:', error);
    }
  }
  
  // Atualizar no Firestore
  await updateDoc(doc(db, 'usuario', id), dadosAtualizados);
  // ...
};
```

## 📊 Estrutura de Dados dos Usuários

### Antes (Apenas IDs)
```javascript
{
  id: "abc123",
  nome: "João Silva",
  email: "joao.silva",
  empresaId: "empresa_xyz",
  setorId: "setor_abc"
}
```

### Depois (IDs + Nomes)
```javascript
{
  id: "abc123",
  nome: "João Silva",
  email: "joao.silva",
  empresaId: "empresa_xyz",
  empresaNome: "Zendaya",          // ✅ NOVO
  setorId: "setor_abc",
  setorNome: "Jardim"              // ✅ NOVO
}
```

## 🎯 Como a Página de Usuários Usa os Dados

**Arquivo**: `src/components/usuarios/UsuariosTab.jsx`

A página agrupa usuários por empresa e setor:

```javascript
// Agrupar usuários por empresa e setor
const usuariosAgrupados = usuariosVisiveis.reduce((acc, usuario) => {
  const empresaKey = usuario.empresaNome || 'Sem Empresa';  // ✅ USA empresaNome
  const setorKey = usuario.setorNome || 'Sem Setor';        // ✅ USA setorNome
  
  if (!acc[empresaKey]) {
    acc[empresaKey] = {};
  }
  
  if (!acc[empresaKey][setorKey]) {
    acc[empresaKey][setorKey] = [];
  }
  
  acc[empresaKey][setorKey].push(usuario);
  
  return acc;
}, {});
```

## ✨ Benefícios

1. **Visualização Completa**: Todos os usuários aparecem organizados na página
2. **Performance**: Dados enriquecidos em memória, sem queries extras na UI
3. **Consistência**: Nomes sempre sincronizados ao criar/editar
4. **Agrupamento**: Usuários organizados por empresa/setor automaticamente
5. **Busca Melhorada**: Possível buscar por nome de empresa/setor

## 🔄 Compatibilidade

- ✅ **Usuários Antigos**: São enriquecidos automaticamente no carregamento
- ✅ **Usuários Novos**: Já são salvos com os nomes enriquecidos
- ✅ **Exportação**: O script de exportação já salva com nomes enriquecidos
- ✅ **Migração**: O sistema de migração preserva os nomes se existirem

## 📝 Notas Importantes

1. **Sem Empresa/Setor**: Usuários sem empresa/setor aparecem no grupo "Sem Empresa" / "Sem Setor"
2. **Admin**: Administradores podem não ter empresa/setor atribuídos
3. **Tempo Real**: Mudanças em empresas/setores são refletidas ao recarregar
4. **Cache**: Os nomes são armazenados no documento, evitando queries extras

## 🚀 Próximos Passos (Opcional)

Se você quiser atualizar usuários existentes que não têm os nomes:

1. Acesse o **Painel Administrativo**
2. Clique em **"Sincronizar Funcionários"**
3. Isso irá enriquecer todos os usuários com os nomes de empresa/setor

---

✅ **Todos os usuários da coleção `usuario` agora aparecem corretamente na Página de Usuários do Sistema!**
