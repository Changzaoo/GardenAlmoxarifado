import React from 'react';
import { ShoppingCart, Edit, Trash2 } from 'lucide-react';

const STATUS_LABELS = {
  solicitado: 'Solicitado',
  aprovado: 'Aprovado',
  pedido_enviado: 'Pedido Enviado',
  recebido: 'Recebido',
  cancelado: 'Cancelado'
};

const STATUS_COLORS = {
  solicitado: 'bg-[#1D9BF0] bg-opacity-10 text-[#1D9BF0]',
  aprovado: 'bg-[#00BA7C] bg-opacity-10 text-[#00BA7C]',
  pedido_enviado: 'bg-[#FFD700] bg-opacity-10 text-[#FFD700]',
  recebido: 'bg-[#7856FF] bg-opacity-10 text-[#7856FF]',
  cancelado: 'bg-[#F4212E] bg-opacity-10 text-[#F4212E]'
};

const PRIORIDADE_LABELS = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  urgente: 'Urgente'
};

const PRIORIDADE_COLORS = {
  baixa: 'bg-[#8899A6] bg-opacity-10 text-[#8899A6]',
  media: 'bg-[#1D9BF0] bg-opacity-10 text-[#1D9BF0]',
  alta: 'bg-[#FFD700] bg-opacity-10 text-[#FFD700]',
  urgente: 'bg-[#F4212E] bg-opacity-10 text-[#F4212E]'
};

const CompraCard = ({ 
  compra, 
  onEdit, 
  onDelete,
  onUpdate,
  readonly 
}) => {
  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  return (
    <div className="bg-[#253341] rounded-lg p-4 border border-[#38444D] hover:border-[#1DA1F2] transition-colors">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-[#1DA1F2]" />
          <h3 className="text-white font-medium">{compra.descricao}</h3>
        </div>
        {!readonly && (
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(compra)}
              className="text-[#8899A6] hover:text-[#1DA1F2] transition-colors"
            >
              <Edit size={16} />
            </button>
            <button
              onClick={() => onDelete(compra)}
              className="text-[#8899A6] hover:text-[#F4212E] transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-2 mb-3">
        {!readonly ? (
          <select
            value={compra.status}
            onChange={(e) => onUpdate({ ...compra, status: e.target.value })}
            className={`px-2 py-1 rounded-full text-xs font-medium appearance-none cursor-pointer ${STATUS_COLORS[compra.status]} focus:outline-none focus:ring-2 focus:ring-[#1DA1F2] hover:bg-opacity-20`}
            style={{
              WebkitAppearance: 'none',
              MozAppearance: 'none',
              backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'currentColor\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 0.5rem center',
              backgroundSize: '1em 1em',
              paddingRight: '2rem'
            }}
          >
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value} className="bg-[#253341]">{label}</option>
            ))}
          </select>
        ) : (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[compra.status]}`}>
            {STATUS_LABELS[compra.status]}
          </span>
        )}
        
        {!readonly ? (
          <select
            value={compra.prioridade}
            onChange={(e) => onUpdate({ ...compra, prioridade: e.target.value })}
            className={`px-2 py-1 rounded-full text-xs font-medium appearance-none cursor-pointer ${PRIORIDADE_COLORS[compra.prioridade]} focus:outline-none focus:ring-2 focus:ring-[#1DA1F2] hover:bg-opacity-20`}
            style={{
              WebkitAppearance: 'none',
              MozAppearance: 'none',
              backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'currentColor\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 0.5rem center',
              backgroundSize: '1em 1em',
              paddingRight: '2rem'
            }}
          >
            {Object.entries(PRIORIDADE_LABELS).map(([value, label]) => (
              <option key={value} value={value} className="bg-[#253341]">{label}</option>
            ))}
          </select>
        ) : (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${PRIORIDADE_COLORS[compra.prioridade]}`}>
            {PRIORIDADE_LABELS[compra.prioridade]}
          </span>
        )}
      </div>

      <div className="space-y-2 text-sm">
        <p className="text-[#8899A6]">
          <span className="text-white">Quantidade:</span> {compra.quantidade}
        </p>
        <p className="text-[#8899A6]">
          <span className="text-white">Valor unitário:</span> {formatarMoeda(compra.valorUnitario)}
        </p>
        <p className="text-[#8899A6]">
          <span className="text-white">Valor total:</span> {formatarMoeda(compra.quantidade * compra.valorUnitario)}
        </p>
        {compra.fornecedor && (
          <p className="text-[#8899A6]">
            <span className="text-white">Fornecedor:</span> {compra.fornecedor}
          </p>
        )}
        <p className="text-[#8899A6]">
          <span className="text-white">Solicitante:</span> {compra.solicitante}
        </p>
        {compra.link && compra.link.startsWith('https') && (
          <a 
            href={compra.link}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center justify-center px-4 py-2 bg-[#1DA1F2] hover:bg-[#1a91da] text-white rounded-full text-sm transition-colors w-full"
          >
            Ver produto
          </a>
        )}
      </div>
    </div>
  );
};

export default CompraCard;
