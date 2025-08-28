import React from 'react';
import { Clock, Check, CalendarClock, Users, Play, X } from 'lucide-react';
import { twitterThemeConfig } from '../../styles/twitterThemeConfig';
import { formatarData } from '../../utils/dateUtils';
import { useAuth } from '../../hooks/useAuth';
import { NIVEIS_PERMISSAO } from '../../constants/permissoes';

const ListaTarefas = ({ tarefas, atualizarTarefa, removerTarefa, readonly = false, funcionarios = [] }) => {
  const { colors, classes } = twitterThemeConfig;
  const { usuario } = useAuth();
  
  const getPrioridadeClasses = (prioridade) => {
    const classes = {
      baixa: 'bg-[#1D9BF0] bg-opacity-10 text-[#1D9BF0]',
      normal: 'bg-[#8899A6] bg-opacity-10 text-[#8899A6]',
      alta: 'bg-[#FFD700] bg-opacity-10 text-[#FFD700]',
      urgente: 'bg-[#F4212E] bg-opacity-10 text-[#F4212E]'
    };
    return classes[prioridade] || classes.normal;
  };

  const getStatusClasses = (status) => {
    const classes = {
      pendente: 'bg-[#FFD700] bg-opacity-10 text-[#FFD700]',
      'em-andamento': 'bg-[#1D9BF0] bg-opacity-10 text-[#1D9BF0]',
      concluida: 'bg-[#00BA7C] bg-opacity-10 text-[#00BA7C]',
      cancelada: 'bg-[#F4212E] bg-opacity-10 text-[#F4212E]'
    };
    return classes[status] || classes.pendente;
  };

  return (
      <div className={classes.card}>
      <div className="p-6">
        <h3 className={`text-lg font-medium ${colors.text} mb-4`}>Lista de Tarefas</h3>
        <div className="space-y-4">
          {tarefas.map((tarefa) => (
            <div
              key={tarefa.id}
              className={`${classes.cardHover} p-4`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className={`text-lg font-medium ${colors.text} truncate`}>
                      {tarefa.titulo}
                    </h4>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPrioridadeClasses(tarefa.prioridade)}`}>
                      {tarefa.prioridade.charAt(0).toUpperCase() + tarefa.prioridade.slice(1)}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusClasses(tarefa.status)}`}>
                      {tarefa.status.charAt(0).toUpperCase() + tarefa.status.slice(1)}
                    </span>
                  </div>
                  
                  <p className={`text-sm ${colors.textSecondary} mb-4`}>
                    {tarefa.descricao}
                  </p>
                  
                  <div className={`flex flex-wrap gap-4 text-sm ${colors.textSecondary}`}>
                    {tarefa.prazo && (
                      <div className="flex items-center gap-1">
                        <CalendarClock className="w-4 h-4" />
                        <span>Prazo: {formatarData(tarefa.prazo)}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>
                        Responsáveis: {tarefa.responsaveis.map(id => {
                          const funcionario = funcionarios?.find(f => f.id === id);
                          return funcionario ? funcionario.nome : 'Não encontrado';
                        }).join(', ')}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>Criado em: {formatarData(tarefa.dataCriacao)}</span>
                    </div>

                    {tarefa.dataInicio && (
                      <div className="flex items-center gap-1">
                        <Play className="w-4 h-4" />
                        <span>Iniciado em: {formatarData(tarefa.dataInicio)}</span>
                      </div>
                    )}

                    {tarefa.dataConclusao && (
                      <div className="flex items-center gap-1">
                        <Check className="w-4 h-4" />
                        <span>Concluído em: {formatarData(tarefa.dataConclusao)}</span>
                      </div>
                    )}

                    {tarefa.dataCancelamento && (
                      <div className="flex items-center gap-1">
                        <X className="w-4 h-4" />
                        <span>Cancelado em: {formatarData(tarefa.dataCancelamento)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Botões de ação */}
                {tarefa.status !== 'concluida' && tarefa.status !== 'cancelada' && (
                  <div className="flex items-center gap-2">
                    {/* Botão de Iniciar - Apenas responsáveis podem iniciar */}
                    {tarefa.status === 'pendente' && tarefa.responsaveis.includes(usuario.id) && (
                      <button
                        onClick={() => atualizarTarefa(tarefa.id, 'em-andamento')}
                        className={`p-2 ${colors.info} hover:${colors.infoHover} rounded-full transition-colors`}
                        title="Iniciar tarefa"
                      >
                        <Play className="w-5 h-5" />
                      </button>
                    )}

                    {/* Botão de Concluir - Apenas responsáveis podem concluir */}
                    {tarefa.status === 'em-andamento' && tarefa.responsaveis.includes(usuario.id) && (
                      <button
                        onClick={() => atualizarTarefa(tarefa.id, 'concluida')}
                        className={`p-2 ${colors.success} hover:${colors.successHover} rounded-full transition-colors`}
                        title="Concluir tarefa"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                    )}

                    {/* Botão de Cancelar - Apenas supervisores podem cancelar */}
                    {usuario.nivel >= NIVEIS_PERMISSAO.SUPERVISOR && (
                      <button
                        onClick={() => atualizarTarefa(tarefa.id, 'cancelada')}
                        className={`p-2 ${colors.danger} hover:${colors.dangerHover} rounded-full transition-colors`}
                        title="Cancelar tarefa"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                    </div>
                  )}
              </div>
            </div>
          ))}

          {tarefas.length === 0 && (
            <div className={`text-center py-8 ${colors.textSecondary}`}>
              Nenhuma tarefa encontrada
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ListaTarefas;
