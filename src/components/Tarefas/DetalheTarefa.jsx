import React, { useState } from 'react';
import { Check, X, Clock, Star, Trash2, MessageSquare, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { hasSupervisionPermission, NIVEIS_PERMISSAO } from '../../constants/permissoes';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../ToastProvider';
import ConfirmDialog from '../common/ConfirmDialog';

const DetalheTarefa = ({ tarefa, onClose, onConcluir, readOnly = false }) => {
  const { usuario } = useAuth();
  const { showToast } = useToast();
  const [tempoDecorrido, setTempoDecorrido] = React.useState(0);
  const [showConfirmDelete, setShowConfirmDelete] = React.useState(false);

  React.useEffect(() => {
    if (!tarefa.dataInicio || tarefa.status !== 'em_andamento') {
      return;
    }

    const calcularTempoDecorrido = () => {
      const inicioData = new Date(tarefa.dataInicio);
      let tempo = new Date() - inicioData;
      
      // Subtrair tempo de pausas anteriores
      if (tarefa.tempoPausado) {
        tempo -= tarefa.tempoPausado;
      }
      
      return tempo;
    };

    setTempoDecorrido(calcularTempoDecorrido());

    // Atualizar a cada segundo
    const interval = setInterval(() => {
      setTempoDecorrido(calcularTempoDecorrido());
    }, 1000);

    return () => clearInterval(interval);
  }, [tarefa]);

  const handleDeletarTarefa = async () => {
    if (usuario.nivel < NIVEIS_PERMISSAO.SUPERVISOR) return;
    setShowConfirmDelete(true);
  };

  const confirmarExclusao = async () => {
    try {
      await deleteDoc(doc(db, 'tarefas', tarefa.id));
      showToast('Tarefa excluída com sucesso!', 'success');
      onClose();
    } catch (error) {
      console.error('Erro ao excluir tarefa:', error);
      showToast('Erro ao excluir tarefa', 'error');
    }
    setShowConfirmDelete(false);
  };

  // Função para formatar data
  const formatarData = (dataString) => {
    if (!dataString) return '-';
    const data = new Date(dataString);
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(data);
  };

  // Função para formatar tempo
  const formatarTempo = (ms) => {
    if (!ms) return '-';
    const segundos = Math.floor(ms / 1000);
    const minutos = Math.floor(segundos / 60);
    const horas = Math.floor(minutos / 60);
    
    if (horas > 0) {
      return `${horas}h ${minutos % 60}m`;
    } else if (minutos > 0) {
      return `${minutos}m ${segundos % 60}s`;
    } else {
      return `${segundos}s`;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 pb-24 md:pb-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl relative max-h-[calc(100vh-12rem)] md:max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{tarefa.titulo}</h2>
          <div className="flex items-center gap-2">
            {/* Botões de ação apenas se não estiver em modo somente leitura */}
            {!readOnly && (
              <>
                {/* Botão de concluir para funcionários e supervisores */}
                {usuario.nivel >= NIVEIS_PERMISSAO.FUNCIONARIO && tarefa.status !== 'concluida' && (
                  <button
                    onClick={() => onConcluir?.(tarefa)}
                    className="px-4 py-2 bg-blue-500 dark:bg-[#1D9BF0] text-gray-900 dark:text-white rounded-full hover:bg-blue-600 dark:hover:bg-[#1a8cd8] transition-colors flex items-center gap-2"
                  >
                    <Star className="w-4 h-4" />
                    Concluir e Avaliar
                  </button>
                )}
                
                {/* Botão de excluir para supervisores */}
                {hasSupervisionPermission(usuario.nivel) && (
                  <button
                    onClick={handleDeletarTarefa}
                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-full transition-colors"
                    title="Excluir tarefa"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-white/10 rounded-full transition-colors"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Status e Prioridade */}
          <div className="flex flex-wrap gap-3">
            <span
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                tarefa.status === 'pendente'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : tarefa.status === 'em_andamento'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 text-white'
                  : tarefa.status === 'pausada'
                  ? 'bg-gray-100 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300'
                  : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
              }`}
            >
              {tarefa.status === 'pendente'
                ? 'Pendente'
                : tarefa.status === 'em_andamento'
                ? 'Em Andamento'
                : tarefa.status === 'pausada'
                ? 'Pausada'
                : 'Concluída'}
            </span>
            <span className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-1.5 ${
              tarefa.prioridade === 'alta'
                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-700'
                : tarefa.prioridade === 'media' || tarefa.prioridade === 'média'
                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-700'
                : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700'
            }`}>
              Prioridade {tarefa.prioridade.charAt(0).toUpperCase() + tarefa.prioridade.slice(1)}
            </span>
          </div>

          {/* Descrição */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Descrição</h3>
            <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
              {tarefa.descricao.split(/(@\w+)/).map((parte, index) => {
                if (parte.startsWith('@')) {
                  return (
                    <span key={index} className="text-blue-600 dark:text-[#60A5FA]">
                      {parte}
                    </span>
                  );
                }
                return parte;
              })}
            </p>
          </div>

          {/* Criado Por */}
          {tarefa.criadoPor && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Criado por</h3>
              <div className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 border-2 border-blue-400 dark:border-blue-500 rounded-full text-white text-sm font-bold shadow-md">
                {tarefa.criadoPor.fotoUrl ? (
                  <img 
                    src={tarefa.criadoPor.fotoUrl} 
                    alt={tarefa.criadoPor.nome} 
                    className="w-5 h-5 rounded-full object-cover border-2 border-white"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center border-2 border-white">
                    <User className="w-3 h-3" />
                  </div>
                )}
                {tarefa.criadoPor.nome}
              </div>
            </div>
          )}

          {/* Datas e Tempo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Datas</h3>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-gray-500 dark:text-gray-400">Criação: </span>
                  <span className="text-gray-900 dark:text-white">{formatarData(tarefa.dataCriacao)}</span>
                </p>
                {tarefa.dataInicio && (
                  <p>
                    <span className="text-gray-500 dark:text-gray-400">Início: </span>
                    <span className="text-gray-900 dark:text-white">{formatarData(tarefa.dataInicio)}</span>
                  </p>
                )}
                {tarefa.status === 'concluida' && (
                  <p>
                    <span className="text-gray-500 dark:text-gray-400">Conclusão: </span>
                    <span className="text-gray-900 dark:text-white">{formatarData(tarefa.dataConclusao)}</span>
                  </p>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                {tarefa.status === 'concluida' ? 'Tempo Total' : 'Tempo Decorrido'}
              </h3>
              <p className="text-gray-900 dark:text-white">
                {tarefa.status === 'concluida' 
                  ? formatarTempo(tarefa.tempoTotal)
                  : tarefa.status === 'em_andamento'
                  ? formatarTempo(tempoDecorrido)
                  : formatarTempo(tarefa.tempoPausado || 0)
                }
              </p>
            </div>
          </div>

          {/* Funcionários */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Funcionários Atribuídos</h3>
            <div className="flex flex-wrap gap-2 mb-2">
              {tarefa.funcionarios?.map((func) => (
                <span
                  key={func.nome}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 border-2 border-blue-400 dark:border-blue-500 px-3 py-2 rounded-full text-white text-sm font-bold shadow-md"
                >
                  {func.fotoUrl ? (
                    <img 
                      src={func.fotoUrl} 
                      alt={func.nome || 'Funcionário'} 
                      className="w-6 h-6 rounded-full object-cover border-2 border-white"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center border-2 border-white">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  )}
                  {func.nome}
                </span>
              ))}
            </div>
          </div>

          {/* Avaliações */}
          {tarefa.status === 'concluida' && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Avaliações</h3>
              
              {/* Avaliação do Funcionário */}
              {tarefa.avaliacaoFuncionario && (
                <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4">
                  <div className="text-gray-500 dark:text-gray-400 text-sm mb-2">Avaliação do Funcionário</div>
                  <div className="flex items-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((estrela) => (
                      <Star
                        key={estrela}
                        className={`w-5 h-5 ${
                          estrela <= tarefa.avaliacaoFuncionario
                            ? 'text-yellow-500 fill-yellow-500'
                            : 'text-[#38444D]'
                        }`}
                      />
                    ))}
                  </div>
                  {tarefa.comentarioFuncionario && (
                    <p className="text-white text-sm">{tarefa.comentarioFuncionario}</p>
                  )}
                </div>
              )}

              {/* Avaliação do Supervisor - Visível apenas para níveis acima de funcionário */}
              {tarefa.avaliacaoSupervisor && usuario.nivel > NIVEIS_PERMISSAO.FUNCIONARIO && (
                <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4">
                  <div className="text-gray-500 dark:text-gray-400 text-sm mb-2">Avaliação do Supervisor</div>
                  <div className="flex items-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((estrela) => (
                      <Star
                        key={estrela}
                        className={`w-5 h-5 ${
                          estrela <= tarefa.avaliacaoSupervisor
                            ? 'text-yellow-500 fill-yellow-500'
                            : 'text-[#38444D]'
                        }`}
                      />
                    ))}
                  </div>
                  {tarefa.comentarioSupervisor && (
                    <p className="text-white text-sm">{tarefa.comentarioSupervisor}</p>
                  )}
                </div>
              )}

              {/* Botão para Supervisor Avaliar */}
              {hasSupervisionPermission(usuario.nivel) && !tarefa.avaliacaoSupervisor && (
                <button
                  onClick={() => onConcluir?.(tarefa)}
                  className="w-full px-4 py-2 bg-blue-500 dark:bg-[#1D9BF0] text-gray-900 dark:text-white rounded-full hover:bg-blue-600 dark:hover:bg-[#1a8cd8] transition-colors flex items-center justify-center gap-2 mt-4"
                >
                  <Star className="w-4 h-4" />
                  Avaliar Desempenho
                </button>
              )}
            </div>
          )}
        </div>

        {/* Diálogo de confirmação de exclusão */}
        <ConfirmDialog
          isOpen={showConfirmDelete}
          title="Excluir Tarefa"
          message="Tem certeza que deseja excluir esta tarefa? Esta ação não pode ser desfeita."
          onConfirm={confirmarExclusao}
          onCancel={() => setShowConfirmDelete(false)}
        />
      </div>
    </div>
  );
};

export default DetalheTarefa;

