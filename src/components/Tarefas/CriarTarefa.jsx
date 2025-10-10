import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useAuth } from '../../hooks/useAuth';
import { X, ListChecks, Calendar, Clock, Users, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '../ToastProvider';
import SeletorTarefaPredefinida from './SeletorTarefaPredefinida';
import { notificarNovaTarefa } from '../../services/tarefaNotificationService';
import { useFuncionarios } from '../Funcionarios/FuncionariosProvider';

const CriarTarefa = ({ onClose }) => {
  const { usuario } = useAuth();
  const { showToast } = useToast();
  const { funcionarios } = useFuncionarios();
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    prioridade: '',
    funcionariosIds: [],
    tipoAgendamento: 'unica', // 'unica', 'semanal', 'mensal'
    diasSemana: [], // [0-6] domingo a sábado
    diasMes: [], // [1-31]
    dataInicio: new Date().toISOString().split('T')[0],
    dataFim: ''
  });
  const [funcionariosSelecionados, setFuncionariosSelecionados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [mesVisualizado, setMesVisualizado] = useState(new Date().getMonth());
  const [anoVisualizado, setAnoVisualizado] = useState(new Date().getFullYear());

  const diasDaSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const mesesDoAno = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  const handleSelectTemplate = (template) => {
    setFormData({
      ...formData,
      titulo: template.titulo,
      descricao: template.descricao,
      prioridade: template.prioridade
    });
    setShowTemplates(false);
  };

  const toggleDiaSemana = (dia) => {
    if (formData.diasSemana.includes(dia)) {
      setFormData({ ...formData, diasSemana: formData.diasSemana.filter(d => d !== dia) });
    } else {
      setFormData({ ...formData, diasSemana: [...formData.diasSemana, dia] });
    }
  };

  const toggleDiaMes = (dia) => {
    if (formData.diasMes.includes(dia)) {
      setFormData({ ...formData, diasMes: formData.diasMes.filter(d => d !== dia) });
    } else {
      setFormData({ ...formData, diasMes: [...formData.diasMes, dia] });
    }
  };

  const getDiasDoMes = () => {
    const ultimoDia = new Date(anoVisualizado, mesVisualizado + 1, 0).getDate();
    return Array.from({ length: ultimoDia }, (_, i) => i + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.titulo || !formData.descricao || formData.funcionariosIds.length === 0 || !formData.prioridade) {
      showToast('Preencha todos os campos obrigatórios', 'error');
      return;
    }

    if (formData.tipoAgendamento === 'semanal' && formData.diasSemana.length === 0) {
      showToast('Selecione pelo menos um dia da semana', 'error');
      return;
    }

    if (formData.tipoAgendamento === 'mensal' && formData.diasMes.length === 0) {
      showToast('Selecione pelo menos um dia do mês', 'error');
      return;
    }

    setLoading(true);
    try {
      const tarefaData = {
        titulo: formData.titulo,
        descricao: formData.descricao,
        prioridade: formData.prioridade,
        funcionariosIds: formData.funcionariosIds,
        funcionarios: funcionariosSelecionados.map(func => ({
          id: func.id,
          nome: func.nome || func.username || func.email || 'Sem nome'
        })),
        status: 'pendente',
        dataCriacao: new Date().toISOString(),
        tipoAgendamento: formData.tipoAgendamento,
        diasSemana: formData.diasSemana,
        diasMes: formData.diasMes,
        dataInicio: formData.dataInicio,
        dataFim: formData.dataFim || null,
        criadoPor: {
          id: usuario.id,
          nome: usuario.nome
        }
      };

      const docRef = await addDoc(collection(db, 'tarefas'), tarefaData);
      
      // Criar notificação para cada funcionário atribuído
      try {
        for (const funcionarioId of formData.funcionariosIds) {
          await notificarNovaTarefa(
            funcionarioId,
            formData.titulo,
            formData.prioridade,
            { id: docRef.id, ...tarefaData }
          );
        }
      } catch (notificationError) {
        console.error('❌ Erro ao criar notificações da tarefa:', notificationError);
      }

      showToast('Tarefa criada com sucesso!', 'success');
      onClose();
    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
      showToast('Erro ao criar tarefa', 'error');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 pb-24 md:pb-4">
      <div className="bg-gradient-to-br from-white to-blue-50/30 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 w-full max-w-3xl relative max-h-[calc(100vh-8rem)] overflow-y-auto border-2 border-blue-100 dark:border-blue-900/30 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 text-gray-500 dark:text-gray-400 hover:text-white hover:bg-red-500 dark:hover:bg-red-600 rounded-lg transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Nova Tarefa</h2>
        </div>

        <button
          type="button"
          onClick={() => setShowTemplates(true)}
          className="w-full mb-6 py-3 px-4 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl border-2 border-blue-200 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-gray-600 transition-all shadow-sm flex items-center justify-center gap-2 font-medium"
        >
          <ListChecks className="w-5 h-5" />
          Usar Modelo de Tarefa
        </button>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="titulo" className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              Título da Tarefa
            </label>
            <input
              type="text"
              id="titulo"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              className="w-full px-4 py-3 bg-white dark:bg-gray-700 border-2 border-blue-200 dark:border-blue-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm font-medium"
              placeholder="Ex: Revisar relatório mensal"
              required
            />
          </div>

          <div>
            <label htmlFor="descricao" className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              Descrição
            </label>
            <textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              className="w-full px-4 py-3 bg-white dark:bg-gray-700 border-2 border-blue-200 dark:border-blue-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[100px] transition-all shadow-sm"
              placeholder="Descreva os detalhes da tarefa..."
              required
            />
            <div className="flex items-start gap-2 mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-blue-700 dark:text-blue-300 text-xs">
                Use @ para mencionar funcionários (ex: @João)
              </p>
            </div>
          </div>

          <div>
            <label htmlFor="prioridade" className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
              Prioridade
            </label>
            <select
              id="prioridade"
              value={formData.prioridade}
              onChange={(e) => setFormData({ ...formData, prioridade: e.target.value })}
              className="w-full bg-white dark:bg-gray-700 border-2 border-blue-200 dark:border-blue-700 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm font-medium"
              required
            >
              <option value="">Selecione a prioridade</option>
              <option value="baixa">� Baixa (1 barra)</option>
              <option value="media">� Média (2 barras)</option>
              <option value="alta">� Alta (3 barras)</option>
            </select>
          </div>

          {/* Tipo de Agendamento */}
          <div className="border-2 border-blue-200 dark:border-blue-700 rounded-xl p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <label className="text-sm font-bold text-gray-700 dark:text-gray-300">
                Agendamento da Tarefa
              </label>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { value: 'unica', label: 'Única', icon: '📅' },
                { value: 'semanal', label: 'Semanal', icon: '📆' },
                { value: 'mensal', label: 'Mensal', icon: '🗓️' }
              ].map(tipo => (
                <button
                  key={tipo.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, tipoAgendamento: tipo.value })}
                  className={`py-2 px-3 rounded-lg font-bold text-sm transition-all ${
                    formData.tipoAgendamento === tipo.value
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg scale-105'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-2 border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600'
                  }`}
                >
                  {tipo.icon} {tipo.label}
                </button>
              ))}
            </div>

            {/* Seleção de Dias da Semana */}
            {formData.tipoAgendamento === 'semanal' && (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Selecione os dias da semana:</p>
                <div className="grid grid-cols-7 gap-2">
                  {diasDaSemana.map((dia, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => toggleDiaSemana(index)}
                      className={`py-3 px-2 rounded-lg font-bold text-xs transition-all ${
                        formData.diasSemana.includes(index)
                          ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg scale-110'
                          : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-2 border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500'
                      }`}
                    >
                      {dia}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Seleção de Dias do Mês */}
            {formData.tipoAgendamento === 'mensal' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Selecione os dias do mês:</p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const novoMes = mesVisualizado - 1;
                        if (novoMes < 0) {
                          setMesVisualizado(11);
                          setAnoVisualizado(anoVisualizado - 1);
                        } else {
                          setMesVisualizado(novoMes);
                        }
                      }}
                      className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300 min-w-[120px] text-center">
                      {mesesDoAno[mesVisualizado]} {anoVisualizado}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const novoMes = mesVisualizado + 1;
                        if (novoMes > 11) {
                          setMesVisualizado(0);
                          setAnoVisualizado(anoVisualizado + 1);
                        } else {
                          setMesVisualizado(novoMes);
                        }
                      }}
                      className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-2 max-h-[200px] overflow-y-auto">
                  {getDiasDoMes().map((dia) => (
                    <button
                      key={dia}
                      type="button"
                      onClick={() => toggleDiaMes(dia)}
                      className={`py-2 px-2 rounded-lg font-bold text-sm transition-all ${
                        formData.diasMes.includes(dia)
                          ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg scale-110'
                          : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-2 border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500'
                      }`}
                    >
                      {dia}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Período de Vigência */}
            {formData.tipoAgendamento !== 'unica' && (
              <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t-2 border-blue-200 dark:border-blue-700">
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Data Início</label>
                  <input
                    type="date"
                    value={formData.dataInicio}
                    onChange={(e) => setFormData({ ...formData, dataInicio: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-blue-200 dark:border-blue-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Data Fim (Opcional)</label>
                  <input
                    type="date"
                    value={formData.dataFim}
                    onChange={(e) => setFormData({ ...formData, dataFim: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-blue-200 dark:border-blue-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="border-2 border-blue-200 dark:border-blue-700 rounded-xl p-4 bg-white dark:bg-gray-800">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <label htmlFor="funcionarios" className="text-sm font-bold text-gray-700 dark:text-gray-300">
                Funcionários Responsáveis
              </label>
            </div>
            <div className="space-y-3">
              <select
                id="funcionarios"
                value=""
                onChange={(e) => {
                  const funcionarioId = e.target.value;
                  if (funcionarioId && !formData.funcionariosIds.includes(funcionarioId)) {
                    const funcionario = funcionarios.find(f => f.id === funcionarioId);
                    if (funcionario) {
                      setFormData({
                        ...formData,
                        funcionariosIds: [...formData.funcionariosIds, funcionarioId]
                      });
                      setFuncionariosSelecionados([...funcionariosSelecionados, funcionario]);
                    }
                  }
                  e.target.value = "";
                }}
                className="w-full bg-white dark:bg-gray-700 border-2 border-blue-200 dark:border-blue-700 text-gray-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm font-medium"
                required={formData.funcionariosIds.length === 0}
              >
                <option value="">+ Adicionar funcionário</option>
                {funcionarios
                  .filter(func => !formData.funcionariosIds.includes(func.id))
                  .sort((a, b) => (a.nome || a.username || '').localeCompare(b.nome || b.username || ''))
                  .map(func => (
                    <option key={func.id} value={func.id}>
                      {func.nome || func.username || func.email || 'Sem nome'}
                    </option>
                  ))
                }
              </select>

              {/* Lista de funcionários selecionados */}
              {funcionariosSelecionados.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-100 dark:border-blue-800">
                  {funcionariosSelecionados.map((func) => (
                    <div
                      key={func.id}
                      className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-sm font-bold shadow-md"
                    >
                      {func.fotoUrl ? (
                        <img 
                          src={func.fotoUrl} 
                          alt={func.nome || 'Funcionário'} 
                          className="w-5 h-5 rounded-full object-cover border-2 border-white"
                        />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center border-2 border-white">
                          <Users className="w-3 h-3" />
                        </div>
                      )}
                      {func.nome || func.username || func.email || 'Sem nome'}
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            funcionariosIds: formData.funcionariosIds.filter(id => id !== func.id)
                          });
                          setFuncionariosSelecionados(funcionariosSelecionados.filter(f => f.id !== func.id));
                        }}
                        className="ml-1 p-0.5 hover:bg-white/20 rounded-full transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t-2 border-blue-100 dark:border-blue-900/30">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-white hover:bg-gray-500 dark:hover:bg-gray-600 rounded-xl transition-all font-bold border-2 border-gray-300 dark:border-gray-600"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed font-bold shadow-lg hover:shadow-xl hover:shadow-blue-500/30 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Calendar className="w-5 h-5" />
                  Criar Tarefa
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Modal de Seleção de Template */}
      {showTemplates && (
        <SeletorTarefaPredefinida
          onSelect={handleSelectTemplate}
          onClose={() => setShowTemplates(false)}
        />
      )}
    </div>
  );
};

export default CriarTarefa;

