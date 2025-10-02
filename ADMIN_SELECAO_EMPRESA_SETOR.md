# Seleção de Empresa e Setor para Administradores

## 📋 Resumo da Funcionalidade

Implementação que permite administradores (nível 4) escolherem a empresa e o setor ao registrar uma nova ferramenta no inventário.

## ✨ Funcionalidades Implementadas

### 1. **Modo Administrador**
- Administradores agora podem selecionar empresa e setor ao registrar ferramentas
- Interface adaptativa que mostra seletores apenas para administradores
- Usuários comuns continuam usando empresa/setor do seu perfil automaticamente

### 2. **Seleção em Cascata**
- Primeiro seleciona a empresa
- Após selecionar empresa, carrega automaticamente os setores daquela empresa
- Validação para garantir que ambos sejam selecionados antes de salvar

### 3. **Interface Intuitiva**
- Ícones visuais (🏢 Building2 para empresa, 🌱 Briefcase para setor)
- Labels descritivas com asterisco (*) indicando campos obrigatórios
- Estados de loading enquanto carrega dados do Firebase
- Campos desabilitados apropriadamente (setor desabilitado até selecionar empresa)

### 4. **Validações**
- Verifica se nome, quantidade e categoria estão preenchidos
- Para admins: valida que empresa e setor foram selecionados
- Alerta visual se tentar salvar sem preencher todos os campos
- Botão "Adicionar Item" desabilitado enquanto campos obrigatórios não estiverem preenchidos

## 🔧 Arquivos Modificados

### `src/components/Inventario/NovoItem.jsx`

#### Importações Adicionadas:
```jsx
import { useState, useEffect } from 'react';
import { Building2, Briefcase } from 'lucide-react';
import { db } from '../../firebaseConfig';
import { collection, getDocs, query, where } from 'firebase/firestore';
```

#### Novos Estados:
```jsx
const [empresas, setEmpresas] = useState([]);
const [setores, setSetores] = useState([]);
const [empresaSelecionada, setEmpresaSelecionada] = useState('');
const [setorSelecionado, setSetorSelecionado] = useState('');
const [loadingEmpresas, setLoadingEmpresas] = useState(false);
const [loadingSetores, setLoadingSetores] = useState(false);
```

#### Novas Funções:
- `carregarEmpresas()`: Busca todas as empresas ativas do Firebase
- `carregarSetores(empresaId)`: Busca setores de uma empresa específica

#### Lógica de Validação:
```jsx
if (isAdmin && (!empresaSelecionada || !setorSelecionado)) {
  alert('Por favor, selecione a empresa e o setor para registrar a ferramenta.');
  return;
}
```

## 🎨 Interface do Usuário

### Para Administradores:
```
┌─────────────────────────────────────────────────────────────┐
│ 🏢 Modo Administrador: Escolha a empresa e setor           │
│                                                             │
│ ┌─────────────────────┐  ┌─────────────────────┐         │
│ │ 🏢 Empresa *        │  │ 🌱 Setor *          │         │
│ │ [Selecionar▼]       │  │ [Selecionar▼]       │         │
│ └─────────────────────┘  └─────────────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

### Para Usuários Comuns:
```
┌─────────────────────────────────────────────────────────────┐
│ 🏢 Zendaya    🌱 Jardinagem    (será registrado            │
│                                 automaticamente)            │
└─────────────────────────────────────────────────────────────┘
```

## 📊 Fluxo de Funcionamento

### Fluxo do Administrador:
1. Admin entra na aba Inventário
2. Vê os seletores de Empresa e Setor
3. Seleciona uma empresa da lista
4. Setores daquela empresa são carregados automaticamente
5. Seleciona um setor
6. Preenche nome, quantidade e categoria da ferramenta
7. Clica em "Adicionar Item"
8. Ferramenta é registrada com a empresa e setor selecionados

### Fluxo do Usuário Comum:
1. Usuário entra na aba Inventário
2. Vê apenas badge informativo com sua empresa e setor
3. Preenche nome, quantidade e categoria da ferramenta
4. Clica em "Adicionar Item"
5. Ferramenta é registrada automaticamente com empresa e setor do usuário

## 🔐 Permissões

- **Nível 4 (Administrador)**: Pode escolher qualquer empresa e setor
- **Nível 1-3 (Usuários)**: Usam automaticamente empresa e setor do seu perfil
- Validação garante que não-admins não possam modificar esses campos

## 📝 Estrutura de Dados Salvos

```javascript
{
  nome: "Enxada",
  quantidade: 5,
  categoria: "Ferramentas",
  empresa: "Zendaya",
  setor: "Jardinagem",
  empresaId: "abc123",
  setorId: "def456",
  criadoPor: "admin_user",
  criadoEm: "2025-10-02T10:30:00.000Z"
}
```

## 🎯 Benefícios

1. **Flexibilidade**: Administradores podem gerenciar ferramentas de qualquer setor
2. **Controle**: Centraliza o registro de ferramentas antes de distribuir aos setores
3. **Auditoria**: Mantém registro de quem criou cada item
4. **Usabilidade**: Interface intuitiva e responsiva
5. **Performance**: Loading states evitam confusão durante carregamento
6. **Segurança**: Validações impedem registros incompletos

## 🚀 Próximos Passos Sugeridos

1. Adicionar filtro na lista de inventário por empresa/setor
2. Implementar relatórios por empresa/setor
3. Adicionar transferência de ferramentas entre setores
4. Implementar histórico de movimentações
5. Dashboard com estatísticas por empresa/setor

## 🐛 Troubleshooting

### Setores não aparecem após selecionar empresa
- Verificar se a empresa tem setores cadastrados
- Verificar console do navegador para erros do Firebase
- Confirmar que setores têm `ativo: true`

### Botão "Adicionar Item" permanece desabilitado
- Verificar se todos os campos estão preenchidos
- Para admin: confirmar empresa e setor selecionados
- Verificar console para mensagens de erro

### Empresas/Setores não carregam
- Verificar conexão com Firebase
- Confirmar permissões de leitura no Firestore
- Verificar se coleções `empresas` e `setores` existem

## 📚 Documentação Relacionada

- [Sistema de Permissões por Setor](./docs/useSectorPermissions.md)
- [Cadastro de Empresas](./docs/CadastroEmpresas.md)
- [Cadastro de Setores](./docs/CadastroSetores.md)
- [Gestão de Inventário](./GUIA_RAPIDO_INVENTARIO.md)
