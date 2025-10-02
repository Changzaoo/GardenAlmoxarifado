import React, { useState, useEffect } from 'react';
import { Search, Plus, Archive, Pin } from 'lucide-react';

const ListaConversas = ({ 
  onSelectConversa, 
  conversaSelecionada, 
  onNovaConversa,
  conversas = [],
  loading = false,
  formatarTimestamp = () => ''
}) => {
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState('todas'); // todas, nao-lidas, arquivadas

  // MONITOR: Rastrear quando props conversas mudam
  useEffect(() => {
    console.log('***********************************************');
    console.log('ListaConversas - Props conversas MUDARAM');
    console.log('Quantidade recebida:', conversas.length);
    console.log('IDs:', conversas.map(c => c.id));
    console.log('Loading:', loading);
    console.trace('Stack trace');
    console.log('***********************************************');
  }, [conversas, loading]);

  const conversasFiltradas = conversas.filter(conv => {
    // Filtro de busca
    const matchBusca = busca === '' || 
      conv.nome?.toLowerCase().includes(busca.toLowerCase()) ||
      conv.ultimaMensagem?.texto?.toLowerCase().includes(busca.toLowerCase());

    // Filtro de tipo
    if (filtro === 'nao-lidas') {
      return matchBusca && (conv.naoLidas > 0);
    }
    if (filtro === 'arquivadas') {
      return matchBusca && conv.arquivado;
    }

    return matchBusca;
  });

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Carregando conversas...</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            Se demorar muito, abra o console (F12) para ver os logs
          </p>
        </div>
      </div>
    );
  }

  // Debug: mostrar informações no console
  console.log('📊 ListaConversas - Status:', {
    loading,
    totalConversas: conversas.length,
    conversasFiltradas: conversasFiltradas.length,
    filtro,
    busca
  });

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Mensagens
          </h1>
          <button 
            onClick={onNovaConversa}
            className="p-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-all transform hover:scale-110 shadow-lg"
            title="Nova conversa"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar conversas..."
            className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-full border-none outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100 placeholder-gray-500"
          />
        </div>

        {/* Filtros */}
        <div className="flex gap-2 mt-3">
          {['todas', 'nao-lidas', 'arquivadas'].map(f => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                filtro === f
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {f === 'todas' ? 'Todas' : f === 'nao-lidas' ? 'Não lidas' : 'Arquivadas'}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto">
        {conversasFiltradas.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="text-gray-500 dark:text-gray-400 mb-3">
              {busca ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda'}
            </div>
            {!busca && (
              <>
                <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">
                  Clique no botão <span className="text-blue-500 font-semibold">+</span> para iniciar uma conversa
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  💡 Dica: Abra o console (F12) para ver logs de debug
                </p>
              </>
            )}
          </div>
        ) : (
          conversasFiltradas.map(conversa => {
            const naoLidas = conversa.naoLidas || 0;
            const isSelected = conversaSelecionada?.id === conversa.id;

            return (
              <div
                key={conversa.id}
                onClick={() => onSelectConversa(conversa)}
                className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b border-gray-100 dark:border-gray-700 ${
                  isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                    {conversa.nome?.charAt(0).toUpperCase() || '?'}
                  </div>
                  {naoLidas > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {naoLidas > 9 ? '9+' : naoLidas}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={`font-semibold truncate ${
                      naoLidas > 0 
                        ? 'text-gray-900 dark:text-gray-100' 
                        : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {conversa.nome || 'Conversa'}
                    </h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-2">
                      {formatarTimestamp(conversa.ultimaMensagem?.timestamp)}
                    </span>
                  </div>
                  <p className={`text-sm truncate ${
                    naoLidas > 0 
                      ? 'text-gray-900 dark:text-gray-100 font-medium' 
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {conversa.ultimaMensagem?.texto || 'Sem mensagens'}
                  </p>
                </div>

                {/* Badges */}
                <div className="flex flex-col items-end gap-1">
                  {conversa.fixado && (
                    <Pin className="w-4 h-4 text-gray-400" />
                  )}
                  {conversa.arquivado && (
                    <Archive className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ListaConversas;
