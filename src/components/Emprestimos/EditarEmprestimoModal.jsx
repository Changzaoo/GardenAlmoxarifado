import React, { useState, useEffect } from 'react';
import { X, Trash2, Save } from 'lucide-react';

const EditarEmprestimoModal = ({ emprestimo, onClose, onSave }) => {
  const [ferramentas, setFerramentas] = useState([]);

  useEffect(() => {
    if (emprestimo) {
      setFerramentas(emprestimo.ferramentas.map(tool => ({
        ...tool,
        quantidadeOriginal: tool.quantidade
      })));
    }
  }, [emprestimo]);

  const handleRemoveTool = (toolId) => {
    setFerramentas(prevTools => prevTools.filter(tool => tool.id !== toolId));
  };

  const handleQuantityChange = (toolId, newQuantity) => {
    const maxQuantity = ferramentas.find(tool => tool.id === toolId)?.quantidadeOriginal || 0;
    const quantity = Math.min(Math.max(1, parseInt(newQuantity) || 0), maxQuantity);

    setFerramentas(prevTools =>
      prevTools.map(tool =>
        tool.id === toolId
          ? { ...tool, quantidade: quantity }
          : tool
      )
    );
  };

  const handleSave = () => {
    onSave({
      ...emprestimo,
      ferramentas: ferramentas
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#192734] text-white rounded-lg p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Editar Empréstimo</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#253341] rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          {ferramentas.map((tool) => (
            <div key={tool.id} className="flex items-center space-x-4 bg-[#253341] p-4 rounded-lg">
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
                    className="bg-[#38444D] border border-[#38444D] text-white rounded px-2 py-1 w-20"
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
            className="px-4 py-2 bg-[#253341] hover:bg-[#38444D] rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-[#1DA1F2] hover:bg-[#1a91da] rounded-lg transition-colors flex items-center space-x-2"
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