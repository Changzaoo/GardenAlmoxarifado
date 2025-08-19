import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, ShoppingCart, X } from 'lucide-react';

const STATUS_COMPRAS = {
  SOLICITADO: 'solicitado',
  APROVADO: 'aprovado',
  PEDIDO_ENVIADO: 'pedido_enviado',
  RECEBIDO: 'recebido',
  CANCELADO: 'cancelado'
};

const STATUS_LABELS = {
  solicitado: 'Solicitado',
  aprovado: 'Aprovado',
  pedido_enviado: 'Pedido Enviado',
  recebido: 'Recebido',
  cancelado: 'Cancelado'
};

const STATUS_COLORS = {
  solicitado: 'bg-blue-100 text-blue-800',
  aprovado: 'bg-green-100 text-green-800',
  pedido_enviado: 'bg-yellow-100 text-yellow-800',
  recebido: 'bg-purple-100 text-purple-800',
  cancelado: 'bg-red-100 text-red-800'
};

// Prioridades da compra
const PRIORIDADES = {
  BAIXA: 'baixa',
  MEDIA: 'media',
  ALTA: 'alta',
  URGENTE: 'urgente'
};

const PRIORIDADE_LABELS = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  urgente: 'Urgente'
};

const PRIORIDADE_COLORS = {
  baixa: 'bg-gray-100 text-gray-800',
  media: 'bg-blue-100 text-blue-800',
  alta: 'bg-orange-100 text-orange-800',
  urgente: 'bg-red-100 text-red-800'
};

const ComprasTab = ({ 
  compras, 
  inventario, 
  funcionarios,
  adicionarCompra, 
  removerCompra, 
  atualizarCompra,
  readonly = false 
}) => {
  const [filtro, setFiltro] = useState('');
  const [statusFiltro, setStatusFiltro] = useState('todos');
  const [prioridadeFiltro, setPrioridadeFiltro] = useState('todas');
  const [modalAberto, setModalAberto] = useState(false);
  const [compraEditando, setCompraEditando] = useState(null);
  const [novaCompra, setNovaCompra] = useState({
    descricao: '',
    quantidade: 1,
    valorUnitario: '',
    fornecedor: '',
    prioridade: PRIORIDADES.MEDIA,
    solicitante: '',
    observacoes: '',
    status: STATUS_COMPRAS.SOLICITADO
  });

  // Filtrar compras
  const comprasFiltradas = compras.filter(compra => {
    const matchFiltro = filtro === '' || 
      compra.descricao?.toLowerCase().includes(filtro.toLowerCase()) ||
      compra.fornecedor?.toLowerCase().includes(filtro.toLowerCase()) ||
      compra.solicitante?.toLowerCase().includes(filtro.toLowerCase());
    
    const matchStatus = statusFiltro === 'todos' || compra.status === statusFiltro;
    const matchPrioridade = prioridadeFiltro === 'todas' || compra.prioridade === prioridadeFiltro;
    
    return matchFiltro && matchStatus && matchPrioridade;
  });

  // Função para abrir modal de nova compra
  const abrirModalNova = () => {
    setCompraEditando(null);
    setNovaCompra({
      descricao: '',
      quantidade: 1,
      valorUnitario: '',
      fornecedor: '',
      prioridade: PRIORIDADES.MEDIA,
      solicitante: '',
      observacoes: '',
      status: STATUS_COMPRAS.SOLICITADO
    });
    setModalAberto(true);
  };

  // Função para abrir modal de edição
  const abrirModalEdicao = (compra) => {
    setCompraEditando(compra);
    setNovaCompra({ ...compra });
    setModalAberto(true);
  };

  // Função para salvar compra
  const salvarCompra = async (e) => {
    e.preventDefault();
    
    try {
      const dadosCompra = {
        ...novaCompra,
        quantidade: Number(novaCompra.quantidade),
        valorUnitario: parseFloat(novaCompra.valorUnitario || 0),
        valorTotal: Number(novaCompra.quantidade) * parseFloat(novaCompra.valorUnitario || 0),
        dataSolicitacao: compraEditando ? compraEditando.dataSolicitacao : new Date().toISOString().split('T')[0],
        dataAtualizacao: new Date().toISOString().split('T')[0]
      };

      if (compraEditando) {
        await atualizarCompra(compraEditando.id, dadosCompra);
      } else {
        await adicionarCompra(dadosCompra);
      }
      
      setModalAberto(false);
      setCompraEditando(null);
    } catch (error) {
      alert('Erro ao salvar compra: ' + error.message);
    }
  };

  // Função para excluir compra
  const excluirCompra = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta compra?')) {
      try {
        await removerCompra(id);
      } catch (error) {
        alert('Erro ao excluir compra: ' + error.message);
      }
    }
  };

  // Função para atualizar status
  const atualizarStatus = async (id, novoStatus) => {
    try {
      const dadosAtualizacao = {
        status: novoStatus,
        dataAtualizacao: new Date().toISOString().split('T')[0]
      };

      // Adicionar data específica para alguns status
      if (novoStatus === STATUS_COMPRAS.APROVADO) {
        dadosAtualizacao.dataAprovacao = new Date().toISOString().split('T')[0];
      } else if (novoStatus === STATUS_COMPRAS.PEDIDO_ENVIADO) {
        dadosAtualizacao.dataPedido = new Date().toISOString().split('T')[0];
      } else if (novoStatus === STATUS_COMPRAS.RECEBIDO) {
        dadosAtualizacao.dataRecebimento = new Date().toISOString().split('T')[0];
      }

      await atualizarCompra(id, dadosAtualizacao);
    } catch (error) {
      alert('Erro ao atualizar status: ' + error.message);
    }
  };

  // Calcular estatísticas
  const estatisticas = {
    total: compras.length,
    solicitado: compras.filter(c => c.status === STATUS_COMPRAS.SOLICITADO).length,
    aprovado: compras.filter(c => c.status === STATUS_COMPRAS.APROVADO).length,
    enviado: compras.filter(c => c.status === STATUS_COMPRAS.PEDIDO_ENVIADO).length,
    recebido: compras.filter(c => c.status === STATUS_COMPRAS.RECEBIDO).length,
    valorTotal: compras.reduce((acc, c) => acc + (c.valorTotal || 0), 0)
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestão de Compras</h2>
          <p className="text-gray-600">Gerenciar solicitações e pedidos de compra</p>
        </div>
        {!readonly && (
          <button
            onClick={abrirModalNova}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nova Solicitação
          </button>
        )}
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <ShoppingCart className="w-8 h-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-xl font-bold text-gray-900">{estatisticas.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm font-medium text-blue-600">Solicitado</p>
          <p className="text-xl font-bold text-blue-900">{estatisticas.solicitado}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm font-medium text-green-600">Aprovado</p>
          <p className="text-xl font-bold text-green-900">{estatisticas.aprovado}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <p className="text-sm font-medium text-yellow-600">Enviado</p>
          <p className="text-xl font-bold text-yellow-900">{estatisticas.enviado}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <p className="text-sm font-medium text-purple-600">Recebido</p>
          <p className="text-xl font-bold text-purple-900">{estatisticas.recebido}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-sm font-medium text-gray-600">Valor Total</p>
          <p className="text-lg font-bold text-gray-900">
            R$ {estatisticas.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Pesquisar compras..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFiltro}
            onChange={(e) => setStatusFiltro(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="todos">Todos os status</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <select
            value={prioridadeFiltro}
            onChange={(e) => setPrioridadeFiltro(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="todas">Todas as prioridades</option>
            {Object.entries(PRIORIDADE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <div className="text-sm text-gray-600 flex items-center">
            Mostrando {comprasFiltradas.length} de {compras.length} compras
          </div>
        </div>
      </div>

      {/* Lista de Compras */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {comprasFiltradas.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Nenhuma compra encontrada.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantidade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fornecedor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prioridade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {comprasFiltradas.map((compra) => (
                  <tr key={compra.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {compra.descricao}
                        </div>
                        {compra.solicitante && (
                          <div className="text-sm text-gray-500">
                            Solicitante: {compra.solicitante}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {compra.quantidade}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        R$ {(compra.valorUnitario || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-sm text-gray-500">
                        Total: R$ {(compra.valorTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {compra.fornecedor || 'Não informado'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={compra.status}
                        onChange={(e) => atualizarStatus(compra.id, e.target.value)}
                        disabled={readonly}
                        className={`text-xs font-medium px-2.5 py-0.5 rounded-full border-0 ${STATUS_COLORS[compra.status]} ${readonly ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        {Object.entries(STATUS_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex text-xs font-medium px-2.5 py-0.5 rounded-full ${PRIORIDADE_COLORS[compra.prioridade]}`}>
                        {PRIORIDADE_LABELS[compra.prioridade]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>Sol: {compra.dataSolicitacao}</div>
                      {compra.dataRecebimento && (
                        <div>Rec: {compra.dataRecebimento}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {!readonly && (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => abrirModalEdicao(compra)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => excluirCompra(compra.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Nova/Editar Compra */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {compraEditando ? 'Editar Compra' : 'Nova Solicitação de Compra'}
              </h3>
              <button
                onClick={() => setModalAberto(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={salvarCompra} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição do Item *
                  </label>
                  <input
                    type="text"
                    value={novaCompra.descricao}
                    onChange={(e) => setNovaCompra({ ...novaCompra, descricao: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Ex: Furadeira elétrica 1/2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantidade *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={novaCompra.quantidade}
                    onChange={(e) => setNovaCompra({ ...novaCompra, quantidade: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor Unitário (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={novaCompra.valorUnitario}
                    onChange={(e) => setNovaCompra({ ...novaCompra, valorUnitario: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fornecedor
                  </label>
                  <input
                    type="text"
                    value={novaCompra.fornecedor}
                    onChange={(e) => setNovaCompra({ ...novaCompra, fornecedor: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Nome do fornecedor"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prioridade *
                  </label>
                  <select
                    value={novaCompra.prioridade}
                    onChange={(e) => setNovaCompra({ ...novaCompra, prioridade: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  >
                    {Object.entries(PRIORIDADE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Solicitante
                  </label>
                  <input
                    type="text"
                    value={novaCompra.solicitante}
                    onChange={(e) => setNovaCompra({ ...novaCompra, solicitante: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Nome do solicitante"
                  />
                </div>
                {compraEditando && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={novaCompra.status}
                      onChange={(e) => setNovaCompra({ ...novaCompra, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      {Object.entries(STATUS_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observações
                  </label>
                  <textarea
                    value={novaCompra.observacoes}
                    onChange={(e) => setNovaCompra({ ...novaCompra, observacoes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Observações adicionais..."
                  />
                </div>
              </div>
              {/* Valor total calculado */}
              {novaCompra.quantidade && novaCompra.valorUnitario && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Valor Total:</span>
                    <span className="text-lg font-bold text-gray-900">
                      R$ {(Number(novaCompra.quantidade) * parseFloat(novaCompra.valorUnitario)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-lg hover:bg-purple-700"
                >
                  {compraEditando ? 'Atualizar' : 'Solicitar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComprasTab;