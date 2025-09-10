import React, { useState } from 'react';
import { Trash2, Pencil } from 'lucide-react';

const ItemCard = ({ item, onRemover, onEditar, detalhesEmprestimos }) => {
  const percentualDisponivel = (item.disponivel / item.quantidade) * 100;
  const [mostrarDetalhes, setMostrarDetalhes] = useState(false);
  
  const getStatusColor = () => {
    if (item.disponivel === 0) return 'bg-[#F4212E]';
    if (item.disponivel < item.quantidade * 0.3) return 'bg-[#FAA626]';
    return 'bg-[#1DA1F2]';
  };

  const getStatusText = () => {
    if (item.disponivel === 0) return 'text-[#F4212E]';
    if (item.disponivel < item.quantidade * 0.3) return 'text-[#FAA626]';
    return 'text-[#1DA1F2]';
  };

  const formatarData = (data) => {
    return new Date(data).toLocaleDateString('pt-BR');
  };

  return (
    <div className="bg-[#253341] border border-[#38444D] rounded-2xl p-4 hover:border-[#1DA1F2] transition-all shadow-sm">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 mr-2">
          <h3 className="font-semibold text-white text-sm leading-tight">{item.nome}</h3>
          <div className="text-xs text-[#8899A6] mt-1">{item.categoria}</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEditar(item)}
            className="text-[#1DA1F2] hover:text-[#1a91da] p-1 flex-shrink-0"
            title="Editar item"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => onRemover(item.id)}
            className="text-[#F4212E] hover:text-[#dc1e29] p-1 flex-shrink-0"
            title="Remover item"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="space-y-2 text-sm text-[#8899A6]">
        <div className="flex justify-between">
          <span>Total:</span>
          <span className="font-medium text-white">{item.quantidade}</span>
        </div>
        <div className="flex justify-between">
          <span>Disponível:</span>
          <span className={`font-medium ${getStatusText()}`}>
            {item.disponivel}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Em uso:</span>
          <span className="font-medium text-white">{item.quantidade - item.disponivel}</span>
        </div>

        {/* Lista de quem está com o item */}
        {mostrarDetalhes && detalhesEmprestimos && detalhesEmprestimos.length > 0 && (
          <div className="mt-4 border-t border-[#38444D] pt-4 space-y-3">
            {detalhesEmprestimos.map((emprestimo, index) => (
              <div key={index} className="text-sm">
                <div className="flex justify-between text-white">
                  <span>{emprestimo.colaborador}</span>
                  <span className="text-[#8899A6]">Qtd: {emprestimo.quantidade}</span>
                </div>
                <div className="text-[#8899A6] text-xs">
                  Retirado em: {formatarData(emprestimo.dataRetirada)} às {emprestimo.horaRetirada}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Barra de progresso */}
      <div className="mt-3">
        <div className="bg-[#38444D] rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${getStatusColor()}`}
            style={{
              width: `${percentualDisponivel}%`
            }}
          ></div>
        </div>
        <div className="text-xs text-[#8899A6] mt-1 text-center">
          {Math.round(percentualDisponivel)}% disponível
        </div>

        {/* Botão Ver quem está usando movido para baixo da porcentagem */}
        {item.quantidade - item.disponivel > 0 && (
          <button
            onClick={() => setMostrarDetalhes(!mostrarDetalhes)}
            className="text-[#1DA1F2] hover:text-[#1a91da] text-sm w-full text-center mt-2"
          >
            {mostrarDetalhes ? 'Ocultar detalhes' : 'Ver quem está usando'}
          </button>
        )}
      </div>
    </div>
  );
};

export default ItemCard;