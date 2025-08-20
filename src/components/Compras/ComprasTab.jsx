import React, { useState } from 'react';
import { useTheme } from '../AlmoxarifadoJardim';
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
  solicitado: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
  aprovado: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
  pedido_enviado: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
  recebido: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300',
  cancelado: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
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
  baixa: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300',
  media: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
  alta: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300',
  urgente: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
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
  const { classes } = useTheme();
  const [filtro, setFiltro] = useState('');
  const [statusFiltro, setStatusFiltro] = useState('todos');
  const [prioridadeFiltro, setPrioridadeFiltro] = useState('todas');
  const [modalAberto, setModalAberto] = useState(false);
  const [compraEditando, setCompraEditando] = useState(null);
  const [confirmarExclusaoId, setConfirmarExclusaoId] = useState(null);
  const [erroExclusao, setErroExclusao] = useState('');
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

  // Função para iniciar confirmação
  const pedirConfirmacaoExclusao = (id) => {
    setConfirmarExclusaoId(id);
    setErroExclusao('');
  };

  // Função para confirmar exclusão
  const confirmarExclusaoCompra = async () => {
    if (!confirmarExclusaoId) return;
    setErroExclusao('');
    try {
      await removerCompra(confirmarExclusaoId);
      setConfirmarExclusaoId(null);
    } catch (error) {
      setErroExclusao(error.message || 'Erro ao excluir compra');
    }
  };

  // Função para cancelar exclusão
  const cancelarExclusaoCompra = () => {
    setConfirmarExclusaoId(null);
    setErroExclusao('');
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
          <h2 className={`text-2xl font-bold ${classes.textPrimary}`}>
            Gestão de Compras
          </h2>
          <p className={classes.textSecondary}>
            Gerenciar solicitações e pedidos de compra
          </p>
        </div>
        {!readonly && (
          <button
            onClick={abrirModalNova}
            className={`flex items-center gap-2 px-4 py-2 ${classes.buttonPrimary} text-white`}
            style={{ backgroundColor: '#bd9967' }}
          >
            <Plus className="w-4 h-4" />
            Nova Solicitação
          </button>
        )}
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className={`${classes.statCard} ${classes.statCardWhite}`}>
          <div className="flex items-center">
            <ShoppingCart className="w-8 h-8" style={{ color: '#bd9967' }} />
            <div className="ml-3">
              <p className={`text-sm font-medium ${classes.textSecondary}`}>Total</p>
              <p className={`text-xl font-bold ${classes.textPrimary}`}>{estatisticas.total}</p>
            </div>
          </div>
        </div>
        <div className={`${classes.statCard} ${classes.statCardBlue}`}>
          <p className={`text-sm font-medium ${classes.statLabelBlue}`}>Solicitado</p>
          <p className={`text-xl font-bold ${classes.statValueBlue}`}>{estatisticas.solicitado}</p>
        </div>
        <div className={`${classes.statCard} ${classes.statCardGreen}`}>
          <p className={`text-sm font-medium ${classes.statLabelGreen}`}>Aprovado</p>
          <p className={`text-xl font-bold ${classes.statValueGreen}`}>{estatisticas.aprovado}</p>
        </div>
        <div className={`${classes.statCard} ${classes.statCardYellow}`}>
          <p className={`text-sm font-medium ${classes.statLabelYellow}`}>Enviado</p>
          <p className={`text-xl font-bold ${classes.statValueYellow}`}>{estatisticas.enviado}</p>
        </div>
        <div className={`${classes.statCard} ${classes.statCardPurple}`}>
          <p className={`text-sm font-medium ${classes.statLabelPurple}`}>Recebido</p>
          <p className={`text-xl font-bold ${classes.statValuePurple}`}>{estatisticas.recebido}</p>
        </div>
        <div className={`${classes.statCard} ${classes.statCardWhite}`}>
          <p className={`text-sm font-medium ${classes.textSecondary}`}>Valor Total</p>
          <p className={`text-lg font-bold ${classes.textPrimary}`}>
            R$ {estatisticas.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className={`${classes.card} p-4 space-y-4`}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className={`w-4 h-4 absolute left-3 top-3 ${classes.textLight}`} />
            <input
              type="text"
              placeholder="Pesquisar compras..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 ${classes.input} focus:ring-2 focus:border-transparent`}
              style={{ '--tw-ring-color': '#bd9967' }}
            />
          </div>
          <select
            value={statusFiltro}
            onChange={(e) => setStatusFiltro(e.target.value)}
            className={`px-3 py-2 ${classes.formSelect} focus:ring-2 focus:border-transparent`}
            style={{ '--tw-ring-color': '#bd9967' }}
          >
            <option value="todos">Todos os status</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <select
            value={prioridadeFiltro}
            onChange={(e) => setPrioridadeFiltro(e.target.value)}
            className={`px-3 py-2 ${classes.formSelect} focus:ring-2 focus:border-transparent`}
            style={{ '--tw-ring-color': '#bd9967' }}
          >
            <option value="todas">Todas as prioridades</option>
            {Object.entries(PRIORIDADE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <div className={`text-sm ${classes.textSecondary} flex items-center`}>
            Mostrando {comprasFiltradas.length} de {compras.length} compras
          </div>
        </div>
      </div>

      {/* Lista de Compras */}
      <div className={`${classes.table} overflow-hidden`}>
        {comprasFiltradas.length === 0 ? (
          <div className={`p-8 text-center ${classes.textMuted}`}>
            <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma compra encontrada.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={classes.tableHeader}>
                <tr>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${classes.tableHeaderCell}`}>
                    Item
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${classes.tableHeaderCell}`}>
                    Quantidade
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${classes.tableHeaderCell}`}>
                    Valor
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${classes.tableHeaderCell}`}>
                    Fornecedor
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${classes.tableHeaderCell}`}>
                    Status
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${classes.tableHeaderCell}`}>
                    Prioridade
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${classes.tableHeaderCell}`}>
                    Data
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${classes.tableHeaderCell}`}>
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {comprasFiltradas.map((compra) => (
                  <tr key={compra.id} className={classes.tableRow}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className={`text-sm font-medium ${classes.tableCell}`}>
                          {compra.descricao}
                        </div>
                        {compra.solicitante && (
                          <div className={`text-sm ${classes.textMuted}`}>
                            Solicitante: {compra.solicitante}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${classes.tableCell}`}>
                      {compra.quantidade}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm ${classes.tableCell}`}>
                        R$ {(compra.valorUnitario || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                      <div className={`text-sm ${classes.textMuted}`}>
                        Total: R$ {(compra.valorTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${classes.tableCell}`}>
                      {compra.fornecedor || 'Não informado'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={compra.status}
                        onChange={(e) => atualizarStatus(compra.id, e.target.value)}
                        disabled={readonly}
                        className={`text-xs font-medium px-2.5 py-0.5 rounded-full border-0 ${STATUS_COLORS[compra.status]} ${readonly ? 'cursor-not-allowed' : 'cursor-pointer'} ${classes.formSelect}`}
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
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${classes.textMuted}`}>
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
                            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-200 transition-colors duration-200"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => pedirConfirmacaoExclusao(compra.id)}
                            className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-200 transition-colors duration-200"
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

      {/* Modal de confirmação de exclusão */}
      {confirmarExclusaoId && (
        <div className={`fixed inset-0 ${classes.overlay} flex items-center justify-center z-50`}>
          <div className={`${classes.modal} p-6 w-full max-w-sm mx-4 flex flex-col items-center`}>
            <h3 className={`text-lg font-medium ${classes.textPrimary} mb-4 flex items-center justify-center gap-2`}>
              <Trash2 className="w-6 h-6 text-red-400" />
              Confirmar Exclusão
            </h3>
            <p className={`mb-4 text-center ${classes.textSecondary}`}>
              Tem certeza que deseja excluir esta compra?
            </p>
            {erroExclusao && (
              <div className={`${classes.alertError} px-4 py-2 rounded mb-2 text-center`}>
                {erroExclusao}
              </div>
            )}
            <div className="flex flex-col items-center gap-2 w-full mt-2">
              <div className="flex justify-center gap-2 w-full">
                <button 
                  onClick={cancelarExclusaoCompra} 
                  className={`px-4 py-2 ${classes.buttonSecondary}`}
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmarExclusaoCompra} 
                  className={`px-4 py-2 ${classes.buttonDanger}`}
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Nova/Editar Compra */}
      {modalAberto && (
        <div className={`fixed inset-0 ${classes.overlay} flex items-center justify-center z-50`}>
          <div className={`${classes.modal} p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-lg font-medium ${classes.textPrimary}`}>
                {compraEditando ? 'Editar Compra' : 'Nova Solicitação de Compra'}
              </h3>
              <button
                onClick={() => setModalAberto(false)}
                className={`${classes.textLight} hover:${classes.textSecondary} transition-colors duration-200`}
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={salvarCompra} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className={classes.formLabel}>
                    Descrição do Item *
                  </label>
                  <input
                    type="text"
                    value={novaCompra.descricao}
                    onChange={(e) => setNovaCompra({ ...novaCompra, descricao: e.target.value })}
                    className={`w-full px-3 py-2 ${classes.input} focus:ring-2 focus:border-transparent`}
                    style={{ '--tw-ring-color': '#bd9967' }}
                    placeholder="Ex: Furadeira elétrica 1/2"
                    required
                  />
                </div>
                <div>
                  <label className={classes.formLabel}>
                    Quantidade *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={novaCompra.quantidade}
                    onChange={(e) => setNovaCompra({ ...novaCompra, quantidade: e.target.value })}
                    className={`w-full px-3 py-2 ${classes.input} focus:ring-2 focus:border-transparent`}
                    style={{ '--tw-ring-color': '#bd9967' }}
                    required
                  />
                </div>
                <div>
                  <label className={classes.formLabel}>
                    Valor Unitário (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={novaCompra.valorUnitario}
                    onChange={(e) => setNovaCompra({ ...novaCompra, valorUnitario: e.target.value })}
                    className={`w-full px-3 py-2 ${classes.input} focus:ring-2 focus:border-transparent`}
                    style={{ '--tw-ring-color': '#bd9967' }}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className={classes.formLabel}>
                    Fornecedor
                  </label>
                  <input
                    type="text"
                    value={novaCompra.fornecedor}
                    onChange={(e) => setNovaCompra({ ...novaCompra, fornecedor: e.target.value })}
                    className={`w-full px-3 py-2 ${classes.input} focus:ring-2 focus:border-transparent`}
                    style={{ '--tw-ring-color': '#bd9967' }}
                    placeholder="Nome do fornecedor"
                  />
                </div>
                <div>
                  <label className={classes.formLabel}>
                    Prioridade *
                  </label>
                  <select
                    value={novaCompra.prioridade}
                    onChange={(e) => setNovaCompra({ ...novaCompra, prioridade: e.target.value })}
                    className={`w-full px-3 py-2 ${classes.formSelect} focus:ring-2 focus:border-transparent`}
                    style={{ '--tw-ring-color': '#bd9967' }}
                    required
                  >
                    {Object.entries(PRIORIDADE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={classes.formLabel}>
                    Solicitante
                  </label>
                  <input
                    type="text"
                    value={novaCompra.solicitante}
                    onChange={(e) => setNovaCompra({ ...novaCompra, solicitante: e.target.value })}
                    className={`w-full px-3 py-2 ${classes.input} focus:ring-2 focus:border-transparent`}
                    style={{ '--tw-ring-color': '#bd9967' }}
                    placeholder="Nome do solicitante"
                  />
                </div>
                {compraEditando && (
                  <div>
                    <label className={classes.formLabel}>
                      Status
                    </label>
                    <select
                      value={novaCompra.status}
                      onChange={(e) => setNovaCompra({ ...novaCompra, status: e.target.value })}
                      className={`w-full px-3 py-2 ${classes.formSelect} focus:ring-2 focus:border-transparent`}
                      style={{ '--tw-ring-color': '#bd9967' }}
                    >
                      {Object.entries(STATUS_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="md:col-span-2">
                  <label className={classes.formLabel}>
                    Observações
                  </label>
                  <textarea
                    value={novaCompra.observacoes}
                    onChange={(e) => setNovaCompra({ ...novaCompra, observacoes: e.target.value })}
                    rows={3}
                    className={`w-full px-3 py-2 ${classes.formTextarea} focus:ring-2 focus:border-transparent`}
                    style={{ '--tw-ring-color': '#bd9967' }}
                    placeholder="Observações adicionais..."
                  />
                </div>
              </div>
              {/* Valor total calculado */}
              {novaCompra.quantidade && novaCompra.valorUnitario && (
                <div className={`${classes.containerSecondary} p-4 rounded-lg`}>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm font-medium ${classes.textSecondary}`}>Valor Total:</span>
                    <span className={`text-lg font-bold ${classes.textPrimary}`}>
                      R$ {(Number(novaCompra.quantidade) * parseFloat(novaCompra.valorUnitario)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className={`px-4 py-2 text-sm font-medium ${classes.buttonSecondary}`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-sm font-medium ${classes.buttonPrimary} text-white`}
                  style={{ backgroundColor: '#bd9967' }}
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