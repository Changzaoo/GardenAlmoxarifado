import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { X, Calendar, Users, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '../ToastProvider';
import { format, addDays, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const AtribuirTarefaSemanal = ({ onClose, funcionarios = [] }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Dados da tarefa, 2: Selecionar semana, 3: Selecionar funcionários
  
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    prioridade: 'média',
    semanaInicio: format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'),
    semanaFim: format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'),
    funcionariosSelecionados: []
  });

  const handleSubmit = async () => {
    if (!formData.titulo) {
      showToast('Por favor, preencha o título da tarefa', 'error');
      return;
    }

    if (formData.funcionariosSelecionados.length === 0) {
      showToast('Selecione pelo menos um funcionário', 'error');
      return;
    }

    setLoading(true);

    try {
      // Criar uma tarefa para cada funcionário selecionado
      const tarefasPromises = formData.funcionariosSelecionados.map(async (funcId) => {
        const funcionario = funcionarios.find(f => f.id === funcId);
        
        const tarefaData = {
          titulo: formData.titulo,
          descricao: formData.descricao,
          prioridade: formData.prioridade,
          funcionariosIds: [funcId],
          funcionarios: [{
            id: funcId,
            nome: funcionario?.nome || funcionario?.username || funcionario?.email || 'Sem nome'
          }],
          semanaInicio: formData.semanaInicio,
          semanaFim: formData.semanaFim,
          status: 'pendente',
          dataCriacao: new Date().toISOString(),
          tipo: 'semanal'
        };

        return addDoc(collection(db, 'tarefas'), tarefaData);
      });

      await Promise.all(tarefasPromises);

      // Criar notificações para cada funcionário
      const notificacoesPromises = formData.funcionariosSelecionados.map(async (funcId) => {
        const funcionario = funcionarios.find(f => f.id === funcId);
        
        return addDoc(collection(db, 'notificacoes'), {
          tipo: 'nova_tarefa',
          titulo: '📋 Nova Tarefa Semanal',
          mensagem: `Você recebeu uma nova tarefa: "${formData.titulo}"`,
          usuarioId: funcId,
          lida: false,
          dataCriacao: new Date().toISOString(),
          metadados: {
            tarefaTitulo: formData.titulo,
            semanaInicio: formData.semanaInicio,
            semanaFim: formData.semanaFim,
            prioridade: formData.prioridade
          }
        });
      });

      await Promise.all(notificacoesPromises);

      showToast(`✅ ${formData.funcionariosSelecionados.length} tarefa(s) semanal(is) criada(s) com sucesso!`, 'success');
      onClose();
    } catch (error) {
      console.error('Erro ao criar tarefas semanais:', error);
      showToast('Erro ao criar tarefas semanais', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleFuncionario = (funcId) => {
    setFormData(prev => ({
      ...prev,
      funcionariosSelecionados: prev.funcionariosSelecionados.includes(funcId)
        ? prev.funcionariosSelecionados.filter(id => id !== funcId)
        : [...prev.funcionariosSelecionados, funcId]
    }));
  };

  const selectAllFuncionarios = () => {
    setFormData(prev => ({
      ...prev,
      funcionariosSelecionados: funcionarios.map(f => f.id)
    }));
  };

  const deselectAllFuncionarios = () => {
    setFormData(prev => ({
      ...prev,
      funcionariosSelecionados: []
    }));
  };

  const getWeekDates = () => {
    const inicio = new Date(formData.semanaInicio);
    const fim = new Date(formData.semanaFim);
    return {
      inicio: format(inicio, "dd 'de' MMMM", { locale: ptBR }),
      fim: format(fim, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    };
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 p-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">📅 Atribuir Tarefa Semanal</h2>
              <p className="text-blue-100 mt-1">Crie tarefas para a semana toda</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center gap-2 mt-6">
            {[1, 2, 3].map(stepNum => (
              <React.Fragment key={stepNum}>
                <div className={`flex items-center gap-2 ${step >= stepNum ? 'opacity-100' : 'opacity-50'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    step >= stepNum 
                      ? 'bg-white text-blue-600' 
                      : 'bg-white/30 text-white'
                  }`}>
                    {stepNum}
                  </div>
                  <span className="text-sm font-medium hidden sm:inline">
                    {stepNum === 1 ? 'Dados' : stepNum === 2 ? 'Semana' : 'Funcionários'}
                  </span>
                </div>
                {stepNum < 3 && <div className="flex-1 h-1 bg-white/30 rounded" />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 220px)' }}>
          {/* Step 1: Dados da Tarefa */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Título da Tarefa *
                </label>
                <input
                  type="text"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  placeholder="Ex: Revisar documentos, Organizar estoque..."
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Descrição
                </label>
                <textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Descreva a tarefa em detalhes..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Prioridade
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {['baixa', 'média', 'alta'].map(prioridade => (
                    <button
                      key={prioridade}
                      onClick={() => setFormData({ ...formData, prioridade })}
                      className={`py-3 px-4 rounded-xl font-semibold transition-all ${
                        formData.prioridade === prioridade
                          ? prioridade === 'alta'
                            ? 'bg-red-500 text-white shadow-lg scale-105'
                            : prioridade === 'média'
                            ? 'bg-yellow-500 text-white shadow-lg scale-105'
                            : 'bg-green-500 text-white shadow-lg scale-105'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {prioridade === 'alta' ? '🔥 Alta' : prioridade === 'média' ? '⚡ Média' : '✓ Baixa'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Selecionar Semana */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-xl border-2 border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-3 mb-4">
                  <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Selecione a Semana
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Escolha a semana para a qual deseja atribuir esta tarefa
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Início da Semana
                    </label>
                    <input
                      type="date"
                      value={formData.semanaInicio}
                      onChange={(e) => {
                        const inicio = new Date(e.target.value);
                        setFormData({
                          ...formData,
                          semanaInicio: e.target.value,
                          semanaFim: format(addDays(inicio, 6), 'yyyy-MM-dd')
                        });
                      }}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Fim da Semana
                    </label>
                    <input
                      type="date"
                      value={formData.semanaFim}
                      onChange={(e) => setFormData({ ...formData, semanaFim: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>

                <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    📅 Período selecionado:
                  </p>
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-1">
                    {getWeekDates().inicio} até {getWeekDates().fim}
                  </p>
                </div>
              </div>

              {/* Quick Week Selectors */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button
                  onClick={() => {
                    const hoje = new Date();
                    setFormData({
                      ...formData,
                      semanaInicio: format(startOfWeek(hoje, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
                      semanaFim: format(endOfWeek(hoje, { weekStartsOn: 1 }), 'yyyy-MM-dd')
                    });
                  }}
                  className="p-3 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/60 font-medium transition-colors"
                >
                  Esta Semana
                </button>
                <button
                  onClick={() => {
                    const proximaSemana = addDays(new Date(), 7);
                    setFormData({
                      ...formData,
                      semanaInicio: format(startOfWeek(proximaSemana, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
                      semanaFim: format(endOfWeek(proximaSemana, { weekStartsOn: 1 }), 'yyyy-MM-dd')
                    });
                  }}
                  className="p-3 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900/60 font-medium transition-colors"
                >
                  Próxima Semana
                </button>
                <button
                  onClick={() => {
                    const em2Semanas = addDays(new Date(), 14);
                    setFormData({
                      ...formData,
                      semanaInicio: format(startOfWeek(em2Semanas, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
                      semanaFim: format(endOfWeek(em2Semanas, { weekStartsOn: 1 }), 'yyyy-MM-dd')
                    });
                  }}
                  className="p-3 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/60 font-medium transition-colors"
                >
                  Em 2 Semanas
                </button>
                <button
                  onClick={() => {
                    const em3Semanas = addDays(new Date(), 21);
                    setFormData({
                      ...formData,
                      semanaInicio: format(startOfWeek(em3Semanas, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
                      semanaFim: format(endOfWeek(em3Semanas, { weekStartsOn: 1 }), 'yyyy-MM-dd')
                    });
                  }}
                  className="p-3 bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300 rounded-lg hover:bg-pink-200 dark:hover:bg-pink-900/60 font-medium transition-colors"
                >
                  Em 3 Semanas
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Selecionar Funcionários */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-xl border-2 border-green-200 dark:border-green-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      Selecione os Funcionários
                    </h3>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={selectAllFuncionarios}
                      className="px-3 py-1 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                      Todos
                    </button>
                    <button
                      onClick={deselectAllFuncionarios}
                      className="px-3 py-1 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      Limpar
                    </button>
                  </div>
                </div>

                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {formData.funcionariosSelecionados.length} de {funcionarios.length} funcionários selecionados
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                  {funcionarios.map(func => (
                    <button
                      key={func.id}
                      onClick={() => toggleFuncionario(func.id)}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        formData.funcionariosSelecionados.includes(func.id)
                          ? 'bg-green-100 dark:bg-green-900/40 border-green-500 dark:border-green-600 shadow-lg scale-105'
                          : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-green-300 dark:hover:border-green-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          formData.funcionariosSelecionados.includes(func.id)
                            ? 'bg-green-500 border-green-500'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}>
                          {formData.funcionariosSelecionados.includes(func.id) && (
                            <CheckCircle className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-white truncate">
                            {func.nome || func.username || func.email}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {func.email}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
                <h4 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  Resumo
                </h4>
                <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                  <li>📋 Tarefa: <strong>{formData.titulo}</strong></li>
                  <li>📅 Período: <strong>{getWeekDates().inicio} - {getWeekDates().fim}</strong></li>
                  <li>👥 Funcionários: <strong>{formData.funcionariosSelecionados.length}</strong></li>
                  <li>🔥 Prioridade: <strong>{formData.prioridade.charAt(0).toUpperCase() + formData.prioridade.slice(1)}</strong></li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 dark:bg-gray-900 p-6 flex justify-between gap-3 border-t border-gray-200 dark:border-gray-700">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              ← Voltar
            </button>
          )}

          <div className="flex-1" />

          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={step === 1 && !formData.titulo}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
            >
              Próximo →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading || formData.funcionariosSelecionados.length === 0}
              className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Criar Tarefas Semanais
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AtribuirTarefaSemanal;
