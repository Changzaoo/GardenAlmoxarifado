import React, { useState } from 'react';
import { Clock, Check, CalendarClock, Users, X } from 'lucide-react';
import { formatarData } from '../../utils/dateUtils';

const ListaTarefas = ({ tarefas, atualizarTarefa, removerTarefa, readonly = false }) => {
  const [modalExclusaoAberto, setModalExclusaoAberto] = useState(false);
  const [tarefaParaExcluir, setTarefaParaExcluir] = useState(null);

  const confirmarExclusao = (tarefa) => {
    setTarefaParaExcluir(tarefa);
    setModalExclusaoAberto(true);
  };

  const handleExcluir = async () => {
    try {
      await removerTarefa(tarefaParaExcluir.id);
      setModalExclusaoAberto(false);
      setTarefaParaExcluir(null);
    } catch (error) {
      console.error('Erro ao excluir tarefa:', error);
    }
  };
  const getPrioridadeClasses = (prioridade) => {
    const classes = {
      baixa: 'bg-blue-100 text-blue-800',
      normal: 'bg-gray-100 text-gray-800',
      alta: 'bg-orange-100 text-orange-800',
      urgente: 'bg-red-100 text-red-800'
    };
    return classes[prioridade] || classes.normal;
  };

  const getStatusClasses = (status) => {
    const classes = {
      pendente: 'bg-yellow-100 text-yellow-800',
      'em-andamento': 'bg-blue-100 text-blue-800',
      concluida: 'bg-green-100 text-green-800',
      cancelada: 'bg-gray-100 text-gray-800'
    };
    return classes[status] || classes.pendente;
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Lista de Tarefas</h3>
        
        <div className="space-y-4">
          {tarefas.map((tarefa) => (
            <div
              key={tarefa.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-lg font-medium text-gray-900 truncate">
                      {tarefa.titulo}
                    </h4>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPrioridadeClasses(tarefa.prioridade)}`}>
                      {tarefa.prioridade.charAt(0).toUpperCase() + tarefa.prioridade.slice(1)}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusClasses(tarefa.status)}`}>
                      {tarefa.status.charAt(0).toUpperCase() + tarefa.status.slice(1)}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-500 mb-4">
                    {tarefa.descricao}
                  </p>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    {tarefa.prazo && (
                      <div className="flex items-center gap-1">
                        <CalendarClock className="w-4 h-4" />
                        <span>Prazo: {formatarData(tarefa.prazo)}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>
                        {tarefa.responsaveis.length} responsável(is)
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>Criado em: {formatarData(tarefa.dataCriacao)}</span>
                    </div>
                  </div>
                </div>

                {!readonly && tarefa.status !== 'concluida' && tarefa.status !== 'cancelada' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => atualizarTarefa(tarefa.id, 'concluida')}
                      className="p-2 text-green-600 hover:text-green-700 transition-colors"
                      title="Marcar como concluída"
                    >
                      <Check className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => confirmarExclusao(tarefa)}
                      className="p-2 text-red-600 hover:text-red-700 transition-colors"
                      title="Cancelar tarefa"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {tarefas.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Nenhuma tarefa encontrada
            </div>
          )}
        </div>
      </div>

      {/* Modal de Confirmação de Exclusão */}
      {modalExclusaoAberto && tarefaParaExcluir && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Confirmar Cancelamento
              </h3>
              <button
                onClick={() => {
                  setModalExclusaoAberto(false);
                  setTarefaParaExcluir(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-600 mb-6">
              Tem certeza que deseja cancelar a tarefa "{tarefaParaExcluir.titulo}"?
              Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setModalExclusaoAberto(false);
                  setTarefaParaExcluir(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Não, manter tarefa
              </button>
              <button
                onClick={handleExcluir}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                Sim, cancelar tarefa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListaTarefas;
