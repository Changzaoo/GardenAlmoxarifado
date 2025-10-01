import React, { useState } from 'react';
import { Search, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { NIVEIS_PERMISSAO } from '../Workflow';

const SupportTab = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSection, setExpandedSection] = useState(null);

  // Dados das funcionalidades do sistema
  const systemModules = [
    {
      id: 'inventario',
      title: 'Inventário',
      description: 'Gerenciamento completo do inventário de ferramentas',
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
      description: 'Sistema de controle de empréstimos de ferramentas',
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
      description: 'Gerenciamento de funcionários e suas permissões',
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
          permission: NIVEIS_PERMISSAO.GERENTE,
          howTo: 'Acesse a área de edição do funcionário e ajuste seu nível de permissão.'
        }
      ]
    },
    {
      id: 'compras',
      title: 'Compras',
      description: 'Sistema de gestão de compras e requisições',
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
          permission: NIVEIS_PERMISSAO.GERENTE,
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
      description: 'Controle de ferramentas danificadas ou em manutenção',
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
      description: 'Gestão de ferramentas perdidas ou extraviadas',
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
      description: 'Painel de controle com indicadores e estatísticas',
      features: [
        {
          name: 'Visão Geral',
          description: 'Visualize estatísticas e métricas principais',
          permission: NIVEIS_PERMISSAO.GERENTE,
          howTo: 'Acesse o Dashboard para ver gráficos e estatísticas atualizadas do sistema.'
        },
        {
          name: 'Análise de Dados',
          description: 'Explore dados detalhados sobre o uso do sistema',
          permission: NIVEIS_PERMISSAO.GERENTE,
          howTo: 'Utilize os filtros e gráficos interativos para analisar diferentes aspectos.'
        }
      ]
    },
    {
      id: 'analytics',
      title: 'Analytics',
      description: 'Análises avançadas e relatórios detalhados',
      features: [
        {
          name: 'Relatórios Personalizados',
          description: 'Crie e exporte relatórios específicos',
          permission: NIVEIS_PERMISSAO.GERENTE,
          howTo: 'Em Analytics, selecione os parâmetros desejados e gere relatórios personalizados.'
        },
        {
          name: 'Métricas Avançadas',
          description: 'Acesse métricas detalhadas de uso e eficiência',
          permission: NIVEIS_PERMISSAO.GERENTE,
          howTo: 'Explore as diferentes seções de métricas para análises aprofundadas.'
        }
      ]
    },
    {
      id: 'transferencias',
      title: 'Transferências',
      description: 'Sistema de transferências entre setores',
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
      description: 'Gestão de tarefas e atividades',
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
      id: 'configuracoes',
      title: 'Configurações',
      description: 'Configurações e personalização do sistema',
      features: [
        {
          name: 'Preferências',
          description: 'Ajuste as configurações do sistema',
          permission: NIVEIS_PERMISSAO.ADMIN,
          howTo: 'Em Configurações, personalize as opções conforme necessário.'
        },
        {
          name: 'Notificações',
          description: 'Configure alertas e notificações',
          permission: NIVEIS_PERMISSAO.SUPERVISOR,
          howTo: 'Ajuste suas preferências de notificação para diferentes eventos.'
        }
      ]
    }
  ];

  // FAQs do sistema
  const faqs = [
    {
      question: 'Como faço para emprestar uma ferramenta?',
      answer: 'Para emprestar uma ferramenta, acesse a aba "Empréstimos", clique em "Novo Empréstimo", selecione o funcionário e as ferramentas desejadas. Confirme os detalhes e finalize o empréstimo.'
    },
    {
      question: 'O que fazer se uma ferramenta for danificada?',
      answer: 'Em caso de dano, registre imediatamente na aba "Ferramentas Danificadas". Inclua detalhes sobre o dano e, se possível, anexe fotos. A equipe responsável será notificada.'
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

  const filteredModules = systemModules.filter(module => {
    const moduleMatch = module.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       module.description.toLowerCase().includes(searchTerm.toLowerCase());
    const featuresMatch = module.features.some(feature => 
      feature.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feature.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feature.howTo.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return moduleMatch || featuresMatch;
  });

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Central de Suporte
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Encontre ajuda e documentação sobre todas as funcionalidades do sistema
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative mb-8">
        <input
          type="text"
          placeholder="Pesquisar funcionalidades, tutoriais ou FAQs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 pl-12 rounded-lg border border-gray-200 dark:border-gray-600 dark:border-gray-600 bg-white dark:bg-gray-800 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <Search className="w-5 h-5 absolute left-4 top-3.5 text-gray-400" />
      </div>

      {/* Modules Documentation */}
      <div className="space-y-6 mb-12">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Funcionalidades do Sistema
        </h2>
        {filteredModules.map(module => (
          <div
            key={module.id}
            className="border dark:border-gray-700 rounded-lg overflow-hidden"
          >
            <button
              onClick={() => setExpandedSection(expandedSection === module.id ? null : module.id)}
              className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 dark:bg-gray-800"
            >
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {module.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {module.description}
                </p>
              </div>
              {expandedSection === module.id ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>
            
            {expandedSection === module.id && (
              <div className="px-6 py-4 bg-white dark:bg-gray-800 dark:bg-gray-900">
                <div className="space-y-6">
                  {module.features.map((feature, index) => (
                    <div key={index} className="border-b dark:border-gray-700 last:border-0 pb-6 last:pb-0">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                        {feature.name}
                      </h4>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                        {feature.description}
                      </p>
                      <div className="text-sm">
                        <span className="text-blue-600 dark:text-blue-400 font-medium">
                          Nível de Acesso:
                        </span>
                        <span className="ml-2 text-gray-600 dark:text-gray-400">
                          {Object.entries(NIVEIS_PERMISSAO).find(([key, value]) => value === feature.permission)?.[0] || 'N/A'}
                        </span>
                      </div>
                      <div className="mt-2 text-sm">
                        <span className="text-blue-600 dark:text-blue-400 font-medium">
                          Como fazer:
                        </span>
                        <p className="mt-1 text-gray-600 dark:text-gray-400">
                          {feature.howTo}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* FAQs */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Perguntas Frequentes
        </h2>
        {filteredFaqs.map((faq, index) => (
          <div
            key={index}
            className="border dark:border-gray-700 rounded-lg overflow-hidden"
          >
            <button
              onClick={() => setExpandedSection(expandedSection === `faq-${index}` ? null : `faq-${index}`)}
              className="w-full px-6 py-4 flex items-center justify-between bg-white dark:bg-gray-800 dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <div className="flex items-center space-x-3">
                <HelpCircle className="w-5 h-5 text-blue-500" />
                <span className="text-gray-900 dark:text-white font-medium">
                  {faq.question}
                </span>
              </div>
              {expandedSection === `faq-${index}` ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>
            
            {expandedSection === `faq-${index}` && (
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900">
                <p className="text-gray-600 dark:text-gray-400">
                  {faq.answer}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Dicas */}
      <div className="space-y-6 mb-12">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Dicas Rápidas
        </h2>
        <div className="grid grid-cols-1 gap-4">
          <div className="border dark:border-gray-700 rounded-lg p-4">
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>• Use filtros para encontrar itens rapidamente</li>
              <li>• Mantenha o mouse sobre ícones para ver dicas</li>
              <li>• Clique duplo em itens para edição rápida</li>
              <li>• Arraste colunas para reorganizar tabelas</li>
              <li>• Use o modo escuro para trabalhar à noite</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Resolução de Problemas */}
      <div className="space-y-6 mb-12">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Resolução de Problemas Comuns
        </h2>
        <div className="space-y-4">
          <div className="border dark:border-gray-700 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">Problemas de Login</h3>
            <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <li>
                <strong>Esqueceu a senha?</strong>
                <p>Clique em "Esqueci minha senha" na tela de login ou contate o administrador do sistema para redefinição.</p>
              </li>
              <li>
                <strong>Conta bloqueada?</strong>
                <p>Após 5 tentativas incorretas de senha, a conta é bloqueada por segurança. Aguarde 15 minutos ou contate o suporte.</p>
              </li>
              <li>
                <strong>Erro de autenticação?</strong>
                <p>Verifique sua conexão com a internet e limpe o cache do navegador. Se o problema persistir, contate o suporte.</p>
              </li>
            </ul>
          </div>

          <div className="border dark:border-gray-700 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">Problemas com Empréstimos</h3>
            <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <li>
                <strong>Não consegue emprestar uma ferramenta?</strong>
                <p>Verifique se a ferramenta está disponível e se você tem as permissões necessárias.</p>
              </li>
              <li>
                <strong>Erro na devolução?</strong>
                <p>Certifique-se de que todas as informações estão corretas e que o sistema está online.</p>
              </li>
              <li>
                <strong>Divergência no inventário?</strong>
                <p>Reporte a divergência ao supervisor para correção manual do estoque.</p>
              </li>
            </ul>
          </div>

          <div className="border dark:border-gray-700 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">Problemas Técnicos</h3>
            <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <li>
                <strong>Sistema lento?</strong>
                <p>Limpe o cache do navegador, verifique sua conexão e feche abas desnecessárias.</p>
              </li>
              <li>
                <strong>Erro ao gerar relatório?</strong>
                <p>Tente reduzir o período de dados ou filtrar menos informações. Se persistir, use a exportação em partes.</p>
              </li>
              <li>
                <strong>Notificações não aparecem?</strong>
                <p>Verifique as permissões do navegador e suas configurações de notificação no sistema.</p>
              </li>
            </ul>
          </div>

          <div className="border dark:border-gray-700 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">Dicas de Prevenção</h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>• Mantenha seu navegador atualizado</li>
              <li>• Faça logout ao final do expediente</li>
              <li>• Não compartilhe suas credenciais</li>
              <li>• Reporte problemas imediatamente</li>
              <li>• Faça backup de relatórios importantes</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Links Importantes */}
      <div className="space-y-6 mb-12">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Links Importantes
        </h2>
        <div className="border dark:border-gray-700 rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline">
                    Manual do Usuário
                  </a>
                </li>
                <li>
                  <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline">
                    Política de Segurança
                  </a>
                </li>
                <li>
                  <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline">
                    Termos de Uso
                  </a>
                </li>
                <li>
                  <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline">
                    Tutoriais em Vídeo
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportTab;

