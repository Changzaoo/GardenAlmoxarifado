import React, { useState, useContext } from 'react';
import { AlertTriangle, Plus, Search, Calendar, User, Wrench, FileText } from 'lucide-react';
import { AuthContext } from '../../hooks/useAuth';

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

  const getStatusColor = (status) => {
    switch (status) {
      case 'aguardando': return 'bg-yellow-100 text-yellow-800';
      case 'em_reparo': return 'bg-blue-100 text-blue-800';
      case 'reparado': return 'bg-green-100 text-green-800';
      case 'irreparavel': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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
      case 'baixa': return 'bg-green-100 text-green-800';
      case 'media': return 'bg-yellow-100 text-yellow-800';
      case 'alta': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Ferramentas Danificadas</h2>
              <p className="text-sm text-gray-500">Controle e acompanhamento de reparos</p>
            </div>
          </div>
          
          <button
            onClick={() => setModalAberto(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Registrar Dano
          </button>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-gray-600">{estatisticas.total}</div>
            <div className="text-sm text-gray-500">Total</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-yellow-600">{estatisticas.aguardando}</div>
            <div className="text-sm text-yellow-600">Aguardando</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600">{estatisticas.emReparo}</div>
            <div className="text-sm text-blue-600">Em Reparo</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600">{estatisticas.reparadas}</div>
            <div className="text-sm text-green-600">Reparadas</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-red-600">{estatisticas.irreparaveis}</div>
            <div className="text-sm text-red-600">Irreparáveis</div>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por ferramenta, problema ou responsável..."
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              className="pl-10 form-input"
            />
          </div>
          
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="form-select w-full md:w-48"
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
          <div key={item.id} className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-orange-500">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-orange-600" />
                  {item.nomeItem}
                </h3>
                {item.categoria && (
                  <p className="text-gray-500 text-sm">{item.categoria}</p>
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
                  className="form-select mt-2 text-xs"
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
              <div className="bg-red-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 font-medium text-red-800 mb-1">
                  <FileText className="w-4 h-4" />
                  Descrição do Problema
                </div>
                <p className="text-red-700">{item.descricaoProblema}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-gray-600">
                  <User className="w-4 h-4" />
                  <span><strong>Responsável:</strong> {item.responsavel}</span>
                </div>
                
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span><strong>Data:</strong> {new Date(item.dataOcorrencia).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>

              {item.custoReparo > 0 && (
                <div className="bg-blue-50 p-2 rounded">
                  <strong className="text-blue-800">Custo de Reparo:</strong> 
                  <span className="text-blue-700 ml-1">
                    R$ {item.custoReparo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              {item.observacoes && (
                <div className="bg-gray-50 p-2 rounded">
                  <strong className="text-gray-700">Observações:</strong>
                  <p className="text-gray-600 mt-1">{item.observacoes}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {ferramentasFiltradas.length === 0 && (
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <AlertTriangle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500 text-lg">
            {filtro || filtroStatus !== 'todos' 
              ? 'Nenhuma ferramenta danificada encontrada' 
              : 'Nenhuma ferramenta danificada registrada'
            }
          </p>
          <p className="text-gray-400 text-sm mt-2">
            {filtro || filtroStatus !== 'todos'
              ? 'Tente alterar os filtros de busca'
              : 'Clique em "Registrar Dano" para adicionar uma ocorrência'
            }
          </p>
        </div>
      )}

      {/* Modal de Nova Ferramenta Danificada */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  Registrar Ferramenta Danificada
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
                    <select
                      value={novaFerramenta.nomeItem}
                      onChange={e => setNovaFerramenta({ ...novaFerramenta, nomeItem: e.target.value })}
                      className="form-select"
                      required
                    >
                      <option value="">Selecione a ferramenta</option>
                      {inventario.map(item => (
                        <option key={item.id} value={item.nome}>{item.nome}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Categoria
                    </label>
                    <input
                      type="text"
                      value={novaFerramenta.categoria}
                      onChange={(e) => setNovaFerramenta({...novaFerramenta, categoria: e.target.value})}
                      className="form-input"
                      placeholder="Ex: Ferramenta Elétrica"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição do Problema *
                  </label>
                  <textarea
                    value={novaFerramenta.descricaoProblema}
                    onChange={(e) => setNovaFerramenta({...novaFerramenta, descricaoProblema: e.target.value})}
                    className="form-input h-24 resize-none"
                    placeholder="Descreva detalhadamente o problema encontrado na ferramenta..."
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Responsável pelo Relato
                    </label>
                    <select
                      value={novaFerramenta.responsavel}
                      onChange={e => setNovaFerramenta({ ...novaFerramenta, responsavel: e.target.value })}
                      className="form-select"
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data da Ocorrência
                    </label>
                    <input
                      type="date"
                      value={novaFerramenta.dataOcorrencia}
                      onChange={(e) => setNovaFerramenta({...novaFerramenta, dataOcorrencia: e.target.value})}
                      className="form-input"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prioridade
                    </label>
                    <select
                      value={novaFerramenta.prioridade}
                      onChange={(e) => setNovaFerramenta({...novaFerramenta, prioridade: e.target.value})}
                      className="form-select"
                    >
                      <option value="baixa">Baixa</option>
                      <option value="media">Média</option>
                      <option value="alta">Alta</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status do Reparo
                    </label>
                    <select
                      value={novaFerramenta.statusReparo}
                      onChange={(e) => setNovaFerramenta({...novaFerramenta, statusReparo: e.target.value})}
                      className="form-select"
                    >
                      <option value="aguardando">Aguardando Reparo</option>
                      <option value="em_reparo">Em Reparo</option>
                      <option value="reparado">Reparado</option>
                      <option value="irreparavel">Irreparável</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Custo Estimado de Reparo (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={novaFerramenta.custoReparo}
                      onChange={(e) => setNovaFerramenta({...novaFerramenta, custoReparo: e.target.value})}
                      className="form-input"
                      placeholder="0,00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observações Adicionais
                  </label>
                  <textarea
                    value={novaFerramenta.observacoes}
                    onChange={(e) => setNovaFerramenta({...novaFerramenta, observacoes: e.target.value})}
                    className="form-input h-20 resize-none"
                    placeholder="Informações complementares sobre o dano ou reparo..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="submit" className="btn-primary flex-1">
                    Registrar Ferramenta Danificada
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalAberto(false)}
                    className="btn-secondary flex-1"
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