import React, { useState } from 'react';
import { Users, ClipboardCheck, Calendar } from 'lucide-react';
import FuncionariosTab from './FuncionariosTab';
import TarefasTab from '../Tarefas/TarefasTab';
import EscalaPage from '../../pages/Escala/EscalaPage';
import { useAuth } from '../../hooks/useAuth';
import { NIVEIS_PERMISSAO, PermissionChecker } from '../../constants/permissoes';
import PermissionDenied from '../common/PermissionDenied';

/**
 * Componente unificado para gerenciamento de funcionários, tarefas e escala
 * Integra três funcionalidades em uma interface com abas:
 * - Funcionários: gerenciamento de colaboradores
 * - Tarefas: atribuição e acompanhamento de tarefas
 * - Escala: gestão de horários e turnos de trabalho
 */
const GerenciamentoFuncionarios = ({
  // Props de Funcionários
  funcionarios,
  adicionarFuncionario,
  removerFuncionario,
  atualizarFuncionario,
  readonly
}) => {
  const [abaAtiva, setAbaAtiva] = useState('funcionarios');
  const { usuario } = useAuth();

  // Função auxiliar para permissão de supervisão
  const hasSupervisionPermission = (nivel) => {
    if (nivel === NIVEIS_PERMISSAO.ADMIN) return true;
    if (nivel === NIVEIS_PERMISSAO.FUNCIONARIO) return false;
    return nivel <= NIVEIS_PERMISSAO.SUPERVISOR;
  };

  // Determinar quais abas exibir baseado no nível do usuário
  const abas = [
    {
      id: 'funcionarios',
      nome: 'Funcionários',
      icone: Users,
      descricao: 'Gerencie colaboradores e suas informações',
      permissao: () => PermissionChecker.canView(usuario?.nivel)
    },
    {
      id: 'tarefas',
      nome: 'Tarefas',
      icone: ClipboardCheck,
      descricao: 'Atribua e acompanhe tarefas dos funcionários',
      permissao: () => PermissionChecker.canView(usuario?.nivel)
    },
    {
      id: 'escala',
      nome: 'Escala',
      icone: Calendar,
      descricao: 'Gerencie horários e turnos de trabalho',
      permissao: () => hasSupervisionPermission(usuario?.nivel)
    }
  ].filter(aba => aba.permissao());

  // Renderizar conteúdo baseado na aba ativa
  const renderConteudo = () => {
    switch (abaAtiva) {
      case 'funcionarios':
        return PermissionChecker.canView(usuario?.nivel) ? (
          <FuncionariosTab
            funcionarios={funcionarios}
            adicionarFuncionario={adicionarFuncionario}
            removerFuncionario={removerFuncionario}
            atualizarFuncionario={atualizarFuncionario}
            readonly={!PermissionChecker.canManageEmployees(usuario?.nivel)}
          />
        ) : (
          <PermissionDenied message="Você não tem permissão para visualizar os funcionários." />
        );

      case 'tarefas':
        return PermissionChecker.canView(usuario?.nivel) ? (
          <TarefasTab 
            showOnlyUserTasks={usuario?.nivel === NIVEIS_PERMISSAO.FUNCIONARIO}
          />
        ) : (
          <PermissionDenied message="Você não tem permissão para visualizar as tarefas." />
        );

      case 'escala':
        return hasSupervisionPermission(usuario?.nivel) ? (
          <EscalaPage usuarioAtual={usuario} />
        ) : (
          <PermissionDenied message="Você não tem permissão para visualizar a escala de trabalho." />
        );

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
              <Users className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                Gestão de Funcionários
              </h1>
              <p className="text-blue-100 text-sm md:text-base">
                Gerencie colaboradores, tarefas e escalas em um só lugar
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navegação por abas */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
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

export default GerenciamentoFuncionarios;
