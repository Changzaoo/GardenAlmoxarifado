import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, ShoppingCart, X } from 'lucide-react';
import { twitterThemeConfig } from '../../styles/twitterThemeConfig';

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
  solicitado: 'bg-[#1D9BF0] bg-opacity-10 text-[#1D9BF0]',
  aprovado: 'bg-[#00BA7C] bg-opacity-10 text-[#00BA7C]',
  pedido_enviado: 'bg-[#FFD700] bg-opacity-10 text-[#FFD700]',
  recebido: 'bg-[#7856FF] bg-opacity-10 text-[#7856FF]',
  cancelado: 'bg-[#F4212E] bg-opacity-10 text-[#F4212E]'
};

const STATUS_CSS_VARS = {
  solicitado: { '--background': '#1D9BF0', '--text': '#1D9BF0' },
  aprovado: { '--background': '#00BA7C', '--text': '#00BA7C' },
  pedido_enviado: { '--background': '#FFD700', '--text': '#FFD700' },
  recebido: { '--background': '#7856FF', '--text': '#7856FF' },
  cancelado: { '--background': '#F4212E', '--text': '#F4212E' }
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
  baixa: 'bg-[#8899A6] bg-opacity-10 text-[#8899A6]',
  media: 'bg-[#1D9BF0] bg-opacity-10 text-[#1D9BF0]',
  alta: 'bg-[#FFD700] bg-opacity-10 text-[#FFD700]',
  urgente: 'bg-[#F4212E] bg-opacity-10 text-[#F4212E]'
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
  

  const { colors, classes } = twitterThemeConfig;
  const [filtro, setFiltro] = useState('');
  const [statusFiltro, setStatusFiltro] = useState('todos');
  const [prioridadeFiltro, setPrioridadeFiltro] = useState('todas');
  const [modalAberto, setModalAberto] = useState(false);
  const [modalConfirmacao, setModalConfirmacao] = useState(false);
  const [compraParaExcluir, setCompraParaExcluir] = useState(null);
  const [compraEditando, setCompraEditando] = useState(null);
  const [novaCompra, setNovaCompra] = useState({
    descricao: '',
    quantidade: 1,
    valorUnitario: '',
    fornecedor: '',
    prioridade: PRIORIDADES.MEDIA,
    solicitante: '',
    observacoes: '',
    link: '',
    status: STATUS_COMPRAS.SOLICITADO
  });
  
  const [detalhesCompra, setDetalhesCompra] = useState(null);

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
        dataSolicitacao: compraEditando ? compraEditando.dataSolicitacao : new Date(),
        dataAtualizacao: new Date()
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
  const confirmarExclusao = (compra) => {
    setCompraParaExcluir(compra);
    setModalConfirmacao(true);
  };

  const excluirCompra = async () => {
    try {
      await removerCompra(compraParaExcluir.id);
      setModalConfirmacao(false);
      setCompraParaExcluir(null);
    } catch (error) {
      // TODO: Substituir por um toast ou notificação mais elegante
      alert('Erro ao excluir compra: ' + error.message);
    }
  };

  // Função para atualizar status
  const atualizarStatus = async (id, novoStatus) => {
    try {
      const dadosAtualizacao = {
        status: novoStatus,
        dataAtualizacao: new Date()
      };

      // Adicionar data específica para alguns status
      if (novoStatus === STATUS_COMPRAS.APROVADO) {
        dadosAtualizacao.dataAprovacao = new Date();
      } else if (novoStatus === STATUS_COMPRAS.PEDIDO_ENVIADO) {
        dadosAtualizacao.dataPedido = new Date();
      } else if (novoStatus === STATUS_COMPRAS.RECEBIDO) {
        dadosAtualizacao.dataRecebimento = new Date();
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

          <p className={colors.textSecondary}>Gerenciar solicitações e pedidos de compra</p>
        </div>
        {!readonly && (
          <button
            onClick={abrirModalNova}
            className="bg-[#1DA1F2] text-white rounded-full px-4 py-2 flex items-center justify-center gap-2 hover:bg-[#1a91da] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nova Solicitação
          </button>
        )}
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className={`${classes.card} p-4`}>
          <div className="flex items-center">
            <div className="bg-[#1DA1F2] bg-opacity-10 p-3 rounded-full">
              <ShoppingCart className="w-8 h-8 text-[#1DA1F2]" />
            </div>
            <div className="ml-3">
              <p className={`text-sm font-medium ${colors.textSecondary}`}>Total</p>
              <p className={`text-xl font-bold ${colors.text}`}>{estatisticas.total}</p>
            </div>
          </div>
        </div>
        <div className={`${classes.card} p-4`}>
          <div className="flex flex-col">
            <p className={`text-sm font-medium ${colors.textSecondary}`}>Solicitado</p>
            <p className={`text-xl font-bold ${colors.text}`}>{estatisticas.solicitado}</p>
          </div>
        </div>
        <div className={`${classes.card} p-4`}>
          <div className="flex flex-col">
            <p className={`text-sm font-medium ${colors.textSecondary}`}>Aprovado</p>
            <p className={`text-xl font-bold ${colors.text}`}>{estatisticas.aprovado}</p>
          </div>
        </div>
        <div className={`${classes.card} p-4`}>
          <div className="flex flex-col">
            <p className={`text-sm font-medium ${colors.textSecondary}`}>Enviado</p>
            <p className={`text-xl font-bold ${colors.text}`}>{estatisticas.enviado}</p>
          </div>
        </div>
        <div className={`${classes.card} p-4`}>
          <div className="flex flex-col">
            <p className={`text-sm font-medium ${colors.textSecondary}`}>Recebido</p>
            <p className={`text-xl font-bold ${colors.text}`}>{estatisticas.recebido}</p>
          </div>
        </div>
        <div className={`${classes.card} p-4`}>
          <div className="flex flex-col">
            <p className={`text-sm font-medium ${colors.textSecondary}`}>Valor Total</p>
            <p className={`text-lg font-bold ${colors.text}`}>
              R$ {estatisticas.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className={`${classes.card} p-4 space-y-4`}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center z-10">
              <Search className={`w-5 h-5 ml-3 ${colors.textSecondary}`} />
            </div>
            <div className="absolute inset-y-0 left-14 flex items-center pointer-events-none">
              {!filtro && (
                <span className="text-gray-500">
                  Pesquisar compras...
                </span>
              )}
            </div>
            <input
              type="text"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className={`${classes.searchInput} pl-12`}
            />
          </div>
          <select
            value={statusFiltro}
            onChange={(e) => setStatusFiltro(e.target.value)}
            className="w-full bg-[#253341] border border-[#38444D] text-white rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1DA1F2] transition-colors appearance-none hover:bg-[#2C3D4F] [&>option]:bg-[#192734] [&>option:hover]:bg-[#2C3D4F] [&>option:checked]:bg-[#2C3D4F]"
            style={{
              backgroundColor: '#253341',
            }}
          >
            <option value="todos" className="!bg-[#192734]">Todos os status</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value} className="!bg-[#192734]">{label}</option>
            ))}
          </select>
          <select
            value={prioridadeFiltro}
            onChange={(e) => setPrioridadeFiltro(e.target.value)}
            className="w-full bg-[#253341] border border-[#38444D] text-white rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1DA1F2] transition-colors appearance-none hover:bg-[#2C3D4F] [&>option]:bg-[#192734] [&>option:hover]:bg-[#2C3D4F] [&>option:checked]:bg-[#2C3D4F]"
            style={{
              backgroundColor: '#253341',
            }}
          >
            <option value="todas" className="!bg-[#192734]">Todas as prioridades</option>
            {Object.entries(PRIORIDADE_LABELS).map(([value, label]) => (
              <option key={value} value={value} className="!bg-[#192734]">{label}</option>
            ))}
          </select>
          <div className={`text-sm ${colors.textSecondary} flex items-center`}>
            Mostrando {comprasFiltradas.length} de {compras.length} compras
          </div>
        </div>
      </div>

      {/* Lista de Compras */}
      <div className={`${classes.card} overflow-hidden`}>
        {comprasFiltradas.length === 0 ? (
          <div className={`p-8 text-center ${colors.textSecondary}`}>
            <ShoppingCart className={`w-12 h-12 mx-auto mb-4 ${colors.textSecondary}`} />
            <p>Nenhuma compra encontrada.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={classes.tableHeader}>
                <tr>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${colors.textSecondary} uppercase tracking-wider`}>
                    Ações
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${colors.textSecondary} uppercase tracking-wider`}>
                    Item
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${colors.textSecondary} uppercase tracking-wider`}>
                    Data Solicitação
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${colors.textSecondary} uppercase tracking-wider`}>
                    QTD
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${colors.textSecondary} uppercase tracking-wider`}>
                    Valor
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${colors.textSecondary} uppercase tracking-wider`}>
                    Fornecedor
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${colors.textSecondary} uppercase tracking-wider`}>
                    Status
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium ${colors.textSecondary} uppercase tracking-wider`}>
                    Prioridade
                  </th>
                </tr>
              </thead>
              <tbody className={classes.tableBody}>
                {comprasFiltradas.map((compra) => (
                  <tr key={compra.id} className={classes.tableRow}>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {!readonly && (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => abrirModalEdicao(compra)}
                            className={`${colors.primary} hover:${colors.primaryHover}`}
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => confirmarExclusao(compra)}
                            className={`${colors.danger} hover:${colors.dangerHover}`}
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className={`text-sm font-medium ${colors.text}`}>
                          {compra.descricao}
                        </div>
                        {compra.solicitante && (
                          <div className={`text-sm ${colors.textSecondary}`}>
                            Solicitante: {compra.solicitante}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${colors.textSecondary}`}>
                      {compra.dataSolicitacao?.toDate ? compra.dataSolicitacao.toDate().toLocaleDateString('pt-BR') : compra.dataSolicitacao}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${colors.text} cursor-pointer`}
                        onClick={() => setDetalhesCompra(compra)}>
                      {compra.quantidade}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap cursor-pointer"
                        onClick={() => setDetalhesCompra(compra)}>
                      <div className={`text-sm ${colors.text}`}>
                        R$ {(compra.valorUnitario || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                      <div className={`text-sm ${colors.textSecondary}`}>
                        Total: R$ {(compra.valorTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${colors.text} cursor-pointer`}
                        onClick={() => setDetalhesCompra(compra)}>
                      {compra.fornecedor || 'Não informado'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {!readonly ? (
                          <select
                            value={compra.status}
                            onChange={(e) => atualizarStatus(compra.id, e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className={`appearance-none inline-flex text-xs font-medium px-2.5 py-0.5 rounded-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1DA1F2] transition-colors border-0 min-w-[120px] ${STATUS_COLORS[compra.status]}`}
                            style={{
                              ...STATUS_CSS_VARS[compra.status],
                              WebkitAppearance: 'none',
                              MozAppearance: 'none',
                              backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'currentColor\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")',
                              backgroundRepeat: 'no-repeat',
                              backgroundPosition: 'right 0.5rem center',
                              backgroundSize: '1em 1em',
                              paddingRight: '2rem',
                              width: 'auto'
                            }}
                          >
                            {Object.entries(STATUS_LABELS).map(([value, label]) => {
                              const colors = STATUS_COLORS[value].split(' ');
                              const bgColor = colors[0];
                              const textColor = colors[2];
                              return (
                                <option 
                                  key={value} 
                                  value={value} 
                                  className={`${bgColor} ${textColor} bg-opacity-10`}
                                  style={{ backgroundColor: 'var(--background)', color: 'var(--text)' }}
                                >
                                  {label}
                                </option>
                              );
                            })}
                          </select>
                        ) : (
                          <span className={`inline-flex text-xs font-medium px-2.5 py-0.5 rounded-full ${STATUS_COLORS[compra.status]}`}>
                            {STATUS_LABELS[compra.status]}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex text-xs font-medium px-2.5 py-0.5 rounded-full ${PRIORIDADE_COLORS[compra.prioridade]}`}>
                        {PRIORIDADE_LABELS[compra.prioridade]}
                      </span>
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
          <div className={`${classes.card} p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-lg font-medium ${colors.text}`}>
                {compraEditando ? 'Editar Compra' : 'Nova Solicitação de Compra'}
              </h3>
              <button
                onClick={() => setModalAberto(false)}
                className={`${colors.textSecondary} hover:${colors.text}`}
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={salvarCompra} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className={`block text-sm font-medium ${colors.text} mb-2`}>
                    Descrição do Item *
                  </label>
                  <input
                    type="text"
                    value={novaCompra.descricao}
                    onChange={(e) => setNovaCompra({ ...novaCompra, descricao: e.target.value })}
                    className={classes.input}
                    placeholder="Ex: Furadeira elétrica 1/2"
                    required
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${colors.text} mb-2`}>
                    Quantidade *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={novaCompra.quantidade}
                    onChange={(e) => setNovaCompra({ ...novaCompra, quantidade: e.target.value })}
                    className={classes.input}
                    required
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${colors.text} mb-2`}>
                    Valor Unitário (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={novaCompra.valorUnitario}
                    onChange={(e) => setNovaCompra({ ...novaCompra, valorUnitario: e.target.value })}
                    className={classes.input}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${colors.text} mb-2`}>
                    Fornecedor
                  </label>
                  <input
                    type="text"
                    value={novaCompra.fornecedor}
                    onChange={(e) => setNovaCompra({ ...novaCompra, fornecedor: e.target.value })}
                    className={classes.input}
                    placeholder="Nome do fornecedor"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${colors.text} mb-2`}>
                    Prioridade *
                  </label>
                  <select
                    value={novaCompra.prioridade}
                    onChange={(e) => setNovaCompra({ ...novaCompra, prioridade: e.target.value })}
                    className="w-full bg-[#253341] border border-[#38444D] text-white rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1DA1F2] transition-colors appearance-none"
                    required
                  >
                    {Object.entries(PRIORIDADE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium ${colors.text} mb-2`}>
                    Link da Compra
                  </label>
                  <input
                    type="url"
                    value={novaCompra.link}
                    onChange={(e) => setNovaCompra({ ...novaCompra, link: e.target.value })}
                    className={classes.input}
                    placeholder="https://"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${colors.text} mb-2`}>
                    Solicitante
                  </label>
                  <input
                    type="text"
                    value={novaCompra.solicitante}
                    onChange={(e) => setNovaCompra({ ...novaCompra, solicitante: e.target.value })}
                    className={classes.input}
                    placeholder="Nome do solicitante"
                  />
                </div>
                {compraEditando && (
                  <div>
                    <label className={`block text-sm font-medium ${colors.text} mb-2`}>
                      Status
                    </label>
                    <select
                      value={novaCompra.status}
                      onChange={(e) => setNovaCompra({ ...novaCompra, status: e.target.value })}
                      className="w-full bg-[#253341] border border-[#38444D] text-white rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1DA1F2] transition-colors appearance-none"
                    >
                      {Object.entries(STATUS_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="md:col-span-2">
                  <label className={`block text-sm font-medium ${colors.text} mb-2`}>
                    Observações
                  </label>
                  <textarea
                    value={novaCompra.observacoes}
                    onChange={(e) => setNovaCompra({ ...novaCompra, observacoes: e.target.value })}
                    rows={3}
                    className={classes.textarea}
                    placeholder="Observações adicionais..."
                  />
                </div>
              </div>
              {/* Valor total calculado */}
              {novaCompra.quantidade && novaCompra.valorUnitario && (
                <div className={`${classes.card} p-4`}>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm font-medium ${colors.textSecondary}`}>Valor Total:</span>
                    <span className={`text-lg font-bold ${colors.text}`}>
                      R$ {(Number(novaCompra.quantidade) * parseFloat(novaCompra.valorUnitario)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className={classes.secondaryButton}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={classes.primaryButton}
                >
                  {compraEditando ? 'Atualizar' : 'Solicitar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Detalhes da Compra */}
      {detalhesCompra && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${classes.card} p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className={`text-lg font-medium ${colors.text}`}>Detalhes da Compra</h3>
              <button
                onClick={() => setDetalhesCompra(null)}
                className={`${colors.textSecondary} hover:${colors.text}`}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm ${colors.textSecondary}`}>Item</label>
                  <p className={`text-base ${colors.text}`}>{detalhesCompra.descricao}</p>
                </div>
                <div>
                  <label className={`block text-sm ${colors.textSecondary}`}>Solicitante</label>
                  <p className={`text-base ${colors.text}`}>{detalhesCompra.solicitante || '-'}</p>
                </div>
                <div>
                  <label className={`block text-sm ${colors.textSecondary}`}>Quantidade</label>
                  <p className={`text-base ${colors.text}`}>{detalhesCompra.quantidade}</p>
                </div>
                <div>
                  <label className={`block text-sm ${colors.textSecondary}`}>Fornecedor</label>
                  <p className={`text-base ${colors.text}`}>{detalhesCompra.fornecedor || '-'}</p>
                </div>
                <div>
                  <label className={`block text-sm ${colors.textSecondary}`}>Valor Unitário</label>
                  <p className={`text-base ${colors.text}`}>
                    R$ {(detalhesCompra.valorUnitario || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <label className={`block text-sm ${colors.textSecondary}`}>Valor Total</label>
                  <p className={`text-base ${colors.text}`}>
                    R$ {(detalhesCompra.valorTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <label className={`block text-sm ${colors.textSecondary}`}>Status</label>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-1 ${STATUS_COLORS[detalhesCompra.status]}`}>
                    {STATUS_LABELS[detalhesCompra.status]}
                  </span>
                </div>
                <div>
                  <label className={`block text-sm ${colors.textSecondary}`}>Prioridade</label>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-1 ${PRIORIDADE_COLORS[detalhesCompra.prioridade]}`}>
                    {PRIORIDADE_LABELS[detalhesCompra.prioridade]}
                  </span>
                </div>
              </div>

              {detalhesCompra.link && (
                <div>
                  <label className={`block text-sm ${colors.textSecondary} mb-1`}>Link da Compra</label>
                  <a
                    href={detalhesCompra.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#1DA1F2] hover:underline break-all"
                  >
                    {detalhesCompra.link}
                  </a>
                </div>
              )}

              {detalhesCompra.observacoes && (
                <div>
                  <label className={`block text-sm ${colors.textSecondary} mb-1`}>Observações</label>
                  <p className={`text-base ${colors.text} whitespace-pre-wrap`}>{detalhesCompra.observacoes}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4">
                <div>
                  <label className={`block text-sm ${colors.textSecondary}`}>Data de Solicitação</label>
                  <p className={`text-base ${colors.text}`}>
                    {detalhesCompra.dataSolicitacao?.toDate?.().toLocaleDateString('pt-BR') || '-'}
                  </p>
                </div>
                <div>
                  <label className={`block text-sm ${colors.textSecondary}`}>Última Atualização</label>
                  <p className={`text-base ${colors.text}`}>
                    {detalhesCompra.dataAtualizacao?.toDate?.().toLocaleDateString('pt-BR') || '-'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {modalConfirmacao && compraParaExcluir && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${classes.card} p-6 w-full max-w-md`}>
            <h3 className={`text-lg font-medium ${colors.text} mb-4`}>
              Confirmar Exclusão
            </h3>
            <p className={`text-sm ${colors.textSecondary} mb-4`}>
              Tem certeza que deseja excluir a compra "{compraParaExcluir.descricao}"?
              Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setModalConfirmacao(false);
                  setCompraParaExcluir(null);
                }}
                className={classes.secondaryButton}
              >
                Cancelar
              </button>
              <button
                onClick={excluirCompra}
                className={classes.dangerButton}
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComprasTab;