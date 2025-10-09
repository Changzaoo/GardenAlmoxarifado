import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Search, Plus, Archive, Pin, Bell, Trash2, UserX } from 'lucide-react';
import ContextMenu, { useLongPress } from '../common/ContextMenu';
import VirtualizedList from '../common/VirtualizedList';

// ⚠️ COMPONENTE MOVIDO PARA FORA - Evita recriação e problemas com hooks
const ConversaItem = React.memo(({ conversa, isSelected, onSelect, onLongPress, formatTimestamp }) => {
  const naoLidas = conversa.naoLidas || 0;

  const longPressHandlers = useLongPress((event) => {
    event.preventDefault();
    event.stopPropagation();
    
    const rect = event.currentTarget.getBoundingClientRect();
    onLongPress({
      conversa,
      position: {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      }
    });
  }, 500);

  return (
    <div
      onClick={() => onSelect(conversa)}
      {...longPressHandlers}
      className={`flex items-center gap-4 p-4 mx-2 my-1 rounded-xl cursor-pointer transition-all duration-200 ${
        isSelected 
          ? 'bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg scale-[1.02] text-white' 
          : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:shadow-md'
      }`}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-lg overflow-hidden shadow-lg ${
          isSelected 
            ? 'bg-white/20 ring-2 ring-white' 
            : 'bg-gradient-to-br from-blue-400 to-indigo-600'
        }`}>
          {conversa.photoURL ? (
            <img 
              src={conversa.photoURL} 
              alt={conversa.nome || 'Usuário'} 
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.textContent = conversa.nome?.charAt(0).toUpperCase() || '?';
              }}
            />
          ) : (
            conversa.nome?.charAt(0).toUpperCase() || '?'
          )}
        </div>
        {naoLidas > 0 && (
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg animate-pulse ring-2 ring-white dark:ring-gray-800">
            {naoLidas > 9 ? '9+' : naoLidas}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h3 className={`font-bold truncate ${
            isSelected
              ? 'text-white'
              : naoLidas > 0 
                ? 'text-gray-900 dark:text-gray-100' 
                : 'text-gray-700 dark:text-gray-300'
          }`}>
            {conversa.nome || 'Conversa'}
          </h3>
          <span className={`text-xs flex-shrink-0 ml-2 ${
            isSelected
              ? 'text-white/80'
              : 'text-gray-500 dark:text-gray-400'
          }`}>
            {formatTimestamp(conversa.ultimaMensagem?.timestamp)}
          </span>
        </div>
        <p className={`text-sm truncate ${
          isSelected
            ? 'text-white/90'
            : naoLidas > 0 
              ? 'text-gray-900 dark:text-gray-100 font-medium' 
              : 'text-gray-500 dark:text-gray-400'
        }`}>
          {conversa.ultimaMensagem?.texto || 'Sem mensagens'}
        </p>
      </div>

      {/* Badges */}
      <div className="flex flex-col items-end gap-1">
        {conversa.fixado && (
          <Pin className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-gray-400'}`} />
        )}
        {conversa.arquivado && (
          <Archive className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-gray-400'}`} />
        )}
      </div>
    </div>
  );
});

const ListaConversas = ({ 
  onSelectConversa, 
  conversaSelecionada, 
  onNovaConversa,
  onOpenNotificationSettings,
  onDeleteConversa,
  conversas = [],
  loading = false,
  formatarTimestamp = () => ''
}) => {
  const [contextMenu, setContextMenu] = useState(null);
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState('todas'); // todas, nao-lidas, arquivadas

  // MONITOR: Rastrear quando props conversas mudam
  useEffect(() => {

    console.trace('Stack trace');

  }, [conversas, loading]);

  // Memoizar conversas filtradas para evitar recalcular a cada render
  const conversasFiltradas = useMemo(() => {
    return conversas.filter(conv => {
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
  }, [conversas, busca, filtro]);

  // Otimizar handlers com useCallback - DEVEM vir ANTES de qualquer return condicional
  const handleBuscaChange = useCallback((e) => {
    setBusca(e.target.value);
  }, []);

  const handleFiltroChange = useCallback((novoFiltro) => {
    setFiltro(novoFiltro);
  }, []);

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  // ⚠️ VERIFICAÇÃO DE LOADING - Deve vir DEPOIS de todos os hooks
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

  // ✅ ConversaItem agora está definido FORA do componente (no início do arquivo)

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Mensagens
          </h1>
          <div className="flex gap-2">
            <button 
              onClick={onOpenNotificationSettings}
              className="p-2.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full transition-all transform hover:scale-110"
              title="Configurações de notificações"
            >
              <Bell className="w-5 h-5" />
            </button>
            <button 
              onClick={onNovaConversa}
              className="p-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-all transform hover:scale-110 shadow-lg"
              title="Nova conversa"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={busca}
            onChange={handleBuscaChange}
            placeholder="Buscar conversas..."
            className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-full border-none outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100 placeholder-gray-500"
          />
        </div>

        {/* Filtros */}
        <div className="flex gap-2 mt-3">
          {['todas', 'nao-lidas', 'arquivadas'].map(f => (
            <button
              key={f}
              onClick={() => handleFiltroChange(f)}
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
      <div className="flex-1 overflow-y-auto min-h-0">
        {conversasFiltradas.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="text-gray-500 dark:text-gray-400 mb-3">
              {busca ? 'Nenhuma conversa encontrada' : 'Nenhuma conversa ainda'}
            </div>
            {!busca && (
              <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">
                Clique no botão <span className="text-blue-500 font-semibold">+</span> para iniciar uma conversa
              </p>
            )}
          </div>
        ) : (
          conversasFiltradas.map(conversa => {
            const isSelected = conversaSelecionada?.id === conversa.id;
            
            return (
              <ConversaItem
                key={conversa.id}
                conversa={conversa}
                isSelected={isSelected}
                onSelect={onSelectConversa}
                onLongPress={setContextMenu}
                formatTimestamp={formatarTimestamp}
              />
            );
          })
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          title="Opções da Conversa"
          position={contextMenu.position}
          onClose={handleCloseContextMenu}
          options={[
            {
              icon: Trash2,
              label: 'Apagar para mim',
              description: 'Remove a conversa apenas para você',
              onClick: () => onDeleteConversa(contextMenu.conversa.id, 'self')
            },
            {
              type: 'separator'
            },
            ...(contextMenu.conversa.tipo === 'individual' ? [{
              icon: UserX,
              label: 'Apagar para ambos',
              description: 'Remove a conversa para todos os participantes',
              danger: true,
              onClick: () => onDeleteConversa(contextMenu.conversa.id, 'all')
            }] : [])
          ]}
        />
      )}
    </div>
  );
};

// Memoizar componente para evitar re-renders desnecessários
export default React.memo(ListaConversas);
