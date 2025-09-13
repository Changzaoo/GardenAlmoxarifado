import React, { useState } from 'react';
import { ShoppingCart, Edit, Trash2, ArrowUp, ArrowDown, Minus, AlertTriangle, ChevronDown } from 'lucide-react';
import ConfirmacaoModal from '../common/ConfirmacaoModal';

const STATUS_LABELS = {
  solicitado: 'Solicitado',
  aprovado: 'Aprovado',
  pedido_enviado: 'Pedido Enviado',
  recebido: 'Recebido',
  cancelado: 'Cancelado'
};

const STATUS_COLORS = {
  solicitado: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
  aprovado: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
  pedido_enviado: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
  recebido: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
  cancelado: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
};

const PRIORIDADE_LABELS = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  urgente: 'Urgente'
};

const PRIORIDADE_COLORS = {
  baixa: 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300',
  media: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
  alta: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
  urgente: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
};

const PRIORIDADE_ICONS = {
  baixa: "arrow-down",
  media: "minus",
  alta: "arrow-up",
  urgente: "alert-triangle"
};

const CompraCard = ({ 
  compra, 
  onEdit, 
  onDelete,
  onUpdate,
  readonly 
}) => {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const getPriorityIcon = (prioridade) => {
    switch (prioridade) {
      case 'baixa':
        return <ArrowDown className="w-3 h-3 mr-1" />;
      case 'media':
        return <Minus className="w-3 h-3 mr-1" />;
      case 'alta':
        return <ArrowUp className="w-3 h-3 mr-1" />;
      case 'urgente':
        return <AlertTriangle className="w-3 h-3 mr-1" />;
      default:
        return null;
    }
  };

  const handleStatusChange = (newStatus) => {
    if (!readonly) {
      onUpdate({ ...compra, status: newStatus });
      setShowStatusMenu(false);
    }
  };

  const handlePriorityChange = (newPriority) => {
    if (!readonly) {
      onUpdate({ ...compra, prioridade: newPriority });
      setShowPriorityMenu(false);
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-700 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
        <div className="p-4 h-[22rem] relative">
          {/* Cabeçalho do Card */}
          <div className="mb-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex-1">{compra.descricao}</h3>
              {!readonly && (
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => onEdit(compra)}
                    className="p-1.5 text-[#1DA1F2] hover:bg-[#1DA1F2]/10 rounded-full transition-colors"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowDeleteModal(true);
                    }}
                    className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-full transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center justify-between">
              {/* Status Badge com Dropdown */}
              <div className="relative">
                <button
                  onClick={() => !readonly && setShowStatusMenu(!showStatusMenu)}
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[compra.status]} ${!readonly && 'cursor-pointer hover:ring-2 hover:ring-offset-2 hover:ring-offset-white dark:hover:ring-offset-gray-700 hover:ring-blue-500/50'}`}
                >
                  <ShoppingCart className="w-3 h-3 mr-1" />
                  {STATUS_LABELS[compra.status]}
                  {!readonly && <ChevronDown className="w-3 h-3 ml-1" />}
                </button>
                {showStatusMenu && !readonly && (
                  <div className="absolute top-full left-0 mt-1 w-40 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10">
                    <div className="py-1">
                      {Object.entries(STATUS_LABELS).map(([value, label]) => (
                        <button
                          key={value}
                          onClick={() => handleStatusChange(value)}
                          className={`block w-full text-left px-4 py-2 text-sm ${
                            value === compra.status 
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                              : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/50'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Prioridade Badge com Dropdown */}
              <div className="relative">
                <button
                  onClick={() => !readonly && setShowPriorityMenu(!showPriorityMenu)}
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${PRIORIDADE_COLORS[compra.prioridade]} ${!readonly && 'cursor-pointer hover:ring-2 hover:ring-offset-2 hover:ring-offset-white dark:hover:ring-offset-gray-700 hover:ring-blue-500/50'}`}
                >
                  {getPriorityIcon(compra.prioridade)}
                  {PRIORIDADE_LABELS[compra.prioridade]}
                  {!readonly && <ChevronDown className="w-3 h-3 ml-1" />}
                </button>
                {showPriorityMenu && !readonly && (
                  <div className="absolute top-full left-0 mt-1 w-32 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10">
                    <div className="py-1">
                      {Object.entries(PRIORIDADE_LABELS).map(([value, label]) => (
                        <button
                          key={value}
                          onClick={() => handlePriorityChange(value)}
                          className={`block w-full text-left px-4 py-2 text-sm ${
                            value === compra.prioridade 
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                              : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/50'
                          }`}
                        >
                          <div className="flex items-center">
                            {getPriorityIcon(value)}
                            {label}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
      </div>

          {/* Detalhes da Compra */}
          <div className="space-y-2 mb-4">
            <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-300">
              <span>Quantidade</span>
              <span className="font-medium">{compra.quantidade}</span>
            </div>
            <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-300">
              <span>Valor unitário</span>
              <span className="font-medium">{formatarMoeda(compra.valorUnitario)}</span>
            </div>
            <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-300">
              <span>Frete</span>
              <span className="font-medium">
                {compra.valorFrete ? formatarMoeda(compra.valorFrete) : (
                  <span className="text-green-600 dark:text-green-400">Grátis</span>
                )}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-300">
              <span>Valor total</span>
              <span className="font-medium">
                {formatarMoeda((compra.quantidade * compra.valorUnitario) + (compra.valorFrete || 0))}
              </span>
            </div>
            {compra.fornecedor && (
              <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-300">
                <span>Fornecedor</span>
                <span className="font-medium">{compra.fornecedor}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-300">
              <span>Solicitante</span>
              <span className="font-medium">{compra.solicitante}</span>
            </div>
          </div>

          {/* Link do Produto */}
          {compra.link && compra.link.startsWith('https') && (
            <a 
              href={compra.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-2 bg-[#1DA1F2] text-white rounded-full hover:bg-[#1a91da] transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
              <span className="text-sm">Ver produto</span>
            </a>
          )}
        </div>
      </div>

      <ConfirmacaoModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => {
          onDelete(compra);
          setShowDeleteModal(false);
        }}
        titulo="Confirmar exclusão"
        mensagem={`Tem certeza que deseja excluir a compra "${compra.descricao}"? Esta ação não pode ser desfeita.`}
      />
    </>
  );
};

export default CompraCard;
