import React, { useState, useEffect } from 'react';
import { Calendar, ChevronRight, Clock, CheckCircle } from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useAuth } from '../../hooks/useAuth';
import DetalhesCronogramaSemanal from './DetalhesCronogramaSemanal';

const CronogramaSemanalCard = () => {
  const [cronogramas, setCronogramas] = useState([]);
  const [cronogramaSelecionado, setCronogramaSelecionado] = useState(null);
  const { usuario } = useAuth();

  useEffect(() => {
    if (!usuario) return;

    const q = query(
      collection(db, 'cronogramasSemanais'),
      where('funcionariosIds', 'array-contains', usuario.id),
      where('status', '==', 'ativo')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const cronogramasData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCronogramas(cronogramasData);
    });

    return () => unsubscribe();
  }, [usuario]);

  const calcularProgresso = (cronograma) => {
    let totalTarefas = 0;
    let tarefasConcluidas = 0;

    Object.values(cronograma.tarefasPorDia || {}).forEach(tarefas => {
      totalTarefas += tarefas.length;
      tarefasConcluidas += tarefas.filter(t => t.concluida).length;
    });

    return { total: totalTarefas, concluidas: tarefasConcluidas };
  };

  const getTarefasDeHoje = (cronograma) => {
    const hoje = new Date();
    const diaDaSemana = hoje.getDay();
    const mapaDias = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
    const diaHoje = mapaDias[diaDaSemana];
    
    return cronograma.tarefasPorDia?.[diaHoje] || [];
  };

  if (cronogramas.length === 0) {
    return null;
  }

  return (
    <>
      <div className="space-y-4">
        {cronogramas.map(cronograma => {
          const progresso = calcularProgresso(cronograma);
          const percentualProgresso = progresso.total > 0 ? (progresso.concluidas / progresso.total) * 100 : 0;
          const tarefasHoje = getTarefasDeHoje(cronograma);
          const dataInicio = new Date(cronograma.dataInicio + 'T00:00:00');

          return (
            <div
              key={cronograma.id}
              onClick={() => setCronogramaSelecionado(cronograma)}
              className="bg-gradient-to-br from-[#1D9BF0] via-[#1A8CD8] to-[#1779BE] dark:from-[#1D9BF0] dark:via-[#1A8CD8] dark:to-[#1779BE] rounded-xl shadow-lg hover:shadow-xl transition-all cursor-pointer p-6 text-white"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white bg-opacity-20 dark:bg-white dark:bg-opacity-30 rounded-xl flex items-center justify-center">
                    <Calendar className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Cronograma Semanal</h3>
                    <p className="text-blue-100 dark:text-blue-100 text-sm">
                      Início: {dataInicio.toLocaleDateString('pt-BR', { 
                        day: '2-digit', 
                        month: 'short' 
                      })}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-6 h-6" />
              </div>

              {/* Progresso */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Progresso Semanal</span>
                  <span className="text-sm font-bold">
                    {progresso.concluidas} / {progresso.total}
                  </span>
                </div>
                <div className="w-full bg-white bg-opacity-20 dark:bg-white dark:bg-opacity-30 rounded-full h-2.5">
                  <div
                    className="bg-white dark:bg-white h-full rounded-full transition-all duration-500 shadow-md"
                    style={{ width: `${percentualProgresso}%` }}
                  />
                </div>
                <p className="text-xs text-blue-100 dark:text-blue-100 mt-1">{percentualProgresso.toFixed(0)}% concluído</p>
              </div>

              {/* Tarefas de Hoje */}
              {tarefasHoje.length > 0 && (
                <div className="bg-white bg-opacity-10 dark:bg-white dark:bg-opacity-20 rounded-lg p-4 backdrop-blur-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-4 h-4" />
                    <span className="font-semibold text-sm">Tarefas de Hoje</span>
                    <span className="ml-auto bg-white bg-opacity-20 dark:bg-white dark:bg-opacity-30 px-2 py-0.5 rounded-full text-xs font-bold">
                      {tarefasHoje.filter(t => t.concluida).length} / {tarefasHoje.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {tarefasHoje.slice(0, 3).map((tarefa, index) => (
                      <div 
                        key={tarefa.id} 
                        className="flex items-center gap-2 text-sm"
                      >
                        {tarefa.concluida ? (
                          <CheckCircle className="w-4 h-4 flex-shrink-0" />
                        ) : (
                          <div className="w-4 h-4 border-2 border-white rounded-full flex-shrink-0" />
                        )}
                        <span className={tarefa.concluida ? 'line-through opacity-70' : ''}>
                          {tarefa.titulo}
                        </span>
                      </div>
                    ))}
                    {tarefasHoje.length > 3 && (
                      <p className="text-xs opacity-75 ml-6">
                        +{tarefasHoje.length - 3} mais {tarefasHoje.length - 3 === 1 ? 'tarefa' : 'tarefas'}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-white border-opacity-20 dark:border-white dark:border-opacity-30 flex items-center justify-between">
                <span className="text-sm font-medium">Ver cronograma completo</span>
                <div className="w-8 h-8 bg-white bg-opacity-20 dark:bg-white dark:bg-opacity-30 rounded-full flex items-center justify-center">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Detalhes */}
      {cronogramaSelecionado && (
        <DetalhesCronogramaSemanal
          cronograma={cronogramaSelecionado}
          onClose={() => setCronogramaSelecionado(null)}
          onAtualizar={() => {
            // Atualização em tempo real já gerenciada pelo onSnapshot
          }}
        />
      )}
    </>
  );
};

export default CronogramaSemanalCard;
