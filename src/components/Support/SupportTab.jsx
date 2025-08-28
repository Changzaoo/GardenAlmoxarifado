import React, { useState } from 'react';
import { Book, Search, X, HelpCircle } from 'lucide-react';

const SupportTab = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const supportContent = {
    'getting-started': {
      title: 'Primeiros Passos',
      content: [
        {
          title: 'Login e Acesso',
          text: 'Para acessar o sistema, utilize suas credenciais fornecidas pelo administrador. Existem diferentes níveis de acesso:\n- Funcionário: Acesso básico ao sistema\n- Supervisor: Acesso intermediário com mais funcionalidades\n- Administrador: Acesso completo ao sistema'
        },
        {
          title: 'Interface do Sistema',
          text: 'O sistema possui uma barra lateral com as principais funcionalidades:\n- Dashboard: Visão geral do sistema\n- Inventário: Gerenciamento de ferramentas e equipamentos\n- Empréstimos: Controle de empréstimos de ferramentas\n- Tarefas: Gerenciamento de tarefas\n- Funcionários: Gestão de funcionários\n- Compras: Solicitações e controle de compras'
        }
      ]
    },
    'inventory': {
      title: 'Gerenciamento de Inventário',
      content: [
        {
          title: 'Cadastro de Ferramentas',
          text: 'Para cadastrar uma nova ferramenta:\n1. Acesse a aba "Inventário"\n2. Clique em "Adicionar Ferramenta"\n3. Preencha as informações necessárias:\n   - Nome da ferramenta\n   - Categoria\n   - Quantidade\n   - Descrição\n4. Clique em "Salvar"'
        },
        {
          title: 'Controle de Estoque',
          text: 'O sistema permite:\n- Visualizar quantidade disponível\n- Verificar ferramentas emprestadas\n- Registrar ferramentas danificadas\n- Controlar ferramentas perdidas\n- Fazer transferências entre setores'
        }
      ]
    },
    'loans': {
      title: 'Sistema de Empréstimos',
      content: [
        {
          title: 'Realizar um Empréstimo',
          text: '1. Acesse a aba "Empréstimos"\n2. Clique em "Novo Empréstimo"\n3. Selecione o funcionário\n4. Adicione as ferramentas desejadas\n5. Defina a data de devolução\n6. Confirme o empréstimo'
        },
        {
          title: 'Devolução de Ferramentas',
          text: '1. Na lista de empréstimos ativos\n2. Localize o empréstimo\n3. Clique em "Devolver"\n4. Confirme o estado das ferramentas\n5. Registre a devolução'
        }
      ]
    },
    'tasks': {
      title: 'Gestão de Tarefas',
      content: [
        {
          title: 'Criar Nova Tarefa',
          text: '1. Acesse a aba "Tarefas"\n2. Clique no botão "Criar Tarefa"\n3. Preencha as informações:\n   - Título\n   - Descrição\n   - Prazo\n   - Responsáveis\n   - Prioridade\n4. Clique em "Salvar"'
        },
        {
          title: 'Acompanhamento de Tarefas',
          text: 'Para acompanhar tarefas:\n- Use os filtros por status e prioridade\n- Visualize o progresso de cada tarefa\n- Atualize o status quando necessário\n- Adicione comentários e observações'
        }
      ]
    },
    'purchases': {
      title: 'Sistema de Compras',
      content: [
        {
          title: 'Solicitar Compra',
          text: '1. Acesse a aba "Compras"\n2. Clique em "Nova Solicitação"\n3. Preencha os detalhes:\n   - Descrição do item\n   - Quantidade\n   - Fornecedor sugerido\n   - Justificativa\n   - Prioridade\n4. Envie a solicitação'
        },
        {
          title: 'Acompanhamento de Compras',
          text: 'Status das compras:\n- Solicitado: Pedido inicial\n- Aprovado: Autorizado para compra\n- Pedido Enviado: Em processo de compra\n- Recebido: Item entregue\n- Cancelado: Solicitação negada'
        }
      ]
    },
    'employees': {
      title: 'Gestão de Funcionários',
      content: [
        {
          title: 'Cadastro de Funcionários',
          text: 'Para cadastrar novo funcionário:\n1. Acesse "Funcionários"\n2. Clique em "Adicionar Funcionário"\n3. Preencha os dados:\n   - Nome completo\n   - Função\n   - Setor\n   - Nível de acesso\n4. Salve o cadastro'
        },
        {
          title: 'Permissões e Acessos',
          text: 'Níveis de acesso:\n- Nível 1: Funcionário (acesso básico)\n- Nível 2: Supervisor (acesso intermediário)\n- Nível 3: Administrador (acesso total)'
        }
      ]
    },
    'reports': {
      title: 'Relatórios e Histórico',
      content: [
        {
          title: 'Histórico de Empréstimos',
          text: 'Acesse informações sobre:\n- Empréstimos realizados\n- Data de retirada e devolução\n- Responsável pelo empréstimo\n- Status das ferramentas'
        },
        {
          title: 'Relatórios de Inventário',
          text: 'Visualize:\n- Status atual do estoque\n- Ferramentas mais utilizadas\n- Itens danificados ou perdidos\n- Necessidades de compra'
        }
      ]
    }
  };

  const filterContent = (content) => {
    if (!searchTerm) return content;
    
    const filtered = {};
    Object.entries(content).forEach(([key, section]) => {
      const filteredContent = section.content.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.text.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      if (filteredContent.length > 0) {
        filtered[key] = {
          ...section,
          content: filteredContent
        };
      }
    });
    
    return filtered;
  };

  const filteredContent = filterContent(supportContent);

  const toggleModal = () => setIsOpen(!isOpen);

  return (
    <>
      <button
        onClick={toggleModal}
        className="flex items-center justify-center w-10 h-10 p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        title="Ajuda"
      >
        <HelpCircle className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={toggleModal} />

            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Suporte
                </h3>
                <button
                  onClick={toggleModal}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6">
                {/* Barra de pesquisa */}
                <div className="relative mb-6">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Pesquisar no guia de suporte..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Conteúdo */}
                <div className="space-y-4">
                  {Object.entries(filteredContent).map(([key, section]) => (
                    <div
                      key={key}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                    >
                      <div className="p-4 bg-white dark:bg-gray-800">
                        <div className="flex items-center gap-2">
                          <Book className="w-5 h-5 text-blue-500" />
                          <span className="font-medium text-gray-900 dark:text-white">
                            {section.title}
                          </span>
                        </div>
                              
                        <div className="mt-4 space-y-4">
                          {section.content.map((item, index) => (
                            <div key={index} className="space-y-2">
                              <h3 className="font-medium text-gray-900 dark:text-white">
                                {item.title}
                              </h3>
                              <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">
                                {item.text}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SupportTab;
