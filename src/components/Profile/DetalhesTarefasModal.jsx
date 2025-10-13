import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Calendar, Clock, Award, AlertCircle, Star } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

const DetalhesTarefasModal = ({ isOpen, onClose, funcionarioId, pontos }) => {
  const [tarefas, setTarefas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && funcionarioId) {
      buscarTarefasConcluidas();
    }
  }, [isOpen, funcionarioId]);

  const buscarTarefasConcluidas = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, 'tarefas'),
        where('funcionarioId', '==', funcionarioId),
        where('status', '==', 'concluida')
      );
      
      const snapshot = await getDocs(q);
      const tarefasData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Ordenar por data de conclusão (mais recente primeiro)
      tarefasData.sort((a, b) => {
        const dateA = a.dataConclusao?.seconds || a.dataConclusao?.toDate?.() || 0;
        const dateB = b.dataConclusao?.seconds || b.dataConclusao?.toDate?.() || 0;
        return dateB - dateA;
      });
      
      setTarefas(tarefasData);
    } catch (error) {
      console.error('Erro ao buscar tarefas:', error);
    } finally {
      setLoading(false);
    }
  };

  const calcularPontosTarefa = (tarefa) => {
    let pontos = 0;
    
    // Pontos por prioridade
    switch (tarefa.prioridade?.toLowerCase()) {
      case 'baixa':
        pontos += 20;
        break;
      case 'media':
        pontos += 40;
        break;
      case 'alta':
        pontos += 70;
        break;
      default:
        pontos += 30;
    }
    
    // Pontos por tempo estimado (5 pontos por hora, max 50)
    if (tarefa.tempoEstimado) {
      const tempoPontos = Math.min(tarefa.tempoEstimado * 5, 50);
      pontos += tempoPontos;
    }
    
    return pontos;
  };

  const getPrioridadeColor = (prioridade) => {
    switch (prioridade?.toLowerCase()) {
      case 'alta':
        return 'text-red-600 bg-red-100 border-red-200';
      case 'media':
        return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'baixa':
        return 'text-green-600 bg-green-100 border-green-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getPrioridadeIcon = (prioridade) => {
    switch (prioridade?.toLowerCase()) {
      case 'alta':
        return <AlertCircle className="w-4 h-4" />;
      case 'media':
        return <Star className="w-4 h-4" />;
      case 'baixa':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <CheckCircle className="w-4 h-4" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-xl p-2">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Tarefas Concluídas</h2>
              <p className="text-sm text-white/80">{tarefas.length} tarefas finalizadas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(90vh-200px)] overflow-y-auto">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 dark:border-green-400 mx-auto"></div>
              <p className="text-gray-500 dark:text-gray-400 mt-4">Carregando tarefas...</p>
            </div>
          ) : tarefas.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Nenhuma tarefa concluída</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tarefas.map((tarefa) => {
                const pontosTarefa = calcularPontosTarefa(tarefa);
                const dataConclusao = tarefa.dataConclusao?.toDate?.() || new Date(tarefa.dataConclusao);
                
                return (
                  <div key={tarefa.id} className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-4 border border-green-200 dark:border-green-700 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">{tarefa.titulo || 'Sem título'}</h3>
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className={`text-xs px-2 py-1 rounded-full border ${getPrioridadeColor(tarefa.prioridade)} flex items-center gap-1`}>
                            {getPrioridadeIcon(tarefa.prioridade)}
                            {tarefa.prioridade || 'Padrão'}
                          </span>
                          {tarefa.tempoEstimado && (
                            <span className="text-xs text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-700 px-2 py-1 rounded-full border border-gray-200 dark:border-gray-600">
                              <Clock className="w-3 h-3 inline mr-1" />
                              {tarefa.tempoEstimado}h
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Calendar className="w-4 h-4" />
                          <span>{format(dataConclusao, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 bg-white dark:bg-gray-700 rounded-lg px-3 py-2 border border-green-300 dark:border-green-600">
                        <Award className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <span className="font-bold text-green-600 dark:text-green-400">+{pontosTarefa} pts</span>
                      </div>
                    </div>

                    {tarefa.descricao && (
                      <div className="bg-white dark:bg-gray-700 rounded-lg p-3 mb-2">
                        <p className="text-sm text-gray-700 dark:text-gray-300">{tarefa.descricao}</p>
                      </div>
                    )}

                    {/* Breakdown de pontos */}
                    <div className="flex items-center gap-4 text-xs text-gray-600">
                      <span>
                        Prioridade: <strong className="text-gray-800">
                          {tarefa.prioridade?.toLowerCase() === 'alta' ? '70' :
                           tarefa.prioridade?.toLowerCase() === 'media' ? '40' :
                           tarefa.prioridade?.toLowerCase() === 'baixa' ? '20' : '30'} pts
                        </strong>
                      </span>
                      {tarefa.tempoEstimado && (
                        <span className="text-gray-600">
                          Tempo: <strong className="text-gray-800">+{Math.min(tarefa.tempoEstimado * 5, 50)} pts</strong>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-white" />
            <span className="text-white/90 text-sm font-medium">Total Acumulado:</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {pontos} pontos
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetalhesTarefasModal;
