import React, { useState } from 'react';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { 
  CheckCircle2, 
  PlayCircle, 
  StopCircle,
  AlertCircle,
  MessageSquare,
  Clock,
  User,
  Tag
} from 'lucide-react';
import { 
  ESTADOS_TAREFA, 
  ESTADOS_TAREFA_LABELS, 
  ESTADOS_TAREFA_COLORS,
  PRIORIDADE_TAREFA_COLORS 
} from '../constants/tarefas';
import { formatarData } from '../utils/dateUtils';
import { NIVEIS_PERMISSAO } from './AlmoxarifadoJardim';

const TarefaCard = ({ tarefa, usuario, onEdit }) => {
  const [isAddingObservacao, setIsAddingObservacao] = useState(false);
  const [observacao, setObservacao] = useState('');
  const [expandirObservacoes, setExpandirObservacoes] = useState(false);

  // Verifica se o usuário é o responsável pela tarefa
  const isResponsavel = tarefa.responsavel === usuario.id;
  // Verifica se o usuário é supervisor ou superior
  const isSupervisor = usuario.nivel >= NIVEIS_PERMISSAO.SUPERVISOR;

  const handleStatusChange = async (novoStatus) => {
    try {
      const tarefaRef = doc(db, 'tarefas', tarefa.id);
      const dataAtualizacao = new Date().toISOString();
      
      const atualizacao = {
        status: novoStatus,
        dataAtualizacao,
      };

      // Adicionar datas específicas baseadas no status
      if (novoStatus === ESTADOS_TAREFA.EM_ANDAMENTO) {
        atualizacao.dataInicio = dataAtualizacao;
      } else if (novoStatus === ESTADOS_TAREFA.CONCLUIDA) {
        atualizacao.dataConclusao = dataAtualizacao;
      }

      await updateDoc(tarefaRef, atualizacao);
    } catch (error) {
      console.error('Erro ao atualizar status da tarefa:', error);
      alert('Erro ao atualizar status da tarefa');
    }
  };

  const handleAddObservacao = async () => {
    if (!observacao.trim()) return;

    try {
      const tarefaRef = doc(db, 'tarefas', tarefa.id);
      const novaObservacao = {
        texto: observacao,
        data: new Date().toISOString(),
        usuario: usuario.nome,
        nivel: usuario.nivel,
        usuarioId: usuario.id
      };

      await updateDoc(tarefaRef, {
        observacoes: [...(tarefa.observacoes || []), novaObservacao]
      });

      setObservacao('');
      setIsAddingObservacao(false);
    } catch (error) {
      console.error('Erro ao adicionar observação:', error);
      alert('Erro ao adicionar observação');
    }
  };

  const renderAcoes = () => {
    if (!isResponsavel && !isSupervisor) return null;

    return (
      <div className="flex gap-2 mt-3">
        {isResponsavel && tarefa.status === ESTADOS_TAREFA.PENDENTE && (
          <button
            onClick={() => handleStatusChange(ESTADOS_TAREFA.EM_ANDAMENTO)}
            className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200"
          >
            <PlayCircle className="w-4 h-4" />
            Iniciar
          </button>
        )}

        {isResponsavel && tarefa.status === ESTADOS_TAREFA.EM_ANDAMENTO && (
          <button
            onClick={() => handleStatusChange(ESTADOS_TAREFA.CONCLUIDA)}
            className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full hover:bg-green-200"
          >
            <CheckCircle2 className="w-4 h-4" />
            Concluir
          </button>
        )}

        {isSupervisor && tarefa.status === ESTADOS_TAREFA.CONCLUIDA && (
          <button
            onClick={() => handleStatusChange(ESTADOS_TAREFA.VERIFICADA)}
            className="flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200"
          >
            <CheckCircle2 className="w-4 h-4" />
            Verificar
          </button>
        )}

        {(isResponsavel || isSupervisor) && (
          <button
            onClick={() => setIsAddingObservacao(true)}
            className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200"
          >
            <MessageSquare className="w-4 h-4" />
            Observação
          </button>
        )}
      </div>
    );
  };

  const filtrarObservacoesVisiveis = (observacoes) => {
    if (!observacoes) return [];
    return observacoes.filter(obs => {
      // Supervisores podem ver todas as observações
      if (usuario.nivel >= NIVEIS_PERMISSAO.SUPERVISOR) return true;
      // Funcionários só podem ver observações públicas ou suas próprias
      return obs.nivel === NIVEIS_PERMISSAO.FUNCIONARIO || obs.usuarioId === usuario.id;
    });
  };

  return (
    <div className={`border rounded-lg p-4 ${ESTADOS_TAREFA_COLORS[tarefa.status].bg}`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-medium text-gray-900">{tarefa.titulo}</h3>
          <p className="text-sm text-gray-600 mt-1">{tarefa.descricao}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm ${ESTADOS_TAREFA_COLORS[tarefa.status].text} ${ESTADOS_TAREFA_COLORS[tarefa.status].bg}`}>
          {ESTADOS_TAREFA_LABELS[tarefa.status]}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span>Limite: {formatarData(tarefa.dataLimite)}</span>
        </div>
        <div className="flex items-center gap-2">
          <User className="w-4 h-4" />
          <span>Resp.: {tarefa.responsavelNome}</span>
        </div>
        {tarefa.categoria && (
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4" />
            <span>{tarefa.categoria}</span>
          </div>
        )}
      </div>

      {renderAcoes()}

      {/* Seção de Observações */}
      {isAddingObservacao && (
        <div className="mt-3 space-y-2">
          <textarea
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Digite sua observação..."
            rows="2"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsAddingObservacao(false)}
              className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded"
            >
              Cancelar
            </button>
            <button
              onClick={handleAddObservacao}
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Adicionar
            </button>
          </div>
        </div>
      )}

      {/* Lista de Observações */}
      {filtrarObservacoesVisiveis(tarefa.observacoes)?.length > 0 && (
        <div className="mt-3">
          <button
            onClick={() => setExpandirObservacoes(!expandirObservacoes)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {expandirObservacoes ? 'Ocultar observações' : 'Ver observações'}
          </button>
          
          {expandirObservacoes && (
            <div className="mt-2 space-y-2">
              {filtrarObservacoesVisiveis(tarefa.observacoes).map((obs, index) => (
                <div key={index} className="text-sm bg-white p-2 rounded border">
                  <div className="flex justify-between text-gray-600">
                    <span className="font-medium">{obs.usuario}</span>
                    <span>{formatarData(obs.data)}</span>
                  </div>
                  <p className="mt-1 text-gray-800">{obs.texto}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TarefaCard;
