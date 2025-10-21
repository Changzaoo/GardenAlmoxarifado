import React, { useState, useEffect } from 'react';
import { TAREFAS_PREDEFINIDAS, carregarTemplatesPersonalizados, excluirTemplatePersonalizado } from '../../data/tarefasPreDefinidas';
import { Clock, Flag, Plus, Trash2, Pencil } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../ToastProvider';
import CriarTemplate from './CriarTemplate';

const SeletorTarefaPredefinida = ({ onSelect, onClose }) => {
  const { usuario } = useAuth();
  const { showToast } = useToast();
  const [templatesPersonalizados, setTemplatesPersonalizados] = useState([]);
  const [showCriarTemplate, setShowCriarTemplate] = useState(false);
  const [templateParaEditar, setTemplateParaEditar] = useState(null);
  const [confirmExclusao, setConfirmExclusao] = useState({ show: false, templateId: null });

  // Carregar templates personalizados
  useEffect(() => {
    try {
      const unsubscribe = carregarTemplatesPersonalizados(templates => {
        setTemplatesPersonalizados(templates);
      });
      return () => unsubscribe();
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
      showToast('Erro ao carregar templates personalizados', 'error');
    }
  }, [showToast]);

  const [mostrarTemplatesSistema, setMostrarTemplatesSistema] = useState(false);

  // Filtrar templates do sistema que já foram personalizados
  const templatesSistemaFiltrados = TAREFAS_PREDEFINIDAS.filter(template => {
    return !templatesPersonalizados.some(t => t.originalId === template.id);
  });

  // Combinar templates baseado na escolha do usuário
  const todasTarefas = mostrarTemplatesSistema 
    ? [...templatesSistemaFiltrados, ...templatesPersonalizados]
    : templatesPersonalizados;
  
  const tiposTarefa = [...new Set(todasTarefas.map(t => t.tipo))].sort();

  const handleExcluirTemplate = async (e, templateId) => {
    e.stopPropagation();
    setConfirmExclusao({ show: true, templateId });
  };

  const confirmarExclusao = async () => {
    const sucesso = await excluirTemplatePersonalizado(confirmExclusao.templateId);
    if (sucesso) {
      showToast('Modelo excluído com sucesso!', 'success');
    } else {
      showToast('Erro ao excluir modelo', 'error');
    }
    setConfirmExclusao({ show: false, templateId: null });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Selecione um Modelo de Tarefa</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Escolha um modelo existente ou crie um novo</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={mostrarTemplatesSistema}
                  onChange={(e) => setMostrarTemplatesSistema(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-500 dark:text-[#1D9BF0] focus:ring-blue-500 dark:focus:ring-[#1D9BF0] focus:ring-offset-0 bg-white dark:bg-gray-700"
                />
                <span className="text-sm">Mostrar modelos do sistema</span>
              </label>
              {usuario.nivel >= 2 && (
                <button
                  onClick={() => setShowCriarTemplate(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 dark:bg-[#1D9BF0] text-gray-900 dark:text-white rounded-full hover:bg-blue-600 dark:hover:bg-[#1a8cd8] transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Criar Modelo
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-white/10 rounded-full transition-colors"
              >
                &times;
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {tiposTarefa.map(tipo => (
            <div key={tipo}>
              <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-3">{tipo}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {todasTarefas
                  .filter(t => t.tipo === tipo)
                  .sort((a, b) => (a.personalizado === b.personalizado) ? 0 : a.personalizado ? 1 : -1)
                  .map(tarefa => (
                  <button
                    key={tarefa.id}
                    onClick={() => onSelect(tarefa)}
                    className={`text-left p-4 bg-[#22303C] rounded-xl border ${
                      tarefa.personalizado 
                        ? 'border-blue-500 dark:border-[#1D9BF0]/30 hover:border-blue-600 dark:hover:border-[#1D9BF0]' 
                        : 'border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-[#1D9BF0]'
                    } transition-colors`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-gray-900 dark:text-white font-medium">{tarefa.titulo}</h4>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          tarefa.prioridade === 'alta' ? 'bg-red-500/10 text-red-500' :
                          tarefa.prioridade === 'media' ? 'bg-yellow-500/10 text-yellow-500' :
                          'bg-green-500/10 text-green-500'
                        }`}>
                          <Flag className="w-3 h-3 inline-block mr-1" />
                          {tarefa.prioridade.charAt(0).toUpperCase() + tarefa.prioridade.slice(1)}
                        </span>
                        {usuario.nivel >= 2 && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setTemplateParaEditar(tarefa);
                                setShowCriarTemplate(true);
                              }}
                              className="p-1 text-blue-500 dark:text-[#1D9BF0] hover:bg-blue-500 dark:bg-[#1D9BF0]/10 rounded-full transition-colors"
                              title={tarefa.personalizado ? "Editar modelo" : "Criar cópia personalizada"}
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            {tarefa.personalizado && (
                              <button
                                onClick={(e) => handleExcluirTemplate(e, tarefa.id)}
                                className="p-1 text-red-500 hover:bg-red-500/10 rounded-full transition-colors"
                                title="Excluir modelo"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm whitespace-pre-line mb-3">
                      {tarefa.descricao}
                    </p>
                    <div className="flex items-center text-gray-500 dark:text-gray-400 text-xs">
                      <Clock className="w-3 h-3 mr-1" />
                      Tempo estimado: {tarefa.tempoEstimado}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {showCriarTemplate && (
          <CriarTemplate 
            onClose={() => {
              setShowCriarTemplate(false);
              setTemplateParaEditar(null);
            }} 
            templateParaEditar={templateParaEditar}
          />
        )}

        {/* Modal de Confirmação de Exclusão */}
        {confirmExclusao.show && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Confirmar Exclusão</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Tem certeza que deseja excluir este modelo de tarefa? Esta ação não pode ser desfeita.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setConfirmExclusao({ show: false, templateId: null })}
                  className="px-4 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarExclusao}
                  className="px-4 py-2 bg-red-500 text-gray-900 dark:text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SeletorTarefaPredefinida;

