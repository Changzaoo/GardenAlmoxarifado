import React, { useState } from 'react';
import { 
  Search, ChevronDown, ChevronUp, HelpCircle, Package, Users, ShoppingCart, 
  Wrench, AlertTriangle, XCircle, BarChart3, TrendingUp, ArrowRightLeft, 
  CheckSquare, Settings, Trophy, Clock, FileText, QrCode, MessageSquare, 
  FileCheck, Code, Shield, Sparkles, BookOpen, 
  Star, Info, ExternalLink,
  CheckCircle2, XOctagon, AlertCircle, Target, Lightbulb, Rocket
} from 'lucide-react';
import { NIVEIS_PERMISSAO } from '../../constants/permissoes';

const SupportTab = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSection, setExpandedSection] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeView, setActiveView] = useState('funcionalidades'); // funcionalidades, faq, primeiros-passos, videos

  // Categorias para filtro
  const categories = [
    { id: 'all', nome: 'Todas', icone: Sparkles, cor: 'blue' },
    { id: 'estoque', nome: 'Estoque', icone: Package, cor: 'blue' },
    { id: 'pessoas', nome: 'Pessoas', icone: Users, cor: 'blue' },
    { id: 'relatorios', nome: 'Relatórios', icone: BarChart3, cor: 'blue' },
    { id: 'admin', nome: 'Administração', icone: Shield, cor: 'blue' },
  ];

  // Dados das funcionalidades do sistema
  const systemModules = [
    {
      id: 'inventario',
      title: 'Inventário',
      description: 'Gerenciamento completo do inventário de ferramentas e equipamentos',
      icone: Package,
      cor: 'blue',
      categoria: 'estoque',
      features: [
        {
          name: 'Listagem de Ferramentas',
          description: 'Visualize todas as ferramentas disponíveis no sistema',
          permission: NIVEIS_PERMISSAO.FUNCIONARIO,
          howTo: 'Acesse a aba "Inventário" no menu principal para ver a lista completa de ferramentas.'
        },
        {
          name: 'Adição de Ferramentas',
          description: 'Adicione novas ferramentas ao inventário',
          permission: NIVEIS_PERMISSAO.SUPERVISOR,
          howTo: 'Na aba de inventário, clique no botão "+" para adicionar uma nova ferramenta. Preencha os dados necessários no formulário.'
        },
        {
          name: 'Edição de Ferramentas',
          description: 'Atualize informações de ferramentas existentes',
          permission: NIVEIS_PERMISSAO.SUPERVISOR,
          howTo: 'Clique no ícone de edição ao lado da ferramenta que deseja modificar.'
        }
      ]
    },
    {
      id: 'emprestimos',
      title: 'Empréstimos',
      description: 'Sistema de controle de empréstimos de ferramentas para funcionários',
      icone: ArrowRightLeft,
      cor: 'blue',
      categoria: 'estoque',
      features: [
        {
          name: 'Realizar Empréstimo',
          description: 'Registre empréstimos de ferramentas para funcionários',
          permission: NIVEIS_PERMISSAO.SUPERVISOR,
          howTo: 'Na aba "Empréstimos", clique em "Novo Empréstimo", selecione o funcionário e as ferramentas desejadas.'
        },
        {
          name: 'Devolução',
          description: 'Registre a devolução de ferramentas emprestadas',
          permission: NIVEIS_PERMISSAO.SUPERVISOR,
          howTo: 'Localize o empréstimo ativo e clique em "Devolver". Confirme as ferramentas devolvidas.'
        },
        {
          name: 'Histórico',
          description: 'Visualize o histórico completo de empréstimos',
          permission: NIVEIS_PERMISSAO.FUNCIONARIO,
          howTo: 'Acesse a aba "Histórico de Empréstimos" para ver todos os registros.'
        }
      ]
    },
    {
      id: 'funcionarios',
      title: 'Funcionários',
      description: 'Gerenciamento de funcionários, equipes e suas permissões',
      icone: Users,
      cor: 'blue',
      categoria: 'pessoas',
      features: [
        {
          name: 'Cadastro de Funcionários',
          description: 'Adicione novos funcionários ao sistema',
          permission: NIVEIS_PERMISSAO.SUPERVISOR,
          howTo: 'Na aba "Funcionários", clique em "Novo Funcionário" e preencha os dados necessários.'
        },
        {
          name: 'Edição de Dados',
          description: 'Atualize informações dos funcionários',
          permission: NIVEIS_PERMISSAO.SUPERVISOR,
          howTo: 'Utilize o botão de edição ao lado do funcionário para modificar seus dados.'
        },
        {
          name: 'Gestão de Permissões',
          description: 'Configure níveis de acesso dos funcionários',
          permission: NIVEIS_PERMISSAO.GERENTE_SETOR,
          howTo: 'Acesse a área de edição do funcionário e ajuste seu nível de permissão.'
        }
      ]
    },
    {
      id: 'compras',
      title: 'Compras',
      description: 'Sistema de gestão de compras, requisições e aprovações',
      icone: ShoppingCart,
      cor: 'blue',
      categoria: 'estoque',
      features: [
        {
          name: 'Nova Requisição',
          description: 'Crie requisições de compra de ferramentas',
          permission: NIVEIS_PERMISSAO.SUPERVISOR,
          howTo: 'Na aba "Compras", clique em "Nova Requisição" e preencha os itens necessários.'
        },
        {
          name: 'Aprovação',
          description: 'Aprove ou rejeite requisições de compra',
          permission: NIVEIS_PERMISSAO.GERENTE_SETOR,
          howTo: 'Revise as requisições pendentes e utilize os botões de aprovação ou rejeição.'
        },
        {
          name: 'Histórico de Compras',
          description: 'Visualize todas as compras realizadas',
          permission: NIVEIS_PERMISSAO.SUPERVISOR,
          howTo: 'Acesse o histórico completo de compras na aba correspondente.'
        }
      ]
    },
    {
      id: 'danificadas',
      title: 'Ferramentas Danificadas',
      description: 'Controle de ferramentas danificadas, em manutenção ou com defeito',
      icone: Wrench,
      cor: 'blue',
      categoria: 'estoque',
      features: [
        {
          name: 'Registro de Danos',
          description: 'Registre ferramentas danificadas',
          permission: NIVEIS_PERMISSAO.SUPERVISOR,
          howTo: 'Na aba "Danificadas", registre a ferramenta e o tipo de dano ocorrido.'
        },
        {
          name: 'Acompanhamento',
          description: 'Acompanhe o status de reparos',
          permission: NIVEIS_PERMISSAO.SUPERVISOR,
          howTo: 'Verifique e atualize o status das ferramentas em manutenção.'
        }
      ]
    },
    {
      id: 'perdidas',
      title: 'Ferramentas Perdidas',
      description: 'Gestão de ferramentas perdidas, extraviadas ou roubadas',
      icone: XCircle,
      cor: 'blue',
      categoria: 'estoque',
      features: [
        {
          name: 'Registro de Perdas',
          description: 'Registre ferramentas perdidas ou extraviadas',
          permission: NIVEIS_PERMISSAO.SUPERVISOR,
          howTo: 'Na aba "Perdidas", registre a ferramenta perdida com detalhes sobre o ocorrido.'
        },
        {
          name: 'Investigação',
          description: 'Acompanhe processos de investigação de perdas',
          permission: NIVEIS_PERMISSAO.SUPERVISOR,
          howTo: 'Mantenha registros atualizados sobre o processo de investigação de cada item.'
        }
      ]
    },
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'Painel de controle com indicadores, estatísticas e KPIs em tempo real',
      icone: BarChart3,
      cor: 'blue',
      categoria: 'relatorios',
      features: [
        {
          name: 'Visão Geral',
          description: 'Visualize estatísticas e métricas principais',
          permission: NIVEIS_PERMISSAO.GERENTE_SETOR,
          howTo: 'Acesse o Dashboard para ver gráficos e estatísticas atualizadas do sistema.'
        },
        {
          name: 'Análise de Dados',
          description: 'Explore dados detalhados sobre o uso do sistema',
          permission: NIVEIS_PERMISSAO.GERENTE_SETOR,
          howTo: 'Utilize os filtros e gráficos interativos para analisar diferentes aspectos.'
        }
      ]
    },
    {
      id: 'analytics',
      title: 'Analytics',
      description: 'Análises avançadas, relatórios detalhados e insights inteligentes',
      icone: TrendingUp,
      cor: 'blue',
      categoria: 'relatorios',
      features: [
        {
          name: 'Relatórios Personalizados',
          description: 'Crie e exporte relatórios específicos',
          permission: NIVEIS_PERMISSAO.GERENTE_SETOR,
          howTo: 'Em Analytics, selecione os parâmetros desejados e gere relatórios personalizados.'
        },
        {
          name: 'Métricas Avançadas',
          description: 'Acesse métricas detalhadas de uso e eficiência',
          permission: NIVEIS_PERMISSAO.GERENTE_SETOR,
          howTo: 'Explore as diferentes seções de métricas para análises aprofundadas.'
        }
      ]
    },
    {
      id: 'transferencias',
      title: 'Transferências',
      description: 'Sistema de transferências de ferramentas entre setores e unidades',
      icone: ArrowRightLeft,
      cor: 'blue',
      categoria: 'estoque',
      features: [
        {
          name: 'Nova Transferência',
          description: 'Realize transferências de ferramentas entre setores',
          permission: NIVEIS_PERMISSAO.SUPERVISOR,
          howTo: 'Na aba Transferências, selecione as ferramentas e o setor de destino.'
        },
        {
          name: 'Histórico',
          description: 'Acompanhe o histórico de transferências',
          permission: NIVEIS_PERMISSAO.SUPERVISOR,
          howTo: 'Visualize todas as transferências realizadas e seus detalhes.'
        }
      ]
    },
    {
      id: 'tarefas',
      title: 'Tarefas',
      description: 'Gestão de tarefas, atividades e acompanhamento de projetos',
      icone: CheckSquare,
      cor: 'blue',
      categoria: 'pessoas',
      features: [
        {
          name: 'Criação de Tarefas',
          description: 'Crie e atribua tarefas para a equipe',
          permission: NIVEIS_PERMISSAO.SUPERVISOR,
          howTo: 'Na aba Tarefas, clique em "Nova Tarefa" e preencha os detalhes necessários.'
        },
        {
          name: 'Acompanhamento',
          description: 'Monitore o progresso das tarefas',
          permission: NIVEIS_PERMISSAO.SUPERVISOR,
          howTo: 'Visualize e atualize o status das tarefas em andamento.'
        }
      ]
    },
    {
      id: 'rankings',
      title: 'Rankings e Pontos',
      description: 'Sistema de gamificação com pontos, ranking e conquistas',
      icone: Trophy,
      cor: 'blue',
      categoria: 'pessoas',
      features: [
        {
          name: 'Visualizar Ranking',
          description: 'Veja sua posição no ranking geral e por categoria',
          permission: NIVEIS_PERMISSAO.FUNCIONARIO,
          howTo: 'Acesse a aba "Rankings" para ver sua posição e pontuação. O ranking é atualizado em tempo real.'
        },
        {
          name: 'Sistema de Pontos',
          description: 'Ganhe pontos realizando atividades no sistema',
          permission: NIVEIS_PERMISSAO.FUNCIONARIO,
          howTo: 'Pontos são ganhos automaticamente: +10 por empréstimo, +5 por devolução, +15 por tarefa concluída, etc.'
        },
        {
          name: 'Conquistas',
          description: 'Desbloqueie conquistas e badges especiais',
          permission: NIVEIS_PERMISSAO.FUNCIONARIO,
          howTo: 'Conquistas aparecem automaticamente quando você atinge marcos específicos.'
        }
      ]
    },
    {
      id: 'workponto',
      title: 'WorkPonto',
      description: 'Sistema de registro de ponto com ajustes mensais',
      icone: Clock,
      cor: 'blue',
      categoria: 'pessoas',
      features: [
        {
          name: 'Registrar Ponto',
          description: 'Registre entrada, almoço, retorno e saída',
          permission: NIVEIS_PERMISSAO.FUNCIONARIO,
          howTo: 'Na aba "WorkPonto", clique nos botões para registrar cada ponto do dia. O sistema calcula automaticamente atrasos e horas extras.'
        },
        {
          name: 'Ajustar Horários',
          description: 'Edite horários de almoço e retorno (4 ajustes por mês)',
          permission: NIVEIS_PERMISSAO.FUNCIONARIO,
          howTo: 'Clique no ícone de edição ao lado dos horários. Você tem 4 ajustes mensais. Administradores têm ajustes ilimitados.'
        },
        {
          name: 'Visualizar Histórico',
          description: 'Veja seu histórico de pontos e ajustes realizados',
          permission: NIVEIS_PERMISSAO.FUNCIONARIO,
          howTo: 'Role para baixo na aba WorkPonto para ver o histórico completo. Administradores veem antes/depois de cada ajuste.'
        },
        {
          name: 'Contador de Ajustes',
          description: 'Acompanhe quantos ajustes restam no mês',
          permission: NIVEIS_PERMISSAO.FUNCIONARIO,
          howTo: 'Um card amarelo mostra "X/4 ajustes restantes". Reseta automaticamente todo dia 1º.'
        }
      ]
    },
    {
      id: 'comprovantes',
      title: 'Comprovantes',
      description: 'Gestão e visualização de comprovantes de empréstimos',
      icone: FileText,
      cor: 'blue',
      categoria: 'estoque',
      features: [
        {
          name: 'Visualizar Comprovantes',
          description: 'Acesse comprovantes de empréstimos realizados',
          permission: NIVEIS_PERMISSAO.FUNCIONARIO,
          howTo: 'Na aba "Comprovantes", veja todos os comprovantes gerados. Filtre por data, funcionário ou ferramenta.'
        },
        {
          name: 'Exportar PDF',
          description: 'Exporte comprovantes em formato PDF',
          permission: NIVEIS_PERMISSAO.SUPERVISOR,
          howTo: 'Clique no comprovante desejado e use o botão "Exportar PDF" para baixar.'
        }
      ]
    },
    {
      id: 'qrcode',
      title: 'Scanner QR Code',
      description: 'Leitura de QR Codes para identificação rápida',
      icone: QrCode,
      cor: 'blue',
      categoria: 'estoque',
      features: [
        {
          name: 'Escanear QR Code',
          description: 'Use a câmera para ler QR Codes de ferramentas',
          permission: NIVEIS_PERMISSAO.FUNCIONARIO,
          howTo: 'Acesse "QR Code Scanner", permita o uso da câmera e aponte para o código.'
        }
      ]
    },
    {
      id: 'mensagens',
      title: 'Mensagens',
      description: 'Sistema de comunicação interna entre usuários',
      icone: MessageSquare,
      cor: 'blue',
      categoria: 'pessoas',
      features: [
        {
          name: 'Enviar Mensagens',
          description: 'Envie mensagens para outros usuários',
          permission: NIVEIS_PERMISSAO.FUNCIONARIO,
          howTo: 'Na aba "Mensagens", clique em "Nova Mensagem", selecione o destinatário e digite sua mensagem.'
        },
        {
          name: 'Receber Notificações',
          description: 'Seja notificado de novas mensagens',
          permission: NIVEIS_PERMISSAO.FUNCIONARIO,
          howTo: 'Notificações aparecem automaticamente. Um badge vermelho indica mensagens não lidas.'
        }
      ]
    },
    {
      id: 'configuracoes',
      title: 'Configurações',
      description: 'Configurações gerais e personalização do sistema',
      icone: Settings,
      cor: 'blue',
      categoria: 'admin',
      features: [
        {
          name: 'Tema Claro/Escuro',
          description: 'Alterne entre modo claro e escuro',
          permission: NIVEIS_PERMISSAO.FUNCIONARIO,
          howTo: 'Clique no ícone de lua/sol no canto superior para alternar o tema.'
        },
        {
          name: 'Notificações',
          description: 'Configure alertas e notificações',
          permission: NIVEIS_PERMISSAO.FUNCIONARIO,
          howTo: 'Em Configurações, ajuste suas preferências de notificação.'
        },
        {
          name: 'Personalização de Menu',
          description: 'Defina sua aba favorita e organize o menu',
          permission: NIVEIS_PERMISSAO.FUNCIONARIO,
          howTo: 'Segure pressionado uma aba para defini-la como favorita. Ela aparecerá destacada no menu inferior.'
        }
      ]
    },
    {
      id: 'legal',
      title: 'Documentos Legais',
      description: 'Termos de uso, políticas e documentação legal',
      icone: FileCheck,
      cor: 'blue',
      categoria: 'admin',
      features: [
        {
          name: 'Visualizar Documentos',
          description: 'Acesse termos de uso e políticas',
          permission: NIVEIS_PERMISSAO.FUNCIONARIO,
          howTo: 'Na aba "Legal", navegue pelos documentos disponíveis.'
        }
      ]
    },
    {
      id: 'developer',
      title: 'Painel de Desenvolvedor',
      description: 'Ferramentas avançadas para desenvolvedores e debug',
      icone: Code,
      cor: 'blue',
      categoria: 'admin',
      features: [
        {
          name: 'Console de Debug',
          description: 'Acesse logs e informações técnicas',
          permission: NIVEIS_PERMISSAO.ADMIN,
          howTo: 'Disponível apenas para administradores. Acesse via menu de configurações avançadas.'
        }
      ]
    },
    {
      id: 'systemadmin',
      title: 'Administração do Sistema',
      description: 'Backup, restauração e gerenciamento avançado',
      icone: Shield,
      cor: 'blue',
      categoria: 'admin',
      features: [
        {
          name: 'Backup de Dados',
          description: 'Realize backup completo do sistema',
          permission: NIVEIS_PERMISSAO.ADMIN,
          howTo: 'Em "System Admin", acesse a aba de Backup e clique em "Gerar Backup".'
        },
        {
          name: 'Restaurar Dados',
          description: 'Restaure o sistema a partir de um backup',
          permission: NIVEIS_PERMISSAO.ADMIN,
          howTo: 'Em "System Admin", faça upload do arquivo de backup e confirme a restauração.'
        },
        {
          name: 'Gerenciar Códigos de Reset',
          description: 'Gere códigos para redefinição de senha',
          permission: NIVEIS_PERMISSAO.ADMIN,
          howTo: 'Use a aba "Códigos de Reset" para gerenciar códigos de recuperação.'
        }
      ]
    }
  ];

  // Primeiros Passos
  const primeiroPassos = [
    {
      id: 1,
      titulo: '1. Fazer Login',
      descricao: 'Entre no sistema com suas credenciais fornecidas pelo administrador',
      icone: Users,
      cor: 'blue',
      passos: [
        'Digite seu email e senha na tela de login',
        'Clique em "Entrar"',
        'Se esqueceu a senha, clique em "Esqueci minha senha"'
      ]
    },
    {
      id: 2,
      titulo: '2. Conhecer o Dashboard',
      descricao: 'Familiarize-se com os principais indicadores',
      icone: BarChart3,
      cor: 'blue',
      passos: [
        'Acesse a aba "Dashboard" no menu',
        'Visualize estatísticas de ferramentas, empréstimos e funcionários',
        'Use os filtros para personalizar a visualização'
      ]
    },
    {
      id: 3,
      titulo: '3. Registrar seu Primeiro Ponto',
      descricao: 'Aprenda a usar o sistema WorkPonto',
      icone: Clock,
      cor: 'blue',
      passos: [
        'Acesse "WorkPonto" no menu',
        'Clique em "Registrar Entrada" ao chegar',
        'Registre almoço, retorno e saída nos horários corretos',
        'Lembre-se: você tem 4 ajustes por mês!'
      ]
    },
    {
      id: 4,
      titulo: '4. Realizar um Empréstimo',
      descricao: 'Empreste ferramentas para funcionários',
      icone: Package,
      cor: 'blue',
      passos: [
        'Vá para a aba "Empréstimos"',
        'Clique em "Novo Empréstimo"',
        'Selecione o funcionário e as ferramentas',
        'Confirme o empréstimo'
      ]
    },
    {
      id: 5,
      titulo: '5. Personalizar seu Menu',
      descricao: 'Organize o menu do jeito que preferir',
      icone: Star,
      cor: 'blue',
      passos: [
        'Segure pressionado em qualquer aba do menu',
        'Selecione "Definir como Favorita"',
        'A aba favorita aparecerá destacada no menu inferior',
        'Alterne entre tema claro e escuro no topo'
      ]
    }
  ];



  // FAQs do sistema
  const faqs = [
    {
      question: 'Como faço para emprestar uma ferramenta?',
      answer: 'Para emprestar uma ferramenta, acesse a aba "Empréstimos", clique em "Novo Empréstimo", selecione o funcionário e as ferramentas desejadas. Confirme os detalhes e finalize o empréstimo.',
      categoria: 'estoque',
      relevancia: 'alta'
    },
    {
      question: 'O que acontece quando esgoto meus 4 ajustes mensais de ponto?',
      answer: 'Quando você usar todos os 4 ajustes do mês, não poderá mais editar seus horários de almoço e retorno até o próximo mês. O contador é resetado automaticamente no dia 1º de cada mês. Administradores têm ajustes ilimitados.',
      categoria: 'pessoas',
      relevancia: 'alta'
    },
    {
      question: 'Como os ajustes de ponto funcionam para administradores?',
      answer: 'Administradores (nível 0) têm ajustes ilimitados e podem editar horários sem restrições. Além disso, eles visualizam um histórico completo mostrando o ponto antes e depois de cada edição realizada por qualquer usuário.',
      categoria: 'pessoas',
      relevancia: 'media'
    },
    {
      question: 'O que fazer se uma ferramenta for danificada?',
      answer: 'Em caso de dano, registre imediatamente na aba "Ferramentas Danificadas". Inclua detalhes sobre o dano e, se possível, anexe fotos. A equipe responsável será notificada.',
      categoria: 'estoque',
      relevancia: 'alta'
    },
    {
      question: 'Como funciona o sistema de ranking e pontos?',
      answer: 'Você ganha pontos automaticamente por atividades: +10 por empréstimo, +5 por devolução, +15 por tarefa concluída, +20 por verificação de inventário. O ranking é atualizado em tempo real e você pode competir com colegas.',
      categoria: 'pessoas',
      relevancia: 'media'
    },
    {
      question: 'Posso personalizar meu menu?',
      answer: 'Sim! Segure pressionado (long press) em qualquer aba do menu para defini-la como favorita. A aba favorita aparecerá destacada com um ícone de troféu no menu inferior móvel.',
      categoria: 'admin',
      relevancia: 'media'
    },
    {
      question: 'Como verificar a disponibilidade de uma ferramenta?',
      answer: 'No "Inventário", você pode ver a quantidade disponível de cada ferramenta. Ferramentas emprestadas aparecem com status "Em uso" e sua quantidade disponível é atualizada automaticamente.'
    },
    {
      question: 'Como solicitar a compra de novas ferramentas?',
      answer: 'Acesse a aba "Compras", clique em "Nova Requisição", preencha os detalhes dos itens necessários e envie para aprovação. O status da solicitação pode ser acompanhado na mesma área.'
    },
    {
      question: 'Como alterar minhas informações de perfil?',
      answer: 'Clique no seu nome/foto no menu lateral e selecione "Editar Perfil". Você pode atualizar suas informações básicas e preferências do sistema.'
    },
    {
      question: 'Como faço para transferir ferramentas entre setores?',
      answer: 'Na aba "Transferências", inicie uma nova transferência, selecione as ferramentas a serem transferidas e o setor de destino. A transferência precisa ser aprovada pelo supervisor do setor de destino.'
    },
    {
      question: 'O que fazer se uma ferramenta for perdida?',
      answer: 'Registre imediatamente na aba "Ferramentas Perdidas". Forneça todas as informações possíveis sobre quando e onde a ferramenta foi vista pela última vez. Um processo de investigação será iniciado.'
    },
    {
      question: 'Como acessar relatórios e análises?',
      answer: 'Acesse a aba "Analytics" para relatórios detalhados ou "Dashboard" para uma visão geral. Você pode personalizar os relatórios e exportá-los conforme necessário.'
    },
    {
      question: 'Como criar e atribuir tarefas?',
      answer: 'Na aba "Tarefas", clique em "Nova Tarefa", defina o título, descrição, responsável e prazo. Você pode acompanhar o progresso e receber notificações sobre atualizações.'
    },
    {
      question: 'Como configurar minhas notificações?',
      answer: 'Em "Configurações", acesse a seção de notificações. Você pode personalizar quais tipos de alertas deseja receber e como (email, notificações no sistema, etc).'
    },
    {
      question: 'Como funciona o sistema de níveis de acesso?',
      answer: 'O sistema possui diferentes níveis: Funcionário (acesso básico), Supervisor (gerenciamento operacional), Gerente (acesso avançado) e Admin (acesso total). Cada nível tem permissões específicas.'
    },
    {
      question: 'Como verificar o histórico de uma ferramenta?',
      answer: 'No Inventário, clique na ferramenta desejada para ver seu histórico completo, incluindo empréstimos, transferências, manutenções e outros eventos relacionados.'
    },
    {
      question: 'Posso usar o sistema em dispositivos móveis?',
      answer: 'Sim, o sistema é totalmente responsivo e pode ser acessado de qualquer dispositivo com navegador web. Também oferecemos um PWA para instalação no seu celular ou tablet.'
    },
    {
      question: 'Como reportar um problema no sistema?',
      answer: 'Use o botão de suporte no canto inferior direito ou envie um email para suporte@workflow.com. Inclua o máximo de detalhes possível sobre o problema encontrado.'
    },
    {
      question: 'Como funciona a verificação mensal do inventário?',
      answer: 'Todo mês é necessário realizar uma verificação física do inventário. O sistema guia você pelo processo, permitindo confirmar a localização e estado de cada ferramenta.'
    }
  ];

  // Filtros
  const filteredModules = systemModules.filter(module => {
    const categoryMatch = selectedCategory === 'all' || module.categoria === selectedCategory;
    const searchMatch = searchTerm === '' || 
      module.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      module.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      module.features.some(f => 
        f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    return categoryMatch && searchMatch;
  });

  const filteredFaqs = faqs.filter(faq => {
    const categoryMatch = selectedCategory === 'all' || faq.categoria === selectedCategory;
    const searchMatch = searchTerm === '' ||
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    return categoryMatch && searchMatch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header com Gradiente */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-3 mb-4 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full">
          <Sparkles className="w-6 h-6 text-white" />
          <h1 className="text-2xl font-bold text-white">
            Central de Ajuda WorkFlow
          </h1>
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Tudo que você precisa saber para dominar o sistema de gestão mais completo
        </p>
      </div>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg">
          <BookOpen className="w-8 h-8 mb-2 opacity-80" />
          <div className="text-2xl font-bold">{systemModules.length}</div>
          <div className="text-sm opacity-90">Módulos</div>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg">
          <HelpCircle className="w-8 h-8 mb-2 opacity-80" />
          <div className="text-2xl font-bold">{faqs.length}</div>
          <div className="text-sm opacity-90">FAQs</div>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg">
          <Rocket className="w-8 h-8 mb-2 opacity-80" />
          <div className="text-2xl font-bold">{primeiroPassos.length}</div>
          <div className="text-sm opacity-90">Tutoriais</div>
        </div>
      </div>

      {/* Navegação por Abas */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { id: 'funcionalidades', label: 'Funcionalidades', icone: BookOpen },
          { id: 'primeiros-passos', label: 'Primeiros Passos', icone: Rocket },
          { id: 'faq', label: 'Perguntas Frequentes', icone: HelpCircle },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
              activeView === tab.id
                ? 'bg-blue-500 text-white shadow-lg'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <tab.icone className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Barra de Busca Aprimorada */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar por funcionalidades, tutoriais, FAQs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-6 py-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
            >
              <XOctagon className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Filtros por Categoria (apenas na view de funcionalidades e FAQs) */}
      {(activeView === 'funcionalidades' || activeView === 'faq') && (
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                selectedCategory === cat.id
                  ? `bg-${cat.cor}-500 text-white shadow-md`
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <cat.icone className="w-4 h-4" />
              {cat.nome}
            </button>
          ))}
        </div>
      )}

      {/* Conteúdo por View */}
      <div className="mt-8">
        {/* VIEW: Funcionalidades */}
        {activeView === 'funcionalidades' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-6 h-6 text-[#1D9BF0]" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Todas as Funcionalidades
              </h2>
            </div>
            
            {filteredModules.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Nenhuma funcionalidade encontrada</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredModules.map(module => {
                  const IconeModulo = module.icone;
                  return (
                    <div
                      key={module.id}
                      className="border-2 border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:shadow-xl transition-all cursor-pointer group"
                      onClick={() => setExpandedSection(expandedSection === module.id ? null : module.id)}
                    >
                      <div className={`bg-gradient-to-r from-${module.cor}-500 to-${module.cor}-600 p-4 flex items-center gap-3`}>
                        <div className="bg-white/20 p-2 rounded-lg">
                          <IconeModulo className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-white">{module.title}</h3>
                          <p className="text-white/90 text-sm">{module.description}</p>
                        </div>
                        {expandedSection === module.id ? (
                          <ChevronUp className="w-5 h-5 text-white" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-white group-hover:animate-bounce" />
                        )}
                      </div>
                      
                      {expandedSection === module.id && (
                        <div className="p-6 bg-white dark:bg-gray-800 space-y-4">
                          {module.features.map((feature, idx) => (
                            <div key={idx} className="border-l-4 border-blue-500 pl-4 py-2">
                              <div className="flex items-start gap-3">
                                <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                                    {feature.name}
                                  </h4>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                    {feature.description}
                                  </p>
                                  <div className="flex items-center gap-2 text-xs mb-2">
                                    <Shield className="w-4 h-4 text-[#1D9BF0]" />
                                    <span className="text-blue-600 dark:text-blue-400 font-medium">
                                      {Object.entries(NIVEIS_PERMISSAO).find(([k, v]) => v === feature.permission)?.[0] || 'N/A'}
                                    </span>
                                  </div>
                                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                                    <div className="flex items-start gap-2">
                                      <Lightbulb className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                                      <p className="text-sm text-gray-700 dark:text-gray-300">
                                        {feature.howTo}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* VIEW: Primeiros Passos */}
        {activeView === 'primeiros-passos' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Rocket className="w-6 h-6 text-[#1D9BF0]" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Primeiros Passos no Sistema
              </h2>
            </div>
            
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-6 rounded-xl mb-6 border-2 border-blue-200 dark:border-blue-700">
              <div className="flex items-start gap-3">
                <Info className="w-6 h-6 text-[#1D9BF0] flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2">Bem-vindo ao WorkFlow!</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    Siga estes passos para começar a usar o sistema de forma eficiente. 
                    Cada tutorial irá guiá-lo pelas funcionalidades essenciais.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {primeiroPassos.map((passo, idx) => {
                const IconePasso = passo.icone;
                return (
                  <div
                    key={passo.id}
                    className="border-2 border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:shadow-xl transition-all"
                  >
                    <div className={`bg-gradient-to-r from-${passo.cor}-500 to-${passo.cor}-600 p-5 flex items-center gap-4`}>
                      <div className="bg-white/20 p-3 rounded-xl">
                        <IconePasso className="w-8 h-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-1">{passo.titulo}</h3>
                        <p className="text-white/90">{passo.descricao}</p>
                      </div>
                      <div className="text-3xl font-bold text-white/30">{passo.id}</div>
                    </div>
                    
                    <div className="p-6 bg-white dark:bg-gray-800">
                      <div className="space-y-3">
                        {passo.passos.map((step, stepIdx) => (
                          <div key={stepIdx} className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                              {stepIdx + 1}
                            </div>
                            <p className="text-gray-700 dark:text-gray-300 flex-1">{step}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW: FAQs */}
        {activeView === 'faq' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <HelpCircle className="w-6 h-6 text-[#1D9BF0]" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Perguntas Frequentes
              </h2>
            </div>

            {filteredFaqs.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Nenhuma pergunta encontrada</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredFaqs.map((faq, index) => (
                  <div
                    key={index}
                    className="border-2 border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:shadow-lg transition-all"
                  >
                    <button
                      onClick={() => setExpandedSection(expandedSection === `faq-${index}` ? null : `faq-${index}`)}
                      className="w-full px-6 py-4 flex items-center justify-between bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 text-left">
                        <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                          <HelpCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="text-gray-900 dark:text-white font-semibold">
                          {faq.question}
                        </span>
                      </div>
                      {expandedSection === `faq-${index}` ? (
                        <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      )}
                    </button>
                    
                    {expandedSection === `faq-${index}` && (
                      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Rodapé com Dicas e Links */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Dicas Rápidas */}
        <div className="border-2 border-blue-200 dark:border-blue-700 rounded-xl p-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-gray-900 dark:text-white">Dicas Rápidas</h3>
          </div>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <span>Use filtros para encontrar itens rapidamente</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <span>Mantenha o mouse sobre ícones para ver dicas</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <span>Use o modo escuro para trabalhar à noite</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <span>Pressione F1 para abrir esta ajuda</span>
            </li>
          </ul>
        </div>

        {/* Boas Práticas */}
        <div className="border-2 border-blue-200 dark:border-blue-700 rounded-xl p-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-[#1D9BF0]" />
            <h3 className="font-bold text-gray-900 dark:text-white">Boas Práticas</h3>
          </div>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <span>Não compartilhe suas credenciais</span>
            </li>
            <li className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <span>Faça logout ao final do expediente</span>
            </li>
            <li className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <span>Mantenha seu navegador atualizado</span>
            </li>
            <li className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <span>Reporte problemas imediatamente</span>
            </li>
          </ul>
        </div>

        {/* Suporte */}
        <div className="border-2 border-blue-200 dark:border-blue-700 rounded-xl p-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
          <div className="flex items-center gap-2 mb-4">
            <HelpCircle className="w-5 h-5 text-[#1D9BF0]" />
            <h3 className="font-bold text-gray-900 dark:text-white">Precisa de Ajuda?</h3>
          </div>
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
            Nossa equipe está pronta para ajudá-lo!
          </p>
          <div className="space-y-2">
            <a
              href="mailto:suporte@workflow.com"
              className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              <ExternalLink className="w-4 h-4" />
              suporte@workflow.com
            </a>
            <a
              href="#"
              className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              <ExternalLink className="w-4 h-4" />
              Central de Documentação
            </a>
          </div>
        </div>
      </div>

      {/* Versão e Copyright */}
      <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400 pb-6">
        <p>WorkFlow System v2.0.0 | © 2025 Todos os direitos reservados</p>
        <p className="mt-2">Desenvolvido com ❤️ para otimizar sua gestão</p>
      </div>
    </div>
  );
};

export default SupportTab;

