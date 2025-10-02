# Sistema Multi-Empresas e Setores

## 📋 Visão Geral

Este sistema permite gerenciar múltiplas empresas e seus respectivos setores, com funcionários vinculados a empresas e setores específicos.

## 🏗️ Estrutura do Firestore

### Coleções Criadas

#### 1. `empresas`
Armazena informações das empresas cadastradas.

**Campos:**
```javascript
{
  nome: string,              // Nome da empresa
  cnpj: string,              // CNPJ (opcional)
  endereco: string,          // Endereço (opcional)
  telefone: string,          // Telefone (opcional)
  email: string,             // E-mail (opcional)
  ativo: boolean,            // Status ativo/inativo
  dataCriacao: timestamp,    // Data de criação
  dataAtualizacao: timestamp // Última atualização
}
```

#### 2. `setores`
Armazena os setores de cada empresa.

**Campos:**
```javascript
{
  nome: string,              // Nome do setor (ex: RH, TI, Produção)
  empresaId: string,         // ID da empresa (referência)
  empresaNome: string,       // Nome da empresa (desnormalizado)
  descricao: string,         // Descrição do setor (opcional)
  responsavel: string,       // Nome do responsável (opcional)
  ativo: boolean,            // Status ativo/inativo
  dataCriacao: timestamp,    // Data de criação
  dataAtualizacao: timestamp // Última atualização
}
```

#### 3. Atualização em `funcionarios` e `usuarios`
Campos adicionados:

```javascript
{
  empresaId: string,         // ID da empresa
  empresaNome: string,       // Nome da empresa
  setorId: string,           // ID do setor
  setorNome: string,         // Nome do setor
  // ... outros campos existentes
}
```

## 🎨 Componentes Criados

### 1. CadastroEmpresas (`src/components/Empresas/CadastroEmpresas.jsx`)

**Funcionalidades:**
- ✅ Cadastrar novas empresas
- ✅ Editar empresas existentes
- ✅ Excluir empresas
- ✅ Ativar/desativar empresas
- ✅ Listagem com filtros
- ✅ Validação de campos obrigatórios

**Permissão:** Apenas **Admin** (nível 3)

**Campos do Formulário:**
- Nome da Empresa (obrigatório)
- CNPJ
- Endereço
- Telefone
- E-mail
- Status (Ativo/Inativo)

---

### 2. CadastroSetores (`src/components/Setores/CadastroSetores.jsx`)

**Funcionalidades:**
- ✅ Cadastrar novos setores
- ✅ Editar setores existentes
- ✅ Excluir setores
- ✅ Ativar/desativar setores
- ✅ Filtrar setores por empresa
- ✅ Validação de campos obrigatórios

**Permissão:** Apenas **Admin** (nível 3)

**Campos do Formulário:**
- Empresa (obrigatório)
- Nome do Setor (obrigatório)
- Descrição
- Responsável
- Status (Ativo/Inativo)

---

### 3. FormularioAdicao Atualizado (`src/components/Funcionarios/components/FormularioAdicao.jsx`)

**Novos Campos:**
- ✅ Seleção de Empresa (obrigatório)
- ✅ Seleção de Setor (obrigatório)
- ✅ Filtro automático: setores são filtrados pela empresa selecionada

**Campos Existentes:**
- Nome
- Cargo
- Telefone

**Comportamento:**
- Ao selecionar uma empresa, apenas os setores dessa empresa aparecem no dropdown de setores
- Ao trocar de empresa, o setor selecionado é resetado

---

### 4. ProfileTab Atualizado (`src/components/Profile/ProfileTab.jsx`)

**Exibição no Perfil:**
- ✅ Nome da empresa com ícone 🏢 (Building2)
- ✅ Nome do setor com ícone 💼 (Briefcase)

---

## 🔐 Níveis de Permissão

| Nível | Nome       | Empresas | Setores | Cadastrar Funcionários |
|-------|------------|----------|---------|------------------------|
| 1     | Funcionário| ❌       | ❌      | ❌                     |
| 2     | Supervisor | ❌       | ❌      | ✅ (com empresa/setor) |
| 3     | Admin      | ✅       | ✅      | ✅ (com empresa/setor) |

## 📱 Navegação

As novas abas foram adicionadas ao menu principal do Workflow:

- **Empresas**: Gerenciar empresas (Admin)
- **Setores**: Gerenciar setores (Admin)

**Posição no Menu:**
```
Meu Perfil
Ranking
Notificações
Tarefas
Inventário
Empréstimos
Funcionários
├─ Empresas (novo) 🏢
├─ Setores (novo) 💼
Compras
Verificação Mensal
Danificadas
Perdidas
```

## 🎯 Fluxo de Uso

### Para Administradores:

1. **Cadastrar Empresa**
   - Acessar aba "Empresas"
   - Clicar em "Cadastrar Empresa"
   - Preencher dados (nome é obrigatório)
   - Salvar

2. **Cadastrar Setores**
   - Acessar aba "Setores"
   - Selecionar a empresa
   - Cadastrar setores (ex: RH, TI, Produção, Almoxarifado)

3. **Cadastrar Funcionários**
   - Acessar aba "Funcionários"
   - No formulário de adição:
     - Preencher nome, cargo, telefone
     - **Selecionar empresa** (obrigatório)
     - **Selecionar setor** (obrigatório)
   - Adicionar funcionário

### Para Funcionários:

- Ver empresa e setor no perfil ("Meu Perfil")
- Filtros por empresa/setor (em desenvolvimento)

## 🔄 Relacionamentos

```
Empresa (1) ──┬──> Setor (N)
              │
              └──> Funcionário (N)
                   └──> Setor (1)
```

- Uma **empresa** pode ter vários **setores**
- Uma **empresa** pode ter vários **funcionários**
- Um **funcionário** pertence a uma **empresa** e um **setor**
- Um **setor** pertence a uma **empresa**

## 🚀 Próximos Passos (Planejados)

1. ✅ Criar coleções empresas e setores
2. ✅ Criar página de cadastro de empresas
3. ✅ Criar página de cadastro de setores
4. ✅ Atualizar formulário de funcionários
5. ✅ Exibir empresa/setor no perfil
6. 🔄 **Implementar filtros** por empresa/setor em:
   - Ranking de funcionários
   - Lista de tarefas
   - Empréstimos
   - Inventário
7. 📊 Dashboard com estatísticas por empresa/setor
8. 📈 Relatórios por empresa/setor

## 📝 Exemplo de Dados

### Empresa
```json
{
  "nome": "Garden Almoxarifado",
  "cnpj": "12.345.678/0001-00",
  "ativo": true
}
```

### Setor
```json
{
  "nome": "Recursos Humanos",
  "empresaId": "abc123",
  "empresaNome": "Garden Almoxarifado",
  "descricao": "Gestão de pessoas",
  "ativo": true
}
```

### Funcionário
```json
{
  "nome": "João Silva",
  "cargo": "Analista",
  "empresaId": "abc123",
  "empresaNome": "Garden Almoxarifado",
  "setorId": "def456",
  "setorNome": "Recursos Humanos"
}
```

## 🛠️ Validações Implementadas

### Empresas:
- ✅ Nome é obrigatório
- ✅ Confirmação antes de excluir
- ✅ Apenas empresas ativas aparecem nas listagens

### Setores:
- ✅ Nome é obrigatório
- ✅ Empresa é obrigatória
- ✅ Confirmação antes de excluir
- ✅ Setores filtrados por empresa

### Funcionários:
- ✅ Empresa é obrigatória
- ✅ Setor é obrigatório
- ✅ Setor deve pertencer à empresa selecionada
- ✅ Dropdown de setores desabilitado até selecionar empresa

## 💡 Dicas de Uso

1. **Sempre cadastre empresas primeiro** antes de criar setores
2. **Cadastre setores** antes de adicionar funcionários
3. **Empresas inativas** não aparecem nas seleções
4. **Setores inativos** não aparecem nas seleções
5. **Ao trocar a empresa** de um setor, os funcionários vinculados permanecem, mas pode ser necessário atualização manual

---

## 🎨 Interface

- ✅ Design responsivo (mobile e desktop)
- ✅ Tema claro/escuro suportado
- ✅ Ícones lucide-react
- ✅ Validações em tempo real
- ✅ Feedback visual (alertas e confirmações)

---

## 📞 Suporte

Em caso de dúvidas ou problemas, contate o administrador do sistema.
