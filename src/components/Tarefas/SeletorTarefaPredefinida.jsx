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

  // Carregar templates personalizados
  useEffect(() => {
    try {
      const unsubscribe = carregarTemplatesPersonalizados(templates => {
        console.log('Templates carregados:', templates); // Para debug
        setTemplatesPersonalizados(templates);
      });
      return () => unsubscribe();
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
      showToast('Erro ao carregar templates personalizados', 'error');
    }
  }, [showToast]);

  // Combinar templates do sistema e personalizados
  const todasTarefas = [...TAREFAS_PREDEFINIDAS, ...templatesPersonalizados];
  const tiposTarefa = [...new Set(todasTarefas.map(t => t.tipo))].sort();

  const handleExcluirTemplate = async (e, templateId) => {
    e.stopPropagation();
    if (window.confirm('Tem certeza que deseja excluir este modelo?')) {
      const sucesso = await excluirTemplatePersonalizado(templateId);
      if (sucesso) {
        showToast('Modelo excluído com sucesso!', 'success');
      } else {
        showToast('Erro ao excluir modelo', 'error');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#192734] rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">Selecione um Modelo de Tarefa</h2>
            <p className="text-sm text-[#8899A6]">Escolha um modelo existente ou crie um novo</p>
          </div>
          <div className="flex items-center gap-2">
            {usuario.nivel >= 2 && (
              <button
                onClick={() => setShowCriarTemplate(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#1DA1F2] text-white rounded-full hover:bg-[#1a91da] transition-colors"
              >
                <Plus className="w-4 h-4" />
                Criar Modelo
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-[#8899A6] hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              &times;
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {tiposTarefa.map(tipo => (
            <div key={tipo}>
              <h3 className="text-lg font-medium text-[#8899A6] mb-3">{tipo}</h3>
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
                        ? 'border-[#1DA1F2]/30 hover:border-[#1DA1F2]' 
                        : 'border-[#38444D] hover:border-[#1DA1F2]'
                    } transition-colors`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-white font-medium">{tarefa.titulo}</h4>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          tarefa.prioridade === 'alta' ? 'bg-red-500/10 text-red-500' :
                          tarefa.prioridade === 'media' ? 'bg-yellow-500/10 text-yellow-500' :
                          'bg-green-500/10 text-green-500'
                        }`}>
                          <Flag className="w-3 h-3 inline-block mr-1" />
                          {tarefa.prioridade.charAt(0).toUpperCase() + tarefa.prioridade.slice(1)}
                        </span>
                        {tarefa.personalizado && usuario.nivel >= 2 && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setTemplateParaEditar(tarefa);
                                setShowCriarTemplate(true);
                              }}
                              className="p-1 text-[#1DA1F2] hover:bg-[#1DA1F2]/10 rounded-full transition-colors"
                              title="Editar modelo"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => handleExcluirTemplate(e, tarefa.id)}
                              className="p-1 text-red-500 hover:bg-red-500/10 rounded-full transition-colors"
                              title="Excluir modelo"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-[#8899A6] text-sm whitespace-pre-line mb-3">
                      {tarefa.descricao}
                    </p>
                    <div className="flex items-center text-[#8899A6] text-xs">
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
      </div>
    </div>
  );
};

export default SeletorTarefaPredefinida;
