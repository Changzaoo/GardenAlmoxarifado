import React from 'react';
import { X, Star, Trash2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../ToastProvider';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import ConfirmDialog from '../common/ConfirmDialog';

const NIVEIS_PERMISSAO = {
  FUNCIONARIO: 1,
  SUPERVISOR: 2,
  ADMIN: 3
};

const DetalheTarefa = ({ tarefa, onClose }) => {
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#192734] rounded-xl p-6 w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">{tarefa.titulo}</h2>
          <div className="flex items-center gap-2">
            {usuario.nivel >= NIVEIS_PERMISSAO.SUPERVISOR && (
              <button
                onClick={handleDeletarTarefa}
                className="p-2 text-red-500 hover:bg-red-500/10 rounded-full transition-colors"
                title="Excluir tarefa"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-[#8899A6] hover:text-white hover:bg-white/10 rounded-full transition-colors"
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
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                tarefa.status === 'pendente'
                  ? 'bg-yellow-500/10 text-yellow-500'
                  : tarefa.status === 'em_andamento'
                  ? 'bg-blue-500/10 text-blue-500'
                  : tarefa.status === 'pausada'
                  ? 'bg-orange-500/10 text-orange-500'
                  : 'bg-green-500/10 text-green-500'
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
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              tarefa.prioridade === 'alta'
                ? 'bg-red-500/10 text-red-500'
                : tarefa.prioridade === 'media'
                ? 'bg-yellow-500/10 text-yellow-500'
                : 'bg-green-500/10 text-green-500'
            }`}>
              Prioridade {tarefa.prioridade.charAt(0).toUpperCase() + tarefa.prioridade.slice(1)}
            </span>
          </div>

          {/* Descrição */}
          <div>
            <h3 className="text-sm font-medium text-[#8899A6] mb-2">Descrição</h3>
            <p className="text-white">
              {tarefa.descricao.split(/(@\w+)/).map((parte, index) => {
                if (parte.startsWith('@')) {
                  return (
                    <span key={index} className="text-[#60A5FA]">
                      {parte}
                    </span>
                  );
                }
                return parte;
              })}
            </p>
          </div>

          {/* Datas e Tempo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-[#8899A6] mb-2">Datas</h3>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-[#8899A6]">Criação: </span>
                  <span className="text-white">{formatarData(tarefa.dataCriacao)}</span>
                </p>
                <p>
                  <span className="text-[#8899A6]">Início: </span>
                  <span className="text-white">{formatarData(tarefa.dataInicio)}</span>
                </p>
                {tarefa.status === 'concluida' && (
                  <p>
                    <span className="text-[#8899A6]">Conclusão: </span>
                    <span className="text-white">{formatarData(tarefa.dataConclusao)}</span>
                  </p>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-[#8899A6] mb-2">
                {tarefa.status === 'concluida' ? 'Tempo Total' : 'Tempo Decorrido'}
              </h3>
              <p className="text-white">
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
            <h3 className="text-sm font-medium text-[#8899A6] mb-2">Funcionários Atribuídos</h3>
            <div className="flex flex-wrap gap-2">
              {tarefa.funcionarios?.map((func) => (
                <span
                  key={func.id}
                  className="inline-flex items-center px-2 py-1 bg-[#2C3C4C] rounded-full text-sm text-[#E7E9EA]"
                >
                  {func.nome}
                </span>
              ))}
            </div>
          </div>

          {/* Criado por */}
          <div>
            <h3 className="text-sm font-medium text-[#8899A6] mb-2">Criado por</h3>
            <span className="text-white">{tarefa.criadoPor?.nome}</span>
          </div>

          {/* Avaliação e Comentários */}
          {tarefa.status === 'concluida' && (
            <div className="border-t border-[#38444D] pt-4">
              <h3 className="text-sm font-medium text-[#8899A6] mb-2">Avaliação</h3>
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < tarefa.avaliacao
                        ? 'text-yellow-500 fill-yellow-500'
                        : 'text-[#38444D]'
                    }`}
                  />
                ))}
              </div>

              {tarefa.comentarioFuncionario && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-[#8899A6] mb-2">Comentário do Funcionário</h3>
                  <p className="text-white">{tarefa.comentarioFuncionario}</p>
                </div>
              )}

              {tarefa.comentarioSupervisor && (
                <div>
                  <h3 className="text-sm font-medium text-[#8899A6] mb-2">Comentário do Supervisor</h3>
                  <p className="text-white">{tarefa.comentarioSupervisor}</p>
                </div>
              )}
            </div>
          )}
        </div>
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
  );
};

export default DetalheTarefa;
