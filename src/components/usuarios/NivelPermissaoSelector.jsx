import React from 'react';
import { NIVEIS_PERMISSAO, NIVEIS_LABELS, NIVEIS_ICONE } from '../../constants/permissoes';

const NivelPermissaoSelector = ({ 
  nivel, 
  onChange, 
  disabled = false, 
  usuarioLogadoNivel = null,
  showIcon = true,
  showDescription = true 
}) => {
  
  // Função para obter níveis disponíveis baseado nas permissões do usuário logado
  const getNiveisDisponiveis = () => {
    const niveis = [];
    
    // Apenas administradores (nível 0) podem criar/editar outros usuários
    if (usuarioLogadoNivel === NIVEIS_PERMISSAO.ADMIN) {
      // Admin pode criar todos os tipos
      Object.entries(NIVEIS_PERMISSAO).forEach(([key, value]) => {
        niveis.push({
          valor: value,
          label: NIVEIS_LABELS[value],
          icone: NIVEIS_ICONE[value],
          key: key
        });
      });
    }
    
    // Ordenar por valor (0, 1, 2, 3, 4, 5, 6)
    return niveis.sort((a, b) => a.valor - b.valor);
  };

  const niveisDisponiveis = getNiveisDisponiveis();

  // Função para obter descrição do nível
  const getDescricaoNivel = (nivelValue) => {
    const descricoes = {
      [NIVEIS_PERMISSAO.ADMIN]: "👑 Acesso total ao sistema - Todas as permissões",
      [NIVEIS_PERMISSAO.FUNCIONARIO]: "👤 Acesso básico - Operações do dia a dia",
      [NIVEIS_PERMISSAO.SUPERVISOR]: "👔 Supervisiona equipe - Gerencia operações do setor",
      [NIVEIS_PERMISSAO.GERENTE_SETOR]: "📊 Gerencia setor - Controle de funcionários e processos",
      [NIVEIS_PERMISSAO.GERENTE_GERAL]: "🎯 Gerencia múltiplos setores - Visão estratégica",
      [NIVEIS_PERMISSAO.RH]: "💼 Recursos Humanos - Gestão de pessoal",
      [NIVEIS_PERMISSAO.CEO]: "🏆 Diretor Executivo - Liderança organizacional"
    };
    return descricoes[nivelValue] || "Nível desconhecido";
  };

  if (niveisDisponiveis.length === 0) {
    return (
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <p className="text-yellow-800 dark:text-yellow-200 text-sm">
          ⚠️ Você não tem permissão para gerenciar níveis de usuário.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Nível de Permissão *
      </label>
      
      <select
        value={nivel}
        onChange={(e) => onChange(parseInt(e.target.value))}
        disabled={disabled}
        className={`
          w-full px-3 py-2 
          bg-gray-50 dark:bg-gray-700 
          border border-gray-200 dark:border-gray-600 
          rounded-lg 
          text-gray-900 dark:text-white 
          placeholder-gray-500 dark:placeholder-gray-400 
          focus:ring-2 focus:ring-blue-500 focus:border-transparent
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        {niveisDisponiveis.map(nivelOption => (
          <option key={nivelOption.valor} value={nivelOption.valor}>
            {showIcon && nivelOption.icone} {nivelOption.label} (Nível {nivelOption.valor})
          </option>
        ))}
      </select>

      {showDescription && nivel !== null && nivel !== undefined && (
        <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            {getDescricaoNivel(nivel)}
          </p>
        </div>
      )}

      {/* Visualização em cards para melhor UX */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {niveisDisponiveis.map(nivelOption => (
          <div
            key={nivelOption.valor}
            onClick={() => !disabled && onChange(nivelOption.valor)}
            className={`
              p-3 border rounded-lg cursor-pointer transition-all duration-200
              ${nivel === nivelOption.valor 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 ring-2 ring-blue-500' 
                : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-blue-300 hover:bg-blue-25 dark:hover:bg-blue-900/10'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <div className="flex items-center space-x-2">
              <span className="text-2xl">{nivelOption.icone}</span>
              <div>
                <p className="font-medium text-gray-900 dark:text-white text-sm">
                  {nivelOption.label}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Nível {nivelOption.valor}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Informação sobre sistema reversivo */}
      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          💡 <strong>Sistema Reversivo:</strong> Números menores = Maior permissão. 
          Nível 0 (Administrador) tem máxima permissão, Nível 6 (CEO) tem permissões específicas.
        </p>
      </div>
    </div>
  );
};

export default NivelPermissaoSelector;