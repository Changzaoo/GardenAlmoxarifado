import React, { useState, useEffect } from 'react';
import { X, Trash2, Save } from 'lucide-react';

const EditarEmprestimoModal = ({ emprestimo, onClose, onSave }) => {
  const [ferramentasEditadas, setFerramentasEditadas] = useState([]);
  const [emprestimoEditado, setEmprestimoEditado] = useState(null);

  useEffect(() => {
    if (emprestimo) {
      // Faz uma cópia profunda do empréstimo
      const emprestimoClone = JSON.parse(JSON.stringify(emprestimo));
      
      // Garante que todas as ferramentas tenham as propriedades necessárias
      const ferramentasProcessadas = emprestimoClone.ferramentas.map(tool => ({
        ...tool,
        id: tool.id,
        nome: tool.nome || 'Ferramenta sem nome',
        quantidade: tool.quantidade || 1,
        quantidadeOriginal: tool.quantidade || 1,
        codigo: tool.codigo,
        descricao: tool.descricao
      }));

      setFerramentasEditadas(ferramentasProcessadas);
      setEmprestimoEditado(emprestimoClone);
    }
  }, [emprestimo]);

  const handleRemoveTool = (toolId) => {
    setFerramentasEditadas(prevTools => prevTools.filter(tool => tool.id !== toolId));
  };

  const handleQuantityChange = (toolId, newQuantity) => {
    const maxQuantity = ferramentasEditadas.find(tool => tool.id === toolId)?.quantidadeOriginal || 0;
    const quantity = Math.min(Math.max(1, parseInt(newQuantity) || 0), maxQuantity);

    setFerramentasEditadas(prevTools =>
      prevTools.map(tool =>
        tool.id === toolId
          ? { 
              ...tool,
              quantidade: quantity,
              // Preserva todas as propriedades importantes
              nome: tool.nome,
              codigo: tool.codigo,
              descricao: tool.descricao
            }
          : tool
      )
    );
  };

  const handleSave = () => {
    if (!emprestimoEditado) return;

    const emprestimoAtualizado = {
      ...emprestimoEditado,
      ferramentas: ferramentasEditadas.map(ferramenta => ({
        id: ferramenta.id,
        nome: ferramenta.nome,
        quantidade: ferramenta.quantidade,
        codigo: ferramenta.codigo,
        descricao: ferramenta.descricao
      }))
    };

    onSave(emprestimoAtualizado);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4 pb-24 md:pb-4">
      <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg p-6 w-full max-w-2xl max-h-[calc(100vh-12rem)] md:max-h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Editar Empréstimo</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white dark:bg-gray-700 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          {ferramentasEditadas.map((tool) => (
            <div key={tool.id} className="flex items-center space-x-4 bg-white dark:bg-gray-800 dark:bg-gray-700 p-4 rounded-lg">
              <div className="flex-grow">
                <h3 className="font-medium">{tool.nome}</h3>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <label htmlFor={`quantity-${tool.id}`} className="text-sm">Quantidade:</label>
                  <input
                    id={`quantity-${tool.id}`}
                    type="number"
                    min="1"
                    max={tool.quantidadeOriginal}
                    value={tool.quantidade}
                    onChange={(e) => handleQuantityChange(tool.id, e.target.value)}
                    className="bg-[#38444D] border border-gray-200 dark:border-gray-600 dark:border-gray-600 text-gray-900 dark:text-white rounded px-2 py-1 w-20"
                  />
                  <span className="text-sm text-gray-400">
                    (max: {tool.quantidadeOriginal})
                  </span>
                </div>
                <button
                  onClick={() => handleRemoveTool(tool.id)}
                  className="p-2 hover:bg-[#38444D] rounded-full transition-colors text-red-500"
                  title="Remover ferramenta"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end mt-6 space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white dark:bg-gray-800 dark:bg-gray-700 hover:bg-[#38444D] rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-500 dark:bg-[#1D9BF0] hover:bg-blue-600 dark:hover:bg-[#1a8cd8] rounded-lg transition-colors flex items-center space-x-2"
          >
            <Save size={20} />
            <span>Salvar Alterações</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditarEmprestimoModal;

