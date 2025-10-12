import React, { useEffect, useState, useMemo } from 'react';
import { 
  Activity, 
  Globe, 
  Wifi, 
  Smartphone, 
  Monitor, 
  MapPin, 
  Clock, 
  Zap,
  Download,
  Upload,
  Signal,
  Chrome,
  Users,
  TrendingUp,
  BarChart3,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Filter,
  Search,
  Calendar
} from 'lucide-react';
import { collection, query, orderBy, limit, getDocs, where, Timestamp } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useAuth } from '../../hooks/useAuth';
import { APP_VERSION } from '../../utils/analytics';

/**
 * 📊 Página de Estatísticas de Acesso
 * Visível apenas para Administradores (Nível 4)
 * 
 * Mostra:
 * - Acessos em tempo real
 * - Informações de sistema e navegador
 * - Velocidade de conexão
 * - Geolocalização
 * - Performance de carregamento
 * - Versão do app utilizada
 */
const EstatisticasAcesso = () => {
  const { usuario } = useAuth();
  
  // Estados
  const [acessos, setAcessos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroTempo, setFiltroTempo] = useState('24h'); // 24h, 7d, 30d, all
  const [filtroPesquisa, setFiltroPesquisa] = useState('');
  const [filtroDispositivo, setFiltroDispositivo] = useState('all'); // all, mobile, desktop, tablet
  const [filtroNavegador, setFiltroNavegador] = useState('all');

  // Verificar permissão (apenas Admin)
  if (!usuario || usuario.nivel !== 4) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
          <p className="text-gray-600">
            Esta página é exclusiva para administradores do sistema.
          </p>
        </div>
      </div>
    );
  }

  // Carregar dados de acesso
  useEffect(() => {
    carregarAcessos();
  }, [filtroTempo]);

  const carregarAcessos = async () => {
    setLoading(true);
    try {
      let dataLimite;
      const agora = new Date();
      
      switch (filtroTempo) {
        case '24h':
          dataLimite = new Date(agora.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          dataLimite = new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          dataLimite = new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          dataLimite = null;
      }

      let q = query(
        collection(db, 'analytics_acessos'),
        orderBy('timestamp', 'desc'),
        limit(500)
      );

      if (dataLimite) {
        q = query(
          collection(db, 'analytics_acessos'),
          where('timestamp', '>=', Timestamp.fromDate(dataLimite)),
          orderBy('timestamp', 'desc'),
          limit(500)
        );
      }

      const snapshot = await getDocs(q);
      const dados = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      }));

      setAcessos(dados);
    } catch (error) {
      console.error('Erro ao carregar acessos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar acessos
  const acessosFiltrados = useMemo(() => {
    return acessos.filter(acesso => {
      // Filtro de pesquisa
      if (filtroPesquisa) {
        const termo = filtroPesquisa.toLowerCase();
        const textoCompleto = `
          ${acesso.usuario?.nome || ''} 
          ${acesso.usuario?.email || ''} 
          ${acesso.systemInfo?.browser || ''} 
          ${acesso.systemInfo?.os || ''} 
          ${acesso.ipLocation?.city || ''}
          ${acesso.ipLocation?.country || ''}
        `.toLowerCase();
        
        if (!textoCompleto.includes(termo)) return false;
      }

      // Filtro de dispositivo
      if (filtroDispositivo !== 'all') {
        const tipo = acesso.systemInfo?.deviceType?.toLowerCase();
        if (tipo !== filtroDispositivo) return false;
      }

      // Filtro de navegador
      if (filtroNavegador !== 'all') {
        const browser = acesso.systemInfo?.browser?.toLowerCase();
        if (!browser?.includes(filtroNavegador.toLowerCase())) return false;
      }

      return true;
    });
  }, [acessos, filtroPesquisa, filtroDispositivo, filtroNavegador]);

  // Estatísticas agregadas
  const stats = useMemo(() => {
    const total = acessosFiltrados.length;
    const mobile = acessosFiltrados.filter(a => a.systemInfo?.isMobile).length;
    const desktop = total - mobile;
    
    const navegadores = {};
    const sistemas = {};
    const velocidades = [];
    const paises = {};
    
    acessosFiltrados.forEach(acesso => {
      // Navegadores
      const browser = acesso.systemInfo?.browser || 'Unknown';
      navegadores[browser] = (navegadores[browser] || 0) + 1;
      
      // Sistemas Operacionais
      const os = acesso.systemInfo?.os || 'Unknown';
      sistemas[os] = (sistemas[os] || 0) + 1;
      
      // Velocidades
      if (acesso.performance?.totalLoadTime) {
        velocidades.push(acesso.performance.totalLoadTime);
      }
      
      // Países
      const pais = acesso.ipLocation?.country || 'Unknown';
      paises[pais] = (paises[pais] || 0) + 1;
    });
    
    const velocidadeMedia = velocidades.length > 0
      ? Math.round(velocidades.reduce((a, b) => a + b, 0) / velocidades.length)
      : 0;

    return {
      total,
      mobile,
      desktop,
      mobilePercent: total > 0 ? Math.round((mobile / total) * 100) : 0,
      navegadores,
      sistemas,
      velocidadeMedia,
      paises
    };
  }, [acessosFiltrados]);

  // Ícone do navegador
  const getBrowserIcon = (browser) => {
    if (!browser) return <Chrome className="w-4 h-4" />;
    const b = browser.toLowerCase();
    if (b.includes('chrome')) return <Chrome className="w-4 h-4 text-yellow-500" />;
    if (b.includes('firefox')) return <Chrome className="w-4 h-4 text-orange-500" />;
    if (b.includes('safari')) return <Chrome className="w-4 h-4 text-blue-500" />;
    if (b.includes('edge')) return <Chrome className="w-4 h-4 text-blue-600" />;
    return <Chrome className="w-4 h-4" />;
  };

  // Ícone do dispositivo
  const getDeviceIcon = (deviceType) => {
    if (deviceType === 'Mobile') return <Smartphone className="w-4 h-4 text-blue-500" />;
    if (deviceType === 'Tablet') return <Smartphone className="w-4 h-4 text-purple-500" />;
    return <Monitor className="w-4 h-4 text-gray-600" />;
  };

  // Formatar velocidade de conexão
  const formatConnectionSpeed = (connection) => {
    if (!connection) return 'Unknown';
    const type = connection.type || 'Unknown';
    const downlink = connection.downlink || 'Unknown';
    return `${type} (${downlink})`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Activity className="w-8 h-8 text-blue-600" />
                Estatísticas de Acesso
              </h1>
              <p className="text-gray-600 mt-1">
                Monitoramento em tempo real • Versão do Sistema: <span className="font-mono text-blue-600">{APP_VERSION}</span>
              </p>
            </div>
            
            <button
              onClick={carregarAcessos}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
          </div>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          
          {/* Total de Acessos */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Acessos</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <Users className="w-12 h-12 text-blue-500 opacity-20" />
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm text-green-600">
              <TrendingUp className="w-4 h-4" />
              <span>Últimas {filtroTempo}</span>
            </div>
          </div>

          {/* Dispositivos Móveis */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Dispositivos Móveis</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.mobile}</p>
              </div>
              <Smartphone className="w-12 h-12 text-purple-500 opacity-20" />
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Mobile</span>
                <span className="font-semibold text-purple-600">{stats.mobilePercent}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${stats.mobilePercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Velocidade Média */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tempo de Carga</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {stats.velocidadeMedia}<span className="text-lg text-gray-500">ms</span>
                </p>
              </div>
              <Zap className="w-12 h-12 text-yellow-500 opacity-20" />
            </div>
            <div className="mt-4 flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-gray-600">Tempo médio de carregamento</span>
            </div>
          </div>

          {/* Países */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Países</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{Object.keys(stats.paises).length}</p>
              </div>
              <Globe className="w-12 h-12 text-green-500 opacity-20" />
            </div>
            <div className="mt-4 text-sm text-gray-600">
              {Object.entries(stats.paises).slice(0, 3).map(([pais, count], idx) => (
                <div key={idx} className="flex justify-between">
                  <span>{pais}</span>
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Filtro de Tempo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Período
              </label>
              <select
                value={filtroTempo}
                onChange={(e) => setFiltroTempo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="24h">Últimas 24 horas</option>
                <option value="7d">Últimos 7 dias</option>
                <option value="30d">Últimos 30 dias</option>
                <option value="all">Todos os registros</option>
              </select>
            </div>

            {/* Filtro de Pesquisa */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Search className="w-4 h-4" />
                Pesquisar
              </label>
              <input
                type="text"
                value={filtroPesquisa}
                onChange={(e) => setFiltroPesquisa(e.target.value)}
                placeholder="Nome, email, localização..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filtro de Dispositivo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Monitor className="w-4 h-4" />
                Dispositivo
              </label>
              <select
                value={filtroDispositivo}
                onChange={(e) => setFiltroDispositivo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos</option>
                <option value="desktop">Desktop</option>
                <option value="mobile">Mobile</option>
                <option value="tablet">Tablet</option>
              </select>
            </div>

            {/* Filtro de Navegador */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Chrome className="w-4 h-4" />
                Navegador
              </label>
              <select
                value={filtroNavegador}
                onChange={(e) => setFiltroNavegador(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Todos</option>
                <option value="chrome">Chrome</option>
                <option value="firefox">Firefox</option>
                <option value="safari">Safari</option>
                <option value="edge">Edge</option>
              </select>
            </div>

          </div>
        </div>

        {/* Tabela de Acessos */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-blue-600" />
              Detalhes dos Acessos ({acessosFiltrados.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Carregando dados...</p>
            </div>
          ) : acessosFiltrados.length === 0 ? (
            <div className="p-12 text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhum acesso encontrado com os filtros aplicados.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuário
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sistema / Navegador
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dispositivo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Conexão
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Localização
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Performance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data/Hora
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {acessosFiltrados.map((acesso) => (
                    <tr key={acesso.id} className="hover:bg-gray-50 transition-colors">
                      
                      {/* Usuário */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-semibold">
                              {acesso.usuario?.nome?.charAt(0) || 'U'}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {acesso.usuario?.nome || 'Anônimo'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {acesso.usuario?.email || 'Não identificado'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Sistema / Navegador */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getBrowserIcon(acesso.systemInfo?.browser)}
                          <div>
                            <div className="text-sm text-gray-900">
                              {acesso.systemInfo?.browser || 'Unknown'} {acesso.systemInfo?.browserVersion}
                            </div>
                            <div className="text-sm text-gray-500">
                              {acesso.systemInfo?.os || 'Unknown'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Dispositivo */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getDeviceIcon(acesso.systemInfo?.deviceType)}
                          <span className="text-sm text-gray-900">
                            {acesso.systemInfo?.deviceType || 'Unknown'}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {acesso.systemInfo?.screen?.width}x{acesso.systemInfo?.screen?.height}
                        </div>
                      </td>

                      {/* Conexão */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Wifi className="w-4 h-4 text-green-500" />
                          <div>
                            <div className="text-sm text-gray-900">
                              {acesso.systemInfo?.connection?.type || 'Unknown'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {acesso.systemInfo?.connection?.downlink}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Localização */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-red-500" />
                          <div>
                            <div className="text-sm text-gray-900">
                              {acesso.ipLocation?.city || 'Unknown'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {acesso.ipLocation?.country || 'Unknown'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Performance */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Zap className={`w-4 h-4 ${
                            acesso.performance?.totalLoadTime < 1000 ? 'text-green-500' :
                            acesso.performance?.totalLoadTime < 3000 ? 'text-yellow-500' :
                            'text-red-500'
                          }`} />
                          <span className="text-sm text-gray-900">
                            {acesso.performance?.totalLoadTime || 0}ms
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {acesso.version || 'Unknown'}
                        </div>
                      </td>

                      {/* Data/Hora */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="text-sm text-gray-900">
                              {acesso.timestamp.toLocaleDateString('pt-BR')}
                            </div>
                            <div className="text-xs text-gray-500">
                              {acesso.timestamp.toLocaleTimeString('pt-BR')}
                            </div>
                          </div>
                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default EstatisticasAcesso;
