import React, { useState } from 'react';
import { Package, ClipboardList, User, FileText } from 'lucide-react';
import MeuInventarioTab from './MeuInventarioTab';
import InventarioTab from './InventarioTab';
import EmprestimosTab from '../Emprestimos/EmprestimosTab';
import ComprovantesTab from '../Comprovantes/ComprovantesTab';
import { FuncionariosProvider } from '../Funcionarios/FuncionariosProvider';
import { useAuth } from '../../hooks/useAuth';
import { NIVEIS_PERMISSAO, PermissionChecker } from '../../constants/permissoes';

/**
 * Componente unificado para gerenciamento de inventário e empréstimos
 * Integra três funcionalidades em uma interface com abas:
 * - Histórico de Empréstimos: visualização pessoal das ferramentas emprestadas
 * - Inventário Geral: gestão completa do estoque (compras, danificadas, perdidas)
 * - Empréstimos: registro e controle de empréstimos de ferramentas
 */
const GerenciamentoInventario = ({
  // Props de Inventário
  inventario,
  emprestimos,
  adicionarItem,
  removerItem,
  atualizarItem,
  reimportarInventario,
  corrigirInventario,
  obterDetalhesEmprestimos,
  // Props de Compras
  compras,
  adicionarCompra,
  removerCompra,
  atualizarCompra,
  // Props de Ferramentas Danificadas
  ferramentasDanificadas,
  adicionarFerramentaDanificada,
  atualizarFerramentaDanificada,
  removerFerramentaDanificada,
  // Props de Ferramentas Perdidas
  ferramentasPerdidas,
  adicionarFerramentaPerdida,
  atualizarFerramentaPerdida,
  removerFerramentaPerdida,
  // Props de Empréstimos
  funcionarios,
  adicionarEmprestimo,
  removerEmprestimo,
  atualizarEmprestimo,
  devolverFerramentas,
  emprestimosCarregados
}) => {
  const [abaAtiva, setAbaAtiva] = useState('emprestimos');
  const { usuario } = useAuth();

  // Determinar quais abas exibir baseado no nível do usuário
  const abas = [
    {
      id: 'emprestimos',
      nome: 'Empréstimos',
      icone: User,
      descricao: 'Registre e controle empréstimos de ferramentas',
      permissao: () => {
        // Admin sempre pode
        if (usuario?.nivel === NIVEIS_PERMISSAO.ADMIN) return true;
        // Funcionários não podem gerenciar empréstimos
        if (usuario?.nivel === NIVEIS_PERMISSAO.FUNCIONARIO) return false;
        // Supervisores e acima podem
        return usuario?.nivel <= NIVEIS_PERMISSAO.GERENTE_SETOR;
      }
    },
    {
      id: 'inventario-geral',
      nome: 'Inventário Geral',
      icone: Package,
      descricao: 'Gerencie o estoque completo de ferramentas',
      permissao: () => {
        // Admin sempre pode
        if (usuario?.nivel === NIVEIS_PERMISSAO.ADMIN) return true;
        // Funcionários não podem ver
        if (usuario?.nivel === NIVEIS_PERMISSAO.FUNCIONARIO) return false;
        // Supervisores e acima podem
        return usuario?.nivel <= NIVEIS_PERMISSAO.GERENTE_SETOR;
      }
    },
    {
      id: 'comprovantes',
      nome: 'Comprovantes',
      icone: FileText,
      descricao: 'Visualize e gere comprovantes de empréstimos e tarefas',
      permissao: () => true // Todos podem ver comprovantes
    },
    {
      id: 'historico-emprestimos',
      nome: 'Histórico de Empréstimos',
      icone: ClipboardList,
      descricao: 'Consulte o histórico completo de empréstimos realizados',
      permissao: () => true // Todos podem ver seu próprio histórico
    }
  ].filter(aba => aba.permissao());

  // Renderizar conteúdo baseado na aba ativa
  const renderConteudo = () => {
    switch (abaAtiva) {
      case 'historico-emprestimos':
        return (
          <MeuInventarioTab
            emprestimos={emprestimosCarregados ? emprestimos : null}
          />
        );

      case 'inventario-geral':
        return (
          <InventarioTab
            inventario={inventario}
            emprestimos={emprestimos}
            adicionarItem={adicionarItem}
            removerItem={removerItem}
            atualizarItem={atualizarItem}
            reimportarInventario={reimportarInventario}
            corrigirInventario={corrigirInventario}
            obterDetalhesEmprestimos={obterDetalhesEmprestimos}
            compras={compras}
            funcionarios={funcionarios}
            adicionarCompra={adicionarCompra}
            removerCompra={removerCompra}
            atualizarCompra={atualizarCompra}
            ferramentasDanificadas={ferramentasDanificadas}
            adicionarFerramentaDanificada={adicionarFerramentaDanificada}
            atualizarFerramentaDanificada={atualizarFerramentaDanificada}
            removerFerramentaDanificada={removerFerramentaDanificada}
            ferramentasPerdidas={ferramentasPerdidas}
            adicionarFerramentaPerdida={adicionarFerramentaPerdida}
            atualizarFerramentaPerdida={atualizarFerramentaPerdida}
            removerFerramentaPerdida={removerFerramentaPerdida}
          />
        );

      case 'emprestimos':
        return (
          <FuncionariosProvider>
            <EmprestimosTab
              emprestimos={emprestimos}
              inventario={inventario}
              funcionarios={funcionarios}
              adicionarEmprestimo={adicionarEmprestimo}
              removerEmprestimo={removerEmprestimo}
              atualizarEmprestimo={atualizarEmprestimo}
              devolverFerramentas={devolverFerramentas}
              readonly={!PermissionChecker.canManageOperational(usuario?.nivel)}
            />
          </FuncionariosProvider>
        );

      case 'comprovantes':
        return <ComprovantesTab />;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      {/* Header com título e descrição */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Package className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                Inventário & Empréstimos
              </h1>
              <p className="text-blue-100 text-sm md:text-base">
                Gerencie ferramentas, estoque e empréstimos em um só lugar
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navegação por abas */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-2">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
            {abas.map((aba) => {
              const IconeAba = aba.icone;
              const isAtiva = abaAtiva === aba.id;
              
              return (
                <button
                  key={aba.id}
                  onClick={() => setAbaAtiva(aba.id)}
                  className={`
                    flex items-center gap-3 p-4 rounded-lg transition-all duration-200
                    ${isAtiva
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg scale-105'
                      : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }
                  `}
                >
                  <div className={`
                    p-2 rounded-lg
                    ${isAtiva
                      ? 'bg-white/20'
                      : 'bg-white dark:bg-gray-600'
                    }
                  `}>
                    <IconeAba className={`w-5 h-5 ${isAtiva ? 'text-white' : 'text-blue-600 dark:text-blue-400'}`} />
                  </div>
                  <div className="text-left flex-1">
                    <div className={`font-semibold ${isAtiva ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                      {aba.nome}
                    </div>
                    <div className={`text-xs ${isAtiva ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
                      {aba.descricao}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Conteúdo da aba ativa */}
      <div className="max-w-7xl mx-auto">
        {renderConteudo()}
      </div>
    </div>
  );
};

export default GerenciamentoInventario;
