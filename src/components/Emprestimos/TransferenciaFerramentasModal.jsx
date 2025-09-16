import React, { useState } from 'react';
import { X } from 'lucide-react';

const TransferenciaFerramentasModal = ({ onClose, onConfirm, emprestimo, funcionarios }) => {
  const [selectedTools, setSelectedTools] = useState([]);
  const [selectedFuncionario, setSelectedFuncionario] = useState('');
  const [observacao, setObservacao] = useState('');
  const [selectedFerramentaId, setSelectedFerramentaId] = useState('');

  // Efeito para atualizar a ferramenta selecionada quando o dropdown muda
  const handleFerramentaChange = (e) => {
    const toolId = e.target.value;
    setSelectedFerramentaId(toolId);
    if (toolId) {
      const tool = emprestimo.ferramentas.find(t => t.id === toolId);
      if (tool && !selectedTools.some(t => t.id === toolId)) {
        setSelectedTools(prev => [...prev, tool]);
        setSelectedFerramentaId(''); // Limpa a seleção após adicionar
      }
    }
  };

  const handleSubmit = () => {
    if (selectedTools.length === 0) {
      alert('Selecione pelo menos uma ferramenta para transferir');
      return;
    }

    if (!selectedFuncionario) {
      alert('Selecione um funcionário para receber as ferramentas');
      return;
    }

    onConfirm({
      ferramentas: selectedTools,
      funcionarioDestino: selectedFuncionario,
      observacao
    });
    onClose();
  };

  const handleToolSelection = (e) => {
    const toolId = e.target.value;
    if (!toolId) return;
    
    const tool = emprestimo.ferramentas.find(t => t.id === toolId);
    console.log('Tool selected:', { toolId, tool, allTools: emprestimo.ferramentas });
    
    if (tool) {
      setSelectedTools(prevTools => {
        // Verifica se a ferramenta já está selecionada
        if (prevTools.find(t => t.id === toolId)) {
          console.log('Tool already selected');
          return prevTools;
        }
        console.log('Adding tool to selection');
        return [...prevTools, tool];
      });
      setSelectedFerramentaId(''); // Reset selection after adding
    } else {
      console.log('Tool not found in emprestimo');
    }
  };

  const handleRemoveTool = (toolId) => {
    setSelectedTools(selectedTools.filter(tool => tool.id !== toolId));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-100 dark:bg-[#192734] rounded-lg shadow-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Transferir Ferramentas
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6 space-y-4">
          <div>
            <h4 className="text-base font-medium text-gray-900 dark:text-white mb-2">
              Selecione as ferramentas para transferir:
            </h4>
            <div className="space-y-4">
              <select
                value={selectedFerramentaId}
                onChange={handleFerramentaChange}
                className="w-full bg-[#253341] border border-[#38444D] text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1DA1F2] transition-colors hover:bg-[#2C3640]"
              >
                <option value="" className="bg-[#192734]">Selecione uma ferramenta</option>
                {emprestimo?.ferramentas
                  ?.filter(tool => !selectedTools.some(t => t.id === tool.id))
                  .map(tool => (
                    <option key={tool.id} value={tool.id} className="bg-[#192734]">
                      {tool.nome} ({tool.quantidade} {tool.quantidade > 1 ? 'unidades' : 'unidade'})
                    </option>
                  ))
                }
              </select>

              {selectedTools.length > 0 && (
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedTools.map(tool => (
                    <div 
                      key={tool.id} 
                      className="flex items-center justify-between gap-3 p-2 bg-[#253341] rounded-lg group hover:bg-[#2C3640] transition-colors"
                    >
                      <span className="text-sm text-white">
                        {tool.nome} ({tool.quantidade} {tool.quantidade > 1 ? 'unidades' : 'unidade'})
                      </span>
                      <button
                        onClick={() => handleRemoveTool(tool.id)}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <h4 className="text-base font-medium text-gray-900 dark:text-white mb-2">
              Selecione o funcionário que receberá as ferramentas:
            </h4>
            <select
              value={selectedFuncionario}
              onChange={(e) => setSelectedFuncionario(e.target.value)}
              className="w-full bg-[#253341] border border-[#38444D] text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1DA1F2] transition-colors hover:bg-[#2C3640]"
            >
              <option value="" className="bg-[#192734]">Selecione um funcionário</option>
              {funcionarios?.map(func => (
                <option 
                  key={func.id} 
                  value={func.id}
                  className="bg-[#192734]"
                  disabled={func.id === emprestimo?.funcionarioId}
                >
                  {func.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <h4 className="text-base font-medium text-gray-900 dark:text-white mb-2">
              Observação (opcional):
            </h4>
            <textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Adicione uma observação sobre a transferência..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-[#22303c] focus:ring-[#1D9BF0] focus:border-[#1D9BF0] h-24 resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-[#22303c] hover:bg-gray-200 dark:hover:bg-[#2C3C4C] rounded-lg"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-sm font-medium text-white bg-[#1D9BF0] hover:bg-[#1A8CD8] dark:bg-[#1A8CD8] dark:hover:bg-[#1A8CD8]/80 rounded-lg"
          >
            Confirmar Transferência
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransferenciaFerramentasModal;