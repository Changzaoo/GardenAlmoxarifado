# Sistema de Inventário Unificado

## 📋 Visão Geral

O sistema de inventário foi completamente reestruturado para integrar todas as funcionalidades relacionadas à gestão de ferramentas e recursos em uma única página intuitiva com navegação por abas.

## 🎯 Estrutura Unificada

### Componente Principal: `InventarioTab.jsx`

Agora funciona como um hub central que organiza 5 módulos principais:

#### 1. **Inventário** 📦
- Visualização completa do inventário
- Adicionar novos itens
- Editar e remover itens existentes
- Controle de quantidades
- Filtros por setor (para não-administradores)

#### 2. **Compras** 🛒
- Solicitações de compra
- Acompanhamento de status
- Aprovações e pedidos
- Gestão de fornecedores
- Prioridades e valores

#### 3. **Danificadas** 🔧
- Registro de ferramentas danificadas
- Status de reparo (aguardando, em reparo, reparada, irreparável, substituída)
- Custos de reparo
- Histórico de danos
- Responsáveis pelos danos

#### 4. **Perdidas** ⚠️
- Registro de ferramentas perdidas
- Status de busca (buscando, encontrada, irrecuperável)
- Local da última vez visto
- Responsáveis
- Valores estimados

#### 5. **Verificação Mensal** ✅
- Contagem mensal do inventário
- Comparação com mês anterior
- Ajustes de quantidades
- Histórico de verificações

## 🎨 Design e Usabilidade

### Navegação por Abas

#### Desktop
- Abas horizontais no topo
- Indicador visual da aba ativa
- Badges com contadores de itens pendentes
- Hover effects suaves

#### Mobile
- Abas compactas com ícones grandes
- Badges de notificação em vermelho
- Layout responsivo otimizado
- Scroll horizontal suave

### Sistema de Badges

Cada aba exibe um contador inteligente:

- **Inventário**: Total de itens no setor/todos os setores
- **Compras**: Compras solicitadas ou aprovadas (pendentes)
- **Danificadas**: Ferramentas não reparadas ou substituídas
- **Perdidas**: Ferramentas ainda sendo buscadas
- **Verificação**: Verificações pendentes (futuro)

### Tema Dark/Light

- Totalmente compatível com o sistema de temas
- Cores consistentes com o Twitter Theme
- Transições suaves entre temas
- Alto contraste para acessibilidade

## 🔐 Permissões por Setor

### Funcionários (Nível 1)
- Visualizam apenas itens do seu setor
- Modo somente leitura
- Badge informativo azul mostrando o setor

### Supervisores/Gerentes (Nível 2-3)
- Podem visualizar e editar itens do seu setor
- Funcionalidades completas para o setor

### Administradores (Nível 4)
- Visualizam todos os setores
- Badge verde indicando modo administrador
- Acesso total a todas as funcionalidades

## 🚀 Benefícios da Unificação

### Para o Usuário
- **Navegação intuitiva**: Todas as funcionalidades em um só lugar
- **Menos cliques**: Troca rápida entre módulos
- **Contexto mantido**: Filtros e estados preservados ao trocar abas
- **Visual limpo**: Interface organizada e profissional

### Para o Sistema
- **Código modular**: Cada aba mantém seu componente separado
- **Reutilização**: Componentes existentes integrados sem modificações
- **Manutenibilidade**: Fácil adicionar novas abas no futuro
- **Performance**: Renderização condicional otimizada

## 📱 Responsividade

### Breakpoints

```css
/* Mobile First */
- < 768px: Abas verticais compactas com ícones
- ≥ 768px: Abas horizontais com texto completo
```

### Adaptações Mobile
- Ícones maiores (6x6)
- Texto menor (xs)
- Badges compactas
- Scroll horizontal nas abas
- Espaçamento otimizado

## 🔄 Fluxo de Dados

```
Workflow.jsx (Estado Central)
    ↓
InventarioTab.jsx (Hub)
    ↓
├── Inventário → NovoItem + ListaInventario
├── Compras → ComprasTab
├── Danificadas → FerramentasDanificadasTab
├── Perdidas → FerramentasPerdidasTab
└── Verificação → VerificacaoMensalTab
```

### Props Necessárias

```jsx
<InventarioTab
  // Inventário
  inventario={[...]}
  emprestimos={[...]}
  adicionarItem={fn}
  removerItem={fn}
  atualizarItem={fn}
  obterDetalhesEmprestimos={fn}
  
  // Compras
  compras={[...]}
  funcionarios={[...]}
  adicionarCompra={fn}
  removerCompra={fn}
  atualizarCompra={fn}
  
  // Danificadas
  ferramentasDanificadas={[...]}
  adicionarFerramentaDanificada={fn}
  atualizarFerramentaDanificada={fn}
  removerFerramentaDanificada={fn}
  
  // Perdidas
  ferramentasPerdidas={[...]}
  adicionarFerramentaPerdida={fn}
  atualizarFerramentaPerdida={fn}
  removerFerramentaPerdida={fn}
/>
```

## 🎯 Cores das Abas

Cada aba tem uma cor temática:

- 🔵 **Inventário**: Azul (`#1D9BF0`) - Confiável e profissional
- 🟢 **Compras**: Verde (`#00BA7C`) - Crescimento e aquisição
- 🟠 **Danificadas**: Laranja (`#FFD700`) - Atenção e manutenção
- 🔴 **Perdidas**: Vermelho (`#F4212E`) - Alerta e urgência
- 🟣 **Verificação**: Roxo (`#7856FF`) - Auditoria e controle

## 🛠️ Manutenção Futura

### Adicionar Nova Aba

1. Adicione o ID na constante `TABS`
2. Crie o objeto da aba no array `tabs`
3. Adicione o case no `renderConteudoAba()`
4. Passe as props necessárias no `Workflow.jsx`

### Exemplo:

```jsx
// 1. Adicionar ID
const TABS = {
  // ...
  NOVA_ABA: 'nova-aba'
};

// 2. Adicionar ao array tabs
{
  id: TABS.NOVA_ABA,
  label: 'Nova Aba',
  icon: NovoIcone,
  badge: badges.novaAba,
  color: 'blue'
}

// 3. Adicionar case
case TABS.NOVA_ABA:
  return <NovoComponente {...props} />;
```

## 📊 Métricas e Analytics

O sistema está preparado para tracking de:
- Troca de abas
- Tempo em cada módulo
- Ações realizadas por aba
- Preferências do usuário

## ✅ Checklist de Implementação

- [x] Criar estrutura de navegação por abas
- [x] Integrar aba de Inventário
- [x] Integrar aba de Compras
- [x] Integrar aba de Danificadas
- [x] Integrar aba de Perdidas
- [x] Integrar aba de Verificação Mensal
- [x] Implementar badges de contador
- [x] Adicionar responsividade mobile
- [x] Garantir compatibilidade com tema dark
- [x] Implementar filtros por setor
- [x] Atualizar Workflow.jsx com props
- [x] Documentação completa

## 🐛 Troubleshooting

### Abas não aparecem
- Verificar se todas as props são passadas no `Workflow.jsx`
- Checar imports dos componentes filhos

### Badges com valores errados
- Verificar lógica do `useMemo` para cada badge
- Confirmar que arrays de dados não são `undefined`

### Tema não aplica
- Verificar classes do Tailwind
- Checar prefixo `dark:` nas classes

## 📚 Referências

- `src/components/Inventario/InventarioTab.jsx` - Componente principal
- `src/components/Workflow.jsx` - Estado central e integração
- `docs/Sistema_Login_Setor_Empresa.md` - Sistema de permissões
- `docs/SISTEMA_TEMAS_IMPLEMENTADO.md` - Sistema de temas
