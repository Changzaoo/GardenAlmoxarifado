import React, { useState, useEffect, useRef } from 'react';
import { Users, Edit, Trash2, Hammer, Gauge, Clock, UserX, UserCheck, MoreVertical, Mail, Phone, Award, TrendingUp, CheckCircle2, Briefcase } from 'lucide-react';
import AvaliacoesCard from './AvaliacoesCard';
import InformacoesContato from './InformacoesContato';

const CardFuncionario = ({
  funcionario: func,
  funcionariosStats,
  funcionariosPontos,
  isFuncionario,
  readonly,
  avaliacoesExpandidas,
  avaliacoesDesempenhoExpandidas,
  setAvaliacoesExpandidas,
  setAvaliacoesDesempenhoExpandidas,
  handleEditar,
  confirmarExclusao,
  calcularMediaAvaliacoesDesempenho,
  onClick,
  demitirFuncionario,
  reintegrarFuncionario,
  filtroAtual
}) => {
  const [menuAberto, setMenuAberto] = useState(false);
  const menuRef = useRef(null);

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuAberto(false);
      }
    };

    if (menuAberto) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuAberto]);

  // Função para calcular a média das avaliações (retorna o tipo e a média)
  const calcularMedia = (avaliacoes) => {
    // Verificar se existem avaliações
    if (!avaliacoes || !Array.isArray(avaliacoes) || avaliacoes.length === 0) {
      return { tipo: null, media: 0 };
    }
    
    // Separar avaliações por tipo
    const avaliacoesDesempenho = avaliacoes.filter(av => 
      av.tipo === 'desempenho' || av.tipo === 'avaliacao_supervisor'
    );
    const avaliacoesTarefas = avaliacoes.filter(av => 
      (av.tipo === 'regular' || av.tipoAvaliacao === 'tarefa') && av.tipo !== 'avaliacao_supervisor'
    );
    
    // Calcular médias individuais
    const mediaDesempenho = avaliacoesDesempenho.length > 0
      ? avaliacoesDesempenho.reduce((sum, av) => sum + (av.estrelas || av.nota || 0), 0) / avaliacoesDesempenho.length
      : 0;
    
    const mediaTarefas = avaliacoesTarefas.length > 0
      ? avaliacoesTarefas.reduce((sum, av) => sum + (av.nota || 0), 0) / avaliacoesTarefas.length
      : 0;
    
    // Retornar média do tipo que existe
    if (avaliacoesDesempenho.length === 0 && avaliacoesTarefas.length > 0) {
      return { tipo: 'tarefas', media: mediaTarefas };
    }
    if (avaliacoesTarefas.length === 0 && avaliacoesDesempenho.length > 0) {
      return { tipo: 'desempenho', media: mediaDesempenho };
    }
    if (avaliacoesDesempenho.length === 0 && avaliacoesTarefas.length === 0) {
      return { tipo: null, media: 0 };
    }
    
    // Se tem os dois tipos, retorna a média de desempenho
    return { 
      tipo: 'geral', 
      media: mediaDesempenho
    };
  };
  return (
    <div 
      key={func.id} 
      className={`group relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300 hover:shadow-2xl ${
        func.demitido && filtroAtual !== 'demitidos' ? 'opacity-60' : ''
      }`}
    >
      {/* Barra lateral colorida de status */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${
        func.demitido ? 'bg-red-500' : 'bg-gradient-to-b from-blue-500 via-blue-600 to-blue-700'
      }`} />

      <div className="pl-5 pr-4 py-5">
        {/* Header Section */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            {/* Avatar profissional */}
            <div className="relative flex-shrink-0">
              {func.photoURL ? (
                <img 
                  src={func.photoURL} 
                  alt={func.nome} 
                  className="w-16 h-16 rounded-xl object-cover ring-2 ring-gray-200 dark:ring-gray-700 shadow-sm"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm ring-2 ring-gray-200 dark:ring-gray-700">
                  <span className="text-white text-xl font-bold">
                    {func.nome?.charAt(0)?.toUpperCase() || 'F'}
                  </span>
                </div>
              )}
              {func.demitido && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
                  <UserX className="w-3 h-3 text-white" />
                </div>
              )}
            </div>

            {/* Info Principal */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <h3 
                  className="text-lg font-semibold text-gray-900 dark:text-white truncate cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClick();
                  }}
                  title="Ver perfil completo"
                >
                  {func.nome}
                </h3>
                {func.demitido && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                    Inativo
                  </span>
                )}
              </div>
              
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                    {func.cargo || 'Cargo não definido'}
                  </p>
                </div>
                {func.matricula && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                      ID: {func.matricula}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Menu de Ações */}
          {!isFuncionario && !readonly && (
            <div className="relative flex-shrink-0" ref={menuRef}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuAberto(!menuAberto);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Opções"
              >
                <MoreVertical className="w-5 h-5" />
              </button>

              {menuAberto && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl py-1.5 z-50">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuAberto(false);
                      handleEditar(func);
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex items-center gap-3"
                  >
                    <Edit className="w-4 h-4 text-blue-500" />
                    <span>Editar</span>
                  </button>

                  <div className="h-px bg-gray-200 dark:bg-gray-700 my-1.5"></div>

                  {func.demitido ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuAberto(false);
                        reintegrarFuncionario(func);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors flex items-center gap-3"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Reintegrar</span>
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuAberto(false);
                        demitirFuncionario(func);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors flex items-center gap-3"
                    >
                      <UserX className="w-4 h-4" />
                      <span>Demitir</span>
                    </button>
                  )}

                  <div className="h-px bg-gray-200 dark:bg-gray-700 my-1.5"></div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuAberto(false);
                      confirmarExclusao(func);
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-3"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Excluir</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Stats Grid - Design Corporativo */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {/* Performance Score */}
          {(() => {
            const avaliacoesDesempenho = funcionariosStats[func.id]?.avaliacoes?.filter(av => 
              av.tipo === 'desempenho' || av.tipo === 'avaliacao_supervisor'
            ) || [];
            const media = avaliacoesDesempenho.length > 0
              ? (avaliacoesDesempenho.reduce((sum, av) => sum + (av.estrelas || av.nota || 0), 0) / avaliacoesDesempenho.length).toFixed(1)
              : '0';
            
            const mediaNum = parseFloat(media);
            let bgColor = '';
            let textColor = '';
            let iconColor = '';
            
            if (mediaNum >= 4.5) {
              bgColor = 'bg-emerald-50 dark:bg-emerald-900/20';
              textColor = 'text-emerald-700 dark:text-emerald-400';
              iconColor = 'text-emerald-600 dark:text-emerald-500';
            } else if (mediaNum >= 3.5) {
              bgColor = 'bg-blue-50 dark:bg-blue-900/20';
              textColor = 'text-blue-700 dark:text-blue-400';
              iconColor = 'text-blue-600 dark:text-blue-500';
            } else if (mediaNum >= 2.5) {
              bgColor = 'bg-amber-50 dark:bg-amber-900/20';
              textColor = 'text-amber-700 dark:text-amber-400';
              iconColor = 'text-amber-600 dark:text-amber-500';
            } else if (mediaNum > 0) {
              bgColor = 'bg-red-50 dark:bg-red-900/20';
              textColor = 'text-red-700 dark:text-red-400';
              iconColor = 'text-red-600 dark:text-red-500';
            } else {
              bgColor = 'bg-gray-50 dark:bg-gray-700/50';
              textColor = 'text-gray-600 dark:text-gray-400';
              iconColor = 'text-gray-500 dark:text-gray-500';
            }

            return (
              <div className={`${bgColor} rounded-lg p-3 border border-gray-200 dark:border-gray-700`}>
                <div className="flex items-center gap-2 mb-1">
                  <Award className={`w-4 h-4 ${iconColor}`} />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Performance</span>
                </div>
                <div className={`text-2xl font-bold ${textColor}`}>{media}</div>
              </div>
            );
          })()}

          {/* Tasks Rating */}
          {(() => {
            const avaliacoesTarefas = funcionariosStats[func.id]?.avaliacoes?.filter(av => av.tipo === 'regular') || [];
            const autoavaliacoesTarefas = funcionariosStats[func.id]?.avaliacoes?.filter(av => av.tipoAvaliacao === 'tarefa') || [];
            
            const mediaRegular = avaliacoesTarefas.length > 0
              ? (avaliacoesTarefas.reduce((sum, av) => sum + (av.nota || 0), 0) / avaliacoesTarefas.length)
              : 0;
              
            const mediaAutoavaliacao = autoavaliacoesTarefas.length > 0
              ? (autoavaliacoesTarefas.reduce((sum, av) => sum + (av.nota || 0), 0) / autoavaliacoesTarefas.length)
              : 0;
            
            const totalAvaliacoes = avaliacoesTarefas.length + autoavaliacoesTarefas.length;
            const media = totalAvaliacoes > 0
              ? ((mediaRegular * avaliacoesTarefas.length + mediaAutoavaliacao * autoavaliacoesTarefas.length) / totalAvaliacoes).toFixed(1)
              : '0';
            
            const mediaNum = parseFloat(media);
            let bgColor = '';
            let textColor = '';
            let iconColor = '';
            
            if (mediaNum >= 4.5) {
              bgColor = 'bg-emerald-50 dark:bg-emerald-900/20';
              textColor = 'text-emerald-700 dark:text-emerald-400';
              iconColor = 'text-emerald-600 dark:text-emerald-500';
            } else if (mediaNum >= 3.5) {
              bgColor = 'bg-blue-50 dark:bg-blue-900/20';
              textColor = 'text-blue-700 dark:text-blue-400';
              iconColor = 'text-blue-600 dark:text-blue-500';
            } else if (mediaNum >= 2.5) {
              bgColor = 'bg-amber-50 dark:bg-amber-900/20';
              textColor = 'text-amber-700 dark:text-amber-400';
              iconColor = 'text-amber-600 dark:text-amber-500';
            } else if (mediaNum > 0) {
              bgColor = 'bg-red-50 dark:bg-red-900/20';
              textColor = 'text-red-700 dark:text-red-400';
              iconColor = 'text-red-600 dark:text-red-500';
            } else {
              bgColor = 'bg-gray-50 dark:bg-gray-700/50';
              textColor = 'text-gray-600 dark:text-gray-400';
              iconColor = 'text-gray-500 dark:text-gray-500';
            }

            return (
              <div className={`${bgColor} rounded-lg p-3 border border-gray-200 dark:border-gray-700`}>
                <div className="flex items-center gap-2 mb-1">
                  <Hammer className={`w-4 h-4 ${iconColor}`} />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Tarefas</span>
                </div>
                <div className={`text-2xl font-bold ${textColor}`}>{media}</div>
              </div>
            );
          })()}

          {/* Completed Tasks */}
          {(() => {
            const tarefasConcluidas = funcionariosStats[func.id]?.tarefasConcluidas || 0;
            return (
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-500" />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Concluídas</span>
                </div>
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">{tarefasConcluidas}</div>
              </div>
            );
          })()}

          {/* In Progress */}
          {(() => {
            const emAndamento = funcionariosStats[func.id]?.tarefasEmAndamento || 0;
            return (
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4 text-amber-600 dark:text-amber-500" />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Andamento</span>
                </div>
                <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">{emAndamento}</div>
              </div>
            );
          })()}
        </div>

        {/* Informações de Contato - Design Minimalista */}
        {(func.telefone || func.email) && (
          <div className="flex flex-wrap gap-4 pt-3 border-t border-gray-200 dark:border-gray-700">
            {func.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">{func.email}</span>
              </div>
            )}
            {func.telefone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">{func.telefone}</span>
              </div>
            )}
          </div>
        )}

        {/* Avaliações Expandíveis */}
        {funcionariosStats[func.id]?.avaliacoes?.length > 0 && (
          <div className="mt-4 space-y-2">
            <AvaliacoesCard 
              avaliacoes={funcionariosStats[func.id].avaliacoes}
              tipo="autoavaliacao"
              avaliacoesExpandidas={avaliacoesExpandidas}
              setAvaliacoesExpandidas={setAvaliacoesExpandidas}
              funcionarioId={`${func.id}-auto`}
              calcularMediaAvaliacoesDesempenho={calcularMediaAvaliacoesDesempenho}
            />

            <AvaliacoesCard 
              avaliacoes={funcionariosStats[func.id].avaliacoes}
              tipo="regular"
              avaliacoesExpandidas={avaliacoesExpandidas}
              setAvaliacoesExpandidas={setAvaliacoesExpandidas}
              funcionarioId={func.id}
              calcularMediaAvaliacoesDesempenho={calcularMediaAvaliacoesDesempenho}
            />

            <AvaliacoesCard 
              avaliacoes={funcionariosStats[func.id].avaliacoes}
              tipo="desempenho"
              avaliacoesExpandidas={avaliacoesDesempenhoExpandidas}
              setAvaliacoesExpandidas={setAvaliacoesDesempenhoExpandidas}
              funcionarioId={func.id}
              calcularMediaAvaliacoesDesempenho={calcularMediaAvaliacoesDesempenho}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default CardFuncionario;



