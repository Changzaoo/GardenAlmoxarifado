# 🌱 Zendaya Jardinagem - Sistema de Gestão de Inventário

Sistema de controle e gestão de inventário para jardinagem com funcionalidades completas de empréstimo, devolução e controle de plantas, mudas, fertilizantes, vasos e equipamentos de jardinagem.

## Características

### 🔐 Sistema de Autenticação Seguro
- Login protegido com credenciais administrativas
- Interface de administração para alteração de credenciais
- Sistema de logout seguro

### 📊 Dashboard Completo
- Visão geral em tempo real do inventário
- Estatísticas de empréstimos ativos
- Resumo por categorias de equipamentos

### 🛠️ Gestão de Empréstimos
- Cadastro de novos empréstimos com busca inteligente
- Autocompletar para seleção de ferramentas
- Controle de disponibilidade automático
- Histórico completo de empréstimos
- Sistema de devolução com marcação temporal

### 📦 Controle de Inventário de Jardinagem
- Gestão de **Plantas & Mudas** (rosas, lavandas, suculentas, orquídeas, etc.)
- Controle de **Sementes** (girassol, flores silvestres, hortaliças)
- Gerenciamento de **Fertilizantes & Adubos** (NPK, composto orgânico, húmus)
- Organização de **Terra & Substratos** (terra vegetal, substratos especiais)
- Controle de **Vasos & Recipientes** (vasos de barro, plástico, cachepôs)
- Ferramentas e Equipamentos de Jardinagem
- Insumos diversos (arames, etiquetas, telas de sombreamento)
- EPIs especializados (botas, luvas, aventais, chapéus)
- Visualização em cards com indicadores visuais
- Barras de progresso para disponibilidade
- Alertas visuais para itens em baixo estoque

### 🔍 Sistema de Busca
- Busca em tempo real por colaborador ou ferramenta
- Filtros por categoria no inventário
- Sugestões automáticas durante digitação

## Tecnologias

- **Frontend**: React 18 + JavaScript
- **UI**: Tailwind CSS
- **Ícones**: Lucide React
- **Estado**: React Hooks (useState)
- **Build**: Create React App

## Estrutura do Projeto

```
almoxarifado-jardim/
├── public/
│   ├── index.html
│   ├── favicon.ico
│   └── manifest.json
├── src/
│   ├── components/
│   │   ├── Auth/
│   │   │   ├── LoginForm.jsx
│   │   │   └── AdminPanel.jsx
│   │   ├── Dashboard/
│   │   │   ├── StatsCards.jsx
│   │   │   └── TabNavigation.jsx
│   │   ├── Emprestimos/
│   │   │   ├── NovoEmprestimo.jsx
│   │   │   ├── ListaEmprestimos.jsx
│   │   │   └── FerramentaSelector.jsx
│   │   └── Inventario/
│   │       ├── NovoItem.jsx
│   │       ├── ListaInventario.jsx
│   │       └── ItemCard.jsx
│   ├── data/
│   │   ├── inventarioInicial.js
│   │   └── historicoInicial.js
│   ├── utils/
│   │   ├── auth.js
│   │   ├── dateUtils.js
│   │   └── validations.js
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useEmprestimos.js
│   │   └── useInventario.js
│   ├── App.jsx
│   ├── index.js
│   └── index.css
├── package.json
├── README.md
└── tailwind.config.js
```

## Instalação e Execução

### Pré-requisitos
- Node.js 16+ instalado
- npm ou yarn

### Passos para instalação

1. **Clone ou baixe o projeto**
```bash
git clone [url-do-repositorio]
cd almoxarifado-jardim
```

2. **Instale as dependências**
```bash
npm install
# ou
yarn install
```

3. **Configure o Tailwind CSS**
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

4. **Execute o projeto**
```bash
npm start
# ou
yarn start
```

5. **Acesse o sistema**
- Abra http://localhost:3000 no navegador
- Use as credenciais de administração para fazer login

## Credenciais Padrão

**⚠️ IMPORTANTE: Altere as credenciais após a primeira execução**

- **Usuário**: `admin_almoxarifado`
- **Senha**: `Jardim2024@Secure`

## Funcionalidades Detalhadas

### Empréstimos
- **Novo Empréstimo**: Formulário com seleção inteligente de ferramentas
- **Busca Inteligente**: Digite parte do nome da ferramenta para sugestões automáticas
- **Controle de Disponibilidade**: Sistema impede empréstimo de itens indisponíveis
- **Múltiplas Ferramentas**: Adicione várias ferramentas por empréstimo
- **Histórico Completo**: Visualize todos os empréstimos com status e datas

### Inventário
- **Gestão por Categorias**: Organize por Ferramentas, Equipamentos, EPI, Outros
- **Cards Visuais**: Interface intuitiva com indicadores de disponibilidade
- **Alertas de Estoque**: Cores diferenciadas para itens em baixo estoque
- **Resumo Estatístico**: Visão geral por categoria no topo da tela

### Dashboard
- **Métricas em Tempo Real**: Empréstimos ativos, itens disponíveis, itens em uso
- **Interface Responsiva**: Funciona em desktop, tablet e mobile
- **Navegação por Abas**: Alterne facilmente entre Empréstimos e Inventário

## Dados Pré-configurados

O sistema vem com:
- **67 itens** de inventário baseados em dados reais
- **13 empréstimos ativos** para demonstração
- **Categorias padrão**: Ferramentas, Equipamentos, EPI, Outros
- **Colaboradores de exemplo** para testes

## Personalização

### Alterando Credenciais
1. Acesse o sistema com as credenciais padrão
2. Clique no botão "Admin" no canto superior direito
3. Defina novas credenciais no painel de administração
4. **Anote as novas credenciais** antes de aplicar

### Adicionando Dados
- **Novos Itens**: Use o formulário "Novo Item no Inventário"
- **Novos Empréstimos**: Use o formulário "Novo Empréstimo"
- **Categorias**: Edite as opções no código (components/Inventario/NovoItem.jsx)

## Segurança

- Sistema de autenticação obrigatório
- Credenciais criptografadas no código
- Hash de segurança para validação extra
- Logout automático por segurança

## Suporte e Manutenção

Para dúvidas ou problemas:
1. Verifique se todas as dependências estão instaladas
2. Confirme se o Node.js está na versão 16+
3. Certifique-se de que as portas necessárias estão disponíveis
4. Consulte os logs do console para erros específicos

## Licença

© 2024 Almoxarifado do Jardim - Sistema Proprietário"# GardenAlmoxarifado" 
