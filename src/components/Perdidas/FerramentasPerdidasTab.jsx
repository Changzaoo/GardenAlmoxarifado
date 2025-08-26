import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Search, Plus, Calendar, User, MapPin, DollarSign, FileText, AlertCircle } from 'lucide-react';

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
      case 'buscando': return 'bg-yellow-100 text-yellow-800';
      case 'encontrada': return 'bg-green-100 text-green-800';
      case 'perdida_definitiva': return 'bg-red-100 text-red-800';
      case 'substituida': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
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
      case 'baixa': return 'bg-green-100 text-green-800';
      case 'media': return 'bg-yellow-100 text-yellow-800';
      case 'alta': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-red-600" />
              Ferramentas Perdidas
            </h2>
            <p className="text-gray-600 mt-1">Controle e rastreamento de ferramentas perdidas</p>
          </div>
          
          {!isFuncionario && !readonly && (
            <button
              onClick={() => setModalAberto(true)}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Registrar Perda
            </button>
          )}
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-gray-600">{estatisticas.total}</div>
            <div className="text-sm text-gray-500">Total</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-yellow-600">{estatisticas.buscando}</div>
            <div className="text-sm text-yellow-600">Buscando</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600">{estatisticas.encontradas}</div>
            <div className="text-sm text-green-600">Encontradas</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-red-600">{estatisticas.perdidasDefinitivas}</div>
            <div className="text-sm text-red-600">Perdidas</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600">{estatisticas.substituidas}</div>
            <div className="text-sm text-blue-600">Substituídas</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg text-center">
            <div className="text-lg font-bold text-orange-600">
              R$ {estatisticas.valorTotalPerdido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-sm text-orange-600">Valor Perdido</div>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por ferramenta, descrição, responsável ou local..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="w-full md:w-48 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="todos">Todos os Status</option>
            <option value="buscando">Buscando</option>
            <option value="encontrada">Encontrada</option>
            <option value="perdida_definitiva">Perda Definitiva</option>
            <option value="substituida">Substituída</option>
          </select>
        </div>
      </div>

      {/* Lista de ferramentas perdidas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {ferramentasFiltradas.map(item => (
          <div key={item.id} className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-red-500">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  {item.nomeItem}
                </h3>
                {item.categoria && (
                  <p className="text-gray-500 text-sm">{item.categoria}</p>
                )}
              </div>
              
              <div className="flex flex-col gap-2 items-end">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.statusBusca)}`}>
                  {getStatusText(item.statusBusca)}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPrioridadeColor(item.prioridade)}`}>
                  Prioridade {item.prioridade.charAt(0).toUpperCase() + item.prioridade.slice(1)}
                </span>
                {/* Status editing dropdown */}
                {!readonly && (
                  <select
                    className="form-select mt-2 text-xs"
                    value={item.statusBusca}
                    onChange={e => atualizarFerramentaPerdida(item.id, { statusBusca: e.target.value })}
                  >
                    <option value="buscando">Buscando</option>
                    <option value="encontrada">Encontrada</option>
                    <option value="perdida_definitiva">Perda Definitiva</option>
                    <option value="substituida">Substituída</option>
                  </select>
                )}
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="bg-red-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 font-medium text-red-800 mb-1">
                  <FileText className="w-4 h-4" />
                  Descrição da Perda
                </div>
                <p className="text-red-700">{item.descricaoPerda}</p>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <div className="flex items-center gap-2 text-gray-600">
                  <User className="w-4 h-4" />
                  <span><strong>Responsável:</strong> {item.responsavel}</span>
                </div>
                
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span><strong>Data da Perda:</strong> {new Date(item.dataPerdida).toLocaleDateString('pt-BR')}</span>
                </div>
                
                {item.localUltimaVez && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span><strong>Último local visto:</strong> {item.localUltimaVez}</span>
                  </div>
                )}
              </div>

              {item.valorEstimado > 0 && (
                <div className="bg-orange-50 p-2 rounded flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-orange-600" />
                  <span className="text-orange-800">
                    <strong>Valor Estimado:</strong> 
                    <span className="ml-1">
                      R$ {item.valorEstimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </span>
                </div>
              )}

              {item.observacoes && (
                <div className="bg-gray-50 p-2 rounded">
                  <strong className="text-gray-700">Observações:</strong>
                  <p className="text-gray-600 mt-1">{item.observacoes}</p>
                </div>
              )}

              {/* Tempo desde a perda */}
              <div className="text-xs text-gray-400 border-t pt-2">
                Perdida há {Math.floor((new Date() - new Date(item.dataPerdida)) / (1000 * 60 * 60 * 24))} dias
              </div>
            </div>
          </div>
        ))}
      </div>

      {ferramentasFiltradas.length === 0 && (
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <Search className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg">
            {filtro || filtroStatus !== 'todos' 
              ? 'Nenhuma ferramenta perdida encontrada' 
              : 'Nenhuma ferramenta perdida registrada'
            }
          </p>
          <p className="text-gray-400 text-sm mt-2">
            {filtro || filtroStatus !== 'todos'
              ? 'Tente alterar os filtros de busca'
              : 'Clique em "Registrar Perda" para adicionar uma ocorrência'
            }
          </p>
        </div>
      )}

      {/* Modal de Nova Ferramenta Perdida */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Search className="w-5 h-5 text-red-600" />
                  Registrar Ferramenta Perdida
                </h3>
                <button
                  onClick={() => setModalAberto(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome da Ferramenta *
                    </label>
                    <input
                      type="text"
                      value={novaFerramenta.nomeItem}
                      onChange={(e) => setNovaFerramenta({...novaFerramenta, nomeItem: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: Martelo Tramontina 25mm"
                      list="inventario-list"
                      required
                    />
                    <datalist id="inventario-list">
                      {inventario.map(item => (
                        <option key={item.id} value={item.nome} />
                      ))}
                    </datalist>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Categoria
                    </label>
                    <input
                      type="text"
                      value={novaFerramenta.categoria}
                      onChange={(e) => setNovaFerramenta({...novaFerramenta, categoria: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: Ferramenta Manual"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Último Local Visto
                  </label>
                  <input
                    type="text"
                    value={novaFerramenta.localUltimaVez}
                    onChange={(e) => setNovaFerramenta({...novaFerramenta, localUltimaVez: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: Obra da Rua A, Almoxarifado, Canteiro 3..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valor Estimado (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={novaFerramenta.valorEstimado}
                      onChange={(e) => setNovaFerramenta({...novaFerramenta, valorEstimado: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0,00"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status da Busca
                    </label>
                    <select
                      value={novaFerramenta.statusBusca}
                      onChange={(e) => setNovaFerramenta({...novaFerramenta, statusBusca: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="buscando">Buscando</option>
                      <option value="encontrada">Encontrada</option>
                      <option value="perdida_definitiva">Perda Definitiva</option>
                      <option value="substituida">Substituída</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prioridade
                    </label>
                    <select
                      value={novaFerramenta.prioridade}
                      onChange={(e) => setNovaFerramenta({...novaFerramenta, prioridade: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="baixa">Baixa</option>
                      <option value="media">Média</option>
                      <option value="alta">Alta</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observações e Ações Tomadas
                  </label>
                  <textarea
                    value={novaFerramenta.observacoes}
                    onChange={(e) => setNovaFerramenta({...novaFerramenta, observacoes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-20 resize-none"
                    placeholder="Ex: Já foi feita busca no almoxarifado, verificado com outros funcionários..."
                  />
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-800 mb-2">
                    <AlertCircle className="w-4 h-4" />
                    <span className="font-medium">Dicas para recuperação:</span>
                  </div>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Verifique os locais de trabalho recentes</li>
                    <li>• Consulte outros funcionários da equipe</li>
                    <li>• Confira veículos e equipamentos utilizados</li>
                    <li>• Examine áreas de armazenamento temporário</li>
                  </ul>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
                  >
                    Registrar Ferramenta Perdida
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalAberto(false)}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-lg transition-colors"
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