/**
 * CÓDIGO PARA ADICIONAR ABA DE SINCRONIZAÇÃO NO WORKFLOW.JSX
 * 
 * Copie e cole estas seções nos locais indicados
 */

// ====================================================================
// 1️⃣ NO ARRAY DE ABAS DO MENU (procure por "const abasMenu = [")
// ====================================================================

// Adicione esta nova aba no array abasMenu:
{
  id: 'sincronizacao',
  label: 'Sincronização',
  icon: <RefreshCw className="w-5 h-5" />,
  nivelMinimo: NIVEIS_PERMISSAO.FUNCIONARIO,
  descricao: 'Gerenciar dados offline e sincronização'
},

// ====================================================================
// 2️⃣ NA SEÇÃO DE RENDERIZAÇÃO DE CONTEÚDO (após outras abas)
// ====================================================================

// Adicione esta seção após as outras abas (ex: após a aba 'mensagens'):
{abaAtiva === 'sincronizacao' && (
  <div className="max-w-4xl mx-auto p-6">
    {/* Header */}
    <div className="mb-6">
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-3">
        <RefreshCw className={`w-8 h-8 ${isSyncing ? 'animate-spin text-blue-500' : 'text-gray-700 dark:text-gray-300'}`} />
        Sincronização Offline
      </h2>
      <p className="text-gray-600 dark:text-gray-400">
        Gerencie o download e cache de dados para uso offline
      </p>
    </div>

    {/* Componente de Status */}
    <OfflineSyncStatus
      isOnline={isOnline}
      isSyncing={isSyncing}
      syncProgress={syncProgress}
      lastSyncTime={lastSyncTime}
      error={syncError}
      onSync={() => syncAllCollections(true)}
      onClearCache={clearCache}
      cachedData={cachedData}
      cacheAge={cacheAge}
    />

    {/* Informações Adicionais */}
    <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
        <Info className="w-5 h-5" />
        Como funciona?
      </h3>
      <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
        <li className="flex items-start gap-2">
          <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span><strong>Download Automático:</strong> Todos os dados são baixados quando você abre o aplicativo pela primeira vez</span>
        </li>
        <li className="flex items-start gap-2">
          <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span><strong>Compressão Inteligente:</strong> Dados grandes são comprimidos com Python para economizar espaço</span>
        </li>
        <li className="flex items-start gap-2">
          <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span><strong>Modo Offline:</strong> O aplicativo funciona 100% sem internet após a primeira sincronização</span>
        </li>
        <li className="flex items-start gap-2">
          <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span><strong>Atualização Automática:</strong> Quando online, os dados são atualizados automaticamente em tempo real</span>
        </li>
      </ul>
    </div>

    {/* Dicas de Uso */}
    <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-3 flex items-center gap-2">
        <Lightbulb className="w-5 h-5" />
        Dicas de Uso
      </h3>
      <ul className="space-y-2 text-sm text-yellow-800 dark:text-yellow-200">
        <li className="flex items-start gap-2">
          <span>💡</span>
          <span>Sincronize regularmente para ter os dados mais recentes</span>
        </li>
        <li className="flex items-start gap-2">
          <span>💡</span>
          <span>Limpe o cache se notar problemas de performance</span>
        </li>
        <li className="flex items-start gap-2">
          <span>💡</span>
          <span>Em áreas sem sinal, o app continua funcionando normalmente</span>
        </li>
        <li className="flex items-start gap-2">
          <span>💡</span>
          <span>O cache expira após 1 hora, mas os dados ainda ficam disponíveis</span>
        </li>
      </ul>
    </div>
  </div>
)}

// ====================================================================
// 3️⃣ IMPORTAÇÕES ADICIONAIS (adicione no topo do arquivo)
// ====================================================================

// Já foram adicionadas:
// import OfflineSyncStatus from './OfflineSyncStatus';
// import { useOfflineSync } from '../hooks/useOfflineSync';

// Adicione estes ícones se ainda não existirem:
import { RefreshCw, Info, CheckCircle, Lightbulb } from 'lucide-react';

// ====================================================================
// 4️⃣ HOOK JÁ FOI ADICIONADO EM AlmoxarifadoSistema
// ====================================================================

// O hook useOfflineSync já está sendo usado no componente
// Variáveis disponíveis:
// - isOnline
// - isSyncing
// - syncProgress
// - lastSyncTime
// - cachedData
// - syncError
// - syncAllCollections()
// - clearCache()
// - getCachedCollection()
// - cacheAge

// ====================================================================
// 5️⃣ EXEMPLO DE USO EM OUTROS COMPONENTES
// ====================================================================

// Para usar os dados em cache em qualquer lugar do app:
import { useOfflineSync } from '../hooks/useOfflineSync';

function MeuComponente() {
  const { getCachedCollection, isOnline } = useOfflineSync();
  
  // Obter dados (do cache ou Firebase)
  const funcionarios = getCachedCollection('funcionarios');
  const inventario = getCachedCollection('inventario');
  const emprestimos = getCachedCollection('emprestimos');
  
  return (
    <div>
      {/* Indicador de status */}
      {!isOnline && (
        <div className="bg-orange-100 border border-orange-300 rounded-lg p-3 mb-4">
          <p className="text-sm text-orange-800">
            📴 Você está offline - usando dados em cache
          </p>
        </div>
      )}
      
      {/* Use os dados normalmente */}
      <div>
        <h3>Funcionários: {funcionarios.length}</h3>
        {funcionarios.map(f => (
          <div key={f.id}>{f.nome}</div>
        ))}
      </div>
    </div>
  );
}

// ====================================================================
// 6️⃣ ALTERNATIVA: WIDGET COMPACTO NA NAVBAR
// ====================================================================

// Se preferir um widget menor na navbar ao invés de aba completa:
<div className="flex items-center gap-3">
  {/* Indicador de Status Online/Offline */}
  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800">
    {isOnline ? (
      <>
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
          Online
        </span>
      </>
    ) : (
      <>
        <div className="w-2 h-2 bg-orange-500 rounded-full" />
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
          Offline
        </span>
      </>
    )}
  </div>

  {/* Botão Sincronizar */}
  <button
    onClick={() => syncAllCollections(true)}
    disabled={!isOnline || isSyncing}
    className={`p-2 rounded-lg transition-all ${
      isSyncing || !isOnline
        ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
        : 'bg-blue-500 text-white hover:bg-blue-600 active:scale-95'
    }`}
    title="Sincronizar dados"
  >
    <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
  </button>

  {/* Modal de Sincronização (opcional) */}
  <button
    onClick={() => setShowSyncModal(true)}
    className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
    title="Ver detalhes da sincronização"
  >
    <Database className="w-4 h-4 text-gray-700 dark:text-gray-300" />
  </button>
</div>

// ====================================================================
// 7️⃣ MONITORAMENTO E DEBUG
// ====================================================================

// Adicione este useEffect para monitorar mudanças:
useEffect(() => {
  console.log('📊 Status de Sincronização:', {
    isOnline,
    isSyncing,
    syncProgress: `${Math.round(syncProgress)}%`,
    lastSync: lastSyncTime?.toLocaleString('pt-BR'),
    totalRecords: Object.values(cachedData).reduce((sum, arr) => sum + arr.length, 0),
    cacheAge: cacheAge ? `${cacheAge} minutos` : 'N/A'
  });
}, [isOnline, isSyncing, syncProgress, lastSyncTime, cachedData, cacheAge]);

// Para debug detalhado, adicione no console:
// localStorage.setItem('DEBUG_OFFLINE_SYNC', 'true');

// ====================================================================
// 8️⃣ TOAST DE NOTIFICAÇÃO (opcional)
// ====================================================================

// Para notificar usuário quando sincronização termina:
useEffect(() => {
  if (!isSyncing && lastSyncTime) {
    const totalRecords = Object.values(cachedData).reduce(
      (sum, arr) => sum + arr.length, 
      0
    );
    
    // Mostrar toast de sucesso (se tiver sistema de toast)
    toast.success(`✅ ${totalRecords} registros sincronizados com sucesso!`, {
      duration: 3000
    });
  }
}, [isSyncing, lastSyncTime, cachedData]);

// ====================================================================
// 9️⃣ LIMPAR CACHE AO FAZER LOGOUT
// ====================================================================

// No método de logout, adicione:
const logout = async () => {
  try {
    // Limpar cache offline
    await clearCache();
    console.log('🗑️ Cache limpo ao fazer logout');
    
    // ... resto do código de logout
    clearUserSession();
    setUsuario(null);
    // etc...
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
  }
};

// ====================================================================
// 🎯 RESULTADO ESPERADO
// ====================================================================

/*
APÓS IMPLEMENTAR:

1. Nova aba "Sincronização" aparecerá no menu
2. Ao abrir app, download automático começará
3. Barra de progresso mostrará andamento
4. Após sync, app funcionará offline
5. Ao perder conexão, modo offline ativa automaticamente
6. Ao reconectar, sync automática acontece

LOGS ESPERADOS NO CONSOLE:

🐍 Inicializando Pyodide...
✅ Pyodide inicializado com sucesso!
🔄 Iniciando sincronização completa...
📥 Baixando coleção: usuarios
✅ usuarios: 150 documentos baixados
🗜️ Comprimindo usuarios (150 itens)...
✅ usuarios comprimido com sucesso
💾 Usando cache para inventario
📊 Total de registros: 2450
✅ Sincronização completa finalizada!
*/
