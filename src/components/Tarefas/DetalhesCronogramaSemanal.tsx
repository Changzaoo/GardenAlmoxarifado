import React, { useState, useEffect } from 'react';
import { X, Clock, CheckCircle, Circle, Calendar, AlertCircle, ChevronRight } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useToast } from '../ToastProvider';

const DetalhesCronogramaSemanal = ({ cronograma, onClose, onAtualizar }) => {
  const [diaAtual, setDiaAtual] = useState('');
  const [tarefasPorDia, setTarefasPorDia] = useState(cronograma.tarefasPorDia || {});
  const [diaSelecionado, setDiaSelecionado] = useState('');
  const { showToast } = useToast();

  const diasSemana = [
    { key: 'domingo', label: 'Domingo', labelCompleto: 'Domingo', emoji: '📅' },
    { key: 'segunda', label: 'Segunda', labelCompleto: 'Segunda-feira', emoji: '📅' },
    { key: 'terca', label: 'Terça', labelCompleto: 'Terça-feira', emoji: '📅' },
    { key: 'quarta', label: 'Quarta', labelCompleto: 'Quarta-feira', emoji: '📅' },
    { key: 'quinta', label: 'Quinta', labelCompleto: 'Quinta-feira', emoji: '📅' },
    { key: 'sexta', label: 'Sexta', labelCompleto: 'Sexta-feira', emoji: '📅' },
    { key: 'sabado', label: 'Sábado', labelCompleto: 'Sábado', emoji: '📅' }
  ];

  const prioridades = {
    alta: { label: '🔴 Alta', color: 'bg-red-100 text-red-800 border-red-300' },
    media: { label: '🟡 Média', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
    baixa: { label: '🟢 Baixa', color: 'bg-green-100 text-green-800 border-green-300' }
  };

  useEffect(() => {
    // Determinar o dia atual da semana
    const hoje = new Date();
    const diaDaSemana = hoje.getDay(); // 0 = domingo, 1 = segunda, etc
    const mapaDias = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
    const diaHoje = mapaDias[diaDaSemana];
    setDiaAtual(diaHoje);
    setDiaSelecionado(diaHoje);
  }, []);

  const calcularProgresso = () => {
    let totalTarefas = 0;
    let tarefasConcluidas = 0;

    Object.values(tarefasPorDia).forEach(tarefas => {
      totalTarefas += tarefas.length;
      tarefasConcluidas += tarefas.filter(t => t.concluida).length;
    });

    return { total: totalTarefas, concluidas: tarefasConcluidas };
  };

  const marcarTarefaComoConcluida = async (dia, tarefaId) => {
    try {
      const novasTarefas = { ...tarefasPorDia };
      novasTarefas[dia] = novasTarefas[dia].map(t =>
        t.id === tarefaId ? { ...t, concluida: !t.concluida } : t
      );

      setTarefasPorDia(novasTarefas);

      await updateDoc(doc(db, 'cronogramasSemanais', cronograma.id), {
        tarefasPorDia: novasTarefas
      });

      showToast('Status atualizado!', 'success');
      if (onAtualizar) onAtualizar();
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
      showToast('Erro ao atualizar tarefa', 'error');
    }
  };

  const podeConcluirTarefa = (dia) => {
    // Permitir iniciar/concluir tarefa apenas no dia correto ou depois
    const diasOrdenados = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
    const indiceDiaAtual = diasOrdenados.indexOf(diaAtual);
    const indiceDiaTarefa = diasOrdenados.indexOf(dia);
    return indiceDiaTarefa <= indiceDiaAtual;
  };

  const getDataDoDia = (dia) => {
    const dataInicio = new Date(cronograma.dataInicio + 'T00:00:00');
    const diasOrdenados = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
    const indiceDia = diasOrdenados.indexOf(dia);
    
    // dataInicio já deve ser um domingo, então é direto
    const dataDia = new Date(dataInicio);
    dataDia.setDate(dataInicio.getDate() + indiceDia);
    
    return dataDia.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const progresso = calcularProgresso();
  const percentualProgresso = progresso.total > 0 ? (progresso.concluidas / progresso.total) * 100 : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1D9BF0] via-[#1A8CD8] to-[#1779BE] text-white p-6">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Calendar className="w-7 h-7" />
                Cronograma Semanal
              </h2>
              <p className="text-blue-100 mt-2">
                Início: {new Date(cronograma.dataInicio + 'T00:00:00').toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Progresso */}
          <div className="mt-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Progresso Geral</span>
              <span className="text-sm font-bold">
                {progresso.concluidas} / {progresso.total} tarefas
              </span>
            </div>
            <div className="w-full bg-white bg-opacity-20 rounded-full h-3 overflow-hidden">
              <div
                className="bg-white h-full rounded-full transition-all duration-500 shadow-lg"
                style={{ width: `${percentualProgresso}%` }}
              />
            </div>
            <p className="text-xs text-blue-100 mt-1">{percentualProgresso.toFixed(0)}% concluído</p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Sidebar - Dias da Semana */}
          <div className="w-48 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
            <div className="p-3">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2 px-2">
                Dias da Semana
              </h3>
              {diasSemana.map(dia => {
                const tarefasDia = tarefasPorDia[dia.key] || [];
                const concluidas = tarefasDia.filter(t => t.concluida).length;
                const total = tarefasDia.length;
                const isDiaAtual = dia.key === diaAtual;

                return (
                  <button
                    key={dia.key}
                    onClick={() => setDiaSelecionado(dia.key)}
                    className={`w-full text-left px-3 py-3 rounded-lg mb-2 transition-all ${
                      diaSelecionado === dia.key
                        ? 'bg-gradient-to-r from-[#1D9BF0] to-[#1A8CD8] text-white shadow-md'
                        : isDiaAtual
                        ? 'bg-[#1D9BF0]/10 dark:bg-[#1D9BF0]/20 text-[#1D9BF0] hover:bg-[#1D9BF0]/20 dark:hover:bg-[#1D9BF0]/30'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{dia.label}</span>
                      {isDiaAtual && (
                        <span className={`text-xs font-bold ${
                          diaSelecionado === dia.key ? 'text-white' : 'text-[#1D9BF0]'
                        }`}>
                          HOJE
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs opacity-80">
                        {getDataDoDia(dia.key)}
                      </span>
                      <span className={`text-xs font-bold ${
                        diaSelecionado === dia.key
                          ? 'text-white'
                          : total === concluidas && total > 0
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {concluidas}/{total}
                      </span>
                    </div>
                    {total > 0 && (
                      <div className="mt-2 w-full bg-white dark:bg-gray-600 bg-opacity-30 rounded-full h-1">
                        <div
                          className={`h-full rounded-full transition-all ${
                            diaSelecionado === dia.key ? 'bg-white' : 'bg-[#1D9BF0]'
                          }`}
                          style={{ width: `${(concluidas / total) * 100}%` }}
                        />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main - Tarefas do Dia Selecionado */}
          <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-gray-900">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                {diasSemana.find(d => d.key === diaSelecionado)?.labelCompleto}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {getDataDoDia(diaSelecionado)} • {tarefasPorDia[diaSelecionado]?.length || 0} tarefas
              </p>
            </div>

            {!podeConcluirTarefa(diaSelecionado) && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-800 dark:text-yellow-300">Tarefas bloqueadas</p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                    Você só pode iniciar as tarefas deste dia quando chegar a data programada.
                  </p>
                </div>
              </div>
            )}

            {/* Lista de Tarefas */}
            <div className="space-y-3">
              {(!tarefasPorDia[diaSelecionado] || tarefasPorDia[diaSelecionado].length === 0) ? (
                <div className="text-center py-16 bg-gray-50 dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600">
                  <Calendar className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">Nenhuma tarefa programada</p>
                  <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Este dia está livre!</p>
                </div>
              ) : (
                tarefasPorDia[diaSelecionado].map((tarefa, index) => {
                  const prioridadeInfo = prioridades[tarefa.prioridade] || prioridades.media;
                  const podeIniciar = podeConcluirTarefa(diaSelecionado);

                  return (
                    <div
                      key={tarefa.id}
                      className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border-2 transition-all ${
                        tarefa.concluida
                          ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20'
                          : podeIniciar
                          ? 'border-gray-200 dark:border-gray-700 hover:border-[#1D9BF0] dark:hover:border-[#1D9BF0] hover:shadow-md'
                          : 'border-gray-200 dark:border-gray-700 opacity-60'
                      }`}
                    >
                      <div className="p-5">
                        <div className="flex items-start gap-4">
                          {/* Checkbox */}
                          <button
                            onClick={() => podeIniciar && marcarTarefaComoConcluida(diaSelecionado, tarefa.id)}
                            disabled={!podeIniciar}
                            className={`flex-shrink-0 mt-1 ${
                              podeIniciar ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                            }`}
                          >
                            {tarefa.concluida ? (
                              <CheckCircle className="w-7 h-7 text-green-600 dark:text-green-400" />
                            ) : (
                              <Circle className={`w-7 h-7 ${podeIniciar ? 'text-gray-400 dark:text-gray-500 hover:text-[#1D9BF0]' : 'text-gray-300 dark:text-gray-600'}`} />
                            )}
                          </button>

                          {/* Conteúdo da Tarefa */}
                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div className="flex-1">
                                <h4 className={`font-semibold text-lg ${
                                  tarefa.concluida ? 'text-gray-500 dark:text-gray-400 line-through' : 'text-gray-800 dark:text-gray-100'
                                }`}>
                                  {tarefa.titulo}
                                </h4>
                                {tarefa.descricao && (
                                  <p className={`text-sm mt-1 ${
                                    tarefa.concluida ? 'text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-400'
                                  }`}>
                                    {tarefa.descricao}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-3 flex-wrap">
                              <div className="flex items-center gap-1.5 text-gray-600">
                                <Clock className="w-4 h-4" />
                                <span className="text-sm font-medium">{tarefa.horario}</span>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${prioridadeInfo.color}`}>
                                {prioridadeInfo.label}
                              </span>
                              {tarefa.tipo && (
                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                  {tarefa.tipo}
                                </span>
                              )}
                              {tarefa.concluida && (
                                <span className="ml-auto px-3 py-1 rounded-full text-xs font-bold bg-green-600 text-white flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  Concluída
                                </span>
                              )}
                            </div>

                            {!tarefa.concluida && podeIniciar && (
                              <button
                                onClick={() => marcarTarefaComoConcluida(diaSelecionado, tarefa.id)}
                                className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Marcar como Concluída
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              <span className="font-medium">
                {progresso.concluidas} de {progresso.total} tarefas concluídas
              </span>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetalhesCronogramaSemanal;
