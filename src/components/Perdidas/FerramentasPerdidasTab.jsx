import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Search, Plus, Calendar, User, MapPin, DollarSign, FileText, AlertCircle } from 'lucide-react';
import { twitterThemeConfig } from '../../styles/twitterThemeConfig';

const { classes, colors } = twitterThemeConfig;

const FerramentasPerdidasTab = ({ 
  ferramentasPerdidas, 
  inventario, 
  adicionarFerramentaPerdida, 
  atualizarFerramentaPerdida,
  removerFerramentaPerdida,
  readonly
}) => {
  const { usuario } = useAuth();
  const isFuncionario = usuario?.nivel === 'funcionario';
  const [novaFerramenta, setNovaFerramenta] = useState({
    nomeItem: '',
    categoria: '',
    descricaoPerda: '',
    responsavel: '',
    localUltimaVez: '',
    dataPerdida: new Date().toISOString().split('T')[0],
    valorEstimado: '',
    statusBusca: 'buscando',
    observacoes: '',
    prioridade: 'media'
  });

  const [filtro, setFiltro] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [modalAberto, setModalAberto] = useState(false);

  const ferramentasFiltradas = ferramentasPerdidas.filter(item => {
    const matchFiltro = 
      item.nomeItem.toLowerCase().includes(filtro.toLowerCase()) ||
      item.descricaoPerda.toLowerCase().includes(filtro.toLowerCase()) ||
      item.responsavel.toLowerCase().includes(filtro.toLowerCase()) ||
      item.localUltimaVez.toLowerCase().includes(filtro.toLowerCase());
    
    const matchStatus = filtroStatus === 'todos' || item.statusBusca === filtroStatus;
    
    return matchFiltro && matchStatus;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!novaFerramenta.nomeItem || !novaFerramenta.descricaoPerda) {
      alert('Preencha pelo menos o nome da ferramenta e descrição da perda!');
      return;
    }

    const dadosCompletos = {
      ...novaFerramenta,
      valorEstimado: novaFerramenta.valorEstimado ? parseFloat(novaFerramenta.valorEstimado) : 0
    };

    const sucesso = await adicionarFerramentaPerdida(dadosCompletos);
    
    if (sucesso) {
      setNovaFerramenta({
        nomeItem: '',
        categoria: '',
        descricaoPerda: '',
        responsavel: '',
        localUltimaVez: '',
        dataPerdida: new Date().toISOString().split('T')[0],
        valorEstimado: '',
        statusBusca: 'buscando',
        observacoes: '',
        prioridade: 'media'
      });
      setModalAberto(false);
      alert('Ferramenta perdida registrada com sucesso!');
    } else {
      alert('Erro ao registrar ferramenta perdida. Tente novamente.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'buscando': return 'bg-[#FFD700] bg-opacity-10 text-[#FFD700]';
      case 'encontrada': return 'bg-[#00BA7C] bg-opacity-10 text-[#00BA7C]';
      case 'perdida_definitiva': return 'bg-[#F4212E] bg-opacity-10 text-[#F4212E]';
      case 'substituida': return 'bg-[#1D9BF0] bg-opacity-10 text-[#1D9BF0]';
      default: return 'bg-[#8899A6] bg-opacity-10 text-[#8899A6]';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'buscando': return 'Buscando';
      case 'encontrada': return 'Encontrada';
      case 'perdida_definitiva': return 'Perda Definitiva';
      case 'substituida': return 'Substituída';
      default: return status;
    }
  };

  const getPrioridadeColor = (prioridade) => {
    switch (prioridade) {
      case 'baixa': return 'bg-[#00BA7C] bg-opacity-10 text-[#00BA7C]';
      case 'media': return 'bg-[#FFD700] bg-opacity-10 text-[#FFD700]';
      case 'alta': return 'bg-[#F4212E] bg-opacity-10 text-[#F4212E]';
      default: return 'bg-[#8899A6] bg-opacity-10 text-[#8899A6]';
    }
  };

  const calcularEstatisticas = () => {
    const total = ferramentasPerdidas.length;
    const buscando = ferramentasPerdidas.filter(f => f.statusBusca === 'buscando').length;
    const encontradas = ferramentasPerdidas.filter(f => f.statusBusca === 'encontrada').length;
    const perdidasDefinitivas = ferramentasPerdidas.filter(f => f.statusBusca === 'perdida_definitiva').length;
    const substituidas = ferramentasPerdidas.filter(f => f.statusBusca === 'substituida').length;
    const valorTotalPerdido = ferramentasPerdidas
      .filter(f => f.statusBusca === 'perdida_definitiva')
      .reduce((total, f) => total + (f.valorEstimado || 0), 0);
    return {
      total,
      buscando,
      encontradas,
      perdidasDefinitivas,
      substituidas,
      valorTotalPerdido
    };
  };

  const estatisticas = calcularEstatisticas();

  return (
    <div className="space-y-6">
      {/* Header com botão */}
      <div className={`${classes.card} p-6`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#F4212E] bg-opacity-10 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-[#F4212E]" />
            </div>
            <div>

              <p className={`text-sm ${colors.textSecondary}`}>Controle e rastreamento de ferramentas perdidas</p>
            </div>
          </div>
          
          {!isFuncionario && !readonly && (
            <button
              onClick={() => setModalAberto(true)}
              className="bg-[#1DA1F2] text-white rounded-full px-4 py-2 flex items-center justify-center gap-2 hover:bg-[#1a91da] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Registrar Perda
            </button>
          )}
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <div className={`${classes.card} p-4`}>
            <div className="flex items-center">
              <div className="bg-[#1DA1F2] bg-opacity-10 p-3 rounded-full">
                <AlertCircle className="w-5 h-5 text-[#1DA1F2]" />
              </div>
              <div className="ml-3">
                <p className={`text-sm ${colors.textSecondary}`}>Total</p>
                <p className={`text-xl font-bold ${colors.text}`}>{estatisticas.total}</p>
              </div>
            </div>
          </div>
          <div className={`${classes.card} p-4`}>
            <div className="flex flex-col">
              <p className={`text-sm ${colors.textSecondary}`}>Buscando</p>
              <p className="text-xl font-bold text-[#FFD700]">{estatisticas.buscando}</p>
            </div>
          </div>
          <div className={`${classes.card} p-4`}>
            <div className="flex flex-col">
              <p className={`text-sm ${colors.textSecondary}`}>Encontradas</p>
              <p className="text-xl font-bold text-[#00BA7C]">{estatisticas.encontradas}</p>
            </div>
          </div>
          <div className={`${classes.card} p-4`}>
            <div className="flex flex-col">
              <p className={`text-sm ${colors.textSecondary}`}>Perdidas</p>
              <p className="text-xl font-bold text-[#F4212E]">{estatisticas.perdidasDefinitivas}</p>
            </div>
          </div>
          <div className={`${classes.card} p-4`}>
            <div className="flex flex-col">
              <p className={`text-sm ${colors.textSecondary}`}>Substituídas</p>
              <p className="text-xl font-bold text-[#1D9BF0]">{estatisticas.substituidas}</p>
            </div>
          </div>
          <div className={`${classes.card} p-4`}>
            <div className="flex flex-col">
              <p className={`text-sm ${colors.textSecondary}`}>Valor Perdido</p>
              <p className="text-xl font-bold text-[#F4212E]">
                R$ {estatisticas.valorTotalPerdido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className={`w-4 h-4 absolute left-3 top-3 ${colors.textSecondary}`} />
            <input
              type="text"
              placeholder="Buscar por ferramenta, descrição, responsável ou local..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className={`pl-10 w-full px-3 py-2 ${classes.input} focus:ring-2 focus:ring-[#1DA1F2] focus:border-transparent`}
            />
          </div>
          
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="w-full md:w-48 bg-[#253341] border border-[#38444D] text-white rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1DA1F2] transition-colors appearance-none"
          >
            <option value="todos" className="bg-[#192734]">Todos os Status</option>
            <option value="buscando" className="bg-[#192734]">Buscando</option>
            <option value="encontrada" className="bg-[#192734]">Encontrada</option>
            <option value="perdida_definitiva">Perda Definitiva</option>
            <option value="substituida">Substituída</option>
          </select>
        </div>
      </div>

      {/* Lista de ferramentas perdidas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {ferramentasFiltradas.map(item => (
          <div key={item.id} className={`${classes.card} p-6`}>
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
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.statusBusca)}`}>
                  {getStatusText(item.statusBusca)}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPrioridadeColor(item.prioridade)}`}>
                  Prioridade {item.prioridade.charAt(0).toUpperCase() + item.prioridade.slice(1)}
                </span>
                {!readonly && (
                  <select
                    className="w-full bg-[#253341] border border-[#38444D] text-white rounded-full px-4 py-2 mt-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1DA1F2] transition-colors appearance-none"
                    value={item.statusBusca}
                    onChange={e => atualizarFerramentaPerdida(item.id, { statusBusca: e.target.value })}
                  >
                    <option value="buscando" className="bg-[#192734]">Buscando</option>
                    <option value="encontrada">Encontrada</option>
                    <option value="perdida_definitiva">Perda Definitiva</option>
                    <option value="substituida">Substituída</option>
                  </select>
                )}
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className={`${classes.card} p-3 bg-[#F4212E] bg-opacity-5`}>
                <div className={`flex items-center gap-2 font-medium text-[#F4212E] mb-1`}>
                  <FileText className="w-4 h-4" />
                  Descrição da Perda
                </div>
                <p className="text-[#F4212E]">{item.descricaoPerda}</p>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <div className={`flex items-center gap-2 ${colors.text}`}>
                  <User className="w-4 h-4" />
                  <span><strong>Responsável:</strong> {item.responsavel}</span>
                </div>
                
                <div className={`flex items-center gap-2 ${colors.text}`}>
                  <Calendar className="w-4 h-4" />
                  <span><strong>Data da Perda:</strong> {new Date(item.dataPerdida).toLocaleDateString('pt-BR')}</span>
                </div>
                
                {item.localUltimaVez && (
                  <div className={`flex items-center gap-2 ${colors.text}`}>
                    <MapPin className="w-4 h-4" />
                    <span><strong>Último local visto:</strong> {item.localUltimaVez}</span>
                  </div>
                )}
              </div>

              {item.valorEstimado > 0 && (
                <div className={`${classes.card} p-2 bg-[#FFD700] bg-opacity-5 flex items-center gap-2`}>
                  <DollarSign className="w-4 h-4 text-[#FFD700]" />
                  <span className="text-[#FFD700]">
                    <strong>Valor Estimado:</strong> 
                    <span className="ml-1">
                      R$ {item.valorEstimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </span>
                </div>
              )}

              {item.observacoes && (
                <div className={`${classes.card} p-2`}>
                  <strong className={colors.text}>Observações:</strong>
                  <p className={colors.textSecondary}>{item.observacoes}</p>
                </div>
              )}

              {/* Tempo desde a perda */}
              <div className={`text-xs ${colors.textSecondary} border-t pt-2`}>
                Perdida há {Math.floor((new Date() - new Date(item.dataPerdida)) / (1000 * 60 * 60 * 24))} dias
              </div>
            </div>
          </div>
        ))}
      </div>

      {ferramentasFiltradas.length === 0 && (
        <div className={`${classes.card} p-8 text-center`}>
          <Search className={`w-16 h-16 mx-auto ${colors.textSecondary} mb-4`} />
          <p className={`text-lg font-medium ${colors.text}`}>
            {filtro || filtroStatus !== 'todos' 
              ? 'Nenhuma ferramenta perdida encontrada' 
              : 'Nenhuma ferramenta perdida registrada'
            }
          </p>
          <p className={`${colors.textSecondary} mt-2`}>
            {filtro || filtroStatus !== 'todos'
              ? 'Tente alterar os filtros de busca'
              : 'Clique em "Registrar Perda" para adicionar uma ocorrência'
            }
          </p>
        </div>
      )}

      {/* Modal de Nova Ferramenta Perdida */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#192734] border border-[#38444D] rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Search className="w-5 h-5 text-[#F4212E]" />
                  Registrar Ferramenta Perdida
                </h3>
                <button
                  onClick={() => setModalAberto(false)}
                  className="text-[#8899A6] hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white text-center mb-2">
                      Nome da Ferramenta *
                    </label>
                    <input
                      type="text"
                      value={novaFerramenta.nomeItem}
                      onChange={(e) => setNovaFerramenta({...novaFerramenta, nomeItem: e.target.value})}
                      className="w-full bg-[#253341] border border-[#38444D] text-white rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1DA1F2] transition-colors text-center"
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
                    <label className="block text-sm font-medium text-white text-center mb-2">
                      Categoria
                    </label>
                    <input
                      type="text"
                      value={novaFerramenta.categoria}
                      onChange={(e) => setNovaFerramenta({...novaFerramenta, categoria: e.target.value})}
                      className="w-full bg-[#253341] border border-[#38444D] text-white rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1DA1F2] transition-colors text-center"
                      placeholder="Ex: Ferramenta Manual"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white text-center mb-2">
                    Último Local Visto
                  </label>
                  <input
                    type="text"
                    value={novaFerramenta.localUltimaVez}
                    onChange={(e) => setNovaFerramenta({...novaFerramenta, localUltimaVez: e.target.value})}
                    className="w-full bg-[#253341] border border-[#38444D] text-white rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1DA1F2] transition-colors text-center"
                    placeholder="Ex: Obra da Rua A, Almoxarifado, Canteiro 3..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white text-center mb-2">
                      Valor Estimado (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={novaFerramenta.valorEstimado}
                      onChange={(e) => setNovaFerramenta({...novaFerramenta, valorEstimado: e.target.value})}
                      className="w-full bg-[#253341] border border-[#38444D] text-white rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1DA1F2] transition-colors text-center"
                      placeholder="0,00"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-white text-center mb-2">
                      Status da Busca
                    </label>
                    <select
                      value={novaFerramenta.statusBusca}
                      onChange={(e) => setNovaFerramenta({...novaFerramenta, statusBusca: e.target.value})}
                      className="w-full bg-[#253341] border border-[#38444D] text-white rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1DA1F2] transition-colors appearance-none text-center"
                    >
                      <option value="buscando" className="bg-[#192734]">Buscando</option>
                      <option value="encontrada">Encontrada</option>
                      <option value="perdida_definitiva">Perda Definitiva</option>
                      <option value="substituida">Substituída</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-white text-center mb-2">
                      Prioridade
                    </label>
                    <select
                      value={novaFerramenta.prioridade}
                      onChange={(e) => setNovaFerramenta({...novaFerramenta, prioridade: e.target.value})}
                      className="w-full bg-[#253341] border border-[#38444D] text-white rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1DA1F2] transition-colors appearance-none text-center"
                    >
                      <option value="baixa" className="bg-[#192734]">Baixa</option>
                      <option value="media">Média</option>
                      <option value="alta">Alta</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white text-center mb-2">
                    Observações e Ações Tomadas
                  </label>
                  <textarea
                    value={novaFerramenta.observacoes}
                    onChange={(e) => setNovaFerramenta({...novaFerramenta, observacoes: e.target.value})}
                    className="w-full bg-[#253341] border border-[#38444D] text-white rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#1DA1F2] transition-colors text-center h-20 resize-none"
                    placeholder="Ex: Já foi feita busca no almoxarifado, verificado com outros funcionários..."
                  />
                </div>

                <div className="bg-[#1DA1F2] bg-opacity-5 p-4 rounded-lg border border-[#1DA1F2] border-opacity-10">
                  <div className="flex items-center gap-2 text-[#1DA1F2] mb-2">
                    <AlertCircle className="w-4 h-4" />
                    <span className="font-medium">Dicas para recuperação:</span>
                  </div>
                  <ul className="text-sm text-[#1DA1F2] space-y-1">
                    <li>• Verifique os locais de trabalho recentes</li>
                    <li>• Consulte outros funcionários da equipe</li>
                    <li>• Confira veículos e equipamentos utilizados</li>
                    <li>• Examine áreas de armazenamento temporário</li>
                  </ul>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    type="submit"
                    className="flex-1 bg-[#1DA1F2] text-white font-bold py-2 px-4 rounded-full hover:bg-[#1a91da] transition-colors focus:outline-none focus:ring-2 focus:ring-[#1DA1F2] focus:ring-offset-2 focus:ring-offset-[#15202B]"
                  >
                    Registrar Ferramenta Perdida
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalAberto(false)}
                    className="flex-1 border border-[#1DA1F2] text-[#1DA1F2] font-bold py-2 px-4 rounded-full hover:bg-[#1DA1F2] hover:bg-opacity-10 transition-colors focus:outline-none focus:ring-2 focus:ring-[#1DA1F2] focus:ring-offset-2 focus:ring-offset-[#15202B]"
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

export default FerramentasPerdidasTab;