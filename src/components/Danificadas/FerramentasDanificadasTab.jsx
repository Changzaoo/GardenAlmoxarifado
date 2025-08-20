import React, { useState, useContext } from 'react';
import { useTheme } from '../AlmoxarifadoJardim';
import { AlertTriangle, Plus, Search, Calendar, User, Wrench, FileText, Trash2 } from 'lucide-react';
import { AuthContext } from '../../hooks/useAuth';

const FerramentasDanificadasTab = ({
  ferramentasDanificadas,
  inventario,
  adicionarFerramentaDanificada,
  atualizarFerramentaDanificada,
  removerFerramentaDanificada,
  readonly
}) => {
  const { classes } = useTheme();
  const { usuario } = useContext(AuthContext);
  
  // Estado para confirmação de exclusão
  const [confirmarExclusaoId, setConfirmarExclusaoId] = useState(null);
  const [erroExclusao, setErroExclusao] = useState('');

  // Função para iniciar confirmação
  const pedirConfirmacaoExclusao = (id) => {
    setConfirmarExclusaoId(id);
    setErroExclusao('');
  };

  // Função para confirmar exclusão
  const confirmarExclusaoFerramenta = async () => {
    if (!confirmarExclusaoId) return;
    setErroExclusao('');
    try {
      await removerFerramentaDanificada(confirmarExclusaoId);
      setConfirmarExclusaoId(null);
    } catch (error) {
      setErroExclusao(error.message || 'Erro ao excluir ferramenta');
    }
  };

  // Função para cancelar exclusão
  const cancelarExclusaoFerramenta = () => {
    setConfirmarExclusaoId(null);
    setErroExclusao('');
  };

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

  const getStatusColor = (status) => {
    switch (status) {
      case 'aguardando': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'em_reparo': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'reparado': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'irreparavel': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
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
      case 'baixa': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'media': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'alta': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
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
    <div className={`space-y-6 ${classes.backgroundPrimary}`}> 
      {/* Header com estatísticas */}
      <div className={`${classes.card} p-6`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-200" style={{ backgroundColor: 'rgba(251, 146, 60, 0.1)' }}>
              <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${classes.textPrimary}`}>
                Ferramentas Danificadas
              </h2>
              <p className={`text-sm ${classes.textMuted}`}>
                Controle e acompanhamento de reparos
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setModalAberto(true)}
            className={`${classes.buttonPrimary} flex items-center gap-2 px-4 py-2`}
            style={{ backgroundColor: '#bd9967' }}
          >
            <Plus className="w-4 h-4" />
            Registrar Dano
          </button>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className={`${classes.statCard} ${classes.statCardWhite}`}>
            <div className={`text-2xl font-bold ${classes.textSecondary}`}>{estatisticas.total}</div>
            <div className={`text-sm ${classes.textMuted}`}>Total</div>
          </div>
          <div className={`${classes.statCard} ${classes.statCardYellow}`}>
            <div className={`text-2xl font-bold ${classes.statValueYellow}`}>{estatisticas.aguardando}</div>
            <div className={`text-sm ${classes.statLabelYellow}`}>Aguardando</div>
          </div>
          <div className={`${classes.statCard} ${classes.statCardBlue}`}>
            <div className={`text-2xl font-bold ${classes.statValueBlue}`}>{estatisticas.emReparo}</div>
            <div className={`text-sm ${classes.statLabelBlue}`}>Em Reparo</div>
          </div>
          <div className={`${classes.statCard} ${classes.statCardGreen}`}>
            <div className={`text-2xl font-bold ${classes.statValueGreen}`}>{estatisticas.reparadas}</div>
            <div className={`text-sm ${classes.statLabelGreen}`}>Reparadas</div>
          </div>
          <div className={`${classes.statCard} ${classes.statCardRed}`}>
            <div className={`text-2xl font-bold ${classes.statValueRed}`}>{estatisticas.irreparaveis}</div>
            <div className={`text-sm ${classes.statLabelRed}`}>Irreparáveis</div>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className={`w-4 h-4 absolute left-3 top-3 ${classes.textLight}`} />
            <input
              type="text"
              placeholder="Buscar por ferramenta, problema ou responsável..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className={`pl-10 ${classes.input} focus:ring-2 focus:border-transparent`}
              style={{ '--tw-ring-color': '#bd9967' }}
            />
          </div>
          
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className={`${classes.formSelect} w-full md:w-48`}
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
          <div key={item.id} className={`${classes.card} p-6 border-l-4 border-orange-500 relative`}>
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className={`font-bold text-lg flex items-center gap-2 ${classes.textPrimary}`}>
                  <Wrench className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  {item.nomeItem}
                </h3>
                {item.categoria && (
                  <p className={`${classes.textMuted} text-sm`}>{item.categoria}</p>
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
                  className={`${classes.formSelect} mt-2 text-xs`}
                  value={item.statusReparo}
                  onChange={e => atualizarFerramentaDanificada(item.id, { statusReparo: e.target.value })}
                >
                  <option value="aguardando">Aguardando Reparo</option>
                  <option value="em_reparo">Em Reparo</option>
                  <option value="reparado">Reparado</option>
                  <option value="irreparavel">Irreparável</option>
                </select>
                {!readonly && (
                  <button
                    onClick={() => pedirConfirmacaoExclusao(item.id)}
                    className="mt-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1 transition-colors duration-200"
                    title="Excluir ferramenta danificada"
                  >
                    <Trash2 className="w-4 h-4" />
                    Excluir
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className={`${classes.alertError} p-3 rounded-lg`}>
                <div className={`flex items-center gap-2 font-medium mb-1`}>
                  <FileText className="w-4 h-4" />
                  Descrição do Problema
                </div>
                <p>{item.descricaoProblema}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className={`flex items-center gap-2 ${classes.textSecondary}`}>
                  <User className="w-4 h-4" />
                  <span><strong>Responsável:</strong> {item.responsavel}</span>
                </div>
                
                <div className={`flex items-center gap-2 ${classes.textSecondary}`}>
                  <Calendar className="w-4 h-4" />
                  <span><strong>Data:</strong> {new Date(item.dataOcorrencia).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>

              {item.custoReparo > 0 && (
                <div className={`${classes.alertInfo} p-2 rounded`}>
                  <strong>Custo de Reparo:</strong> 
                  <span className="ml-1">
                    R$ {item.custoReparo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              {item.observacoes && (
                <div className={`${classes.containerSecondary} p-2 rounded`}>
                  <strong className={classes.textSecondary}>Observações:</strong>
                  <p className={`${classes.textSecondary} mt-1`}>{item.observacoes}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Box de confirmação de exclusão */}
      {confirmarExclusaoId && (
        <div className={`fixed inset-0 ${classes.overlay} flex items-center justify-center z-50`}>
          <div className={`${classes.modal} p-6 w-full max-w-sm mx-4 flex flex-col items-center`}>
            <h3 className={`text-lg font-medium mb-4 flex items-center justify-center gap-2 ${classes.textPrimary}`}>
              <Trash2 className="w-6 h-6 text-red-400" />
              Confirmar Exclusão
            </h3>
            <p className={`mb-4 text-center ${classes.textSecondary}`}>
              Tem certeza que deseja excluir esta ferramenta danificada?
            </p>
            {erroExclusao && (
              <div className={`${classes.alertError} px-4 py-2 rounded mb-2 text-center`}>
                {erroExclusao}
              </div>
            )}
            <div className="flex flex-col items-center gap-2 w-full mt-2">
              <div className="flex justify-center gap-2 w-full">
                <button 
                  onClick={cancelarExclusaoFerramenta} 
                  className={`px-4 py-2 rounded-lg ${classes.buttonSecondary}`}
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmarExclusaoFerramenta} 
                  className={`px-4 py-2 rounded-lg ${classes.buttonDanger}`}
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {ferramentasFiltradas.length === 0 && (
        <div className={`${classes.card} p-8 text-center`}>
          <AlertTriangle className={`w-16 h-16 mx-auto mb-4 ${classes.textLight}`} />
          <p className={`text-lg ${classes.textMuted}`}>
            {filtro || filtroStatus !== 'todos' 
              ? 'Nenhuma ferramenta danificada encontrada' 
              : 'Nenhuma ferramenta danificada registrada'
            }
          </p>
          <p className={`text-sm mt-2 ${classes.textLight}`}>
            {filtro || filtroStatus !== 'todos'
              ? 'Tente alterar os filtros de busca'
              : 'Clique em "Registrar Dano" para adicionar uma ocorrência'
            }
          </p>
        </div>
      )}

      {/* Modal de Nova Ferramenta Danificada */}
      {modalAberto && (
        <div className={`fixed inset-0 ${classes.overlay} flex items-center justify-center z-50 p-4`}>
          <div className={`${classes.modal} max-w-3xl w-full max-h-[90vh] overflow-y-auto`}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className={`text-lg font-bold flex items-center gap-2 ${classes.textPrimary}`}>
                  <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  Registrar Ferramenta Danificada
                </h3>
                <button
                  onClick={() => setModalAberto(false)}
                  className={`${classes.textLight} hover:${classes.textSecondary} transition-colors duration-200`}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={classes.formLabel}>
                      Nome da Ferramenta *
                    </label>
                    <select
                      value={novaFerramenta.nomeItem}
                      onChange={e => setNovaFerramenta({ ...novaFerramenta, nomeItem: e.target.value })}
                      className={classes.formSelect}
                      required
                    >
                      <option value="">Selecione a ferramenta</option>
                      {inventario.map(item => (
                        <option key={item.id} value={item.nome}>{item.nome}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className={classes.formLabel}>
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
                  <label className={classes.formLabel}>
                    Descrição do Problema *
                  </label>
                  <textarea
                    value={novaFerramenta.descricaoProblema}
                    onChange={(e) => setNovaFerramenta({...novaFerramenta, descricaoProblema: e.target.value})}
                    className={`${classes.formTextarea} h-24`}
                    placeholder="Descreva detalhadamente o problema encontrado na ferramenta..."
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className={classes.formLabel}>
                      Responsável pelo Relato
                    </label>
                    <input
                      type="text"
                      value={usuario?.nome || ''}
                      className={`${classes.input} ${classes.containerSecondary} ${classes.textSecondary}`}
                      disabled
                      readOnly
                    />
                  </div>
                  
                  <div>
                    <label className={classes.formLabel}>
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
                    <label className={classes.formLabel}>
                      Prioridade
                    </label>
                    <select
                      value={novaFerramenta.prioridade}
                      onChange={(e) => setNovaFerramenta({...novaFerramenta, prioridade: e.target.value})}
                      className={classes.formSelect}
                    >
                      <option value="baixa">Baixa</option>
                      <option value="media">Média</option>
                      <option value="alta">Alta</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={classes.formLabel}>
                      Status do Reparo
                    </label>
                    <select
                      value={novaFerramenta.statusReparo}
                      onChange={(e) => setNovaFerramenta({...novaFerramenta, statusReparo: e.target.value})}
                      className={classes.formSelect}
                    >
                      <option value="aguardando">Aguardando Reparo</option>
                      <option value="em_reparo">Em Reparo</option>
                      <option value="reparado">Reparado</option>
                      <option value="irreparavel">Irreparável</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className={classes.formLabel}>
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
                  <label className={classes.formLabel}>
                    Observações Adicionais
                  </label>
                  <textarea
                    value={novaFerramenta.observacoes}
                    onChange={(e) => setNovaFerramenta({...novaFerramenta, observacoes: e.target.value})}
                    className={`${classes.formTextarea} h-20`}
                    placeholder="Informações complementares sobre o dano ou reparo..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    type="submit" 
                    className={`${classes.buttonPrimary} flex-1`}
                    style={{ backgroundColor: '#bd9967' }}
                  >
                    Registrar Ferramenta Danificada
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalAberto(false)}
                    className={`${classes.buttonSecondary} flex-1`}
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