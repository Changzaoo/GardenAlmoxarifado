import React, { useState, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Search, Plus, Calendar, User, MapPin, DollarSign, FileText, AlertCircle, Shield } from 'lucide-react';
import { twitterThemeConfig } from '../../styles/twitterThemeConfig';
import { toast } from 'react-toastify';
import { useSectorPermissions } from '../../hooks/useSectorPermissions';
import { PermissionChecker } from '../../constants/permissoes';

const { classes, colors } = twitterThemeConfig;

const FerramentasDanificadasTab = ({ 
  ferramentasDanificadas = [], 
  inventario = [], 
  adicionarFerramentaDanificada = () => {}, 
  atualizarFerramentaDanificada = () => {},
  removerFerramentaDanificada = () => {},
  readonly = false
}) => {
  const { usuario } = useAuth();
  const isFuncionario = usuario?.nivel === 'funcionario';
  
  // Hook de permissões por setor
  const { canViewAllSectors } = useSectorPermissions();
  const isAdmin = canViewAllSectors;

  // Filtrar ferramentas danificadas por setor (se não for admin)
  const ferramentasDanificadasPorSetor = useMemo(() => {
    if (isAdmin) {
      return ferramentasDanificadas;
    }
    
    return PermissionChecker.filterBySector(ferramentasDanificadas, usuario);
  }, [ferramentasDanificadas, usuario, isAdmin]);

  const [novaFerramenta, setNovaFerramenta] = useState({
    nomeItem: '',
    categoria: '',
    descricaoProblema: '',
    responsavel: '',
    localUltimaVez: '',
    dataDanificacao: new Date().toISOString().split('T')[0],
    valorReparo: '',
    statusReparo: 'aguardando_reparo',
    observacoes: '',
    prioridade: 'media'
  });

  const [filtro, setFiltro] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [modalAberto, setModalAberto] = useState(false);
  const [editModalAberto, setEditModalAberto] = useState(false);
  const [editingFerramenta, setEditingFerramenta] = useState(null);
  const [deleteModalAberto, setDeleteModalAberto] = useState(false);
  const [deletingFerramentaId, setDeletingFerramentaId] = useState(null);

  const openEditModal = (ferramenta) => {
    setEditingFerramenta(ferramenta);
    setEditModalAberto(true);
  };

  const closeEditModal = () => {
    setEditingFerramenta(null);
    setEditModalAberto(false);
  };

  const openDeleteModal = (ferramentaId) => {
    setDeletingFerramentaId(ferramentaId);
    setDeleteModalAberto(true);
  };

  const closeDeleteModal = () => {
    setDeletingFerramentaId(null);
    setDeleteModalAberto(false);
  };

  const ferramentasFiltradas = ferramentasDanificadasPorSetor.filter(item => {
    const matchFiltro = 
      (item.nomeItem || '').toLowerCase().includes(filtro.toLowerCase()) ||
      (item.descricaoProblema || '').toLowerCase().includes(filtro.toLowerCase()) ||
      (item.responsavel || '').toLowerCase().includes(filtro.toLowerCase()) ||
      (item.localUltimaVez || '').toLowerCase().includes(filtro.toLowerCase());
    
    const matchStatus = filtroStatus === 'todos' || (item.statusReparo || '') === filtroStatus;
    
    return matchFiltro && matchStatus;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!novaFerramenta.nomeItem || !novaFerramenta.descricaoProblema) {
      toast.error('Por favor, preencha os campos obrigatórios:\n- Nome da Ferramenta\n- Descrição da Perda\n\nOs campos obrigatórios estão marcados com *', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
        style: {
          background: '#192734',
          color: '#ffffff',
          borderRadius: '1rem',
          border: '1px solid #38444D'
        }
      });
      return;
    }

    const dadosCompletos = {
      ...novaFerramenta,
      valorReparo: novaFerramenta.valorReparo ? parseFloat(novaFerramenta.valorReparo) : 0
    };

    const sucesso = await adicionarFerramentaDanificada(dadosCompletos);
    
    if (sucesso) {
      setNovaFerramenta({
        nomeItem: '',
        categoria: '',
        descricaoProblema: '',
        responsavel: '',
        localUltimaVez: '',
        dataDanificacao: new Date().toISOString().split('T')[0],
        valorReparo: '',
        statusReparo: 'aguardando_reparo',
        observacoes: '',
        prioridade: 'media'
      });
      setModalAberto(false);
      toast.success('Ferramenta danificada registrada com sucesso!', {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
        style: {
          background: '#192734',
          color: '#ffffff',
          borderRadius: '1rem',
          border: '1px solid #38444D'
        }
      });
    } else {
      toast.error('Erro ao registrar ferramenta danificada. Tente novamente.', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
        style: {
          background: '#192734',
          color: '#ffffff',
          borderRadius: '1rem',
          border: '1px solid #38444D'
        }
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'aguardando_reparo': return 'bg-[#FFD700] bg-opacity-100 text-black font-semibold hover:bg-[#FFD700] hover:bg-opacity-90';
      case 'em_reparo': return 'bg-[#1D9BF0] bg-opacity-100 text-gray-900 dark:text-white font-semibold hover:bg-[#1D9BF0] hover:bg-opacity-90';
      case 'reparada': return 'bg-[#00BA7C] bg-opacity-100 text-gray-900 dark:text-white font-semibold hover:bg-[#00BA7C] hover:bg-opacity-90';
      case 'irreparavel': return 'bg-[#F4212E] bg-opacity-100 text-gray-900 dark:text-white font-semibold hover:bg-[#F4212E] hover:bg-opacity-90';
      case 'substituida': return 'bg-[#8A2BE2] bg-opacity-100 text-gray-900 dark:text-white font-semibold hover:bg-[#8A2BE2] hover:bg-opacity-90';
      default: return 'bg-[#8899A6] bg-opacity-100 text-gray-900 dark:text-white font-semibold hover:bg-[#8899A6] hover:bg-opacity-90';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'aguardando_reparo': return 'Aguardando Reparo';
      case 'em_reparo': return 'Em Reparo';
      case 'reparada': return 'Reparada';
      case 'irreparavel': return 'Irreparável';
      case 'substituida': return 'Substituída';
      default: return status;
    }
  };

  const calcularDiasDanificada = (dataDanificacao) => {
    if (!dataDanificacao) return 0;
    
    const dataAtual = new Date();
    const dataDano = new Date(dataDanificacao);
    
    // Verificar se a data é válida
    if (isNaN(dataDano.getTime())) return 0;
    
    const diferenca = dataAtual - dataDano;
    const dias = Math.floor(diferenca / (1000 * 60 * 60 * 24));
    
    return dias >= 0 ? dias : 0;
  };

  const getPrioridadeColor = (prioridade) => {
    switch (prioridade) {
      case 'baixa': return 'bg-[#00BA7C] text-gray-900 dark:text-white font-semibold';
      case 'media': return 'bg-[#FFD700] text-black font-semibold';
      case 'alta': return 'bg-[#F4212E] text-gray-900 dark:text-white font-semibold';
      default: return 'bg-[#8899A6] text-gray-900 dark:text-white font-semibold';
    }
  };

  const calcularEstatisticas = () => {
    const total = ferramentasDanificadas.length;
    const aguardandoReparo = ferramentasDanificadas.filter(f => (f.statusReparo || '') === 'aguardando_reparo').length;
    const emReparo = ferramentasDanificadas.filter(f => (f.statusReparo || '') === 'em_reparo').length;
    const reparadas = ferramentasDanificadas.filter(f => (f.statusReparo || '') === 'reparada').length;
    const irreparaveis = ferramentasDanificadas.filter(f => (f.statusReparo || '') === 'irreparavel').length;
    const substituidas = ferramentasDanificadas.filter(f => (f.statusReparo || '') === 'substituida').length;
    const valorTotalDanos = ferramentasDanificadas
      .filter(f => (f.statusReparo || '') === 'irreparavel')
      .reduce((total, f) => total + (f.valorReparo || 0), 0);
    return {
      total,
      aguardandoReparo,
      emReparo,
      reparadas,
      irreparaveis,
      substituidas,
      valorTotalDanos
    };
  };

  const estatisticas = calcularEstatisticas();

  return (
    <div className="space-y-6">
      {/* Badge informativo para não-admins */}
      {!isAdmin && usuario?.setor && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <p className="text-sm text-blue-800 dark:text-blue-300">
            <strong>Visualização por setor:</strong> Você está vendo apenas as ferramentas danificadas do setor <strong>{usuario.setor}</strong>.
          </p>
        </div>
      )}

      {/* Header com botão */}
      <div className={`bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm p-6`}>
        <div className="flex items-center justify-end mb-6">
          
          {!isFuncionario && !readonly && (
            <button
              onClick={() => setModalAberto(true)}
              className="bg-blue-500 dark:bg-[#1D9BF0] text-white rounded-full px-4 py-2 flex items-center justify-center gap-2 hover:bg-blue-600 dark:hover:bg-[#1a8cd8] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Registrar Dano
            </button>
          )}
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <div className={`bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm p-4`}>
            <div className="flex items-center">
              <div className="bg-blue-500 dark:bg-[#1D9BF0] bg-opacity-10 p-3 rounded-full">
                <AlertCircle className="w-5 h-5 text-blue-500 dark:text-[#1D9BF0]" />
              </div>
              <div className="ml-3">
                <p className={`text-sm ${colors.textSecondary}`}>Total</p>
                <p className={`text-xl font-bold ${colors.text}`}>{estatisticas.total}</p>
              </div>
            </div>
          </div>
          <div className={`bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm p-4`}>
            <div className="flex flex-col">
              <p className={`text-sm ${colors.textSecondary}`}>Aguardando Reparo</p>
              <p className="text-xl font-bold text-[#FFD700]">{estatisticas.aguardandoReparo}</p>
            </div>
          </div>
          <div className={`bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm p-4`}>
            <div className="flex flex-col">
              <p className={`text-sm ${colors.textSecondary}`}>Em Reparo</p>
              <p className="text-xl font-bold text-[#1D9BF0]">{estatisticas.emReparo}</p>
            </div>
          </div>
          <div className={`bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm p-4`}>
            <div className="flex flex-col">
              <p className={`text-sm ${colors.textSecondary}`}>Reparadas</p>
              <p className="text-xl font-bold text-[#00BA7C]">{estatisticas.reparadas}</p>
            </div>
          </div>
          <div className={`bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm p-4`}>
            <div className="flex flex-col">
              <p className={`text-sm ${colors.textSecondary}`}>Irreparáveis</p>
              <p className="text-xl font-bold text-[#F4212E]">{estatisticas.irreparaveis}</p>
            </div>
          </div>
          <div className={`bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm p-4`}>
            <div className="flex flex-col">
              <p className={`text-sm ${colors.textSecondary}`}>Substituídas</p>
              <p className="text-xl font-bold text-[#8A2BE2]">{estatisticas.substituidas}</p>
            </div>
          </div>
          <div className={`bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm p-4`}>
            <div className="flex flex-col">
              <p className={`text-sm ${colors.textSecondary}`}>Valor em Danos</p>
              <p className="text-xl font-bold text-[#F4212E]">
                R$ {estatisticas.valorTotalDanos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 flex items-center z-10">
              <Search className={`w-5 h-5 ml-3 ${colors.textSecondary}`} />
            </div>
            <div className="absolute inset-y-0 left-14 flex items-center pointer-events-none">
              {!filtro && (
                <span className={`text-gray-500`}>
                  Buscar por ferramenta, descrição, responsável ou local...
                </span>
              )}
            </div>
            <input
              type="text"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className={`
                pl-12 w-full py-2 
                ${classes.input} 
                focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#1D9BF0] focus:border-transparent
              `}
            />
          </div>
          
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className={`w-full md:w-48 px-4 py-2 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 transition-colors appearance-none cursor-pointer ${
              filtroStatus === 'todos' ? 'bg-white dark:bg-gray-700 text-white' :
              filtroStatus === 'aguardando_reparo' ? 'bg-[#FFD700] text-black' :
              filtroStatus === 'em_reparo' ? 'bg-[#1D9BF0] text-white' :
              filtroStatus === 'reparada' ? 'bg-[#00BA7C] text-white' :
              filtroStatus === 'irreparavel' ? 'bg-[#F4212E] text-white' :
              filtroStatus === 'substituida' ? 'bg-[#8A2BE2] text-white' : 'bg-[#8899A6] text-white'
            }`}
            style={{
              colorScheme: 'dark'
            }}
          >
            <option value="todos" style={{ backgroundColor: '#192734', color: 'white' }} className="font-semibold">Todos os Status</option>
            <option value="aguardando_reparo" style={{ backgroundColor: '#192734', color: '#FFD700' }} className="font-semibold">Aguardando Reparo</option>
            <option value="em_reparo" style={{ backgroundColor: '#192734', color: '#1D9BF0' }} className="font-semibold">Em Reparo</option>
            <option value="reparada" style={{ backgroundColor: '#192734', color: '#00BA7C' }} className="font-semibold">Reparada</option>
            <option value="irreparavel" style={{ backgroundColor: '#192734', color: '#F4212E' }} className="font-semibold">Irreparável</option>
            <option value="substituida" style={{ backgroundColor: '#192734', color: '#8A2BE2' }} className="font-semibold">Substituída</option>
          </select>
        </div>
      </div>

      {/* Lista de ferramentas danificadas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {ferramentasFiltradas.map(item => (
          <div key={item.id} className={`bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm p-6`}>
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className={`font-bold ${colors.text} text-lg flex items-center gap-2`}>
                  <AlertCircle className="w-5 h-5 text-[#F4212E]" />
                  {item.nomeItem}
                </h3>
                {item.categoria && (
                  <p className={`text-sm ${colors.textSecondary}`}>{item.categoria}</p>
                )}
              </div>

              <div className="flex flex-col gap-2 items-end">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    {!readonly && (
                      <select
                        className={`px-3 py-1 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 transition-colors appearance-none cursor-pointer ${getStatusColor(item.statusReparo)}`}
                        value={item.statusReparo}
                        onChange={e => atualizarFerramentaDanificada(item.id, { statusReparo: e.target.value })}
                        style={{
                          colorScheme: 'dark',
                          backgroundColor: item.statusReparo === 'aguardando_reparo' ? '#FFD700' :
                                         item.statusReparo === 'em_reparo' ? '#1D9BF0' :
                                         item.statusReparo === 'reparada' ? '#00BA7C' :
                                         item.statusReparo === 'irreparavel' ? '#F4212E' :
                                         item.statusReparo === 'substituida' ? '#8A2BE2' : '#8899A6',
                          color: item.statusReparo === 'aguardando_reparo' ? 'black' : 'white'
                        }}
                      >
                        <option value="aguardando_reparo" style={{ backgroundColor: '#192734', color: '#FFD700' }} className="font-semibold">Aguardando Reparo</option>
                        <option value="em_reparo" style={{ backgroundColor: '#192734', color: '#1D9BF0' }} className="font-semibold">Em Reparo</option>
                        <option value="reparada" style={{ backgroundColor: '#192734', color: '#00BA7C' }} className="font-semibold">Reparada</option>
                        <option value="irreparavel" style={{ backgroundColor: '#192734', color: '#F4212E' }} className="font-semibold">Irreparável</option>
                        <option value="substituida" style={{ backgroundColor: '#192734', color: '#8A2BE2' }} className="font-semibold">Substituída</option>
                      </select>
                    )}
                    {readonly && (
                      <span className={`px-3 py-1 rounded-lg text-xs font-medium ${getStatusColor(item.statusReparo)}`}>
                        {getStatusText(item.statusReparo)}
                      </span>
                    )}
                    <span className={`px-3 py-1 rounded-lg text-xs font-medium ${getPrioridadeColor(item.prioridade)}`}>
                      {item.prioridade.charAt(0).toUpperCase() + item.prioridade.slice(1)}
                    </span>
                  </div>
                  {!readonly && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(item)}
                        className="text-blue-500 dark:text-[#1D9BF0] hover:text-gray-700 dark:hover:text-white transition-colors text-sm"
                        title="Editar"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => openDeleteModal(item.id)}
                        className="text-[#F4212E] hover:text-gray-700 dark:hover:text-white transition-colors text-sm"
                        title="Excluir"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className={`bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm p-3 bg-[#F4212E] bg-opacity-5`}>
                <div className={`flex items-center gap-2 font-medium text-[#F4212E] mb-1`}>
                  <FileText className="w-4 h-4" />
                  Descrição do Problema
                </div>
                <p className="text-[#F4212E]">{item.descricaoProblema}</p>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <div className={`flex items-center gap-2 ${colors.text}`}>
                  <User className="w-4 h-4" />
                  <span><strong>Responsável:</strong> {item.responsavel}</span>
                </div>
                
                <div className={`flex items-center gap-2 ${colors.text}`}>
                  <Calendar className="w-4 h-4" />
                  <span><strong>Data do Dano:</strong> {new Date(item.dataDanificacao).toLocaleDateString('pt-BR')}</span>
                </div>
                
                {item.localUltimaVez && (
                  <div className={`flex items-center gap-2 ${colors.text}`}>
                    <MapPin className="w-4 h-4" />
                    <span><strong>Último local visto:</strong> {item.localUltimaVez}</span>
                  </div>
                )}
              </div>

              {item.valorReparo > 0 && (
                <div className={`bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm p-2 bg-[#FFD700] bg-opacity-5 flex items-center gap-2`}>
                  <DollarSign className="w-4 h-4 text-[#FFD700]" />
                  <span className="text-[#FFD700]">
                    <strong>Valor Estimado:</strong> 
                    <span className="ml-1">
                      R$ {item.valorReparo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </span>
                </div>
              )}

              {item.observacoes && (
                <div className={`bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm p-2`}>
                  <strong className={colors.text}>Observações:</strong>
                  <p className={colors.textSecondary}>{item.observacoes}</p>
                </div>
              )}

              {/* Tempo desde o dano */}
              <div className={`text-xs ${colors.textSecondary} border-t pt-2`}>
                Danificada há {calcularDiasDanificada(item.dataDanificacao)} dias
              </div>
            </div>
          </div>
        ))}
      </div>

      {ferramentasFiltradas.length === 0 && (
        <div className={`bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm p-8 text-center`}>
          <Search className={`w-16 h-16 mx-auto ${colors.textSecondary} mb-4`} />
          <p className={`text-lg font-medium ${colors.text}`}>
            {filtro || filtroStatus !== 'todos' 
              ? 'Nenhuma ferramenta danificada encontrada' 
              : 'Nenhuma ferramenta danificada registrada'
            }
          </p>
          <p className={`${colors.textSecondary} mt-2`}>
            {filtro || filtroStatus !== 'todos'
              ? 'Tente alterar os filtros de busca'
              : 'Clique em "Registrar Dano" para adicionar uma ocorrência'
            }
          </p>
        </div>
      )}

      {/* Modal de Nova Ferramenta Danificada */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 dark:border-gray-600 rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Search className="w-5 h-5 text-[#F4212E]" />
                  Registrar Ferramenta Danificada
                </h3>
                <button
                  onClick={() => setModalAberto(false)}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white text-center mb-2">
                      Nome da Ferramenta *
                    </label>
                    <input
                      type="text"
                      value={novaFerramenta.nomeItem}
                      onChange={(e) => setNovaFerramenta({...novaFerramenta, nomeItem: e.target.value})}
                      className="w-full bg-white dark:bg-gray-800 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 dark:border-gray-600 text-gray-900 dark:text-white rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#1D9BF0] transition-colors text-center"
                      placeholder="Ex: Martelo Tramontina 25mm"
                      list="inventario-list"
                      required
                    />
                    <datalist id="inventario-list">
                      {[...inventario].sort((a, b) => a.nome.localeCompare(b.nome)).map(item => (
                        <option key={item.id} value={item.nome} />
                      ))}
                    </datalist>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white text-center mb-2">
                      Categoria
                    </label>
                    <input
                      type="text"
                      value={novaFerramenta.categoria}
                      onChange={(e) => setNovaFerramenta({...novaFerramenta, categoria: e.target.value})}
                      className="w-full bg-white dark:bg-gray-800 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 dark:border-gray-600 text-gray-900 dark:text-white rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#1D9BF0] transition-colors text-center"
                      placeholder="Ex: Ferramenta Manual"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white text-center mb-2">
                    Descrição da Perda *
                  </label>
                  <textarea
                    value={novaFerramenta.descricaoProblema}
                    onChange={(e) => setNovaFerramenta({...novaFerramenta, descricaoProblema: e.target.value})}
                    className="w-full bg-white dark:bg-gray-800 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 dark:border-gray-600 text-gray-900 dark:text-white rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#1D9BF0] transition-colors text-center h-24"
                    placeholder="Descreva detalhadamente as circunstâncias da perda..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white text-center mb-2">
                    Último Local Visto
                  </label>
                  <input
                    type="text"
                    value={novaFerramenta.localUltimaVez}
                    onChange={(e) => setNovaFerramenta({...novaFerramenta, localUltimaVez: e.target.value})}
                    className="w-full bg-white dark:bg-gray-800 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 dark:border-gray-600 text-gray-900 dark:text-white rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#1D9BF0] transition-colors text-center"
                    placeholder="Ex: Obra da Rua A, Almoxarifado, Canteiro 3..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white text-center mb-2">
                      Valor Estimado (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={novaFerramenta.valorReparo}
                      onChange={(e) => setNovaFerramenta({...novaFerramenta, valorReparo: e.target.value})}
                      className="w-full bg-white dark:bg-gray-800 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 dark:border-gray-600 text-gray-900 dark:text-white rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#1D9BF0] transition-colors text-center"
                      placeholder="0,00"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white text-center mb-2">
                      Status do Reparo
                    </label>
                    <select
                      value={novaFerramenta.statusReparo}
                      onChange={(e) => setNovaFerramenta({...novaFerramenta, statusReparo: e.target.value})}
                      className="w-full bg-white dark:bg-gray-800 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 dark:border-gray-600 text-gray-900 dark:text-white rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#1D9BF0] transition-colors appearance-none text-center"
                    >
                      <option value="aguardando_reparo" className="bg-white dark:bg-gray-800">Aguardando Reparo</option>
                      <option value="em_reparo">Em Reparo</option>
                      <option value="reparada">Reparada</option>
                      <option value="irreparavel">Irreparável</option>
                      <option value="substituida">Substituída</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white text-center mb-2">
                      Prioridade
                    </label>
                    <select
                      value={novaFerramenta.prioridade}
                      onChange={(e) => setNovaFerramenta({...novaFerramenta, prioridade: e.target.value})}
                      className="w-full bg-white dark:bg-gray-800 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 dark:border-gray-600 text-gray-900 dark:text-white rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#1D9BF0] transition-colors appearance-none text-center"
                    >
                      <option value="baixa" className="bg-white dark:bg-gray-800">Baixa</option>
                      <option value="media">Média</option>
                      <option value="alta">Alta</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white text-center mb-2">
                    Observações e Ações Tomadas
                  </label>
                  <textarea
                    value={novaFerramenta.observacoes}
                    onChange={(e) => setNovaFerramenta({...novaFerramenta, observacoes: e.target.value})}
                    className="w-full bg-white dark:bg-gray-800 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 dark:border-gray-600 text-gray-900 dark:text-white rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#1D9BF0] transition-colors text-center h-20 resize-none"
                    placeholder="Ex: Já foi feita busca no almoxarifado, verificado com outros funcionários..."
                  />
                </div>

                <div className="bg-blue-500 dark:bg-[#1D9BF0] bg-opacity-5 p-4 rounded-lg border border-blue-500 dark:border-[#1D9BF0] border-opacity-10">
                  <div className="flex items-center gap-2 text-blue-500 dark:text-[#1D9BF0] mb-2">
                    <AlertCircle className="w-4 h-4" />
                    <span className="font-medium">Dicas para recuperação:</span>
                  </div>
                  <ul className="text-sm text-blue-500 dark:text-[#1D9BF0] space-y-1">
                    <li>• Verifique os locais de trabalho recentes</li>
                    <li>• Consulte outros funcionários da equipe</li>
                    <li>• Confira veículos e equipamentos utilizados</li>
                    <li>• Examine áreas de armazenamento temporário</li>
                  </ul>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    type="submit"
                    className="flex-1 bg-blue-500 dark:bg-[#1D9BF0] text-gray-900 dark:text-white font-bold py-2 px-4 rounded-full hover:bg-blue-600 dark:hover:bg-[#1a8cd8] transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#1D9BF0] focus:ring-offset-2 focus:ring-offset-[#15202B]"
                  >
                    Registrar Ferramenta Danificada
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalAberto(false)}
                    className="flex-1 border border-blue-500 dark:border-[#1D9BF0] text-blue-500 dark:text-[#1D9BF0] font-bold py-2 px-4 rounded-full hover:bg-blue-500 dark:bg-[#1D9BF0] hover:bg-opacity-10 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#1D9BF0] focus:ring-offset-2 focus:ring-offset-[#15202B]"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição de Ferramenta Danificada */}
      {editModalAberto && editingFerramenta && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 dark:border-gray-600 rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Search className="w-5 h-5 text-blue-500 dark:text-[#1D9BF0]" />
                  Editar Ferramenta Danificada
                </h3>
                <button
                  onClick={closeEditModal}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                const sucesso = atualizarFerramentaDanificada(editingFerramenta.id, editingFerramenta);
                if (sucesso) {
                  closeEditModal();
                  toast.success('Ferramenta danificada atualizada com sucesso!', {
                    position: "top-right",
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "dark",
                    style: {
                      background: '#192734',
                      color: '#ffffff',
                      borderRadius: '1rem',
                      border: '1px solid #38444D'
                    }
                  });
                } else {
                  toast.error('Erro ao atualizar ferramenta danificada. Tente novamente.', {
                    position: "top-right",
                    autoClose: 5000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    theme: "dark",
                    style: {
                      background: '#192734',
                      color: '#ffffff',
                      borderRadius: '1rem',
                      border: '1px solid #38444D'
                    }
                  });
                }
              }} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white text-center mb-2">
                      Nome da Ferramenta *
                    </label>
                    <input
                      type="text"
                      value={editingFerramenta.nomeItem}
                      onChange={(e) => setEditingFerramenta({...editingFerramenta, nomeItem: e.target.value})}
                      className="w-full bg-white dark:bg-gray-800 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 dark:border-gray-600 text-gray-900 dark:text-white rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#1D9BF0] transition-colors text-center"
                      placeholder="Ex: Martelo Tramontina 25mm"
                      list="inventario-list"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white text-center mb-2">
                      Categoria
                    </label>
                    <input
                      type="text"
                      value={editingFerramenta.categoria}
                      onChange={(e) => setEditingFerramenta({...editingFerramenta, categoria: e.target.value})}
                      className="w-full bg-white dark:bg-gray-800 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 dark:border-gray-600 text-gray-900 dark:text-white rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#1D9BF0] transition-colors text-center"
                      placeholder="Ex: Ferramenta Manual"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white text-center mb-2">
                    Descrição da Perda *
                  </label>
                  <textarea
                    value={editingFerramenta.descricaoProblema}
                    onChange={(e) => setEditingFerramenta({...editingFerramenta, descricaoProblema: e.target.value})}
                    className="w-full bg-white dark:bg-gray-800 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 dark:border-gray-600 text-gray-900 dark:text-white rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#1D9BF0] transition-colors text-center h-24"
                    placeholder="Descreva detalhadamente as circunstâncias da perda..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white text-center mb-2">
                    Último Local Visto
                  </label>
                  <input
                    type="text"
                    value={editingFerramenta.localUltimaVez}
                    onChange={(e) => setEditingFerramenta({...editingFerramenta, localUltimaVez: e.target.value})}
                    className="w-full bg-white dark:bg-gray-800 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 dark:border-gray-600 text-gray-900 dark:text-white rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#1D9BF0] transition-colors text-center"
                    placeholder="Ex: Obra da Rua A, Almoxarifado, Canteiro 3..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white text-center mb-2">
                      Valor Estimado (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editingFerramenta.valorReparo}
                      onChange={(e) => setEditingFerramenta({...editingFerramenta, valorReparo: e.target.value})}
                      className="w-full bg-white dark:bg-gray-800 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 dark:border-gray-600 text-gray-900 dark:text-white rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#1D9BF0] transition-colors text-center"
                      placeholder="0,00"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white text-center mb-2">
                      Status do Reparo
                    </label>
                    <select
                      value={editingFerramenta.statusReparo}
                      onChange={(e) => setEditingFerramenta({...editingFerramenta, statusReparo: e.target.value})}
                      className="w-full bg-white dark:bg-gray-800 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 dark:border-gray-600 text-gray-900 dark:text-white rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#1D9BF0] transition-colors appearance-none text-center"
                    >
                      <option value="aguardando_reparo" className="bg-white dark:bg-gray-800">Aguardando Reparo</option>
                      <option value="em_reparo">Em Reparo</option>
                      <option value="reparada">Reparada</option>
                      <option value="irreparavel">Irreparável</option>
                      <option value="substituida">Substituída</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-white text-center mb-2">
                      Prioridade
                    </label>
                    <select
                      value={editingFerramenta.prioridade}
                      onChange={(e) => setEditingFerramenta({...editingFerramenta, prioridade: e.target.value})}
                      className="w-full bg-white dark:bg-gray-800 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 dark:border-gray-600 text-gray-900 dark:text-white rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#1D9BF0] transition-colors appearance-none text-center"
                    >
                      <option value="baixa" className="bg-white dark:bg-gray-800">Baixa</option>
                      <option value="media">Média</option>
                      <option value="alta">Alta</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 dark:text-white text-center mb-2">
                    Observações e Ações Tomadas
                  </label>
                  <textarea
                    value={editingFerramenta.observacoes}
                    onChange={(e) => setEditingFerramenta({...editingFerramenta, observacoes: e.target.value})}
                    className="w-full bg-white dark:bg-gray-800 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 dark:border-gray-600 text-gray-900 dark:text-white rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#1D9BF0] transition-colors text-center h-20 resize-none"
                    placeholder="Ex: Já foi feita busca no almoxarifado, verificado com outros funcionários..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    type="submit"
                    className="flex-1 bg-blue-500 dark:bg-[#1D9BF0] text-gray-900 dark:text-white font-bold py-2 px-4 rounded-full hover:bg-blue-600 dark:hover:bg-[#1a8cd8] transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#1D9BF0] focus:ring-offset-2 focus:ring-offset-[#15202B]"
                  >
                    Salvar Alterações
                  </button>
                  <button
                    type="button"
                    onClick={closeEditModal}
                    className="flex-1 border border-blue-500 dark:border-[#1D9BF0] text-blue-500 dark:text-[#1D9BF0] font-bold py-2 px-4 rounded-full hover:bg-blue-500 dark:bg-[#1D9BF0] hover:bg-opacity-10 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#1D9BF0] focus:ring-offset-2 focus:ring-offset-[#15202B]"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {deleteModalAberto && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 dark:border-gray-600 rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-[#F4212E] bg-opacity-10 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-[#F4212E]" />
                </div>
                <h3 className="text-lg font-bold text-white">
                  Confirmar Exclusão
                </h3>
              </div>
              
              <p className={`${colors.text} mb-6`}>
                Tem certeza que deseja excluir este registro de ferramenta danificada? Esta ação não pode ser desfeita.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    const sucesso = await removerFerramentaDanificada(deletingFerramentaId);
                    if (sucesso) {
                      closeDeleteModal();
                      toast.success('Registro removido com sucesso!', {
                        position: "top-right",
                        autoClose: 3000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                        theme: "dark",
                        style: {
                          background: '#192734',
                          color: '#ffffff',
                          borderRadius: '1rem',
                          border: '1px solid #38444D'
                        }
                      });
                    } else {
                      toast.error('Erro ao remover registro. Tente novamente.', {
                        position: "top-right",
                        autoClose: 5000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                        theme: "dark",
                        style: {
                          background: '#192734',
                          color: '#ffffff',
                          borderRadius: '1rem',
                          border: '1px solid #38444D'
                        }
                      });
                    }
                  }}
                  className="flex-1 bg-[#F4212E] text-gray-900 dark:text-white font-bold py-2 px-4 rounded-full hover:bg-[#d91d28] transition-colors focus:outline-none focus:ring-2 focus:ring-[#F4212E] focus:ring-offset-2 focus:ring-offset-[#15202B]"
                >
                  Excluir
                </button>
                <button
                  onClick={closeDeleteModal}
                  className="flex-1 border border-gray-200 dark:border-gray-600 dark:border-gray-600 text-gray-900 dark:text-white font-bold py-2 px-4 rounded-full hover:bg-[#38444D] hover:bg-opacity-10 transition-colors focus:outline-none focus:ring-2 focus:ring-[#38444D] focus:ring-offset-2 focus:ring-offset-[#15202B]"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FerramentasDanificadasTab;



