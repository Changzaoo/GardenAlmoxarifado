# Sistema de Permissões por Setor - Documentação Completa

## 📋 Visão Geral

Sistema implementado para isolar dados por setor, permitindo que **Gerentes** e **Supervisores** vejam e gerenciem apenas os dados do seu próprio setor, enquanto **Administradores** continuam com acesso total a todos os setores.

---

## 🎯 Objetivo

Criar um sistema multi-setor onde cada setor gerencia seus próprios:
- ✅ Inventário
- ✅ Empréstimos
- ✅ Tarefas
- ✅ Funcionários
- ✅ Ranking
- ✅ Verificação Mensal
- ✅ Ferramentas Danificadas
- ✅ Ferramentas Perdidas
- ✅ Compras

---

## 🔐 Matriz de Permissões

| Nível | Nome | Visualização | Gerenciamento | Setor |
|-------|------|--------------|---------------|-------|
| **1** | Funcionário | Apenas visualizar | Não | Apenas seu setor |
| **2** | Supervisor | Ver + Gerenciar | Sim | Apenas seu setor |
| **3** | Gerente | Ver + Gerenciar | Sim | Apenas seu setor |
| **4** | Administrador | Ver + Gerenciar | Sim | **TODOS os setores** |

---

## 📁 Arquivos Criados/Modificados

### 1. **`src/constants/permissoes.js`** (EXPANDIDO)

Novas funções adicionadas:

```javascript
// Verifica se pode ver todos os setores
canViewAllSectors(nivel)

// Verifica se item pertence ao setor do usuário
itemBelongsToUserSector(itemSetorId, userSetorId)

// Filtra lista de itens por setor
filterBySector(items, usuario)

// Verifica se pode gerenciar item específico
canManageItem(nivel, itemSetorId, userSetorId)

// Verifica se pode criar em determinado setor
canCreateInSector(nivel, targetSetorId, userSetorId)
```

**Lógica de Filtro:**
```javascript
filterBySector: (items, usuario) => {
  // Admin vê tudo
  if (usuario.nivel === NIVEIS_PERMISSAO.ADMIN) {
    return items;
  }

  // Outros veem apenas do seu setor
  return items.filter(item => {
    // Compara setorId do item com setorId do usuário
    return item.setorId === usuario.setorId;
  });
}
```

---

### 2. **`src/hooks/useSectorPermissions.js`** (NOVO)

Hook personalizado para facilitar o uso de permissões por setor:

**Funções Disponíveis:**
```javascript
const {
  canViewAllSectors,        // bool - Se pode ver todos os setores
  canManageCurrentSector,   // bool - Se pode gerenciar seu setor
  userSetorId,              // string - ID do setor do usuário
  userSetorNome,            // string - Nome do setor
  userEmpresaId,            // string - ID da empresa
  userEmpresaNome,          // string - Nome da empresa
  filterBySector,           // function - Filtra array por setor
  canManageItem,            // function - Verifica se pode gerenciar item
  canCreateInSector,        // function - Verifica se pode criar em setor
  itemBelongsToUserSector,  // function - Verifica pertencimento
  getPermissionScope,       // function - Retorna mensagem descritiva
  usuario                   // object - Dados completos do usuário
} = useSectorPermissions();
```

**Hooks Especializados:**

```javascript
// Para inventário
const { inventario, totalItems, canViewAll, sectorName } = 
  useInventoryBySector(inventarioCompleto);

// Para funcionários
const { funcionarios, totalEmployees, canViewAll, sectorName } = 
  useEmployeesBySector(funcionariosCompletos);

// Para empréstimos
const { emprestimos, totalLoans, canViewAll, sectorName } = 
  useLoansBySector(emprestimosCompletos);

// Para tarefas
const { tarefas, totalTasks, canViewAll, sectorName } = 
  useTasksBySector(tarefasCompletas);
```

---

### 3. **`src/components/Inventario/InventarioTab.jsx`** (MODIFICADO)

**Antes:**
```javascript
// Mostrava TODO o inventário para todos
<ListaInventario inventario={inventario} />
```

**Depois:**
```javascript
// Filtra por setor
const { filterBySector, canViewAllSectors } = useSectorPermissions();
const inventarioFiltrado = useMemo(() => {
  return filterBySector(inventario);
}, [inventario, filterBySector]);

// Badge informativo
{!canViewAllSectors && (
  <div className="bg-blue-50 dark:bg-blue-900/20 ...">
    Visualizando apenas: {userSetorNome}
  </div>
)}

<ListaInventario inventario={inventarioFiltrado} />
```

---

### 4. **`src/components/common/Input.jsx`** (MELHORADO)

**Melhorias Implementadas:**

✅ **Ícones desaparecem ao digitar**
```javascript
const [isFocused, setIsFocused] = useState(false);
const [hasValue, setHasValue] = useState(false);
const showIcon = Icon && !isFocused && !hasValue;
```

✅ **Sem sobreposição de texto**
```javascript
className={`${showIcon ? 'pl-10' : 'pl-4'}`}
```

✅ **Animações suaves**
```javascript
className="transition-all duration-200"
```

---

### 5. **`src/components/Auth/LoginForm.jsx`** (MODIFICADO)

**Mudanças:**

❌ Removido:
```javascript
label="Email/Usuário"  // Label removido
label="Senha"           // Label removido
```

✅ Mantido apenas:
```javascript
<Input
  icon={User}
  placeholder="Digite seu usuário"
  // Sem label
/>
```

---

### 6. **`src/components/common/LoadingScreen.jsx`** (NOVO)

**Recursos:**

✅ **Barra de progresso real** (0% → 100%)
✅ **Etapas de carregamento:**
  - 20%: "Conectando ao banco de dados..."
  - 40%: "Carregando configurações..."
  - 60%: "Validando credenciais..."
  - 80%: "Carregando dados do usuário..."
  - 100%: "Preparando interface..."

✅ **Animações:**
  - Logo com pulse
  - Barra com gradiente shimmer
  - Spinner giratório
  - Transições suaves

```javascript
<div className="relative">
  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
    <div 
      style={{
        width: `${progress}%`,
        background: 'linear-gradient(90deg, #3b82f6 0%, #1d4ed8 50%, #3b82f6 100%)',
        animation: 'shimmer 2s infinite'
      }}
    />
  </div>
  <span className="text-lg font-bold text-blue-600">
    {progress}%
  </span>
</div>
```

---

## 🔄 Fluxo de Dados por Setor

### Exemplo: Carregamento de Inventário

```
1. Sistema carrega TODOS os itens do Firebase
   ↓
2. Identifica nível do usuário
   ↓
3a. SE Admin (nível 4):
    → Mostra TUDO (sem filtro)
   
3b. SE Gerente/Supervisor/Funcionário:
    → Aplica filtro por setorId
    → Mostra apenas: item.setorId === usuario.setorId
   ↓
4. Renderiza lista filtrada
```

### Código de Exemplo:

```javascript
// No componente
const InventarioTab = ({ inventario }) => {
  const { filterBySector, canViewAllSectors, userSetorNome } = 
    useSectorPermissions();

  // Aplicar filtro
  const inventarioFiltrado = useMemo(() => {
    return filterBySector(inventario);
  }, [inventario, filterBySector]);

  return (
    <>
      {/* Badge informativo */}
      {!canViewAllSectors && (
        <div>
          Visualizando apenas: {userSetorNome}
          ({inventarioFiltrado.length} itens)
        </div>
      )}

      {/* Lista filtrada */}
      <ListaInventario inventario={inventarioFiltrado} />
    </>
  );
};
```

---

## 🧪 Cenários de Teste

### ✅ Teste 1: Admin vê tudo
```javascript
// Usuário
{
  nome: "Admin",
  nivel: 4, // ADMIN
  setorId: "setor-ti",
  setorNome: "TI"
}

// Inventário Total: 100 itens (50 TI, 30 RH, 20 Vendas)
// Resultado: Vê 100 itens ✅
```

### ✅ Teste 2: Gerente vê apenas seu setor
```javascript
// Usuário
{
  nome: "João (Gerente)",
  nivel: 3, // GERENTE
  setorId: "setor-ti",
  setorNome: "TI"
}

// Inventário Total: 100 itens
// Resultado: Vê apenas 50 itens (do setor TI) ✅
```

### ✅ Teste 3: Supervisor vê apenas seu setor
```javascript
// Usuário
{
  nome: "Maria (Supervisora)",
  nivel: 2, // SUPERVISOR
  setorId: "setor-rh",
  setorNome: "RH"
}

// Inventário Total: 100 itens
// Resultado: Vê apenas 30 itens (do setor RH) ✅
```

### ✅ Teste 4: Funcionário vê apenas seu setor (readonly)
```javascript
// Usuário
{
  nome: "Pedro (Funcionário)",
  nivel: 1, // FUNCIONARIO
  setorId: "setor-vendas",
  setorNome: "Vendas"
}

// Inventário Total: 100 itens
// Resultado: Vê apenas 20 itens (do setor Vendas), mas não pode editar ✅
```

---

## 🎨 Interface Visual

### Badge de Setor (Não-Admin)
```
┌───────────────────────────────────────────────────┐
│ 🏢 Visualizando apenas: TI                        │
│    Você está visualizando apenas os itens do seu  │
│    setor (50 itens)                               │
└───────────────────────────────────────────────────┘
```

### Badge de Admin
```
┌───────────────────────────────────────────────────┐
│ 🛡️ Modo Administrador - Visualizando todos setores│
│    Total de 100 itens em todos os setores         │
└───────────────────────────────────────────────────┘
```

---

## 📊 Componentes a Aplicar

### ✅ Já Implementados:
- [x] Sistema de permissões (constantes)
- [x] Hook useSectorPermissions
- [x] InventarioTab com filtro por setor
- [x] Input melhorado (ícones desaparecem)
- [x] LoginForm sem labels
- [x] LoadingScreen com progresso real

### 🔲 Pendentes (próximos passos):
- [ ] EmprestimosTab
- [ ] TarefasTab
- [ ] RankingPontos
- [ ] VerificacaoMensalTab
- [ ] FerramentasDanificadasTab
- [ ] FerramentasPerdidasTab
- [ ] ComprasTab
- [ ] FuncionariosTab
- [ ] HistoricoEmprestimosTab
- [ ] HistoricoTransferenciasTab

---

## 💡 Como Aplicar a Outros Componentes

### Template Padrão:

```javascript
import { useSectorPermissions } from '../../hooks/useSectorPermissions';
import { Building2, Shield } from 'lucide-react';

const MeuComponente = ({ dados }) => {
  const { 
    filterBySector, 
    canViewAllSectors, 
    userSetorNome, 
    getPermissionScope 
  } = useSectorPermissions();

  const dadosFiltrados = useMemo(() => {
    return filterBySector(dados);
  }, [dados, filterBySector]);

  return (
    <>
      {/* Badge informativo */}
      {!canViewAllSectors && (
        <div className="bg-blue-50 dark:bg-blue-900/20 ...">
          <Building2 className="w-5 h-5" />
          <p>{getPermissionScope()}</p>
          <p>{dadosFiltrados.length} itens do setor</p>
        </div>
      )}

      {/* Conteúdo filtrado */}
      <MinhaLista dados={dadosFiltrados} />
    </>
  );
};
```

---

## ⚠️ Avisos Importantes

### 🔴 NÃO FAÇA:
❌ Não filtre dados no backend sem validar no frontend
❌ Não confie apenas no setorId do cliente
❌ Não permita bypass de permissões via URL
❌ Não exponha dados de outros setores na API

### ✅ FAÇA:
✅ Valide permissões tanto no frontend quanto backend
✅ Use o hook `useSectorPermissions` sempre
✅ Adicione badges informativos para usuários
✅ Teste com diferentes níveis de usuário
✅ Documente mudanças nos componentes

---

## 🔒 Segurança

### Camadas de Proteção:

1. **Frontend**: Filtragem por `useSectorPermissions`
2. **Backend**: Validação de `setorId` nas queries Firebase
3. **Firestore Rules**: Regras de segurança por setor
4. **Autenticação**: SHA-512 + validação de setor

### Exemplo de Firestore Rule:

```javascript
match /inventario/{itemId} {
  allow read: if request.auth != null && (
    // Admin vê tudo
    get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.nivel == 4 ||
    // Outros veem apenas do seu setor
    resource.data.setorId == get(/databases/$(database)/documents/usuarios/$(request.auth.uid)).data.setorId
  );
}
```

---

## 📈 Roadmap

### Fase 1: Core (✅ Completo)
- [x] Sistema de permissões
- [x] Hook personalizado
- [x] Inventário com filtro
- [x] Login melhorado
- [x] Loading screen

### Fase 2: Aplicação (🔄 Em Progresso)
- [ ] Empréstimos
- [ ] Tarefas
- [ ] Rankings
- [ ] Verificação Mensal

### Fase 3: Complementos
- [ ] Dashboard por setor
- [ ] Relatórios por setor
- [ ] Comparações inter-setores (apenas admin)

---

## 📝 Exemplo Completo

### Antes (Sem Filtro):
```javascript
const InventarioTab = ({ inventario }) => {
  return <ListaInventario inventario={inventario} />;
};
```

### Depois (Com Filtro por Setor):
```javascript
const InventarioTab = ({ inventario }) => {
  const { filterBySector, canViewAllSectors, userSetorNome } = 
    useSectorPermissions();

  const inventarioFiltrado = useMemo(() => {
    return filterBySector(inventario);
  }, [inventario, filterBySector]);

  return (
    <>
      {!canViewAllSectors ? (
        <Badge>
          Visualizando: {userSetorNome} ({inventarioFiltrado.length} itens)
        </Badge>
      ) : (
        <Badge admin>
          Modo Admin ({inventarioFiltrado.length} itens totais)
        </Badge>
      )}
      
      <ListaInventario inventario={inventarioFiltrado} />
    </>
  );
};
```

---

**Data da Implementação:** 02/10/2025  
**Versão:** 3.0  
**Status:** 🟢 Core Completo | 🟡 Aplicação em Progresso
