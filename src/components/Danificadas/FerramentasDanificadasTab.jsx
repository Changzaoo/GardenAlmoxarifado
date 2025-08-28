import React, { useState, useContext } from 'react';
import { AlertTriangle, Plus, Search, Calendar, User, Wrench, FileText } from 'lucide-react';
import { AuthContext } from '../../hooks/useAuth';
import { twitterThemeConfig } from '../../styles/twitterThemeConfig';

const FerramentasDanificadasTab = ({ 
  ferramentasDanificadas, 
  inventario, 
  adicionarFerramentaDanificada, 
  atualizarFerramentaDanificada,
  removerFerramentaDanificada,
  readonly
}) => {
  const { usuario } = useContext(AuthContext);
  const isFuncionario = usuario?.nivel === 'funcionario';
  const [novaFerramenta, setNovaFerramenta] = useState({
    nomeItem: '',
    categoria: '',
    descricaoProblema: '',
    responsavel: '',
    dataOcorrencia: new Date().toISOString().split('T')[0],
    custoReparo: '',
    statusReparo: 'aguardando',
    observacoes: '',
    prioridade: 'media'
  });
  const [filtro, setFiltro] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [modalAberto, setModalAberto] = useState(false);

  const ferramentasFiltradas = ferramentasDanificadas.filter(item => {
    const matchFiltro = 
      item.nomeItem.toLowerCase().includes(filtro.toLowerCase()) ||
      item.descricaoProblema.toLowerCase().includes(filtro.toLowerCase()) ||
      item.responsavel.toLowerCase().includes(filtro.toLowerCase());
    
    const matchStatus = filtroStatus === 'todos' || item.statusReparo === filtroStatus;
    
    return matchFiltro && matchStatus;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!novaFerramenta.nomeItem || !novaFerramenta.descricaoProblema) {
      alert('Preencha pelo menos o nome da ferramenta e descrição do problema!');
      return;
    }

    const dadosCompletos = {
      ...novaFerramenta,
      custoReparo: novaFerramenta.custoReparo ? parseFloat(novaFerramenta.custoReparo) : 0
    };

    const sucesso = await adicionarFerramentaDanificada(dadosCompletos);
    
    if (sucesso) {
      setNovaFerramenta({
        nomeItem: '',
        categoria: '',
        descricaoProblema: '',
        responsavel: '',
        dataOcorrencia: new Date().toISOString().split('T')[0],
        custoReparo: '',
        statusReparo: 'aguardando',
        observacoes: '',
        prioridade: 'media'
      });
      setModalAberto(false);
      alert('Ferramenta danificada registrada com sucesso!');
    } else {
      alert('Erro ao registrar ferramenta danificada. Tente novamente.');
    }
  };

  const { colors, classes } = twitterThemeConfig;

  const getStatusColor = (status) => {
    switch (status) {
      case 'aguardando': return 'bg-[#FFD700] bg-opacity-10 text-[#FFD700]';
      case 'em_reparo': return 'bg-[#1D9BF0] bg-opacity-10 text-[#1D9BF0]';
      case 'reparado': return 'bg-[#00BA7C] bg-opacity-10 text-[#00BA7C]';
      case 'irreparavel': return 'bg-[#F4212E] bg-opacity-10 text-[#F4212E]';
      default: return 'bg-[#8899A6] bg-opacity-10 text-[#8899A6]';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'aguardando': return 'Aguardando Reparo';
      case 'em_reparo': return 'Em Reparo';
      case 'reparado': return 'Reparado';
      case 'irreparavel': return 'Irreparável';
      default: return status;
    }
  };

  const getPrioridadeColor = (prioridade) => {
    switch (prioridade) {
      case 'baixa': return 'bg-[#1D9BF0] bg-opacity-10 text-[#1D9BF0]';
      case 'media': return 'bg-[#FFD700] bg-opacity-10 text-[#FFD700]';
      case 'alta': return 'bg-[#F4212E] bg-opacity-10 text-[#F4212E]';
      default: return 'bg-[#8899A6] bg-opacity-10 text-[#8899A6]';
    }
  };

  const estatisticas = {
    total: ferramentasDanificadas.length,
    aguardando: ferramentasDanificadas.filter(f => f.statusReparo === 'aguardando').length,
    emReparo: ferramentasDanificadas.filter(f => f.statusReparo === 'em_reparo').length,
    reparadas: ferramentasDanificadas.filter(f => f.statusReparo === 'reparado').length,
    irreparaveis: ferramentasDanificadas.filter(f => f.statusReparo === 'irreparavel').length
  };

  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <div className={`${classes.card} p-6`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#F4212E] bg-opacity-10 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-[#F4212E]" />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${colors.text}`}>Ferramentas Danificadas</h2>
              <p className={`text-sm ${colors.textSecondary}`}>Controle e acompanhamento de reparos</p>
            </div>
          </div>
          
          <button
            onClick={() => setModalAberto(true)}
            className="bg-[#1DA1F2] text-white rounded-full px-4 py-2 flex items-center justify-center gap-2 hover:bg-[#1a91da] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Registrar Dano
          </button>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className={`${classes.card} p-4`}>
            <div className={`text-2xl font-bold ${colors.text}`}>{estatisticas.total}</div>
            <div className={`text-sm ${colors.textSecondary}`}>Total</div>
          </div>
          <div className={`${classes.card} p-4 bg-[#FFD700] bg-opacity-5`}>
            <div className="text-2xl font-bold text-[#FFD700]">{estatisticas.aguardando}</div>
            <div className="text-sm text-[#FFD700]">Aguardando</div>
          </div>
          <div className={`${classes.card} p-4 bg-[#1D9BF0] bg-opacity-5`}>
            <div className="text-2xl font-bold text-[#1D9BF0]">{estatisticas.emReparo}</div>
            <div className="text-sm text-[#1D9BF0]">Em Reparo</div>
          </div>
          <div className={`${classes.card} p-4 bg-[#00BA7C] bg-opacity-5`}>
            <div className="text-2xl font-bold text-[#00BA7C]">{estatisticas.reparadas}</div>
            <div className="text-sm text-[#00BA7C]">Reparadas</div>
          </div>
          <div className={`${classes.card} p-4 bg-[#F4212E] bg-opacity-5`}>
            <div className="text-2xl font-bold text-[#F4212E]">{estatisticas.irreparaveis}</div>
            <div className="text-sm text-[#F4212E]">Irreparáveis</div>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className={`w-4 h-4 absolute left-3 top-3 ${colors.textSecondary}`} />
            <input
              type="text"
              placeholder="Buscar por ferramenta, problema ou responsável..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className={classes.searchInput}
            />
          </div>
          
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className={classes.select}
          >
            <option value="todos">Todos os Status</option>
            <option value="aguardando">Aguardando Reparo</option>
            <option value="em_reparo">Em Reparo</option>
            <option value="reparado">Reparado</option>
            <option value="irreparavel">Irreparável</option>
          </select>
        </div>
      </div>

      {/* Lista de ferramentas danificadas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {ferramentasFiltradas.map(item => (
          <div key={item.id} className={`${classes.card} ${classes.cardHover} p-6 border-l-4 border-[#F4212E]`}>
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className={`font-bold ${colors.text} text-lg flex items-center gap-2`}>
                  <Wrench className="w-5 h-5 text-[#F4212E]" />
                  {item.nomeItem}
                </h3>
                {item.categoria && (
                  <p className={`${colors.textSecondary} text-sm`}>{item.categoria}</p>
                )}
              </div>
              <div className="flex flex-col gap-2 items-end">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.statusReparo)}`}>
                  {getStatusText(item.statusReparo)}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPrioridadeColor(item.prioridade)}`}>
                  Prioridade {item.prioridade.charAt(0).toUpperCase() + item.prioridade.slice(1)}
                </span>
                {/* Status editing dropdown */}
                <select
                  className={`${classes.select} mt-2 text-xs`}
                  value={item.statusReparo}
                  onChange={e => atualizarFerramentaDanificada(item.id, { statusReparo: e.target.value })}
                >
                  <option value="aguardando">Aguardando Reparo</option>
                  <option value="em_reparo">Em Reparo</option>
                  <option value="reparado">Reparado</option>
                  <option value="irreparavel">Irreparável</option>
                </select>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className={`${classes.card} bg-[#F4212E] bg-opacity-5 p-3`}>
                <div className="flex items-center gap-2 font-medium text-[#F4212E] mb-1">
                  <FileText className="w-4 h-4" />
                  Descrição do Problema
                </div>
                <p className="text-[#F4212E]">{item.descricaoProblema}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className={`flex items-center gap-2 ${colors.textSecondary}`}>
                  <User className="w-4 h-4" />
                  <span><strong>Responsável:</strong> {item.responsavel}</span>
                </div>
                
                <div className={`flex items-center gap-2 ${colors.textSecondary}`}>
                  <Calendar className="w-4 h-4" />
                  <span><strong>Data:</strong> {new Date(item.dataOcorrencia).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>

              {item.custoReparo > 0 && (
                <div className={`${classes.card} bg-[#1D9BF0] bg-opacity-5 p-2`}>
                  <strong className="text-[#1D9BF0]">Custo de Reparo:</strong> 
                  <span className="text-[#1D9BF0] ml-1">
                    R$ {item.custoReparo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              {item.observacoes && (
                <div className={`${classes.card} p-2`}>
                  <strong className={colors.text}>Observações:</strong>
                  <p className={`${colors.textSecondary} mt-1`}>{item.observacoes}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {ferramentasFiltradas.length === 0 && (
        <div className={`${classes.card} p-8 text-center`}>
          <AlertTriangle className={`w-16 h-16 mx-auto ${colors.textSecondary} mb-4`} />
          <p className={`${colors.text} text-lg`}>
            {filtro || filtroStatus !== 'todos' 
              ? 'Nenhuma ferramenta danificada encontrada' 
              : 'Nenhuma ferramenta danificada registrada'
            }
          </p>
          <p className={`${colors.textSecondary} text-sm mt-2`}>
            {filtro || filtroStatus !== 'todos'
              ? 'Tente alterar os filtros de busca'
              : 'Clique em "Registrar Dano" para adicionar uma ocorrência'
            }
          </p>
        </div>
      )}

      {/* Modal de Nova Ferramenta Danificada */}
      {modalAberto && (
        <div className={`${classes.modalOverlay} p-4`}>
          <div className={`${classes.modal} max-w-3xl w-full max-h-[90vh] overflow-y-auto`}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className={`text-lg font-bold ${colors.text} flex items-center gap-2`}>
                  <AlertTriangle className="w-5 h-5 text-[#F4212E]" />
                  Registrar Ferramenta Danificada
                </h3>
                <button
                  onClick={() => setModalAberto(false)}
                  className={`${colors.textSecondary} hover:${colors.text}`}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium ${colors.text} mb-1`}>
                      Nome da Ferramenta *
                    </label>
                    <select
                      value={novaFerramenta.nomeItem}
                      onChange={e => setNovaFerramenta({ ...novaFerramenta, nomeItem: e.target.value })}
                      className={classes.select}
                      required
                    >
                      <option value="">Selecione a ferramenta</option>
                      {inventario.map(item => (
                        <option key={item.id} value={item.nome}>{item.nome}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium ${colors.text} mb-1`}>
                      Categoria
                    </label>
                    <input
                      type="text"
                      value={novaFerramenta.categoria}
                      onChange={(e) => setNovaFerramenta({...novaFerramenta, categoria: e.target.value})}
                      className={classes.input}
                      placeholder="Ex: Ferramenta Elétrica"
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium ${colors.text} mb-1`}>
                    Descrição do Problema *
                  </label>
                  <textarea
                    value={novaFerramenta.descricaoProblema}
                    onChange={(e) => setNovaFerramenta({...novaFerramenta, descricaoProblema: e.target.value})}
                    className={`${classes.textarea} h-24`}
                    placeholder="Descreva detalhadamente o problema encontrado na ferramenta..."
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className={`block text-sm font-medium ${colors.text} mb-1`}>
                      Responsável pelo Relato
                    </label>
                    <select
                      value={novaFerramenta.responsavel}
                      onChange={e => setNovaFerramenta({ ...novaFerramenta, responsavel: e.target.value })}
                      className={classes.select}
                      required
                    >
                      <option value="">Selecione o responsável</option>
                      {Array.isArray(window.funcionarios) && window.funcionarios.length > 0
                        ? window.funcionarios.map(func => (
                            <option key={func.id} value={func.nome}>{func.nome}</option>
                          ))
                        : null}
                    </select>
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium ${colors.text} mb-1`}>
                      Data da Ocorrência
                    </label>
                    <input
                      type="date"
                      value={novaFerramenta.dataOcorrencia}
                      onChange={(e) => setNovaFerramenta({...novaFerramenta, dataOcorrencia: e.target.value})}
                      className={classes.input}
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium ${colors.text} mb-1`}>
                      Prioridade
                    </label>
                    <select
                      value={novaFerramenta.prioridade}
                      onChange={(e) => setNovaFerramenta({...novaFerramenta, prioridade: e.target.value})}
                      className={classes.select}
                    >
                      <option value="baixa">Baixa</option>
                      <option value="media">Média</option>
                      <option value="alta">Alta</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium ${colors.text} mb-1`}>
                      Status do Reparo
                    </label>
                    <select
                      value={novaFerramenta.statusReparo}
                      onChange={(e) => setNovaFerramenta({...novaFerramenta, statusReparo: e.target.value})}
                      className={classes.select}
                    >
                      <option value="aguardando">Aguardando Reparo</option>
                      <option value="em_reparo">Em Reparo</option>
                      <option value="reparado">Reparado</option>
                      <option value="irreparavel">Irreparável</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className={`block text-sm font-medium ${colors.text} mb-1`}>
                      Custo Estimado de Reparo (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={novaFerramenta.custoReparo}
                      onChange={(e) => setNovaFerramenta({...novaFerramenta, custoReparo: e.target.value})}
                      className={classes.input}
                      placeholder="0,00"
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium ${colors.text} mb-1`}>
                    Observações Adicionais
                  </label>
                  <textarea
                    value={novaFerramenta.observacoes}
                    onChange={(e) => setNovaFerramenta({...novaFerramenta, observacoes: e.target.value})}
                    className={`${classes.textarea} h-20`}
                    placeholder="Informações complementares sobre o dano ou reparo..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="submit" className={`${classes.primaryButton} flex-1`}>
                    Registrar Ferramenta Danificada
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalAberto(false)}
                    className={`${classes.secondaryButton} flex-1`}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FerramentasDanificadasTab;