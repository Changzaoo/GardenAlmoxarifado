import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search, X, Save, Trash2, Shield } from 'lucide-react';
import { twitterThemeConfig } from '../../styles/twitterThemeConfig';
import CompraCard from './CompraCard';
import { useAuth } from '../../hooks/useAuth';
import { useSectorPermissions } from '../../hooks/useSectorPermissions';
import { PermissionChecker } from '../../constants/permissoes';

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
  baixa: 'bg-[#8899A6] bg-opacity-10 text-gray-500 dark:text-gray-400',
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
  const { usuario } = useAuth();
  const { canViewAllSectors } = useSectorPermissions();
  const isAdmin = canViewAllSectors;

  // Filtrar compras por setor
  const comprasPorSetor = useMemo(() => {
    if (isAdmin) return compras;
    return PermissionChecker.filterBySector(compras, usuario);
  }, [compras, usuario, isAdmin]);

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
    valorFrete: '',
    fornecedor: '',
    prioridade: PRIORIDADES.MEDIA,
    solicitante: '',
    observacoes: '',
    link: '',
    status: STATUS_COMPRAS.SOLICITADO
  });
  
  const [detalhesCompra, setDetalhesCompra] = useState(null);

  // Filtrar compras
  const comprasFiltradas = comprasPorSetor.filter(compra => {
    const matchFiltro = filtro === '' || 
      compra.descricao?.toLowerCase().includes(filtro.toLowerCase()) ||
      compra.fornecedor?.toLowerCase().includes(filtro.toLowerCase()) ||
      compra.solicitante?.toLowerCase().includes(filtro.toLowerCase());
    
    const matchStatus = statusFiltro === 'todos' || compra.status === statusFiltro;
    const matchPrioridade = prioridadeFiltro === 'todas' || compra.prioridade === prioridadeFiltro;
    
    return matchFiltro && matchStatus && matchPrioridade;
  });

  // Calcular estatísticas
  const estatisticas = comprasFiltradas.reduce((acc, compra) => {
    acc.total++;
    acc[compra.status] = (acc[compra.status] || 0) + 1;
    acc.valorTotal += (compra.quantidade * compra.valorUnitario) + (compra.valorFrete || 0);
    return acc;
  }, {
    total: 0,
    solicitado: 0,
    aprovado: 0,
    pedido_enviado: 0,
    recebido: 0,
    cancelado: 0,
    valorTotal: 0
  });

  const handleEditarCompra = (compra) => {
    setCompraEditando(compra);
    setNovaCompra({
      id: compra.id,
      descricao: compra.descricao,
      quantidade: compra.quantidade,
      valorUnitario: compra.valorUnitario,
      valorFrete: compra.valorFrete || '',
      fornecedor: compra.fornecedor || '',
      prioridade: compra.prioridade,
      solicitante: compra.solicitante,
      observacoes: compra.observacoes || '',
      link: compra.link || '',
      status: compra.status
    });
    setModalAberto(true);
  };

  const handleExcluirCompra = (compra) => {
    setCompraParaExcluir(compra);
    setModalConfirmacao(true);
  };

  const confirmarExclusao = () => {
    if (compraParaExcluir && typeof removerCompra === 'function') {
      removerCompra(compraParaExcluir.id);
    }
    setModalConfirmacao(false);
    setCompraParaExcluir(null);
  };

  const cancelarExclusao = () => {
    setModalConfirmacao(false);
    setCompraParaExcluir(null);
  };

  const salvarCompra = (e) => {
    e.preventDefault();
    
    if (!novaCompra.descricao || !novaCompra.quantidade || !novaCompra.valorUnitario || !novaCompra.solicitante) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const compraFormatada = {
      ...novaCompra,
      quantidade: parseInt(novaCompra.quantidade),
      valorUnitario: parseFloat(novaCompra.valorUnitario),
      status: novaCompra.status || STATUS_COMPRAS.SOLICITADO
    };

    if (compraEditando) {
      atualizarCompra(compraEditando.id, compraFormatada);
    } else {
      adicionarCompra(compraFormatada);
    }

    setModalAberto(false);
    setCompraEditando(null);
    setNovaCompra({
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
  };

  const atualizarStatus = async (compraId, novoStatus) => {
    const compra = compras.find(c => c.id === compraId);
    if (compra) {
      await atualizarCompra(compraId, { ...compra, status: novoStatus });
    }
  };

  return (
    <div className="space-y-4">
      {/* Badge de visualização por setor */}
      {!isAdmin && usuario?.setor && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <p className="text-sm text-blue-800 dark:text-blue-300">
            <strong>Visualização por setor:</strong> Você está vendo apenas as compras do setor <strong>{usuario.setor}</strong>.
          </p>
        </div>
      )}

      {/* Cabeçalho e Botão Nova Compra */}
      <div className="flex justify-between items-center">
        <h2 className={`text-xl font-semibold ${colors.text}`}>Compras</h2>
        {!readonly && (
          <button
            onClick={() => setModalAberto(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded-full hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nova Compra
          </button>
        )}
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className={`bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm p-4`}>
          <div className="flex flex-col">
            <p className={`text-sm font-medium ${colors.textSecondary}`}>Total</p>
            <p className={`text-xl font-bold ${colors.text}`}>{estatisticas.total}</p>
          </div>
        </div>
        <div className={`bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm p-4`}>
          <div className="flex flex-col">
            <p className={`text-sm font-medium ${colors.textSecondary}`}>Solicitado</p>
            <p className={`text-xl font-bold ${colors.text}`}>{estatisticas.solicitado}</p>
          </div>
        </div>
        <div className={`bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm p-4`}>
          <div className="flex flex-col">
            <p className={`text-sm font-medium ${colors.textSecondary}`}>Aprovado</p>
            <p className={`text-xl font-bold ${colors.text}`}>{estatisticas.aprovado}</p>
          </div>
        </div>
        <div className={`bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm p-4`}>
          <div className="flex flex-col">
            <p className={`text-sm font-medium ${colors.textSecondary}`}>Enviado</p>
            <p className={`text-xl font-bold ${colors.text}`}>{estatisticas.pedido_enviado}</p>
          </div>
        </div>
        <div className={`bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm p-4`}>
          <div className="flex flex-col">
            <p className={`text-sm font-medium ${colors.textSecondary}`}>Recebido</p>
            <p className={`text-xl font-bold ${colors.text}`}>{estatisticas.recebido}</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className={`bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm p-4 space-y-4`}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400" />
            <input
              type="text"
              placeholder="     Pesquisar compras..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="h-10 w-full pl-10 pr-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-full text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 text-sm"
            />
          </div>

          <select
            value={statusFiltro}
            onChange={(e) => setStatusFiltro(e.target.value)}
            className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white rounded-full px-4 h-10 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 text-sm [&>option]:bg-white [&>option]:dark:bg-gray-700"
          >
            <option value="todos">Todos os status</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>

          <select
            value={prioridadeFiltro}
            onChange={(e) => setPrioridadeFiltro(e.target.value)}
            className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white rounded-full px-4 h-10 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 text-sm [&>option]:bg-white [&>option]:dark:bg-gray-700"
          >
            <option value="todas">Todas as prioridades</option>
            {Object.entries(PRIORIDADE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid de Cards */}
      <div className={`mt-4 ${comprasFiltradas.length === 0 ? 'text-center p-4' : ''}`}>
        {comprasFiltradas.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {comprasFiltradas.map(compra => (
              <CompraCard
                key={compra.id}
                compra={compra}
                onEdit={handleEditarCompra}
                onDelete={handleExcluirCompra}
                onUpdate={(compraAtualizada) => atualizarCompra(compraAtualizada.id, compraAtualizada)}
                readonly={readonly}
              />
            ))}
          </div>
        ) : (
          <p className={`text-sm ${colors.textSecondary}`}>Nenhuma compra encontrada</p>
        )}
      </div>

      {/* Modal de Nova/Editar Compra */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
          <div className={`bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto`}>
            <form onSubmit={salvarCompra} className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className={`text-lg font-medium ${colors.text}`}>
                  {compraEditando ? 'Editar Compra' : 'Nova Solicitação de Compra'}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setModalAberto(false);
                    setCompraEditando(null);
                    setNovaCompra({
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
                  }}
                  className={`${colors.textSecondary} hover:${colors.text}`}
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className={`block text-sm font-medium ${colors.text} mb-2`}>
                    Descrição do Item *
                  </label>
                  <input
                    type="text"
                    value={novaCompra.descricao}
                    onChange={(e) => setNovaCompra({ ...novaCompra, descricao: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500"
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
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500"
                    required
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium ${colors.text} mb-2`}>
                    Valor Unitário *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={novaCompra.valorUnitario}
                    onChange={(e) => setNovaCompra({ ...novaCompra, valorUnitario: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500"
                    required
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium ${colors.text} mb-2`}>
                    Valor do Frete
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={novaCompra.valorFrete}
                    onChange={(e) => setNovaCompra({ ...novaCompra, valorFrete: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500"
                    placeholder="Deixe vazio para frete grátis"
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
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500"
                    placeholder="Nome do fornecedor"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium ${colors.text} mb-2`}>
                    Solicitante *
                  </label>
                  <input
                    type="text"
                    value={novaCompra.solicitante}
                    onChange={(e) => setNovaCompra({ ...novaCompra, solicitante: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500"
                    required
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium ${colors.text} mb-2`}>
                    Status
                  </label>
                  <select
                    value={novaCompra.status}
                    onChange={(e) => setNovaCompra({ ...novaCompra, status: e.target.value })}
                    className="w-full h-[38px] appearance-none bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%238899A6'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 10px center',
                      backgroundSize: '20px'
                    }}
                  >
                    {Object.entries(STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value} className="bg-gray-50 dark:bg-gray-700">{label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium ${colors.text} mb-2`}>
                    Prioridade *
                  </label>
                  <select
                    value={novaCompra.prioridade}
                    onChange={(e) => setNovaCompra({ ...novaCompra, prioridade: e.target.value })}
                    className="w-full h-[38px] appearance-none bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%238899A6'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 10px center',
                      backgroundSize: '20px'
                    }}
                    required
                  >
                    {Object.entries(PRIORIDADE_LABELS).map(([value, label]) => (
                      <option key={value} value={value} className="bg-white dark:bg-gray-700 dark:bg-gray-700">{label}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className={`block text-sm font-medium ${colors.text} mb-2`}>
                    Link do Produto
                  </label>
                  <input
                    type="url"
                    value={novaCompra.link}
                    onChange={(e) => setNovaCompra({ ...novaCompra, link: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500"
                    placeholder="https://..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={`block text-sm font-medium ${colors.text} mb-2`}>
                    Observações
                  </label>
                  <textarea
                    value={novaCompra.observacoes}
                    onChange={(e) => setNovaCompra({ ...novaCompra, observacoes: e.target.value })}
                    className="w-full h-24 resize-none px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500"
                    placeholder="Informações adicionais sobre a compra..."
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setModalAberto(false);
                    setCompraEditando(null);
                    setNovaCompra({
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
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200"
                >
                  <X className="w-4 h-4" />
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-500 dark:bg-blue-600 rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors duration-200"
                >
                  {compraEditando ? (
                    <>
                      <Save className="w-4 h-4" />
                      Salvar Alterações
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Adicionar Compra
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {modalConfirmacao && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
          <div className={`bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm p-6 max-w-md`}>
            <h3 className={`text-lg font-medium ${colors.text} mb-4`}>
              Confirmar Exclusão
            </h3>
            <p className={`${colors.textSecondary} mb-6`}>
              Tem certeza que deseja excluir esta compra?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelarExclusao}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200"
              >
                <X className="w-4 h-4" />
                Cancelar
              </button>
              <button
                onClick={confirmarExclusao}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 dark:bg-red-500 rounded-lg hover:bg-red-700 dark:hover:bg-red-400 transition-colors duration-200"
              >
                <Trash2 className="w-4 h-4" />
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



